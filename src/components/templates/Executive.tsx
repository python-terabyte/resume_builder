import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

export default function Executive({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)

  return (
    <div className="px-12 py-10 text-gray-900">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-wide" style={{ letterSpacing: '0.08em' }}>
          {personal.firstName.toUpperCase()} {personal.lastName.toUpperCase()}
        </h1>
        <div className="mx-auto mt-2 h-px w-24" style={{ backgroundColor: accentColor }} />
        {personal.jobTitle && (
          <p className="mt-2 text-sm uppercase tracking-[0.3em]" style={{ color: accentColor }}>
            {personal.jobTitle}
          </p>
        )}
        <div className="mt-3 text-xs text-gray-700 flex justify-center flex-wrap gap-x-3">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>· {personal.phone}</span>}
          {personal.location && <span>· {personal.location}</span>}
          {personal.linkedin && <span>· {personal.linkedin}</span>}
        </div>
      </header>

      {order.map((type) => renderBlock(type, resume, accentColor))}
    </div>
  )
}

function renderBlock(type: SectionType, resume: ResumeData, accentColor: string) {
  const { personal } = resume
  const title = sectionTitle(resume, type)

  switch (type) {
    case 'personal':
      return personal.summary ? (
        <div key={type} className="mt-6 italic text-center text-sm leading-relaxed text-gray-700 max-w-2xl mx-auto">
          “{personal.summary}”
        </div>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold">{exp.position}</span>
                <span className="text-xs text-gray-600 italic">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <div className="text-sm italic" style={{ color: accentColor }}>
                {exp.company}{exp.location && <span className="text-gray-600 not-italic"> · {exp.location}</span>}
              </div>
              {exp.description && <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{exp.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'education':
      return resume.education.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{edu.institution}</span>
                <span className="text-xs text-gray-600 italic">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm italic">{[edu.degree, edu.field].filter(Boolean).join(', ')}</div>
              {edu.gpa && <div className="text-xs text-gray-500">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="text-sm mb-1">
              {g.category && <span className="font-bold uppercase tracking-wider text-xs" style={{ color: accentColor }}>{g.category} </span>}
              <span className="text-gray-700">{g.skills.map((s) => s.name).join(' · ')}</span>
            </div>
          ))}
        </Section>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm flex justify-between">
              <span><span className="font-bold">{c.name}</span>{c.issuer && <span className="italic text-gray-700">, {c.issuer}</span>}</span>
              {c.date && <span className="text-xs text-gray-600">{formatDate(c.date)}</span>}
            </div>
          ))}
        </Section>
      ) : null

    case 'projects':
      return resume.projects.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{p.name}</span>
                <span className="text-xs text-gray-600 italic">{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.description && <div className="text-sm text-gray-700 whitespace-pre-wrap">{p.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          <div className="text-sm text-gray-700">{resume.languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(' · ')}</div>
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
    <div className="mt-6" data-resume-section>
      <h2 className="text-center text-xs font-bold uppercase tracking-[0.4em] pb-2 mb-3 border-b" style={{ color: accentColor, borderColor: `${accentColor}55` }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
