import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { saveReportBlob, loadReportBlob, deleteReportBlob } from '@/lib/report-storage'
import type { ReportData } from '@/types/report'

const MAX_REPORT_BYTES = 10 * 1024 * 1024 // 10 MB

function reportDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('reports').doc(id)
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params
    const docRef = reportDoc(session.user.id, id)
    const doc = await docRef.get()
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = doc.data()!

    // Try subcollection chunks first (new format)
    let report = await loadReportBlob(docRef.collection('blob'))

    // Fall back to legacy Firestore inline field
    if (!report && data.report) {
      report = (typeof data.report === 'string' ? JSON.parse(data.report) : data.report) as ReportData
    }

    if (!report) return NextResponse.json({ error: 'Report data not found' }, { status: 404 })

    return NextResponse.json({
      id: doc.id,
      name: data.name as string,
      report,
      createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
      updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
    })
  } catch (err) {
    console.error('[GET /api/reports/:id]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to load report' }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params
    const { name, report } = await req.json() as { name: string; report: ReportData }

    const byteSize = Buffer.byteLength(JSON.stringify(report), 'utf8')
    if (byteSize > MAX_REPORT_BYTES) {
      return NextResponse.json(
        { error: `Report exceeds 10 MB limit (${(byteSize / 1024 / 1024).toFixed(1)} MB). Try removing large embedded images.` },
        { status: 413 },
      )
    }

    const docRef = reportDoc(session.user.id, id)

    // Write chunks and update metadata in parallel
    await Promise.all([
      saveReportBlob(docRef.collection('blob'), report),
      docRef.update({
        name,
        report: FieldValue.delete(), // clean up any legacy inline field
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/reports/:id]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to save report' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { name } = await req.json() as { name: string }
  await reportDoc(session.user.id, id).update({ name, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params
    const docRef = reportDoc(session.user.id, id)

    // Delete subcollection chunks, then the parent doc
    await deleteReportBlob(docRef.collection('blob'))
    await docRef.delete()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/reports/:id]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to delete report' }, { status: 500 })
  }
}
