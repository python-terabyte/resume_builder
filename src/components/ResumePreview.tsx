'use client'

import { Fragment, forwardRef, useEffect, useRef, useState } from 'react'
import { PAGE_SIZES, ResumeData } from '@/types/resume'
import { TEMPLATE_COMPONENTS } from './templates'

interface ResumePreviewProps {
  resume: ResumeData
}

// CSS px per millimeter at 96 DPI (the constant browsers use for `mm` units)
const PX_PER_MM = 3.7795275591

// Header/footer band heights on continuation pages (in mm)
const HEADER_MM = 12
const FOOTER_MM = 10

const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(({ resume }, ref) => {
  const { typography, templateId } = resume
  const Template = TEMPLATE_COMPONENTS[templateId] ?? TEMPLATE_COMPONENTS['modern-gradient']
  const pageMeta = PAGE_SIZES.find((s) => s.id === resume.pageSize) ?? PAGE_SIZES[0]

  const pageWidthMm = parseFloat(pageMeta.width)
  const pageHeightMm = parseFloat(pageMeta.height)
  const pageHeightPx = pageHeightMm * PX_PER_MM
  const headerPx = HEADER_MM * PX_PER_MM
  const footerPx = FOOTER_MM * PX_PER_MM
  const continuationContentPx = pageHeightPx - headerPx - footerPx

  // Measure rendered template height to derive page count
  const measureRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    const node = measureRef.current
    if (!node) return
    const update = () => setContentHeight(node.scrollHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [resume])

  // Page 1 holds a full page of content; pages 2+ each hold (pageHeight - header - footer)
  let pageCount = 1
  if (contentHeight > pageHeightPx) {
    pageCount = 1 + Math.ceil((contentHeight - pageHeightPx) / continuationContentPx)
  }

  const fontStyle = {
    fontFamily: `'${typography.fontFamily}', sans-serif`,
    fontSize: `${typography.fontSize}px`,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacing}em`,
  }

  const personalName =
    `${resume.personal.firstName} ${resume.personal.lastName}`.trim() || 'Resume'

  // Compute marginTop applied to the duplicated template inside each page frame.
  // For page 0 → 0. For page i > 0 → place the content "cursor" so that the
  // content-y immediately after page-1 lands at headerPx inside the frame.
  function contentOffsetForPage(i: number): number {
    if (i === 0) return 0
    const cursor = pageHeightPx + (i - 1) * continuationContentPx
    return cursor - headerPx
  }

  return (
    <>
      {/* Off-screen measurement copy — renders the template once at full
          height so we can determine how many pages it spans. */}
      <div
        ref={measureRef}
        aria-hidden
        className="resume-measure print:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: -99999,
          width: pageMeta.width,
          pointerEvents: 'none',
          ...fontStyle,
        }}
      >
        <Template resume={resume} />
      </div>

      {/* Visible paginated stack — also what react-to-print clones */}
      <div ref={ref} id="resume-preview" className="flex flex-col items-center gap-6 print:gap-0">
        {Array.from({ length: pageCount }, (_, i) => {
          const isLast = i === pageCount - 1
          const offset = contentOffsetForPage(i)
          return (
            <Fragment key={i}>
              {i > 0 && (
                <div className="text-[11px] font-medium uppercase tracking-widest text-slate-500 print:hidden">
                  Page {i + 1} of {pageCount}
                </div>
              )}
              <div
                className="resume-page text-gray-800"
                style={{
                  width: pageMeta.width,
                  height: pageMeta.height,
                  background: '#ffffff',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                  breakAfter: isLast ? 'auto' : 'page',
                  pageBreakAfter: isLast ? 'auto' : 'always',
                }}
              >
                <div style={{ marginTop: -offset, ...fontStyle }}>
                  <Template resume={resume} />
                </div>

                {i > 0 && (
                  <>
                    <PageHeader name={personalName} pageNum={i + 1} totalPages={pageCount} />
                    <PageFooter pageNum={i + 1} totalPages={pageCount} />
                  </>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>
    </>
  )
})

ResumePreview.displayName = 'ResumePreview'
export default ResumePreview

function PageHeader({ name, pageNum, totalPages }: { name: string; pageNum: number; totalPages: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${HEADER_MM}mm`,
        padding: '4mm 14mm',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#6b7280',
        letterSpacing: '0.02em',
      }}
    >
      <span className="truncate">{name}</span>
      <span>
        Page {pageNum} of {totalPages}
      </span>
    </div>
  )
}

function PageFooter({ pageNum, totalPages }: { pageNum: number; totalPages: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${FOOTER_MM}mm`,
        padding: '3mm 14mm',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        color: '#9ca3af',
        letterSpacing: '0.02em',
      }}
    >
      Page {pageNum} of {totalPages}
    </div>
  )
}
