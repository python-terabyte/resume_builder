import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BrandFox - Resume Builder',
  description: 'Build and export professional resumes with BrandFox. Choose from multiple templates, customize every detail, and download as PDF.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
