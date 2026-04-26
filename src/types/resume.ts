export type SectionType =
  | 'personal'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'interests'

export interface PersonalInfo {
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  summary: string
  photo: string | null
}

export interface ExperienceItem {
  id: string
  company: string
  position: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export interface EducationItem {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  gpa: string
  description: string
}

export interface SkillItem {
  id: string
  name: string
  level: number // 0-100
}

export interface SkillGroup {
  id: string
  category: string
  skills: SkillItem[]
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  url: string
  technologies: string
  startDate: string
  endDate: string
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export interface LanguageItem {
  id: string
  language: string
  proficiency: string
}

export interface InterestItem {
  id: string
  name: string
}

export interface ResumeSection {
  id: string
  type: SectionType
  title: string
  visible: boolean
}

export interface TypographySettings {
  fontSize: number // base font size in px (8-14)
  lineHeight: number // 1.0-2.0
  letterSpacing: number // -0.05 to 0.2em
  fontFamily: string
}

export type TemplateId =
  | 'modern-gradient'
  | 'ats-classic'
  | 'ats-minimal'
  | 'professional'
  | 'creative'
  | 'technical'
  | 'executive'
  | 'academic'

export type Industry =
  | 'all'
  | 'technology'
  | 'business'
  | 'creative'
  | 'healthcare'
  | 'academic'
  | 'marketing'
  | 'legal'
  | 'hospitality'
  | 'executive'

export interface TemplateMeta {
  id: TemplateId
  name: string
  description: string
  ats: boolean
  industries: Industry[]
}

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5'

export interface PageSizeMeta {
  id: PageSize
  label: string
  width: string   // CSS dimension for screen preview
  height: string
  cssSize: string // CSS @page size value (e.g. "A4", "letter")
}

export const PAGE_SIZES: PageSizeMeta[] = [
  { id: 'A4',     label: 'A4',          width: '210mm',   height: '297mm',   cssSize: 'A4' },
  { id: 'Letter', label: 'Letter (US)', width: '215.9mm', height: '279.4mm', cssSize: 'letter' },
  { id: 'Legal',  label: 'Legal (US)',  width: '215.9mm', height: '355.6mm', cssSize: 'legal' },
  { id: 'A3',     label: 'A3',          width: '297mm',   height: '420mm',   cssSize: 'A3' },
  { id: 'A5',     label: 'A5',          width: '148mm',   height: '210mm',   cssSize: 'A5' },
]

export interface ResumeData {
  personal: PersonalInfo
  experience: ExperienceItem[]
  education: EducationItem[]
  skillGroups: SkillGroup[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
  languages: LanguageItem[]
  interests: InterestItem[]
  sections: ResumeSection[]
  accentColor: string
  typography: TypographySettings
  templateId: TemplateId
  selectedIndustry: Industry
  pageSize: PageSize
}

export const COLOR_THEMES = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Black', value: '#1e293b' },
]

export const INDUSTRIES: { id: Industry; label: string; description: string }[] = [
  { id: 'all', label: 'All Industries', description: 'Browse every template' },
  { id: 'technology', label: 'Technology / Engineering', description: 'Software, IT, hardware, data' },
  { id: 'business', label: 'Business / Finance', description: 'Banking, consulting, accounting' },
  { id: 'creative', label: 'Design / Creative', description: 'Design, writing, media, arts' },
  { id: 'marketing', label: 'Marketing / Sales', description: 'Brand, growth, communications' },
  { id: 'healthcare', label: 'Healthcare / Medical', description: 'Clinical, nursing, allied health' },
  { id: 'academic', label: 'Education / Academic', description: 'Research, teaching, publications' },
  { id: 'legal', label: 'Legal', description: 'Law, compliance, policy' },
  { id: 'hospitality', label: 'Hospitality / Service', description: 'Retail, food, customer-facing' },
  { id: 'executive', label: 'Executive / Leadership', description: 'C-suite, senior management' },
]

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'ats-classic',
    name: 'ATS Classic',
    description: 'Single-column, no graphics — maximum applicant-tracking-system compatibility.',
    ats: true,
    industries: ['all', 'technology', 'business', 'healthcare', 'legal', 'hospitality', 'marketing', 'academic'],
  },
  {
    id: 'ats-minimal',
    name: 'ATS Minimal',
    description: 'Clean ATS-safe layout with subtle accent — keeps parsers happy, looks modern.',
    ats: true,
    industries: ['all', 'technology', 'business', 'marketing', 'healthcare', 'legal'],
  },
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Bold colored header with summary up top — great for tech and startup roles.',
    ats: false,
    industries: ['all', 'technology', 'marketing', 'creative'],
  },
  {
    id: 'professional',
    name: 'Two-Column Professional',
    description: 'Traditional two-column layout — polished and corporate-friendly.',
    ats: false,
    industries: ['all', 'business', 'legal', 'healthcare', 'hospitality'],
  },
  {
    id: 'creative',
    name: 'Creative Sidebar',
    description: 'Colored sidebar with photo, expressive typography — for creative roles.',
    ats: false,
    industries: ['all', 'creative', 'marketing'],
  },
  {
    id: 'technical',
    name: 'Technical / Engineering',
    description: 'Skill-forward layout with projects highlighted — ideal for engineers.',
    ats: false,
    industries: ['all', 'technology'],
  },
  {
    id: 'executive',
    name: 'Executive Elegant',
    description: 'Serif typography and refined spacing — built for senior leadership.',
    ats: false,
    industries: ['all', 'executive', 'business', 'legal'],
  },
  {
    id: 'academic',
    name: 'Academic / Research',
    description: 'Long-form layout with publications and research emphasis.',
    ats: false,
    industries: ['all', 'academic', 'healthcare'],
  },
]

