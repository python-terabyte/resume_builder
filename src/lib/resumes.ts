import type { ResumeData } from '@/types/resume'

export interface ResumeDoc {
  id: string
  name: string
  resume: ResumeData
  createdAt: string | null
  updatedAt: string | null
}

export async function listResumes(): Promise<ResumeDoc[]> {
  const res = await fetch('/api/resumes')
  if (!res.ok) throw new Error('Failed to load resumes.')
  return res.json() as Promise<ResumeDoc[]>
}

export async function createResume(name: string, resume: ResumeData): Promise<string> {
  const res = await fetch('/api/resumes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, resume }),
  })
  if (!res.ok) throw new Error('Failed to create resume.')
  const data = await res.json() as { id: string }
  return data.id
}

export async function saveResume(docId: string, name: string, resume: ResumeData): Promise<void> {
  const res = await fetch(`/api/resumes/${docId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, resume }),
  })
  if (!res.ok) throw new Error('Failed to save resume.')
}

export async function renameResume(docId: string, name: string): Promise<void> {
  const res = await fetch(`/api/resumes/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to rename resume.')
}

export async function deleteResume(docId: string): Promise<void> {
  const res = await fetch(`/api/resumes/${docId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete resume.')
}
