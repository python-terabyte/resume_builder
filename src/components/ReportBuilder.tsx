'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import Image from 'next/image'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/lib/AuthContext'
import { signOut } from '@/lib/auth'
import { createReport, listReports, saveReport, type ReportDoc } from '@/lib/reports'
import { REPORT_TEMPLATES, TEMPLATE_CATEGORIES, type ReportTemplate } from '@/lib/report-templates'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  DEFAULT_REPORT, DESIGN_PACKS, DOCUMENT_TYPES,
  type ReportData, type ReportBlock, type ReportPage, type ReportBlockType,
  type DesignPack, type KpiItem, type TableCell,
  type HeadingBlock, type TextBlock, type TableBlock,
  type ImageBlock, type KpiBlock, type DividerBlock, type SpacerBlock,
  type ChartBlock, type ChartDataset, type TocBlock,
  type ShapeItem, type ShapeType, type ShapeTemplate,
} from '@/types/report'

const CHART_PALETTE = ['#2D7DD2','#0D9080','#DC2626','#C9A84C','#a855f7','#f97316','#10b981','#f43f5e']

// ── Types ──────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type PickerState = 'loading' | 'show' | 'hide'

// ── Helpers ────────────────────────────────────────────────────────────────

function getDesignPack(id: string): DesignPack {
  const builtin = DESIGN_PACKS.find((d) => d.id === id)
  if (builtin) return builtin
  try {
    const custom = JSON.parse(localStorage.getItem('report-custom-packs') || '[]') as DesignPack[]
    return custom.find((d) => d.id === id) ?? DESIGN_PACKS[0]
  } catch { return DESIGN_PACKS[0] }
}

function getAllDesignPacks(): DesignPack[] {
  try {
    const custom = JSON.parse(localStorage.getItem('report-custom-packs') || '[]') as DesignPack[]
    return [...DESIGN_PACKS, ...custom]
  } catch { return DESIGN_PACKS }
}

