import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { saveReportBlob } from '@/lib/report-storage'
import { v4 as uuidv4 } from 'uuid'
import type { ReportData } from '@/types/report'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reportName, reportData } = await req.json() as { reportName: string; reportData: ReportData }
    if (!reportData) return NextResponse.json({ error: 'Missing report data' }, { status: 400 })

    const shareId = uuidv4()
    const shareDocRef = adminDb().collection('sharedReports').doc(shareId)

    await shareDocRef.set({
      reportName: reportName || 'Untitled Report',
      ownerUid: session.user.id,
      createdAt: FieldValue.serverTimestamp(),
    })

    await saveReportBlob(shareDocRef.collection('blob'), reportData)

    return NextResponse.json({ shareId })
  } catch (err) {
    console.error('[POST /api/reports/share]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to share report' }, { status: 500 })
  }
}
