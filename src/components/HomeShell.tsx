'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider, useAuth } from '@/lib/AuthContext'

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), {
  ssr: false,
  loading: () => <AppLoading />,
})

function AppLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: '#120B07' }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 animate-spin rounded-full border-4" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          <Image src="/Logoface.png" alt="BrandFox" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <p className="animate-pulse text-sm" style={{ color: '#8B7340' }}>Loading BrandFox...</p>
      </div>
    </div>
  )
}

function Shell() {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />
  if (!user) return <LandingPage />
  return <ResumeBuilder />
}

export default function HomeShell() {
  return (
    <SessionProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SessionProvider>
  )
}

/* ── colour tokens ──────────────────────────────────────────────────────────── */
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

/* ── data ───────────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick a Template',
    desc: 'Choose from 8 ATS-optimized, professionally designed templates filtered by your industry and career level.',
  },
  {
    step: '02',
    title: 'Add Your Details',
    desc: 'Fill in experience, education, skills, and more. The live preview updates in real time as you type.',
  },
  {
    step: '03',
    title: 'Download Your PDF',
    desc: 'Export a pixel-perfect, ATS-ready PDF in one click. No watermarks, no subscription required.',
  },
]

const FEATURES = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    title: '8 ATS-Optimized Templates',
    desc: 'Every template is built to pass Applicant Tracking Systems while looking great to human reviewers — tech, finance, creative, executive, and more.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    title: 'One-Click PDF Export',
    desc: 'Pixel-perfect, print-ready PDF at any time. No watermarks, no subscriptions — download as many times as you need.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    title: 'Cloud Sync Across Devices',
    desc: 'Resumes are saved to the cloud automatically. Log in from any device and pick up exactly where you left off.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    title: 'Full Visual Customization',
    desc: 'Control fonts, colors, spacing, page size, and section order. Your resume reflects your personal brand, not a cookie-cutter template.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    title: 'Multiple Resume Versions',
    desc: 'Create tailored resumes for each job application. Keep separate versions for different roles and switch between them instantly.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    title: '100% Private & Secure',
    desc: 'Your data lives in your account only. We never sell, share, or use your resume content to train AI models.',
  },
]

const TEMPLATE_LIST = [
  { name: 'Modern Gradient',  ats: false, desc: 'Bold colored header. Great for tech and creative roles.' },
  { name: 'ATS Classic',      ats: true,  desc: 'Traditional single-column. Trusted by hiring managers.' },
  { name: 'ATS Minimal',      ats: true,  desc: 'Clean and uncluttered. Scores top marks with any ATS.' },
  { name: 'Professional',     ats: true,  desc: 'Two-column layout. Perfect for finance and corporate.' },
  { name: 'Creative Sidebar', ats: false, desc: 'Accent sidebar with photo. Stand out in visual roles.' },
  { name: 'Technical',        ats: true,  desc: 'Skills-forward design for engineers and developers.' },
  { name: 'Executive Elegant',ats: false, desc: 'Refined serif typography for senior leadership.' },
  { name: 'Academic Research',ats: false, desc: 'Long-form layout for research and publication CVs.' },
]

const FAQ_ITEMS = [
  {
    q: 'Is BrandFox really free?',
    a: 'Yes — 100% free. No credit card, no subscription tiers, and no watermarks on your exported PDFs. Build and download as many resumes as you need.',
  },
  {
    q: 'Are the resume templates ATS-compatible?',
    a: 'Yes. Most templates are built with ATS compatibility in mind. ATS Classic, ATS Minimal, Professional, and Technical are specifically optimized — they use clean formatting, standard fonts, and proper heading hierarchy that applicant tracking systems can parse correctly.',
  },
  {
    q: 'Can I export my resume as a PDF?',
    a: 'Yes. Click the "Export PDF" button at any time to download a pixel-perfect, print-ready PDF. No watermarks, no limits — export as often as you like.',
  },
  {
    q: 'How many resumes can I create?',
    a: 'As many as you need. Keep separate resume versions for different job roles, industries, or seniority levels and switch between them instantly.',
  },
  {
    q: 'What makes a resume ATS-friendly?',
    a: 'An ATS (Applicant Tracking System) scans your resume for keywords and structured data before a human ever reads it. ATS-friendly resumes use standard section headings, clean layouts, machine-readable fonts, and role-relevant keywords — all built into our ATS templates.',
  },
  {
    q: 'Is my resume data private and secure?',
    a: 'Yes. Your data is stored securely in your personal account via Firebase Firestore with strict security rules — no other user can access your resumes. We never sell, share, or use your content to train AI models.',
  },
]

/* ── FAQ accordion item ─────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-xl transition-all duration-200"
      style={{
        border: `1px solid ${open ? C.goldBorder : C.chocBorder}`,
        background: open ? C.goldFaint : C.matteCard,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold" style={{ color: open ? C.goldLight : C.text }}>{q}</span>
        <svg
          className="ml-3 h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: C.goldDim, transform: open ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{a}</p>
        </div>
      )}
    </div>
  )
}

/* ── LandingPage ────────────────────────────────────────────────────────────── */
function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans" style={{ background: C.matteDeep, color: C.text }}>

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="anim-orb absolute rounded-full" style={{ width: 600, height: 600, top: -180, right: -160, background: `radial-gradient(circle, rgba(201,168,76,.18) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
        <div className="anim-orb-slow absolute rounded-full" style={{ width: 500, height: 500, bottom: -140, left: -140, background: `radial-gradient(circle, rgba(13,144,128,.16) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
        <div className="absolute rounded-full" style={{ width: 700, height: 300, top: '40%', left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(ellipse, rgba(61,26,8,.35) 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10"
        style={{ borderBottom: `1px solid ${C.goldBorder}`, background: 'rgba(7,8,9,.7)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center">
          <Image src="/logo.png" alt="BrandFox" width={140} height={40} className="h-9 w-auto object-contain" priority />
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {(['How It Works', 'Templates', 'FAQ'] as const).map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm transition"
              style={{ color: C.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium transition" style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >Sign In</Link>
          <Link href="/login" className="anim-glow rounded-md px-4 py-2 text-sm font-semibold text-white transition"
            style={{ background: `linear-gradient(135deg, ${C.chocMid}, ${C.gold})` }}
          >Get Started Free</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-20 text-center sm:py-32">
        <div className="anim-badge mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
          style={{ border: `1px solid ${C.oceanLight}40`, background: C.oceanFaint, color: C.oceanLight }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: C.oceanLight }} />
          Free forever &mdash; no credit card &mdash; no watermarks
        </div>

        <h1 className="anim-hero mt-2 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Free ATS Resume Builder
          <span className="mt-1 block">
            <span className="anim-shimmer">That Gets You Hired</span>
          </span>
        </h1>

        <p className="anim-hero-delay mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: C.textMuted }}>
          BrandFox is the free ATS resume builder for job seekers, students, and professionals.
          Pick from <strong style={{ color: C.text }}>8 ATS-optimized templates</strong>, customize every detail,
          and export a <strong style={{ color: C.text }}>watermark-free PDF</strong> in minutes.
          No subscription. No credit card. Ever.
        </p>

        <div className="anim-hero-d2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login"
            className="anim-glow w-full rounded-lg px-8 py-3.5 text-sm font-bold text-white transition sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
          >
            Build My Resume — It&apos;s Free
          </Link>
          <Link href="/login"
            className="w-full rounded-lg px-8 py-3.5 text-sm font-medium transition sm:w-auto"
            style={{ border: `1px solid ${C.goldBorder}`, background: C.goldFaint, color: C.goldLight }}
          >
            Sign In to My Account
          </Link>
        </div>

        <p className="mt-5 text-xs" style={{ color: C.textMuted }}>
          Trusted by job seekers across tech, finance, design, and corporate industries
        </p>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-6">
        <div className="grid grid-cols-3 divide-x rounded-xl py-5"
          style={{ background: C.matteCardMid, border: `1px solid ${C.goldBorder}`, '--tw-divide-color': C.goldBorder } as React.CSSProperties}
        >
          {[
            { value: '8',       label: 'ATS-Ready Templates' },
            { value: '0',       label: 'Watermarks on PDF Export' },
            { value: '100%',    label: 'Free — No Hidden Fees' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5 px-4 text-center">
              <span className="text-xl font-bold sm:text-2xl" style={{ color: C.gold }}>{s.value}</span>
              <span className="text-[11px] leading-tight sm:text-xs" style={{ color: C.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          How It Works
        </div>
        <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
          Build a professional resume in 3 simple steps
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="relative rounded-xl p-7 text-center"
              style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `3px solid ${C.gold}` }}
            >
              {/* Connector */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="absolute right-0 top-1/3 hidden h-px sm:block"
                  style={{ width: 24, background: `linear-gradient(90deg, ${C.goldDim}80, transparent)`, transform: 'translateX(100%)' }}
                />
              )}
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.chocMid}, ${C.gold})` }}
              >
                {item.step}
              </div>
              <h3 className="mb-2 text-base font-semibold" style={{ color: C.goldLight }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-12">
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
              className="card-reveal rounded-xl p-6 transition-all duration-300"
              style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `2px solid ${C.goldDim}`, animationDelay: `${i * 0.08}s` }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderTopColor = C.gold
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px rgba(201,168,76,.12)`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderTopColor = C.goldDim
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: C.oceanFaint, border: `1px solid ${C.oceanMid}30` }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.oceanLight }}>{f.icon}</svg>
              </div>
              <h3 className="mb-2 font-semibold" style={{ color: C.goldLight }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Templates ───────────────────────────────────────────────────── */}
      <section id="templates" className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          Resume Templates
        </div>
        <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
          8 professional resume templates
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-sm leading-relaxed" style={{ color: C.textMuted }}>
          Designed to impress both ATS systems and human recruiters. Switch templates anytime without losing your content.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATE_LIST.map((tpl) => (
            <Link
              href="/login"
              key={tpl.name}
              className="block rounded-xl p-4 transition-all duration-200"
              style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}` }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.goldBorder
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px rgba(201,168,76,.1)`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.chocBorder
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold leading-tight" style={{ color: C.goldLight }}>{tpl.name}</span>
                {tpl.ats && (
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: C.oceanFaint, color: C.oceanLight, border: `1px solid ${C.oceanLight}30` }}
                  >ATS</span>
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{tpl.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/login"
            className="inline-block rounded-lg px-8 py-3 text-sm font-semibold text-white transition"
            style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
          >
            Use a Template — Free →
          </Link>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 mx-auto max-w-2xl px-6 py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          FAQ
        </div>
        <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-2xl p-10 text-center"
          style={{
            background: `linear-gradient(135deg, ${C.chocDark} 0%, ${C.matteCardMid} 100%)`,
            border: `1px solid ${C.goldBorder}`,
            boxShadow: `0 0 60px rgba(201,168,76,.08), inset 0 1px 0 ${C.goldBorder}`,
          }}
        >
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
            Start for Free Today
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Your next opportunity starts with a great resume
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: C.textMuted }}>
            Build an ATS-optimized, professionally designed resume in minutes.
            Free forever — no credit card, no watermarks, no limits.
          </p>
          <Link href="/login"
            className="anim-glow mt-7 inline-block rounded-lg px-10 py-3.5 text-sm font-bold text-white transition"
            style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
          >
            Build My ATS Resume — Free
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8" style={{ borderTop: `1px solid ${C.goldBorder}` }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="BrandFox" width={100} height={28} className="h-7 w-auto object-contain" />
              <span className="text-xs" style={{ color: C.textMuted }}>&copy; {new Date().getFullYear()}</span>
            </div>
            <nav className="flex flex-wrap items-center gap-5 text-xs" aria-label="Footer navigation">
              <a href="#how-it-works" className="transition hover:text-white" style={{ color: C.textMuted }}>How It Works</a>
              <a href="#templates" className="transition hover:text-white" style={{ color: C.textMuted }}>Templates</a>
              <a href="#faq" className="transition hover:text-white" style={{ color: C.textMuted }}>FAQ</a>
              <Link href="/privacy" className="transition hover:text-white" style={{ color: C.textMuted }}>Privacy Policy</Link>
              <Link href="/login" className="font-medium transition" style={{ color: C.goldDim }}
                onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = C.goldDim)}
              >Get Started Free →</Link>
            </nav>
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: C.textMuted }}>
            BrandFox is a free ATS resume builder. Create professional resumes with ATS-optimized templates,
            customize your design, and export watermark-free PDFs — no subscription, no credit card.
          </p>
        </div>
      </footer>

    </div>
  )
}
