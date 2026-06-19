import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { loadReportBlob, deleteReportBlob } from '@/lib/report-storage'
import type { ReportData } from '@/types/report'

export async function GET(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params

  try {
    const shareDocRef = adminDb().collection('sharedReports').doc(shareId)
    const doc = await shareDocRef.get()
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = doc.data()!

    // Try subcollection chunks first (new format)
    let reportData = await loadReportBlob(shareDocRef.collection('blob'))

    // Fall back to legacy inline field
    if (!reportData && data.reportData) {
      reportData = (typeof data.reportData === 'string' ? JSON.parse(data.reportData) : data.reportData) as ReportData
    }

    if (!reportData) return NextResponse.json({ error: 'Report data not found' }, { status: 404 })

    return NextResponse.json({
      reportName: data.reportName as string,
      reportData,
      createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
    })
  } catch (err) {
    console.error('[GET /api/reports/share/:shareId]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to load shared report' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { shareId } = await params
  const shareDocRef = adminDb().collection('sharedReports').doc(shareId)

  const doc = await shareDocRef.get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = doc.data()!
  if (data.ownerUid !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteReportBlob(shareDocRef.collection('blob'))
  await shareDocRef.delete()

  return NextResponse.json({ ok: true })
}
