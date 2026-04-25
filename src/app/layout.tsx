import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Resume Builder',
  description: 'Build and customize your professional resume',
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
