import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { saveReportBlob } from '@/lib/report-storage'
import type { ReportData } from '@/types/report'

const MAX_REPORT_BYTES = 10 * 1024 * 1024 // 10 MB

function reportsCol(uid: string) {
  return adminDb().collection('users').doc(uid).collection('reports')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await reportsCol(session.user.id).orderBy('updatedAt', 'desc').get()
  const docs = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name as string,
      createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
      updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
    }
  })
  return NextResponse.json(docs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, report } = await req.json() as { name: string; report: ReportData }

    const byteSize = Buffer.byteLength(JSON.stringify(report), 'utf8')
    if (byteSize > MAX_REPORT_BYTES) {
      return NextResponse.json(
        { error: `Report exceeds 10 MB limit (${(byteSize / 1024 / 1024).toFixed(1)} MB). Try removing large embedded images.` },
        { status: 413 },
      )
    }

    const docRef = await reportsCol(session.user.id).add({
      name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    await saveReportBlob(docRef.collection('blob'), report)

    return NextResponse.json({ id: docRef.id })
  } catch (err) {
    console.error('[POST /api/reports]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to create report' }, { status: 500 })
  }
}
