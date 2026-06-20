import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Report Builder — BrandFox',
}

export default function ReportsPage() {
  redirect('/report')
}
