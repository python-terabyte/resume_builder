import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import type { ReportData } from '@/types/report'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reportName, reportData } = await req.json() as { reportName: string; reportData: ReportData }

  if (!reportData) return NextResponse.json({ error: 'Missing report data' }, { status: 400 })

  const shareId = uuidv4()

  await adminDb().collection('sharedReports').doc(shareId).set({
    reportName: reportName || 'Untitled Report',
    reportData,
    ownerUid: session.user.id,
    createdAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ shareId })
}
