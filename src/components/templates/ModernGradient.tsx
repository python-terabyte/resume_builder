import { ResumeData, SectionType } from '@/types/resume'
import { TemplateProps, dateRange, formatDate, isSectionVisible, sectionTitle, visibleSectionTypes } from './shared'

export default function ModernGradient({ resume }: TemplateProps) {
  const { personal, accentColor } = resume
  const order = visibleSectionTypes(resume)

  return (
    <>
      <div style={{ backgroundColor: accentColor }} className="px-10 py-8 text-white">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {personal.firstName} {personal.lastName}
            </h1>
            {personal.jobTitle && <p className="mt-1 text-lg font-light opacity-90">{personal.jobTitle}</p>}
            {personal.summary && (
              <p className="mt-3 text-sm leading-relaxed opacity-85 whitespace-pre-wrap" style={{ maxWidth: '520px' }}>
                {personal.summary}
              </p>
            )}
          </div>
          {personal.photo && (
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full border-[3px]" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
              <img src={personal.photo} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-85">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.website && <span>{personal.website}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
        </div>
      </div>

      <div className="px-10 py-6">
        {order.map((type) => (
          <Section key={type} type={type} resume={resume} />
        ))}
      </div>
    </>
  )
}

function Section({ type, resume }: { type: SectionType; resume: ResumeData }) {
  if (!isSectionVisible(resume, type)) return null
  const title = sectionTitle(resume, type)
  const accentColor = resume.accentColor

  const wrap = (children: React.ReactNode) => (
    <div className="mb-6" data-resume-section>
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>{title}</h2>
        <div className="flex-1 border-t" style={{ borderColor: `${accentColor}40` }} />
      </div>
      {children}
    </div>
  )

  switch (type) {
    case 'personal':
      return null
    case 'experience':
      return resume.experience.length ? wrap(
        resume.experience.map((exp, i) => (
          <div key={exp.id} className={i > 0 ? 'mt-4' : ''}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-semibold text-gray-900">{exp.position}</span>
                {exp.company && <span className="text-gray-600">, {exp.company}</span>}
                {exp.location && <span className="text-gray-400 text-xs"> · {exp.location}</span>}
              </div>
              <span className="shrink-0 text-xs text-gray-400 ml-4">{dateRange(exp.startDate, exp.endDate, exp.current)}</span>
            </div>
            {exp.description && <div className="mt-1 text-gray-600 whitespace-pre-wrap leading-relaxed">{exp.description}</div>}
          </div>
        ))
      ) : null
    case 'education':
      return resume.education.length ? wrap(
        resume.education.map((edu, i) => (
          <div key={edu.id} className={i > 0 ? 'mt-4' : ''}>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-semibold text-gray-900">{edu.institution}</span>
                {edu.location && <span className="text-gray-400 text-xs"> · {edu.location}</span>}
              </div>
              <span className="shrink-0 text-xs text-gray-400 ml-4">{dateRange(edu.startDate, edu.endDate, edu.current)}</span>
            </div>
            {(edu.degree || edu.field) && (
              <div className="text-gray-600">
                {[edu.degree, edu.field].filter(Boolean).join(', ')}
                {edu.gpa && <span className="text-gray-400"> · GPA: {edu.gpa}</span>}
              </div>
            )}
            {edu.description && <div className="mt-0.5 text-gray-500 text-xs whitespace-pre-wrap">{edu.description}</div>}
          </div>
        ))
      ) : null
    case 'skills':
      return resume.skillGroups.length ? wrap(
        <div className="flex flex-col gap-2">
          {resume.skillGroups.map((g) => (
            <div key={g.id} className="flex gap-3">
              {g.category && (
                <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 pt-0.5">{g.category}</span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {g.skills.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium text-center w-fit"
                    style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null
    case 'projects':
      return resume.projects.length ? wrap(
        resume.projects.map((p, i) => (
          <div key={p.id} className={i > 0 ? 'mt-4' : ''}>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-gray-900">{p.name}</span>
                {p.url && <span className="text-xs" style={{ color: accentColor }}>{p.url}</span>}
              </div>
              {(p.startDate || p.endDate) && (
                <span className="shrink-0 text-xs text-gray-400 ml-4">{dateRange(p.startDate, p.endDate, false)}</span>
              )}
            </div>
            {p.technologies && <div className="text-xs text-gray-500 mt-0.5">{p.technologies}</div>}
            {p.description && <div className="mt-0.5 text-gray-600 whitespace-pre-wrap">{p.description}</div>}
          </div>
        ))
      ) : null
    case 'certifications':
      return resume.certifications.length ? wrap(
        <div className="flex flex-wrap gap-2">
          {resume.certifications.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium text-center w-fit"
              style={{ backgroundColor: `${accentColor}14`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {c.name}
              {c.issuer && <span className="opacity-80">, {c.issuer}</span>}
              {c.date && <span className="opacity-60"> · {formatDate(c.date)}</span>}
            </span>
          ))}
        </div>
      ) : null
    case 'languages':
      return resume.languages.length ? wrap(
        <div className="flex flex-wrap gap-2">
          {resume.languages.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium text-center w-fit"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {l.language}
              {l.proficiency && <span className="opacity-75"> · {l.proficiency}</span>}
            </span>
          ))}
        </div>
      ) : null
    case 'interests':
      return resume.interests.length ? wrap(
        <div className="flex flex-wrap gap-2">
          {resume.interests.map((i) => (
            <span
              key={i.id}
              className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium text-center w-fit"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {i.name}
            </span>
          ))}
        </div>
      ) : null
    default:
      return null
  }
}
