import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

export default function Academic({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)

  return (
    <div className="px-12 py-10 text-gray-900" style={{ fontFamily: "'Georgia', 'Cambria', serif" }}>
      <header className="text-center pb-3 border-b-2" style={{ borderColor: accentColor }}>
        <h1 className="text-3xl font-bold tracking-tight">
          {personal.firstName} {personal.lastName}
          {personal.jobTitle && <span className="text-base font-normal text-gray-700">, {personal.jobTitle}</span>}
        </h1>
        <div className="mt-1 text-xs text-gray-700 flex justify-center flex-wrap gap-x-3">
          {personal.location && <span>{personal.location}</span>}
          {personal.phone && <span>· {personal.phone}</span>}
          {personal.email && <span>· {personal.email}</span>}
          {personal.website && <span>· {personal.website}</span>}
          {personal.linkedin && <span>· {personal.linkedin}</span>}
        </div>
      </header>

      {order.map((type) => renderBlock(type, resume, accentColor))}
    </div>
  )
}

function renderBlock(type: SectionType, resume: ResumeData, accentColor: string) {
  const { personal } = resume
  const userTitle = sectionTitle(resume, type)

  switch (type) {
    case 'personal':
      return personal.summary ? (
        <Section key={type} title="Research Profile" accentColor={accentColor}>
          <p className="text-sm leading-relaxed text-gray-800 text-justify whitespace-pre-wrap">{personal.summary}</p>
        </Section>
      ) : null

    case 'education':
      return resume.education.length > 0 ? (
        <Section key={type} title={userTitle} accentColor={accentColor}>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{[edu.degree, edu.field].filter(Boolean).join(' in ')}</span>
                <span className="text-xs text-gray-600">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm italic">{edu.institution}{edu.location && <span className="not-italic text-gray-600"> · {edu.location}</span>}</div>
              {edu.gpa && <div className="text-xs text-gray-600">GPA: {edu.gpa}</div>}
              {edu.description && <div className="text-xs text-gray-700 italic mt-0.5 whitespace-pre-wrap">{edu.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <Section key={type} title="Academic & Professional Appointments" accentColor={accentColor}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm">{exp.position}</span>
                <span className="text-xs text-gray-600">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <div className="text-sm italic">{exp.company}{exp.location && <span className="not-italic text-gray-600"> · {exp.location}</span>}</div>
              {exp.description && <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed text-justify">{exp.description}</div>}
            </div>
          ))}
        </Section>
      ) : null

    case 'projects':
      return resume.projects.length > 0 ? (
        <Section key={type} title="Publications & Research" accentColor={accentColor}>
          <ol className="list-decimal list-outside pl-5 space-y-1.5 text-sm text-gray-800">
            {resume.projects.map((p) => (
              <li key={p.id}>
                <span className="font-semibold">{p.name}</span>
                {p.technologies && <span className="text-gray-700">. {p.technologies}</span>}
                {p.description && <span className="text-gray-700">. {p.description}</span>}
                {(p.startDate || p.endDate) && <span className="italic text-gray-600"> ({dateRange(p.startDate, p.endDate, false)})</span>}
                {p.url && <span className="text-xs ml-1" style={{ color: accentColor }}>{p.url}</span>}
              </li>
            ))}
          </ol>
        </Section>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <Section key={type} title="Honors & Certifications" accentColor={accentColor}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm flex justify-between">
              <span><span className="font-semibold">{c.name}</span>{c.issuer && <span className="italic text-gray-700">, {c.issuer}</span>}</span>
              {c.date && <span className="text-xs text-gray-600">{formatDate(c.date)}</span>}
            </div>
          ))}
        </Section>
      ) : null

    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <Section key={type} title="Areas of Expertise" accentColor={accentColor}>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="text-sm mb-1">
              {g.category && <span className="font-bold italic">{g.category}: </span>}
              <span className="text-gray-800">{g.skills.map((s) => s.name).join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <Section key={type} title={userTitle} accentColor={accentColor}>
          <div className="text-sm">{resume.languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join('; ')}</div>
        </Section>
      ) : null

    case 'interests':
      return resume.interests.length > 0 ? (
        <Section key={type} title={userTitle} accentColor={accentColor}>
          <div className="text-sm text-gray-800">{resume.interests.map((i) => i.name).join(', ')}</div>
        </Section>
      ) : null

    default:
      return null
  }
}

function Section({ title, children, accentColor }: { title: string; children: React.ReactNode; accentColor: string }) {
  return (
    <div className="mt-5" data-resume-section>
      <h2 className="text-sm font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ color: accentColor, borderColor: `${accentColor}66` }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
