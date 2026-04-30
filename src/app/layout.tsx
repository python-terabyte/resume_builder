import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bfox.pro'),
  title: {
    default: 'BrandFox — Free ATS Resume Builder',
    template: '%s | BrandFox',
  },
  description:
    'Build a professional, ATS-friendly resume in minutes. 8 expert-designed templates, real-time preview, one-click PDF export. Free forever — no credit card, no watermarks.',
  keywords: [
    'free resume builder',
    'ATS resume builder',
    'online resume maker',
    'professional resume templates',
    'ATS friendly resume',
    'CV builder',
    'resume maker free',
    'resume builder no watermark',
    'resume PDF export',
    'job resume builder',
  ],
  openGraph: {
    siteName: 'BrandFox',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
