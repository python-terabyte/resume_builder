'use client'

import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { COLOR_THEMES, DEFAULT_RESUME, PAGE_SIZES, type PageSize, ResumeData } from '@/types/resume'
import { useAuth } from '@/lib/AuthContext'
import { signOut } from '@/lib/auth'
import { createResume, getResume, listResumes, saveResume, type ResumeDoc } from '@/lib/resumes'
import Sidebar from './Sidebar'
import ResumePreview from './ResumePreview'
import DocumentsPanel from './DocumentsPanel'
import ShareModal from './ShareModal'
import VersionHistoryModal from './VersionHistoryModal'

const STORAGE_KEY = 'cvb-accent-color'
const THEME_KEY = 'cvb-app-theme'

function hexToRgbTriplet(hex: string): string {
  const cleaned = hex.replace('#', '')
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned
  const num = parseInt(full, 16)
  if (Number.isNaN(num)) return '99 102 241'
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `${r} ${g} ${b}`
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type PickerState = 'loading' | 'show' | 'hide'

export default function ResumeBuilder({ onGoWorkspace, initialDocId }: { onGoWorkspace?: () => void; initialDocId?: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const goWorkspace = () => { if (onGoWorkspace) { onGoWorkspace() } else { router.push('/workspace') } }
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
  const [isDirty, setIsDirty] = useState(false)
  const [pickerState, setPickerState] = useState<PickerState>('loading')
  const [pickerDocs, setPickerDocs] = useState<ResumeDoc[]>([])
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem(THEME_KEY) as 'dark' | 'light') ?? 'dark'
    return 'dark'
  })
  const toggleAppTheme = () => setAppTheme((t) => {
    const next = t === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') localStorage.setItem(THEME_KEY, next)
    return next
  })
  const previewRef = useRef<HTMLDivElement>(null)

  // Hydrate accent color from localStorage on first mount.
  // Also close sidebar by default on mobile (< 768px).
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      setResume((prev) => ({ ...prev, accentColor: saved }))
    }
    setHydrated(true)
    if (window.innerWidth < 768) setIsSidebarOpen(false)
  }, [])

  // Persist accent color whenever it changes (after hydration).
  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, resume.accentColor)
    }
  }, [hydrated, resume.accentColor])

  // If a specific doc ID was provided via URL, load it directly and skip the picker.
  useEffect(() => {
    if (!initialDocId) return
    getResume(initialDocId)
      .then((doc) => {
        setResume({ ...DEFAULT_RESUME, ...doc.resume, pageSize: doc.resume.pageSize ?? 'A4' })
        setCurrentDocId(doc.id)
        setCurrentDocName(doc.name || 'Untitled Resume')
        setSaveState('saved')
        setIsDirty(false)
        setPickerState('hide')
        window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
      })
      .catch(() => setPickerState('hide'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDocId])

  // On mount: fetch saved docs. If the user has any, show the picker.
  // New users (no docs) go straight to the editor.
  useEffect(() => {
    if (initialDocId) return // handled above
    listResumes()
      .then((docs) => {
        if (docs.length > 0) {
          setPickerDocs(docs)
          setPickerState('show')
        } else {
          setPickerState('hide')
          // First-time user with no accent color yet — show the color picker welcome.
          const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
          if (!saved) setShowWelcome(true)
        }
      })
      .catch(() => {
        setPickerState('hide')
      })
  }, [])

  // Warn before browser refresh/close when there are unsaved changes.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const pageMeta = PAGE_SIZES.find((s) => s.id === resume.pageSize) ?? PAGE_SIZES[0]

  // react-to-print creates an isolated iframe with all stylesheets copied in,
  // triggers the browser's native print pipeline, and tears down the iframe
  // after. This avoids the html2canvas clone approach which caused the preview
  // to visually glitch and produced blank PDFs (body background bled through
  // the transparent template root onto the captured canvas).
  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join('_') + '_Resume',
    // Inject the current accent color so bg-accent / text-accent classes
    // resolve correctly inside the print iframe (the ResumeBuilder ancestor
    // that normally provides --accent-rgb isn't present in the iframe).
    pageStyle: `
      @page { margin: 0; size: ${pageMeta.cssSize} portrait; }
      :root  { --accent-rgb: ${hexToRgbTriplet(resume.accentColor)}; }
      *, *::before, *::after {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    `,
    onBeforePrint: () => Promise.resolve(setIsPdfLoading(true)),
    onAfterPrint: () => setIsPdfLoading(false),
  })

  // On Android (Capacitor), window.print() is unsupported — use html2pdf.js instead
  // and save the resulting PDF directly to the device's Downloads folder via
  // the AndroidBridge JavascriptInterface exposed by MainActivity.
  async function handleAndroidPdf() {
    if (!previewRef.current) return
    setIsPdfLoading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const el = previewRef.current

      // #resume-print lives at position:fixed, left:-99999px so users don't see it.
      // html2canvas cannot render elements outside the viewport — move it on-screen
      // (opacity:0 keeps it invisible) just for the duration of the capture.
      const prev = { left: el.style.left, top: el.style.top, opacity: el.style.opacity }
      el.style.left = '0'
      el.style.top = '0'
      el.style.opacity = '0'

      const jsPdfFormat: Record<string, string> = {
        A4: 'a4', Letter: 'letter', Legal: 'legal', A3: 'a3', A5: 'a5',
      }
      const docName =
        [resume.personal.firstName, resume.personal.lastName].filter(Boolean).join('_') + '_Resume'

      const pdfDoc = await html2pdf()
        .from(el)
        .set({
          margin: 0,
          filename: docName + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            windowWidth: el.scrollWidth,
            windowHeight: el.scrollHeight,
          },
          jsPDF: {
            unit: 'mm',
            format: jsPdfFormat[resume.pageSize] ?? 'a4',
            orientation: 'portrait',
          },
        })
        .toPdf()
        .get('pdf')

      // Restore position
      el.style.left = prev.left
      el.style.top = prev.top
      el.style.opacity = prev.opacity

      const dataUri: string = pdfDoc.output('datauristring')
      const base64 = dataUri.split('base64,')[1]
      ;(window as any).AndroidBridge.savePdf(base64)
    } catch (e) {
      console.error('Android PDF export failed:', e)
      // Restore position even on error
      if (previewRef.current) {
        previewRef.current.style.left = '-99999px'
        previewRef.current.style.top = '0'
        previewRef.current.style.opacity = ''
      }
    } finally {
      setIsPdfLoading(false)
    }
  }

  function handleDownload() {
    if (typeof window !== 'undefined' && (window as any).AndroidBridge) {
      handleAndroidPdf()
    } else {
      handlePrint()
    }
  }

  function updateResume(updater: (prev: ResumeData) => ResumeData) {
    setResume(updater)
    setIsDirty(true)
    setSaveState('idle')
  }

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
        await saveResume(currentDocId, currentDocName, resume)
      } else {
        const id = await createResume(currentDocName, resume)
        setCurrentDocId(id)
        router.replace(`/resume/${id}`)
      }
      setSaveState('saved')
      setIsDirty(false)
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (err) {
      console.error('[Resume save failed]', err)
      const code = (err as { code?: string })?.code
      const msg = (err as Error)?.message ?? 'Save failed'
      setSaveState('error')
      setSaveError(code ? `${code}, ${msg}` : msg)
    }
  }

  function handleNew() {
    setResume((prev) => ({ ...DEFAULT_RESUME, accentColor: prev.accentColor }))
    setCurrentDocId(null)
    setCurrentDocName('Untitled Resume')
    setShowDocs(false)
    setSaveState('idle')
    setIsDirty(false)
    setPickerState('hide')
  }

  function handleOpenDoc(d: ResumeDoc) {
    setResume({
      ...DEFAULT_RESUME,
      ...d.resume,
      pageSize: d.resume.pageSize ?? 'A4',
    })
    setCurrentDocId(d.id)
    setCurrentDocName(d.name || 'Untitled Resume')
    setShowDocs(false)
    setActiveSection('')
    setSaveState('saved')
    setIsDirty(false)
    setPickerState('hide')
    router.replace(`/resume/${d.id}`)
    window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
  }

  const accentStyle = { '--accent-rgb': hexToRgbTriplet(resume.accentColor) } as React.CSSProperties


  // Loading state while checking for saved docs.
  if (pickerState === 'loading') {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-[var(--app-bg)]" data-app-theme={appTheme} style={accentStyle}>
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="anim-orb absolute rounded-full" style={{ width: 560, height: 560, top: -140, right: -140, background: 'radial-gradient(circle, rgba(201,168,76,.13) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="anim-orb-slow absolute rounded-full" style={{ width: 460, height: 460, bottom: -120, left: -120, background: 'radial-gradient(circle, rgba(13,144,128,.11) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="animate-pulse text-slate-400">Loading your resumes...</p>
        </div>
      </div>
    )
  }

  // Resume picker for returning users.
  if (pickerState === 'show') {
    return (
      <div data-app-theme={appTheme} style={accentStyle}>
        <ResumePicker
          docs={pickerDocs}
          userName={user?.name}
          onOpen={handleOpenDoc}
          onNew={handleNew}
          onGoWorkspace={goWorkspace}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-screen flex-col bg-[var(--app-bg)] font-sans"
      data-app-theme={appTheme}
      style={accentStyle}
    >
      {/* Top Nav */}
      <header className="no-print flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-panel)] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-1.5 text-[var(--app-text-2)] transition hover:bg-[var(--app-hover-md)] hover:text-[var(--app-text)]"
            title="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/logoface.png" alt="BrandFox" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              value={currentDocName}
              onChange={(e) => { setCurrentDocName(e.target.value); setIsDirty(true); setSaveState('idle') }}
              className="min-w-0 max-w-[160px] rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-[var(--app-text)] outline-none transition focus:bg-[var(--app-hover)] sm:max-w-[240px]"
              placeholder="Untitled Resume"
            />
            {isDirty && (
              <span title="Unsaved changes" className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            )}
          </div>
          {saveState === 'saving' && <span className="hidden text-xs text-[var(--app-text-3)] sm:inline">Saving...</span>}
          {saveState === 'saved' && <span className="hidden text-xs text-emerald-400 sm:inline">Saved</span>}
          {saveState === 'error' && (
            <span className="hidden text-xs text-red-400 sm:inline" title={saveError ?? ''}>Save failed</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 overflow-x-auto max-w-[calc(100%-180px)] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <button
            onClick={goWorkspace}
            className="flex items-center gap-1.5 rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text-2)] transition hover:bg-[var(--app-hover-md)] sm:px-3"
            title="Back to Workspace"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Workspace</span>
          </button>
          <select
            value={resume.pageSize}
            onChange={(e) =>
              updateResume((prev) => ({ ...prev, pageSize: e.target.value as PageSize }))
            }
            title="Page size"
            className="rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2 py-1.5 text-xs font-medium text-[var(--app-text)] outline-none transition hover:bg-[var(--app-hover-md)] focus:border-accent"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s.id} value={s.id} className="bg-[var(--app-panel)]">{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={!user || saveState === 'saving'}
            className="flex items-center gap-1.5 rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover-md)] disabled:opacity-50 sm:px-3"
            title="Save to cloud"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="hidden sm:inline">Save Progress</span>
          </button>
          {currentDocId && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover-md)] sm:px-3"
              title="Share"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          {currentDocId && (
            <button
              onClick={() => setShowVersionHistory(true)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover-md)] sm:px-3"
              title="Version History"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">History</span>
            </button>
          )}
          <button
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover-md)] sm:px-3"
            title="My Resumes"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="hidden sm:inline">My Resumes</span>
          </button>
          <Link
            href="/report"
            className="flex items-center gap-1.5 rounded-md border border-[var(--app-border-md)] bg-[var(--app-hover)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text-2)] transition hover:bg-[var(--app-hover-md)] sm:px-3"
            title="Report Builder"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Report Builder</span>
          </Link>
          <button
            onClick={handleDownload}
            disabled={isPdfLoading}
            className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-110 active:brightness-95 disabled:opacity-60 sm:px-3"
          >
            {isPdfLoading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="hidden sm:inline">Generating…</span>
                <span className="sm:hidden">…</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>

          <button
            onClick={toggleAppTheme}
            className="rounded-md p-1.5 text-[var(--app-text-2)] transition hover:bg-[var(--app-hover-md)] hover:text-[var(--app-text)]"
            title={appTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {appTheme === 'dark' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {user && (
            <UserMenu
              user={user}
              open={showUserMenu}
              onToggle={() => setShowUserMenu((v) => !v)}
              onClose={() => setShowUserMenu(false)}
              onNew={handleNew}
              onDocs={() => { setShowUserMenu(false); setShowDocs(true) }}
              onGoWorkspace={goWorkspace}
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

      {isDirty && (
        <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-200">
          <span>You have unsaved changes. Save your progress before refreshing or they will be lost.</span>
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="shrink-0 rounded-md bg-amber-500/20 px-2.5 py-1 font-medium text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-50"
          >
            Save now
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`no-print fixed top-[52px] bottom-0 left-0 z-30 md:inset-y-0 md:relative md:z-auto transition-all duration-300 overflow-hidden shadow-2xl md:shadow-none ${
            !isSidebarOpen
              ? 'w-0'
              : activeSection
              ? 'w-full sm:w-[440px] md:w-[560px] lg:w-[620px]'
              : 'w-[60px] sm:w-[200px]'
          }`}
        >
          <Sidebar
            resume={resume}
            updateResume={updateResume}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </div>

        {isSidebarOpen && activeSection && (
          <div
            onClick={() => setActiveSection('')}
            className="no-print fixed top-[52px] inset-x-0 bottom-0 z-20 bg-black/40 md:hidden"
            aria-hidden
          />
        )}

        <div className="relative flex min-w-0 flex-1 overflow-hidden bg-[var(--app-bg)]">
          {/* Ambient orbs */}
          <div className="no-print pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="anim-orb absolute rounded-full" style={{ width: 520, height: 520, top: -120, right: -120, background: 'radial-gradient(circle, rgba(201,168,76,.11) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="anim-orb-slow absolute rounded-full" style={{ width: 420, height: 420, bottom: -100, left: -100, background: 'radial-gradient(circle, rgba(13,144,128,.09) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="absolute rounded-full" style={{ width: 500, height: 200, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(ellipse, rgba(61,26,8,.20) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          </div>
          <div className="relative z-10 flex flex-1 flex-col items-center overflow-auto p-3 sm:p-6 panel-scroll">
            <div className="preview-zoom">
              <ResumePreview ref={previewRef} resume={resume} />
            </div>
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
          currentDocId={currentDocId}
          onOpen={handleOpenDoc}
          onClose={() => setShowDocs(false)}
          onCreateNew={handleNew}
          onOpenShared={(docId) => {
            getResume(docId).then((doc) => {
              setResume({ ...DEFAULT_RESUME, ...doc.resume, pageSize: doc.resume.pageSize ?? 'A4' })
              setCurrentDocId(doc.id)
              setCurrentDocName(doc.name || 'Untitled Resume')
              setShowDocs(false)
              setSaveState('saved')
              setIsDirty(false)
              router.replace(`/resume/${doc.id}`)
              window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
            }).catch((err) => console.error('Failed to open shared resume:', err))
          }}
        />
      )}

      {showShare && currentDocId && (
        <ShareModal
          docId={currentDocId}
          docName={currentDocName}
          onClose={() => setShowShare(false)}
        />
      )}

      {showVersionHistory && currentDocId && (
        <VersionHistoryModal
          docId={currentDocId}
          docName={currentDocName}
          canEdit={true}
          onClose={() => setShowVersionHistory(false)}
          onRestored={() => {
            getResume(currentDocId).then((doc) => {
              setResume({ ...DEFAULT_RESUME, ...doc.resume, pageSize: doc.resume.pageSize ?? 'A4' })
              setCurrentDocName(doc.name || 'Untitled Resume')
              setIsDirty(false)
              setSaveState('saved')
              window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
            }).catch(() => {})
          }}
        />
      )}
    </div>
  )
}

function ResumePicker({
  docs,
  userName,
  onOpen,
  onNew,
  onGoWorkspace,
}: {
  docs: ResumeDoc[]
  userName?: string | null
  onOpen: (doc: ResumeDoc) => void
  onNew: () => void
  onGoWorkspace?: () => void
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] p-6 font-sans">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="anim-orb absolute rounded-full" style={{ width: 600, height: 600, top: -180, right: -160, background: 'radial-gradient(circle, rgba(201,168,76,.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="anim-orb-slow absolute rounded-full" style={{ width: 500, height: 500, bottom: -140, left: -140, background: 'radial-gradient(circle, rgba(13,144,128,.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute rounded-full" style={{ width: 700, height: 300, top: '40%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse, rgba(61,26,8,.28) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Image src="/logoface.png" alt="BrandFox" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--app-text)]">
              Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </h1>
            <p className="mt-0.5 text-sm text-[var(--app-text-2)]">
              Pick a resume to continue editing, or start a new one.
            </p>
          </div>
        </div>

        {/* Doc list */}
        <div className="flex flex-col gap-2">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onOpen(doc)}
              className="flex items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-5 py-4 text-left transition hover:border-accent/50 hover:bg-accent/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--app-text)]">{doc.name || 'Untitled'}</p>
                <p className="mt-0.5 text-xs text-[var(--app-text-3)]">{formatPickerDate(doc.updatedAt)}</p>
              </div>
              <span className="ml-4 shrink-0 text-xs font-medium text-accent">Open →</span>
            </button>
          ))}
        </div>

        {/* New resume */}
        <button
          onClick={onNew}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--app-border-md)] py-4 text-sm font-medium text-[var(--app-text-2)] transition hover:border-accent hover:text-accent"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Resume
        </button>

        {/* Back to Workspace */}
        <div className="mt-6 text-center">
          <button
            onClick={onGoWorkspace}
            className="text-xs text-[var(--app-text-3)] transition hover:text-[var(--app-text-2)]"
          >
            ← Back to Workspace
          </button>
        </div>
      </div>
    </div>
  )
}

