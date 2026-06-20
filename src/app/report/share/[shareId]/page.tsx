import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import { loadReportBlob } from '@/lib/report-storage'
import SharedReportView from '@/components/SharedReportView'
import type { ReportData } from '@/types/report'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ shareId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params
  try {
    const doc = await adminDb().collection('sharedReports').doc(shareId).get()
    if (!doc.exists) return { title: 'Report Not Found' }
    const name = doc.data()?.reportName as string
    return { title: `${name} — BrandFox`, description: 'View this report created with BrandFox' }
  } catch {
    return { title: 'BrandFox Report' }
  }
}

export default async function SharePage({ params }: Props) {
  const { shareId } = await params

  let reportName: string
  let reportData: ReportData

  try {
    const shareDocRef = adminDb().collection('sharedReports').doc(shareId)
    const doc = await shareDocRef.get()
    if (!doc.exists) notFound()
    const data = doc.data()!

    reportName = data.reportName as string

    // Try subcollection blob first (current storage format)
    let loaded = await loadReportBlob(shareDocRef.collection('blob'))

    // Fall back to legacy inline field
    if (!loaded && data.reportData) {
      loaded = (typeof data.reportData === 'string'
        ? JSON.parse(data.reportData)
        : data.reportData) as ReportData
    }

    if (!loaded) notFound()
    reportData = loaded
  } catch {
    notFound()
  }

  return (
    <SharedReportView
      report={reportData!}
      reportName={reportName!}
      shareId={shareId}
    />
  )
}
