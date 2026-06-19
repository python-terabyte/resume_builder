import type { ReportData } from '@/types/report'

export interface ReportDoc {
  id: string
  name: string
  createdAt: string | null
  updatedAt: string | null
}

export async function listReports(): Promise<ReportDoc[]> {
  const res = await fetch('/api/reports')
  if (!res.ok) throw new Error('Failed to load reports.')
  return res.json() as Promise<ReportDoc[]>
}

export async function getReport(id: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to load report.')
  }
  const data = await res.json() as { report: ReportData }
  return data.report
}

export async function createReport(name: string, report: ReportData): Promise<string> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, report }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to create report.')
  }
  const data = await res.json() as { id: string }
  return data.id
}

export async function saveReport(docId: string, name: string, report: ReportData): Promise<void> {
  const res = await fetch(`/api/reports/${docId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, report }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to save report.')
  }
}

export async function renameReport(docId: string, name: string): Promise<void> {
  const res = await fetch(`/api/reports/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to rename report.')
}

export async function deleteReport(docId: string): Promise<void> {
  const res = await fetch(`/api/reports/${docId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete report.')
}
