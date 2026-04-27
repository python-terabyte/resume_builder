'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider, useAuth } from '@/lib/AuthContext'

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), {
  ssr: false,
  loading: () => <Loading />,
})

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0f0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="animate-pulse text-slate-400">Loading BrandFox...</p>
      </div>
    </div>
  )
}

function Shell() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <LandingPage />
  return <ResumeBuilder />
}

export default function Home() {
  return (
    <SessionProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SessionProvider>
  )
}

const FEATURES = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    title: 'Professional Templates',
    desc: 'Choose from ATS-friendly, modern, creative, and executive designs. Every template is fully customizable.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    ),
    title: 'One-Click PDF Export',
    desc: 'Download your resume as a print-ready PDF at any time. Pixel-perfect output, no watermarks.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    ),
    title: 'Save & Sync',
    desc: 'Your resumes are saved to the cloud automatically. Pick up exactly where you left off on any device.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    ),
    title: 'Full Customization',
    desc: 'Adjust fonts, colors, spacing, page size, and section order. Your resume, your way.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    title: 'Multiple Resumes',
    desc: 'Maintain separate resumes for different roles or industries. Switch between them instantly.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    ),
    title: 'Private & Secure',
    desc: 'Your resume data is stored securely under your personal account. We never share or sell your data.',
  },
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] font-sans text-slate-300">

      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">BrandFox</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Free to use — no credit card required
        </div>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Build a resume that<br />
          <span className="text-indigo-400">gets you hired</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          BrandFox is a professional resume builder that lets you create, customize, and export polished resumes in minutes. Choose from expert-designed templates, personalize every detail, and download a print-ready PDF.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
          >
            Create your resume — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-8 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
          >
            Sign in to your account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-12 text-center text-2xl font-bold text-white">
          Everything you need to land your next role
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/8 bg-[#1a1a2e] p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15">
                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {f.icon}
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-16 text-center">
        <h2 className="text-2xl font-bold text-white">Ready to get started?</h2>
        <p className="mt-2 text-slate-400">Create your first resume in minutes.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Get Started for Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-600">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} BrandFox. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-slate-400 transition">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