export const FONT_FAMILIES = [
  'DM Sans',
  'Inter',
  'Georgia',
  'Times New Roman',
  'Helvetica Neue',
  'Roboto',
  'Open Sans',
  'Lato',
]

export const DEFAULT_RESUME: ResumeData = {
  personal: {
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'Senior Software Engineer',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'johndoe.dev',
    linkedin: 'linkedin.com/in/johndoe',
    summary:
      'Experienced software engineer with 7+ years building scalable web applications. Passionate about clean code, performance, and developer experience.',
    photo: null,
  },
  experience: [
    {
      id: 'exp-1',
      company: 'Acme Corp',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description:
        '• Led development of microservices architecture serving 10M+ users\n• Reduced API latency by 40% through caching and query optimization\n• Mentored 3 junior engineers and conducted technical interviews',
    },
    {
      id: 'exp-2',
      company: 'StartupXYZ',
      position: 'Software Engineer',
      location: 'Remote',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      description:
        '• Built real-time collaboration features used by 50,000+ daily active users\n• Migrated monolithic app to React + Node.js microservices\n• Improved test coverage from 30% to 85%',
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      location: 'Berkeley, CA',
      startDate: '2014-08',
      endDate: '2018-05',
      current: false,
      gpa: '3.8',
      description: 'Dean\'s List, ACM Club President',
    },
  ],
  skillGroups: [
    {
      id: 'sg-1',
      category: 'Languages',
      skills: [
        { id: 'sk-1', name: 'TypeScript', level: 90 },
        { id: 'sk-2', name: 'Python', level: 80 },
        { id: 'sk-3', name: 'Go', level: 70 },
        { id: 'sk-4', name: 'SQL', level: 85 },
      ],
    },
    {
      id: 'sg-2',
      category: 'Frameworks & Tools',
      skills: [
        { id: 'sk-5', name: 'React', level: 92 },
        { id: 'sk-6', name: 'Next.js', level: 88 },
        { id: 'sk-7', name: 'Node.js', level: 85 },
        { id: 'sk-8', name: 'Docker', level: 75 },
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'OpenAPI Generator',
      description: 'CLI tool that auto-generates TypeScript clients from OpenAPI specs. 2k+ GitHub stars.',
      url: 'github.com/johndoe/openapi-gen',
      technologies: 'TypeScript, Node.js, Handlebars',
      startDate: '2022-01',
      endDate: '2022-06',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2022-09',
      url: '',
    },
  ],
  languages: [
    { id: 'lang-1', language: 'English', proficiency: 'Native' },
    { id: 'lang-2', language: 'Spanish', proficiency: 'Intermediate' },
  ],
  interests: [
    { id: 'int-1', name: 'Open Source' },
    { id: 'int-2', name: 'Rock Climbing' },
    { id: 'int-3', name: 'Photography' },
  ],
  sections: [
    { id: 'sec-personal', type: 'personal', title: 'Personal Info', visible: true },
    { id: 'sec-experience', type: 'experience', title: 'Work Experience', visible: true },
    { id: 'sec-education', type: 'education', title: 'Education', visible: true },
    { id: 'sec-skills', type: 'skills', title: 'Skills', visible: true },
    { id: 'sec-projects', type: 'projects', title: 'Projects', visible: true },
    { id: 'sec-certifications', type: 'certifications', title: 'Certifications', visible: true },
    { id: 'sec-languages', type: 'languages', title: 'Languages', visible: true },
    { id: 'sec-interests', type: 'interests', title: 'Interests', visible: true },
  ],
  accentColor: '#6366f1',
  typography: {
    fontSize: 10,
    lineHeight: 1.5,
    letterSpacing: 0,
    fontFamily: 'DM Sans',
  },
  templateId: 'modern-gradient',
  selectedIndustry: 'all',
  pageSize: 'A4',
}
