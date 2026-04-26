import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, sectionTitle, visibleSectionTypes } from './shared'

export default function AtsClassic({ resume }: TemplateProps) {
  const { personal } = resume
  const order = visibleSectionTypes(resume)

  return (
    <div className="px-12 py-10 text-black" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          {personal.firstName} {personal.lastName}
        </h1>
        {personal.jobTitle && <p className="text-sm mt-0.5">{personal.jobTitle}</p>}
        <div className="mt-1 text-xs">
          {[personal.location, personal.phone, personal.email, personal.linkedin, personal.website]
            .filter(Boolean)
            .join(' | ')}
        </div>
      </div>

      <div className="mt-5 border-t border-black" />

      {order.map((type) => renderBlock(type, resume))}
    </div>
  )
}

function renderBlock(type: SectionType, resume: ResumeData) {
  const { personal } = resume
  const title = sectionTitle(resume, type)

  switch (type) {
    case 'personal':
      return personal.summary ? (
        <Block key={type} title="Professional Summary">
          <p className="text-sm leading-snug whitespace-pre-wrap">{personal.summary}</p>
        </Block>
      ) : null

    case 'experience':
      return resume.experience.length > 0 ? (
        <Block key={type} title={title}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{exp.position}{exp.company ? `, ${exp.company}` : ''}</span>
                <span>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              {exp.location && <div className="text-xs italic">{exp.location}</div>}
              {exp.description && <div className="mt-1 text-sm whitespace-pre-wrap">{exp.description}</div>}
            </div>
          ))}
        </Block>
      ) : null

    case 'education':
      return resume.education.length > 0 ? (
        <Block key={type} title={title}>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{edu.institution}</span>
                <span>{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm">
                {[edu.degree, edu.field].filter(Boolean).join(', ')}
                {edu.location && <span>, {edu.location}</span>}
                {edu.gpa && <span> · GPA: {edu.gpa}</span>}
              </div>
              {edu.description && <div className="text-xs italic whitespace-pre-wrap">{edu.description}</div>}
            </div>
          ))}
        </Block>
      ) : null

    case 'skills':
      return resume.skillGroups.length > 0 ? (
        <Block key={type} title={title}>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="text-sm">
              {g.category && <span className="font-bold">{g.category}: </span>}
              {g.skills.map((s) => s.name).join(', ')}
            </div>
          ))}
        </Block>
      ) : null

    case 'projects':
      return resume.projects.length > 0 ? (
        <Block key={type} title={title}>
          {resume.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{p.name}{p.url ? ` (${p.url})` : ''}</span>
                <span>{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.technologies && <div className="text-xs italic">{p.technologies}</div>}
              {p.description && <div className="text-sm whitespace-pre-wrap">{p.description}</div>}
            </div>
          ))}
        </Block>
      ) : null

    case 'certifications':
      return resume.certifications.length > 0 ? (
        <Block key={type} title={title}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-bold">{c.name}</span>
              {c.issuer && <span>, {c.issuer}</span>}
              {c.date && <span> ({formatDate(c.date)})</span>}
            </div>
          ))}
        </Block>
      ) : null

    case 'languages':
      return resume.languages.length > 0 ? (
        <Block key={type} title={title}>
          <div className="text-sm">
            {resume.languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
          </div>
        </Block>
      ) : null

    case 'interests':
      return resume.interests.length > 0 ? (
        <Block key={type} title={title}>
          <div className="text-sm">{resume.interests.map((i) => i.name).join(', ')}</div>
        </Block>
      ) : null

    default:
      return null
  }
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4" data-resume-section>
      <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">{title}</h2>
      {children}
    </div>
  )
}
