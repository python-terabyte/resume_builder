import type { Metadata } from 'next'
import ReportShell from '@/components/ReportShell'

export const metadata: Metadata = {
  title: 'Report Builder',
  description: 'Create professional reports, financial statements, and presentations.',
}

export default function ReportPage() {
  return <ReportShell />
}
