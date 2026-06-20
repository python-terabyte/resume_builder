import type { Metadata } from 'next'
import HomeShell from '@/components/HomeShell'

export const metadata: Metadata = {
  title: 'BrandFox — Professional Document Creation Platform',
  description:
    'Create professional documents in minutes with BrandFox. Build ATS-friendly resumes, business reports, financial statements, and investor decks. Free professional templates, one-click PDF export, cloud sync. 100% free — no credit card ever.',
  alternates: { canonical: 'https://www.bfox.pro' },
  openGraph: {
    title: 'BrandFox — Professional Document Creation Platform',
    description:
      'Build professional documents that make an impact. Resume Builder, Report Builder, and more — all from one platform. Free forever.',
    url: 'https://www.bfox.pro',
    type: 'website',
  },
  twitter: {
    title: 'BrandFox — Professional Document Creation Platform',
    description:
      'Create ATS-ready resumes, business reports, and professional documents. Free templates, PDF export, no watermarks.',
  },
}

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'BrandFox',
  url: 'https://www.bfox.pro',
  description:
    'Professional document creation platform. Build ATS-friendly resumes, business reports, financial statements, and investor decks with free templates and one-click PDF export.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'ATS-friendly resume builder with 8 templates',
    'Business report builder with professional blocks',
    'One-click PDF export without watermarks',
    'Real-time document preview',
    'Cloud sync across devices',
    'Drag-and-drop section reordering',
    'Custom accent colors and fonts',
    'Multiple page size support',
    'Google Sign-in',
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
        text: 'Yes — 100% free. No credit card, no subscription tiers, and no watermarks on exported PDFs. Build and download as many documents as you need.',
      },
    },
    {
      '@type': 'Question',
      name: 'What documents can I create with BrandFox?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'BrandFox includes a Resume Builder for ATS-friendly resumes and CVs, and a Report Builder for business reports, financial statements, company profiles, investor decks, and proposals.',
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
      name: 'Can I export my documents as PDF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Click the Export PDF button at any time to download a pixel-perfect, print-ready PDF. No watermarks, no limits — export as often as you like.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many documents can I create?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As many as you need. Keep separate resume versions for different job roles, and multiple reports for different clients or projects, and switch between them instantly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data private and secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Your documents are stored securely in your personal account via Firebase Firestore with strict security rules. No other user can access your files, and we never sell, share, or use your content to train AI models.',
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
