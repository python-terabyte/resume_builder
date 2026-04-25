import { ResumeData } from '@/types/resume'

export interface TemplateProps {
  resume: ResumeData
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month] = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(month) - 1]} ${year}`
}

export function dateRange(start: string, end: string, current: boolean): string {
  if (!start && !end) return ''
  const s = formatDate(start)
  const e = current ? 'Present' : formatDate(end)
  if (!s && !e) return ''
  return `${s}${s || e ? ' – ' : ''}${e}`
}

export function visibleSectionTypes(resume: ResumeData) {
  return resume.sections.filter((s) => s.visible).map((s) => s.type)
}

export function sectionTitle(resume: ResumeData, type: string): string {
  return resume.sections.find((s) => s.type === type)?.title ?? type
}

export function isSectionVisible(resume: ResumeData, type: string): boolean {
  return resume.sections.find((s) => s.type === type)?.visible ?? false
}

export function hasContact(resume: ResumeData): boolean {
  const p = resume.personal
  return Boolean(p.email || p.phone || p.location || p.website || p.linkedin)
}
