import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

const SIDEBAR_TYPES: SectionType[] = ['skills', 'languages', 'certifications', 'interests']
const MAIN_TYPES: SectionType[] = ['personal', 'experience', 'education', 'projects']

export default function Professional({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)
  const sidebarOrder = order.filter((t) => SIDEBAR_TYPES.includes(t))
  const mainOrder = order.filter((t) => MAIN_TYPES.includes(t))

  return (
    <div className="px-10 py-8 text-gray-900">
      <header className="border-b-4 pb-4" style={{ borderColor: accentColor }}>
        <h1 className="text-3xl font-bold tracking-tight">
          {personal.firstName} <span style={{ color: accentColor }}>{personal.lastName}</span>
        </h1>
        {personal.jobTitle && <p className="text-base font-light tracking-wide mt-1 text-gray-700">{personal.jobTitle}</p>}
      </header>

      <div className="mt-5 grid grid-cols-3 gap-6">
        <aside className="col-span-1 space-y-4 text-xs">
          <SideBlock title="Contact" accentColor={accentColor}>
            {personal.email && <div className="break-words">{personal.email}</div>}
            {personal.phone && <div>{personal.phone}</div>}
            {personal.location && <div>{personal.location}</div>}
            {personal.linkedin && <div className="break-words">{personal.linkedin}</div>}
            {personal.website && <div className="break-words">{personal.website}</div>}
          </SideBlock>

          {sidebarOrder.map((type) => renderSidebarBlock(type, resume, accentColor))}
        </aside>

        <main className="col-span-2 space-y-5">
          {mainOrder.map((type) => renderMainBlock(type, resume, accentColor))}
        </main>
      </div>
    </div>
  )
}

function renderSidebarBlock(type: SectionType, resume: ResumeData, accentColor: string) {
  const title = sectionTitle(resume, type)

  switch (type) {
    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <SideBlock key={type} title={title} accentColor={accentColor}>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="mb-2">
              {g.category && <div className="font-semibold mb-0.5">{g.category}</div>}
              <ul className="list-disc list-inside text-gray-700">
                {g.skills.map((s) => <li key={s.id}>{s.name}</li>)}
              </ul>
            </div>
          ))}
        </SideBlock>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <SideBlock key={type} title={title} accentColor={accentColor}>
          {resume.languages.map((l) => (
            <div key={l.id}>
              <span className="font-semibold">{l.language}</span>
              {l.proficiency && <span className="text-gray-600"> · {l.proficiency}</span>}
            </div>
          ))}
        </SideBlock>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <SideBlock key={type} title={title} accentColor={accentColor}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="mb-1">
              <div className="font-semibold">{c.name}</div>
              {c.issuer && <div className="text-gray-600">{c.issuer}</div>}
              {c.date && <div className="text-gray-500">{formatDate(c.date)}</div>}
            </div>
          ))}
        </SideBlock>
      ) : null

    case 'interests':
      return resume.interests.length > 0 ? (
        <SideBlock key={type} title={title} accentColor={accentColor}>
          <div>{resume.interests.map((i) => i.name).join(', ')}</div>
        </SideBlock>
      ) : null

    default:
      return null
  }
}

function renderMainBlock(type: SectionType, resume: ResumeData, accentColor: string) {
  const { personal } = resume
  const title = sectionTitle(resume, type)

  switch (type) {
    case 'personal':
      return personal.summary ? (
        <MainBlock key={type} title="Profile" accentColor={accentColor}>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{personal.summary}</p>
        </MainBlock>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <MainBlock key={type} title={title} accentColor={accentColor}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{exp.position}</span>
                <span className="text-xs text-gray-600">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <div className="text-sm italic" style={{ color: accentColor }}>
                {exp.company}{exp.location && <span className="text-gray-500 not-italic"> · {exp.location}</span>}
              </div>
              {exp.description && <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{exp.description}</div>}
            </div>
          ))}
        </MainBlock>
      ) : null

    case 'education':
      return resume.education.length > 0 ? (
        <MainBlock key={type} title={title} accentColor={accentColor}>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{edu.institution}</span>
                <span className="text-xs text-gray-600">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm text-gray-700">
                {[edu.degree, edu.field].filter(Boolean).join(', ')}
                {edu.gpa && <span className="text-gray-500"> · GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </MainBlock>
      ) : null

    case 'projects':
      return resume.projects.length > 0 ? (
        <MainBlock key={type} title={title} accentColor={accentColor}>
          {resume.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{p.name}</span>
                <span className="text-xs text-gray-600">{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.technologies && <div className="text-xs text-gray-600">{p.technologies}</div>}
              {p.description && <div className="text-sm text-gray-700 whitespace-pre-wrap">{p.description}</div>}
            </div>
          ))}
        </MainBlock>
      ) : null

    default:
      return null
  }
}

function SideBlock({ title, accentColor, children }: { title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest pb-1 mb-2 border-b" style={{ color: accentColor, borderColor: accentColor }}>{title}</h3>
      <div className="space-y-1 text-gray-700">{children}</div>
    </div>
  )
}

function MainBlock({ title, accentColor, children }: { title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div data-resume-section>
      <h2 className="text-sm font-bold uppercase tracking-widest pb-1 mb-2 border-b" style={{ color: accentColor, borderColor: `${accentColor}66` }}>{title}</h2>
      {children}
    </div>
  )
}
