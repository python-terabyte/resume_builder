import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

export default function AtsMinimal({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)

  return (
    <div className="px-12 py-10 text-gray-900">
      <h1 className="text-3xl font-semibold tracking-tight">
        {personal.firstName} {personal.lastName}
      </h1>
      {personal.jobTitle && (
        <p className="text-base font-medium mt-0.5" style={{ color: accentColor }}>
          {personal.jobTitle}
        </p>
      )}
      <div className="mt-2 text-xs text-gray-700 flex flex-wrap gap-x-3 gap-y-0.5">
        {personal.email && <span>{personal.email}</span>}
        {personal.phone && <span>· {personal.phone}</span>}
        {personal.location && <span>· {personal.location}</span>}
        {personal.linkedin && <span>· {personal.linkedin}</span>}
        {personal.website && <span>· {personal.website}</span>}
      </div>

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
        <Section key={type} title="Summary" accentColor={accentColor}>
          <p className="text-sm leading-relaxed">{personal.summary}</p>
        </Section>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-sm">{exp.position}</span>
                <span className="text-xs text-gray-600">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <div className="text-sm text-gray-700">
                {exp.company}
                {exp.location && <span className="text-gray-500"> · {exp.location}</span>}
              </div>
              {exp.description && <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">{exp.description}</div>}
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
                <span className="font-semibold text-sm">{edu.institution}</span>
                <span className="text-xs text-gray-600">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm text-gray-700">
                {[edu.degree, edu.field].filter(Boolean).join(', ')}
                {edu.gpa && <span className="text-gray-500"> · GPA: {edu.gpa}</span>}
              </div>
              {edu.description && <div className="text-xs text-gray-600">{edu.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="text-sm mb-1">
              {g.category && <span className="font-semibold">{g.category}: </span>}
              <span className="text-gray-700">{g.skills.map((s) => s.name).join(', ')}</span>
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
                <span className="font-semibold text-sm">{p.name}</span>
                <span className="text-xs text-gray-600">{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.url && <div className="text-xs" style={{ color: accentColor }}>{p.url}</div>}
              {p.technologies && <div className="text-xs text-gray-600">{p.technologies}</div>}
              {p.description && <div className="text-sm text-gray-700">{p.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm flex justify-between">
              <span><span className="font-semibold">{c.name}</span>{c.issuer && <span className="text-gray-700"> — {c.issuer}</span>}</span>
              {c.date && <span className="text-xs text-gray-600">{formatDate(c.date)}</span>}
            </div>
          ))}
        </Section>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          <div className="text-sm text-gray-700">
            {resume.languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
          </div>
        </Section>
      ) : null

    case 'interests':
      return resume.interests.length > 0 ? (
        <Section key={type} title={title} accentColor={accentColor}>
          <div className="text-sm text-gray-700">{resume.interests.map((i) => i.name).join(', ')}</div>
        </Section>
      ) : null

    default:
      return null
  }
}

function Section({ title, children, accentColor }: { title: string; children: React.ReactNode; accentColor: string }) {
  return (
    <div className="mt-5">
      <h2 className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b-2" style={{ borderColor: accentColor, color: accentColor }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