function formatPickerDate(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Last edited today'
  if (diffDays === 1) return 'Last edited yesterday'
  if (diffDays < 7) return `Last edited ${diffDays} days ago`
  return `Last edited ${d.toLocaleDateString()}`
}

function UserMenu({
  user,
  open,
  onToggle,
  onClose,
  onNew,
  onDocs,
  onGoWorkspace,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  open: boolean
  onToggle: () => void
  onClose: () => void
  onNew: () => void
  onDocs: () => void
  onGoWorkspace?: () => void
}) {
  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase()
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--app-border-md)] bg-[var(--app-hover)] text-xs font-semibold text-[var(--app-text)] transition hover:bg-[var(--app-hover-md)]"
        title={user.email ?? 'Account'}
      >
        {user.image ? (
          <img src={user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-white/10 bg-[#2D1B11] py-1 shadow-2xl" data-app-theme="dark">
            <div className="px-3 py-2 border-b border-white/10">
              <div className="truncate text-sm font-semibold text-white">
                {user.name || user.email?.split('@')[0]}
              </div>
              {user.email && <div className="truncate text-xs text-slate-400">{user.email}</div>}
            </div>
            <MenuItem onClick={() => { onClose(); onGoWorkspace?.() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Workspace
            </MenuItem>
            <MenuItem onClick={() => { onClose(); onNew() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Resume
            </MenuItem>
            <MenuItem onClick={() => { onClose(); onDocs() }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              My Resumes
            </MenuItem>
            <Link
              href="/report"
              onClick={onClose}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Report Builder
            </Link>
            <div className="my-1 border-t border-white/10" />
            <Link
              href="/privacy"
              onClick={onClose}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Privacy Policy
            </Link>
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
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" data-app-theme="dark">
        <div className="px-6 pt-6 pb-3">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h2 className="text-center text-xl font-bold text-white">Welcome to BrandFox</h2>
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
                    active ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2D1B11]' : ''
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
