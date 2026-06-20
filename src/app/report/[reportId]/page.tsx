import ReportShell from '@/components/ReportShell'

export const metadata = {
  title: 'Report Editor — BrandFox',
}

export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}) {
  const { reportId } = await params
  return <ReportShell initialDocId={reportId} />
}
