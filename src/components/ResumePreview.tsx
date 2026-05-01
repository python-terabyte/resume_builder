'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import { PAGE_SIZES, ResumeData } from '@/types/resume'
import { TEMPLATE_COMPONENTS, TEMPLATE_FOOTER_META, TEMPLATE_SIDEBAR_META } from './templates'

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
  const sidebarMeta = TEMPLATE_SIDEBAR_META[templateId]
  const sidebarColor = resume.accentColor
  const footerMeta = TEMPLATE_FOOTER_META[templateId]
  const footerColor = footerMeta ? resume.accentColor : undefined
  const pageMeta = PAGE_SIZES.find((s) => s.id === resume.pageSize) ?? PAGE_SIZES[0]

  const pageWidthCss = pageMeta.width
  const pageHeightCss = pageMeta.height
  const pageHeightMm = parseFloat(pageHeightCss)
  const pageHeightPx = pageHeightMm * PX_PER_MM
  const headerPx = HEADER_MM * PX_PER_MM
  const footerPx = FOOTER_MM * PX_PER_MM
  // Page 1: no header, but has footer → content area = pageHeight - footer
  // Pages 2+: header + footer → content area = pageHeight - header - footer
  const firstPageContentPx = pageHeightPx - footerPx
  const continuationContentPx = pageHeightPx - headerPx - footerPx

  // Measure rendered template height + section heading offsets to derive page breaks
  const measureRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const [lineBottoms, setLineBottoms] = useState<number[]>([])

  useEffect(() => {
    const node = measureRef.current
    if (!node) return
    const update = () => {
      setContentHeight(node.scrollHeight)
      const containerTop = node.getBoundingClientRect().top
      // Collect the bottom of every rendered line box across the whole resume.
      // Each entry is a candidate page-break offset: the page can end right
      // after that line, with the next page starting on the line after.
      // This is line-aware pagination, no glyph ever gets bisected, and each
      // page is filled with as much content as fits.
      const bottoms: number[] = []
      const elements = node.querySelectorAll('*')
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        // skip invisible / empty
        if (rect.height === 0) return
        const bottom = rect.bottom - containerTop
        if (bottom > 0) {
          bottoms.push(bottom)
        }
      })
      bottoms.sort((a, b) => a - b)
      setLineBottoms(bottoms)
    }
    update()
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(update).catch(() => {})
    }

    let timeout: any

    const observer = new ResizeObserver(() => {
      clearTimeout(timeout)
      timeout = setTimeout(update, 50)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [resume])

  // Each page ends right after the latest line whose bottom fits in its
  // natural capacity. Falls back to a hard cut at naturalEnd only when no
  // line-bottom is available in the range (extremely rare, only with empty
  // pages).
  const pageStarts: number[] = (() => {
    if (contentHeight === 0) return [0]
    const starts = [0]
    let pageStart = 0
    let capacity = firstPageContentPx
    const candidates = lineBottoms

    while (true) {
      const naturalEnd = pageStart + capacity
      if (naturalEnd >= contentHeight) break

      let snapAt = -1
      let bestFit = -1

      for (const t of candidates) {
        if (t > pageStart && t <= naturalEnd) {
          bestFit = t
        }
        else if (t > naturalEnd) break
      }

      const MIN_FILL_RATIO = 0.93
      if (bestFit > 0) {
        const fillRatio = (bestFit - pageStart) / capacity
        if (fillRatio >= MIN_FILL_RATIO) {
          snapAt = bestFit
        }
      }

      const nextStart = snapAt > 0 ? snapAt : naturalEnd
      if (nextStart <= pageStart) break
      starts.push(nextStart)
      pageStart = nextStart
      capacity = continuationContentPx
    }
    return starts
  })()

  const pageCount = pageStarts.length

  // Tailwind text-* classes use rem (relative to html root = 16px).
  // Multiplying by 1.6 maps the slider's default value of 10 to 16px,
  // so at the default setting em-based overrides produce the same sizes
  // as the original rem-based classes (backward compatible).
  const fontStyle = {
    fontFamily: `'${typography.fontFamily}', sans-serif`,
    fontSize: `${typography.fontSize * 1.6}px`,
    lineHeight: typography.lineHeight,
    letterSpacing: `${typography.letterSpacing}em`,
  }

  // For each page i: the content cursor is pageStarts[i]. We position the
  // duplicated template with marginTop so that content_y = pageStarts[i] lands
  // at frame_y = (page-1 → 0 because no header on page 1; page 2+ → headerPx).
  function contentOffsetForPage(i: number): number {
    const frameTop = i === 0 ? 0 : headerPx
    return pageStarts[i] - frameTop
  }

  // How many pixels of actual content this page shows.
  function visibleContentForPage(i: number): number {
    const start = pageStarts[i]
    const end = i + 1 < pageStarts.length ? pageStarts[i + 1] : contentHeight
    return Math.max(0, end - start)
  }

  return (
    <>
      {/* Off-screen measurement copy, renders the template once at full
          height so we can determine how many pages it spans. */}
      <div
        ref={measureRef}
        aria-hidden
        className="resume-measure resume-scale-text"
        style={{
          position: 'fixed',
          top: 0,
          left: -99999,
          width: pageWidthCss,
          pointerEvents: 'none',
          ...fontStyle,
        }}
      >
        <Template resume={resume} />
      </div>

      {/* Visible paginated stack — screen only, never printed */}
      <div id="resume-preview" className="flex flex-col items-center gap-6 print:hidden">
        {Array.from({ length: pageCount }, (_, i) => {
          const isLast = i === pageCount - 1
          const offset = contentOffsetForPage(i)
          const frameTop = i === 0 ? 0 : headerPx
          const visible = visibleContentForPage(i)
          // Cover from end-of-content down to footer top, hiding any overflow
          // that would otherwise leak into the empty space (and the footer band).
          const coverTop = frameTop + visible - 0.5
          const coverBottom = footerPx
          return (
              <div
                key={i}
                className="resume-page text-gray-800"
                style={{
                  width: pageWidthCss,
                  height: pageHeightCss,
                  background: '#ffffff',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                  breakAfter: isLast ? 'auto' : 'page',
                  pageBreakAfter: isLast ? 'auto' : 'always',
                }}
              >
                <div
                  className="resume-scale-text"
                  style={{
                    transform: `translateY(-${offset}px)`,
                    willChange: 'transform',
                    ...fontStyle,
                  }}
                >
                  <Template resume={resume} />
                </div>

                {/* Opaque underflow cover: hides anything below this page's
                    visible content. For sidebar templates the cover is split —
                    the sidebar column keeps its accent color while the main
                    column gets a white cover, so the sidebar fill extends to
                    the footer on every page. */}
                {sidebarMeta ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: coverTop,
                      left: 0,
                      width: `${sidebarMeta.widthFraction * 100}%`,
                      bottom: coverBottom,
                      background: sidebarColor,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: coverTop,
                      left: `${sidebarMeta.widthFraction * 100}%`,
                      right: 0,
                      bottom: coverBottom,
                      background: '#ffffff',
                      pointerEvents: 'none',
                    }} />
                  </>
                ) : (
                  <div style={{
                    position: 'absolute',
                    top: coverTop,
                    left: 0,
                    right: 0,
                    bottom: coverBottom,
                    background: '#ffffff',
                    pointerEvents: 'none',
                  }} />
                )}

                {i > 0 && (
                  <PageHeader
                    sidebar={sidebarMeta ? { widthFraction: sidebarMeta.widthFraction, color: sidebarColor } : undefined}
                  />
                )}
                <PageFooter
                  sidebar={sidebarMeta ? { widthFraction: sidebarMeta.widthFraction, color: sidebarColor } : undefined}
                  accentColor={footerColor}
                />
              </div>
          )
        })}
      </div>

      {/* PDF export target: natural full-height template render, no clip/transform.
          Off-screen so users don't see it; html2canvas can still render it
          because it's not display:none or visibility:hidden. */}
      <div
        ref={ref}
        id="resume-print"
        className="resume-scale-text"
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: pageWidthCss,
          pointerEvents: 'none',
          ...fontStyle,
        }}
      >
        <Template resume={resume} />
      </div>
    </>
  )
})

ResumePreview.displayName = 'ResumePreview'
export default ResumePreview

function PageHeader({ sidebar }: { sidebar?: { widthFraction: number; color: string } }) {
  if (!sidebar) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${HEADER_MM}mm`, background: '#ffffff' }} />
    )
  }
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${HEADER_MM}mm` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${sidebar.widthFraction * 100}%`, background: sidebar.color }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${(1 - sidebar.widthFraction) * 100}%`, background: '#ffffff' }} />
    </div>
  )
}

function PageFooter({ sidebar, accentColor }: { sidebar?: { widthFraction: number; color: string }; accentColor?: string }) {
  if (!sidebar) {
    return (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${FOOTER_MM}mm`, background: accentColor ?? '#ffffff' }} />
    )
  }
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${FOOTER_MM}mm` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${sidebar.widthFraction * 100}%`, background: sidebar.color }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${(1 - sidebar.widthFraction) * 100}%`, background: '#ffffff' }} />
    </div>
  )
}
