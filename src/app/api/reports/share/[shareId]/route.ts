import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params

  const doc = await adminDb().collection('sharedReports').doc(shareId).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = doc.data()!
  return NextResponse.json({
    reportName: data.reportName as string,
    reportData: (typeof data.reportData === 'string' ? JSON.parse(data.reportData) : data.reportData),
    createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shareId } = await params

  const doc = await adminDb().collection('sharedReports').doc(shareId).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = doc.data()!
  if (data.ownerUid !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await adminDb().collection('sharedReports').doc(shareId).delete()
  return NextResponse.json({ ok: true })
}
