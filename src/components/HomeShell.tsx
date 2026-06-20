'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { signOut } from '@/lib/auth'

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
          <Image src="/logoface.png" alt="BrandFox" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <p className="animate-pulse text-sm" style={{ color: '#8B7340' }}>Loading BrandFox...</p>
      </div>
    </div>
  )
}

function Shell() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/workspace')
  }, [loading, user, router])

  if (loading) return <AppLoading />
  if (user) return <AppLoading />
  return <LandingPage />
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

/* ── WorkspaceDashboard ─────────────────────────────────────────────────────── */
export function WorkspaceDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [resumeCount, setResumeCount] = useState<number | null>(null)
  const [reportCount, setReportCount] = useState<number | null>(null)
  const [resumeLastUpdated, setResumeLastUpdated] = useState<string | null>(null)
  const [reportLastUpdated, setReportLastUpdated] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const firstName = user?.name?.split(' ')[0] ?? null

  useEffect(() => {
    fetch('/api/resumes')
      .then(r => r.ok ? r.json() : [])
      .then((docs: { updatedAt: string | null }[]) => {
        const list = Array.isArray(docs) ? docs : []
        setResumeCount(list.length)
        setResumeLastUpdated(list[0]?.updatedAt ?? null)
      })
      .catch(() => setResumeCount(0))

    fetch('/api/reports')
      .then(r => r.ok ? r.json() : [])
      .then((docs: { updatedAt: string | null }[]) => {
        const list = Array.isArray(docs) ? docs : []
        setReportCount(list.length)
        setReportLastUpdated(list[0]?.updatedAt ?? null)
      })
      .catch(() => setReportCount(0))
  }, [])

  function formatRelative(ts: string | null) {
    if (!ts) return null
    const d = new Date(ts)
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diff === 0) return 'Last updated today'
    if (diff === 1) return 'Last updated yesterday'
    if (diff < 7) return `Last updated ${diff} days ago`
    return `Last updated ${d.toLocaleDateString()}`
  }

  const initials = (user?.name || user?.email || '?').slice(0, 1).toUpperCase()

  return (
    <div className="relative flex min-h-screen flex-col font-sans" style={{ background: '#120B07', color: C.text }}>
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="anim-orb absolute rounded-full" style={{ width: 600, height: 600, top: -180, right: -160, background: 'radial-gradient(circle, rgba(201,168,76,.13) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="anim-orb-slow absolute rounded-full" style={{ width: 500, height: 500, bottom: -140, left: -140, background: 'radial-gradient(circle, rgba(13,144,128,.11) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute rounded-full" style={{ width: 700, height: 300, top: '40%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(61,26,8,.28) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4"
        style={{ borderBottom: `1px solid ${C.goldBorder}`, background: 'rgba(7,8,9,.7)', backdropFilter: 'blur(12px)' }}
      >
        <Image src="/logo.png" alt="BrandFox" width={130} height={36} className="h-7 w-auto object-contain sm:h-8" />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold text-white transition"
            style={{ border: `1px solid ${C.goldBorder}`, background: C.chocMid }}
            title={user?.email ?? 'Account'}
          >
            {user?.image ? (
              <img src={user.image} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} aria-hidden />
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border py-1 shadow-2xl"
                style={{ background: '#2D1B11', border: `1px solid ${C.goldBorder}` }}
              >
                <div className="border-b px-3 py-2.5" style={{ borderColor: 'rgba(201,168,76,.15)' }}>
                  <div className="truncate text-sm font-semibold text-white">
                    {user?.name || user?.email?.split('@')[0]}
                  </div>
                  {user?.email && <div className="truncate text-xs" style={{ color: C.textMuted }}>{user.email}</div>}
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); signOut() }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-white/5"
                  style={{ color: C.text }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        {/* Welcome */}
        <div className="mb-10 text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
            Your Workspace
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
            Choose a workspace to continue, or create a new document.
          </p>
        </div>

        {/* Product cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Resume Builder card */}
          <div className="flex flex-col rounded-2xl p-6 transition-all duration-200"
            style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `3px solid ${C.gold}` }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'rgba(201,168,76,.12)', border: `1px solid ${C.goldBorder}` }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.gold }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Resume Builder</h2>
                <p className="text-xs" style={{ color: C.textMuted }}>ATS-friendly resumes &amp; CVs</p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed" style={{ color: C.textMuted }}>
              Create professional resumes with 8 ATS-optimized templates. Customize fonts, colors, and layout. Export watermark-free PDFs instantly.
            </p>

            <div className="mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(201,168,76,.06)', border: `1px solid rgba(201,168,76,.12)` }}
            >
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: C.gold }}>
                  {resumeCount === null ? '—' : resumeCount}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: C.textMuted }}>Resumes</div>
              </div>
              <div className="h-8 w-px" style={{ background: `rgba(201,168,76,.15)` }} />
              <div className="text-xs" style={{ color: C.textMuted }}>
                {resumeLastUpdated ? formatRelative(resumeLastUpdated) : resumeCount === 0 ? 'No resumes yet' : '—'}
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button
                onClick={() => router.push('/resumes')}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
              >
                {resumeCount === 0 ? 'Create Resume' : 'Open Resume Builder'}
              </button>
            </div>
          </div>

          {/* Report Builder card */}
          <div className="flex flex-col rounded-2xl p-6 transition-all duration-200"
            style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `3px solid ${C.oceanLight}` }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: C.oceanFaint, border: `1px solid ${C.oceanLight}30` }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.oceanLight }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Report Builder</h2>
                <p className="text-xs" style={{ color: C.textMuted }}>Business reports &amp; documents</p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed" style={{ color: C.textMuted }}>
              Create business reports, financial statements, company profiles, investor decks, and proposals with professional layouts and design packs.
            </p>

            <div className="mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: C.oceanFaint, border: `1px solid ${C.oceanLight}20` }}
            >
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: C.oceanLight }}>
                  {reportCount === null ? '—' : reportCount}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: C.textMuted }}>Reports</div>
              </div>
              <div className="h-8 w-px" style={{ background: `${C.oceanLight}20` }} />
              <div className="text-xs" style={{ color: C.textMuted }}>
                {reportLastUpdated ? formatRelative(reportLastUpdated) : reportCount === 0 ? 'No reports yet' : '—'}
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button
                onClick={() => router.push('/report')}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanLight} 100%)` }}
              >
                {reportCount === 0 ? 'Create Report' : 'Open Report Builder'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick create row */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => router.push('/resumes')}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium transition"
            style={{ borderColor: `${C.gold}40`, color: C.goldDim }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.goldLight; (e.currentTarget as HTMLButtonElement).style.borderColor = C.goldBorder }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.goldDim; (e.currentTarget as HTMLButtonElement).style.borderColor = `${C.gold}40` }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Resume
          </button>
          <button
            onClick={() => router.push('/report')}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium transition"
            style={{ borderColor: `${C.oceanLight}30`, color: C.oceanMid }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.oceanLight; (e.currentTarget as HTMLButtonElement).style.borderColor = `${C.oceanLight}60` }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.oceanMid; (e.currentTarget as HTMLButtonElement).style.borderColor = `${C.oceanLight}30` }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Report
          </button>
        </div>
      </main>

      {/* Footer strip */}
      <footer className="relative z-10 border-t px-6 py-4 text-center text-xs" style={{ borderColor: C.goldBorder, color: C.textMuted }}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
          <Link href="#" onClick={e => { e.preventDefault(); signOut() }} className="transition hover:text-white">Sign Out</Link>
        </div>
      </footer>
    </div>
  )
}

/* ── data ───────────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick a Template',
    desc: 'Choose from ATS-optimized resume templates or professional report layouts, filtered by your industry and purpose.',
  },
  {
    step: '02',
    title: 'Add Your Content',
    desc: 'Fill in your details or upload data from Excel. The live preview updates in real time as you type.',
  },
  {
    step: '03',
    title: 'Download Your PDF',
    desc: 'Export a pixel-perfect, print-ready PDF in one click. No watermarks, no subscription required.',
  },
]

const FEATURES = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    title: '8 ATS-Optimized Resume Templates',
    desc: 'Every resume template is built to pass Applicant Tracking Systems while looking great to human reviewers — tech, finance, creative, executive, and more.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    title: 'Professional Report Builder',
    desc: 'Create business reports, financial summaries, company profiles, investor decks, and proposals with a drag-and-drop block editor and design packs.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
    title: 'One-Click PDF Export',
    desc: 'Pixel-perfect, print-ready PDFs at any time. No watermarks, no subscriptions — download as many times as you need.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
    title: 'Cloud Sync Across Devices',
    desc: 'All your documents are saved to the cloud automatically. Log in from any device and pick up exactly where you left off.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
    title: 'Full Visual Customization',
    desc: 'Control fonts, colors, spacing, page size, and section order. Your documents reflect your personal brand, not a cookie-cutter template.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    title: '100% Private & Secure',
    desc: 'Your data lives in your account only. We never sell, share, or use your document content to train AI models.',
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

const REPORT_TEMPLATE_LIST = [
  { id: 'blank',            name: 'Blank Document',   emoji: '📄', category: 'General',    desc: 'Start from scratch with an empty page and full creative freedom.' },
  { id: 'financial-report', name: 'Financial Report', emoji: '💼', category: 'Finance',    desc: 'P&L summary, KPI metrics, balance sheet, and financial outlook.' },
  { id: 'annual-report',    name: 'Annual Report',    emoji: '📊', category: 'Finance',    desc: 'CEO letter, year in review, financials, and strategic priorities.' },
  { id: 'board-report',     name: 'Board Report',     emoji: '📋', category: 'Management', desc: 'Executive summary, KPIs, financial update, and board recommendations.' },
  { id: 'pitch-deck',       name: 'Pitch Deck',       emoji: '🚀', category: 'Business',   desc: 'Investor pitch: problem, solution, market, traction, and the ask.' },
  { id: 'business-plan',    name: 'Business Plan',    emoji: '📝', category: 'Business',   desc: 'Full business plan with exec summary, market analysis, and projections.' },
  { id: 'project-proposal', name: 'Project Proposal', emoji: '📑', category: 'Operations', desc: 'Professional proposal with scope, timeline, investment, and terms.' },
]

const FAQ_ITEMS = [
  {
    q: 'Is BrandFox really free?',
    a: 'Yes — 100% free. No credit card, no subscription tiers, and no watermarks on your exported PDFs. Build and download as many documents as you need.',
  },
  {
    q: 'What documents can I create with BrandFox?',
    a: 'BrandFox includes two builders: the Resume Builder for ATS-friendly resumes and CVs, and the Report Builder for business reports, financial statements, company profiles, investor decks, and proposals.',
  },
  {
    q: 'Are the resume templates ATS-compatible?',
    a: 'Yes. Most templates are built with ATS compatibility in mind. ATS Classic, ATS Minimal, Professional, and Technical are specifically optimized — they use clean formatting, standard fonts, and proper heading hierarchy that applicant tracking systems can parse correctly.',
  },
  {
    q: 'Can I export my documents as PDF?',
    a: 'Yes. Click the "Export PDF" button at any time to download a pixel-perfect, print-ready PDF. No watermarks, no limits — export as often as you like.',
  },
  {
    q: 'How many documents can I create?',
    a: 'As many as you need. Keep separate resume versions for different job roles and multiple reports for different clients, and switch between them instantly.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes. Your data is stored securely in your personal account via Firebase Firestore with strict security rules — no other user can access your documents. We never sell, share, or use your content to train AI models.',
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

/* ── ContactForm ────────────────────────────────────────────────────────────── */
function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to send.')
      setStatus('success')
      setName(''); setEmail(''); setMessage('')
    } catch (err) {
      setErrorMsg((err as Error).message)
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  const inputCls = `w-full rounded-lg px-4 py-2.5 text-sm outline-none transition`
  const inputStyle = {
    background: '#0F0C08',
    border: `1px solid ${C.chocBorder}`,
    color: C.text,
  }
  const inputFocus = {
    border: `1px solid ${C.goldBorder}`,
    boxShadow: `0 0 0 2px rgba(201,168,76,.08)`,
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: C.matteCard, border: `1px solid ${C.goldBorder}` }}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.oceanFaint, border: `1px solid ${C.oceanLight}40` }}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.oceanLight }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-white">Message sent!</p>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>Thanks for reaching out. We&apos;ll get back to you soon.</p>
        <button onClick={() => setStatus('idle')} className="mt-5 text-xs transition" style={{ color: C.goldDim }}
          onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
          onMouseLeave={e => (e.currentTarget.style.color = C.goldDim)}
        >Send another message</button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl p-6 sm:p-8"
      style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}` }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>Name</span>
          <input
            required value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className={inputCls} style={inputStyle}
            onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>Email</span>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls} style={inputStyle}
            onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
            onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>Message</span>
        <textarea
          required rows={5} value={message} onChange={e => setMessage(e.target.value)}
          placeholder="How can we help?"
          className={`${inputCls} resize-none`} style={inputStyle}
          onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
          onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
        />
      </label>

      {status === 'error' && (
        <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5' }}>
          {errorMsg}
        </div>
      )}

      <button
        type="submit" disabled={busy}
        className="rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
        onMouseEnter={e => !busy && ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = 'none')}
      >
        {busy ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}

