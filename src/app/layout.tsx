import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BrandFox',
    startupImage: '/icons/icon-512x512.png',
  },
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
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#120B07',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA – mobile Safari */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BrandFox" />
        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#120B07" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
