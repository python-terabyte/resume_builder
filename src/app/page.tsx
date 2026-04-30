import type { Metadata } from 'next'
import HomeShell from '@/components/HomeShell'

export const metadata: Metadata = {
  title: 'BrandFox — Free ATS Resume Builder | Professional Resume Templates',
  description:
    'Create a professional, ATS-optimized resume in minutes with BrandFox. Choose from 8 expert-designed templates, customize every detail, and download a watermark-free PDF instantly. 100% free — no credit card ever.',
  alternates: { canonical: 'https://www.bfox.pro' },
  openGraph: {
    title: 'BrandFox — Free ATS Resume Builder',
    description:
      'Build a professional resume that passes ATS systems. 8 templates, one-click PDF, cloud sync. Free forever.',
    url: 'https://www.bfox.pro',
    type: 'website',
  },
  twitter: {
    title: 'BrandFox — Free ATS Resume Builder',
    description:
      'Build ATS-ready resumes that get you hired. Professional templates, PDF export, no watermarks. Free forever.',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'BrandFox',
  url: 'https://www.bfox.pro',
  description:
    'Free online ATS resume builder with 8 professional templates, one-click PDF export, and cloud storage.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    '8 ATS-friendly resume templates',
    'One-click PDF export without watermarks',
    'Real-time resume preview',
    'Cloud sync across devices',
    'Drag-and-drop section reordering',
    'Custom accent colors and fonts',
    'Multiple page size support',
    'Google Sign-in',
    'Multiple resumes per account',
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is BrandFox free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — 100% free. No credit card, no subscription tiers, and no watermarks on exported PDFs. Build and download as many resumes as you need.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the resume templates ATS-compatible?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. BrandFox offers 8 professionally designed templates. ATS Classic, ATS Minimal, Professional, and Technical are specifically optimized for Applicant Tracking Systems using clean formatting, standard fonts, and proper heading hierarchy.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I export my resume as a PDF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Click the Export PDF button at any time to download a pixel-perfect, print-ready PDF. No watermarks, no limits — export as often as you like.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many resumes can I create?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As many as you need. Keep separate resume versions for different job roles, industries, or seniority levels, and switch between them instantly.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes a resume ATS-friendly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An ATS (Applicant Tracking System) scans resumes for keywords and structured data before a human reads them. ATS-friendly resumes use standard section headings, clean layouts, machine-readable fonts, and role-relevant keywords.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my resume data private and secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Your resume data is stored securely in your personal account via Firebase Firestore with strict security rules. No other user can access your resumes, and we never sell, share, or use your content to train AI models.',
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeShell />
    </>
  )
}
