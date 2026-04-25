'use client'

import { useState, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import { DEFAULT_RESUME, ResumeData } from '@/types/resume'
import Sidebar from './Sidebar'
import ResumePreview from './ResumePreview'

export default function ResumeBuilder() {
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME)
  const [activeSection, setActiveSection] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)

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
  }, [])

  return (
    <div className="flex h-screen flex-col bg-[#0f0f1a] font-sans">
      {/* Top Nav */}
      <header className="no-print flex h-[52px] shrink-0 items-center justify-between border-b border-white/10 bg-[#1a1a2e] px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="hidden text-sm font-semibold text-white sm:inline">Resume Builder</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setResume(DEFAULT_RESUME)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            Reset
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 active:bg-indigo-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </header>

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
    </div>
  )
}