/* ── LandingPage ────────────────────────────────────────────────────────────── */
function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-10 sm:py-4"
        style={{ borderBottom: `1px solid ${C.goldBorder}`, background: 'rgba(7,8,9,.7)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center">
          <Image src="/logo.png" alt="BrandFox" width={140} height={40} className="h-7 w-auto object-contain sm:h-9" priority />
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {(['Products', 'How It Works', 'Templates', 'FAQ', 'Contact'] as const).map((label) => (
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
          <Link href="/login" className="hidden sm:block rounded-md px-4 py-2 text-sm font-medium transition" style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >Sign In</Link>
          <Link href="/login" className="anim-glow rounded-md px-3 py-2 text-xs font-semibold text-white transition sm:px-4 sm:text-sm"
            style={{ background: `linear-gradient(135deg, ${C.chocMid}, ${C.gold})` }}
          >
            <span className="sm:hidden">Start Free</span>
            <span className="hidden sm:inline">Get Started Free</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="sm:hidden rounded-md p-2 transition"
            style={{ color: C.textMuted }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden relative z-10" style={{ background: 'rgba(7,8,9,.97)', borderBottom: `1px solid ${C.goldBorder}` }}>
          <div className="flex flex-col gap-1 px-4 py-3">
            {(['Products', 'How It Works', 'Templates', 'FAQ', 'Contact'] as const).map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium transition"
                style={{ color: C.text }}
              >
                {label}
              </a>
            ))}
            <div className="mt-2 border-t pt-3" style={{ borderColor: C.goldBorder }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-lg py-2.5 text-center text-sm font-medium transition"
                style={{ color: C.textMuted }}
              >Sign In</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="mt-2 block w-full rounded-lg py-3 text-center text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
              >Get Started Free</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12 text-center sm:px-6 sm:py-28">
        <div className="anim-badge mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium sm:mb-6"
          style={{ border: `1px solid ${C.oceanLight}40`, background: C.oceanFaint, color: C.oceanLight }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: C.oceanLight }} />
          Resume Builder &nbsp;&middot;&nbsp; Report Builder &nbsp;&middot;&nbsp; More coming soon
        </div>

        <h1 className="anim-hero mt-2 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Create Professional Documents
          <span className="mt-1 block">
            <span className="anim-shimmer">That Make an Impact</span>
          </span>
        </h1>

        <p className="anim-hero-delay mx-auto mt-5 max-w-2xl text-sm leading-relaxed sm:mt-6 sm:text-base" style={{ color: C.textMuted }}>
          BrandFox is the free professional document platform for job seekers and businesses.
          Build <strong style={{ color: C.text }}>ATS-friendly resumes</strong>, create <strong style={{ color: C.text }}>business reports</strong>,
          financial statements, and investor decks — all from one platform.
          No subscription. No credit card. Ever.
        </p>

        <div className="anim-hero-d2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login"
            className="anim-glow-gold w-full rounded-lg px-8 py-3.5 text-sm font-bold text-white transition sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
          >
            Build My Resume — It&apos;s Free
          </Link>
          <Link href="/login"
            className="anim-glow-teal w-full rounded-lg px-8 py-3.5 text-sm font-medium text-white transition sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanLight} 100%)` }}
          >
            Create a Report — Free
          </Link>
        </div>

        <p className="mt-5 text-xs" style={{ color: C.textMuted }}>
          Trusted by job seekers, business owners, and professionals across industries
        </p>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-6 sm:px-6">
        <div className="grid grid-cols-3 divide-x rounded-xl py-4 sm:py-5"
          style={{ background: C.matteCardMid, border: `1px solid ${C.goldBorder}`, '--tw-divide-color': C.goldBorder } as React.CSSProperties}
        >
          {[
            { value: '2',    label: 'Document Builders' },
            { value: '0',    label: 'Watermarks on PDF Export' },
            { value: '100%', label: 'Free — No Hidden Fees' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5 px-1 text-center sm:px-4">
              <span className="text-xl font-bold sm:text-2xl" style={{ color: C.gold }}>{s.value}</span>
              <span className="text-[11px] leading-tight sm:text-xs" style={{ color: C.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Choose Your Workspace ────────────────────────────────────────── */}
      <section id="products" className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          Products
        </div>
        <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
          Choose Your Workspace
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-sm leading-relaxed" style={{ color: C.textMuted }}>
          BrandFox gives you two powerful builders in one platform. Pick the one you need — or use both.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Resume Builder product card */}
          <div className="flex flex-col rounded-2xl p-7"
            style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `3px solid ${C.gold}` }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: 'rgba(201,168,76,.12)', border: `1px solid ${C.goldBorder}` }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.gold }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold" style={{ color: C.goldLight }}>Resume Builder</h3>
            <p className="mb-5 text-sm leading-relaxed" style={{ color: C.textMuted }}>
              Create ATS-friendly resumes and CVs with professionally designed templates. Stand out to recruiters and beat automated screening systems.
            </p>
            <ul className="mb-6 space-y-2 text-sm" style={{ color: C.textMuted }}>
              {[
                '8 ATS-optimized resume templates',
                'Real-time preview with live editing',
                'Multiple resume versions per account',
                'Custom fonts, colors & page sizes',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.gold }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex gap-3">
              <Link href="/login"
                className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
              >
                Create Resume
              </Link>
              <a href="#templates"
                className="rounded-lg px-4 py-2.5 text-sm font-medium transition"
                style={{ border: `1px solid ${C.goldBorder}`, background: C.goldFaint, color: C.goldLight }}
              >
                Browse Templates
              </a>
            </div>
          </div>

          {/* Report Builder product card */}
          <div className="flex flex-col rounded-2xl p-7"
            style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `3px solid ${C.oceanLight}` }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: C.oceanFaint, border: `1px solid ${C.oceanLight}30` }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.oceanLight }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold" style={{ color: C.oceanLight }}>Report Builder</h3>
            <p className="mb-5 text-sm leading-relaxed" style={{ color: C.textMuted }}>
              Create business reports, financial statements, company profiles, investor decks, and proposals with professional layouts and design packs.
            </p>
            <ul className="mb-6 space-y-2 text-sm" style={{ color: C.textMuted }}>
              {[
                'Drag-and-drop block editor',
                'Tables, charts, KPIs & rich text',
                'Excel / CSV data import',
                'Professional design themes',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: C.oceanLight }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex gap-3">
              <Link href="/login"
                className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanLight} 100%)` }}
              >
                Create Report
              </Link>
              <a href="#report-templates"
                className="rounded-lg px-4 py-2.5 text-sm font-medium transition"
                style={{ border: `1px solid ${C.oceanLight}40`, background: C.oceanFaint, color: C.oceanLight }}
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          How It Works
        </div>
        <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
          Create professional documents in 3 simple steps
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="relative rounded-xl p-5 text-center sm:p-7"
              style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}`, borderTop: `3px solid ${C.gold}` }}
            >
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
      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-12 sm:px-6">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          Features
        </div>
        <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
          Everything you need to create great documents
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
      <section id="templates" className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-24">
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
            Use a Resume Template — Free →
          </Link>
        </div>
      </section>

      {/* ── Report Templates ─────────────────────────────────────────────── */}
      <section id="report-templates" className="relative z-10 mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          Report Templates
        </div>
        <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
          7 professional report templates
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-sm leading-relaxed" style={{ color: C.textMuted }}>
          From financial statements to pitch decks. Each template comes pre-filled with structure and sample content — just replace the numbers with yours.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_TEMPLATE_LIST.map((tpl) => (
            <Link
              href="/login"
              key={tpl.id}
              className="block rounded-xl p-4 transition-all duration-200"
              style={{ background: C.matteCard, border: `1px solid ${C.chocBorder}` }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = `${C.oceanLight}50`
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px rgba(13,144,128,.10)`
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.chocBorder
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none">{tpl.emoji}</span>
                  <span className="text-sm font-semibold leading-tight truncate" style={{ color: C.oceanLight }}>{tpl.name}</span>
                </div>
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: C.oceanFaint, color: C.oceanMid, border: `1px solid ${C.oceanLight}25` }}
                >{tpl.category}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{tpl.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/login"
            className="inline-block rounded-lg px-8 py-3 text-sm font-semibold text-white transition"
            style={{ background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanLight} 100%)` }}
          >
            Use a Report Template — Free →
          </Link>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 mx-auto max-w-2xl px-5 py-14 sm:px-6 sm:py-24">
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
      <section className="relative z-10 mx-auto max-w-3xl px-5 pb-16 sm:px-6 sm:pb-24">
        <div className="rounded-2xl p-7 text-center sm:p-10"
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
            Your next opportunity starts with a great document
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: C.textMuted }}>
            Build an ATS-ready resume or a professional business report in minutes.
            Free forever — no credit card, no watermarks, no limits.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login"
              className="anim-glow inline-block rounded-lg px-8 py-3.5 text-sm font-bold text-white transition"
              style={{ background: `linear-gradient(135deg, ${C.chocMid} 0%, ${C.gold} 100%)` }}
            >
              Build My Resume — Free
            </Link>
            <Link href="/login"
              className="inline-block rounded-lg px-8 py-3.5 text-sm font-medium transition"
              style={{ border: `1px solid ${C.oceanLight}40`, background: C.oceanFaint, color: C.oceanLight }}
            >
              Create a Report — Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section id="contact" className="relative z-10 mx-auto max-w-xl px-5 py-14 sm:px-6 sm:py-24">
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: C.oceanLight }}>
          Contact
        </div>
        <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
          Get in touch
        </h2>
        <p className="mx-auto mb-10 max-w-md text-center text-sm leading-relaxed" style={{ color: C.textMuted }}>
          Have a question, suggestion, or just want to say hi? We read every message.
        </p>
        <ContactForm />
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
              <a href="#products" className="transition hover:text-white" style={{ color: C.textMuted }}>Products</a>
              <a href="#how-it-works" className="transition hover:text-white" style={{ color: C.textMuted }}>How It Works</a>
              <a href="#templates" className="transition hover:text-white" style={{ color: C.textMuted }}>Templates</a>
              <a href="#faq" className="transition hover:text-white" style={{ color: C.textMuted }}>FAQ</a>
              <a href="#contact" className="transition hover:text-white" style={{ color: C.textMuted }}>Contact</a>
              <Link href="/privacy" className="transition hover:text-white" style={{ color: C.textMuted }}>Privacy Policy</Link>
              <Link href="/login" className="font-medium transition" style={{ color: C.goldDim }}
                onMouseEnter={e => (e.currentTarget.style.color = C.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = C.goldDim)}
              >Get Started Free →</Link>
            </nav>
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: C.textMuted }}>
            BrandFox is a free professional document creation platform. Build ATS-friendly resumes, business reports,
            financial statements, and more — free forever, no subscription required.
          </p>
        </div>
      </footer>

    </div>
  )
}
