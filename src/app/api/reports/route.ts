import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import type { ReportData } from '@/types/report'

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
      report: data.report as ReportData,
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
    const ref = await reportsCol(session.user.id).add({
      name,
      report,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id })
  } catch (err) {
    console.error('[POST /api/reports]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to create report' }, { status: 500 })
  }
}
