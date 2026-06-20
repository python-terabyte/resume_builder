import ResumeShell from '@/components/ResumeShell'

export const metadata = {
  title: 'Resume Editor — BrandFox',
}

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ resumeId: string }>
}) {
  const { resumeId } = await params
  return <ResumeShell initialDocId={resumeId} />
}
