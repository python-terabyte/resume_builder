import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { saveReportBlob, loadReportBlob, deleteReportBlob } from '@/lib/report-storage'
import {
  getDocumentAccess,
  createCollabRecord,
  logActivity,
  createVersionSnapshot,
  collabDoc,
} from '@/lib/document-permissions'
import type { ReportData } from '@/types/report'

const MAX_REPORT_BYTES = 10 * 1024 * 1024 // 10 MB

function reportDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('reports').doc(id)
}

async function resolveReportAccess(id: string, sessionUid: string) {
  const ownDoc = await reportDoc(sessionUid, id).get()
  if (ownDoc.exists) {
    return { ownerUid: sessionUid, doc: ownDoc, role: 'owner' as const, canEdit: true, canDelete: true }
  }

  const access = await getDocumentAccess(id, sessionUid)
  if (!access || !access.canView) return null

  const sharedDoc = await reportDoc(access.ownerUid, id).get()
  if (!sharedDoc.exists) return null

  return { ownerUid: access.ownerUid, doc: sharedDoc, role: access.role, canEdit: access.canEdit, canDelete: access.canDelete }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params
    const resolved = await resolveReportAccess(id, session.user.id)
    if (!resolved) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = resolved.doc.data()!

    let report = await loadReportBlob(resolved.doc.ref.collection('blob'))
    if (!report && data.report) {
      report = (typeof data.report === 'string' ? JSON.parse(data.report) : data.report) as ReportData
    }
    if (!report) return NextResponse.json({ error: 'Report data not found' }, { status: 404 })

    return NextResponse.json({
      id: resolved.doc.id,
      name: data.name as string,
      report,
      createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
      updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
      ownerUid: resolved.ownerUid,
      myRole: resolved.role,
      canEdit: resolved.canEdit,
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

    let ownerUid = session.user.id
    const ownDoc = await reportDoc(session.user.id, id).get()

    if (!ownDoc.exists) {
      const access = await getDocumentAccess(id, session.user.id)
      if (!access || !access.canEdit) {
        return NextResponse.json({ error: access ? 'Forbidden' : 'Not found' }, { status: access ? 403 : 404 })
      }
      ownerUid = access.ownerUid
    } else {
      // Lazily create collab record for legacy documents
      const collabSnap = await collabDoc(id).get()
      if (!collabSnap.exists) {
        createCollabRecord(id, 'report', session.user.id, session.user.email ?? '', session.user.name ?? '', name)
          .catch(() => {})
      } else {
        collabDoc(id).update({ name, updatedAt: FieldValue.serverTimestamp() }).catch(() => {})
      }
    }

    const docRef = reportDoc(ownerUid, id)
    await Promise.all([
      saveReportBlob(docRef.collection('blob'), report),
      docRef.update({
        name,
        report: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ])

    // Version snapshot (non-blocking)
    createVersionSnapshot(id, 'report', session.user.id, session.user.email ?? '', report)
      .catch(() => {})

    logActivity(id, session.user.id, session.user.email ?? '', 'edited', {}).catch(() => {})

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

  let ownerUid = session.user.id
  const ownDoc = await reportDoc(session.user.id, id).get()

  if (!ownDoc.exists) {
    const access = await getDocumentAccess(id, session.user.id)
    if (!access || !access.canEdit) {
      return NextResponse.json({ error: access ? 'Forbidden' : 'Not found' }, { status: access ? 403 : 404 })
    }
    ownerUid = access.ownerUid
  }

  await reportDoc(ownerUid, id).update({ name, updatedAt: FieldValue.serverTimestamp() })
  collabDoc(id).update({ name, updatedAt: FieldValue.serverTimestamp() }).catch(() => {})

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params
    const ownDoc = await reportDoc(session.user.id, id).get()

    if (!ownDoc.exists) {
      const access = await getDocumentAccess(id, session.user.id)
      if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!access.canDelete) return NextResponse.json({ error: 'Only the owner can delete this document' }, { status: 403 })
      return NextResponse.json({ error: 'Not found in your account' }, { status: 404 })
    }

    const docRef = reportDoc(session.user.id, id)
    await deleteReportBlob(docRef.collection('blob'))
    await docRef.delete()

    logActivity(id, session.user.id, session.user.email ?? '', 'deleted', {}).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/reports/:id]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to delete report' }, { status: 500 })
  }
}
