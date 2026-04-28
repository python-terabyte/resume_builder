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
    <div className="flex h-screen w-full items-center justify-center" style={{ background: '#120B07' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
        <p className="animate-pulse text-sm" style={{ color: '#8B7340' }}>Loading BrandFox...</p>
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

/* ── colour tokens ─────────────────────────────────────────────────────── */
const C = {
  matteDeep:    '#070809',
  matteCard:    '#0F0C08',
  matteCardMid: '#191208',
  chocDark:     '#1C0D03',
  chocMid:      '#3D1A08',
  chocBorder:   '#5C2D0E',
  gold:         '#C9A84C',
  goldLight:    '#E8C96A',
  goldDim:      '#8B6E2E',
  goldFaint:    'rgba(201,168,76,.08)',
  goldBorder:   'rgba(201,168,76,.22)',
  ocean:        '#0A6B5C',
  oceanMid:     '#0D9080',
  oceanLight:   '#1CBF9F',
  oceanFaint:   'rgba(13,144,128,.10)',
  text:         '#D4C4A0',
  textMuted:    '#7A6A50',
}

/* ── feature cards data ────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    title: 'Professional Templates',
    desc:  'ATS-friendly, modern, creative and executive designs — every template fully customizable.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    title: 'One-Click PDF Export',
    desc:  'Pixel-perfect, print-ready PDF at any time. No watermarks, no subscriptions.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    title: 'Save & Sync',
    desc:  'Resumes saved to the cloud automatically. Pick up exactly where you left off on any device.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    title: 'Full Customization',
    desc:  'Fonts, colors, spacing, page size and section order — your resume, your way.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    title: 'Multiple Resumes',
    desc:  'Keep separate resumes for different roles or industries and switch between them instantly.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    title: 'Private & Secure',
    desc:  'Your data lives in your account only. We never share, sell, or train models on it.',
  },
]

/* ── LandingPage ───────────────────────────────────────────────────────── */
function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans" style={{ background: C.matteDeep, color: C.text }}>

      {/* ── Ambient orbs ───────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {/* golden orb top-right */}
        <div
          className="anim-orb absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: -180, right: -160,
            background: `radial-gradient(circle, rgba(201,168,76,.18) 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        {/* ocean green orb bottom-left */}
        <div
          className="anim-orb-slow absolute rounded-full"
          style={{
            width: 500, height: 500,
            bottom: -140, left: -140,
            background: `radial-gradient(circle, rgba(13,144,128,.16) 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        {/* chocolate warm glow center */}
        <div
          className="absolute rounded-full"
          style={{
            width: 700, height: 300,
            top: '40%', left: '50%',
            transform: 'translateX(-50%)',
            background: `radial-gradient(ellipse, rgba(61,26,8,.35) 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10"
        style={{ borderBottom: `1px solid ${C.goldBorder}`, background: 'rgba(7,8,9,.7)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: `linear-gradient(135deg, ${C.chocMid}, ${C.gold})` }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold" style={{ color: C.goldLight }}>BrandFox</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium transition"
            style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="anim-glow rounded-md px-4 py-2 text-sm font-semibold transition"
            style={{
              background: `linear-gradient(135deg, ${C.chocMid}, ${C.gold})`,
              color: '#fff',
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20 text-center sm:py-32">

        {/* Floating badge */}
        <div
          className="anim-badge mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
          style={{
            border: `1px solid ${C.oceanLight}40`,
            background: C.oceanFaint,
            color: C.oceanLight,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.oceanLight }} />
          Free to use &mdash; no credit card required
        </div>

        <h1 className="anim-hero mt-2 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Build a resume that
        </h1>
        <h1 className="anim-hero mt-1 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          <span className="anim-shimmer">gets you hired</span>
        </h1>

        <p
          className="anim-hero-delay mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: C.textMuted }}
        >
          BrandFox is a professional resume builder that lets you create, customize, and export
          polished resumes in minutes. Choose from expert-designed templates, personalize every
          detail, and download a print-ready PDF.
        </p>

        <div className="anim-hero-d2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="anim-glow w-full rounded-lg px-8 py-3 text-sm font-semibold text-white transition sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
          >
            Create your resume &mdash; it&apos;s free
          </Link>
          <Link
            href="/login"
            className="w-full rounded-lg px-8 py-3 text-sm font-medium transition sm:w-auto"
            style={{
              border: `1px solid ${C.goldBorder}`,
              background: C.goldFaint,
              color: C.goldLight,
            }}
          >
            Sign in to your account
          </Link>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <div
        className="relative z-10 mx-auto max-w-3xl px-6 pb-6"
      >
        <div
          className="grid grid-cols-3 divide-x rounded-xl py-5"
          style={{ background: C.matteCardMid, border: `1px solid ${C.goldBorder}` }}
        >
          {[
            { label: 'Resume Templates', value: '8+' },
            { label: 'PDF Export', value: '1-Click' },
            { label: 'Your data stays yours', value: '100% Private' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5 px-4 text-center">
              <span className="text-xl font-bold sm:text-2xl" style={{ color: C.gold }}>{s.value}</span>
              <span className="text-[11px] leading-tight sm:text-xs" style={{ color: C.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          Features
        </div>
        <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
          Everything you need to land your next role
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card-reveal group rounded-xl p-6 transition-all duration-300"
              style={{
                background: C.matteCard,
                border: `1px solid ${C.chocBorder}`,
                borderTop: `2px solid ${C.goldDim}`,
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderTopColor = C.gold
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(201,168,76,.12)`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderTopColor = C.goldDim
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              {/* Icon container */}
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: C.oceanFaint, border: `1px solid ${C.oceanMid}30` }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.oceanLight }}>
                  {f.icon}
                </svg>
              </div>
              <h3 className="mb-2 font-semibold" style={{ color: C.goldLight }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: `linear-gradient(135deg, ${C.chocDark} 0%, ${C.matteCardMid} 100%)`,
            border: `1px solid ${C.goldBorder}`,
            boxShadow: `0 0 60px rgba(201,168,76,.08), inset 0 1px 0 ${C.goldBorder}`,
          }}
        >
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
            Get Started Today
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Your next opportunity starts here
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: C.textMuted }}>
            Create a polished, professional resume in minutes. Free forever — no credit card, no limits.
          </p>
          <Link
            href="/login"
            className="anim-glow mt-7 inline-block rounded-lg px-10 py-3 text-sm font-bold text-white transition"
            style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
          >
            Create My Resume for Free
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 py-6 text-center text-xs"
        style={{ borderTop: `1px solid ${C.goldBorder}`, color: C.textMuted }}
      >
        <div className="flex flex-wrap items-center justify-center gap-5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: `linear-gradient(135deg, ${C.chocMid}, ${C.gold})` }}
            >
              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span style={{ color: C.goldDim }}>&copy; {new Date().getFullYear()} BrandFox</span>
          </div>
          <Link
            href="/privacy"
            className="transition"
            style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}