function createBlock(type: ReportBlockType, dp: DesignPack): ReportBlock {
  const id = uuidv4()
  switch (type) {
    case 'heading':
      return { id, type: 'heading', content: 'Section Title', level: 2, align: 'left', color: '' }
    case 'text':
      return { id, type: 'text', content: 'Enter your text here. Click to select and edit in the right panel.', align: 'left' }
    case 'table':
      return {
        id, type: 'table', caption: '',
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          [{ content: '', bold: false, align: 'left' }, { content: '', bold: false, align: 'left' }, { content: '', bold: false, align: 'left' }],
          [{ content: '', bold: false, align: 'left' }, { content: '', bold: false, align: 'left' }, { content: '', bold: false, align: 'left' }],
        ],
        striped: true, bordered: true, headerBg: '', headerText: '',
      }
    case 'image':
      return { id, type: 'image', url: '', alt: '', caption: '', width: 'full', align: 'center' }
    case 'kpi':
      return {
        id, type: 'kpi', title: 'Key Metrics', columns: 3, accentColor: '',
        items: [
          { id: uuidv4(), label: 'Metric 1', value: '0', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
          { id: uuidv4(), label: 'Metric 2', value: '0', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
          { id: uuidv4(), label: 'Metric 3', value: '0', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
        ],
      }
    case 'divider':
      return { id, type: 'divider', style: 'solid', color: '', thickness: 1 }
    case 'spacer':
      return { id, type: 'spacer', height: 24 }
    case 'chart':
      return {
        id, type: 'chart', title: 'Chart Title',
        chartType: 'bar',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { id: uuidv4(), label: 'Series 1', data: [65, 59, 80, 81, 56, 72], color: dp.accentColor || CHART_PALETTE[0] },
        ],
        height: 280,
        showLegend: true,
        showGrid: true,
        sourceFile: '',
      }
    case 'toc':
      return { id, type: 'toc', title: 'Table of Contents', includePageNumbers: true }
  }
}

function createShape(type: ShapeType): ShapeItem {
  const defaults: Partial<Record<ShapeType, Partial<ShapeItem>>> = {
    rect:     { width: 28, height: 14, fill: '#2D7DD2', fillOpacity: 0.85 },
    circle:   { width: 18, height: 18, fill: '#0D9080', fillOpacity: 0.8 },
    triangle: { width: 18, height: 18, fill: '#C9A84C', fillOpacity: 0.9 },
    diamond:  { width: 16, height: 18, fill: '#a855f7', fillOpacity: 0.8 },
    hexagon:  { width: 20, height: 18, fill: '#0D9080', fillOpacity: 0.7 },
    star:     { width: 18, height: 18, fill: '#C9A84C', fillOpacity: 0.9 },
    line:     { width: 40, height: 3,  fill: '#1E3A5F', fillOpacity: 1, stroke: '#1E3A5F', strokeWidth: 3 },
    arrow:    { width: 30, height: 14, fill: '#2D7DD2', fillOpacity: 0.8 },
  }
  return {
    id: uuidv4(), type, x: 5, y: 5, width: 25, height: 15,
    fill: '#2D7DD2', fillOpacity: 1, stroke: 'transparent', strokeWidth: 0,
    opacity: 1, rotation: 0, borderRadius: 0, zIndex: 1,
    ...defaults[type],
  }
}

function getShapeElement(shape: ShapeItem): React.ReactNode {
  const common = {
    fill: shape.fill, fillOpacity: shape.fillOpacity,
    stroke: shape.strokeWidth > 0 ? shape.stroke : 'none',
    strokeWidth: shape.strokeWidth,
  }
  switch (shape.type) {
    case 'rect':     return <rect x="1" y="1" width="98" height="98" rx={shape.borderRadius} {...common} />
    case 'circle':   return <ellipse cx="50" cy="50" rx="49" ry="49" {...common} />
    case 'triangle': return <polygon points="50,2 2,98 98,98" {...common} />
    case 'diamond':  return <polygon points="50,2 98,50 50,98 2,50" {...common} />
    case 'hexagon':  return <polygon points="25,2 75,2 98,50 75,98 25,98 2,50" {...common} />
    case 'star':     return <polygon points="50,2 61,37 98,37 70,58 79,95 50,72 21,95 30,58 2,37 39,37" {...common} />
    case 'line':     return <line x1="2" y1="50" x2="98" y2="50" stroke={shape.stroke || shape.fill} strokeWidth={Math.max(shape.strokeWidth, 3)} strokeLinecap="round" fill="none" />
    case 'arrow':    return <polygon points="2,30 62,30 62,10 98,50 62,90 62,70 2,70" {...common} />
  }
}

function getShapeTemplates(): ShapeTemplate[] {
  try { return JSON.parse(localStorage.getItem('report-shape-templates') || '[]') } catch { return [] }
}
function saveShapeTemplate(name: string, shapes: ShapeItem[]) {
  const tpl: ShapeTemplate = { id: `tpl-${Date.now()}`, name, shapes }
  localStorage.setItem('report-shape-templates', JSON.stringify([...getShapeTemplates(), tpl]))
}
function deleteShapeTemplate(id: string) {
  localStorage.setItem('report-shape-templates', JSON.stringify(getShapeTemplates().filter((t) => t.id !== id)))
}

function formatDate(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Edited today'
  if (diffDays === 1) return 'Edited yesterday'
  if (diffDays < 7) return `Edited ${diffDays} days ago`
  return `Edited ${d.toLocaleDateString()}`
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ReportBuilder() {
  const { user } = useAuth()
  const [report, setReport] = useState<ReportData>(DEFAULT_REPORT)
  const [docId, setDocId] = useState<string | null>(null)
  const [docName, setDocName] = useState('Untitled Report')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(report.pages[0]?.id ?? null)
  const [leftTab, setLeftTab] = useState<'pages' | 'insert'>('pages')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [pickerState, setPickerState] = useState<PickerState>('loading')
  const [pickerDocs, setPickerDocs] = useState<ReportDoc[]>([])
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [isDocxLoading, setIsDocxLoading] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [selectedShapePageId, setSelectedShapePageId] = useState<string | null>(null)
  const [isCoverSelected, setIsCoverSelected] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dp = getDesignPack(report.designPackId)

  useEffect(() => {
    listReports()
      .then((docs) => {
        if (docs.length > 0) {
          setPickerDocs(docs)
          setPickerState('show')
        } else {
          setPickerState('hide')
          setShowTemplatePicker(true)
        }
      })
      .catch(() => { setPickerState('hide'); setShowTemplatePicker(true) })
  }, [])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Debounced autosave
  const triggerAutoSave = useCallback((r: ReportData, name: string, id: string | null) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (!user) return
      setSaveState('saving')
      try {
        if (id) {
          await saveReport(id, name, r)
        } else {
          const newId = await createReport(name, r)
          setDocId(newId)
        }
        setSaveState('saved')
        setIsDirty(false)
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
      } catch (err) {
        setSaveState('error')
        setSaveError((err as Error)?.message ?? 'Auto-save failed')
      }
    }, 1500)
  }, [user])

  function updateReport(updater: (prev: ReportData) => ReportData) {
    const next = updater(report)
    setReport(next)
    setIsDirty(true)
    setSaveState('idle')
    triggerAutoSave(next, docName, docId)
  }

  async function handleSave() {
    if (!user) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveError(null)
    setSaveState('saving')
    try {
      if (docId) {
        await saveReport(docId, docName, report)
      } else {
        const id = await createReport(docName, report)
        setDocId(id)
      }
      setSaveState('saved')
      setIsDirty(false)
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (err) {
      setSaveState('error')
      setSaveError((err as Error)?.message ?? 'Save failed')
    }
  }

  function handleNew() {
    setPickerState('hide')
    setShowDocs(false)
    setShowTemplatePicker(true)
  }

  function applyTemplate(template: ReportTemplate) {
    const cloned: ReportData = {
      ...template.data,
      pages: template.data.pages.map((p) => ({
        ...p,
        id: uuidv4(),
        blocks: p.blocks.map((b) => {
          const newId = uuidv4()
          if (b.type === 'kpi') return { ...b, id: newId, items: (b as KpiBlock).items.map((item) => ({ ...item, id: uuidv4() })) }
          if (b.type === 'chart') return { ...b, id: newId, datasets: (b as ChartBlock).datasets.map((ds) => ({ ...ds, id: uuidv4() })) }
          return { ...b, id: newId }
        }),
      })),
    }
    setReport(cloned)
    setDocId(null)
    setDocName(template.id === 'blank' ? 'Untitled Report' : template.name)
    setSelectedBlockId(null)
    setSelectedPageId(cloned.pages[0]?.id ?? null)
    setSaveState('idle')
    setIsDirty(false)
    setShowTemplatePicker(false)
  }

  function handleOpenDoc(d: ReportDoc) {
    setReport(d.report)
    setDocId(d.id)
    setDocName(d.name || 'Untitled Report')
    setSelectedBlockId(null)
    setSelectedPageId(d.report.pages[0]?.id ?? null)
    setSaveState('saved')
    setIsDirty(false)
    setPickerState('hide')
    setShowDocs(false)
    setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
  }

  // Block operations
  function addBlock(pageId: string, type: ReportBlockType) {
    const block = createBlock(type, dp)
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : { ...p, blocks: [...p.blocks, block] }
      ),
    }))
    setSelectedBlockId(block.id)
    setSelectedPageId(pageId)
  }

  function updateBlock(pageId: string, blockId: string, updates: Record<string, unknown>) {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : {
          ...p,
          blocks: p.blocks.map((b) => b.id !== blockId ? b : { ...b, ...updates }),
        }
      ),
    }))
  }

  function deleteBlock(pageId: string, blockId: string) {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
      ),
    }))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  function moveBlock(pageId: string, blockId: string, dir: 'up' | 'down') {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.id !== pageId) return p
        const idx = p.blocks.findIndex((b) => b.id === blockId)
        if (idx < 0) return p
        const newIdx = dir === 'up' ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= p.blocks.length) return p
        const blocks = [...p.blocks]
        ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
        return { ...p, blocks }
      }),
    }))
  }

  // Page operations
  function addPage() {
    const id = uuidv4()
    const page: ReportPage = { id, title: `Page ${report.pages.length + 1}`, blocks: [], shapes: [] }
    updateReport((prev) => ({ ...prev, pages: [...prev.pages, page] }))
    setSelectedPageId(id)
    setTimeout(() => {
      document.getElementById(`page-view-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  function deletePage(pageId: string) {
    if (report.pages.length <= 1) return
    updateReport((prev) => ({ ...prev, pages: prev.pages.filter((p) => p.id !== pageId) }))
    if (selectedPageId === pageId) {
      setSelectedPageId(report.pages.find((p) => p.id !== pageId)?.id ?? null)
    }
    if (report.pages.find((p) => p.blocks.some((b) => b.id === selectedBlockId))) {
      setSelectedBlockId(null)
    }
  }

  function duplicatePage(pageId: string) {
    const src = report.pages.find((p) => p.id === pageId)
    if (!src) return
    const newPage: ReportPage = {
      id: uuidv4(),
      title: `${src.title} (Copy)`,
      blocks: src.blocks.map((b) => ({ ...b, id: uuidv4() })),
      shapes: (src.shapes || []).map((s) => ({ ...s, id: uuidv4() })),
    }
    updateReport((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === pageId)
      const pages = [...prev.pages]
      pages.splice(idx + 1, 0, newPage)
      return { ...prev, pages }
    })
    setSelectedPageId(newPage.id)
  }

  function updatePageTitle(pageId: string, title: string) {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => p.id !== pageId ? p : { ...p, title }),
    }))
  }

  function movePage(pageId: string, dir: 'up' | 'down') {
    updateReport((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === pageId)
      if (idx < 0) return prev
      const newIdx = dir === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.pages.length) return prev
      const pages = [...prev.pages]
      ;[pages[idx], pages[newIdx]] = [pages[newIdx], pages[idx]]
      return { ...prev, pages }
    })
  }

  // Shape operations
  function addShape(pageId: string, type: ShapeType) {
    const shape = createShape(type)
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : { ...p, shapes: [...(p.shapes || []), shape] }
      ),
    }))
    setSelectedShapeId(shape.id)
    setSelectedShapePageId(pageId)
    setSelectedBlockId(null)
    setIsCoverSelected(false)
  }

  function updateShape(pageId: string, shapeId: string, updates: Partial<ShapeItem>) {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : {
          ...p,
          shapes: (p.shapes || []).map((s) => s.id !== shapeId ? s : { ...s, ...updates }),
        }
      ),
    }))
  }

  function deleteShape(pageId: string, shapeId: string) {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : { ...p, shapes: (p.shapes || []).filter((s) => s.id !== shapeId) }
      ),
    }))
    if (selectedShapeId === shapeId) { setSelectedShapeId(null); setSelectedShapePageId(null) }
  }

  function reorderShape(pageId: string, shapeId: string, dir: 'up' | 'down') {
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.id !== pageId) return p
        const shapes = [...(p.shapes || [])]
        const idx = shapes.findIndex((s) => s.id === shapeId)
        if (idx < 0) return p
        const newIdx = dir === 'up' ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= shapes.length) return p
        ;[shapes[idx], shapes[newIdx]] = [shapes[newIdx], shapes[idx]]
        return { ...p, shapes }
      }),
    }))
  }

  function insertTocPage() {
    const tocPage: ReportPage = {
      id: uuidv4(), title: 'Table of Contents', shapes: [],
      blocks: [{ id: uuidv4(), type: 'toc', title: 'Table of Contents', includePageNumbers: true }],
    }
    updateReport((prev) => ({ ...prev, pages: [tocPage, ...prev.pages] }))
    setSelectedPageId(tocPage.id)
    setSelectedBlockId(tocPage.blocks[0].id)
    setIsCoverSelected(false)
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: docName,
    pageStyle: `
      @page { margin: 0; size: ${report.pageSize} portrait; }
      *, *::before, *::after { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      body { margin: 0; padding: 0; }
    `,
    onBeforePrint: () => Promise.resolve(setIsPdfLoading(true)),
    onAfterPrint: () => setIsPdfLoading(false),
  })

  async function handleDocxExport() {
    setIsDocxLoading(true)
    try {
      const { exportToDocx } = await import('@/lib/docx-export')
      await exportToDocx(report, docName)
    } catch (e) {
      console.error('DOCX export failed', e)
    } finally {
      setIsDocxLoading(false)
    }
  }

  // Find selected block + its page
  let selectedBlock: ReportBlock | null = null
  let selectedBlockPageId: string | null = null
  for (const p of report.pages) {
    const b = p.blocks.find((b) => b.id === selectedBlockId)
    if (b) { selectedBlock = b; selectedBlockPageId = p.id; break }
  }

  // Find selected shape
  let selectedShape: ShapeItem | null = null
  for (const p of report.pages) {
    const s = (p.shapes || []).find((s) => s.id === selectedShapeId)
    if (s) { selectedShape = s; break }
  }

  // ── Render: loading / picker / editor ──────────────────────────────────

  if (pickerState === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#120B07]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C9A84C] border-t-transparent" />
          <p className="animate-pulse text-slate-400">Loading your reports...</p>
        </div>
      </div>
    )
  }

  if (pickerState === 'show') {
    return (
      <ReportPicker
        docs={pickerDocs}
        userName={user?.name}
        onOpen={handleOpenDoc}
        onNew={handleNew}
      />
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#120B07] font-sans">
      {/* ── Top toolbar ── */}
      <header className="no-print flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#2D1B11] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Toggle left panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="shrink-0">
            <Image src="/logoface.png" alt="BrandFox" width={28} height={28} className="h-7 w-7 object-contain" />
          </Link>
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              value={docName}
              onChange={(e) => { setDocName(e.target.value); setIsDirty(true) }}
              className="min-w-0 max-w-[180px] rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none transition focus:bg-white/5"
              placeholder="Untitled Report"
            />
            {isDirty && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" title="Unsaved changes" />}
          </div>
          {saveState === 'saving' && <span className="hidden text-xs text-slate-500 sm:inline">Saving…</span>}
          {saveState === 'saved'  && <span className="hidden text-xs text-emerald-400 sm:inline">Saved</span>}
          {saveState === 'error'  && <span className="hidden text-xs text-red-400 sm:inline" title={saveError ?? ''}>Save failed</span>}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode switcher */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Switch to Resume Builder"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Resume Builder</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={!user || saveState === 'saving'}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            title="Import Excel / CSV file"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Import</span>
          </button>

          <button
            onClick={() => setShowDocs(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>My Reports</span>
          </button>

          {/* Share button */}
          <button
            onClick={() => setShowShare(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Share report"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>

          {/* DOCX export */}
          <button
            onClick={handleDocxExport}
            disabled={isDocxLoading}
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
            title="Export as Word document"
          >
            {isDocxLoading
              ? <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            }
            <span>DOCX</span>
          </button>

          {/* PDF export */}
          <button
            onClick={handlePrint}
            disabled={isPdfLoading}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            style={{ background: '#C9A84C' }}
          >
            {isPdfLoading ? (
              <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span className="hidden sm:inline">Generating…</span></>
            ) : (
              <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg><span className="hidden sm:inline">Export PDF</span><span className="sm:hidden">PDF</span></>
            )}
          </button>

          <button
            onClick={() => setRightOpen((v) => !v)}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Toggle properties panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
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
        <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
          <span><span className="font-semibold text-red-300">Save failed:</span> {saveError}</span>
          <button onClick={() => { setSaveState('idle'); setSaveError(null) }} className="shrink-0 text-red-300 hover:text-red-200">✕</button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className={`no-print flex flex-col border-r border-white/10 bg-[#1C1008] transition-all duration-200 ${leftOpen ? 'w-[220px]' : 'w-0 overflow-hidden'}`}>
          {leftOpen && (
            <LeftPanel
              report={report}
              selectedPageId={selectedPageId}
              leftTab={leftTab}
              setLeftTab={setLeftTab}
              onSelectPage={(id) => {
                setSelectedPageId(id)
                setSelectedBlockId(null)
                setSelectedShapeId(null)
                setIsCoverSelected(false)
                document.getElementById(`page-view-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onAddPage={addPage}
              onDeletePage={deletePage}
              onDuplicatePage={duplicatePage}
              onMovePage={movePage}
              onUpdatePageTitle={updatePageTitle}
              onAddBlock={(type) => {
                const pageId = selectedPageId ?? report.pages[report.pages.length - 1]?.id
                if (pageId) addBlock(pageId, type)
              }}
              onAddShape={(type) => {
                const pageId = selectedPageId ?? report.pages[report.pages.length - 1]?.id
                if (pageId) addShape(pageId, type)
              }}
              onInsertToc={insertTocPage}
            />
          )}
        </div>

        {/* Canvas */}
        <div className="relative flex-1 overflow-auto bg-[#2B2B2B] panel-scroll" onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-block]')) return
          setSelectedBlockId(null)
        }}>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
            <div className="anim-orb absolute rounded-full" style={{ width: 400, height: 400, top: -100, right: -100, background: 'radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="anim-orb-slow absolute rounded-full" style={{ width: 300, height: 300, bottom: -80, left: -80, background: 'radial-gradient(circle, rgba(13,144,128,.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          </div>
          <div className="relative z-10 flex flex-col items-center py-8 px-4 gap-6">
            {report.coverPage.enabled && (
              <CoverPageView
                coverPage={report.coverPage}
                dp={dp}
                watermark={report.watermark}
                isSelected={isCoverSelected}
                onSelect={() => { setIsCoverSelected(true); setSelectedBlockId(null); setSelectedShapeId(null) }}
              />
            )}
            {report.pages.map((page, pageIdx) => (
              <ReportPageView
                key={page.id}
                page={page}
                pageNum={pageIdx + 1}
                dp={dp}
                report={report}
                isSelectedPage={selectedPageId === page.id}
                selectedBlockId={selectedBlockId}
                selectedShapeId={selectedShapeId}
                onSelectPage={() => { setSelectedPageId(page.id); setIsCoverSelected(false) }}
                onSelectBlock={(id) => { setSelectedBlockId(id); setSelectedPageId(page.id); setSelectedShapeId(null); setIsCoverSelected(false) }}
                onSelectShape={(id) => { setSelectedShapeId(id); setSelectedShapePageId(page.id); setSelectedBlockId(null); setIsCoverSelected(false) }}
                onDeleteBlock={(blockId) => deleteBlock(page.id, blockId)}
                onMoveBlock={(blockId, dir) => moveBlock(page.id, blockId, dir)}
                onAddBlock={(type) => addBlock(page.id, type)}
                onUpdateShape={(shapeId, upd) => updateShape(page.id, shapeId, upd)}
                onDeleteShape={(shapeId) => deleteShape(page.id, shapeId)}
                onReorderShape={(shapeId, dir) => reorderShape(page.id, shapeId, dir)}
              />
            ))}
            <button
              onClick={addPage}
              className="flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-6 py-3 text-sm font-medium text-slate-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Page
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className={`no-print flex-col border-l border-white/10 bg-[#1C1008] transition-all duration-200 overflow-hidden ${rightOpen ? 'flex w-[280px]' : 'w-0'}`}>
          {rightOpen && (
            <RightPanel
              report={report}
              dp={dp}
              docName={docName}
              selectedBlock={selectedBlock}
              selectedBlockPageId={selectedBlockPageId}
              isCoverSelected={isCoverSelected}
              selectedShape={selectedShape}
              selectedShapePageId={selectedShapePageId}
              onUpdateBlock={updateBlock}
              onUpdateShape={updateShape}
              onDeleteShape={deleteShape}
              onReorderShape={reorderShape}
              onUpdateReport={updateReport}
              onSaveShapeTemplate={(name, shapes) => saveShapeTemplate(name, shapes)}
              onCoverDeselect={() => setIsCoverSelected(false)}
            />
          )}
        </div>
      </div>

      {/* Hidden print view */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0 }}>
        <div ref={printRef}>
          <PrintView report={report} dp={dp} />
        </div>
      </div>

      {/* File import modal */}
      {showImport && (
        <FileImportModal
          currentPageId={selectedPageId ?? report.pages[report.pages.length - 1]?.id ?? ''}
          dp={dp}
          onImport={(pageId, block) => {
            updateReport((prev) => ({
              ...prev,
              pages: prev.pages.map((p) =>
                p.id !== pageId ? p : { ...p, blocks: [...p.blocks, block] }
              ),
            }))
            setSelectedBlockId(block.id)
            setSelectedPageId(pageId)
            setShowImport(false)
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* My Reports modal */}
      {showDocs && (
        <ReportDocsModal
          docs={pickerDocs}
          currentId={docId}
          onOpen={handleOpenDoc}
          onNew={handleNew}
          onClose={() => setShowDocs(false)}
          onRefresh={() => listReports().then(setPickerDocs).catch(() => {})}
        />
      )}

      {/* Share modal */}
      {showShare && (
        <ShareModal
          report={report}
          docName={docName}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Template picker modal */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={applyTemplate}
          onClose={pickerState === 'hide' && !docId ? undefined : () => setShowTemplatePicker(false)}
        />
      )}
    </div>
  )
}

// ── Left Panel ──────────────────────────────────────────────────────────────

function LeftPanel({
  report, selectedPageId, leftTab, setLeftTab,
  onSelectPage, onAddPage, onDeletePage, onDuplicatePage, onMovePage, onUpdatePageTitle, onAddBlock, onAddShape, onInsertToc,
}: {
  report: ReportData
  selectedPageId: string | null
  leftTab: 'pages' | 'insert'
  setLeftTab: (t: 'pages' | 'insert') => void
  onSelectPage: (id: string) => void
  onAddPage: () => void
  onDeletePage: (id: string) => void
  onDuplicatePage: (id: string) => void
  onMovePage: (id: string, dir: 'up' | 'down') => void
  onUpdatePageTitle: (id: string, title: string) => void
  onAddBlock: (type: ReportBlockType) => void
  onAddShape: (type: ShapeType) => void
  onInsertToc: () => void
}) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const BLOCK_TYPES: { type: ReportBlockType; icon: string; label: string }[] = [
    { type: 'heading', icon: 'H',  label: 'Heading' },
    { type: 'text',    icon: 'T',  label: 'Text' },
    { type: 'table',   icon: '⊞', label: 'Table' },
    { type: 'chart',   icon: '📈', label: 'Chart' },
    { type: 'kpi',     icon: '📊', label: 'KPI Cards' },
    { type: 'image',   icon: '🖼', label: 'Image' },
    { type: 'divider', icon: '─',  label: 'Divider' },
    { type: 'spacer',  icon: '↕',  label: 'Spacer' },
    { type: 'toc',     icon: '📋', label: 'Table of Contents' },
  ]

  const SHAPE_TYPES: { type: ShapeType; label: string; preview: string }[] = [
    { type: 'rect',     label: 'Rectangle', preview: 'M2,2 h96 v96 h-96 Z' },
    { type: 'circle',   label: 'Circle',    preview: 'M50,2 a48,48 0 1,1 0,96 a48,48 0 1,1 0,-96' },
    { type: 'triangle', label: 'Triangle',  preview: 'M50,2 L2,98 98,98 Z' },
    { type: 'diamond',  label: 'Diamond',   preview: 'M50,2 L98,50 50,98 2,50 Z' },
    { type: 'hexagon',  label: 'Hexagon',   preview: 'M25,2 L75,2 98,50 75,98 25,98 2,50 Z' },
    { type: 'star',     label: 'Star',      preview: 'M50,2 61,37 98,37 70,58 79,95 50,72 21,95 30,58 2,37 39,37 Z' },
    { type: 'line',     label: 'Line',      preview: 'M2,50 L98,50' },
    { type: 'arrow',    label: 'Arrow',     preview: 'M2,35 62,35 62,15 98,50 62,85 62,65 2,65 Z' },
  ]

  const [shapeTemplates, setShapeTemplates] = useState<ShapeTemplate[]>(() => getShapeTemplates())

  const refreshTemplates = () => setShapeTemplates(getShapeTemplates())

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-white/10">
        {(['pages', 'insert'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setLeftTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition ${
              leftTab === t ? 'text-[#C9A84C] border-b-2 border-[#C9A84C]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll p-2">
        {leftTab === 'pages' ? (
          <>
            {report.coverPage.enabled && (
              <div className="mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-bold">C</span>
                Cover Page
              </div>
            )}
            {report.pages.map((page, idx) => (
              <div
                key={page.id}
                className={`group mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition ${
                  selectedPageId === page.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => onSelectPage(page.id)}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-slate-400">
                  {idx + 1}
                </span>
                {editingPageId === page.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => { onUpdatePageTitle(page.id, editTitle || page.title); setEditingPageId(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { onUpdatePageTitle(page.id, editTitle || page.title); setEditingPageId(null) } }}
                    className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-xs">{page.title}</span>
                )}
                <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  <button onClick={(e) => { e.stopPropagation(); setEditTitle(page.title); setEditingPageId(page.id) }} className="rounded p-0.5 text-slate-500 hover:text-slate-200" title="Rename">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onMovePage(page.id, 'up') }} className="rounded p-0.5 text-slate-500 hover:text-slate-200" title="Move up" disabled={idx === 0}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onMovePage(page.id, 'down') }} className="rounded p-0.5 text-slate-500 hover:text-slate-200" title="Move down" disabled={idx === report.pages.length - 1}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id) }} className="rounded p-0.5 text-slate-500 hover:text-slate-200" title="Duplicate">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  {report.pages.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); onDeletePage(page.id) }} className="rounded p-0.5 text-slate-500 hover:text-red-400" title="Delete">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={onAddPage}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-white/15 px-2 py-1.5 text-xs text-slate-500 transition hover:border-[#C9A84C]/50 hover:text-[#C9A84C]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Page
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {/* ToC quick-insert */}
            <button
              onClick={onInsertToc}
              className="flex items-center gap-2 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-3 py-2 text-xs font-medium text-[#C9A84C] transition hover:bg-[#C9A84C]/10"
            >
              <span className="text-base leading-none">📋</span>
              Insert Table of Contents page
            </button>

            {/* Blocks */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Blocks</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_TYPES.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => onAddBlock(type)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-3 text-xs text-slate-300 transition hover:border-[#C9A84C]/50 hover:bg-white/10 hover:text-white"
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shapes */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Shapes</p>
              <div className="grid grid-cols-4 gap-1.5">
                {SHAPE_TYPES.map(({ type, label, preview }) => (
                  <button
                    key={type}
                    onClick={() => onAddShape(type)}
                    title={label}
                    className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-2 text-[9px] text-slate-400 transition hover:border-[#C9A84C]/50 hover:bg-white/10 hover:text-[#C9A84C]"
                  >
                    <svg viewBox="0 0 100 100" className="h-6 w-6">
                      {type === 'line'
                        ? <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                        : <path d={preview} fill="currentColor" opacity={0.8} />
                      }
                    </svg>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shape templates */}
            {shapeTemplates.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">Shape Templates</p>
                <div className="flex flex-col gap-1">
                  {shapeTemplates.map((tpl) => {
                    const pageId = report.pages[0]?.id
                    return (
                      <div key={tpl.id} className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (!pageId) return
                            // Apply template shapes to current page (re-ID them)
                            tpl.shapes.forEach((s) => onAddShape(s.type))
                          }}
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left text-xs text-slate-300 transition hover:border-[#C9A84C]/50 hover:text-white"
                        >
                          {tpl.name}
                        </button>
                        <button
                          onClick={() => { deleteShapeTemplate(tpl.id); refreshTemplates() }}
                          className="shrink-0 rounded p-1 text-slate-600 hover:text-red-400"
                          title="Delete template"
                        >✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Cover Page View ─────────────────────────────────────────────────────────

function CoverPageView({ coverPage, dp, watermark, isSelected, onSelect }: {
  coverPage: ReportData['coverPage']
  dp: DesignPack
  watermark: ReportData['watermark']
  isSelected: boolean
  onSelect: () => void
}) {
  const bg = coverPage.primaryColor || dp.primaryColor
  const fg = coverPage.textColor || '#FFFFFF'
  const patternStyle: React.CSSProperties = {}
  if (coverPage.pattern === 'grid') {
    patternStyle.backgroundImage = `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`
    patternStyle.backgroundSize = '40px 40px'
  } else if (coverPage.pattern === 'dots') {
    patternStyle.backgroundImage = 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)'
    patternStyle.backgroundSize = '24px 24px'
  } else if (coverPage.pattern === 'diagonal') {
    patternStyle.backgroundImage = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)'
    patternStyle.backgroundSize = '16px 16px'
  }

  return (
    <div
      className={`relative w-full max-w-[760px] overflow-hidden rounded-lg shadow-2xl cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[#C9A84C]/60' : 'hover:ring-2 hover:ring-white/20'}`}
      style={{ background: bg, minHeight: '420px' }}
      id="page-cover"
      onClick={onSelect}
    >
      {/* Edit indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-[#C9A84C] px-2.5 py-1 text-[10px] font-semibold text-[#1C0D03] shadow">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Edit in Properties panel →
        </div>
      )}
      {!isSelected && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-black/30 px-2 py-0.5 text-[9px] text-white/70 opacity-0 hover:opacity-100 transition pointer-events-none">
          Click to edit
        </div>
      )}
      {/* Background image */}
      {coverPage.backgroundImageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${coverPage.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      {/* Pattern overlay */}
      {coverPage.pattern !== 'none' && (
        <div style={{ position: 'absolute', inset: 0, ...patternStyle }} />
      )}
      {/* Color overlay when bg image is set */}
      {coverPage.backgroundImageUrl && (
        <div style={{ position: 'absolute', inset: 0, background: `${bg}CC` }} />
      )}
      <div className="relative flex flex-col justify-end p-12" style={{ minHeight: '420px', color: fg, zIndex: 1 }}>
        {/* Logo */}
        {coverPage.logoUrl && (
          <div className="absolute top-8 left-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPage.logoUrl} alt="Logo" style={{ maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
          </div>
        )}
        {coverPage.companyName && (
          <p className="mb-6 text-sm font-medium uppercase tracking-widest opacity-70">{coverPage.companyName}</p>
        )}
        <h1 className="mb-3 text-4xl font-bold leading-tight">{coverPage.reportTitle || 'Report Title'}</h1>
        {coverPage.subtitle && <p className="mb-2 text-xl opacity-80">{coverPage.subtitle}</p>}
        {coverPage.date && <p className="mt-4 text-sm opacity-60">{coverPage.date}</p>}
        <div className="absolute right-0 top-0 h-full w-2 opacity-40" style={{ background: dp.accentColor }} />
      </div>
      {/* Watermark on cover */}
      {watermark.enabled && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          style={{ opacity: watermark.opacity, transform: `rotate(${watermark.rotation}deg)` }}
        >
          {watermark.imageUrl
            ? <img src={watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
            : <span className="text-5xl font-black tracking-widest" style={{ color: watermark.color || '#ffffff' }}>{watermark.text}</span>
          }
        </div>
      )}
    </div>
  )
}

// ── Report Page View ────────────────────────────────────────────────────────

function ReportPageView({
  page, pageNum, dp, report, isSelectedPage, selectedBlockId, selectedShapeId,
  onSelectPage, onSelectBlock, onSelectShape, onDeleteBlock, onMoveBlock, onAddBlock,
  onUpdateShape, onDeleteShape, onReorderShape,
}: {
  page: ReportPage
  pageNum: number
  dp: DesignPack
  report: ReportData
  isSelectedPage: boolean
  selectedBlockId: string | null
  selectedShapeId: string | null
  onSelectPage: () => void
  onSelectBlock: (id: string) => void
  onSelectShape: (id: string) => void
  onDeleteBlock: (id: string) => void
  onMoveBlock: (id: string, dir: 'up' | 'down') => void
  onAddBlock: (type: ReportBlockType) => void
  onUpdateShape: (id: string, upd: Partial<ShapeItem>) => void
  onDeleteShape: (id: string) => void
  onReorderShape: (id: string, dir: 'up' | 'down') => void
}) {
  const [showInsert, setShowInsert] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const BLOCK_TYPES: { type: ReportBlockType; label: string }[] = [
    { type: 'heading', label: 'Heading' },
    { type: 'text',    label: 'Text' },
    { type: 'table',   label: 'Table' },
    { type: 'chart',   label: 'Chart' },
    { type: 'kpi',     label: 'KPI Cards' },
    { type: 'image',   label: 'Image' },
    { type: 'divider', label: 'Divider' },
    { type: 'spacer',  label: 'Spacer' },
    { type: 'toc',     label: 'Table of Contents' },
  ]

  return (
    <div
      ref={containerRef}
      id={`page-view-${page.id}`}
      className={`relative w-full max-w-[760px] rounded-lg shadow-xl transition-all ${
        isSelectedPage ? 'ring-2 ring-[#C9A84C]/40' : ''
      }`}
      onClick={onSelectPage}
      style={{ background: '#FFFFFF', minHeight: '600px' }}
    >
      {/* Page header band */}
      {report.headerFooter.showHeader && (
        <div className="flex items-center justify-between px-8 py-2 text-[10px]" style={{ borderBottom: `2px solid ${dp.primaryColor}`, color: dp.primaryColor }}>
          <span className="font-medium">{report.headerFooter.headerLeft}</span>
          <span>{report.headerFooter.headerRight}</span>
        </div>
      )}

      {/* Page content */}
      <div className="px-12 py-8">
        {/* Page title chip */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: dp.accentColor }}>
            Page {pageNum} — {page.title}
          </span>
        </div>

        {page.blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-400">This page is empty.</p>
            <button
              onClick={(e) => { e.stopPropagation(); setShowInsert(true) }}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-400 transition hover:border-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add a block
            </button>
          </div>
        )}

        {page.blocks.map((block, idx) => (
          <BlockWrapper
            key={block.id}
            block={block}
            dp={dp}
            report={report}
            isSelected={selectedBlockId === block.id}
            isFirst={idx === 0}
            isLast={idx === page.blocks.length - 1}
            onSelect={() => onSelectBlock(block.id)}
            onDelete={() => onDeleteBlock(block.id)}
            onMoveUp={() => onMoveBlock(block.id, 'up')}
            onMoveDown={() => onMoveBlock(block.id, 'down')}
          />
        ))}

        {page.blocks.length > 0 && (
          <div className="relative mt-4" onClick={(e) => e.stopPropagation()}>
            {showInsert ? (
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
                {BLOCK_TYPES.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => { onAddBlock(type); setShowInsert(false) }}
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition hover:border-gray-400 hover:text-gray-900"
                  >
                    {label}
                  </button>
                ))}
                <button onClick={() => setShowInsert(false)} className="ml-auto rounded-md px-2 py-1 text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowInsert(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 py-2 text-xs text-gray-400 transition hover:border-gray-400 hover:text-gray-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add block
              </button>
            )}
          </div>
        )}
      </div>

      {/* Page footer band */}
      {report.headerFooter.showFooter && (
        <div className="flex items-center justify-between px-8 py-2 text-[10px]" style={{ borderTop: `1px solid ${dp.primaryColor}20`, color: dp.textColor }}>
          <span>{report.headerFooter.footerLeft}</span>
          <div className="flex items-center gap-3">
            <span>{report.headerFooter.footerRight}</span>
            {report.headerFooter.showPageNumbers && (
              <span className="font-medium" style={{ color: dp.primaryColor }}>{pageNum}</span>
            )}
          </div>
        </div>
      )}

      {/* Shape overlay */}
      {(page.shapes || []).length > 0 && (
        <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ pointerEvents: 'none' }}>
          {(page.shapes || []).sort((a, b) => a.zIndex - b.zIndex).map((shape) => (
            <ShapeView
              key={shape.id}
              shape={shape}
              isSelected={selectedShapeId === shape.id}
              containerRef={containerRef}
              onSelect={(e) => { e.stopPropagation(); onSelectShape(shape.id) }}
              onUpdate={(upd) => onUpdateShape(shape.id, upd)}
            />
          ))}
        </div>
      )}

      {/* Watermark */}
      {report.watermark.enabled && (report.watermark.text || report.watermark.imageUrl) && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          style={{ opacity: report.watermark.opacity, transform: `rotate(${report.watermark.rotation}deg)` }}
        >
          {report.watermark.imageUrl
            ? <img src={report.watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
            : <span className="text-5xl font-black tracking-widest" style={{ color: report.watermark.color || '#9ca3af' }}>{report.watermark.text}</span>
          }
        </div>
      )}
    </div>
  )
}

// ── Block Wrapper ───────────────────────────────────────────────────────────

function BlockWrapper({
  block, dp, report, isSelected, isFirst, isLast,
  onSelect, onDelete, onMoveUp, onMoveDown,
}: {
  block: ReportBlock
  dp: DesignPack
  report?: ReportData
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  onSelect: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div
      data-block
      className={`group relative mb-3 rounded transition-all ${
        isSelected
          ? 'outline outline-2 outline-blue-400 outline-offset-2'
          : 'hover:outline hover:outline-1 hover:outline-gray-200 hover:outline-offset-2'
      }`}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
    >
      {/* Toolbar */}
      <div className={`absolute -top-7 right-0 flex items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1 py-0.5 shadow-sm ${isSelected ? 'flex' : 'hidden group-hover:flex'}`}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onMoveUp} disabled={isFirst} className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30" title="Move up">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30" title="Move down">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className="mx-0.5 h-3 w-px bg-gray-200" />
        <button onClick={onDelete} className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500" title="Delete block">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
      {/* Block content */}
      {renderBlockContent(block, dp, report)}
    </div>
  )
}

// ── Block Content Renderers ─────────────────────────────────────────────────

function renderBlockContent(block: ReportBlock, dp: DesignPack, report?: ReportData): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const sizes: Record<number, string> = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' }
      const weights: Record<number, string> = { 1: 'font-bold', 2: 'font-semibold', 3: 'font-semibold' }
      const margins: Record<number, string> = { 1: 'mb-3 mt-2', 2: 'mb-2 mt-1', 3: 'mb-1' }
      return (
        <div
          className={`${sizes[block.level]} ${weights[block.level]} ${margins[block.level]} leading-tight`}
          style={{ color: block.color || dp.headingColor, textAlign: block.align, fontFamily: dp.fontFamily }}
        >
          {block.content || 'Heading'}
        </div>
      )
    }
    case 'text':
      return (
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: dp.textColor, textAlign: block.align, fontFamily: dp.fontFamily }}
        >
          {block.content}
        </div>
      )
    case 'table': {
      const headerBg = block.headerBg || dp.tableHeaderBg
      const headerText = block.headerText || dp.tableHeaderText
      return (
        <div>
          {block.caption && (
            <p className="mb-1.5 text-xs text-gray-500 italic">{block.caption}</p>
          )}
          <table className="w-full" style={{ fontFamily: dp.fontFamily, borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed', wordBreak: 'break-word' }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ background: headerBg, color: headerText, border: block.bordered ? `1px solid ${headerBg}30` : 'none', overflowWrap: 'break-word' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ background: block.striped && rIdx % 2 === 1 ? '#F8FAFC' : 'white' }}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3 py-1.5"
                      style={{
                        textAlign: cell.align,
                        fontWeight: cell.bold ? 600 : 400,
                        color: dp.textColor,
                        border: block.bordered ? '1px solid #E5E7EB' : 'none',
                        borderTop: block.bordered ? '1px solid #E5E7EB' : 'none',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {cell.content}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'image':
      return (
        <div style={{ textAlign: block.align }}>
          {block.url ? (
            <div className={`inline-block ${block.width === 'full' ? 'w-full' : block.width === 'large' ? 'w-3/4' : block.width === 'medium' ? 'w-1/2' : 'w-1/4'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.url} alt={block.alt} className="h-auto max-w-full rounded" />
              {block.caption && <p className="mt-1 text-center text-xs text-gray-500 italic">{block.caption}</p>}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              No image URL set — add one in the properties panel
            </div>
          )}
        </div>
      )
    case 'kpi': {
      const accent = block.accentColor || dp.kpiAccent
      const gridCols: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }
      return (
        <div>
          {block.title && <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: dp.headingColor }}>{block.title}</p>}
          <div className={`grid gap-3 ${gridCols[block.columns]}`}>
            {block.items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-3"
                style={{ background: `${accent}10`, borderLeft: `3px solid ${accent}` }}
              >
                <p className="mb-1 text-xs text-gray-500">{item.label}</p>
                <p className="text-xl font-bold leading-none" style={{ color: accent }}>
                  {item.prefix}{item.value}{item.suffix}
                </p>
                {item.trendValue && (
                  <p className={`mt-1 text-xs font-medium ${item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} {item.trendValue}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'chart':
      return <ChartBlockView block={block} dp={dp} />
    case 'divider': {
      const color = block.color || dp.primaryColor
      const styles: Record<string, string> = { solid: 'solid', dashed: 'dashed', double: 'double' }
      return (
        <div className="py-2">
          <hr style={{ border: 'none', borderTop: `${block.thickness}px ${styles[block.style]} ${color}40` }} />
        </div>
      )
    }
    case 'spacer':
      return <div style={{ height: block.height }} />
    case 'toc': {
      const pages = report?.pages ?? []
      return (
        <div style={{ fontFamily: dp.fontFamily }}>
          <h2 className="mb-3 text-lg font-bold" style={{ color: dp.headingColor }}>{block.title || 'Table of Contents'}</h2>
          <div className="flex flex-col gap-1.5">
            {pages.map((page, idx) => (
              <div key={page.id} className="flex items-center gap-1.5">
                <span className="text-sm leading-relaxed" style={{ color: dp.textColor }}>{page.title}</span>
                {block.includePageNumbers && (
                  <>
                    <div className="flex-1 border-b border-dashed mx-1" style={{ borderColor: dp.textColor + '40' }} />
                    <span className="text-sm font-semibold tabular-nums" style={{ color: dp.primaryColor }}>{idx + 1}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
}

// ── Right Panel ─────────────────────────────────────────────────────────────

function RightPanel({
  report, dp, selectedBlock, selectedBlockPageId, docName,
  isCoverSelected, selectedShape, selectedShapePageId,
  onUpdateBlock, onUpdateShape, onDeleteShape, onReorderShape, onUpdateReport, onSaveShapeTemplate, onCoverDeselect,
}: {
  report: ReportData
  dp: DesignPack
  docName: string
  selectedBlock: ReportBlock | null
  selectedBlockPageId: string | null
  isCoverSelected: boolean
  selectedShape: ShapeItem | null
  selectedShapePageId: string | null
  onUpdateBlock: (pageId: string, blockId: string, updates: Record<string, unknown>) => void
  onUpdateShape: (pageId: string, shapeId: string, upd: Partial<ShapeItem>) => void
  onDeleteShape: (pageId: string, shapeId: string) => void
  onReorderShape: (pageId: string, shapeId: string, dir: 'up' | 'down') => void
  onUpdateReport: (updater: (prev: ReportData) => ReportData) => void
  onSaveShapeTemplate: (name: string, shapes: ShapeItem[]) => void
  onCoverDeselect: () => void
}) {
  const [rightTab, setRightTab] = useState<'properties' | 'design' | 'document' | 'ai'>('properties')

  const upd = (updates: Record<string, unknown>) => {
    if (selectedBlock && selectedBlockPageId) onUpdateBlock(selectedBlockPageId, selectedBlock.id, updates)
  }

  useEffect(() => {
    if (selectedBlock || selectedShape || isCoverSelected) setRightTab('properties')
  }, [selectedBlock?.id, selectedShape?.id, isCoverSelected])

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-white/10">
        {([
          { id: 'properties', label: 'Properties' },
          { id: 'design', label: 'Design' },
          { id: 'document', label: 'Doc' },
          { id: 'ai', label: '✨ AI' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setRightTab(id)}
            className={`flex-1 py-2.5 text-xs font-medium transition ${
              rightTab === id ? 'text-[#C9A84C] border-b-2 border-[#C9A84C]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto panel-scroll p-3 text-xs text-slate-300">
        {rightTab === 'properties' && (
          <>
            {isCoverSelected ? (
              <CoverPageEditor
                coverPage={report.coverPage}
                onUpdate={(field, val) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, [field]: val } }))}
                onDeselect={onCoverDeselect}
              />
            ) : selectedShape && selectedShapePageId ? (
              <ShapeEditor
                shape={selectedShape}
                pageShapes={(report.pages.find((p) => p.id === selectedShapePageId)?.shapes) || []}
                onUpdate={(upd) => onUpdateShape(selectedShapePageId, selectedShape.id, upd)}
                onDelete={() => onDeleteShape(selectedShapePageId, selectedShape.id)}
                onReorder={(dir) => onReorderShape(selectedShapePageId, selectedShape.id, dir)}
                onSaveTemplate={(name) => {
                  const shapes = report.pages.find((p) => p.id === selectedShapePageId)?.shapes || []
                  onSaveShapeTemplate(name, shapes)
                }}
              />
            ) : selectedBlock ? (
              <BlockEditor block={selectedBlock} dp={dp} onUpdate={upd} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <p className="text-slate-500">Click a block, shape, or the cover page to edit</p>
              </div>
            )}
          </>
        )}

        {rightTab === 'design' && (
          <DesignPanel report={report} onUpdateReport={onUpdateReport} />
        )}

        {rightTab === 'document' && (
          <DocumentPanel report={report} onUpdateReport={onUpdateReport} />
        )}

        {rightTab === 'ai' && (
          <AIPanel
            report={report}
            docName={docName}
            selectedBlock={selectedBlock}
            selectedBlockPageId={selectedBlockPageId}
            onUpdateBlock={(updates) => {
              if (selectedBlock && selectedBlockPageId) onUpdateBlock(selectedBlockPageId, selectedBlock.id, updates)
            }}
            onUpdateReport={onUpdateReport}
          />
        )}
      </div>
    </div>
  )
}

// ── Block Editor ────────────────────────────────────────────────────────────

function BlockEditor({ block, dp, onUpdate }: { block: ReportBlock; dp: DesignPack; onUpdate: (u: Record<string, unknown>) => void }) {
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'
  const alignBtns = (align: string, onChange: (a: string) => void) => (
    <div className="flex rounded-md border border-white/10 overflow-hidden">
      {['left', 'center', 'right'].map((a) => (
        <button key={a} onClick={() => onChange(a)} className={`flex-1 py-1 text-[10px] transition ${align === a ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-slate-400 hover:bg-white/5'}`}>
          {a[0].toUpperCase()}
        </button>
      ))}
    </div>
  )

  switch (block.type) {
    case 'heading':
      return (
        <div className="flex flex-col gap-3">
          <div>{label('Content')}<textarea value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} rows={3} className={`${inputCls} resize-none`} /></div>
          <div>
            {label('Level')}
            <div className="flex gap-1">
              {([1, 2, 3] as const).map((l) => (
                <button key={l} onClick={() => onUpdate({ level: l })} className={`flex-1 rounded border py-1 text-xs font-bold transition ${block.level === l ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>H{l}</button>
              ))}
            </div>
          </div>
          <div>{label('Align')}{alignBtns(block.align, (a) => onUpdate({ align: a }))}</div>
          <div>{label('Color')}<input type="color" value={block.color || dp.headingColor} onChange={(e) => onUpdate({ color: e.target.value })} className="h-8 w-full cursor-pointer rounded" /></div>
        </div>
      )
    case 'text':
      return (
        <div className="flex flex-col gap-3">
          <div>{label('Content')}<textarea value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} rows={8} className={`${inputCls} resize-none`} /></div>
          <div>
            {label('Align')}
            <div className="flex rounded-md border border-white/10 overflow-hidden">
              {['left', 'center', 'right', 'justify'].map((a) => (
                <button key={a} onClick={() => onUpdate({ align: a })} className={`flex-1 py-1 text-[10px] transition ${block.align === a ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-slate-400 hover:bg-white/5'}`}>
                  {a === 'justify' ? 'J' : a[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    case 'table':
      return <TableEditor block={block} onUpdate={onUpdate} />
    case 'kpi':
      return <KpiEditor block={block} onUpdate={onUpdate} />
    case 'image':
      return (
        <div className="flex flex-col gap-3">
          <div>{label('Image')}<ImageUploadField value={block.url} onChange={(url) => onUpdate({ url })} placeholder="URL or upload a file" /></div>
          <div>{label('Alt Text')}<input value={block.alt} onChange={(e) => onUpdate({ alt: e.target.value })} className={inputCls} /></div>
          <div>{label('Caption')}<input value={block.caption} onChange={(e) => onUpdate({ caption: e.target.value })} className={inputCls} /></div>
          <div>
            {label('Width')}
            <select value={block.width} onChange={(e) => onUpdate({ width: e.target.value })} className={inputCls}>
              {['full', 'large', 'medium', 'small'].map((w) => <option key={w} value={w} className="bg-[#1C1008]">{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
            </select>
          </div>
          <div>{label('Align')}{alignBtns(block.align, (a) => onUpdate({ align: a }))}</div>
        </div>
      )
    case 'divider':
      return (
        <div className="flex flex-col gap-3">
          <div>
            {label('Style')}
            <select value={block.style} onChange={(e) => onUpdate({ style: e.target.value })} className={inputCls}>
              {['solid', 'dashed', 'double'].map((s) => <option key={s} value={s} className="bg-[#1C1008]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>{label('Color')}<input type="color" value={block.color || '#000000'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-8 w-full cursor-pointer rounded" /></div>
          <div>
            {label('Thickness')}
            <input type="range" min={1} max={4} value={block.thickness} onChange={(e) => onUpdate({ thickness: Number(e.target.value) })} className="w-full" />
          </div>
        </div>
      )
    case 'spacer':
      return (
        <div>
          {label(`Height: ${block.height}px`)}
          <input type="range" min={8} max={120} value={block.height} onChange={(e) => onUpdate({ height: Number(e.target.value) })} className="w-full" />
        </div>
      )
    case 'chart':
      return <ChartEditor block={block} onUpdate={onUpdate} />
    case 'toc':
      return (
        <div className="flex flex-col gap-3">
          <div>{label('Title')}<input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inputCls} /></div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={block.includePageNumbers} onChange={(e) => onUpdate({ includePageNumbers: e.target.checked })} />
            Include page numbers
          </label>
          <p className="text-[10px] leading-relaxed text-slate-600">
            The TOC automatically lists all pages in the document. Edit page titles in the Pages panel.
          </p>
        </div>
      )
  }
}

// ── Table Editor ────────────────────────────────────────────────────────────

function TableEditor({ block, onUpdate }: { block: TableBlock; onUpdate: (u: Record<string, unknown>) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'

  function updHeader(i: number, v: string) {
    const headers = [...block.headers]
    headers[i] = v
    onUpdate({ headers })
  }

  function updCell(r: number, c: number, field: keyof TableCell, val: unknown) {
    const rows = block.rows.map((row, ri) =>
      ri !== r ? row : row.map((cell, ci) => ci !== c ? cell : { ...cell, [field]: val })
    )
    onUpdate({ rows })
  }

  function addRow() {
    const rows = [...block.rows, block.headers.map(() => ({ content: '', bold: false, align: 'left' as const }))]
    onUpdate({ rows })
  }

  function removeRow(r: number) {
    onUpdate({ rows: block.rows.filter((_, i) => i !== r) })
  }

  function addCol() {
    const headers = [...block.headers, `Col ${block.headers.length + 1}`]
    const rows = block.rows.map((row) => [...row, { content: '', bold: false, align: 'left' as const }])
    onUpdate({ headers, rows })
  }

  function removeCol(c: number) {
    if (block.headers.length <= 1) return
    onUpdate({
      headers: block.headers.filter((_, i) => i !== c),
      rows: block.rows.map((row) => row.filter((_, i) => i !== c)),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Caption</label>
        <input value={block.caption} onChange={(e) => onUpdate({ caption: e.target.value })} className={inputCls} placeholder="Table caption…" />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.striped} onChange={(e) => onUpdate({ striped: e.target.checked })} className="rounded" />
          Striped
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.bordered} onChange={(e) => onUpdate({ bordered: e.target.checked })} className="rounded" />
          Bordered
        </label>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Columns ({block.headers.length})</span>
          <div className="flex gap-1">
            <button onClick={addCol} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-[#C9A84C]">+ Col</button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {block.headers.map((h, i) => (
            <div key={i} className="flex gap-1">
              <input value={h} onChange={(e) => updHeader(i, e.target.value)} className={inputCls} />
              {block.headers.length > 1 && (
                <button onClick={() => removeCol(i)} className="shrink-0 text-slate-500 hover:text-red-400">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Rows ({block.rows.length})</span>
          <button onClick={addRow} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-[#C9A84C]">+ Row</button>
        </div>
        <div className="flex flex-col gap-2">
          {block.rows.map((row, rIdx) => (
            <div key={rIdx} className="rounded border border-white/10 p-1.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Row {rIdx + 1}</span>
                {block.rows.length > 1 && (
                  <button onClick={() => removeRow(rIdx)} className="text-[10px] text-slate-600 hover:text-red-400">✕</button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {row.map((cell, cIdx) => (
                  <div key={cIdx} className="flex gap-1 items-center">
                    <input
                      value={cell.content}
                      onChange={(e) => updCell(rIdx, cIdx, 'content', e.target.value)}
                      placeholder={block.headers[cIdx] || `Col ${cIdx + 1}`}
                      className={`${inputCls} flex-1`}
                    />
                    <label className="shrink-0 flex items-center gap-0.5 text-[10px] text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={cell.bold} onChange={(e) => updCell(rIdx, cIdx, 'bold', e.target.checked)} />
                      B
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── KPI Editor ──────────────────────────────────────────────────────────────

function KpiEditor({ block, onUpdate }: { block: KpiBlock; onUpdate: (u: Record<string, unknown>) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'

  function updItem(id: string, field: keyof KpiItem, val: unknown) {
    onUpdate({ items: block.items.map((it) => it.id !== id ? it : { ...it, [field]: val }) })
  }
  function addItem() {
    onUpdate({ items: [...block.items, { id: uuidv4(), label: 'New Metric', value: '0', prefix: '', suffix: '', trend: 'neutral', trendValue: '' }] })
  }
  function removeItem(id: string) {
    if (block.items.length <= 1) return
    onUpdate({ items: block.items.filter((it) => it.id !== id) })
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Block Title</label>
        <input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Columns</label>
        <div className="flex gap-1">
          {([2, 3, 4] as const).map((c) => (
            <button key={c} onClick={() => onUpdate({ columns: c })} className={`flex-1 rounded border py-1 text-xs transition ${block.columns === c ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Accent Color</label>
        <input type="color" value={block.accentColor || '#2D7DD2'} onChange={(e) => onUpdate({ accentColor: e.target.value })} className="h-8 w-full cursor-pointer rounded" />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Metrics ({block.items.length})</span>
          <button onClick={addItem} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-[#C9A84C]">+ Add</button>
        </div>
        <div className="flex flex-col gap-2">
          {block.items.map((item) => (
            <div key={item.id} className="rounded border border-white/10 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{item.label || 'Metric'}</span>
                {block.items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-[10px] text-slate-600 hover:text-red-400">✕</button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <input value={item.label} onChange={(e) => updItem(item.id, 'label', e.target.value)} className={inputCls} placeholder="Label" />
                <div className="flex gap-1">
                  <input value={item.prefix} onChange={(e) => updItem(item.id, 'prefix', e.target.value)} className={`${inputCls} w-12`} placeholder="$" />
                  <input value={item.value} onChange={(e) => updItem(item.id, 'value', e.target.value)} className={`${inputCls} flex-1`} placeholder="0" />
                  <input value={item.suffix} onChange={(e) => updItem(item.id, 'suffix', e.target.value)} className={`${inputCls} w-12`} placeholder="M" />
                </div>
                <div className="flex gap-1">
                  <select value={item.trend} onChange={(e) => updItem(item.id, 'trend', e.target.value)} className={`${inputCls} flex-1`}>
                    <option value="up" className="bg-[#1C1008]">↑ Up</option>
                    <option value="down" className="bg-[#1C1008]">↓ Down</option>
                    <option value="neutral" className="bg-[#1C1008]">→ Neutral</option>
                  </select>
                  <input value={item.trendValue} onChange={(e) => updItem(item.id, 'trendValue', e.target.value)} className={`${inputCls} w-16`} placeholder="+5%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Design Panel ────────────────────────────────────────────────────────────

function DesignPanel({ report, onUpdateReport }: { report: ReportData; onUpdateReport: (u: (p: ReportData) => ReportData) => void }) {
  const [packs, setPacks] = useState<DesignPack[]>(() => getAllDesignPacks())
  const [showPackBuilder, setShowPackBuilder] = useState(false)
  const [newPack, setNewPack] = useState<Omit<DesignPack, 'id'>>({
    name: 'My Custom Pack',
    primaryColor: '#1E3A5F',
    accentColor: '#2D7DD2',
    headingColor: '#1E3A5F',
    textColor: '#374151',
    tableHeaderBg: '#1E3A5F',
    tableHeaderText: '#FFFFFF',
    kpiAccent: '#2D7DD2',
    fontFamily: 'Inter',
  })

  function saveCustomPack() {
    const id = `custom-${Date.now()}`
    const pack: DesignPack = { ...newPack, id }
    const custom = packs.filter((p) => !DESIGN_PACKS.find((d) => d.id === p.id))
    const updated = [...custom, pack]
    localStorage.setItem('report-custom-packs', JSON.stringify(updated))
    const all = [...DESIGN_PACKS, ...updated]
    setPacks(all)
    onUpdateReport((p) => ({ ...p, designPackId: id }))
    setShowPackBuilder(false)
  }

  function deleteCustomPack(id: string) {
    const custom = packs.filter((p) => !DESIGN_PACKS.find((d) => d.id === p.id) && p.id !== id)
    localStorage.setItem('report-custom-packs', JSON.stringify(custom))
    setPacks([...DESIGN_PACKS, ...custom])
    if (report.designPackId === id) onUpdateReport((p) => ({ ...p, designPackId: 'corporate-navy' }))
  }

  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'
  const colorRow = (label: string, key: keyof typeof newPack) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-slate-400 min-w-0 truncate">{label}</span>
      <input type="color" value={newPack[key] as string} onChange={(e) => setNewPack((p) => ({ ...p, [key]: e.target.value }))} className="h-6 w-10 shrink-0 cursor-pointer rounded" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Design Pack</label>
        <div className="flex flex-col gap-1.5">
          {packs.map((pack) => {
            const isCustom = !DESIGN_PACKS.find((d) => d.id === pack.id)
            return (
              <div key={pack.id} className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateReport((p) => ({ ...p, designPackId: pack.id }))}
                  className={`flex flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                    report.designPackId === pack.id ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full" style={{ background: pack.primaryColor }} />
                    <div className="h-3 w-3 rounded-full" style={{ background: pack.accentColor }} />
                  </div>
                  <span className={`text-xs ${report.designPackId === pack.id ? 'text-[#C9A84C]' : 'text-slate-300'}`}>{pack.name}</span>
                  {isCustom && <span className="ml-auto text-[9px] text-slate-600">Custom</span>}
                </button>
                {isCustom && (
                  <button onClick={() => deleteCustomPack(pack.id)} className="shrink-0 rounded p-1 text-slate-600 hover:text-red-400">✕</button>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={() => setShowPackBuilder((v) => !v)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs text-slate-500 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition">
          + Create Custom Pack
        </button>
      </div>

      {showPackBuilder && (
        <div className="rounded-lg border border-white/10 bg-[#120B07] p-3">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wide text-slate-400">New Custom Pack</p>
          <div className="flex flex-col gap-2">
            <input value={newPack.name} onChange={(e) => setNewPack((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Pack name" />
            {colorRow('Primary Color', 'primaryColor')}
            {colorRow('Accent Color', 'accentColor')}
            {colorRow('Heading Color', 'headingColor')}
            {colorRow('Table Header BG', 'tableHeaderBg')}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Font</span>
              <select value={newPack.fontFamily} onChange={(e) => setNewPack((p) => ({ ...p, fontFamily: e.target.value }))} className="w-32 rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]">
                {['Inter', 'Georgia', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display'].map((f) => <option key={f} value={f} className="bg-[#1C1008]">{f}</option>)}
              </select>
            </div>
            <button onClick={saveCustomPack} className="mt-1 w-full rounded-lg py-1.5 text-xs font-semibold text-white transition hover:brightness-110" style={{ background: '#C9A84C' }}>
              Save Pack
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Document Panel ──────────────────────────────────────────────────────────

function DocumentPanel({ report, onUpdateReport }: { report: ReportData; onUpdateReport: (u: (p: ReportData) => ReportData) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'
  const up = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, [field]: val }))
  const upCover = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, [field]: val } }))
  const upHF = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, headerFooter: { ...p.headerFooter, [field]: val } }))
  const upWm = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, watermark: { ...p.watermark, [field]: val } }))

  return (
    <div className="flex flex-col gap-4">
      {/* Page size */}
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Page Size</label>
        <select value={report.pageSize} onChange={(e) => up('pageSize', e.target.value)} className={inputCls}>
          <option value="A4" className="bg-[#1C1008]">A4 (210 × 297 mm)</option>
          <option value="Letter" className="bg-[#1C1008]">Letter (8.5 × 11 in)</option>
        </select>
      </div>

      {/* Document type */}
      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Document Type</label>
        <select value={report.documentType} onChange={(e) => up('documentType', e.target.value)} className={inputCls}>
          {DOCUMENT_TYPES.map(({ id, label }) => <option key={id} value={id} className="bg-[#1C1008]">{label}</option>)}
        </select>
      </div>

      {/* Cover page */}
      <details open>
        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wide text-slate-500">Cover Page</summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={report.coverPage.enabled} onChange={(e) => upCover('enabled', e.target.checked)} />
            Enable cover page
          </label>
          {report.coverPage.enabled && (
            <>
              <input value={report.coverPage.companyName} onChange={(e) => upCover('companyName', e.target.value)} className={inputCls} placeholder="Company Name" />
              <input value={report.coverPage.reportTitle} onChange={(e) => upCover('reportTitle', e.target.value)} className={inputCls} placeholder="Report Title" />
              <input value={report.coverPage.subtitle} onChange={(e) => upCover('subtitle', e.target.value)} className={inputCls} placeholder="Subtitle" />
              <input value={report.coverPage.date} onChange={(e) => upCover('date', e.target.value)} className={inputCls} placeholder="Date" />
              <label className="text-[10px] text-slate-500">Background Color</label>
              <input type="color" value={report.coverPage.primaryColor} onChange={(e) => upCover('primaryColor', e.target.value)} className="h-8 w-full cursor-pointer rounded" />
              <select value={report.coverPage.pattern} onChange={(e) => upCover('pattern', e.target.value)} className={inputCls}>
                {['none', 'grid', 'dots', 'diagonal'].map((p) => <option key={p} value={p} className="bg-[#1C1008]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <label className="text-[10px] text-slate-500">Logo Image</label>
              <ImageUploadField value={report.coverPage.logoUrl} onChange={(url) => upCover('logoUrl', url)} placeholder="Logo URL or upload" />
              <label className="text-[10px] text-slate-500">Background Image</label>
              <ImageUploadField value={report.coverPage.backgroundImageUrl} onChange={(url) => upCover('backgroundImageUrl', url)} placeholder="Background image URL or upload" />
            </>
          )}
        </div>
      </details>

      {/* Header & Footer */}
      <details>
        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wide text-slate-500">Header & Footer</summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={report.headerFooter.showHeader} onChange={(e) => upHF('showHeader', e.target.checked)} />
            Show header
          </label>
          {report.headerFooter.showHeader && (
            <>
              <input value={report.headerFooter.headerLeft} onChange={(e) => upHF('headerLeft', e.target.value)} className={inputCls} placeholder="Header left text" />
              <input value={report.headerFooter.headerRight} onChange={(e) => upHF('headerRight', e.target.value)} className={inputCls} placeholder="Header right text" />
            </>
          )}
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={report.headerFooter.showFooter} onChange={(e) => upHF('showFooter', e.target.checked)} />
            Show footer
          </label>
          {report.headerFooter.showFooter && (
            <>
              <input value={report.headerFooter.footerLeft} onChange={(e) => upHF('footerLeft', e.target.value)} className={inputCls} placeholder="Footer left text" />
              <input value={report.headerFooter.footerRight} onChange={(e) => upHF('footerRight', e.target.value)} className={inputCls} placeholder="Footer right text" />
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={report.headerFooter.showPageNumbers} onChange={(e) => upHF('showPageNumbers', e.target.checked)} />
                Show page numbers
              </label>
            </>
          )}
        </div>
      </details>

      {/* Watermark */}
      <details>
        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wide text-slate-500">Watermark (all pages)</summary>
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={report.watermark.enabled} onChange={(e) => upWm('enabled', e.target.checked)} />
            Enable on all pages (incl. cover)
          </label>
          {report.watermark.enabled && (
            <>
              <label className="text-[10px] text-slate-500">Text watermark</label>
              <input value={report.watermark.text} onChange={(e) => upWm('text', e.target.value)} className={inputCls} placeholder="CONFIDENTIAL" />
              <label className="text-[10px] text-slate-500">Text color</label>
              <input type="color" value={report.watermark.color || '#888888'} onChange={(e) => upWm('color', e.target.value)} className="h-8 w-full cursor-pointer rounded" />
              <label className="text-[10px] text-slate-500">— or — Image watermark</label>
              <ImageUploadField value={report.watermark.imageUrl || ''} onChange={(url) => upWm('imageUrl', url)} placeholder="Image URL or upload" />
              <p className="text-[9px] text-slate-600">Image watermark overrides text when set.</p>
              <label className="text-[10px] text-slate-500">Opacity: {Math.round(report.watermark.opacity * 100)}%</label>
              <input type="range" min={0.03} max={0.4} step={0.01} value={report.watermark.opacity} onChange={(e) => upWm('opacity', Number(e.target.value))} className="w-full" />
              <label className="text-[10px] text-slate-500">Rotation: {report.watermark.rotation}°</label>
              <input type="range" min={-90} max={90} value={report.watermark.rotation} onChange={(e) => upWm('rotation', Number(e.target.value))} className="w-full" />
            </>
          )}
        </div>
      </details>
    </div>
  )
}

// ── Print View (hidden, PDF target) ────────────────────────────────────────

function PrintView({ report, dp }: { report: ReportData; dp: DesignPack }) {
  const PAGE_STYLES: React.CSSProperties = {
    width: report.pageSize === 'A4' ? '210mm' : '215.9mm',
    minHeight: report.pageSize === 'A4' ? '297mm' : '279.4mm',
    padding: '20mm',
    background: '#FFFFFF',
    position: 'relative',
    pageBreakBefore: 'always',
    boxSizing: 'border-box',
    fontFamily: dp.fontFamily,
  }

  return (
    <div>
      {/* Cover page */}
      {report.coverPage.enabled && (
        <div style={{ ...PAGE_STYLES, background: report.coverPage.primaryColor || dp.primaryColor, padding: '40mm 20mm 20mm', position: 'relative', overflow: 'hidden' }}>
          {report.coverPage.backgroundImageUrl && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${report.coverPage.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          {report.coverPage.backgroundImageUrl && (
            <div style={{ position: 'absolute', inset: 0, background: `${report.coverPage.primaryColor || dp.primaryColor}CC` }} />
          )}
          <div style={{ position: 'relative', zIndex: 1, color: report.coverPage.textColor || '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            {report.coverPage.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={report.coverPage.logoUrl} alt="Logo" style={{ position: 'absolute', top: '-20mm', left: 0, maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
            )}
            {report.coverPage.companyName && <p style={{ fontSize: '10pt', marginBottom: '24pt', letterSpacing: '2px', opacity: 0.7, textTransform: 'uppercase' }}>{report.coverPage.companyName}</p>}
            <h1 style={{ fontSize: '28pt', fontWeight: 700, marginBottom: '8pt', lineHeight: 1.2 }}>{report.coverPage.reportTitle}</h1>
            {report.coverPage.subtitle && <p style={{ fontSize: '14pt', opacity: 0.8, marginBottom: '4pt' }}>{report.coverPage.subtitle}</p>}
            {report.coverPage.date && <p style={{ fontSize: '10pt', opacity: 0.6, marginTop: '16pt' }}>{report.coverPage.date}</p>}
          </div>
          {/* Watermark on cover page */}
          {report.watermark.enabled && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: report.watermark.opacity, transform: `rotate(${report.watermark.rotation}deg)` }}>
              {report.watermark.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={report.watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '48pt', fontWeight: 900, color: report.watermark.color || '#ffffff', letterSpacing: '8px' }}>{report.watermark.text}</span>
              }
            </div>
          )}
        </div>
      )}

      {report.pages.map((page, pageIdx) => (
        <div key={page.id} style={{ ...PAGE_STYLES, pageBreakBefore: pageIdx === 0 && !report.coverPage.enabled ? 'avoid' : 'always' }}>
          {/* Header */}
          {report.headerFooter.showHeader && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8mm', paddingBottom: '3mm', borderBottom: `2px solid ${dp.primaryColor}`, fontSize: '8pt', color: dp.primaryColor }}>
              <span>{report.headerFooter.headerLeft}</span>
              <span>{report.headerFooter.headerRight}</span>
            </div>
          )}

          {/* Shapes */}
          {(page.shapes || []).sort((a, b) => a.zIndex - b.zIndex).map((shape) => (
            <div key={shape.id} style={{ position: 'absolute', left: `${shape.x}%`, top: `${shape.y}%`, width: `${shape.width}%`, height: `${shape.height}%`, opacity: shape.opacity, transform: `rotate(${shape.rotation}deg)`, transformOrigin: 'center', zIndex: shape.zIndex }}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                {getShapeElement(shape)}
              </svg>
            </div>
          ))}

          {/* Watermark */}
          {report.watermark.enabled && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: report.watermark.opacity, transform: `rotate(${report.watermark.rotation}deg)` }}>
              {report.watermark.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={report.watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '48pt', fontWeight: 900, color: report.watermark.color || '#888', letterSpacing: '8px' }}>{report.watermark.text}</span>
              }
            </div>
          )}

          {/* Blocks */}
          {page.blocks.map((block) => (
            <div key={block.id} style={{ marginBottom: '12pt' }}>
              {renderPrintBlock(block, dp, report)}
            </div>
          ))}

          {/* Footer */}
          {report.headerFooter.showFooter && (
            <div style={{ position: 'absolute', bottom: '10mm', left: '20mm', right: '20mm', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: dp.textColor, borderTop: `1px solid ${dp.primaryColor}20`, paddingTop: '3mm' }}>
              <span>{report.headerFooter.footerLeft}</span>
              <div style={{ display: 'flex', gap: '12pt' }}>
                <span>{report.headerFooter.footerRight}</span>
                {report.headerFooter.showPageNumbers && <span style={{ color: dp.primaryColor, fontWeight: 600 }}>{pageIdx + 1}</span>}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function renderPrintBlock(block: ReportBlock, dp: DesignPack, report?: ReportData): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const sizes: Record<number, string> = { 1: '20pt', 2: '15pt', 3: '12pt' }
      const margins: Record<number, string> = { 1: '12pt', 2: '8pt', 3: '6pt' }
      return (
        <div style={{ fontSize: sizes[block.level], fontWeight: 700, color: block.color || dp.headingColor, marginBottom: margins[block.level], textAlign: block.align, fontFamily: dp.fontFamily }}>
          {block.content}
        </div>
      )
    }
    case 'text':
      return <div style={{ fontSize: '10pt', lineHeight: 1.6, color: dp.textColor, textAlign: block.align, whiteSpace: 'pre-wrap', fontFamily: dp.fontFamily }}>{block.content}</div>
    case 'table': {
      const hBg = block.headerBg || dp.tableHeaderBg
      const hTxt = block.headerText || dp.tableHeaderText
      return (
        <div>
          {block.caption && <p style={{ fontSize: '8pt', color: '#666', fontStyle: 'italic', marginBottom: '4pt' }}>{block.caption}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', fontFamily: dp.fontFamily, tableLayout: 'fixed', wordBreak: 'break-word' }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} style={{ padding: '4pt 6pt', textAlign: 'left', background: hBg, color: hTxt, fontSize: '8pt', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', border: block.bordered ? '1px solid #ccc' : 'none', overflowWrap: 'break-word' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ background: block.striped && rIdx % 2 === 1 ? '#F8FAFC' : 'white' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '3pt 6pt', textAlign: cell.align, fontWeight: cell.bold ? 600 : 400, color: dp.textColor, border: block.bordered ? '1px solid #E5E7EB' : 'none', overflowWrap: 'break-word' }}>{cell.content}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'kpi': {
      const accent = block.accentColor || dp.kpiAccent
      return (
        <div>
          {block.title && <p style={{ fontSize: '9pt', fontWeight: 600, color: dp.headingColor, marginBottom: '6pt', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{block.title}</p>}
          <div style={{ display: 'flex', gap: '8pt', flexWrap: 'wrap' }}>
            {block.items.map((item) => (
              <div key={item.id} style={{ flex: '1 1 0', minWidth: '60pt', padding: '6pt', background: `${accent}15`, borderLeft: `3pt solid ${accent}`, borderRadius: '3pt' }}>
                <p style={{ fontSize: '7pt', color: '#666', marginBottom: '2pt' }}>{item.label}</p>
                <p style={{ fontSize: '14pt', fontWeight: 700, color: accent, lineHeight: 1 }}>{item.prefix}{item.value}{item.suffix}</p>
                {item.trendValue && <p style={{ fontSize: '7pt', color: item.trend === 'up' ? '#059669' : item.trend === 'down' ? '#DC2626' : '#666', marginTop: '2pt' }}>{item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'} {item.trendValue}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'image':
      return block.url ? (
        <div style={{ textAlign: block.align }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} style={{ maxWidth: '100%', height: 'auto' }} />
          {block.caption && <p style={{ fontSize: '8pt', color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: '4pt' }}>{block.caption}</p>}
        </div>
      ) : null
    case 'chart':
      return <ChartBlockView block={block} dp={dp} forPrint />
    case 'divider': {
      const color = block.color || dp.primaryColor
      const styles: Record<string, string> = { solid: 'solid', dashed: 'dashed', double: 'double' }
      return <hr style={{ border: 'none', borderTop: `${block.thickness}px ${styles[block.style]} ${color}60`, margin: '6pt 0' }} />
    }
    case 'spacer':
      return <div style={{ height: `${block.height}px` }} />
    case 'toc': {
      const pages = report?.pages ?? []
      return (
        <div>
          <div style={{ fontSize: '14pt', fontWeight: 700, color: dp.headingColor, marginBottom: '8pt', fontFamily: dp.fontFamily }}>{block.title || 'Table of Contents'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
            {pages.map((page, idx) => (
              <div key={page.id} style={{ display: 'flex', alignItems: 'center', fontSize: '10pt', color: dp.textColor, fontFamily: dp.fontFamily }}>
                <span>{page.title}</span>
                {block.includePageNumbers && (
                  <>
                    <div style={{ flex: 1, borderBottom: `1px dashed ${dp.textColor}40`, margin: '0 4pt' }} />
                    <span style={{ fontWeight: 600, color: dp.primaryColor }}>{idx + 1}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
}

// ── Report Picker ───────────────────────────────────────────────────────────

function ReportPicker({ docs, userName, onOpen, onNew }: { docs: ReportDoc[]; userName?: string | null; onOpen: (d: ReportDoc) => void; onNew: () => void }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#120B07] p-6 font-sans">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="anim-orb absolute rounded-full" style={{ width: 600, height: 600, top: -180, right: -160, background: 'radial-gradient(circle, rgba(201,168,76,.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="anim-orb-slow absolute rounded-full" style={{ width: 500, height: 500, bottom: -140, left: -140, background: 'radial-gradient(circle, rgba(13,144,128,.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>
      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Image src="/logoface.png" alt="BrandFox" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!</h1>
            <p className="mt-0.5 text-sm text-slate-400">Open an existing report or start a new one.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {docs.map((doc) => (
            <button key={doc.id} onClick={() => onOpen(doc)} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#2D1B11] px-5 py-4 text-left transition hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{doc.name || 'Untitled'}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDate(doc.updatedAt)}</p>
              </div>
              <span className="ml-4 shrink-0 text-xs font-medium text-[#C9A84C]">Open →</span>
            </button>
          ))}
        </div>
        <button onClick={onNew} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 text-sm font-medium text-slate-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Report
        </button>
        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition">← Back to Resume Builder</Link>
        </div>
      </div>
    </div>
  )
}

// ── Report Docs Modal ───────────────────────────────────────────────────────

function ReportDocsModal({ docs, currentId, onOpen, onNew, onClose, onRefresh }: {
  docs: ReportDoc[]; currentId: string | null;
  onOpen: (d: ReportDoc) => void; onNew: () => void;
  onClose: () => void; onRefresh: () => void
}) {
  useEffect(() => { onRefresh() }, [])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">My Reports</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="max-h-80 overflow-y-auto p-3">
          {docs.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No reports yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {docs.map((doc) => (
                <button key={doc.id} onClick={() => onOpen(doc)} className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left transition ${currentId === doc.id ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-white/10 hover:bg-white/5'}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{doc.name || 'Untitled'}</p>
                    <p className="text-xs text-slate-500">{formatDate(doc.updatedAt)}</p>
                  </div>
                  {currentId === doc.id && <span className="ml-2 shrink-0 text-[10px] text-[#C9A84C]">Current</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-3">
          <button onClick={onNew} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2.5 text-sm font-medium text-slate-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Report
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Menu ───────────────────────────────────────────────────────────────

function UserMenu({ user, open, onToggle, onClose, onNew, onDocs }: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  open: boolean; onToggle: () => void; onClose: () => void; onNew: () => void; onDocs: () => void
}) {
  const initials = (user.name || user.email || '?').slice(0, 1).toUpperCase()
  return (
    <div className="relative">
      <button onClick={onToggle} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-white transition hover:bg-white/10">
        {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-white/10 bg-[#2D1B11] py-1 shadow-2xl">
            <div className="border-b border-white/10 px-3 py-2">
              <div className="truncate text-sm font-semibold text-white">{user.name || user.email?.split('@')[0]}</div>
              {user.email && <div className="truncate text-xs text-slate-400">{user.email}</div>}
            </div>
            <button onClick={() => { onClose(); onNew() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Report
            </button>
            <button onClick={() => { onClose(); onDocs() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              My Reports
            </button>
            <Link href="/" onClick={onClose} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Resume Builder
            </Link>
            <div className="my-1 border-t border-white/10" />
            <button onClick={() => { onClose(); signOut() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── AI Hook + Context Helpers ───────────────────────────────────────────────

function useAI() {
  const [result, setResult] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(async (action: string, content: string, tone?: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setStatus('loading')
    setResult('')
    setError('')
    try {
      const res = await fetch('/api/reports/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content, tone }),
        signal: ac.signal,
      })
      if (!res.ok) throw new Error(await res.text())
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setResult(full)
      }
      setStatus('done')
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') return
      setError((e as Error).message || 'AI generation failed')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setResult(''); setStatus('idle'); setError('')
  }, [])

  return { result, status, error, generate, reset }
}

function buildReportContext(report: ReportData, docName: string): string {
  const lines = [`Document: ${docName}`]
  for (const page of report.pages) {
    lines.push(`\n--- Page: ${page.title} ---`)
    for (const block of page.blocks) {
      if (block.type === 'heading') lines.push(`${'#'.repeat(block.level)} ${block.content}`)
      else if (block.type === 'text') lines.push(block.content.slice(0, 400))
      else if (block.type === 'kpi') lines.push(`Metrics: ${block.items.map((i) => `${i.label}: ${i.prefix}${i.value}${i.suffix}${i.trendValue ? ` (${i.trendValue})` : ''}`).join(', ')}`)
      else if (block.type === 'table') lines.push(`Table "${block.caption || block.headers.join('/')}" — ${block.headers.join(' | ')} (${block.rows.length} rows)`)
      else if (block.type === 'chart') lines.push(`Chart "${block.title}" — ${block.chartType}: ${block.labels.join(', ')}`)
    }
  }
  return lines.join('\n')
}

function buildToCContext(report: ReportData, docName: string): string {
  const lines = [`Document: ${docName}`, '']
  for (const page of report.pages) {
    lines.push(`Page: ${page.title}`)
    for (const block of page.blocks) {
      if (block.type === 'heading') lines.push(`  ${'  '.repeat(block.level - 1)}H${block.level}: ${block.content}`)
    }
  }
  return lines.join('\n')
}

function buildBlockContext(block: ReportBlock): string {
  if (block.type === 'table') {
    const rows = block.rows.map((r) => r.map((c) => c.content).join(' | '))
    return [`Table: ${block.caption || 'Data'}`, `Headers: ${block.headers.join(' | ')}`, ...rows].join('\n')
  }
  if (block.type === 'chart') {
    return [`Chart: ${block.title} (${block.chartType})`, `Labels: ${block.labels.join(', ')}`,
      ...block.datasets.map((ds) => `${ds.label}: ${ds.data.join(', ')}`),
    ].join('\n')
  }
  if (block.type === 'kpi') {
    return [`KPI Block: ${block.title}`, ...block.items.map((i) => `${i.label}: ${i.prefix}${i.value}${i.suffix}${i.trendValue ? ` (${i.trendValue})` : ''}`)].join('\n')
  }
  if (block.type === 'text') return block.content
  return ''
}

// ── AI Panel ────────────────────────────────────────────────────────────────

function AIPanel({
  report, docName, selectedBlock, selectedBlockPageId, onUpdateBlock, onUpdateReport,
}: {
  report: ReportData
  docName: string
  selectedBlock: ReportBlock | null
  selectedBlockPageId: string | null
  onUpdateBlock: (updates: Record<string, unknown>) => void
  onUpdateReport: (updater: (prev: ReportData) => ReportData) => void
}) {
  const { result, status, error, generate, reset } = useAI()
  const [tone, setTone] = useState('professional')
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const loading = status === 'loading'
  const done = status === 'done'

  function runAction(action: string) {
    setActiveAction(action)
    let content = ''
    if (action === 'exec-summary') content = buildReportContext(report, docName)
    else if (action === 'toc') content = buildToCContext(report, docName)
    else if (action === 'rewrite') content = selectedBlock?.type === 'text' ? (selectedBlock as TextBlock).content : ''
    else if (action === 'insights') content = selectedBlock ? buildBlockContext(selectedBlock) : ''
    generate(action, content, action === 'rewrite' ? tone : undefined)
  }

  function applyResult() {
    if (!result) return
    if (activeAction === 'rewrite' && selectedBlock?.type === 'text') {
      onUpdateBlock({ content: result })
      reset()
    } else if (activeAction === 'exec-summary') {
      onUpdateReport((prev) => ({
        ...prev,
        pages: prev.pages.length === 0 ? prev.pages : [
          { ...prev.pages[0], blocks: [{ id: uuidv4(), type: 'text' as const, content: result, align: 'left' as const }, ...prev.pages[0].blocks] },
          ...prev.pages.slice(1),
        ],
      }))
      reset()
    } else if (activeAction === 'toc') {
      const tocPage: ReportPage = {
        id: uuidv4(),
        title: 'Table of Contents',
        blocks: [
          { id: uuidv4(), type: 'heading', content: 'Table of Contents', level: 1, align: 'left', color: '' },
          { id: uuidv4(), type: 'text', content: result, align: 'left' },
        ],
      }
      onUpdateReport((prev) => ({ ...prev, pages: [tocPage, ...prev.pages] }))
      reset()
    } else if (activeAction === 'insights') {
      if (!selectedBlockPageId) return
      const insightBlock: ReportBlock = { id: uuidv4(), type: 'text', content: result, align: 'left' }
      onUpdateReport((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id !== selectedBlockPageId ? p : {
            ...p,
            blocks: (() => {
              const idx = p.blocks.findIndex((b) => b.id === selectedBlock?.id)
              const arr = [...p.blocks]
              arr.splice(idx + 1, 0, insightBlock)
              return arr
            })(),
          }
        ),
      }))
      reset()
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result).catch(() => {})
  }

  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'

  const hasTextBlock = selectedBlock?.type === 'text'
  const hasDataBlock = selectedBlock?.type === 'table' || selectedBlock?.type === 'chart' || selectedBlock?.type === 'kpi'
  const contextLabel = hasTextBlock ? '✍️ Rewriting selected text block'
    : hasDataBlock ? `📊 Analyzing selected ${selectedBlock?.type} block`
    : null

  return (
    <div className="flex flex-col gap-4">
      {contextLabel && (
        <div className="rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-3 py-2 text-[10px] text-[#C9A84C]">
          {contextLabel}
        </div>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-1.5">
        {([
          { action: 'exec-summary', label: 'Executive Summary', desc: 'Generate from full report', icon: '📝', disabled: false },
          { action: 'toc', label: 'Table of Contents', desc: 'From pages & headings', icon: '📋', disabled: false },
          { action: 'rewrite', label: 'Rewrite Text', desc: 'Improve selected text block', icon: '✍️', disabled: !hasTextBlock },
          { action: 'insights', label: 'Data Insights', desc: 'Analyse selected block', icon: '💡', disabled: !hasDataBlock },
        ] as const).map(({ action, label, desc, icon, disabled }) => (
          <button
            key={action}
            onClick={() => !disabled && runAction(action)}
            disabled={disabled || loading}
            className={`flex flex-col gap-1 rounded-lg border p-2.5 text-left transition ${
              activeAction === action && (loading || done)
                ? 'border-[#C9A84C] bg-[#C9A84C]/10'
                : disabled ? 'border-white/5 opacity-40 cursor-not-allowed'
                : 'border-white/10 hover:border-[#C9A84C]/40 hover:bg-white/5 cursor-pointer'
            }`}
          >
            <span className="text-base">{icon}</span>
            <span className="text-[10px] font-semibold text-white">{label}</span>
            <span className="text-[9px] text-slate-500 leading-relaxed">{desc}</span>
          </button>
        ))}
      </div>

      {/* Tone selector (for rewrite) */}
      {(hasTextBlock || activeAction === 'rewrite') && (
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Rewrite Tone</label>
          <div className="grid grid-cols-2 gap-1">
            {(['professional', 'concise', 'formal', 'persuasive'] as const).map((t) => (
              <button key={t} onClick={() => setTone(t)}
                className={`rounded border py-1 text-[10px] capitalize transition ${tone === t ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
          Generating…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] text-red-400">
          {error.includes('not configured') ? (
            <>AI not configured. Add <code className="font-mono">ANTHROPIC_API_KEY</code> to your .env.local file.</>
          ) : error}
        </div>
      )}

      {/* Result preview */}
      {(result || loading) && (
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Preview {loading && '(streaming…)'}
          </label>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-[#120B07] p-2.5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {result || <span className="animate-pulse text-slate-600">▌</span>}
          </div>
        </div>
      )}

      {/* Apply / Copy actions */}
      {done && result && (
        <div className="flex gap-2">
          <button
            onClick={applyResult}
            className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition hover:brightness-110"
            style={{ background: '#C9A84C' }}
          >
            {activeAction === 'rewrite' ? 'Apply to Block'
              : activeAction === 'exec-summary' ? 'Insert at Top'
              : activeAction === 'toc' ? 'Insert as Page'
              : 'Add After Block'}
          </button>
          <button onClick={copyResult} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-400 hover:text-white transition">
            Copy
          </button>
          <button onClick={reset} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-400 hover:text-white transition">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// ── Image Upload Field ──────────────────────────────────────────────────────

function ImageUploadField({ value, onChange, placeholder }: { value: string; onChange: (url: string) => void; placeholder?: string }) {
  const [sizeWarning, setSizeWarning] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (file.size > 3 * 1024 * 1024) {
      setSizeWarning('File is large (>3 MB). Consider resizing before uploading.')
    } else {
      setSizeWarning('')
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => { setSizeWarning(''); onChange(e.target.value) }}
          className="flex-1 rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]"
          placeholder={placeholder ?? 'URL or upload'}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-[#C9A84C] transition"
          title="Upload image"
        >
          ↑
        </button>
      </div>
      {sizeWarning && <p className="text-[10px] text-amber-400">{sizeWarning}</p>}
      {value && value.startsWith('data:') && (
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-10 w-10 rounded object-contain border border-white/10" />
          <button onClick={() => onChange('')} className="text-[10px] text-slate-500 hover:text-red-400">Remove</button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

// ── Chart Block View ────────────────────────────────────────────────────────

function ChartBlockView({ block, dp, forPrint = false }: { block: ChartBlock; dp: DesignPack; forPrint?: boolean }) {
  const data = block.labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label }
    block.datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0 })
    return point
  })

  const pieData = block.labels.map((label, i) => ({
    name: label,
    value: block.datasets[0]?.data[i] ?? 0,
  }))

  const commonProps = {
    data,
    margin: { top: 4, right: 8, left: 0, bottom: 4 },
  }

  const gridEl = block.showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /> : null
  const xEl = <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
  const yEl = <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
  const ttEl = <Tooltip contentStyle={{ fontSize: '11px' }} />
  const lgEl = block.showLegend ? <Legend wrapperStyle={{ fontSize: '11px' }} /> : null

  let chart: React.ReactNode
  if (block.chartType === 'pie' || block.chartType === 'donut') {
    chart = (
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={block.chartType === 'donut' ? '50%' : 0}
          outerRadius="70%"
          label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={block.datasets[0]?.color ? (i === 0 ? block.datasets[0].color : CHART_PALETTE[i % CHART_PALETTE.length]) : CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Pie>
        {ttEl}
        {lgEl}
      </PieChart>
    )
  } else if (block.chartType === 'bar') {
    chart = (
      <BarChart {...commonProps}>
        {gridEl}{xEl}{yEl}{ttEl}{lgEl}
        {block.datasets.map((ds) => <Bar key={ds.id} dataKey={ds.label} fill={ds.color} radius={[2, 2, 0, 0]} />)}
      </BarChart>
    )
  } else if (block.chartType === 'line') {
    chart = (
      <LineChart {...commonProps}>
        {gridEl}{xEl}{yEl}{ttEl}{lgEl}
        {block.datasets.map((ds) => <Line key={ds.id} type="monotone" dataKey={ds.label} stroke={ds.color} strokeWidth={2} dot={{ r: 3 }} />)}
      </LineChart>
    )
  } else {
    chart = (
      <AreaChart {...commonProps}>
        {gridEl}{xEl}{yEl}{ttEl}{lgEl}
        {block.datasets.map((ds) => (
          <Area key={ds.id} type="monotone" dataKey={ds.label} stroke={ds.color} fill={`${ds.color}30`} strokeWidth={2} />
        ))}
      </AreaChart>
    )
  }

  return (
    <div style={{ fontFamily: dp.fontFamily }}>
      {block.title && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: dp.headingColor }}>
          {block.title}
        </p>
      )}
      {forPrint ? (
        <div style={{ width: '100%', height: block.height }}>
          <ResponsiveContainer width="100%" height="100%">{chart as React.ReactElement}</ResponsiveContainer>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={block.height}>{chart as React.ReactElement}</ResponsiveContainer>
      )}
      {block.sourceFile && (
        <p className="mt-1 text-[10px] text-gray-400 italic">Source: {block.sourceFile}</p>
      )}
    </div>
  )
}

// ── Chart Editor ────────────────────────────────────────────────────────────

function ChartEditor({ block, onUpdate }: { block: ChartBlock; onUpdate: (u: Record<string, unknown>) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>

  function updDataset(id: string, field: keyof ChartDataset, val: unknown) {
    onUpdate({ datasets: block.datasets.map((ds) => ds.id !== id ? ds : { ...ds, [field]: val }) })
  }

  function addDataset() {
    const newDs: ChartDataset = {
      id: uuidv4(),
      label: `Series ${block.datasets.length + 1}`,
      data: block.labels.map(() => 0),
      color: CHART_PALETTE[block.datasets.length % CHART_PALETTE.length],
    }
    onUpdate({ datasets: [...block.datasets, newDs] })
  }

  function removeDataset(id: string) {
    if (block.datasets.length <= 1) return
    onUpdate({ datasets: block.datasets.filter((ds) => ds.id !== id) })
  }

  function updateLabels(raw: string) {
    const labels = raw.split('\n').map((s) => s.trim()).filter(Boolean)
    const datasets = block.datasets.map((ds) => ({
      ...ds,
      data: labels.map((_, i) => ds.data[i] ?? 0),
    }))
    onUpdate({ labels, datasets })
  }

  function updateDatasetValues(id: string, raw: string) {
    const data = raw.split(',').map((s) => parseFloat(s.trim()) || 0)
    updDataset(id, 'data', data)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>{label('Title')}<input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inputCls} /></div>

      <div>
        {label('Chart Type')}
        <div className="grid grid-cols-3 gap-1">
          {(['bar', 'line', 'area', 'pie', 'donut'] as const).map((t) => (
            <button key={t} onClick={() => onUpdate({ chartType: t })}
              className={`rounded border py-1 text-[10px] capitalize transition ${block.chartType === t ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        {label(`Height: ${block.height}px`)}
        <input type="range" min={150} max={500} value={block.height} onChange={(e) => onUpdate({ height: Number(e.target.value) })} className="w-full" />
      </div>

      <div className="flex gap-3">
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.showLegend} onChange={(e) => onUpdate({ showLegend: e.target.checked })} />
          Legend
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.showGrid} onChange={(e) => onUpdate({ showGrid: e.target.checked })} />
          Grid
        </label>
      </div>

      <div>
        {label('Labels (one per line)')}
        <textarea
          value={block.labels.join('\n')}
          onChange={(e) => updateLabels(e.target.value)}
          rows={5}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Datasets</span>
          <button onClick={addDataset} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-[#C9A84C]">+ Add</button>
        </div>
        <div className="flex flex-col gap-2">
          {block.datasets.map((ds) => (
            <div key={ds.id} className="rounded border border-white/10 p-2">
              <div className="mb-1.5 flex items-center gap-1.5">
                <input value={ds.label} onChange={(e) => updDataset(ds.id, 'label', e.target.value)} className={`${inputCls} flex-1`} />
                <input type="color" value={ds.color} onChange={(e) => updDataset(ds.id, 'color', e.target.value)} className="h-6 w-8 shrink-0 cursor-pointer rounded" />
                {block.datasets.length > 1 && (
                  <button onClick={() => removeDataset(ds.id)} className="shrink-0 text-slate-500 hover:text-red-400">✕</button>
                )}
              </div>
              <div>{label('Values (comma-separated)')}</div>
              <input
                value={ds.data.join(', ')}
                onChange={(e) => updateDatasetValues(ds.id, e.target.value)}
                className={inputCls}
                placeholder="65, 59, 80, 81, 56, 72"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── File Import Modal ───────────────────────────────────────────────────────

interface ParsedSheet {
  name: string
  rows: unknown[][]
}

function FileImportModal({
  currentPageId, dp, onImport, onClose,
}: {
  currentPageId: string
  dp: DesignPack
  onImport: (pageId: string, block: ReportBlock) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<'upload' | 'configure'>('upload')
  const [sheets, setSheets] = useState<ParsedSheet[]>([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [fileName, setFileName] = useState('')
  const [importAs, setImportAs] = useState<'table' | 'chart'>('table')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setLoading(true)
    setError('')
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
      const parsed: ParsedSheet[] = wb.SheetNames.map((name) => ({
        name,
        rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }) as unknown[][],
      }))
      setSheets(parsed)
      setFileName(file.name)
      setCaption(file.name.replace(/\.[^.]+$/, ''))
      setStep('configure')
    } catch {
      setError('Could not parse this file. Make sure it is a valid XLSX or CSV.')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleImport() {
    const sheet = sheets[activeSheet]
    if (!sheet || sheet.rows.length === 0) return

    if (importAs === 'table') {
      const [headerRow, ...dataRows] = sheet.rows
      const headers = (headerRow as unknown[]).map(String)
      const rows: TableCell[][] = dataRows.map((row) =>
        (row as unknown[]).map((cell) => ({ content: String(cell ?? ''), bold: false, align: 'left' as const }))
      )
      const block: TableBlock = {
        id: uuidv4(), type: 'table', caption,
        headers, rows, striped: true, bordered: true, headerBg: '', headerText: '',
      }
      onImport(currentPageId, block)
    } else {
      const [headerRow, ...dataRows] = sheet.rows
      const allHeaders = (headerRow as unknown[]).map(String)
      const labels = dataRows.map((row) => String((row as unknown[])[0] ?? ''))
      const datasets: ChartDataset[] = allHeaders.slice(1).map((h, i) => ({
        id: uuidv4(),
        label: h,
        data: dataRows.map((row) => {
          const v = (row as unknown[])[i + 1]
          return typeof v === 'number' ? v : parseFloat(String(v)) || 0
        }),
        color: CHART_PALETTE[i % CHART_PALETTE.length],
      }))
      const block: ChartBlock = {
        id: uuidv4(), type: 'chart', title: caption,
        chartType: 'bar', labels, datasets,
        height: 300, showLegend: true, showGrid: true, sourceFile: fileName,
      }
      onImport(currentPageId, block)
    }
  }

  const preview = sheets[activeSheet]?.rows.slice(0, 6) ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Import File</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-5">
          {step === 'upload' ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-white/20 py-14 cursor-pointer transition hover:border-[#C9A84C]/50 hover:bg-white/5"
            >
              <svg className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {loading ? (
                <p className="text-sm text-slate-400">Parsing file…</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-white">Drop a file here or click to browse</p>
                  <p className="text-xs text-slate-500">Supports XLSX, XLS, CSV</p>
                </>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Sheet selector */}
              {sheets.length > 1 && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">Sheet</label>
                  <div className="flex flex-wrap gap-1.5">
                    {sheets.map((s, i) => (
                      <button key={i} onClick={() => setActiveSheet(i)}
                        className={`rounded-md border px-2.5 py-1 text-xs transition ${activeSheet === i ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/15 text-slate-300 hover:bg-white/5'}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">Preview ({sheets[activeSheet]?.rows.length ?? 0} rows)</label>
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <table className="w-full text-xs" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
                    <tbody>
                      {preview.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx === 0 ? 'bg-white/10 font-semibold text-white' : 'text-slate-300'}>
                          {(row as unknown[]).slice(0, 6).map((cell, cIdx) => (
                            <td key={cIdx} className="truncate border-b border-white/5 px-2 py-1">{String(cell ?? '')}</td>
                          ))}
                          {(row as unknown[]).length > 6 && <td className="border-b border-white/5 px-2 py-1 text-slate-500">+{(row as unknown[]).length - 6} more</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">Caption / Title</label>
                  <input value={caption} onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">Import As</label>
                  <div className="flex gap-2">
                    {(['table', 'chart'] as const).map((t) => (
                      <button key={t} onClick={() => setImportAs(t)}
                        className={`flex-1 rounded border py-1.5 text-xs capitalize transition ${importAs === t ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                        {t === 'table' ? '⊞ Table' : '📈 Chart'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 'configure' && (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
            <button onClick={() => { setStep('upload'); setSheets([]) }} className="text-xs text-slate-400 hover:text-white">← Back</button>
            <button
              onClick={handleImport}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ background: '#C9A84C' }}
            >
              Import {importAs === 'table' ? 'Table' : 'Chart'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Share Modal ─────────────────────────────────────────────────────────────

function ShareModal({ report, docName, onClose }: { report: ReportData; docName: string; onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error' | 'revoking'>('idle')
  const [shareId, setShareId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const shareUrl = shareId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/report/share/${shareId}`
    : ''

  async function createShare() {
    setStatus('creating')
    setError('')
    try {
      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportName: docName, reportData: report }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { shareId: id } = await res.json() as { shareId: string }
      setShareId(id)
      setStatus('done')
    } catch (e) {
      setError((e as Error).message || 'Failed to create share link')
      setStatus('error')
    }
  }

  async function revokeShare() {
    if (!shareId) return
    setStatus('revoking')
    try {
      await fetch(`/api/reports/share/${shareId}`, { method: 'DELETE' })
      setShareId(null)
      setStatus('idle')
    } catch {
      setStatus('done')
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Share Report</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create a public read-only link for this report</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5">
          {status === 'idle' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-white/10 bg-[#120B07] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.1 1.1" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Public shareable link</p>
                    <p className="mt-1 text-xs text-slate-400">Anyone with the link can view this report. The link contains a snapshot of the report at this moment — future edits won't be reflected.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={createShare}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: '#C9A84C' }}
              >
                Create Share Link
              </button>
            </div>
          )}

          {status === 'creating' && (
            <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <span className="text-sm">Creating link…</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
              <button onClick={() => setStatus('idle')} className="text-xs text-slate-400 hover:text-white transition">← Try again</button>
            </div>
          )}

          {(status === 'done' || status === 'revoking') && shareId && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Share Link</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-lg border border-white/10 bg-[#120B07] px-3 py-2 text-xs text-slate-300 outline-none select-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyLink}
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium transition"
                    style={{ color: copied ? '#10b981' : '#C9A84C', borderColor: copied ? '#10b981' : undefined }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 py-2 text-xs text-slate-300 transition hover:bg-white/5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Preview
                </a>
                <button
                  onClick={revokeShare}
                  disabled={status === 'revoking'}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 py-2 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  {status === 'revoking'
                    ? <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Revoking…</>
                    : <>Revoke Link</>
                  }
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-600">Revoking the link will make it inaccessible immediately.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shape View (editor canvas) ──────────────────────────────────────────────

function ShapeView({ shape, isSelected, containerRef, onSelect, onUpdate }: {
  shape: ShapeItem
  isSelected: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: (e: React.MouseEvent) => void
  onUpdate: (upd: Partial<ShapeItem>) => void
}) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: shape.x, origY: shape.y }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const container = containerRef.current
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    const dx = ((e.clientX - dragRef.current.startX) / width) * 100
    const dy = ((e.clientY - dragRef.current.startY) / height) * 100
    onUpdate({
      x: Math.max(0, Math.min(99 - shape.width, dragRef.current.origX + dx)),
      y: Math.max(0, Math.min(99 - shape.height, dragRef.current.origY + dy)),
    })
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        width: `${shape.width}%`,
        height: `${shape.height}%`,
        opacity: shape.opacity,
        transform: `rotate(${shape.rotation}deg)`,
        transformOrigin: 'center',
        cursor: 'move',
        pointerEvents: 'auto',
        zIndex: shape.zIndex + 5,
        outline: isSelected ? '2px solid #2D7DD2' : undefined,
        outlineOffset: '2px',
      }}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        {getShapeElement(shape)}
      </svg>
    </div>
  )
}

// ── Shape Editor ────────────────────────────────────────────────────────────

function ShapeEditor({ shape, pageShapes, onUpdate, onDelete, onReorder, onSaveTemplate }: {
  shape: ShapeItem
  pageShapes: ShapeItem[]
  onUpdate: (upd: Partial<ShapeItem>) => void
  onDelete: () => void
  onReorder: (dir: 'up' | 'down') => void
  onSaveTemplate: (name: string) => void
}) {
  const [tplName, setTplName] = useState('')
  const [showTplSave, setShowTplSave] = useState(false)
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>
  const shapeIdx = pageShapes.findIndex((s) => s.id === shape.id)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold capitalize text-white">{shape.type}</span>
        <button onClick={onDelete} className="rounded p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>{label('X %')}<input type="number" min={0} max={99} value={Math.round(shape.x)} onChange={(e) => onUpdate({ x: Number(e.target.value) })} className={inputCls} /></div>
        <div>{label('Y %')}<input type="number" min={0} max={99} value={Math.round(shape.y)} onChange={(e) => onUpdate({ y: Number(e.target.value) })} className={inputCls} /></div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>{label('W %')}<input type="number" min={1} max={100} value={Math.round(shape.width)} onChange={(e) => onUpdate({ width: Number(e.target.value) })} className={inputCls} /></div>
        <div>{label('H %')}<input type="number" min={1} max={100} value={Math.round(shape.height)} onChange={(e) => onUpdate({ height: Number(e.target.value) })} className={inputCls} /></div>
      </div>

      {/* Fill */}
      <div className="grid grid-cols-2 gap-2">
        <div>{label('Fill')}<input type="color" value={shape.fill} onChange={(e) => onUpdate({ fill: e.target.value })} className="h-8 w-full cursor-pointer rounded" /></div>
        <div>{label('Fill opacity %')}<input type="number" min={0} max={100} value={Math.round(shape.fillOpacity * 100)} onChange={(e) => onUpdate({ fillOpacity: Number(e.target.value) / 100 })} className={inputCls} /></div>
      </div>

      {/* Stroke */}
      <div className="grid grid-cols-2 gap-2">
        <div>{label('Stroke')}<input type="color" value={shape.stroke || '#000000'} onChange={(e) => onUpdate({ stroke: e.target.value })} className="h-8 w-full cursor-pointer rounded" /></div>
        <div>{label('Stroke px')}<input type="number" min={0} max={20} value={shape.strokeWidth} onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })} className={inputCls} /></div>
      </div>

      {/* Rotation & opacity */}
      <div>{label(`Rotation: ${shape.rotation}°`)}<input type="range" min={-180} max={180} value={shape.rotation} onChange={(e) => onUpdate({ rotation: Number(e.target.value) })} className="w-full" /></div>
      <div>{label(`Opacity: ${Math.round(shape.opacity * 100)}%`)}<input type="range" min={0} max={1} step={0.05} value={shape.opacity} onChange={(e) => onUpdate({ opacity: Number(e.target.value) })} className="w-full" /></div>

      {/* Corner radius for rect */}
      {shape.type === 'rect' && (
        <div>{label(`Corner radius: ${shape.borderRadius}px`)}<input type="range" min={0} max={80} value={shape.borderRadius} onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })} className="w-full" /></div>
      )}

      {/* Layer ordering */}
      <div>
        {label('Layer')}
        <div className="flex gap-2">
          <button onClick={() => onReorder('up')} disabled={shapeIdx <= 0} className="flex-1 rounded border border-white/10 py-1 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-30">↑ Forward</button>
          <button onClick={() => onReorder('down')} disabled={shapeIdx >= pageShapes.length - 1} className="flex-1 rounded border border-white/10 py-1 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-30">↓ Back</button>
        </div>
      </div>

      {/* Save template */}
      <div className="border-t border-white/10 pt-3">
        {showTplSave ? (
          <div className="flex gap-1.5">
            <input
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              placeholder="Template name"
              className={`${inputCls} flex-1`}
              autoFocus
            />
            <button
              onClick={() => { if (tplName.trim()) { onSaveTemplate(tplName.trim()); setTplName(''); setShowTplSave(false) } }}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-white"
              style={{ background: '#C9A84C' }}
            >Save</button>
            <button onClick={() => setShowTplSave(false)} className="shrink-0 text-slate-500 hover:text-white">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowTplSave(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-1.5 text-xs text-slate-500 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition"
          >
            Save page shapes as template
          </button>
        )}
      </div>
    </div>
  )
}

// ── Cover Page Editor (right panel) ─────────────────────────────────────────

function CoverPageEditor({ coverPage, onUpdate, onDeselect }: {
  coverPage: ReportData['coverPage']
  onUpdate: (field: string, val: unknown) => void
  onDeselect: () => void
}) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#C9A84C]">Cover Page</span>
        <button onClick={onDeselect} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Deselect ✕</button>
      </div>

      <div>{label('Report Title')}<input value={coverPage.reportTitle} onChange={(e) => onUpdate('reportTitle', e.target.value)} className={inputCls} placeholder="Report Title" /></div>
      <div>{label('Subtitle')}<input value={coverPage.subtitle} onChange={(e) => onUpdate('subtitle', e.target.value)} className={inputCls} placeholder="Subtitle" /></div>
      <div>{label('Company Name')}<input value={coverPage.companyName} onChange={(e) => onUpdate('companyName', e.target.value)} className={inputCls} placeholder="Company Name" /></div>
      <div>{label('Date')}<input value={coverPage.date} onChange={(e) => onUpdate('date', e.target.value)} className={inputCls} placeholder="Date" /></div>

      <div className="grid grid-cols-2 gap-2">
        <div>{label('Background')}<input type="color" value={coverPage.primaryColor} onChange={(e) => onUpdate('primaryColor', e.target.value)} className="h-8 w-full cursor-pointer rounded" /></div>
        <div>{label('Text color')}<input type="color" value={coverPage.textColor} onChange={(e) => onUpdate('textColor', e.target.value)} className="h-8 w-full cursor-pointer rounded" /></div>
      </div>

      <div>
        {label('Pattern')}
        <div className="grid grid-cols-2 gap-1">
          {(['none', 'grid', 'dots', 'diagonal'] as const).map((p) => (
            <button key={p} onClick={() => onUpdate('pattern', p)}
              className={`rounded border py-1 text-xs capitalize transition ${coverPage.pattern === p ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>{label('Logo')}<ImageUploadField value={coverPage.logoUrl} onChange={(url) => onUpdate('logoUrl', url)} placeholder="Logo URL or upload" /></div>
      <div>{label('Background Image')}<ImageUploadField value={coverPage.backgroundImageUrl} onChange={(url) => onUpdate('backgroundImageUrl', url)} placeholder="Image URL or upload" /></div>
    </div>
  )
}

// ── Template Picker ─────────────────────────────────────────────────────────

function TemplatePicker({ onSelect, onClose }: { onSelect: (t: ReportTemplate) => void; onClose?: () => void }) {
  const [category, setCategory] = useState('All')

  const filtered = category === 'All' ? REPORT_TEMPLATES : REPORT_TEMPLATES.filter((t) => t.category === category)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#1C0D03] shadow-2xl" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Choose a Template</h2>
            <p className="text-sm text-slate-400">Start with a ready-made structure or build from scratch.</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/10 px-6 py-3">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${category === cat ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/15 text-slate-400 hover:bg-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="group flex flex-col rounded-xl border border-white/10 bg-[#2D1B11] p-4 text-left transition hover:border-[#C9A84C]/50 hover:bg-[#2D1B11]/80 hover:shadow-lg"
            >
              <div className="mb-3 flex h-1.5 w-full overflow-hidden rounded-full gap-0.5">
                {(() => {
                  const pack = DESIGN_PACKS.find((d) => d.id === tpl.designPackId)
                  return pack ? (
                    <>
                      <div className="flex-1 rounded-full" style={{ background: pack.primaryColor }} />
                      <div className="flex-1 rounded-full" style={{ background: pack.accentColor }} />
                    </>
                  ) : <div className="flex-1 rounded-full bg-slate-600" />
                })()}
              </div>
              <span className="mb-1 text-2xl leading-none">{tpl.emoji}</span>
              <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-[#C9A84C] transition leading-tight">{tpl.name}</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{tpl.description}</p>
              <span className="mt-2 text-[9px] font-medium uppercase tracking-wide text-slate-600">{tpl.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
