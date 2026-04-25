import { TemplateProps, dateRange, formatDate, isSectionVisible, sectionTitle, visibleSectionTypes } from './shared'

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

      {order.includes('personal') && personal.summary && (
        <Block title="Professional Summary">
          <p className="text-sm leading-snug">{personal.summary}</p>
        </Block>
      )}

      {order.includes('experience') && resume.experience.length > 0 && isSectionVisible(resume, 'experience') && (
        <Block title={sectionTitle(resume, 'experience')}>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{exp.position}{exp.company ? `, ${exp.company}` : ''}</span>
                <span>{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              {exp.location && <div className="text-xs italic">{exp.location}</div>}
              {exp.description && <div className="mt-1 text-sm whitespace-pre-line">{exp.description}</div>}
            </div>
          ))}
        </Block>
      )}

      {order.includes('education') && resume.education.length > 0 && (
        <Block title={sectionTitle(resume, 'education')}>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{edu.institution}</span>
                <span>{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
              </div>
              <div className="text-sm">
                {[edu.degree, edu.field].filter(Boolean).join(', ')}
                {edu.location && <span> — {edu.location}</span>}
                {edu.gpa && <span> · GPA: {edu.gpa}</span>}
              </div>
              {edu.description && <div className="text-xs italic">{edu.description}</div>}
            </div>
          ))}
        </Block>
      )}

      {order.includes('skills') && resume.skillGroups.length > 0 && (
        <Block title={sectionTitle(resume, 'skills')}>
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="text-sm">
              {g.category && <span className="font-bold">{g.category}: </span>}
              {g.skills.map((s) => s.name).join(', ')}
            </div>
          ))}
        </Block>
      )}

      {order.includes('projects') && resume.projects.length > 0 && (
        <Block title={sectionTitle(resume, 'projects')}>
          {resume.projects.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{p.name}{p.url ? ` (${p.url})` : ''}</span>
                <span>{dateRange(p.startDate, p.endDate, false)}</span>
              </div>
              {p.technologies && <div className="text-xs italic">{p.technologies}</div>}
              {p.description && <div className="text-sm">{p.description}</div>}
            </div>
          ))}
        </Block>
      )}

      {order.includes('certifications') && resume.certifications.length > 0 && (
        <Block title={sectionTitle(resume, 'certifications')}>
          {resume.certifications.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-bold">{c.name}</span>
              {c.issuer && <span> — {c.issuer}</span>}
              {c.date && <span> ({formatDate(c.date)})</span>}
            </div>
          ))}
        </Block>
      )}

      {order.includes('languages') && resume.languages.length > 0 && (
        <Block title={sectionTitle(resume, 'languages')}>
          <div className="text-sm">
            {resume.languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
          </div>
        </Block>
      )}

      {order.includes('interests') && resume.interests.length > 0 && (
        <Block title={sectionTitle(resume, 'interests')}>
          <div className="text-sm">{resume.interests.map((i) => i.name).join(', ')}</div>
        </Block>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h2 className="text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">{title}</h2>
      {children}
    </div>
  )
}
