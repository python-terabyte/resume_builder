'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { COLOR_THEMES, DEFAULT_RESUME, ResumeData } from '@/types/resume'
import { useAuth } from '@/lib/AuthContext'
import { signOut } from '@/lib/auth'
import { createResume, saveResume, type ResumeDoc } from '@/lib/resumes'
import Sidebar from './Sidebar'
import ResumePreview from './ResumePreview'
import DocumentsPanel from './DocumentsPanel'

const STORAGE_KEY = 'cvb-accent-color'

function hexToRgbTriplet(hex: string): string {
  const cleaned = hex.replace('#', '')
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned
  const num = parseInt(full, 16)
  if (Number.isNaN(num)) return '99 102 241' // fallback indigo
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `${r} ${g} ${b}`
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function ResumeBuilder() {
  const { user } = useAuth()
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME)
  const [activeSection, setActiveSection] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)
  const [currentDocName, setCurrentDocName] = useState('Untitled Resume')
  const [showDocs, setShowDocs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Hydrate accent color from localStorage on first mount; otherwise prompt user.
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      setResume((prev) => ({ ...prev, accentColor: saved }))
    } else {
      setShowWelcome(true)
    }
    setHydrated(true)
  }, [])

  // Persist accent color whenever it changes (after hydration).
  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, resume.accentColor)
    }
  }, [hydrated, resume.accentColor])

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `${resume.personal.firstName}_${resume.personal.lastName}_Resume`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  })

  const updateResume = useCallback((updater: (prev: ResumeData) => ResumeData) => {
    setResume(updater)
    setSaveState('idle') // mark as dirty
  }, [])

  function pickAccent(color: string) {
    setResume((prev) => ({ ...prev, accentColor: color }))
  }

  function dismissWelcome() {
    setShowWelcome(false)
  }

  async function handleSave() {
    if (!user) return
    setSaveError(null)
    setSaveState('saving')
    try {
      if (currentDocId) {
        await saveResume(user.uid, currentDocId, currentDocName, resume)
      } else {
        const id = await createResume(user.uid, currentDocName, resume)
        setCurrentDocId(id)
      }
      setSaveState('saved')
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (err) {
      console.error('[Resume save failed]', err)
      const code = (err as { code?: string })?.code
      const msg = (err as Error)?.message ?? 'Save failed'
      setSaveState('error')
      setSaveError(code ? `${code} — ${msg}` : msg)
    }
  }

  function handleNew() {
    setResume((prev) => ({ ...DEFAULT_RESUME, accentColor: prev.accentColor }))
    setCurrentDocId(null)
    setCurrentDocName('Untitled Resume')
    setShowDocs(false)
    setSaveState('idle')
  }

  function handleOpenDoc(d: ResumeDoc) {
    setResume(d.resume)
    setCurrentDocId(d.id)
    setCurrentDocName(d.name || 'Untitled Resume')
    setShowDocs(false)
    setActiveSection('')
    setSaveState('saved')
    window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
  }

  return (
    <div
      className="flex h-screen flex-col bg-[#0f0f1a] font-sans"
      style={{ '--accent-rgb': hexToRgbTriplet(resume.accentColor) } as React.CSSProperties}
    >
      {/* Top Nav */}
      <header className="no-print flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#1a1a2e] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <input
            value={currentDocName}
            onChange={(e) => { setCurrentDocName(e.target.value); setSaveState('idle') }}
            className="min-w-0 max-w-[180px] rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none transition focus:bg-white/5 sm:max-w-[260px]"
            placeholder="Untitled Resume"
          />
          {saveState === 'saving' && <span className="hidden text-xs text-slate-500 sm:inline">Saving…</span>}
          {saveState === 'saved' && <span className="hidden text-xs text-emerald-400 sm:inline">Saved</span>}
          {saveState === 'error' && (
            <span className="hidden text-xs text-red-400 sm:inline" title={saveError ?? ''}>Save failed</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleSave}
            disabled={!user || saveState === 'saving'}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50 sm:px-3"
            title="Save to cloud"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 sm:px-3"
            title="My Resumes"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="hidden sm:inline">Docs</span>
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-110 active:brightness-95 sm:px-3"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          {user && (
            <UserMenu
              user={user}
              open={showUserMenu}
              onToggle={() => setShowUserMenu((v) => !v)}
              onClose={() => setShowUserMenu(false)}
              onNew={handleNew}
              onDocs={() => { setShowUserMenu(false); setShowDocs(true) }}
            />
          )}
        </div>
      </header>

      {saveState === 'error' && saveError && (
        <div className="no-print flex shrink-0 items-start justify-between gap-3 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-red-300">Save failed:</span>{' '}
            <span className="break-words">{saveError}</span>
          </div>
          <button
            onClick={() => { setSaveState('idle'); setSaveError(null) }}
            className="shrink-0 rounded p-0.5 text-red-300 hover:bg-red-500/20"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (overlay on mobile, push on md+) */}
        <div
          className={`no-print fixed inset-y-0 left-0 z-30 md:relative md:z-auto transition-all duration-300 overflow-hidden shadow-2xl md:shadow-none ${
            !isSidebarOpen
              ? 'w-0'
              : activeSection
              ? 'w-full sm:w-[440px] md:w-[560px] lg:w-[620px]'
              : 'w-[200px]'
          }`}
        >
          <Sidebar
            resume={resume}
            updateResume={updateResume}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </div>

        {/* Mobile backdrop when sidebar is open */}
        {isSidebarOpen && activeSection && (
          <div
            onClick={() => setActiveSection('')}
            className="no-print fixed inset-0 z-20 bg-black/40 md:hidden"
            aria-hidden
          />
        )}

        {/* Preview area */}
        <div className="flex min-w-0 flex-1 flex-col items-center overflow-auto bg-[#0f0f1a] p-3 sm:p-6 panel-scroll">
          <div className="mb-4 hidden items-center gap-3 text-xs text-slate-500 sm:flex">
            <span>A4 Preview</span>
            <span>·</span>
            <span>210mm × 297mm</span>
          </div>
          <div
            className="origin-top scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-[0.85]"
            style={{ transformOrigin: 'top center', marginBottom: '-80px' }}
          >
            <ResumePreview ref={previewRef} resume={resume} />
          </div>
        </div>
      </div>

      {showWelcome && (
        <WelcomeModal
          accentColor={resume.accentColor}
          onPick={pickAccent}
          onDismiss={dismissWelcome}
        />
      )}

      {showDocs && user && (
        <DocumentsPanel
          uid={user.uid}
          currentDocId={currentDocId}
          onOpen={handleOpenDoc}
          onClose={() => setShowDocs(false)}
          onCreateNew={handleNew}
        />
      )}
    </div>
  )
}

