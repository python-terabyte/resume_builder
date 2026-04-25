import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

const SIDEBAR_TYPES: SectionType[] = ['skills', 'languages', 'interests']
const MAIN_TYPES: SectionType[] = ['personal', 'experience', 'projects', 'education', 'certifications']

export default function Creative({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)
  const sidebarOrder = order.filter((t) => SIDEBAR_TYPES.includes(t))
  const mainOrder = order.filter((t) => MAIN_TYPES.includes(t))

  return (
    <div className="grid grid-cols-3 text-gray-900" style={{ minHeight: '297mm' }}>
      <aside
        className="col-span-1 px-6 py-8 text-white"
        style={{ backgroundColor: accentColor, minHeight: '297mm' }}
      >
        {personal.photo && (
          <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white/30">
            <img src={personal.photo} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl font-extrabold leading-tight">
          {personal.firstName}<br />{personal.lastName}
        </h1>
        {personal.jobTitle && <p className="mt-2 text-sm font-light opacity-90">{personal.jobTitle}</p>}

        <div className="mt-6 text-xs space-y-1.5 opacity-95">
          {personal.email && <div className="break-words">{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.location && <div>{personal.location}</div>}
          {personal.linkedin && <div className="break-words">{personal.linkedin}</div>}
          {personal.website && <div className="break-words">{personal.website}</div>}
        </div>

        {sidebarOrder.map((type) => renderSidebarBlock(type, resume))}
      </aside>

      <main className="col-span-2 px-8 py-8 space-y-5">
        {mainOrder.map((type) => renderMainBlock(type, resume, accentColor))}
      </main>
    </div>
  )
}

function renderSidebarBlock(type: SectionType, resume: ResumeData) {
  const title = sectionTitle(resume, type)

  switch (type) {
    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <div key={type}>
          <SideHeader>{title}</SideHeader>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="mb-3 text-xs">
              {g.category && <div className="font-bold uppercase tracking-wide opacity-90 mb-1">{g.category}</div>}
              {g.skills.map((s) => (
                <div key={s.id} className="mb-1.5">
                  <div className="flex justify-between"><span>{s.name}</span><span className="opacity-70">{s.level}%</span></div>
                  <div className="h-1 rounded bg-white/25"><div className="h-full rounded bg-white" style={{ width: `${s.level}%` }} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <div key={type}>
          <SideHeader>{title}</SideHeader>
          <div className="text-xs space-y-1">
            {resume.languages.map((l) => (
              <div key={l.id} className="flex justify-between">
                <span className="font-semibold">{l.language}</span>
                {l.proficiency && <span className="opacity-80">{l.proficiency}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : null

    case 'interests':
      return resume.interests.length > 0 ? (
        <div key={type}>
          <SideHeader>{title}</SideHeader>
          <div className="text-xs flex flex-wrap gap-1.5">
            {resume.interests.map((i) => (
              <span key={i.id} className="rounded-full border border-white/40 px-2 py-0.5">{i.name}</span>
            ))}
          </div>
        </div>
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
        <MainBlock key={type} title="About" accentColor={accentColor}>
          <p className="text-sm leading-relaxed text-gray-700">{personal.summary}</p>
        </MainBlock>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <MainBlock key={type} title={title} accentColor={accentColor}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3 pl-4 border-l-2" style={{ borderColor: `${accentColor}40` }}>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{exp.position}</span>
                <span className="text-xs text-gray-500">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <div className="text-sm" style={{ color: accentColor }}>
                {exp.company}{exp.location && <span className="text-gray-500"> · {exp.location}</span>}
              </div>
              {exp.description && <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">{exp.description}</div>}
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
                <span className="text-xs text-gray-500">{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.url && <div className="text-xs" style={{ color: accentColor }}>{p.url}</div>}
              {p.technologies && <div className="text-xs text-gray-500">{p.technologies}</div>}
              {p.description && <div className="text-sm text-gray-700">{p.description}</div>}
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
                <span className="text-xs text-gray-500">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm text-gray-700">
                {[edu.degree, edu.field].filter(Boolean).join(', ')}
                {edu.gpa && <span className="text-gray-500"> · GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </MainBlock>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <MainBlock key={type} title={title} accentColor={accentColor}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm flex justify-between mb-0.5">
              <span><span className="font-semibold">{c.name}</span>{c.issuer && <span className="text-gray-600"> — {c.issuer}</span>}</span>
              {c.date && <span className="text-xs text-gray-500">{formatDate(c.date)}</span>}
            </div>
          ))}
        </MainBlock>
      ) : null

    default:
      return null
  }
}

function SideHeader({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest border-b border-white/40 pb-1">{children}</h3>
}

function MainBlock({ title, accentColor, children }: { title: string; accentColor: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>{title}</h2>
      {children}
    </div>
  )
}
