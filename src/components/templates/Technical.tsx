import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

export default function Technical({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)

  return (
    <div className="px-10 py-8 text-gray-900" style={{ fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace" }}>
      <header className="flex items-baseline justify-between border-b-2 pb-2" style={{ borderColor: accentColor }}>
        <div>
          <h1 className="text-2xl font-bold">
            <span style={{ color: accentColor }}>$</span> {personal.firstName} {personal.lastName}
          </h1>
          {personal.jobTitle && <p className="text-sm text-gray-700">// {personal.jobTitle}</p>}
        </div>
        <div className="text-right text-xs text-gray-700 space-y-0.5">
          {personal.email && <div>{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.location && <div>{personal.location}</div>}
          {personal.linkedin && <div>{personal.linkedin}</div>}
          {personal.website && <div>{personal.website}</div>}
        </div>
      </header>

      {order.map((type) => renderBlock(type, resume, accentColor))}
    </div>
  )
}

function renderBlock(type: SectionType, resume: ResumeData, accentColor: string) {
  const { personal } = resume
  const title = sectionTitle(resume, type).toLowerCase()

  switch (type) {
    case 'personal':
      return personal.summary ? (
        <Section key={type} title="summary" accentColor={accentColor}>
          <p className="text-sm leading-relaxed text-gray-700">{personal.summary}</p>
        </Section>
      ) : null

    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {resume.skillGroups.map((g) => (
              <div key={g.id}>
                <span className="font-bold" style={{ color: accentColor }}>{g.category || 'misc'}:</span>{' '}
                <span className="text-gray-700">{g.skills.map((s) => s.name).join(', ')}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold">{exp.position}<span className="text-gray-500"> @ </span>{exp.company}</span>
                <span className="text-xs text-gray-600">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              {exp.location && <div className="text-xs text-gray-500">{exp.location}</div>}
              {exp.description && <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">{exp.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'projects':
      return resume.projects.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.projects.map((p) => (
            <div key={p.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">▸ {p.name}</span>
                <span className="text-xs text-gray-600">{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.url && <div className="text-xs" style={{ color: accentColor }}>↗ {p.url}</div>}
              {p.technologies && <div className="text-xs text-gray-500">stack: {p.technologies}</div>}
              {p.description && <div className="text-sm text-gray-700 mt-0.5">{p.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'education':
      return resume.education.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-1.5">
              <div className="flex justify-between items-baseline text-sm">
                <span><span className="font-bold">{edu.institution}</span><span className="text-gray-700"> — {[edu.degree, edu.field].filter(Boolean).join(', ')}</span></span>
                <span className="text-xs text-gray-600">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              {edu.gpa && <div className="text-xs text-gray-500">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm flex justify-between">
              <span>• <span className="font-semibold">{c.name}</span>{c.issuer && <span className="text-gray-600"> — {c.issuer}</span>}</span>
              {c.date && <span className="text-xs text-gray-600">{formatDate(c.date)}</span>}
            </div>
          ))}
        </Section>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          <div className="text-sm text-gray-700">{resume.languages.map((l) => `${l.language}${l.proficiency ? `(${l.proficiency})` : ''}`).join(' · ')}</div>
        </Section>
      ) : null

    case 'interests':
      return resume.interests.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          <div className="text-sm text-gray-700">{resume.interests.map((i) => i.name).join(' · ')}</div>
        </Section>
      ) : null

    default:
      return null
  }
}

function Section({ title, children, accentColor }: { title: string; children: React.ReactNode; accentColor: string }) {
  return (
    <div className="mt-5">
      <h2 className="text-xs font-bold mb-2" style={{ color: accentColor }}>
        # {title}
      </h2>
      {children}
    </div>
  )
}