function UserMenu({
  user,
  open,
  onToggle,
  onClose,
  onNew,
  onDocs,
}: {
  user: { displayName: string | null; email: string | null; photoURL: string | null }
  open: boolean
  onToggle: () => void
  onClose: () => void
  onNew: () => void
  onDocs: () => void
}) {
  const initials = (user.displayName || user.email || '?').slice(0, 1).toUpperCase()
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white transition hover:bg-white/10"
        title={user.email ?? 'Account'}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-white/10 bg-[#1a1a2e] py-1 shadow-2xl">
            <div className="px-3 py-2 border-b border-white/10">
              <div className="truncate text-sm font-semibold text-white">
                {user.displayName || user.email?.split('@')[0]}
              </div>
              {user.email && <div className="truncate text-xs text-slate-400">{user.email}</div>}
            </div>
            <MenuItem onClick={() => { onClose(); onNew() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Resume
            </MenuItem>
            <MenuItem onClick={() => { onClose(); onDocs() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              My Resumes
            </MenuItem>
            <div className="my-1 border-t border-white/10" />
            <MenuItem onClick={() => { onClose(); signOut() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out
            </MenuItem>
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
    >
      {children}
    </button>
  )
}

function WelcomeModal({
  accentColor,
  onPick,
  onDismiss,
}: {
  accentColor: string
  onPick: (c: string) => void
  onDismiss: () => void
}) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
        <div className="px-6 pt-6 pb-3">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h2 className="text-center text-xl font-bold text-white">Welcome to Resume Builder</h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Pick a theme color to get started. Both your resume and the app will use it. You can change it any time from <span className="text-white font-medium">Appearance</span>.
          </p>
        </div>

        <div className="px-6 pb-4">
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Theme Color
          </label>
          <div className="flex flex-wrap gap-3">
            {COLOR_THEMES.map((theme) => {
              const active = accentColor === theme.value
              return (
                <button
                  key={theme.value}
                  onClick={() => onPick(theme.value)}
                  title={theme.name}
                  style={{ backgroundColor: theme.value }}
                  className={`h-9 w-9 rounded-full transition hover:scale-110 ${
                    active ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e]' : ''
                  }`}
                />
              )
            })}
            <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-white/20 transition hover:scale-110">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onPick(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-3">
          <button
            onClick={onDismiss}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
