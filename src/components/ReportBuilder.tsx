'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/lib/AuthContext'
import { signOut } from '@/lib/auth'
import { createReport, deleteReport, getReport, getReportDoc, listReports, saveReport, type ReportDoc } from '@/lib/reports'
import CollabShareModal from './ShareModal'
import VersionHistoryModal from './VersionHistoryModal'
import { REPORT_TEMPLATES, TEMPLATE_CATEGORIES, type ReportTemplate } from '@/lib/report-templates'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
  ResponsiveContainer,
} from 'recharts'
import {
  DEFAULT_REPORT, DESIGN_PACKS, DOCUMENT_TYPES,
  type ReportData, type ReportBlock, type ReportPage, type ReportBlockType,
  type DesignPack, type KpiItem, type TableCell,
  type HeadingBlock, type TextBlock, type TableBlock,
  type ImageBlock, type KpiBlock, type DividerBlock, type SpacerBlock,
  type ChartBlock, type ChartDataset, type TocBlock,
  type CalloutBlock, type QuoteBlock, type StatusBlock, type ProgressBlock,
  type ColumnsBlock,
  type StatusItem, type ProgressItem, type PageStyle,
  type ShapeItem, type ShapeType, type ShapeTemplate,
  type ReportBranding,
  type CellBorder, type TableBorders,
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
        showLabels: true,
        sourceFile: '',
      }
    case 'toc':
      return { id, type: 'toc', title: 'Table of Contents', includePageNumbers: true }
    case 'callout':
      return { id, type: 'callout', content: 'Important note or callout text here.', variant: 'info' as const }
    case 'quote':
      return { id, type: 'quote', content: 'Enter a compelling quote or highlight here.', attribution: '' }
    case 'status':
      return {
        id, type: 'status', title: 'Project Status',
        items: [
          { id: uuidv4(), label: 'Planning', status: 'done' as const },
          { id: uuidv4(), label: 'Development', status: 'in-progress' as const },
          { id: uuidv4(), label: 'Testing', status: 'pending' as const },
        ],
      }
    case 'progress':
      return {
        id, type: 'progress', title: 'Progress Overview',
        items: [
          { id: uuidv4(), label: 'Revenue Target', value: 78, color: dp.accentColor || '#2D7DD2' },
          { id: uuidv4(), label: 'Cost Reduction', value: 45, color: dp.primaryColor || '#1E3A5F' },
          { id: uuidv4(), label: 'Customer NPS', value: 91, color: '#059669' },
        ],
      }
    case 'columns':
      return { id, type: 'columns', split: '50-50', leftBlocks: [], rightBlocks: [], gap: 16 }
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

export default function ReportBuilder({ initialDocId }: { initialDocId?: string } = {}) {
  const { user } = useAuth()
  const router = useRouter()
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
  const [showCollabShare, setShowCollabShare] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [selectedShapePageId, setSelectedShapePageId] = useState<string | null>(null)
  const [isCoverSelected, setIsCoverSelected] = useState(false)
  const [focusedCoverField, setFocusedCoverField] = useState<keyof NonNullable<ReportData['coverPage']['fieldStyles']> | null>(null)
  const [tableFormatAPI, setTableFormatAPI] = useState<TableFormatAPI | null>(null)
  useEffect(() => { if (!isCoverSelected) setFocusedCoverField(null) }, [isCoverSelected])
  const printRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleTableFormatAPIChange = useCallback((api: TableFormatAPI | null) => setTableFormatAPI(api), [])

  const dp = { ...getDesignPack(report.designPackId), ...(report.colorOverrides ?? {}) } as DesignPack

  useEffect(() => {
    if (!initialDocId) return
    getReport(initialDocId)
      .then((reportData) => {
        setReport(reportData)
        setDocId(initialDocId)
        setDocName('Report')
        setSelectedBlockId(null)
        setSelectedPageId(reportData.pages[0]?.id ?? null)
        setSaveState('saved')
        setIsDirty(false)
        setPickerState('hide')
        window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
      })
      .catch(() => { setPickerState('hide'); setShowTemplatePicker(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDocId])

  useEffect(() => {
    if (initialDocId) return // handled above
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
          router.replace(`/report/${newId}`)
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

  async function handleDelete(targetDocId: string) {
    await deleteReport(targetDocId)
    const refreshed = await listReports().catch(() => [] as ReportDoc[])
    setPickerDocs(refreshed)
    if (targetDocId === docId) {
      setDocId(null)
      setDocName('Untitled Report')
      setReport(DEFAULT_REPORT)
      setSelectedPageId(DEFAULT_REPORT.pages[0]?.id ?? null)
      setIsDirty(false)
      setSaveState('idle')
      if (refreshed.length === 0) setPickerState('show')
    }
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

  async function handleOpenDoc(d: ReportDoc) {
    setShowDocs(false)
    setPickerState('loading')
    try {
      const reportData = await getReport(d.id)
      setReport(reportData)
      setDocId(d.id)
      setDocName(d.name || 'Untitled Report')
      setSelectedBlockId(null)
      setSelectedPageId(reportData.pages[0]?.id ?? null)
      setSaveState('saved')
      setIsDirty(false)
      setPickerState('hide')
      router.replace(`/report/${d.id}`)
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
    } catch (err) {
      setSaveError(`Failed to open report: ${(err as Error).message}`)
      setPickerState('show')
    }
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
    if (pageId === '__cover__') { updateCoverBlock(blockId, updates); return }
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
    if (pageId === '__cover__') { deleteCoverBlock(blockId); return }
    updateReport((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
      ),
    }))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  // Cover page block management
  function addCoverBlock(type: ReportBlockType) {
    const block = createBlock(type, dp)
    updateReport((prev) => ({
      ...prev,
      coverPage: { ...prev.coverPage, coverBlocks: [...(prev.coverPage.coverBlocks ?? []), block] },
    }))
    setSelectedBlockId(block.id)
  }
  function updateCoverBlock(blockId: string, updates: Record<string, unknown>) {
    updateReport((prev) => ({
      ...prev,
      coverPage: {
        ...prev.coverPage,
        coverBlocks: (prev.coverPage.coverBlocks ?? []).map((b) => b.id !== blockId ? b : { ...b, ...updates }),
      },
    }))
  }
  function deleteCoverBlock(blockId: string) {
    updateReport((prev) => ({
      ...prev,
      coverPage: {
        ...prev.coverPage,
        coverBlocks: (prev.coverPage.coverBlocks ?? []).filter((b) => b.id !== blockId),
      },
    }))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }
  function moveCoverBlock(blockId: string, dir: 'up' | 'down') {
    updateReport((prev) => {
      const blocks = [...(prev.coverPage.coverBlocks ?? [])]
      const idx = blocks.findIndex((b) => b.id === blockId)
      if (idx < 0) return prev
      const newIdx = dir === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= blocks.length) return prev
      ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
      return { ...prev, coverPage: { ...prev.coverPage, coverBlocks: blocks } }
    })
  }

  function moveBlock(pageId: string, blockId: string, dir: 'up' | 'down') {
    if (pageId === '__cover__') { moveCoverBlock(blockId, dir); return }
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

  async function handleAndroidPdf() {
    if (!printRef.current) return
    setIsPdfLoading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const el = printRef.current

      const prev = { left: el.style.left, top: el.style.top, opacity: el.style.opacity }
      el.style.left = '0'
      el.style.top = '0'
      el.style.opacity = '0'

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
            format: report.pageSize === 'Letter' ? 'letter' : 'a4',
            orientation: 'portrait',
          },
        })
        .toPdf()
        .get('pdf')

      el.style.left = prev.left
      el.style.top = prev.top
      el.style.opacity = prev.opacity

      const base64 = pdfDoc.output('datauristring').split('base64,')[1]
      ;(window as any).AndroidBridge.savePdf(base64)
    } catch (e) {
      console.error('Android PDF export failed:', e)
      if (printRef.current) {
        printRef.current.style.left = '-99999px'
        printRef.current.style.top = '0'
        printRef.current.style.opacity = ''
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

  // Find selected block + its page (also checks cover blocks via virtual '__cover__' page id)
  let selectedBlock: ReportBlock | null = null
  let selectedBlockPageId: string | null = null
  const coverBlockMatch = (report.coverPage.coverBlocks ?? []).find((b) => b.id === selectedBlockId)
  if (coverBlockMatch) {
    selectedBlock = coverBlockMatch
    selectedBlockPageId = '__cover__'
  } else {
    for (const p of report.pages) {
      const b = p.blocks.find((b) => b.id === selectedBlockId)
      if (b) { selectedBlock = b; selectedBlockPageId = p.id; break }
    }
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
        onDelete={handleDelete}
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

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-[calc(100%-180px)] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {/* Workspace switcher */}
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Back to Workspace"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Workspace</span>
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
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            title="Import Excel / CSV file"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="hidden sm:inline">My Reports</span>
          </button>

          {/* Collaborate button — full permission-based sharing */}
          {docId && (
            <button
              onClick={() => setShowCollabShare(true)}
              className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              title="Share with collaborators"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Public link share — read-only snapshot */}
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            title="Create public read-only link"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m4.242-4.242a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.1 1.1" />
            </svg>
            <span className="hidden sm:inline">Public Link</span>
          </button>

          {/* Version History */}
          {docId && (
            <button
              onClick={() => setShowVersionHistory(true)}
              className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              title="Version History"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">History</span>
            </button>
          )}

          {/* PDF export */}
          <button
            onClick={handleDownload}
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

      {/* ── Format Toolbar (permanent, context-sensitive) ── */}
      <FormatToolbar
        selectedBlock={selectedBlock}
        tableFormatAPI={tableFormatAPI}
        dp={dp}
        onQuickUpdate={selectedBlock && selectedBlockPageId
          ? (updates) => updateBlock(selectedBlockPageId, selectedBlock.id, updates)
          : undefined}
        onMoveUp={selectedBlock && selectedBlockPageId
          ? () => moveBlock(selectedBlockPageId, selectedBlock.id, 'up')
          : undefined}
        onMoveDown={selectedBlock && selectedBlockPageId
          ? () => moveBlock(selectedBlockPageId, selectedBlock.id, 'down')
          : undefined}
        onDelete={selectedBlock && selectedBlockPageId
          ? () => deleteBlock(selectedBlockPageId, selectedBlock.id)
          : undefined}
        coverField={focusedCoverField ? {
          fieldName: focusedCoverField,
          style: report.coverPage.fieldStyles?.[focusedCoverField] ?? {},
          onUpdate: (s) => updateReport((prev) => ({
            ...prev,
            coverPage: { ...prev.coverPage, fieldStyles: { ...prev.coverPage.fieldStyles, [focusedCoverField]: s } },
          })),
        } : null}
      />

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className={`no-print flex flex-col border-r border-white/10 bg-[#1C1008] transition-all duration-200 ${leftOpen ? 'w-[220px]' : 'w-0 overflow-hidden'}`}>
          {leftOpen && (
            <LeftPanel
              report={report}
              selectedPageId={selectedPageId}
              isCoverSelected={isCoverSelected}
              leftTab={leftTab}
              setLeftTab={setLeftTab}
              onSelectCover={() => {
                setIsCoverSelected(true)
                setSelectedPageId(null)
                setSelectedBlockId(null)
                setSelectedShapeId(null)
                setTimeout(() => document.getElementById('page-cover')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
              }}
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
          setTableFormatAPI(null)
        }}>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
            <div className="anim-orb absolute rounded-full" style={{ width: 400, height: 400, top: -100, right: -100, background: 'radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="anim-orb-slow absolute rounded-full" style={{ width: 300, height: 300, bottom: -80, left: -80, background: 'radial-gradient(circle, rgba(13,144,128,.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          </div>
          <div className="relative z-10 flex flex-col items-center py-8 px-4 gap-0">
            {report.coverPage.enabled && (
              <>
                <CoverPageView
                  coverPage={report.coverPage}
                  dp={dp}
                  watermark={report.watermark}
                  isSelected={isCoverSelected}
                  selectedBlockId={selectedBlockId}
                  onSelect={() => { setIsCoverSelected(true); setSelectedBlockId(null); setSelectedShapeId(null) }}
                  onSelectBlock={(id) => { setSelectedBlockId(id); setIsCoverSelected(true); setSelectedShapeId(null); setSelectedPageId(null) }}
                  onAddCoverBlock={addCoverBlock}
                  onUpdateCoverBlock={updateCoverBlock}
                  onDeleteCoverBlock={deleteCoverBlock}
                  onMoveCoverBlock={moveCoverBlock}
                  onUpdateCoverPage={(upd) => updateReport((p) => ({ ...p, coverPage: { ...p.coverPage, ...upd } }))}
                  onFormatAPIChange={handleTableFormatAPIChange}
                  onCoverFieldFocus={(f) => { setFocusedCoverField(f); if (f) setSelectedBlockId(null) }}
                />
                {/* Page break after cover */}
                <div className="no-print flex w-full max-w-[900px] items-center gap-3 py-3">
                  <div className="flex-1 border-t border-dashed border-white/20" />
                  <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#120B07] px-3 py-1 text-[10px] font-medium tracking-wide text-slate-500">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2v4m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v12M18 2v4m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v12" /></svg>
                    Page 1
                  </span>
                  <div className="flex-1 border-t border-dashed border-white/20" />
                </div>
              </>
            )}
            {report.pages.map((page, pageIdx) => (
              <React.Fragment key={page.id}>
                <ReportPageView
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
                  onUpdateBlock={(blockId, updates) => updateBlock(page.id, blockId, updates)}
                  onUpdateShape={(shapeId, upd) => updateShape(page.id, shapeId, upd)}
                  onDeleteShape={(shapeId) => deleteShape(page.id, shapeId)}
                  onReorderShape={(shapeId, dir) => reorderShape(page.id, shapeId, dir)}
                  onFormatAPIChange={handleTableFormatAPIChange}
                  onUpdateHF={(field, val) => updateReport((prev) => ({ ...prev, headerFooter: { ...prev.headerFooter, [field]: val } }))}
                />
                {/* Page break between pages */}
                {pageIdx < report.pages.length - 1 && (
                  <div className="no-print flex w-full max-w-[900px] items-center gap-3 py-3">
                    <div className="flex-1 border-t border-dashed border-white/20" />
                    <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#120B07] px-3 py-1 text-[10px] font-medium tracking-wide text-slate-500">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 2v4m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v12M18 2v4m0 0a2 2 0 100 4 2 2 0 000-4zm0 4v12" /></svg>
                      Page {pageIdx + 2}
                    </span>
                    <div className="flex-1 border-t border-dashed border-white/20" />
                  </div>
                )}
              </React.Fragment>
            ))}
            <button
              onClick={addPage}
              className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-white/20 px-6 py-3 text-sm font-medium text-slate-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
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
              selectedPageId={selectedPageId}
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
          onDelete={handleDelete}
          onClose={() => setShowDocs(false)}
          onRefresh={() => listReports().then(setPickerDocs).catch(() => {})}
          onOpenShared={(sharedDocId) => {
            setShowDocs(false)
            getReportDoc(sharedDocId).then((doc) => {
              setReport(doc.report)
              setDocId(sharedDocId)
              setDocName(doc.name || 'Untitled Report')
              setSelectedPageId(doc.report.pages[0]?.id ?? null)
              setSaveState('saved')
              setIsDirty(false)
              router.replace(`/report/${sharedDocId}`)
              setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
            }).catch((err) => console.error('Failed to open shared report:', err))
          }}
        />
      )}

      {/* Public link share modal */}
      {showShare && (
        <ShareModal
          report={report}
          docName={docName}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Collaboration share modal */}
      {showCollabShare && docId && (
        <CollabShareModal
          docId={docId}
          docName={docName}
          onClose={() => setShowCollabShare(false)}
        />
      )}

      {/* Version History modal */}
      {showVersionHistory && docId && (
        <VersionHistoryModal
          docId={docId}
          docName={docName}
          canEdit={true}
          onClose={() => setShowVersionHistory(false)}
          onRestored={() => {
            getReport(docId).then((r) => {
              setReport(r)
              setIsDirty(false)
              setSaveState('saved')
              setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
            }).catch(() => {})
          }}
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
  report, selectedPageId, isCoverSelected, leftTab, setLeftTab,
  onSelectPage, onSelectCover, onAddPage, onDeletePage, onDuplicatePage, onMovePage, onUpdatePageTitle, onAddBlock, onAddShape, onInsertToc,
}: {
  report: ReportData
  selectedPageId: string | null
  isCoverSelected: boolean
  leftTab: 'pages' | 'insert'
  setLeftTab: (t: 'pages' | 'insert') => void
  onSelectPage: (id: string) => void
  onSelectCover: () => void
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

  const BLOCK_TYPES: { type: ReportBlockType; icon: string; label: string; group?: string }[] = [
    { type: 'heading',  icon: 'H',  label: 'Heading' },
    { type: 'text',     icon: 'T',  label: 'Text' },
    { type: 'columns',  icon: '⊟',  label: '2 Columns' },
    { type: 'table',    icon: '⊞',  label: 'Table' },
    { type: 'chart',    icon: '📈', label: 'Chart' },
    { type: 'kpi',      icon: '📊', label: 'KPI Cards' },
    { type: 'image',    icon: '🖼',  label: 'Image' },
    { type: 'divider',  icon: '─',  label: 'Divider' },
    { type: 'spacer',   icon: '↕',  label: 'Spacer' },
    { type: 'toc',      icon: '📋', label: 'Contents' },
    { type: 'callout',  icon: '💬', label: 'Callout' },
    { type: 'quote',    icon: '"',   label: 'Quote' },
    { type: 'status',   icon: '✅', label: 'Status' },
    { type: 'progress', icon: '▓',  label: 'Progress' },
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
              <div
                className={`mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition ${isCoverSelected ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                onClick={onSelectCover}
              >
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

// ── Inline Editable ──────────────────────────────────────────────────────────

function InlineEditable({ value, onChange, placeholder, style }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])
  useEffect(() => { if (!editing) setLocal(value) }, [value, editing])

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { onChange(local); setEditing(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onChange(local); setEditing(false) }
          if (e.key === 'Escape') { setLocal(value); setEditing(false) }
          e.stopPropagation()
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'transparent', border: 'none', outline: '1px solid rgba(201,168,76,0.6)', borderRadius: 2, padding: '0 2px', minWidth: 40, font: 'inherit', color: 'inherit', ...style }}
      />
    )
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      title="Click to edit"
      style={{ cursor: 'text', borderBottom: '1px dotted rgba(201,168,76,0.5)', ...style }}
    >
      {value || <span style={{ opacity: 0.4 }}>{placeholder ?? 'Click to edit'}</span>}
    </span>
  )
}

// ── Header / Footer Renderers ────────────────────────────────────────────────

type HFSettings = ReportData['headerFooter']

function renderHeaderBand(hf: HFSettings, dp: DesignPack, isPrint: boolean): React.ReactNode {
  const style = hf.headerStyle || 'line'
  const bg = hf.headerBg || dp.primaryColor
  // Print uses mm padding to match 20mm page margins; canvas uses Tailwind px-8 (2rem)
  const px = isPrint ? '20mm' : '2rem'
  const pyN = isPrint ? '4pt' : '0.5rem'
  const fs = isPrint ? '8pt' : undefined

  const row = (children: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: px, paddingRight: px, paddingTop: pyN, paddingBottom: pyN, fontSize: fs, ...extraStyle }}>
      {children}
    </div>
  )

  if (style === 'band' || style === 'accent-band') {
    return row(<><span style={{ fontWeight: 600 }}>{hf.headerLeft}</span><span style={{ opacity: 0.8 }}>{hf.headerRight}</span></>, { background: bg, color: '#fff' })
  }
  if (style === 'double') {
    return (
      <div style={{ borderTop: `3px solid ${bg}`, borderBottom: `1px solid ${bg}`, color: bg, fontSize: fs }}>
        {row(<><span style={{ fontWeight: 600 }}>{hf.headerLeft}</span><span>{hf.headerRight}</span></>)}
      </div>
    )
  }
  if (style === 'gradient') {
    return row(<><span style={{ fontWeight: 600 }}>{hf.headerLeft}</span><span style={{ opacity: 0.8 }}>{hf.headerRight}</span></>, { background: `linear-gradient(90deg, ${bg} 0%, ${bg}44 100%)`, color: '#fff' })
  }
  if (style === 'minimal') {
    return row(<><span>{hf.headerLeft}</span><span>{hf.headerRight}</span></>, { color: dp.textColor, opacity: 0.6 })
  }
  // default: 'line'
  return row(<><span style={{ fontWeight: 600 }}>{hf.headerLeft}</span><span>{hf.headerRight}</span></>, { borderBottom: `2px solid ${bg}`, color: bg })
}

function renderFooterBand(hf: HFSettings, dp: DesignPack, pageNum: number, isPrint = false): React.ReactNode {
  const style = hf.footerStyle || 'line'
  const bg = hf.footerBg || dp.primaryColor
  const px = isPrint ? '20mm' : '2rem'
  const pyN = isPrint ? '4pt' : '0.5rem'
  const fs = isPrint ? '8pt' : undefined
  const pageEl = hf.showPageNumbers ? <span style={{ fontWeight: 600 }}>{pageNum}</span> : null
  const right = <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span>{hf.footerRight}</span>{pageEl}</div>

  const row = (children: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: px, paddingRight: px, paddingTop: pyN, paddingBottom: pyN, fontSize: fs, ...extraStyle }}>
      {children}
    </div>
  )

  if (style === 'band' || style === 'accent-band') {
    return row(<><span>{hf.footerLeft}</span>{right}</>, { background: bg, color: '#fff' })
  }
  if (style === 'double') {
    return (
      <div style={{ borderTop: `1px solid ${bg}`, borderBottom: `3px solid ${bg}`, color: bg, fontSize: fs }}>
        {row(<><span>{hf.footerLeft}</span>{right}</>)}
      </div>
    )
  }
  if (style === 'gradient') {
    return row(<><span>{hf.footerLeft}</span>{right}</>, { background: `linear-gradient(90deg, ${bg}44 0%, ${bg} 100%)`, color: '#fff' })
  }
  if (style === 'minimal') {
    return row(<><span>{hf.footerLeft}</span>{right}</>, { color: dp.textColor, opacity: 0.5 })
  }
  // default: 'line'
  return row(
    <><span>{hf.footerLeft}</span><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span>{hf.footerRight}</span>{pageEl && <span style={{ color: bg }}>{pageEl}</span>}</div></>,
    { borderTop: `1px solid ${bg}30`, color: dp.textColor }
  )
}

// ── Interactive (canvas-mode) header/footer bands ────────────────────────────

type OnUpdateHF = (field: 'headerLeft' | 'headerRight' | 'footerLeft' | 'footerRight', value: string) => void

function CanvasHeaderBand({ hf, dp, onUpdate }: { hf: HFSettings; dp: DesignPack; onUpdate: OnUpdateHF }) {
  const style = hf.headerStyle || 'line'
  const bg = hf.headerBg || dp.primaryColor
  const px = '2rem'
  const py = '0.5rem'

  const left = <InlineEditable value={hf.headerLeft} onChange={(v) => onUpdate('headerLeft', v)} placeholder="Header left" style={{ fontWeight: 600 }} />
  const right = <InlineEditable value={hf.headerRight} onChange={(v) => onUpdate('headerRight', v)} placeholder="Header right" />

  const row = (children: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py, ...extraStyle }}>
      {children}
    </div>
  )

  if (style === 'band' || style === 'accent-band') {
    return row(<>{left}{right}</>, { background: bg, color: '#fff' })
  }
  if (style === 'double') {
    return (
      <div style={{ borderTop: `3px solid ${bg}`, borderBottom: `1px solid ${bg}`, color: bg }}>
        {row(<>{left}{right}</>)}
      </div>
    )
  }
  if (style === 'gradient') {
    return row(<>{left}{right}</>, { background: `linear-gradient(90deg, ${bg} 0%, ${bg}44 100%)`, color: '#fff' })
  }
  if (style === 'minimal') {
    return row(<>{left}{right}</>, { color: dp.textColor, opacity: 0.6 })
  }
  return row(<>{left}{right}</>, { borderBottom: `2px solid ${bg}`, color: bg })
}

function CanvasFooterBand({ hf, dp, pageNum, onUpdate }: { hf: HFSettings; dp: DesignPack; pageNum: number; onUpdate: OnUpdateHF }) {
  const style = hf.footerStyle || 'line'
  const bg = hf.footerBg || dp.primaryColor
  const px = '2rem'
  const py = '0.5rem'
  const pageEl = hf.showPageNumbers ? <span style={{ fontWeight: 600 }}>{pageNum}</span> : null

  const leftEl = <InlineEditable value={hf.footerLeft} onChange={(v) => onUpdate('footerLeft', v)} placeholder="Footer left" />
  const rightEl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <InlineEditable value={hf.footerRight} onChange={(v) => onUpdate('footerRight', v)} placeholder="Footer right" />
      {pageEl}
    </div>
  )

  const row = (children: React.ReactNode, extraStyle: React.CSSProperties = {}) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py, ...extraStyle }}>
      {children}
    </div>
  )

  if (style === 'band' || style === 'accent-band') {
    return row(<>{leftEl}{rightEl}</>, { background: bg, color: '#fff' })
  }
  if (style === 'double') {
    return (
      <div style={{ borderTop: `1px solid ${bg}`, borderBottom: `3px solid ${bg}`, color: bg }}>
        {row(<>{leftEl}{rightEl}</>)}
      </div>
    )
  }
  if (style === 'gradient') {
    return row(<>{leftEl}{rightEl}</>, { background: `linear-gradient(90deg, ${bg}44 0%, ${bg} 100%)`, color: '#fff' })
  }
  if (style === 'minimal') {
    return row(<>{leftEl}{rightEl}</>, { color: dp.textColor, opacity: 0.5 })
  }
  return row(<>{leftEl}{rightEl}</>, { borderTop: `1px solid ${bg}30`, color: dp.textColor })
}

// ── Cover Page View ─────────────────────────────────────────────────────────

function logoPositionStyle(pos: string | undefined): React.CSSProperties {
  switch (pos) {
    case 'tc': return { top: '2rem', left: '50%', transform: 'translateX(-50%)' }
    case 'tr': return { top: '2rem', right: '2.5rem' }
    case 'bl': return { bottom: '2rem', left: '2.5rem' }
    case 'bc': return { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' }
    case 'br': return { bottom: '2rem', right: '2.5rem' }
    default:   return { top: '2rem', left: '2.5rem' }
  }
}

function CoverPageView({
  coverPage, dp, watermark, isSelected, selectedBlockId,
  onSelect, onSelectBlock, onAddCoverBlock, onUpdateCoverBlock, onDeleteCoverBlock, onMoveCoverBlock,
  onUpdateCoverPage, onFormatAPIChange, onCoverFieldFocus,
}: {
  coverPage: ReportData['coverPage']
  dp: DesignPack
  watermark: ReportData['watermark']
  isSelected: boolean
  selectedBlockId: string | null
  onSelect: () => void
  onSelectBlock: (id: string) => void
  onAddCoverBlock: (type: ReportBlockType) => void
  onUpdateCoverBlock: (blockId: string, updates: Record<string, unknown>) => void
  onDeleteCoverBlock: (blockId: string) => void
  onMoveCoverBlock: (blockId: string, dir: 'up' | 'down') => void
  onUpdateCoverPage: (upd: Partial<ReportData['coverPage']>) => void
  onFormatAPIChange?: (api: TableFormatAPI | null) => void
  onCoverFieldFocus?: (field: keyof NonNullable<ReportData['coverPage']['fieldStyles']> | null) => void
}) {
  const [showInsert, setShowInsert] = useState(false)
  const bg = coverPage.primaryColor || dp.primaryColor
  const isLightBg = (() => {
    const hex = bg.replace('#', '')
    if (hex.length < 6) return false
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 140
  })()
  const fg = coverPage.textColor || (isLightBg ? '#1E293B' : '#FFFFFF')
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

  const BLOCK_TYPES: { type: ReportBlockType; label: string }[] = [
    { type: 'heading', label: 'Heading' }, { type: 'text', label: 'Text' },
    { type: 'divider', label: 'Divider' }, { type: 'spacer', label: 'Spacer' },
    { type: 'image', label: 'Image' }, { type: 'callout', label: 'Callout' },
    { type: 'quote', label: 'Quote' },
  ]

  const coverBlocks = coverPage.coverBlocks ?? []

  return (
    <div
      className={`relative w-full max-w-[760px] overflow-hidden rounded-lg shadow-2xl transition-all ${isSelected ? 'ring-2 ring-[#C9A84C]/60' : 'hover:ring-2 hover:ring-white/20'}`}
      style={{ background: bg, minHeight: '520px' }}
      id="page-cover"
      onClick={(e) => { if ((e.target as HTMLElement).closest('[data-block]')) return; onSelect() }}
    >
      {/* Background image */}
      {coverPage.backgroundImageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${coverPage.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      {/* Pattern overlay */}
      {coverPage.pattern !== 'none' && <div style={{ position: 'absolute', inset: 0, ...patternStyle }} />}
      {/* Color overlay when bg image is set */}
      {coverPage.backgroundImageUrl && <div style={{ position: 'absolute', inset: 0, background: `${bg}CC` }} />}

      {/* Accent bar */}
      <div className="absolute right-0 top-0 h-full w-2 opacity-40" style={{ background: dp.accentColor }} />

      {/* Logo (repositionable) */}
      {coverPage.logoUrl && (
        <div style={{ position: 'absolute', ...logoPositionStyle(coverPage.logoPosition), zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverPage.logoUrl} alt="Logo" style={{ maxHeight: '52px', maxWidth: '160px', objectFit: 'contain' }} />
        </div>
      )}

      {/* Cover content — fully block-driven */}
      <div className="relative flex flex-col justify-end p-12 pt-24" style={{ minHeight: '520px', color: fg, zIndex: 1 }}>
        {coverBlocks.map((block, idx) => (
          <BlockWrapper
            key={block.id}
            block={block}
            dp={{ ...dp, textColor: fg, headingColor: fg }}
            isSelected={selectedBlockId === block.id}
            isFirst={idx === 0}
            isLast={idx === coverBlocks.length - 1}
            controlsInside
            onSelect={() => onSelectBlock(block.id)}
            onDelete={() => onDeleteCoverBlock(block.id)}
            onMoveUp={() => onMoveCoverBlock(block.id, 'up')}
            onMoveDown={() => onMoveCoverBlock(block.id, 'down')}
            onQuickUpdate={(updates) => onUpdateCoverBlock(block.id, updates)}
            onFormatAPIChange={onFormatAPIChange}
          />
        ))}

        {/* Add block to cover */}
        {isSelected && (
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            {showInsert ? (
              <div className="flex flex-wrap gap-1.5 rounded-lg p-2 backdrop-blur-sm" style={{ border: `1px solid ${fg}30`, background: isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.35)' }}>
                {BLOCK_TYPES.map(({ type, label }) => (
                  <button key={type} onClick={() => { onAddCoverBlock(type); setShowInsert(false) }}
                    className="rounded-md px-2 py-1 text-xs transition"
                    style={{ border: `1px solid ${fg}30`, background: `${fg}18`, color: fg }}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setShowInsert(false)} className="ml-auto px-2 py-1 text-xs transition" style={{ color: `${fg}80` }}>✕</button>
              </div>
            ) : (
              <button onClick={() => setShowInsert(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs transition"
                style={{ borderColor: `${fg}40`, color: `${fg}80` }}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add block to cover
              </button>
            )}
          </div>
        )}
      </div>

      {/* Watermark on cover */}
      {watermark.enabled && !watermark.excludeCover && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          style={{ opacity: watermark.opacity, transform: `rotate(${watermark.rotation}deg)` }}>
          {watermark.imageUrl
            ? <img src={watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
            : <span className="text-5xl font-black tracking-widest" style={{ color: watermark.color || '#ffffff' }}>{watermark.text}</span>
          }
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[#C9A84C] px-2 py-0.5 text-[10px] font-semibold text-[#1C0D03]">
          Cover Page
        </div>
      )}
    </div>
  )
}

// ── Report Page View ────────────────────────────────────────────────────────

function ReportPageView({
  page, pageNum, dp, report, isSelectedPage, selectedBlockId, selectedShapeId,
  onSelectPage, onSelectBlock, onSelectShape, onDeleteBlock, onMoveBlock, onAddBlock, onUpdateBlock,
  onUpdateShape, onDeleteShape, onReorderShape, onFormatAPIChange, onUpdateHF,
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
  onUpdateBlock: (blockId: string, updates: Record<string, unknown>) => void
  onUpdateShape: (id: string, upd: Partial<ShapeItem>) => void
  onDeleteShape: (id: string) => void
  onReorderShape: (id: string, dir: 'up' | 'down') => void
  onFormatAPIChange?: (api: TableFormatAPI | null) => void
  onUpdateHF: OnUpdateHF
}) {
  const [showInsert, setShowInsert] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Canvas dimensions proportional to the selected page size so the preview
  // matches the exported PDF layout exactly.
  const PAGE_MM = report.pageSize === 'A4'
    ? { w: 210, h: 297 }
    : { w: 215.9, h: 279.4 }
  const CANVAS_W_PX = 760
  const scale = CANVAS_W_PX / PAGE_MM.w        // px per mm at this canvas width
  const canvasHeightPx = Math.round(PAGE_MM.h * scale)   // full page height in px
  const contentPadPx   = Math.round(20 * scale)          // 20 mm margin → px
  // Gap between header band and content on first page matches the print 8 mm
  const headerGapPx    = Math.round(8 * scale)

  const BLOCK_TYPES: { type: ReportBlockType; label: string }[] = [
    { type: 'heading',  label: 'Heading' },
    { type: 'text',     label: 'Text' },
    { type: 'columns',  label: 'Two Columns' },
    { type: 'table',    label: 'Table' },
    { type: 'chart',    label: 'Chart' },
    { type: 'kpi',      label: 'KPI Cards' },
    { type: 'image',    label: 'Image' },
    { type: 'divider',  label: 'Divider' },
    { type: 'spacer',   label: 'Spacer' },
    { type: 'toc',      label: 'Table of Contents' },
    { type: 'callout',  label: 'Callout Box' },
    { type: 'quote',    label: 'Quote' },
    { type: 'status',   label: 'Status List' },
    { type: 'progress', label: 'Progress Bars' },
  ]

  return (
    <div
      ref={containerRef}
      id={`page-view-${page.id}`}
      className={`relative w-full max-w-[760px] rounded-lg shadow-xl transition-all ${
        isSelectedPage ? 'ring-2 ring-[#C9A84C]/40' : ''
      }`}
      onClick={onSelectPage}
      style={{
        background: page.style?.backgroundImage
          ? `url(${page.style.backgroundImage}) center/cover`
          : page.style?.backgroundColor || '#FFFFFF',
        minHeight: `${canvasHeightPx}px`,
      }}
    >
      {/* Background pattern overlay */}
      {page.style?.backgroundPattern && page.style.backgroundPattern !== 'none' && (() => {
        const p = page.style.backgroundPattern
        const patternStyle: React.CSSProperties = {
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', opacity: 0.15,
          backgroundImage: p === 'grid'
            ? 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)'
            : p === 'dots'
            ? 'radial-gradient(circle,#000 1px,transparent 1px)'
            : 'repeating-linear-gradient(-45deg,#000 0,#000 1px,transparent 0,transparent 50%)',
          backgroundSize: p === 'grid' ? '20px 20px' : p === 'dots' ? '16px 16px' : '8px 8px',
        }
        return <div style={patternStyle} />
      })()}

      {/* Page-height guide — dashed line showing where the first physical page ends */}
      <div
        className="no-print pointer-events-none absolute left-0 right-0 z-20"
        style={{ top: `${canvasHeightPx}px`, borderTop: '2px dashed rgba(201,168,76,0.35)' }}
        title="Page break — content below this line flows to the next exported page"
      />

      {/* Page header band */}
      {report.headerFooter.showHeader && <CanvasHeaderBand hf={report.headerFooter} dp={dp} onUpdate={onUpdateHF} />}

      {/* Page content */}
      <div style={{
        padding: `${contentPadPx}px`,
        paddingTop: report.headerFooter.showHeader ? `${headerGapPx}px` : `${contentPadPx}px`,
        paddingBottom: report.headerFooter.showFooter ? `${headerGapPx}px` : `${contentPadPx}px`,
      }}>
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
            onQuickUpdate={(updates) => onUpdateBlock(block.id, updates)}
            onFormatAPIChange={onFormatAPIChange}
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
      {report.headerFooter.showFooter && <CanvasFooterBand hf={report.headerFooter} dp={dp} pageNum={pageNum} onUpdate={onUpdateHF} />}

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
      {report.watermark.enabled && !page.noWatermark && (report.watermark.text || report.watermark.imageUrl) && (
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

// ── Inline Editing Primitives ───────────────────────────────────────────────

const FIELD_EDITING_STYLE: React.CSSProperties = {
  fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit',
  fontStyle: 'inherit', color: 'inherit', textAlign: 'inherit',
  lineHeight: 'inherit', letterSpacing: 'inherit',
  background: 'transparent', border: 'none', outline: 'none',
  padding: 0, margin: 0, cursor: 'text',
  borderBottom: '1.5px dashed rgba(59,130,246,0.5)',
}

function InlineField({ value, onChange, placeholder, className, style, isSelected, inline = false, onFocus, editBg }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  className?: string; style?: React.CSSProperties; isSelected: boolean; inline?: boolean
  onFocus?: () => void; editBg?: string
}) {
  if (!isSelected) {
    return (
      <span className={className} style={{ ...style, display: inline ? 'inline' : 'block' }}>
        {value || (placeholder ? <span style={{ opacity: 0.28, fontStyle: 'italic', fontWeight: 'normal' }}>{placeholder}</span> : ' ')}
      </span>
    )
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onFocus={onFocus}
      className={className}
      style={{ ...FIELD_EDITING_STYLE, backgroundColor: editBg ?? 'transparent', display: inline ? 'inline' : 'block', width: inline ? 'auto' : '100%', minWidth: inline ? '1ch' : undefined, ...style }}
    />
  )
}

function InlineArea({ value, onChange, placeholder, className, style, isSelected }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  className?: string; style?: React.CSSProperties; isSelected: boolean
}) {
  if (!isSelected) {
    return (
      <div className={`whitespace-pre-wrap ${className || ''}`} style={style}>
        {value || (placeholder ? <span style={{ opacity: 0.28, fontStyle: 'italic' }}>{placeholder}</span> : null)}
      </div>
    )
  }
  const lines = (value || '').split('\n').length
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      rows={Math.max(2, lines + 1)}
      className={className}
      style={{
        fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit',
        fontStyle: 'inherit', color: 'inherit', textAlign: 'inherit', lineHeight: 'inherit',
        display: 'block', width: '100%', background: 'rgba(59,130,246,0.03)',
        border: '1.5px dashed rgba(59,130,246,0.4)', borderRadius: 4,
        outline: 'none', padding: '4px 6px', resize: 'none', cursor: 'text', minHeight: '3em',
        ...style,
      }}
    />
  )
}

// ── Block Wrapper ───────────────────────────────────────────────────────────

function BlockWrapper({
  block, dp, report, isSelected, isFirst, isLast, controlsInside,
  onSelect, onDelete, onMoveUp, onMoveDown, onQuickUpdate, onFormatAPIChange,
}: {
  block: ReportBlock
  dp: DesignPack
  report?: ReportData
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  controlsInside?: boolean
  onSelect: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onQuickUpdate?: (updates: Record<string, unknown>) => void
  onFormatAPIChange?: (api: TableFormatAPI | null) => void
}) {
  const blockBg = (block as { bgColor?: string }).bgColor
  return (
    <div
      data-block
      className={`group relative mb-3 rounded transition-all ${
        isSelected
          ? 'outline outline-2 outline-blue-400 outline-offset-2'
          : 'hover:outline hover:outline-1 hover:outline-gray-200 hover:outline-offset-2'
      }`}
      style={blockBg ? { backgroundColor: blockBg, borderRadius: 6, padding: '2px' } : undefined}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
    >
      {/* Block controls — left-outside for page blocks, top-right inside for cover blocks */}
      {controlsInside ? (
        <div
          className={`absolute right-1 top-1 flex flex-row items-center gap-0.5 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onMoveUp} disabled={isFirst}
            className="flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white/80 hover:bg-black/70 disabled:opacity-20 transition"
            title="Move up">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={isLast}
            className="flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white/80 hover:bg-black/70 disabled:opacity-20 transition"
            title="Move down">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={onDelete}
            className="flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white/80 hover:bg-red-600 transition"
            title="Delete block">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <div
          className={`absolute -left-8 top-1 flex flex-col items-center gap-0.5 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onMoveUp} disabled={isFirst}
            className="flex h-6 w-6 items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition"
            title="Move up">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={onMoveDown} disabled={isLast}
            className="flex h-6 w-6 items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition"
            title="Move down">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded bg-white shadow border border-gray-200 text-gray-400 hover:text-red-500 transition"
            title="Delete block">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Block content — tables use inline interactive view; all others use BlockContent for inline editing */}
      {block.type === 'table' && onQuickUpdate ? (
        <TableBlockView
          block={block as TableBlock}
          dp={dp}
          isSelected={isSelected}
          onUpdate={onQuickUpdate}
          onSelect={onSelect}
          onFormatAPIChange={onFormatAPIChange}
        />
      ) : (
        <BlockContent block={block} dp={dp} report={report} isSelected={isSelected} onUpdate={onQuickUpdate} />
      )}
    </div>
  )
}

// ── Block Content (inline-editable) ────────────────────────────────────────

function BlockContent({ block, dp, report, isSelected, onUpdate }: {
  block: ReportBlock; dp: DesignPack; report?: ReportData
  isSelected: boolean; onUpdate?: (updates: Record<string, unknown>) => void
}) {
  switch (block.type) {
    case 'heading': {
      const sizes: Record<number, string> = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' }
      const defaultWeights: Record<number, number> = { 1: 700, 2: 600, 3: 600 }
      const margins: Record<number, string> = { 1: 'mb-3 mt-2', 2: 'mb-2 mt-1', 3: 'mb-1' }
      return (
        <div className={`${block.fontSize ? '' : sizes[block.level]} ${margins[block.level]} leading-tight`}>
          <InlineField
            value={block.content}
            onChange={(v) => onUpdate?.({ content: v })}
            placeholder={`Heading ${block.level}`}
            isSelected={isSelected}
            style={{
              color: block.color || dp.headingColor,
              textAlign: block.align,
              fontFamily: dp.fontFamily,
              fontWeight: block.bold !== undefined ? (block.bold ? 700 : 400) : defaultWeights[block.level],
              fontStyle: block.italic ? 'italic' : undefined,
              fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
            }}
          />
        </div>
      )
    }

    case 'text':
      return (
        <InlineArea
          value={block.content}
          onChange={(v) => onUpdate?.({ content: v })}
          placeholder="Start typing..."
          isSelected={isSelected}
          style={{
            color: block.color || dp.textColor,
            textAlign: block.align,
            fontFamily: dp.fontFamily,
            fontSize: block.fontSize ? `${block.fontSize}px` : '0.875rem',
            fontWeight: block.bold ? 600 : undefined,
            fontStyle: block.italic ? 'italic' : undefined,
          }}
        />
      )

    case 'table': {
      const headerBg = block.headerBg || dp.tableHeaderBg
      const headerText = block.headerText || dp.tableHeaderText
      const brd = block.borders
      const numCols = block.headers.length
      const totalRows = 1 + block.rows.length  // header row + body rows
      const globalBrd = (absRow: number, ci: number): React.CSSProperties => {
        if (brd) return computeTableCellBorders(brd, absRow === 0, absRow === totalRows - 1, ci === 0, ci === numCols - 1)
        const b = block.bordered ? (absRow === 0 ? `1px solid ${headerBg}30` : '1px solid #E5E7EB') : 'none'
        return { borderTop: b, borderBottom: b, borderLeft: b, borderRight: b }
      }
      const cellBrd = (absRow: number, ci: number, cell?: TableCell): React.CSSProperties => {
        const g = globalBrd(absRow, ci)
        const sb = cell?.sideBorders
        if (!sb) return g
        return {
          borderTop:    sb.top    !== undefined ? sb.top    : g.borderTop,
          borderBottom: sb.bottom !== undefined ? sb.bottom : g.borderBottom,
          borderLeft:   sb.left   !== undefined ? sb.left   : g.borderLeft,
          borderRight:  sb.right  !== undefined ? sb.right  : g.borderRight,
        }
      }
      return (
        <div>
          {block.caption && <p className="mb-1.5 text-xs text-gray-500 italic">{block.caption}</p>}
          <table className="w-full" style={{ fontFamily: dp.fontFamily, borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed', wordBreak: 'break-word' }}>
            <thead>
              <tr>
                {block.headers.map((h, ci) => (
                  <th key={ci} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ background: headerBg, color: headerText, overflowWrap: 'break-word', ...cellBrd(0, ci) }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ background: block.striped && rIdx % 2 === 1 ? '#F8FAFC' : 'white' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{
                      textAlign: cell.align, fontWeight: cell.bold ? 600 : 400,
                      fontStyle: cell.italic ? 'italic' : 'normal', textDecoration: cell.underline ? 'underline' : 'none',
                      color: cell.color || dp.textColor, background: cell.bgColor || 'transparent',
                      paddingTop: '6px', paddingBottom: '6px',
                      paddingLeft: `${((cell.indentLevel || 0) * 16) + 12}px`, paddingRight: '12px', overflowWrap: 'break-word',
                      ...cellBrd(1 + rIdx, cIdx, cell),
                    }}>
                      {formatCellContent(cell)}
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
              <InlineField
                value={block.caption || ''}
                onChange={(v) => onUpdate?.({ caption: v })}
                placeholder="Caption (optional)"
                isSelected={isSelected}
                className="mt-1 text-center text-xs text-gray-500 italic"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              No image URL — add one in the properties panel
            </div>
          )}
        </div>
      )

    case 'kpi': {
      const accent = block.accentColor || dp.kpiAccent
      const gridCols: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }
      const updItem = (id: string, field: string, val: unknown) =>
        onUpdate?.({ items: block.items.map((it) => it.id !== id ? it : { ...it, [field]: val }) })
      return (
        <div>
          <InlineField
            value={block.title || ''}
            onChange={(v) => onUpdate?.({ title: v })}
            placeholder="Section title..."
            isSelected={isSelected}
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: dp.headingColor }}
          />
          <div className={`grid gap-3 ${gridCols[block.columns]}`}>
            {block.items.map((item) => (
              <div key={item.id} className="rounded-lg p-3" style={{ background: `${accent}10`, borderLeft: `3px solid ${accent}` }}>
                <InlineField
                  value={item.label}
                  onChange={(v) => updItem(item.id, 'label', v)}
                  placeholder="Label"
                  isSelected={isSelected}
                  className="mb-1 text-xs text-gray-500"
                />
                <p className="text-xl font-bold leading-none" style={{ color: accent }}>
                  {item.prefix}
                  <InlineField
                    value={item.value}
                    onChange={(v) => updItem(item.id, 'value', v)}
                    placeholder="0"
                    isSelected={isSelected}
                    inline
                    style={{ color: accent, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1 }}
                  />
                  {item.suffix}
                </p>
                {item.trendValue && (
                  <p className={`mt-1 text-xs font-medium ${item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}{' '}
                    <InlineField value={item.trendValue} onChange={(v) => updItem(item.id, 'trendValue', v)}
                      placeholder="trend" isSelected={isSelected} inline />
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'chart':
      return <ChartBlockView block={block} dp={dp} isSelected={isSelected} onUpdate={onUpdate} />

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
          <InlineField
            value={block.title || ''}
            onChange={(v) => onUpdate?.({ title: v })}
            placeholder="Table of Contents"
            isSelected={isSelected}
            className="mb-3 text-lg font-bold"
            style={{ color: dp.headingColor }}
          />
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

    case 'callout': {
      const variantStyles: Record<string, { border: string; bg: string; icon: string; text: string }> = {
        info:    { border: '#3B82F6', bg: '#EFF6FF', icon: 'ℹ️', text: '#1E40AF' },
        warning: { border: '#F59E0B', bg: '#FFFBEB', icon: '⚠️', text: '#92400E' },
        success: { border: '#10B981', bg: '#ECFDF5', icon: '✅', text: '#065F46' },
        danger:  { border: '#EF4444', bg: '#FEF2F2', icon: '🚨', text: '#991B1B' },
      }
      const vs = variantStyles[block.variant] ?? variantStyles.info
      return (
        <div className="flex gap-3 rounded-lg px-4 py-3" style={{
          borderLeft: `4px solid ${vs.border}`, background: block.bgColor || vs.bg, color: vs.text,
          fontFamily: dp.fontFamily, fontSize: block.fontSize ? `${block.fontSize}px` : '0.875rem',
          fontWeight: block.bold ? 700 : undefined, fontStyle: block.italic ? 'italic' : undefined,
        }}>
          <span className="mt-0.5 shrink-0">{vs.icon}</span>
          <InlineArea
            value={block.content}
            onChange={(v) => onUpdate?.({ content: v })}
            placeholder="Callout text..."
            isSelected={isSelected}
            style={{ color: vs.text }}
          />
        </div>
      )
    }

    case 'quote':
      return (
        <div className="py-2" style={{ fontFamily: dp.fontFamily, background: block.bgColor || undefined, borderRadius: block.bgColor ? 6 : undefined, padding: block.bgColor ? '8px 12px' : undefined }}>
          <div className="relative border-l-4 pl-5 py-1" style={{ borderColor: dp.accentColor }}>
            <span className="absolute -left-2 -top-2 text-4xl font-serif leading-none opacity-20" style={{ color: dp.primaryColor }}>"</span>
            <InlineArea
              value={block.content}
              onChange={(v) => onUpdate?.({ content: v })}
              placeholder="Quote text..."
              isSelected={isSelected}
              style={{
                color: block.color || dp.textColor,
                fontSize: block.fontSize ? `${block.fontSize}px` : '1rem',
                fontWeight: block.bold ? 700 : undefined,
                fontStyle: block.italic !== undefined ? (block.italic ? 'italic' : 'normal') : 'italic',
              }}
            />
            <InlineField
              value={block.attribution || ''}
              onChange={(v) => onUpdate?.({ attribution: v })}
              placeholder="— Attribution"
              isSelected={isSelected}
              className="mt-2 text-xs font-semibold not-italic"
              style={{ color: dp.primaryColor }}
            />
          </div>
        </div>
      )

    case 'status': {
      const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
        'done':        { color: '#10B981', icon: '✓', label: 'Done' },
        'in-progress': { color: '#F59E0B', icon: '◐', label: 'In Progress' },
        'pending':     { color: '#94A3B8', icon: '○', label: 'Pending' },
        'blocked':     { color: '#EF4444', icon: '✗', label: 'Blocked' },
      }
      const updItem = (id: string, field: string, val: unknown) =>
        onUpdate?.({ items: block.items.map((it) => it.id !== id ? it : { ...it, [field]: val }) })
      return (
        <div style={{ fontFamily: dp.fontFamily }}>
          <InlineField
            value={block.title || ''}
            onChange={(v) => onUpdate?.({ title: v })}
            placeholder="Section title..."
            isSelected={isSelected}
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: dp.headingColor }}
          />
          <div className="flex flex-col gap-2">
            {block.items.map((item) => {
              const cfg = statusConfig[item.status] ?? statusConfig.pending
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: cfg.color }}>{cfg.icon}</span>
                  <InlineField
                    value={item.label}
                    onChange={(v) => updItem(item.id, 'label', v)}
                    placeholder="Item label"
                    isSelected={isSelected}
                    className="flex-1 text-sm"
                    style={{ color: dp.textColor }}
                  />
                  <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'progress': {
      const updItem = (id: string, field: string, val: unknown) =>
        onUpdate?.({ items: block.items.map((it) => it.id !== id ? it : { ...it, [field]: val }) })
      return (
        <div style={{ fontFamily: dp.fontFamily }}>
          <InlineField
            value={block.title || ''}
            onChange={(v) => onUpdate?.({ title: v })}
            placeholder="Section title..."
            isSelected={isSelected}
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: dp.headingColor }}
          />
          <div className="flex flex-col gap-3">
            {block.items.map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between">
                  <InlineField
                    value={item.label}
                    onChange={(v) => updItem(item.id, 'label', v)}
                    placeholder="Label"
                    isSelected={isSelected}
                    className="text-sm"
                    style={{ color: dp.textColor }}
                  />
                  <span className="flex items-center gap-0.5 text-xs font-semibold tabular-nums" style={{ color: item.color || dp.accentColor }}>
                    {isSelected ? (
                      <input
                        type="number" min={0} max={100} step={1}
                        value={item.value}
                        onChange={(e) => updItem(item.id, 'value', Math.min(100, Math.max(0, Number(e.target.value))))}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        style={{ ...FIELD_EDITING_STYLE, width: '3.5em', textAlign: 'right', color: item.color || dp.accentColor, fontWeight: 600, fontSize: 'inherit' }}
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    ) : (
                      <span>{item.value}</span>
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full rounded-full" style={{ background: (item.color || dp.accentColor) + '20' }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.value))}%`, background: item.color || dp.accentColor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'columns':
      return (
        <ColumnsBlockView block={block as ColumnsBlock} dp={dp} isSelected={isSelected} onUpdate={onUpdate} />
      )

    default:
      return null
  }
}

// ── Two-Column Layout Block ────────────────────────────────────────────────

const INNER_BLOCK_TYPES: { type: ReportBlockType; label: string }[] = [
  { type: 'heading',  label: 'Heading' },
  { type: 'text',     label: 'Text' },
  { type: 'table',    label: 'Table' },
  { type: 'chart',    label: 'Chart' },
  { type: 'kpi',      label: 'KPI Cards' },
  { type: 'image',    label: 'Image' },
  { type: 'divider',  label: 'Divider' },
  { type: 'spacer',   label: 'Spacer' },
  { type: 'callout',  label: 'Callout' },
  { type: 'quote',    label: 'Quote' },
  { type: 'status',   label: 'Status' },
  { type: 'progress', label: 'Progress' },
]

function ColumnsBlockView({ block, dp, isSelected, onUpdate }: {
  block: ColumnsBlock
  dp: DesignPack
  isSelected: boolean
  onUpdate?: (updates: Record<string, unknown>) => void
}) {
  const [innerSelected, setInnerSelected] = useState<{ col: 'left' | 'right'; id: string } | null>(null)
  const [addingTo, setAddingTo] = useState<'left' | 'right' | null>(null)

  const splitWidths: Record<string, [string, string]> = {
    '50-50': ['50%', '50%'],
    '33-67': ['33.333%', '66.667%'],
    '67-33': ['66.667%', '33.333%'],
    '25-75': ['25%', '75%'],
    '75-25': ['75%', '25%'],
  }
  const [leftW, rightW] = splitWidths[block.split] ?? ['50%', '50%']

  function addInnerBlock(col: 'left' | 'right', type: ReportBlockType) {
    const newBlock = createBlock(type, dp)
    const key = col === 'left' ? 'leftBlocks' : 'rightBlocks'
    const current = col === 'left' ? block.leftBlocks : block.rightBlocks
    onUpdate?.({ [key]: [...current, newBlock] })
    setInnerSelected({ col, id: newBlock.id })
    setAddingTo(null)
  }

  function deleteInnerBlock(col: 'left' | 'right', id: string) {
    const key = col === 'left' ? 'leftBlocks' : 'rightBlocks'
    const current = col === 'left' ? block.leftBlocks : block.rightBlocks
    onUpdate?.({ [key]: current.filter((b) => b.id !== id) })
    if (innerSelected?.id === id) setInnerSelected(null)
  }

  function moveInnerBlock(col: 'left' | 'right', id: string, dir: 'up' | 'down') {
    const key = col === 'left' ? 'leftBlocks' : 'rightBlocks'
    const current = [...(col === 'left' ? block.leftBlocks : block.rightBlocks)]
    const idx = current.findIndex((b) => b.id === id)
    if (idx < 0) return
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= current.length) return
    ;[current[idx], current[newIdx]] = [current[newIdx], current[idx]]
    onUpdate?.({ [key]: current })
  }

  function updateInnerBlock(col: 'left' | 'right', id: string, updates: Record<string, unknown>) {
    const key = col === 'left' ? 'leftBlocks' : 'rightBlocks'
    const current = col === 'left' ? block.leftBlocks : block.rightBlocks
    onUpdate?.({ [key]: current.map((b) => b.id !== id ? b : { ...b, ...updates }) })
  }

  function renderColumn(col: 'left' | 'right', blocks: ReportBlock[], width: string) {
    const isAdding = addingTo === col
    return (
      <div
        style={{ width, minWidth: 0, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Column header */}
        <div className="mb-2 flex items-center gap-1.5">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            {col === 'left' ? 'Left Column' : 'Right Column'}
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Blocks */}
        <div className="flex flex-col gap-2 min-h-[60px]">
          {blocks.length === 0 && (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-6 text-xs text-gray-400">
              Empty — add a block below
            </div>
          )}
          {blocks.map((innerBlock, idx) => {
            const isInnerSelected = innerSelected?.col === col && innerSelected.id === innerBlock.id
            return (
              <div
                key={innerBlock.id}
                className={`group/inner relative rounded transition-all ${
                  isInnerSelected
                    ? 'outline outline-2 outline-blue-400 outline-offset-1'
                    : 'hover:outline hover:outline-1 hover:outline-gray-200 hover:outline-offset-1'
                }`}
                onClick={(e) => { e.stopPropagation(); setInnerSelected({ col, id: innerBlock.id }) }}
              >
                {/* Inner block controls */}
                <div
                  className={`absolute -right-1 -top-1 z-10 flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5 shadow-sm ${isInnerSelected ? 'flex' : 'hidden group-hover/inner:flex'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => moveInnerBlock(col, innerBlock.id, 'up')}
                    disabled={idx === 0}
                    className="flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Move up"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button
                    onClick={() => moveInnerBlock(col, innerBlock.id, 'down')}
                    disabled={idx === blocks.length - 1}
                    className="flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Move down"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button
                    onClick={() => deleteInnerBlock(col, innerBlock.id)}
                    className="flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <BlockContent
                  block={innerBlock}
                  dp={dp}
                  isSelected={isInnerSelected}
                  onUpdate={(updates) => updateInnerBlock(col, innerBlock.id, updates)}
                />
              </div>
            )
          })}
        </div>

        {/* Add block to column */}
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          {isAdding ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-1.5">
              <div className="flex flex-wrap gap-1">
                {INNER_BLOCK_TYPES.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => addInnerBlock(col, type)}
                    className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-600 transition hover:border-gray-400 hover:text-gray-900"
                  >
                    {label}
                  </button>
                ))}
                <button onClick={() => setAddingTo(null)} className="ml-auto rounded px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingTo(col)}
              className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-gray-200 py-1.5 text-[10px] text-gray-400 transition hover:border-gray-400 hover:text-gray-600"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add block
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border-2 p-3 transition-all ${
        isSelected ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 bg-gray-50/50'
      }`}
      onClick={(e) => { e.stopPropagation(); setInnerSelected(null) }}
    >
      <div className="flex" style={{ gap: `${block.gap}px`, alignItems: 'flex-start' }}>
        {renderColumn('left', block.leftBlocks, leftW)}
        {/* Column divider */}
        <div className="mt-7 w-px self-stretch bg-gray-200" />
        {renderColumn('right', block.rightBlocks, rightW)}
      </div>
    </div>
  )
}

// ── Inline Table Block View ─────────────────────────────────────────────────

function formatCellContent(cell: TableCell): string {
  const fmt = cell.numberFormat
  if (!fmt || fmt === 'general') return cell.content
  const cleaned = cell.content.replace(/[$,()%\s]/g, '')
  const isNegParen = cell.content.startsWith('(')
  const num = parseFloat(cleaned) * (isNegParen ? -1 : 1)
  if (isNaN(num)) return cell.content
  switch (fmt) {
    case 'number':     return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
    case 'currency':   return num < 0
      ? `($${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
      : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'accounting': return num < 0
      ? `(${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
      : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    case 'percentage': return `${num.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
  }
  return cell.content
}

interface TableFormatAPI {
  selectedCells: Set<string>
  firstCell: TableCell | null
  selectionAllHas: <K extends keyof TableCell>(field: K, value: TableCell[K]) => boolean
  applyToSelected: (updates: Partial<TableCell>) => void
  addRow: (where: 'above' | 'below') => void
  deleteSelectedRows: () => void
  addCol: (where: 'left' | 'right') => void
  deleteSelectedCols: () => void
  applyFinancialFormat: () => void
  rowCount: number
  colCount: number
  // Cell merge API
  canMerge: boolean
  canUnmerge: boolean
  merge: () => void
  unmerge: () => void
  // Cell-level border API
  applyBorderPreset: (presetApply: (b: CellBorder) => TableBorders, b: CellBorder) => void
  applyBorderToggle: (side: keyof TableBorders, b: CellBorder) => void
  activeSides: Record<keyof TableBorders, boolean>
}

// Returns a Set of "row,col" keys that are covered by a spanning cell's colspan/rowspan
function buildSpanMap(rows: TableCell[][]): Set<string> {
  const covered = new Set<string>()
  rows.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (covered.has(`${rIdx},${cIdx}`)) return
      const cs = cell.colspan ?? 1
      const rs = cell.rowspan ?? 1
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) {
          if (dr === 0 && dc === 0) continue
          covered.add(`${rIdx + dr},${cIdx + dc}`)
        }
      }
    })
  })
  return covered
}

function TableBlockView({
  block, dp, isSelected, onUpdate, onSelect, onFormatAPIChange,
}: {
  block: TableBlock
  dp: DesignPack
  isSelected: boolean
  onUpdate?: (updates: Record<string, unknown>) => void
  onSelect?: () => void
  onFormatAPIChange?: (api: TableFormatAPI | null) => void
}) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [anchorCell, setAnchorCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [pendingHeaderFocus, setPendingHeaderFocus] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const headerInputRefs = useRef<(HTMLInputElement | null)[]>([])
  // Column/row resize
  const [resizingCol, setResizingCol] = useState<number | null>(null)
  const [resizingRow, setResizingRow] = useState<number | null>(null)
  const resizingColRef = useRef<{ col: number; startX: number; startWidth: number; allWidths: number[] } | null>(null)
  const resizingRowRef = useRef<{ row: number; startY: number; startHeight: number; allHeights: number[] } | null>(null)

  const cellKey = (r: number, c: number) => `${r},${c}`

  function commitCurrentEdit(r?: number, c?: number, val?: string) {
    if (!onUpdate) return
    const row = r ?? editingCell?.row
    const col = c ?? editingCell?.col
    const value = val ?? editValue
    if (row === undefined || col === undefined) return
    const rows = block.rows.map((rr, ri) =>
      ri !== row ? rr : rr.map((cell, ci) => ci !== col ? cell : { ...cell, content: value })
    )
    onUpdate({ rows })
  }

  function startEditing(r: number, c: number) {
    if (!onUpdate) return
    const cell = block.rows[r]?.[c]
    if (!cell) return
    setEditingCell({ row: r, col: c })
    setEditValue(cell.content)
    setSelectedCells(new Set([cellKey(r, c)]))
    setAnchorCell({ row: r, col: c })
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  // Clear state when deselected
  useEffect(() => {
    if (!isSelected) {
      setEditingCell(null)
      setSelectedCells(new Set())
      setAnchorCell(null)
      setPendingHeaderFocus(null)
      onFormatAPIChange?.(null)
    }
  }, [isSelected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Column resize drag
  useEffect(() => {
    if (resizingCol === null) return
    const onMouseMove = (e: MouseEvent) => {
      const rc = resizingColRef.current
      if (!rc || !onUpdate) return
      const delta = e.clientX - rc.startX
      const newWidth = Math.max(40, rc.startWidth + delta)
      const newWidths = [...rc.allWidths]
      newWidths[rc.col] = Math.round(newWidth)
      onUpdate({ colWidths: newWidths })
    }
    const onMouseUp = () => { resizingColRef.current = null; setResizingCol(null) }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [resizingCol]) // eslint-disable-line react-hooks/exhaustive-deps

  // Row resize drag
  useEffect(() => {
    if (resizingRow === null) return
    const onMouseMove = (e: MouseEvent) => {
      const rr = resizingRowRef.current
      if (!rr || !onUpdate) return
      const delta = e.clientY - rr.startY
      const newHeight = Math.max(20, rr.startHeight + delta)
      const newHeights = [...rr.allHeights]
      newHeights[rr.row] = Math.round(newHeight)
      onUpdate({ rowHeights: newHeights })
    }
    const onMouseUp = () => { resizingRowRef.current = null; setResizingRow(null) }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [resizingRow]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus a header input once the block becomes selected
  useEffect(() => {
    if (isSelected && pendingHeaderFocus !== null) {
      const el = headerInputRefs.current[pendingHeaderFocus]
      if (el) { el.focus(); el.select() }
      setPendingHeaderFocus(null)
    }
  }, [isSelected, pendingHeaderFocus])

  // Build and emit format API whenever selection changes
  useEffect(() => {
    if (!isSelected || !onFormatAPIChange) return
    const first = [...selectedCells][0]
    const firstCell: TableCell | null = first
      ? (block.rows[parseInt(first.split(',')[0])]?.[parseInt(first.split(',')[1])] ?? null)
      : null
    const api: TableFormatAPI = {
      selectedCells,
      firstCell,
      rowCount: block.rows.length,
      colCount: block.headers.length,
      selectionAllHas: <K extends keyof TableCell>(field: K, value: TableCell[K]) => {
        if (selectedCells.size === 0) return false
        return [...selectedCells].every((key) => {
          const [r, c] = key.split(',').map(Number)
          return block.rows[r]?.[c]?.[field] === value
        })
      },
      applyToSelected: (updates) => {
        if (!onUpdate || selectedCells.size === 0) return
        const rows = block.rows.map((row, ri) =>
          row.map((cell, ci) => selectedCells.has(cellKey(ri, ci)) ? { ...cell, ...updates } : cell)
        )
        onUpdate({ rows })
      },
      addRow: (where) => {
        if (!onUpdate) return
        const ref = anchorCell?.row ?? block.rows.length - 1
        const newRow: TableCell[] = block.headers.map(() => ({ content: '', bold: false, align: 'left' as const }))
        const rows = [...block.rows]
        rows.splice(where === 'above' ? ref : ref + 1, 0, newRow)
        onUpdate({ rows })
      },
      deleteSelectedRows: () => {
        if (!onUpdate || block.rows.length <= 1) return
        const toDelete = new Set([...selectedCells].map((k) => parseInt(k.split(',')[0])))
        const rows = block.rows.filter((_, i) => !toDelete.has(i))
        if (rows.length === 0) return
        onUpdate({ rows })
        setSelectedCells(new Set()); setEditingCell(null)
      },
      addCol: (where) => {
        if (!onUpdate) return
        const ref = anchorCell?.col ?? block.headers.length - 1
        const idx = where === 'left' ? ref : ref + 1
        const headers = [...block.headers]
        headers.splice(idx, 0, `Col ${headers.length + 1}`)
        const rows = block.rows.map((row) => {
          const r = [...row]; r.splice(idx, 0, { content: '', bold: false, align: 'left' as const }); return r
        })
        onUpdate({ headers, rows })
      },
      deleteSelectedCols: () => {
        if (!onUpdate || block.headers.length <= 1) return
        const toDelete = new Set([...selectedCells].map((k) => parseInt(k.split(',')[1])))
        const headers = block.headers.filter((_, i) => !toDelete.has(i))
        const rows = block.rows.map((row) => row.filter((_, i) => !toDelete.has(i)))
        if (headers.length === 0) return
        onUpdate({ headers, rows })
        setSelectedCells(new Set()); setEditingCell(null)
      },
      applyFinancialFormat: () => {
        if (!onUpdate) return
        const rows = block.rows.map((row) =>
          row.map((cell, cIdx) => {
            const isFirstCol = cIdx === 0
            const looksNumeric = /^[\d$,.()%\s-]+$/.test(cell.content.trim()) && cell.content.trim().length > 0 && !isFirstCol
            const isTotalRow = /total|gross|net|profit|income|loss|balance|subtotal|revenue|expenses?/i.test(cell.content)
            return {
              ...cell,
              align: isFirstCol ? ('left' as const) : (looksNumeric ? ('right' as const) : cell.align),
              bold: isFirstCol && isTotalRow ? true : (looksNumeric && isTotalRow ? true : cell.bold),
              numberFormat: looksNumeric ? ('accounting' as const) : cell.numberFormat,
            }
          })
        )
        onUpdate({ rows, bordered: true })
      },
      // ── Cell merge methods ───────────────────────────────────────────────────
      canMerge: (() => {
        if (selectedCells.size < 2) return false
        const selArr = [...selectedCells].map((k) => k.split(',').map(Number) as [number, number])
        const minR = Math.min(...selArr.map(([r]) => r))
        const maxR = Math.max(...selArr.map(([r]) => r))
        const minC = Math.min(...selArr.map(([, c]) => c))
        const maxC = Math.max(...selArr.map(([, c]) => c))
        return selArr.length === (maxR - minR + 1) * (maxC - minC + 1)
      })(),
      canUnmerge: [...selectedCells].some((k) => {
        const [r, c] = k.split(',').map(Number)
        const cell = block.rows[r]?.[c]
        return !!cell && ((cell.colspan ?? 1) > 1 || (cell.rowspan ?? 1) > 1)
      }),
      merge: () => {
        if (!onUpdate || selectedCells.size < 2) return
        const selArr = [...selectedCells].map((k) => k.split(',').map(Number) as [number, number])
        const minR = Math.min(...selArr.map(([r]) => r))
        const maxR = Math.max(...selArr.map(([r]) => r))
        const minC = Math.min(...selArr.map(([, c]) => c))
        const maxC = Math.max(...selArr.map(([, c]) => c))
        if (selArr.length !== (maxR - minR + 1) * (maxC - minC + 1)) return
        const rows = block.rows.map((row, ri) =>
          row.map((cell, ci) => {
            if (ri === minR && ci === minC) return { ...cell, colspan: maxC - minC + 1, rowspan: maxR - minR + 1 }
            return cell
          })
        )
        onUpdate({ rows })
        setSelectedCells(new Set([cellKey(minR, minC)]))
        setAnchorCell({ row: minR, col: minC })
      },
      unmerge: () => {
        if (!onUpdate) return
        const rows = block.rows.map((row, ri) =>
          row.map((cell, ci) => {
            if (!selectedCells.has(cellKey(ri, ci))) return cell
            if ((cell.colspan ?? 1) > 1 || (cell.rowspan ?? 1) > 1) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { colspan: _cs, rowspan: _rs, ...rest } = cell
              return rest as TableCell
            }
            return cell
          })
        )
        onUpdate({ rows })
      },
      // ── Cell-level border methods ────────────────────────────────────────────
      applyBorderPreset: (presetApply, activeBorder) => {
        if (!onUpdate || selectedCells.size === 0) return
        const selArr = [...selectedCells].map((k) => k.split(',').map(Number) as [number, number])
        const minR = Math.min(...selArr.map(([r]) => r))
        const maxR = Math.max(...selArr.map(([r]) => r))
        const minC = Math.min(...selArr.map(([, c]) => c))
        const maxC = Math.max(...selArr.map(([, c]) => c))
        const applied = presetApply(activeBorder)
        const isNone = Object.values(applied).every((v) => v === null)
        const rows = block.rows.map((row, ri) =>
          row.map((cell, ci) => {
            if (!selectedCells.has(cellKey(ri, ci))) return cell
            if (isNone) return { ...cell, sideBorders: undefined }
            const isTopEdge = ri === minR, isBottomEdge = ri === maxR
            const isLeftEdge = ci === minC, isRightEdge = ci === maxC
            const sides: Record<string, string> = {}
            if (applied.top    && isTopEdge)    sides.top    = fmtBorder(applied.top)
            if (isBottomEdge  && applied.bottom) sides.bottom = fmtBorder(applied.bottom)
            else if (!isBottomEdge && applied.innerH) sides.bottom = fmtBorder(applied.innerH)
            if (applied.left   && isLeftEdge)   sides.left   = fmtBorder(applied.left)
            if (isRightEdge   && applied.right)  sides.right  = fmtBorder(applied.right)
            else if (!isRightEdge && applied.innerV)  sides.right  = fmtBorder(applied.innerV)
            return { ...cell, sideBorders: Object.keys(sides).length ? sides : undefined }
          })
        )
        onUpdate({ rows })
      },
      applyBorderToggle: (side, activeBorder) => {
        if (!onUpdate || selectedCells.size === 0) return
        const selArr = [...selectedCells].map((k) => k.split(',').map(Number) as [number, number])
        const minR = Math.min(...selArr.map(([r]) => r))
        const maxR = Math.max(...selArr.map(([r]) => r))
        const minC = Math.min(...selArr.map(([, c]) => c))
        const maxC = Math.max(...selArr.map(([, c]) => c))
        type CS = 'top' | 'bottom' | 'left' | 'right'
        const sideMap: Record<keyof TableBorders, { filter: (r: number, c: number) => boolean; css: CS }> = {
          top:    { filter: (r) => r === minR,    css: 'top' },
          bottom: { filter: (r) => r === maxR,    css: 'bottom' },
          left:   { filter: (_, c) => c === minC, css: 'left' },
          right:  { filter: (_, c) => c === maxC, css: 'right' },
          innerH: { filter: (r) => r !== maxR,    css: 'bottom' },
          innerV: { filter: (_, c) => c !== maxC, css: 'right' },
        }
        const { filter, css } = sideMap[side]
        const affected = selArr.filter(([r, c]) => filter(r, c))
        const isActive = affected.length > 0 && affected.every(([r, c]) => !!(block.rows[r]?.[c]?.sideBorders as Record<string, string> | undefined)?.[css])
        const rows = block.rows.map((row, ri) =>
          row.map((cell, ci) => {
            if (!selectedCells.has(cellKey(ri, ci)) || !filter(ri, ci)) return cell
            const sb = { ...(cell.sideBorders || {}) }
            if (isActive) delete (sb as Record<string, string>)[css]
            else (sb as Record<string, string>)[css] = fmtBorder(activeBorder)
            return { ...cell, sideBorders: Object.keys(sb).length ? sb : undefined }
          })
        )
        onUpdate({ rows })
      },
      activeSides: (() => {
        const selArr = [...selectedCells].map((k) => k.split(',').map(Number) as [number, number])
        if (!selArr.length) return { top: false, bottom: false, left: false, right: false, innerH: false, innerV: false }
        const minR = Math.min(...selArr.map(([r]) => r))
        const maxR = Math.max(...selArr.map(([r]) => r))
        const minC = Math.min(...selArr.map(([, c]) => c))
        const maxC = Math.max(...selArr.map(([, c]) => c))
        const allHave = (cells: [number, number][], cssSide: string) =>
          cells.length > 0 && cells.every(([r, c]) => !!(block.rows[r]?.[c]?.sideBorders as Record<string, string> | undefined)?.[cssSide])
        return {
          top:    allHave(selArr.filter(([r]) => r === minR),    'top'),
          bottom: allHave(selArr.filter(([r]) => r === maxR),    'bottom'),
          left:   allHave(selArr.filter(([, c]) => c === minC),  'left'),
          right:  allHave(selArr.filter(([, c]) => c === maxC),  'right'),
          innerH: allHave(selArr.filter(([r]) => r !== maxR),    'bottom'),
          innerV: allHave(selArr.filter(([, c]) => c !== maxC),  'right'),
        }
      })(),
    }
    onFormatAPIChange(api)
  }, [isSelected, selectedCells, block.rows, block.headers, block.rows.length, block.headers.length, anchorCell]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRowHeaderClick(r: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSelected) onSelect?.()
    if (editingCell) { commitCurrentEdit(); setEditingCell(null) }
    const numCols = block.headers.length
    if (e.shiftKey && anchorCell) {
      const minR = Math.min(anchorCell.row, r), maxR = Math.max(anchorCell.row, r)
      const cells = new Set<string>()
      for (let ri = minR; ri <= maxR; ri++)
        for (let ci = 0; ci < numCols; ci++)
          cells.add(cellKey(ri, ci))
      setSelectedCells(cells)
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedCells)
      const allIn = Array.from({ length: numCols }, (_, ci) => cellKey(r, ci)).every((k) => next.has(k))
      for (let ci = 0; ci < numCols; ci++) allIn ? next.delete(cellKey(r, ci)) : next.add(cellKey(r, ci))
      setSelectedCells(next)
      setAnchorCell({ row: r, col: 0 })
    } else {
      const cells = new Set<string>()
      for (let ci = 0; ci < numCols; ci++) cells.add(cellKey(r, ci))
      setSelectedCells(cells)
      setAnchorCell({ row: r, col: 0 })
    }
  }

  function handleColHeaderClick(c: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSelected) onSelect?.()
    if (editingCell) { commitCurrentEdit(); setEditingCell(null) }
    const numRows = block.rows.length
    if (e.shiftKey && anchorCell) {
      const minC = Math.min(anchorCell.col, c), maxC = Math.max(anchorCell.col, c)
      const cells = new Set<string>()
      for (let ri = 0; ri < numRows; ri++)
        for (let ci = minC; ci <= maxC; ci++)
          cells.add(cellKey(ri, ci))
      setSelectedCells(cells)
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedCells)
      const allIn = Array.from({ length: numRows }, (_, ri) => cellKey(ri, c)).every((k) => next.has(k))
      for (let ri = 0; ri < numRows; ri++) allIn ? next.delete(cellKey(ri, c)) : next.add(cellKey(ri, c))
      setSelectedCells(next)
      setAnchorCell({ row: 0, col: c })
    } else {
      const cells = new Set<string>()
      for (let ri = 0; ri < numRows; ri++) cells.add(cellKey(ri, c))
      setSelectedCells(cells)
      setAnchorCell({ row: 0, col: c })
    }
  }

  function handleSelectAll(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSelected) onSelect?.()
    if (editingCell) { commitCurrentEdit(); setEditingCell(null) }
    const cells = new Set<string>()
    for (let ri = 0; ri < block.rows.length; ri++)
      for (let ci = 0; ci < block.headers.length; ci++)
        cells.add(cellKey(ri, ci))
    setSelectedCells(cells)
    setAnchorCell({ row: 0, col: 0 })
  }

  function handleCellClick(r: number, c: number, e: React.MouseEvent) {
    if (!onUpdate) return
    e.stopPropagation()
    // Select block first if not already selected
    if (!isSelected) {
      onSelect?.()
    }
    if (e.shiftKey && anchorCell && isSelected) {
      if (editingCell) { commitCurrentEdit(); setEditingCell(null) }
      const minR = Math.min(anchorCell.row, r), maxR = Math.max(anchorCell.row, r)
      const minC = Math.min(anchorCell.col, c), maxC = Math.max(anchorCell.col, c)
      const cells = new Set<string>()
      for (let ri = minR; ri <= maxR; ri++)
        for (let ci = minC; ci <= maxC; ci++)
          cells.add(cellKey(ri, ci))
      setSelectedCells(cells)
    } else if ((e.ctrlKey || e.metaKey) && isSelected) {
      if (editingCell) { commitCurrentEdit(); setEditingCell(null) }
      const key = cellKey(r, c)
      const next = new Set(selectedCells)
      if (next.has(key)) next.delete(key)
      else { next.add(key); setAnchorCell({ row: r, col: c }) }
      setSelectedCells(next)
    } else {
      if (editingCell && (editingCell.row !== r || editingCell.col !== c)) commitCurrentEdit()
      startEditing(r, c)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    const numRows = block.rows.length
    const numCols = block.headers.length
    if (e.key === 'Tab') {
      e.preventDefault()
      commitCurrentEdit(r, c, editValue)
      setEditingCell(null)
      const nc = e.shiftKey ? c - 1 : c + 1
      if (nc >= 0 && nc < numCols) startEditing(r, nc)
      else if (nc >= numCols && r + 1 < numRows) startEditing(r + 1, 0)
      else if (nc < 0 && r > 0) startEditing(r - 1, numCols - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commitCurrentEdit(r, c, editValue)
      setEditingCell(null)
      if (r + 1 < numRows) startEditing(r + 1, c)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  const headerBg = block.headerBg || dp.tableHeaderBg
  const headerText = block.headerText || dp.tableHeaderText

  // Border helpers — same logic as BlockContent and print renderer
  const tvwBrd = block.borders
  const tvwCols = block.headers.length
  const tvwTotalRows = 1 + block.rows.length
  const tvwGlobalBrd = (absRow: number, ci: number): React.CSSProperties => {
    if (tvwBrd) return computeTableCellBorders(tvwBrd, absRow === 0, absRow === tvwTotalRows - 1, ci === 0, ci === tvwCols - 1)
    const b = block.bordered ? (absRow === 0 ? `1px solid ${headerBg}30` : '1px solid #E5E7EB') : 'none'
    return { borderTop: b, borderBottom: b, borderLeft: b, borderRight: b }
  }
  const tvwCellBrd = (absRow: number, ci: number, cell?: TableCell): React.CSSProperties => {
    const g = tvwGlobalBrd(absRow, ci)
    const sb = cell?.sideBorders
    if (!sb) return g
    return {
      borderTop:    sb.top    !== undefined ? sb.top    : g.borderTop,
      borderBottom: sb.bottom !== undefined ? sb.bottom : g.borderBottom,
      borderLeft:   sb.left   !== undefined ? sb.left   : g.borderLeft,
      borderRight:  sb.right  !== undefined ? sb.right  : g.borderRight,
    }
  }

  const spanMap = buildSpanMap(block.rows)
  const DEFAULT_COL_WIDTH = 120
  const DEFAULT_ROW_HEIGHT = 32

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ cursor: resizingCol !== null ? 'col-resize' : resizingRow !== null ? 'row-resize' : undefined, userSelect: resizingCol !== null || resizingRow !== null ? 'none' : undefined }}>
      {/* Caption */}
      {block.caption && <p className="mb-1.5 text-xs text-gray-500 italic">{block.caption}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full"
          style={{ fontFamily: dp.fontFamily, borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed', wordBreak: 'break-word' }}
        >
          {/* Column widths */}
          {block.colWidths && (
            <colgroup>
              {isSelected && <col style={{ width: 28 }} />}
              {block.colWidths.map((w, ci) => <col key={ci} style={{ width: w }} />)}
            </colgroup>
          )}
          <thead>
            {/* Column number row — only in edit mode */}
            {isSelected && (
              <tr>
                {/* Corner: select all */}
                <td
                  onClick={handleSelectAll}
                  title="Select all cells"
                  style={{ width: 28, minWidth: 28, background: '#E2E8F0', border: '1px solid #CBD5E1', cursor: 'pointer', textAlign: 'center', fontSize: 9, color: '#64748B', padding: '2px 0', userSelect: 'none' }}
                >▣</td>
                {block.headers.map((_, ci) => {
                  const colFullySel = block.rows.every((_, ri) => selectedCells.has(cellKey(ri, ci)))
                  return (
                    <td key={ci}
                      onClick={(e) => handleColHeaderClick(ci, e)}
                      title={`Select column ${ci + 1}`}
                      style={{
                        background: colFullySel ? '#BFDBFE' : '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer', textAlign: 'center',
                        fontSize: 10, color: colFullySel ? '#1D4ED8' : '#64748B',
                        fontWeight: colFullySel ? 700 : 400,
                        padding: '2px 0', userSelect: 'none',
                      }}
                    >{ci + 1}</td>
                  )
                })}
              </tr>
            )}
            {/* Column header row */}
            <tr>
              {/* Row number placeholder in header row */}
              {isSelected && (
                <td style={{ width: 28, minWidth: 28, background: '#F1F5F9', border: block.bordered ? `1px solid ${headerBg}30` : '1px solid #E2E8F0' }} />
              )}
              {block.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{
                    background: resizingCol === i ? '#BFDBFE' : headerBg,
                    color: headerText,
                    overflowWrap: 'break-word',
                    cursor: 'text',
                    position: 'relative',
                    ...tvwCellBrd(0, i),
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isSelected) {
                      onSelect?.()
                      setPendingHeaderFocus(i)
                    } else {
                      headerInputRefs.current[i]?.focus()
                    }
                  }}
                >
                  {isSelected && onUpdate ? (
                    <input
                      ref={(el) => { headerInputRefs.current[i] = el }}
                      value={h}
                      onChange={(e) => { const headers = [...block.headers]; headers[i] = e.target.value; onUpdate({ headers }) }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault()
                          const next = e.shiftKey ? i - 1 : i + 1
                          if (next >= 0 && next < block.headers.length) {
                            headerInputRefs.current[next]?.focus()
                            headerInputRefs.current[next]?.select()
                          } else if (next >= block.headers.length) {
                            startEditing(0, 0)
                          }
                        } else if (e.key === 'Escape') {
                          headerInputRefs.current[i]?.blur()
                        }
                      }}
                      className="w-full bg-transparent text-xs font-semibold uppercase tracking-wide outline-none"
                      style={{ color: headerText, minWidth: '40px' }}
                      placeholder={`Col ${i + 1}`}
                    />
                  ) : (
                    <span style={{ minWidth: 40, display: 'inline-block' }}>{h || `Col ${i + 1}`}</span>
                  )}
                  {/* Column resize handle */}
                  {isSelected && onUpdate && (
                    <div
                      title="Drag to resize column"
                      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, cursor: 'col-resize', zIndex: 10 }}
                      onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation()
                        const allWidths = block.colWidths?.slice() ?? block.headers.map(() => DEFAULT_COL_WIDTH)
                        resizingColRef.current = { col: i, startX: e.clientX, startWidth: allWidths[i], allWidths }
                        setResizingCol(i)
                      }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rIdx) => {
              const rowFullySel = block.headers.every((_, ci) => selectedCells.has(cellKey(rIdx, ci)))
              const rowH = block.rowHeights?.[rIdx]
              return (
              <tr key={rIdx} style={{ background: block.striped && rIdx % 2 === 1 ? '#F8FAFC' : 'white', height: rowH }}>
                {/* Row number + row resize handle */}
                {isSelected && (
                  <td
                    onClick={(e) => handleRowHeaderClick(rIdx, e)}
                    title={`Select row ${rIdx + 1}`}
                    style={{
                      width: 28, minWidth: 28,
                      background: rowFullySel ? '#BFDBFE' : (resizingRow === rIdx ? '#BFDBFE' : '#F1F5F9'),
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer', textAlign: 'center',
                      fontSize: 10, color: rowFullySel ? '#1D4ED8' : '#64748B',
                      fontWeight: rowFullySel ? 700 : 400,
                      padding: '4px 0', userSelect: 'none',
                      position: 'relative',
                    }}
                  >
                    {rIdx + 1}
                    {/* Row resize handle */}
                    {onUpdate && (
                      <div
                        title="Drag to resize row"
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, cursor: 'row-resize', zIndex: 10 }}
                        onMouseDown={(e) => {
                          e.preventDefault(); e.stopPropagation()
                          const allHeights = block.rowHeights?.slice() ?? block.rows.map(() => DEFAULT_ROW_HEIGHT)
                          resizingRowRef.current = { row: rIdx, startY: e.clientY, startHeight: allHeights[rIdx], allHeights }
                          setResizingRow(rIdx)
                        }}
                      />
                    )}
                  </td>
                )}
                {row.map((cell, cIdx) => {
                  const key = cellKey(rIdx, cIdx)
                  if (spanMap.has(key)) return null  // covered by a spanning cell
                  const isEditing = editingCell?.row === rIdx && editingCell?.col === cIdx
                  const isCellSel = selectedCells.has(key)
                  const pLeft = `${((cell.indentLevel || 0) * 16) + 12}px`
                  const cs = cell.colspan ?? 1
                  const rs = cell.rowspan ?? 1
                  return (
                    <td
                      key={cIdx}
                      colSpan={cs > 1 ? cs : undefined}
                      rowSpan={rs > 1 ? rs : undefined}
                      style={{
                        textAlign: cell.align,
                        fontWeight: cell.bold ? 600 : 400,
                        fontStyle: cell.italic ? 'italic' : 'normal',
                        textDecoration: cell.underline ? 'underline' : 'none',
                        color: cell.color || dp.textColor,
                        background: isEditing ? '#EFF6FF' : (isCellSel ? '#DBEAFE' : (cell.bgColor || 'transparent')),
                        ...tvwCellBrd(1 + rIdx, cIdx, cell),
                        outline: isEditing ? '2px solid #3B82F6' : (isCellSel && isSelected ? '1px solid #93C5FD' : 'none'),
                        outlineOffset: '-1px',
                        cursor: 'cell',
                        paddingTop: '6px', paddingBottom: '6px',
                        paddingLeft: pLeft, paddingRight: '12px',
                        overflowWrap: 'break-word',
                      }}
                      onClick={(e) => handleCellClick(rIdx, cIdx, e)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => { commitCurrentEdit(rIdx, cIdx, editValue); setEditingCell(null) }}
                          onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                          className="w-full border-none bg-transparent outline-none"
                          style={{
                            font: 'inherit', textAlign: cell.align,
                            fontWeight: cell.bold ? 600 : 400,
                            fontStyle: cell.italic ? 'italic' : 'normal',
                            color: cell.color || dp.textColor,
                            minWidth: '40px',
                          }}
                        />
                      ) : (
                        formatCellContent(cell)
                      )}
                    </td>
                  )
                })}
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Keyboard hint */}
      {isSelected && !editingCell && (
        <p className="mt-1 text-center text-[9px] text-gray-400">
          Click cell to edit · Row/col numbers to select row/col · ▣ to select all · Shift/Ctrl+click to extend · Tab/Enter to navigate · Drag header edge to resize
        </p>
      )}
      {!isSelected && (
        <p className="mt-1 text-center text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition">
          Click any cell to start editing
        </p>
      )}
    </div>
  )
}

// ── Permanent Format Toolbar ────────────────────────────────────────────────

type CoverFieldFocus = {
  fieldName: string
  style: import('../types/report').CoverFieldStyle
  onUpdate: (s: import('../types/report').CoverFieldStyle) => void
}

function FormatToolbar({
  selectedBlock, tableFormatAPI, dp, onQuickUpdate, onMoveUp, onMoveDown, onDelete, coverField,
}: {
  selectedBlock: ReportBlock | null
  tableFormatAPI: TableFormatAPI | null
  dp: DesignPack
  onQuickUpdate?: (updates: Record<string, unknown>) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete?: () => void
  coverField?: CoverFieldFocus | null
}) {
  // Border picker state — always declared so hook order is stable
  const [bStyle, setBStyle] = useState<CellBorder['style']>('solid')
  const [bColor, setBColor] = useState('#374151')
  const [bWidth, setBWidth] = useState<1 | 2 | 3>(1)
  const [showBorderPanel, setShowBorderPanel] = useState(false)
  const [borderPanelPos, setBorderPanelPos] = useState({ top: 0, left: 0 })
  const borderBtnRef = useRef<HTMLButtonElement>(null)
  const activeBorder: CellBorder = { style: bStyle, color: bColor, width: bWidth }

  function openBorderPanel() {
    if (borderBtnRef.current) {
      const r = borderBtnRef.current.getBoundingClientRect()
      setBorderPanelPos({ top: r.bottom + 4, left: r.left })
    }
    setShowBorderPanel((v) => !v)
  }

  const sep = <div className="mx-1 h-5 w-px bg-white/15 shrink-0" />
  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode, key?: string | number) => (
    <button
      key={key}
      title={title}
      onClick={onClick}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-sm transition ${
        active ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >{children}</button>
  )
  const iconBtn = (onClick: () => void, title: string, icon: React.ReactNode, cls = '') => (
    <button title={title} onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded text-slate-300 transition hover:bg-white/10 hover:text-white ${cls}`}>
      {icon}
    </button>
  )

  // Table cell mode: show all cell-level formatting
  if (tableFormatAPI && tableFormatAPI.selectedCells.size > 0) {
    const { selectedCells, firstCell, selectionAllHas, applyToSelected,
            addRow, deleteSelectedRows, addCol, deleteSelectedCols,
            applyFinancialFormat, rowCount, colCount,
            canMerge, canUnmerge, merge, unmerge } = tableFormatAPI
    return (
      <div className="no-print flex h-[48px] shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-[#1A0C05] px-3 toolbar-scroll">
        {/* Context label */}
        <span className="mr-1 shrink-0 rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
          Table — {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''}
        </span>
        {sep}

        {/* B / I / U */}
        {btn(selectionAllHas('bold', true), () => applyToSelected({ bold: !selectionAllHas('bold', true) }), 'Bold', <span className="font-bold">B</span>)}
        {btn(selectionAllHas('italic', true), () => applyToSelected({ italic: !selectionAllHas('italic', true) }), 'Italic', <span className="italic">I</span>)}
        {btn(selectionAllHas('underline', true), () => applyToSelected({ underline: !selectionAllHas('underline', true) }), 'Underline', <span className="underline">U</span>)}
        {sep}

        {/* Alignment */}
        {btn(selectionAllHas('align', 'left'), () => applyToSelected({ align: 'left' }), 'Align left',
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>
        )}
        {btn(selectionAllHas('align', 'center'), () => applyToSelected({ align: 'center' }), 'Align center',
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>
        )}
        {btn(selectionAllHas('align', 'right'), () => applyToSelected({ align: 'right' }), 'Align right',
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>
        )}
        {sep}

        {/* Number format */}
        <select
          value={firstCell?.numberFormat || 'general'}
          onChange={(e) => applyToSelected({ numberFormat: e.target.value as TableCell['numberFormat'] })}
          className="h-7 rounded border border-white/15 bg-[#120B07] px-1 text-[11px] text-slate-300 outline-none focus:border-[#C9A84C]"
          title="Number format"
        >
          <option value="general" className="bg-[#120B07]">General</option>
          <option value="number" className="bg-[#120B07]">1,234</option>
          <option value="currency" className="bg-[#120B07]">$ Currency</option>
          <option value="accounting" className="bg-[#120B07]">() Acctg</option>
          <option value="percentage" className="bg-[#120B07]">% Percent</option>
        </select>
        {sep}

        {/* Fill / Font color */}
        <label title="Cell fill color" className="flex h-7 cursor-pointer items-center gap-1 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition">
          <span className="text-[10px]">Fill</span>
          <input type="color" value={firstCell?.bgColor || '#ffffff'}
            onChange={(e) => applyToSelected({ bgColor: e.target.value === '#ffffff' ? undefined : e.target.value })}
            className="h-4 w-5 cursor-pointer rounded border-0 p-0" />
        </label>
        <label title="Font color" className="flex h-7 cursor-pointer items-center gap-1 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition">
          <span className="font-bold text-[10px]">A</span>
          <input type="color" value={firstCell?.color || '#374151'}
            onChange={(e) => applyToSelected({ color: e.target.value })}
            className="h-4 w-5 cursor-pointer rounded border-0 p-0" />
        </label>
        {sep}

        {/* Row ops */}
        <button title="Add row above" onClick={() => addRow('above')} className="flex h-7 items-center gap-0.5 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition">↑ Row</button>
        <button title="Add row below" onClick={() => addRow('below')} className="flex h-7 items-center gap-0.5 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition">↓ Row</button>
        <button title="Delete row(s)" onClick={deleteSelectedRows} disabled={rowCount <= 1}
          className="flex h-7 items-center rounded px-1.5 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition">− Row</button>
        {sep}

        {/* Col ops */}
        <button title="Add column left" onClick={() => addCol('left')} className="flex h-7 items-center gap-0.5 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition">← Col</button>
        <button title="Add column right" onClick={() => addCol('right')} className="flex h-7 items-center gap-0.5 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 transition">→ Col</button>
        <button title="Delete column(s)" onClick={deleteSelectedCols} disabled={colCount <= 1}
          className="flex h-7 items-center rounded px-1.5 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition">− Col</button>
        {sep}

        {/* Merge / Unmerge */}
        <button
          onClick={merge}
          disabled={!canMerge}
          title="Merge selected cells (select a rectangular range first)"
          className="flex h-7 items-center gap-1 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 disabled:opacity-30 transition"
        >⊞ Merge</button>
        <button
          onClick={unmerge}
          disabled={!canUnmerge}
          title="Unmerge cell"
          className="flex h-7 items-center gap-1 rounded px-1.5 text-[11px] text-slate-300 hover:bg-white/10 disabled:opacity-30 transition"
        >⊟ Unmerge</button>
        {sep}

        {/* Financial preset */}
        <button
          onClick={applyFinancialFormat}
          title="Auto-format: right-align numbers, bold totals, accounting format"
          className="flex h-7 items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
        >$ Financial</button>
        {sep}

        {/* Border picker */}
        <div className="shrink-0">
          <button
            ref={borderBtnRef}
            onClick={openBorderPanel}
            title="Border options for selected cells"
            className={`flex h-7 items-center gap-1.5 rounded px-2 text-[11px] transition ${showBorderPanel ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            <BdrIcon icon={{ top: true, bottom: true, left: true, right: true, innerH: true, innerV: true }} />
            Borders ▾
          </button>
        </div>

        {showBorderPanel && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowBorderPanel(false)} />
            {/* Panel — fixed so it escapes every overflow container */}
            <div
              className="fixed z-[9999] w-72 rounded-lg border border-white/15 bg-[#1A0C05] p-3 shadow-2xl"
              style={{ top: borderPanelPos.top, left: borderPanelPos.left }}
            >
              {/* Line style + color */}
              <div className="mb-2">
                <span className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-slate-500">Line style</span>
                <div className="flex items-center gap-1">
                  {(['solid','dashed','dotted','double'] as const).map((s) => (
                    <button key={s} onClick={() => setBStyle(s)}
                      className={`rounded px-2 py-0.5 text-[10px] transition ${bStyle === s ? 'bg-[#C9A84C] text-[#120B07]' : 'border border-white/10 text-slate-400 hover:border-[#C9A84C]/40'}`}>
                      {s === 'solid' ? '—' : s === 'dashed' ? '- -' : s === 'dotted' ? '···' : '═'}
                    </button>
                  ))}
                  <input type="color" value={bColor} onChange={(e) => setBColor(e.target.value)}
                    className="ml-auto h-6 w-7 cursor-pointer rounded border border-white/10" title="Border color" />
                </div>
              </div>

              {/* Weight */}
              <div className="mb-3 flex gap-1">
                {([1,2,3] as const).map((w) => (
                  <button key={w} onClick={() => setBWidth(w)}
                    className={`rounded px-2.5 py-0.5 text-[10px] transition ${bWidth === w ? 'bg-[#C9A84C] text-[#120B07]' : 'border border-white/10 text-slate-400 hover:border-[#C9A84C]/40'}`}>
                    {w === 1 ? 'Thin' : w === 2 ? 'Medium' : 'Thick'}
                  </button>
                ))}
              </div>

              {/* Preset grid */}
              <div className="mb-3 grid grid-cols-5 gap-1">
                {BORDER_PRESETS.map((preset) => (
                  <button key={preset.label} title={preset.title}
                    onClick={() => { tableFormatAPI?.applyBorderPreset(preset.apply, activeBorder); setShowBorderPanel(false) }}
                    className="flex flex-col items-center gap-0.5 rounded border border-white/10 p-1.5 text-[8px] leading-tight text-slate-400 transition hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 hover:text-[#C9A84C]">
                    <BdrIcon icon={preset.icon} />
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Individual side toggles */}
              <div>
                <span className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-slate-500">Toggle individual sides</span>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    { side: 'top' as const,    label: 'Top' },
                    { side: 'bottom' as const, label: 'Bottom' },
                    { side: 'left' as const,   label: 'Left' },
                    { side: 'right' as const,  label: 'Right' },
                    { side: 'innerH' as const, label: 'Inner ↔' },
                    { side: 'innerV' as const, label: 'Inner ↕' },
                  ]).map(({ side, label }) => {
                    const isActive = tableFormatAPI?.activeSides[side] ?? false
                    return (
                      <button key={side}
                        onClick={() => tableFormatAPI?.applyBorderToggle(side, activeBorder)}
                        className={`rounded border px-1 py-1 text-[9px] transition ${isActive ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:border-[#C9A84C]/40'}`}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    )
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────
  const upIcon = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
  const downIcon = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
  const delIcon = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
  const alignL = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>
  const alignC = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>
  const alignR = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>
  const alignJ = <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>

  const ops = (
    <div className="ml-auto flex shrink-0 items-center gap-0.5">
      {sep}
      {iconBtn(onMoveUp ?? (() => {}), 'Move up', upIcon)}
      {iconBtn(onMoveDown ?? (() => {}), 'Move down', downIcon)}
      {iconBtn(onDelete ?? (() => {}), 'Delete block', delIcon, 'hover:text-red-400')}
    </div>
  )

  const lbl = (text: string, color = 'text-[#C9A84C]') => (
    <span className={`mr-1 shrink-0 rounded bg-[#C9A84C]/15 px-2 py-0.5 text-[10px] font-semibold ${color}`}>{text}</span>
  )

  const cpick = (val: string, onChange: (v: string) => void, label: string) => (
    <label className="flex h-7 shrink-0 cursor-pointer items-center gap-0.5 rounded px-1.5 text-[10px] text-slate-400 hover:bg-white/10 transition" title={label}>
      {label}
      <input type="color" value={val} onChange={(e) => onChange(e.target.value)} className="ml-0.5 h-4 w-5 cursor-pointer rounded border-0 p-0" />
    </label>
  )

  const fsCtrl = (val: number | undefined, onChange: (v: number) => void) => {
    const v = val || 13
    return (
      <div className="flex h-7 shrink-0 items-center gap-0" title="Font size">
        <button onClick={() => onChange(Math.max(8, v - 1))} className="flex h-7 w-5 items-center justify-center rounded-l border border-white/15 bg-[#120B07] text-[11px] text-slate-400 hover:bg-white/10 hover:text-white">−</button>
        <input type="number" min={8} max={96} step={1} value={v}
          onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 8 && n <= 96) onChange(n) }}
          className="h-7 w-10 border-y border-white/15 bg-[#120B07] text-center text-[10px] text-white outline-none focus:border-[#C9A84C] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button onClick={() => onChange(Math.min(96, v + 1))} className="flex h-7 w-5 items-center justify-center rounded-r border border-white/15 bg-[#120B07] text-[11px] text-slate-400 hover:bg-white/10 hover:text-white">+</button>
        <span className="ml-1 text-[9px] text-slate-600">px</span>
      </div>
    )
  }

  const boldItalic = (bold: boolean | undefined, italic: boolean | undefined) => (
    <>
      {btn(!!bold, () => onQuickUpdate?.({ bold: !bold }), 'Bold', <span className="font-bold text-sm">B</span>)}
      {btn(!!italic, () => onQuickUpdate?.({ italic: !italic }), 'Italic', <span className="italic text-sm">I</span>)}
    </>
  )

  const row = 'no-print flex h-[48px] shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-[#1A0C05] px-3'

  // ── Table selected but no cells ────────────────────────────────────────────
  if (selectedBlock?.type === 'table' && onQuickUpdate) {
    const tb = selectedBlock as TableBlock
    return (
      <div className={row}>
        {lbl('Table')}
        {sep}
        {btn(tb.striped, () => onQuickUpdate({ striped: !tb.striped }), 'Toggle striped rows', 'Striped')}
        {btn(tb.bordered, () => onQuickUpdate({ bordered: !tb.bordered }), 'Toggle borders', 'Bordered')}
        {sep}
        {cpick(tb.headerBg || dp.tableHeaderBg, (v) => onQuickUpdate({ headerBg: v }), 'Hdr BG')}
        {cpick(tb.headerText || dp.tableHeaderText, (v) => onQuickUpdate({ headerText: v }), 'Hdr Text')}
        {cpick(tb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'Block BG')}
        {sep}
        <span className="text-[10px] text-slate-600">Click a cell for cell formatting</span>
        {ops}
      </div>
    )
  }

  // ── Heading ────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'heading' && onQuickUpdate) {
    const hb = selectedBlock as HeadingBlock
    return (
      <div className={row}>
        {lbl('Heading')}
        {sep}
        {([1, 2, 3] as const).map((l) => btn(hb.level === l, () => onQuickUpdate({ level: l }), `Heading ${l}`, `H${l}`, l))}
        {sep}
        {boldItalic(hb.bold, hb.italic)}
        {sep}
        {fsCtrl(hb.fontSize, (v) => onQuickUpdate({ fontSize: v }))}
        {sep}
        {btn(hb.align === 'left', () => onQuickUpdate({ align: 'left' }), 'Left', alignL)}
        {btn(hb.align === 'center', () => onQuickUpdate({ align: 'center' }), 'Center', alignC)}
        {btn(hb.align === 'right', () => onQuickUpdate({ align: 'right' }), 'Right', alignR)}
        {sep}
        {cpick(hb.color || dp.headingColor, (v) => onQuickUpdate({ color: v }), 'Text')}
        {cpick(hb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Text ───────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'text' && onQuickUpdate) {
    const tb = selectedBlock as TextBlock
    return (
      <div className={row}>
        {lbl('Text')}
        {sep}
        {boldItalic(tb.bold, tb.italic)}
        {sep}
        {fsCtrl(tb.fontSize, (v) => onQuickUpdate({ fontSize: v }))}
        {sep}
        {btn(tb.align === 'left', () => onQuickUpdate({ align: 'left' }), 'Left', alignL)}
        {btn(tb.align === 'center', () => onQuickUpdate({ align: 'center' }), 'Center', alignC)}
        {btn(tb.align === 'right', () => onQuickUpdate({ align: 'right' }), 'Right', alignR)}
        {btn(tb.align === 'justify', () => onQuickUpdate({ align: 'justify' }), 'Justify', alignJ)}
        {sep}
        {cpick(tb.color || dp.textColor, (v) => onQuickUpdate({ color: v }), 'Text')}
        {cpick(tb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Image ──────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'image' && onQuickUpdate) {
    const ib = selectedBlock as ImageBlock
    return (
      <div className={row}>
        {lbl('Image')}
        {sep}
        {(['full', 'large', 'medium', 'small'] as const).map((w) => btn(ib.width === w, () => onQuickUpdate({ width: w }), `Width: ${w}`, w.charAt(0).toUpperCase() + w.slice(1), w))}
        {sep}
        {btn(ib.align === 'left', () => onQuickUpdate({ align: 'left' }), 'Left', alignL)}
        {btn(ib.align === 'center', () => onQuickUpdate({ align: 'center' }), 'Center', alignC)}
        {btn(ib.align === 'right', () => onQuickUpdate({ align: 'right' }), 'Right', alignR)}
        {sep}
        {cpick(ib.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Callout ────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'callout' && onQuickUpdate) {
    const cb = selectedBlock as CalloutBlock
    const variants = { info: 'text-blue-400', success: 'text-emerald-400', warning: 'text-amber-400', danger: 'text-red-400' } as const
    return (
      <div className={row}>
        {lbl('Callout')}
        {sep}
        {(Object.keys(variants) as Array<keyof typeof variants>).map((v) => (
          <button key={v} onClick={() => onQuickUpdate({ variant: v })}
            className={`h-7 rounded px-2.5 text-[11px] capitalize transition ${cb.variant === v ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'} ${variants[v]}`}>
            {v}
          </button>
        ))}
        {sep}
        {boldItalic(cb.bold, cb.italic)}
        {sep}
        {fsCtrl(cb.fontSize, (v) => onQuickUpdate({ fontSize: v }))}
        {sep}
        {cpick(cb.bgColor || '#EFF6FF', (v) => onQuickUpdate({ bgColor: v }), 'Box BG')}
        {ops}
      </div>
    )
  }

  // ── Quote ──────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'quote' && onQuickUpdate) {
    const qb = selectedBlock as QuoteBlock
    return (
      <div className={row}>
        {lbl('Quote')}
        {sep}
        {boldItalic(qb.bold, qb.italic)}
        {sep}
        {fsCtrl(qb.fontSize, (v) => onQuickUpdate({ fontSize: v }))}
        {sep}
        {cpick(qb.color || dp.textColor, (v) => onQuickUpdate({ color: v }), 'Text')}
        {cpick(qb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Divider ────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'divider' && onQuickUpdate) {
    const db = selectedBlock as DividerBlock
    return (
      <div className={row}>
        {lbl('Divider')}
        {sep}
        {(['solid', 'dashed', 'double'] as const).map((s) => btn(db.style === s, () => onQuickUpdate({ style: s }), s, s.charAt(0).toUpperCase() + s.slice(1), s))}
        {sep}
        {cpick(db.color || dp.primaryColor, (v) => onQuickUpdate({ color: v }), 'Color')}
        {sep}
        <label className="flex h-7 shrink-0 items-center gap-1 text-[10px] text-slate-400" title="Thickness">
          <span>Thick</span>
          <input type="number" min={1} max={8} step={1} value={db.thickness || 1}
            onChange={(e) => onQuickUpdate({ thickness: Number(e.target.value) })}
            className="h-5 w-10 rounded border border-white/15 bg-[#120B07] text-center text-[10px] text-white outline-none focus:border-[#C9A84C] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          <span className="text-[9px] text-slate-600">px</span>
        </label>
        {ops}
      </div>
    )
  }

  // ── Spacer ─────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'spacer' && onQuickUpdate) {
    const sb = selectedBlock as SpacerBlock
    return (
      <div className={row}>
        {lbl('Spacer')}
        {sep}
        <label className="flex h-7 shrink-0 items-center gap-1 text-[10px] text-slate-400" title="Height">
          <span>Height</span>
          <input type="number" min={4} max={400} step={4} value={sb.height || 24}
            onChange={(e) => onQuickUpdate({ height: Number(e.target.value) })}
            className="h-5 w-14 rounded border border-white/15 bg-[#120B07] text-center text-[10px] text-white outline-none focus:border-[#C9A84C] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          <span className="text-[9px] text-slate-600">px</span>
        </label>
        {ops}
      </div>
    )
  }

  // ── KPI ────────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'kpi' && onQuickUpdate) {
    const kb = selectedBlock as KpiBlock
    return (
      <div className={row}>
        {lbl('KPI')}
        {sep}
        <span className="text-[10px] text-slate-500">Cols</span>
        {([2, 3, 4] as const).map((c) => btn(kb.columns === c, () => onQuickUpdate({ columns: c }), `${c} columns`, `${c}`, c))}
        {sep}
        {cpick(kb.accentColor || dp.kpiAccent, (v) => onQuickUpdate({ accentColor: v }), 'Accent')}
        {cpick(kb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Chart ──────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'chart' && onQuickUpdate) {
    const cb = selectedBlock as ChartBlock
    return (
      <div className={row}>
        {lbl('Chart')}
        {sep}
        {btn(cb.showLegend, () => onQuickUpdate({ showLegend: !cb.showLegend }), 'Toggle legend', 'Legend')}
        {btn(cb.showGrid, () => onQuickUpdate({ showGrid: !cb.showGrid }), 'Toggle grid', 'Grid')}
        {btn(cb.showLabels !== false, () => onQuickUpdate({ showLabels: !(cb.showLabels !== false) }), 'Toggle value labels', 'Labels')}
        {sep}
        <label className="flex h-7 shrink-0 items-center gap-1 text-[10px] text-slate-400" title="Chart height">
          <span>H</span>
          <input type="number" min={80} max={600} step={20} value={cb.height || 200}
            onChange={(e) => onQuickUpdate({ height: Number(e.target.value) })}
            className="h-5 w-14 rounded border border-white/15 bg-[#120B07] text-center text-[10px] text-white outline-none focus:border-[#C9A84C] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          <span className="text-[9px] text-slate-600">px</span>
        </label>
        {sep}
        {cpick(cb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── TOC ────────────────────────────────────────────────────────────────────
  if (selectedBlock?.type === 'toc' && onQuickUpdate) {
    const tb = selectedBlock as TocBlock
    return (
      <div className={row}>
        {lbl('TOC')}
        {sep}
        {btn(tb.includePageNumbers, () => onQuickUpdate({ includePageNumbers: !tb.includePageNumbers }), 'Toggle page numbers', 'Page #s')}
        {sep}
        {cpick(tb.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Status / Progress ──────────────────────────────────────────────────────
  if ((selectedBlock?.type === 'status' || selectedBlock?.type === 'progress') && onQuickUpdate) {
    const sb = selectedBlock as StatusBlock | ProgressBlock
    const typeLabel = sb.type.charAt(0).toUpperCase() + sb.type.slice(1)
    return (
      <div className={row}>
        {lbl(typeLabel)}
        {sep}
        {cpick((sb.bgColor) || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {ops}
      </div>
    )
  }

  // ── Generic fallback (any other selected block) ────────────────────────────
  if (selectedBlock && onQuickUpdate) {
    const typeLabel = selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)
    const anyBlock = selectedBlock as { bgColor?: string }
    return (
      <div className={row}>
        {lbl(typeLabel)}
        {sep}
        {cpick(anyBlock.bgColor || '#ffffff', (v) => onQuickUpdate({ bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
        {sep}
        <span className="text-[10px] text-slate-600">Edit content in Properties panel</span>
        {ops}
      </div>
    )
  }

  if (selectedBlock) {
    const typeLabel = selectedBlock.type.charAt(0).toUpperCase() + selectedBlock.type.slice(1)
    return (
      <div className={row}>
        {lbl(typeLabel)}
        {ops}
      </div>
    )
  }

  // ── Cover page field focused ────────────────────────────────────────────────
  if (coverField && !selectedBlock) {
    const { fieldName, style: cs, onUpdate: updCS } = coverField
    const fieldLabels: Record<string, string> = {
      reportTitle: 'Report Title', subtitle: 'Subtitle',
      companyName: 'Company Name', date: 'Date',
    }
    // H1/H2/H3 map to size presets matching heading defaults
    const H_SIZES: Record<number, number> = { 1: 36, 2: 28, 3: 22 }
    const activeLevel = cs.fontSize ? ([1, 2, 3] as const).find((l) => H_SIZES[l] === cs.fontSize) : undefined
    return (
      <div className={row} onMouseDown={(e) => e.preventDefault()}>
        {lbl(fieldLabels[fieldName] ?? fieldName)}
        {sep}
        {([1, 2, 3] as const).map((l) => btn(activeLevel === l, () => updCS({ ...cs, fontSize: H_SIZES[l] }), `Preset H${l}`, `H${l}`, l))}
        {sep}
        {btn(!!cs.bold,   () => updCS({ ...cs, bold:   !cs.bold }),   'Bold',   <span className="font-bold text-sm">B</span>)}
        {btn(!!cs.italic, () => updCS({ ...cs, italic: !cs.italic }), 'Italic', <span className="italic text-sm">I</span>)}
        {sep}
        {fsCtrl(cs.fontSize, (v) => updCS({ ...cs, fontSize: v }))}
        {sep}
        {btn(cs.align === 'left',   () => updCS({ ...cs, align: 'left' }),   'Align left',   alignL)}
        {btn(cs.align === 'center', () => updCS({ ...cs, align: 'center' }), 'Align center', alignC)}
        {btn(cs.align === 'right',  () => updCS({ ...cs, align: 'right' }),  'Align right',  alignR)}
        {sep}
        {cpick(cs.color || '#ffffff', (v) => updCS({ ...cs, color: v }), 'Text')}
        {cpick(cs.bgColor || '#ffffff', (v) => updCS({ ...cs, bgColor: v === '#ffffff' ? undefined : v }), 'BG')}
      </div>
    )
  }

  // Nothing selected
  return (
    <div className="no-print flex h-[48px] shrink-0 items-center gap-3 border-b border-white/10 bg-[#1A0C05] px-4">
      <span className="text-xs text-slate-600">Select a block to format it</span>
      <span className="text-[10px] text-slate-700">· Click a table cell to access cell-level formatting</span>
    </div>
  )
}

// ── Right Panel ─────────────────────────────────────────────────────────────

function RightPanel({
  report, dp, selectedBlock, selectedBlockPageId, selectedPageId, docName,
  isCoverSelected, selectedShape, selectedShapePageId,
  onUpdateBlock, onUpdateShape, onDeleteShape, onReorderShape, onUpdateReport, onSaveShapeTemplate, onCoverDeselect,
}: {
  report: ReportData
  dp: DesignPack
  docName: string
  selectedBlock: ReportBlock | null
  selectedBlockPageId: string | null
  selectedPageId: string | null
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
  const [rightTab, setRightTab] = useState<'properties' | 'style' | 'ai'>('properties')

  const upd = (updates: Record<string, unknown>) => {
    if (selectedBlock && selectedBlockPageId) onUpdateBlock(selectedBlockPageId, selectedBlock.id, updates)
  }

  useEffect(() => {
    if (selectedBlock || selectedShape || isCoverSelected) setRightTab('properties')
  }, [selectedBlock?.id, selectedShape?.id, isCoverSelected])

  const currentPage = report.pages.find((p) => p.id === selectedPageId) ?? null
  const hasSelection = !!(selectedBlock || selectedShape || isCoverSelected)

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-white/10">
        {([
          { id: 'properties', label: 'Properties' },
          { id: 'style',      label: 'Style' },
          { id: 'ai',         label: '✨ AI' },
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
            {isCoverSelected && !selectedBlock ? (
              <CoverStylePanel
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
            ) : currentPage ? (
              <PageStyleEditor
                page={currentPage}
                onUpdatePage={(style) => onUpdateReport((prev) => ({
                  ...prev,
                  pages: prev.pages.map((p) => p.id === currentPage.id ? { ...p, style: { ...p.style, ...style } } : p),
                }))}
                onApplyToAll={(style) => onUpdateReport((prev) => ({
                  ...prev,
                  pages: prev.pages.map((p) => ({ ...p, style: { ...p.style, ...style } })),
                }))}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <p className="text-slate-500">Click a page or block to edit</p>
              </div>
            )}
          </>
        )}

        {rightTab === 'style' && (
          <DesignStudio report={report} onUpdateReport={onUpdateReport} />
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
      return <TableEditor block={block} dp={dp} onUpdate={onUpdate} />
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
    case 'callout':
      return (
        <div className="flex flex-col gap-3">
          <div>
            {label('Variant')}
            <div className="flex gap-1">
              {(['info', 'success', 'warning', 'danger'] as const).map((v) => {
                const colors: Record<string, string> = { info: '#3B82F6', success: '#10B981', warning: '#F59E0B', danger: '#EF4444' }
                return (
                  <button key={v} onClick={() => onUpdate({ variant: v })}
                    className={`flex-1 rounded border py-1 text-[10px] capitalize transition ${(block as CalloutBlock).variant === v ? 'border-current font-semibold' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                    style={{ color: colors[v], borderColor: (block as CalloutBlock).variant === v ? colors[v] : undefined }}>
                    {v}
                  </button>
                )
              })}
            </div>
          </div>
          <div>{label('Content')}<textarea value={(block as CalloutBlock).content} onChange={(e) => onUpdate({ content: e.target.value })} rows={4} className={`${inputCls} resize-none`} /></div>
        </div>
      )
    case 'quote':
      return (
        <div className="flex flex-col gap-3">
          <div>{label('Quote Text')}<textarea value={(block as QuoteBlock).content} onChange={(e) => onUpdate({ content: e.target.value })} rows={4} className={`${inputCls} resize-none`} /></div>
          <div>{label('Attribution')}<input value={(block as QuoteBlock).attribution || ''} onChange={(e) => onUpdate({ attribution: e.target.value })} placeholder="— Author Name" className={inputCls} /></div>
        </div>
      )
    case 'status':
      return <StatusEditor block={block as StatusBlock} onUpdate={onUpdate} />
    case 'progress':
      return <ProgressEditor block={block as ProgressBlock} onUpdate={onUpdate} />
    case 'columns': {
      const cb = block as ColumnsBlock
      return (
        <div className="flex flex-col gap-3">
          <div>
            {label('Column Split')}
            <div className="grid grid-cols-1 gap-1">
              {([
                ['50-50', '50% / 50%'],
                ['33-67', '33% / 67%'],
                ['67-33', '67% / 33%'],
                ['25-75', '25% / 75%'],
                ['75-25', '75% / 25%'],
              ] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => onUpdate({ split: val })}
                  className={`rounded border px-2 py-1.5 text-xs transition ${cb.split === val ? 'border-[#C9A84C] bg-[#C9A84C]/20 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      <div className="h-3 rounded-sm bg-current opacity-70" style={{ width: `${parseInt(val.split('-')[0]) * 0.4}px` }} />
                      <div className="h-3 rounded-sm bg-current opacity-40" style={{ width: `${parseInt(val.split('-')[1]) * 0.4}px` }} />
                    </div>
                    <span>{lbl}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            {label(`Gap: ${cb.gap}px`)}
            <input type="range" min={0} max={48} step={4} value={cb.gap} onChange={(e) => onUpdate({ gap: Number(e.target.value) })} className="w-full" />
          </div>
          <div className="rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-3 py-2 text-[10px] leading-relaxed text-[#C9A84C]">
            Click inside each column on the canvas to add and edit blocks independently.
          </div>
        </div>
      )
    }
  }
}

// ── Table border helpers ───────────────────────────────────────────────────

const EMPTY_BORDERS: TableBorders = { top: null, bottom: null, left: null, right: null, innerH: null, innerV: null }

interface BorderPreset {
  label: string
  title: string
  icon: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean; innerH?: boolean; innerV?: boolean; dblBottom?: boolean }
  apply: (b: CellBorder) => TableBorders
}

const BORDER_PRESETS: BorderPreset[] = [
  { label: 'None',         title: 'No borders',                   icon: {},                                                       apply: () => ({ ...EMPTY_BORDERS }) },
  { label: 'All',          title: 'All borders',                  icon: { top:true,bottom:true,left:true,right:true,innerH:true,innerV:true }, apply: (b) => ({ top:b,bottom:b,left:b,right:b,innerH:b,innerV:b }) },
  { label: 'Outside',      title: 'Outside borders only',         icon: { top:true,bottom:true,left:true,right:true },             apply: (b) => ({ ...EMPTY_BORDERS, top:b,bottom:b,left:b,right:b }) },
  { label: 'Inside',       title: 'Inside borders only',          icon: { innerH:true,innerV:true },                              apply: (b) => ({ ...EMPTY_BORDERS, innerH:b,innerV:b }) },
  { label: 'Top',          title: 'Top border only',              icon: { top:true },                                             apply: (b) => ({ ...EMPTY_BORDERS, top:b }) },
  { label: 'Bottom',       title: 'Bottom border only',           icon: { bottom:true },                                          apply: (b) => ({ ...EMPTY_BORDERS, bottom:b }) },
  { label: 'Left',         title: 'Left border only',             icon: { left:true },                                            apply: (b) => ({ ...EMPTY_BORDERS, left:b }) },
  { label: 'Right',        title: 'Right border only',            icon: { right:true },                                           apply: (b) => ({ ...EMPTY_BORDERS, right:b }) },
  { label: 'Top+Btm',      title: 'Top and bottom borders',       icon: { top:true,bottom:true },                                 apply: (b) => ({ ...EMPTY_BORDERS, top:b,bottom:b }) },
  { label: 'Inner H',      title: 'Horizontal inner lines only',  icon: { innerH:true },                                          apply: (b) => ({ ...EMPTY_BORDERS, innerH:b }) },
  { label: 'Inner V',      title: 'Vertical inner lines only',    icon: { innerV:true },                                          apply: (b) => ({ ...EMPTY_BORDERS, innerV:b }) },
  { label: 'Thick Box',    title: 'Thick outside box border',     icon: { top:true,bottom:true,left:true,right:true },             apply: (b) => ({ ...EMPTY_BORDERS, top:{...b,width:3},bottom:{...b,width:3},left:{...b,width:3},right:{...b,width:3} }) },
  { label: 'Dbl Btm',      title: 'Double bottom border',         icon: { bottom:true,dblBottom:true },                           apply: (b) => ({ ...EMPTY_BORDERS, bottom:{...b,style:'double'} }) },
  { label: 'Top+Dbl Btm',  title: 'Top border + double bottom',   icon: { top:true,bottom:true,dblBottom:true },                  apply: (b) => ({ ...EMPTY_BORDERS, top:b,bottom:{...b,style:'double'} }) },
  { label: 'All Double',   title: 'All borders as double lines',  icon: { top:true,bottom:true,left:true,right:true,innerH:true,innerV:true,dblBottom:true }, apply: (b) => { const d={...b,style:'double' as const}; return { top:d,bottom:d,left:d,right:d,innerH:d,innerV:d } } },
]

function BdrIcon({ icon }: { icon: BorderPreset['icon'] }) {
  const S = 20
  const M = S / 2
  const ON = '#1e293b'
  const OFF = '#e2e8f0'
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ display: 'block', flexShrink: 0 }}>
      {/* outer box bg */}
      <rect x={1} y={1} width={S-2} height={S-2} fill="none" />
      {/* top */}
      <line x1={1} y1={1} x2={S-1} y2={1} stroke={icon.top ? ON : OFF} strokeWidth={icon.top ? 1.5 : 1} />
      {/* bottom — double variant */}
      {icon.dblBottom && icon.bottom
        ? <><line x1={1} y1={S-3} x2={S-1} y2={S-3} stroke={ON} strokeWidth={1.2} /><line x1={1} y1={S-1} x2={S-1} y2={S-1} stroke={ON} strokeWidth={1.2} /></>
        : <line x1={1} y1={S-1} x2={S-1} y2={S-1} stroke={icon.bottom ? ON : OFF} strokeWidth={icon.bottom ? 1.5 : 1} />}
      {/* left */}
      <line x1={1} y1={1} x2={1} y2={S-1} stroke={icon.left ? ON : OFF} strokeWidth={icon.left ? 1.5 : 1} />
      {/* right */}
      <line x1={S-1} y1={1} x2={S-1} y2={S-1} stroke={icon.right ? ON : OFF} strokeWidth={icon.right ? 1.5 : 1} />
      {/* innerH */}
      <line x1={2} y1={M} x2={S-2} y2={M} stroke={icon.innerH ? ON : OFF} strokeWidth={1} strokeDasharray={icon.innerH ? undefined : '2 1'} />
      {/* innerV */}
      <line x1={M} y1={2} x2={M} y2={S-2} stroke={icon.innerV ? ON : OFF} strokeWidth={1} strokeDasharray={icon.innerV ? undefined : '2 1'} />
    </svg>
  )
}

function fmtBorder(b: CellBorder | null): string {
  if (!b) return 'none'
  const px = b.style === 'double' ? ([3, 4, 6] as const)[b.width - 1] : b.width
  return `${px}px ${b.style} ${b.color}`
}

function computeTableCellBorders(
  borders: TableBorders,
  isTopRow: boolean,
  isBottomRow: boolean,
  isLeftCol: boolean,
  isRightCol: boolean,
): React.CSSProperties {
  return {
    borderTop:    fmtBorder(isTopRow    ? borders.top    : null),
    borderBottom: fmtBorder(isBottomRow ? borders.bottom : borders.innerH),
    borderLeft:   fmtBorder(isLeftCol   ? borders.left   : null),
    borderRight:  fmtBorder(isRightCol  ? borders.right  : borders.innerV),
  }
}

// ── Table Editor (Properties panel — configuration only) ─────────────────────

function TableEditor({ block, dp, onUpdate }: { block: TableBlock; dp: DesignPack; onUpdate: (u: Record<string, unknown>) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'

  function addRow() {
    onUpdate({ rows: [...block.rows, block.headers.map(() => ({ content: '', bold: false, align: 'left' as const }))] })
  }
  function removeLastRow() {
    if (block.rows.length <= 1) return
    onUpdate({ rows: block.rows.slice(0, -1) })
  }
  function addCol() {
    onUpdate({
      headers: [...block.headers, `Col ${block.headers.length + 1}`],
      rows: block.rows.map((row) => [...row, { content: '', bold: false, align: 'left' as const }]),
    })
  }
  function removeLastCol() {
    if (block.headers.length <= 1) return
    onUpdate({ headers: block.headers.slice(0, -1), rows: block.rows.map((row) => row.slice(0, -1)) })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas edit hint */}
      <div className="rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-3 py-2 text-[10px] leading-relaxed text-[#C9A84C]">
        Click cells to select them, then use the <strong>Borders ▾</strong> button in the top toolbar to apply borders.
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Caption</label>
        <input value={block.caption} onChange={(e) => onUpdate({ caption: e.target.value })} className={inputCls} placeholder="Table caption…" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={block.striped} onChange={(e) => onUpdate({ striped: e.target.checked })} />
          Striped rows
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={block.allowBreak ?? false} onChange={(e) => onUpdate({ allowBreak: e.target.checked })} />
          Allow rows to split across pages
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Header Colors</label>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[9px] text-slate-500">Background</span>
            <input type="color" value={block.headerBg || dp.tableHeaderBg} onChange={(e) => onUpdate({ headerBg: e.target.value })} className="h-7 w-full cursor-pointer rounded" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[9px] text-slate-500">Text</span>
            <input type="color" value={block.headerText || dp.tableHeaderText} onChange={(e) => onUpdate({ headerText: e.target.value })} className="h-7 w-full cursor-pointer rounded" />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Structure</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500">Rows: {block.rows.length}</span>
            <div className="flex gap-1">
              <button onClick={addRow} className="flex-1 rounded border border-white/10 py-1 text-xs text-slate-400 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition">+ Row</button>
              <button onClick={removeLastRow} disabled={block.rows.length <= 1} className="flex-1 rounded border border-white/10 py-1 text-xs text-slate-400 hover:border-red-400/50 hover:text-red-400 disabled:opacity-30 transition">− Row</button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500">Columns: {block.headers.length}</span>
            <div className="flex gap-1">
              <button onClick={addCol} className="flex-1 rounded border border-white/10 py-1 text-xs text-slate-400 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition">+ Col</button>
              <button onClick={removeLastCol} disabled={block.headers.length <= 1} className="flex-1 rounded border border-white/10 py-1 text-xs text-slate-400 hover:border-red-400/50 hover:text-red-400 disabled:opacity-30 transition">− Col</button>
            </div>
          </div>
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

// ── Status Editor ────────────────────────────────────────────────────────────

function StatusEditor({ block, onUpdate }: { block: StatusBlock; onUpdate: (u: Record<string, unknown>) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'
  function updItem(id: string, field: keyof StatusItem, val: unknown) {
    onUpdate({ items: block.items.map((it) => it.id !== id ? it : { ...it, [field]: val }) })
  }
  return (
    <div className="flex flex-col gap-3">
      <div><label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Title</label><input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inputCls} /></div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Items</span>
          <button onClick={() => onUpdate({ items: [...block.items, { id: uuidv4(), label: 'New Task', status: 'pending' as const }] })} className="text-[10px] text-slate-400 hover:text-[#C9A84C]">+ Add</button>
        </div>
        <div className="flex flex-col gap-1.5">
          {block.items.map((item) => (
            <div key={item.id} className="flex gap-1.5 items-center">
              <input value={item.label} onChange={(e) => updItem(item.id, 'label', e.target.value)} className={`${inputCls} flex-1`} />
              <select value={item.status} onChange={(e) => updItem(item.id, 'status', e.target.value)} className="rounded border border-white/10 bg-[#120B07] px-1 py-1 text-[10px] text-white outline-none">
                <option value="done" className="bg-[#1C1008]">Done</option>
                <option value="in-progress" className="bg-[#1C1008]">In Progress</option>
                <option value="pending" className="bg-[#1C1008]">Pending</option>
                <option value="blocked" className="bg-[#1C1008]">Blocked</option>
              </select>
              {block.items.length > 1 && <button onClick={() => onUpdate({ items: block.items.filter((i) => i.id !== item.id) })} className="shrink-0 text-slate-600 hover:text-red-400">✕</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Progress Editor ───────────────────────────────────────────────────────────

function ProgressEditor({ block, onUpdate }: { block: ProgressBlock; onUpdate: (u: Record<string, unknown>) => void }) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none focus:border-[#C9A84C]'
  function updItem(id: string, field: keyof ProgressItem, val: unknown) {
    onUpdate({ items: block.items.map((it) => it.id !== id ? it : { ...it, [field]: val }) })
  }
  return (
    <div className="flex flex-col gap-3">
      <div><label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Title</label><input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} className={inputCls} /></div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Bars</span>
          <button onClick={() => onUpdate({ items: [...block.items, { id: uuidv4(), label: 'Item', value: 50, color: '#2D7DD2' }] })} className="text-[10px] text-slate-400 hover:text-[#C9A84C]">+ Add</button>
        </div>
        <div className="flex flex-col gap-2">
          {block.items.map((item) => (
            <div key={item.id} className="rounded border border-white/10 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <input value={item.label} onChange={(e) => updItem(item.id, 'label', e.target.value)} className={`${inputCls} flex-1 mr-1`} />
                {block.items.length > 1 && <button onClick={() => onUpdate({ items: block.items.filter((i) => i.id !== item.id) })} className="shrink-0 text-slate-600 hover:text-red-400">✕</button>}
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={100} value={item.value} onChange={(e) => updItem(item.id, 'value', Number(e.target.value))} className="flex-1" />
                <span className="w-8 text-right text-[10px] text-slate-400">{item.value}%</span>
                <input type="color" value={item.color || '#2D7DD2'} onChange={(e) => updItem(item.id, 'color', e.target.value)} className="h-6 w-8 cursor-pointer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Page Style Editor (Properties tab, no block selected) ─────────────────────

function PageStyleEditor({
  page, onUpdatePage, onApplyToAll,
}: {
  page: ReportPage
  onUpdatePage: (style: Partial<PageStyle>) => void
  onApplyToAll: (style: Partial<PageStyle>) => void
}) {
  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>
  const style = page.style ?? {}

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-3 py-2 text-[10px] text-[#C9A84C]">
        Page Background — <strong>{page.title}</strong>
      </div>

      <div>
        {label('Background Color')}
        <div className="flex gap-2">
          <input type="color" value={style.backgroundColor || '#ffffff'} onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })} className="h-8 w-12 cursor-pointer rounded" />
          <button onClick={() => onUpdatePage({ backgroundColor: undefined })} className="flex-1 rounded border border-white/10 py-1 text-[10px] text-slate-400 hover:bg-white/5">Reset</button>
        </div>
      </div>

      <div>
        {label('Background Pattern')}
        <select value={style.backgroundPattern || 'none'} onChange={(e) => onUpdatePage({ backgroundPattern: e.target.value as PageStyle['backgroundPattern'] })} className={inputCls}>
          {['none', 'grid', 'dots', 'diagonal'].map((p) => <option key={p} value={p} className="bg-[#1C1008]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      <div>
        {label('Background Image')}
        <ImageUploadField value={style.backgroundImage || ''} onChange={(url) => onUpdatePage({ backgroundImage: url || undefined })} placeholder="Image URL or upload" />
      </div>

      <div className="border-t border-white/10 pt-3">
        <button
          onClick={() => onApplyToAll({ backgroundColor: style.backgroundColor, backgroundPattern: style.backgroundPattern, backgroundImage: style.backgroundImage })}
          className="w-full rounded-lg border border-[#C9A84C]/40 py-2 text-xs font-semibold text-[#C9A84C] transition hover:bg-[#C9A84C]/10"
        >
          Apply This Background To All Pages
        </button>
      </div>
    </div>
  )
}

// ── Design Studio (unified Style tab) ────────────────────────────────────────

const QUICK_PRESETS = [
  { label: 'Corporate', packId: 'corporate-navy' },
  { label: 'Modern',    packId: 'modern-teal' },
  { label: 'Minimal',   packId: 'minimal-slate' },
  { label: 'Bold',      packId: 'bold-red' },
  { label: 'Luxury',    packId: 'elegant-gold' },
  { label: 'Pro Blue',  packId: 'professional-blue' },
]

function DesignStudioSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer items-center justify-between py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-white">
        {title}
        <svg className="h-3 w-3 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </summary>
      <div className="mt-2 flex flex-col gap-3 pb-3 border-b border-white/5">{children}</div>
    </details>
  )
}

function DesignStudio({ report, onUpdateReport }: { report: ReportData; onUpdateReport: (u: (p: ReportData) => ReportData) => void }) {
  const [packs, setPacks] = useState<DesignPack[]>(() => getAllDesignPacks())
  const [showPackBuilder, setShowPackBuilder] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [newPack, setNewPack] = useState<Omit<DesignPack, 'id'>>({
    name: 'My Custom Pack', primaryColor: '#1E3A5F', accentColor: '#2D7DD2',
    headingColor: '#1E3A5F', textColor: '#374151', tableHeaderBg: '#1E3A5F',
    tableHeaderText: '#FFFFFF', kpiAccent: '#2D7DD2', fontFamily: 'Inter',
  })
  const [branding, setBranding] = useState(() => report.branding ?? {})

  const inputCls = 'w-full rounded border border-white/10 bg-[#120B07] px-2 py-1.5 text-xs text-white outline-none focus:border-[#C9A84C]'
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>
  const Section = DesignStudioSection

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

  function applyBranding() {
    onUpdateReport((prev) => ({
      ...prev,
      branding,
      coverPage: {
        ...prev.coverPage,
        logoUrl: branding.logoUrl ?? prev.coverPage.logoUrl,
        companyName: branding.companyName ?? prev.coverPage.companyName,
        primaryColor: branding.primaryColor ?? prev.coverPage.primaryColor,
      },
      headerFooter: {
        ...prev.headerFooter,
        headerLeft: branding.companyName ?? prev.headerFooter.headerLeft,
      },
    }))
  }

  const upHF = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, headerFooter: { ...p.headerFooter, [field]: val } }))
  const upWm = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, watermark: { ...p.watermark, [field]: val } }))
  const up = (field: string, val: unknown) => onUpdateReport((p) => ({ ...p, [field]: val }))

  return (
    <div className="flex flex-col gap-1">
      {/* Basic / Advanced toggle */}
      <div className="flex items-center justify-between py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Style</span>
        <button
          onClick={() => setAdvanced((v) => !v)}
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${advanced ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-white/10 text-slate-400 hover:bg-white/15'}`}
        >
          {advanced ? 'Advanced' : 'Basic'}
        </button>
      </div>

      {/* Quick Presets */}
      <Section title="Quick Presets">
        <div className="grid grid-cols-3 gap-1">
          {QUICK_PRESETS.map(({ label: lbl, packId }) => {
            const pack = DESIGN_PACKS.find((p) => p.id === packId)
            if (!pack) return null
            const active = report.designPackId === packId
            return (
              <button
                key={packId}
                onClick={() => onUpdateReport((p) => ({ ...p, designPackId: packId }))}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${active ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex gap-0.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: pack.primaryColor }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: pack.accentColor }} />
                </div>
                {lbl}
              </button>
            )
          })}
        </div>
      </Section>

      {/* Theme */}
      <Section title="Theme">
        <div className="flex flex-col gap-1">
          {packs.map((pack) => {
            const isCustom = !DESIGN_PACKS.find((d) => d.id === pack.id)
            return (
              <div key={pack.id} className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateReport((p) => ({ ...p, designPackId: pack.id }))}
                  className={`flex flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${report.designPackId === pack.id ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full" style={{ background: pack.primaryColor }} />
                    <div className="h-3 w-3 rounded-full" style={{ background: pack.accentColor }} />
                    <div className="h-3 w-3 rounded-full border border-white/10" style={{ background: pack.textColor }} />
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

        {/* Custom theme builder — always accessible */}
        <button
          onClick={() => setShowPackBuilder((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 py-2 text-xs text-slate-500 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition"
        >
          {showPackBuilder ? '✕ Close Builder' : '+ Create Custom Theme'}
        </button>
        {showPackBuilder && (
          <div className="rounded-lg border border-white/10 bg-[#120B07] p-3 flex flex-col gap-2.5">
            <input value={newPack.name} onChange={(e) => setNewPack((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Theme name" />

            {/* Layout colors */}
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Layout Colors</p>
            {([
              { key: 'primaryColor',    lbl: 'Primary' },
              { key: 'accentColor',     lbl: 'Accent' },
              { key: 'tableHeaderBg',   lbl: 'Table Header Bg' },
              { key: 'kpiAccent',       lbl: 'KPI Accent' },
            ] as const).map(({ key, lbl }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">{lbl}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-600">{newPack[key]}</span>
                  <input type="color" value={newPack[key]} onChange={(e) => setNewPack((p) => ({ ...p, [key]: e.target.value }))} className="h-7 w-10 cursor-pointer rounded border border-white/10" />
                </div>
              </div>
            ))}

            {/* Font colors */}
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">Font Colors</p>
            {([
              { key: 'headingColor',    lbl: 'Headings' },
              { key: 'textColor',       lbl: 'Body Text' },
              { key: 'tableHeaderText', lbl: 'Table Header Text' },
            ] as const).map(({ key, lbl }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">{lbl}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-600">{newPack[key]}</span>
                  <input type="color" value={newPack[key]} onChange={(e) => setNewPack((p) => ({ ...p, [key]: e.target.value }))} className="h-7 w-10 cursor-pointer rounded border border-white/10" />
                </div>
              </div>
            ))}

            {/* Font family */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Font</span>
              <select value={newPack.fontFamily} onChange={(e) => setNewPack((p) => ({ ...p, fontFamily: e.target.value }))} className="w-32 rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none">
                {['Inter', 'Georgia', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display'].map((f) => <option key={f} value={f} className="bg-[#1C1008]">{f}</option>)}
              </select>
            </div>

            {/* Live preview */}
            <div className="rounded border border-white/10 p-2.5 flex flex-col gap-1.5" style={{ fontFamily: newPack.fontFamily }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-600 mb-0.5">Preview</p>
              <p style={{ color: newPack.headingColor, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Heading Text</p>
              <p style={{ color: newPack.textColor, fontSize: 10 }}>Body paragraph text sample</p>
              <div className="flex gap-1.5 mt-1">
                <div className="flex-1 rounded px-2 py-1 text-center text-[10px]" style={{ background: newPack.primaryColor, color: '#fff' }}>Primary</div>
                <div className="flex-1 rounded px-2 py-1 text-center text-[10px]" style={{ background: newPack.accentColor, color: '#fff' }}>Accent</div>
              </div>
              <div className="rounded px-2 py-1 text-[10px] mt-0.5" style={{ background: newPack.tableHeaderBg, color: newPack.tableHeaderText }}>Table Header</div>
            </div>

            <button onClick={saveCustomPack} className="w-full rounded-lg py-1.5 text-xs font-semibold text-white transition hover:brightness-110" style={{ background: '#C9A84C' }}>
              Save Theme
            </button>
          </div>
        )}
      </Section>

      {/* Font Colors — per-document overrides applied on top of the active theme */}
      <Section title="Font Colors">
        <p className="text-[9px] text-slate-600 leading-relaxed">Override specific colors from the active theme without creating a new one. Changes apply instantly to the whole document.</p>
        {([
          { key: 'headingColor',    lbl: 'Headings',          placeholder: 'Theme default' },
          { key: 'textColor',       lbl: 'Body Text',          placeholder: 'Theme default' },
          { key: 'accentColor',     lbl: 'Accent',             placeholder: 'Theme default' },
          { key: 'primaryColor',    lbl: 'Primary',            placeholder: 'Theme default' },
          { key: 'tableHeaderBg',   lbl: 'Table Header Bg',   placeholder: 'Theme default' },
          { key: 'tableHeaderText', lbl: 'Table Header Text', placeholder: 'Theme default' },
        ] as const).map(({ key, lbl }) => {
          const basePack = getDesignPack(report.designPackId)
          const overrideVal = report.colorOverrides?.[key]
          const activeVal = overrideVal || (basePack[key as keyof DesignPack] as string) || '#000000'
          const isOverridden = !!overrideVal
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-[10px] ${isOverridden ? 'text-[#C9A84C]' : 'text-slate-400'}`}>{lbl}</span>
                {isOverridden && (
                  <button
                    onClick={() => onUpdateReport((p) => {
                      const next = { ...(p.colorOverrides ?? {}) }
                      delete next[key]
                      return { ...p, colorOverrides: next }
                    })}
                    title="Reset to theme default"
                    className="text-[8px] text-slate-600 hover:text-red-400 transition"
                  >↺</button>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-slate-600">{activeVal}</span>
                <input
                  type="color"
                  value={activeVal}
                  onChange={(e) => onUpdateReport((p) => ({ ...p, colorOverrides: { ...(p.colorOverrides ?? {}), [key]: e.target.value } }))}
                  className="h-7 w-10 cursor-pointer rounded border border-white/10"
                />
              </div>
            </div>
          )
        })}
        {/* Font family override */}
        {(() => {
          const basePack = getDesignPack(report.designPackId)
          const isOverridden = !!report.colorOverrides?.fontFamily
          return (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] ${isOverridden ? 'text-[#C9A84C]' : 'text-slate-400'}`}>Font Family</span>
                {isOverridden && (
                  <button
                    onClick={() => onUpdateReport((p) => {
                      const next = { ...(p.colorOverrides ?? {}) }
                      delete next.fontFamily
                      return { ...p, colorOverrides: next }
                    })}
                    title="Reset to theme default"
                    className="text-[8px] text-slate-600 hover:text-red-400 transition"
                  >↺</button>
                )}
              </div>
              <select
                value={report.colorOverrides?.fontFamily || basePack.fontFamily}
                onChange={(e) => onUpdateReport((p) => ({ ...p, colorOverrides: { ...(p.colorOverrides ?? {}), fontFamily: e.target.value } }))}
                className="w-32 rounded border border-white/10 bg-[#120B07] px-1.5 py-1 text-xs text-white outline-none"
              >
                {['Inter', 'Georgia', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display'].map((f) => <option key={f} value={f} className="bg-[#1C1008]">{f}</option>)}
              </select>
            </div>
          )
        })()}
        {/* Reset all overrides */}
        {report.colorOverrides && Object.keys(report.colorOverrides).length > 0 && (
          <button
            onClick={() => onUpdateReport((p) => ({ ...p, colorOverrides: {} }))}
            className="w-full rounded border border-white/10 py-1.5 text-[10px] text-slate-500 hover:border-red-400/40 hover:text-red-400 transition"
          >
            ↺ Reset all to theme defaults
          </button>
        )}
      </Section>

      {/* Branding */}
      <Section title="Branding">
        <div>
          {label('Company Name')}
          <input value={branding.companyName || ''} onChange={(e) => setBranding((b) => ({ ...b, companyName: e.target.value }))} className={inputCls} placeholder="Acme Corp" />
        </div>
        <div>
          {label('Logo')}
          <ImageUploadField value={branding.logoUrl || ''} onChange={(url) => setBranding((b) => ({ ...b, logoUrl: url }))} placeholder="Logo URL or upload" />
        </div>
        {advanced && (
          <>
            <div>
              {label('Brand Primary Color')}
              <input type="color" value={branding.primaryColor || '#1E3A5F'} onChange={(e) => setBranding((b) => ({ ...b, primaryColor: e.target.value }))} className="h-8 w-full cursor-pointer rounded" />
            </div>
            <div>
              {label('Brand Font')}
              <select value={branding.fontFamily || 'Inter'} onChange={(e) => setBranding((b) => ({ ...b, fontFamily: e.target.value }))} className={inputCls}>
                {['Inter', 'Georgia', 'Roboto', 'Open Sans', 'Montserrat', 'Playfair Display'].map((f) => <option key={f} value={f} className="bg-[#1C1008]">{f}</option>)}
              </select>
            </div>
          </>
        )}
        <button onClick={applyBranding} className="w-full rounded-lg border border-[#C9A84C]/40 py-2 text-xs font-semibold text-[#C9A84C] transition hover:bg-[#C9A84C]/10">
          Apply Branding to Document
        </button>
      </Section>

      {/* Header & Footer */}
      <Section title="Header & Footer">
        {/* Header */}
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={report.headerFooter.showHeader} onChange={(e) => upHF('showHeader', e.target.checked)} />
          Show header
        </label>
        {report.headerFooter.showHeader && (
          <>
            <input value={report.headerFooter.headerLeft} onChange={(e) => upHF('headerLeft', e.target.value)} className={inputCls} placeholder="Header left text" />
            <input value={report.headerFooter.headerRight} onChange={(e) => upHF('headerRight', e.target.value)} className={inputCls} placeholder="Header right text" />
            <div>
              <label className="mb-1 block text-[10px] text-slate-500">Header Style</label>
              <div className="grid grid-cols-3 gap-1">
                {(['line', 'band', 'double', 'gradient', 'accent-band', 'minimal'] as const).map((s) => (
                  <button key={s} onClick={() => upHF('headerStyle', s)}
                    className={`rounded border py-1 text-[10px] capitalize transition ${(report.headerFooter.headerStyle || 'line') === s ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-slate-500">Header Color</label>
                <input type="color" value={report.headerFooter.headerBg || '#1E3A5F'} onChange={(e) => upHF('headerBg', e.target.value)} className="h-7 w-full cursor-pointer rounded" />
              </div>
            </div>
          </>
        )}

        {/* Footer */}
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
            <div>
              <label className="mb-1 block text-[10px] text-slate-500">Footer Style</label>
              <div className="grid grid-cols-3 gap-1">
                {(['line', 'band', 'double', 'gradient', 'accent-band', 'minimal'] as const).map((s) => (
                  <button key={s} onClick={() => upHF('footerStyle', s)}
                    className={`rounded border py-1 text-[10px] capitalize transition ${(report.headerFooter.footerStyle || 'line') === s ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-slate-500">Footer Color</label>
                <input type="color" value={report.headerFooter.footerBg || '#1E3A5F'} onChange={(e) => upHF('footerBg', e.target.value)} className="h-7 w-full cursor-pointer rounded" />
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Watermark */}
      <Section title="Watermark">
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={report.watermark.enabled} onChange={(e) => upWm('enabled', e.target.checked)} />
          Enable watermark (all pages)
        </label>
        {report.watermark.enabled && (
          <>
            {/* Text */}
            <div>
              {label('Text')}
              <div className="flex gap-2">
                <input
                  value={report.watermark.text}
                  onChange={(e) => upWm('text', e.target.value)}
                  className={`${inputCls} flex-1 ${report.watermark.imageUrl ? 'opacity-40' : ''}`}
                  placeholder="CONFIDENTIAL"
                />
                <input type="color" value={report.watermark.color || '#888888'} onChange={(e) => upWm('color', e.target.value)} className="h-[30px] w-9 cursor-pointer rounded border border-white/10" title="Text color" />
              </div>
            </div>
            {/* Image */}
            <div>
              {label('Image (overrides text)')}
              <ImageUploadField value={report.watermark.imageUrl || ''} onChange={(url) => upWm('imageUrl', url)} placeholder="Upload or paste image URL" />
              {report.watermark.imageUrl && (
                <button onClick={() => upWm('imageUrl', '')} className="mt-1 text-[9px] text-slate-500 hover:text-red-400 transition">✕ Remove image</button>
              )}
            </div>
            {/* Angle toggle */}
            <div>
              {label('Angle')}
              <div className="flex gap-1">
                <button
                  onClick={() => upWm('rotation', 0)}
                  className={`flex-1 rounded border py-1.5 text-[10px] font-medium transition ${report.watermark.rotation === 0 ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'}`}
                >
                  — Straight
                </button>
                <button
                  onClick={() => { if (report.watermark.rotation === 0) upWm('rotation', -45) }}
                  className={`flex-1 rounded border py-1.5 text-[10px] font-medium transition ${report.watermark.rotation !== 0 ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'}`}
                >
                  ⟋ Diagonal
                </button>
              </div>
            </div>
            {/* Opacity */}
            <div>
              {label(`Opacity: ${Math.round(report.watermark.opacity * 100)}%`)}
              <input type="range" min={0.03} max={0.4} step={0.01} value={report.watermark.opacity} onChange={(e) => upWm('opacity', Number(e.target.value))} className="w-full" />
            </div>
            {/* Page selection */}
            <div>
              {label('Apply to pages')}
              <div className="flex flex-col gap-1 mt-1">
                {report.coverPage.enabled && (
                  <label className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-white/5 transition">
                    <input
                      type="checkbox"
                      checked={!report.watermark.excludeCover}
                      onChange={(e) => upWm('excludeCover', !e.target.checked)}
                      className="accent-[#C9A84C]"
                    />
                    <span className="text-[10px] text-slate-400">Cover Page</span>
                  </label>
                )}
                {report.pages.map((page, idx) => (
                  <label key={page.id} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-white/5 transition">
                    <input
                      type="checkbox"
                      checked={!page.noWatermark}
                      onChange={(e) => onUpdateReport((p) => ({
                        ...p,
                        pages: p.pages.map((pg) => pg.id === page.id ? { ...pg, noWatermark: !e.target.checked } : pg),
                      }))}
                      className="accent-[#C9A84C]"
                    />
                    <span className="text-[10px] text-slate-400 truncate">
                      <span className="text-slate-600">P{idx + 1} </span>{page.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Fine rotation in advanced mode */}
            {advanced && (
              <div>
                {label(`Fine rotation: ${report.watermark.rotation}°`)}
                <input type="range" min={-90} max={90} value={report.watermark.rotation} onChange={(e) => upWm('rotation', Number(e.target.value))} className="w-full" />
              </div>
            )}
          </>
        )}
      </Section>

      {/* Cover Page */}
      <Section title="Cover Page">
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={report.coverPage.enabled} onChange={(e) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, enabled: e.target.checked } }))} />
          Enable cover page
        </label>
        {report.coverPage.enabled && (
          <>
            <input value={report.coverPage.reportTitle} onChange={(e) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, reportTitle: e.target.value } }))} className={inputCls} placeholder="Report Title" />
            <input value={report.coverPage.date} onChange={(e) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, date: e.target.value } }))} className={inputCls} placeholder="Date" />
            {advanced && (
              <>
                <label className="text-[10px] text-slate-500">Background Color</label>
                <input type="color" value={report.coverPage.primaryColor} onChange={(e) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, primaryColor: e.target.value } }))} className="h-8 w-full cursor-pointer rounded" />
                <select value={report.coverPage.pattern} onChange={(e) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, pattern: e.target.value as 'none'|'grid'|'dots'|'diagonal' } }))} className={inputCls}>
                  {['none', 'grid', 'dots', 'diagonal'].map((pat) => <option key={pat} value={pat} className="bg-[#1C1008]">{pat.charAt(0).toUpperCase() + pat.slice(1)}</option>)}
                </select>
                <ImageUploadField value={report.coverPage.logoUrl} onChange={(url) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, logoUrl: url } }))} placeholder="Logo" />
                {report.coverPage.logoUrl && (
                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">Logo Position</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['tl', 'tc', 'tr', 'bl', 'bc', 'br'] as const).map((pos) => {
                        const labels: Record<string, string> = { tl: '↖ TL', tc: '↑ TC', tr: '↗ TR', bl: '↙ BL', bc: '↓ BC', br: '↘ BR' }
                        return (
                          <button key={pos} onClick={() => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, logoPosition: pos } }))}
                            className={`rounded border py-1 text-[10px] transition ${(report.coverPage.logoPosition || 'tl') === pos ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300'}`}>
                            {labels[pos]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                <ImageUploadField value={report.coverPage.backgroundImageUrl} onChange={(url) => onUpdateReport((p) => ({ ...p, coverPage: { ...p.coverPage, backgroundImageUrl: url } }))} placeholder="Background image" />
              </>
            )}
          </>
        )}
      </Section>

      {/* Document Settings */}
      <Section title="Document">
        <div>
          {label('Page Size')}
          <select value={report.pageSize} onChange={(e) => up('pageSize', e.target.value)} className={inputCls}>
            <option value="A4" className="bg-[#1C1008]">A4 (210 × 297 mm)</option>
            <option value="Letter" className="bg-[#1C1008]">Letter (8.5 × 11 in)</option>
          </select>
        </div>
        {advanced && (
          <div>
            {label('Document Type')}
            <select value={report.documentType} onChange={(e) => up('documentType', e.target.value)} className={inputCls}>
              {DOCUMENT_TYPES.map(({ id, label: lbl }) => <option key={id} value={id} className="bg-[#1C1008]">{lbl}</option>)}
            </select>
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Design Panel (legacy — kept for reference, replaced by DesignStudio) ─────

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
              <input value={report.coverPage.date} onChange={(e) => upCover('date', e.target.value)} className={inputCls} placeholder="Date" />
              <label className="text-[10px] text-slate-500">Background Color</label>
              <input type="color" value={report.coverPage.primaryColor} onChange={(e) => upCover('primaryColor', e.target.value)} className="h-8 w-full cursor-pointer rounded" />
              <select value={report.coverPage.pattern} onChange={(e) => upCover('pattern', e.target.value)} className={inputCls}>
                {['none', 'grid', 'dots', 'diagonal'].map((p) => <option key={p} value={p} className="bg-[#1C1008]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <label className="text-[10px] text-slate-500">Logo Image</label>
              <ImageUploadField value={report.coverPage.logoUrl} onChange={(url) => upCover('logoUrl', url)} placeholder="Logo URL or upload" />
              {report.coverPage.logoUrl && (
                <div>
                  <label className="mb-1 block text-[10px] text-slate-500">Logo Position</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['tl', 'tc', 'tr', 'bl', 'bc', 'br'] as const).map((pos) => {
                      const labels: Record<string, string> = { tl: '↖ TL', tc: '↑ TC', tr: '↗ TR', bl: '↙ BL', bc: '↓ BC', br: '↘ BR' }
                      return (
                        <button key={pos} onClick={() => upCover('logoPosition', pos)}
                          className={`rounded border py-1 text-[10px] transition ${(report.coverPage.logoPosition || 'tl') === pos ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300'}`}>
                          {labels[pos]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <label className="text-[10px] text-slate-500">Background Image</label>
              <ImageUploadField value={report.coverPage.backgroundImageUrl} onChange={(url) => upCover('backgroundImageUrl', url)} placeholder="Background image URL or upload" />
            </>
          )}
        </div>
      </details>

      {/* Header & Footer */}
      <details>
        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wide text-slate-500">Header & Footer</summary>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={report.headerFooter.showHeader} onChange={(e) => upHF('showHeader', e.target.checked)} />
            Show header
          </label>
          {report.headerFooter.showHeader && (
            <>
              <input value={report.headerFooter.headerLeft} onChange={(e) => upHF('headerLeft', e.target.value)} className={inputCls} placeholder="Header left text" />
              <input value={report.headerFooter.headerRight} onChange={(e) => upHF('headerRight', e.target.value)} className={inputCls} placeholder="Header right text" />
              <div>
                <label className="mb-1 block text-[10px] text-slate-500">Header Style</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['line', 'band', 'double', 'gradient', 'accent-band', 'minimal'] as const).map((s) => (
                    <button key={s} onClick={() => upHF('headerStyle', s)}
                      className={`rounded border py-1 text-[10px] capitalize transition ${(report.headerFooter.headerStyle || 'line') === s ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <input type="color" value={report.headerFooter.headerBg || '#1E3A5F'} onChange={(e) => upHF('headerBg', e.target.value)} className="h-7 w-full cursor-pointer rounded" title="Header color" />
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
              <div>
                <label className="mb-1 block text-[10px] text-slate-500">Footer Style</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['line', 'band', 'double', 'gradient', 'accent-band', 'minimal'] as const).map((s) => (
                    <button key={s} onClick={() => upHF('footerStyle', s)}
                      className={`rounded border py-1 text-[10px] capitalize transition ${(report.headerFooter.footerStyle || 'line') === s ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-500 hover:border-white/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <input type="color" value={report.headerFooter.footerBg || '#1E3A5F'} onChange={(e) => upHF('footerBg', e.target.value)} className="h-7 w-full cursor-pointer rounded" title="Footer color" />
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
              <label className="text-[10px] text-slate-500">Text</label>
              <div className="flex gap-2">
                <input value={report.watermark.text} onChange={(e) => upWm('text', e.target.value)} className={`${inputCls} flex-1 ${report.watermark.imageUrl ? 'opacity-40' : ''}`} placeholder="CONFIDENTIAL" />
                <input type="color" value={report.watermark.color || '#888888'} onChange={(e) => upWm('color', e.target.value)} className="h-[30px] w-9 cursor-pointer rounded border border-white/10" title="Text color" />
              </div>
              <label className="text-[10px] text-slate-500">Image (overrides text)</label>
              <ImageUploadField value={report.watermark.imageUrl || ''} onChange={(url) => upWm('imageUrl', url)} placeholder="Upload or paste image URL" />
              {report.watermark.imageUrl && (
                <button onClick={() => upWm('imageUrl', '')} className="text-[9px] text-slate-500 hover:text-red-400 transition">✕ Remove image</button>
              )}
              <label className="text-[10px] text-slate-500">Angle</label>
              <div className="flex gap-1">
                <button
                  onClick={() => upWm('rotation', 0)}
                  className={`flex-1 rounded border py-1 text-[10px] font-medium transition ${report.watermark.rotation === 0 ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'}`}
                >
                  — Straight
                </button>
                <button
                  onClick={() => { if (report.watermark.rotation === 0) upWm('rotation', -45) }}
                  className={`flex-1 rounded border py-1 text-[10px] font-medium transition ${report.watermark.rotation !== 0 ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200'}`}
                >
                  ⟋ Diagonal
                </button>
              </div>
              <label className="text-[10px] text-slate-500">Opacity: {Math.round(report.watermark.opacity * 100)}%</label>
              <input type="range" min={0.03} max={0.4} step={0.01} value={report.watermark.opacity} onChange={(e) => upWm('opacity', Number(e.target.value))} className="w-full" />
              <label className="text-[10px] text-slate-500">Fine rotation: {report.watermark.rotation}°</label>
              <input type="range" min={-90} max={90} value={report.watermark.rotation} onChange={(e) => upWm('rotation', Number(e.target.value))} className="w-full" />
              <label className="text-[10px] text-slate-500">Apply to pages</label>
              <div className="flex flex-col gap-0.5">
                {report.coverPage.enabled && (
                  <label className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-white/5">
                    <input type="checkbox" checked={!report.watermark.excludeCover} onChange={(e) => upWm('excludeCover', !e.target.checked)} className="accent-[#C9A84C]" />
                    <span className="text-[10px] text-slate-400">Cover Page</span>
                  </label>
                )}
                {report.pages.map((page, idx) => (
                  <label key={page.id} className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={!page.noWatermark}
                      onChange={(e) => onUpdateReport((p) => ({
                        ...p,
                        pages: p.pages.map((pg) => pg.id === page.id ? { ...pg, noWatermark: !e.target.checked } : pg),
                      }))}
                      className="accent-[#C9A84C]"
                    />
                    <span className="text-[10px] text-slate-400 truncate"><span className="text-slate-600">P{idx + 1} </span>{page.title}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </details>
    </div>
  )
}

// ── Print View (hidden, PDF target) ────────────────────────────────────────

function PrintView({ report, dp }: { report: ReportData; dp: DesignPack }) {
  const pageW = report.pageSize === 'A4' ? '210mm' : '215.9mm'
  const pageH = report.pageSize === 'A4' ? '297mm' : '279.4mm'

  // Outer div: keeps position:relative for shapes + watermark, and minHeight for the absolute-positioned footer
  const PAGE_DIV: React.CSSProperties = {
    width: pageW,
    minHeight: pageH,
    background: '#FFFFFF',
    position: 'relative',
    boxSizing: 'border-box',
    fontFamily: dp.fontFamily,
  }

  return (
    <div>
      {/* Cover page */}
      {report.coverPage.enabled && (() => {
        const cpBg = report.coverPage.primaryColor || dp.primaryColor
        const cpBgHex = cpBg.replace('#', '')
        const cpIsLight = cpBgHex.length >= 6 && (() => {
          const r = parseInt(cpBgHex.slice(0, 2), 16), g = parseInt(cpBgHex.slice(2, 4), 16), b = parseInt(cpBgHex.slice(4, 6), 16)
          return (r * 299 + g * 587 + b * 114) / 1000 > 140
        })()
        const cpFg = report.coverPage.textColor || (cpIsLight ? '#1E293B' : '#FFFFFF')
        const logoPos = report.coverPage.logoPosition || 'tl'
        const logoStyle: React.CSSProperties = {
          position: 'absolute',
          maxHeight: '48px', maxWidth: '140px', objectFit: 'contain',
          ...(logoPos === 'tc' ? { top: '16mm', left: '50%', transform: 'translateX(-50%)' } :
             logoPos === 'tr' ? { top: '16mm', right: '16mm' } :
             logoPos === 'bl' ? { bottom: '16mm', left: '16mm' } :
             logoPos === 'bc' ? { bottom: '16mm', left: '50%', transform: 'translateX(-50%)' } :
             logoPos === 'br' ? { bottom: '16mm', right: '16mm' } :
             { top: '16mm', left: '16mm' }),
        }
        return (
          <div style={{ ...PAGE_DIV, background: cpBg, padding: '40mm 20mm 20mm', position: 'relative', overflow: 'hidden' }}>
            {report.coverPage.backgroundImageUrl && (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${report.coverPage.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            {report.coverPage.backgroundImageUrl && (
              <div style={{ position: 'absolute', inset: 0, background: `${cpBg}CC` }} />
            )}
            {/* Logo — positioned relative to the page div so position is consistent with canvas */}
            {report.coverPage.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={report.coverPage.logoUrl} alt="Logo" style={logoStyle} />
            )}
            <div style={{ position: 'relative', zIndex: 1, color: cpFg, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              {(report.coverPage.coverBlocks ?? []).map((b) => (
                <div key={b.id} style={{ marginTop: '8pt' }}>{renderPrintBlock(b, { ...dp, textColor: cpFg, headingColor: cpFg })}</div>
              ))}
            </div>
            {report.watermark.enabled && !report.watermark.excludeCover && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: report.watermark.opacity, transform: `rotate(${report.watermark.rotation}deg)` }}>
                {report.watermark.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={report.watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '48pt', fontWeight: 900, color: report.watermark.color || '#ffffff', letterSpacing: '8px' }}>{report.watermark.text}</span>
                }
              </div>
            )}
          </div>
        )
      })()}

      {report.pages.map((page, pageIdx) => {
        const showHeader = report.headerFooter.showHeader
        const showFooter = report.headerFooter.showFooter
        return (
          <div
            key={page.id}
            style={{
              ...PAGE_DIV,
              pageBreakBefore: pageIdx === 0 && !report.coverPage.enabled ? 'avoid' : 'always',
            }}
          >
            {/* Shapes — absolute relative to this div */}
            {(page.shapes || []).sort((a, b) => a.zIndex - b.zIndex).map((shape) => (
              <div key={shape.id} style={{ position: 'absolute', left: `${shape.x}%`, top: `${shape.y}%`, width: `${shape.width}%`, height: `${shape.height}%`, opacity: shape.opacity, transform: `rotate(${shape.rotation}deg)`, transformOrigin: 'center', zIndex: shape.zIndex }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                  {getShapeElement(shape)}
                </svg>
              </div>
            ))}

            {/* Watermark */}
            {report.watermark.enabled && !page.noWatermark && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: report.watermark.opacity, transform: `rotate(${report.watermark.rotation}deg)` }}>
                {report.watermark.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={report.watermark.imageUrl} alt="watermark" style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '48pt', fontWeight: 900, color: report.watermark.color || '#888', letterSpacing: '8px' }}>{report.watermark.text}</span>
                }
              </div>
            )}

            {/* Table — browser repeats <thead> at the top and <tfoot> at the bottom of every
                physical page when the table spans multiple pages.
                paddingBottom on <th> = gap after header; paddingTop on tfoot <td> = gap before footer. */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', position: 'relative', zIndex: 1 }}>
              {showHeader && (
                <thead>
                  <tr>
                    <th style={{ padding: 0, paddingBottom: '8mm', fontWeight: 'normal', textAlign: 'left' }}>
                      {renderHeaderBand(report.headerFooter, dp, true)}
                    </th>
                  </tr>
                </thead>
              )}
              {showFooter && (
                <tfoot>
                  <tr>
                    <td style={{ padding: 0, paddingTop: '8mm' }}>
                      {renderFooterBand(report.headerFooter, dp, pageIdx + 1, true)}
                    </td>
                  </tr>
                </tfoot>
              )}
              <tbody>
                <tr>
                  <td style={{
                    padding: '20mm',
                    paddingTop: showHeader ? '0' : '20mm',
                    paddingBottom: showFooter ? '0' : '20mm',
                    verticalAlign: 'top',
                  }}>
                    {page.blocks.map((block) => {
                      const canBreak = block.type === 'table' && (block as TableBlock).allowBreak
                      return (
                        <div key={block.id} style={{
                          marginBottom: '12pt',
                          breakInside: canBreak ? 'auto' : 'avoid',
                          pageBreakInside: canBreak ? 'auto' : 'avoid',
                        }}>
                          {renderPrintBlock(block, dp, report)}
                        </div>
                      )
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function renderPrintBlock(block: ReportBlock, dp: DesignPack, report?: ReportData): React.ReactNode {
  switch (block.type) {
    case 'heading': {
      const defaultSizes: Record<number, string> = { 1: '20pt', 2: '15pt', 3: '12pt' }
      const defaultWeights: Record<number, number> = { 1: 700, 2: 600, 3: 600 }
      const margins: Record<number, string> = { 1: '12pt', 2: '8pt', 3: '6pt' }
      return (
        <div style={{
          fontSize: block.fontSize ? `${block.fontSize}pt` : defaultSizes[block.level],
          fontWeight: block.bold !== undefined ? (block.bold ? 700 : 400) : defaultWeights[block.level],
          fontStyle: block.italic ? 'italic' : 'normal',
          color: block.color || dp.headingColor,
          backgroundColor: block.bgColor,
          marginBottom: margins[block.level],
          textAlign: block.align,
          fontFamily: dp.fontFamily,
          lineHeight: 1.2,
        }}>
          {block.content}
        </div>
      )
    }
    case 'text':
      return (
        <div style={{
          fontSize: (block as { fontSize?: number }).fontSize ? `${(block as { fontSize?: number }).fontSize}pt` : '10pt',
          fontWeight: (block as { bold?: boolean }).bold ? 700 : 400,
          fontStyle: (block as { italic?: boolean }).italic ? 'italic' : 'normal',
          color: (block as { color?: string }).color || dp.textColor,
          backgroundColor: (block as { bgColor?: string }).bgColor,
          lineHeight: 1.6,
          textAlign: block.align,
          whiteSpace: 'pre-wrap',
          fontFamily: dp.fontFamily,
        }}>
          {block.content}
        </div>
      )
    case 'table': {
      const hBg = block.headerBg || dp.tableHeaderBg
      const hTxt = block.headerText || dp.tableHeaderText
      const brd = block.borders
      const numCols = block.headers.length
      const totalRows = 1 + block.rows.length
      const globalPrintBrd = (absRow: number, ci: number): React.CSSProperties => {
        if (brd) return computeTableCellBorders(brd, absRow === 0, absRow === totalRows - 1, ci === 0, ci === numCols - 1)
        const b = block.bordered ? '1px solid #ccc' : 'none'
        return { borderTop: b, borderBottom: b, borderLeft: b, borderRight: b }
      }
      const printCellBrd = (absRow: number, ci: number, cell?: TableCell): React.CSSProperties => {
        const g = globalPrintBrd(absRow, ci)
        const sb = cell?.sideBorders
        if (!sb) return g
        return {
          borderTop:    sb.top    !== undefined ? sb.top    : g.borderTop,
          borderBottom: sb.bottom !== undefined ? sb.bottom : g.borderBottom,
          borderLeft:   sb.left   !== undefined ? sb.left   : g.borderLeft,
          borderRight:  sb.right  !== undefined ? sb.right  : g.borderRight,
        }
      }
      const printSpanMap = buildSpanMap(block.rows)
      return (
        <div>
          {block.caption && <p style={{ fontSize: '8pt', color: '#666', fontStyle: 'italic', marginBottom: '4pt' }}>{block.caption}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', fontFamily: dp.fontFamily, tableLayout: 'fixed', wordBreak: 'break-word' }}>
            {block.colWidths && (
              <colgroup>
                {block.colWidths.map((w, ci) => <col key={ci} style={{ width: w }} />)}
              </colgroup>
            )}
            <thead>
              <tr>
                {block.headers.map((h, ci) => (
                  <th key={ci} style={{ padding: '4pt 6pt', textAlign: 'left', background: hBg, color: hTxt, fontSize: '8pt', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', overflowWrap: 'break-word', ...printCellBrd(0, ci) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} style={{ background: block.striped && rIdx % 2 === 1 ? '#F8FAFC' : 'white', breakInside: 'avoid', pageBreakInside: 'avoid', height: block.rowHeights?.[rIdx] }}>
                  {row.map((cell, cIdx) => {
                    if (printSpanMap.has(`${rIdx},${cIdx}`)) return null
                    const cs = cell.colspan ?? 1
                    const rs = cell.rowspan ?? 1
                    return (
                      <td key={cIdx}
                        colSpan={cs > 1 ? cs : undefined}
                        rowSpan={rs > 1 ? rs : undefined}
                        style={{
                          textAlign: cell.align,
                          fontWeight: cell.bold ? 600 : 400,
                          fontStyle: cell.italic ? 'italic' : 'normal',
                          textDecoration: cell.underline ? 'underline' : 'none',
                          color: cell.color || dp.textColor,
                          background: cell.bgColor || 'transparent',
                          paddingTop: '3pt', paddingBottom: '3pt',
                          paddingLeft: `${((cell.indentLevel || 0) * 12) + 6}pt`,
                          paddingRight: '6pt',
                          overflowWrap: 'break-word',
                          ...printCellBrd(1 + rIdx, cIdx, cell),
                        }}>{formatCellContent(cell)}</td>
                    )
                  })}
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
    case 'image': {
      const imgWidths: Record<string, string> = { full: '100%', large: '75%', medium: '50%', small: '25%' }
      return block.url ? (
        <div style={{ textAlign: block.align, backgroundColor: block.bgColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} style={{ width: imgWidths[block.width] ?? '100%', height: 'auto', borderRadius: '3pt' }} />
          {block.caption && <p style={{ fontSize: '8pt', color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: '4pt' }}>{block.caption}</p>}
        </div>
      ) : null
    }
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
    case 'callout': {
      const cb = block as CalloutBlock
      const variantPrint: Record<string, { border: string; bg: string; text: string }> = {
        info:    { border: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF' },
        warning: { border: '#F59E0B', bg: '#FFFBEB', text: '#92400E' },
        success: { border: '#10B981', bg: '#ECFDF5', text: '#065F46' },
        danger:  { border: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
      }
      const vs = variantPrint[cb.variant] ?? variantPrint.info
      return (
        <div style={{
          borderLeft: `4px solid ${vs.border}`,
          background: cb.bgColor || vs.bg,
          color: vs.text,
          padding: '8pt 12pt',
          borderRadius: '4pt',
          fontSize: cb.fontSize ? `${cb.fontSize}pt` : '10pt',
          fontWeight: cb.bold ? 700 : undefined,
          fontStyle: cb.italic ? 'italic' : undefined,
          fontFamily: dp.fontFamily,
          lineHeight: 1.5,
        }}>
          {cb.content}
        </div>
      )
    }
    case 'quote': {
      const qb = block as QuoteBlock
      return (
        <div style={{ borderLeft: `4px solid ${dp.accentColor}`, paddingLeft: '12pt', fontFamily: dp.fontFamily, margin: '6pt 0', background: qb.bgColor, borderRadius: qb.bgColor ? '4pt' : undefined, padding: qb.bgColor ? '8pt 12pt' : undefined }}>
          <p style={{
            fontStyle: qb.italic !== undefined ? (qb.italic ? 'italic' : 'normal') : 'italic',
            fontSize: qb.fontSize ? `${qb.fontSize}pt` : '12pt',
            fontWeight: qb.bold ? 700 : undefined,
            color: qb.color || dp.textColor,
            lineHeight: 1.6,
          }}>&ldquo;{qb.content}&rdquo;</p>
          {qb.attribution && (
            <p style={{ fontSize: '9pt', color: dp.primaryColor, marginTop: '4pt', fontStyle: 'normal', fontWeight: 600 }}>{qb.attribution}</p>
          )}
        </div>
      )
    }
    case 'status': {
      const statusColors: Record<string, string> = { done: '#10B981', 'in-progress': '#3B82F6', pending: '#94A3B8', blocked: '#EF4444' }
      const statusLabels: Record<string, string> = { done: '✓ Done', 'in-progress': '⟳ In Progress', pending: '○ Pending', blocked: '✕ Blocked' }
      return (
        <div style={{ fontFamily: dp.fontFamily }}>
          {(block as StatusBlock).title && <div style={{ fontWeight: 700, fontSize: '12pt', color: dp.headingColor, marginBottom: '6pt' }}>{(block as StatusBlock).title}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
            {(block as StatusBlock).items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4pt 8pt', background: '#F8FAFC', borderRadius: '3pt', fontSize: '10pt' }}>
                <span style={{ color: dp.textColor }}>{item.label}</span>
                <span style={{ color: statusColors[item.status], fontWeight: 600, fontSize: '9pt' }}>{statusLabels[item.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'progress': {
      return (
        <div style={{ fontFamily: dp.fontFamily }}>
          {(block as ProgressBlock).title && <div style={{ fontWeight: 700, fontSize: '12pt', color: dp.headingColor, marginBottom: '6pt' }}>{(block as ProgressBlock).title}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt' }}>
            {(block as ProgressBlock).items.map((item) => (
              <div key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: dp.textColor, marginBottom: '2pt' }}>
                  <span>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}%</span>
                </div>
                <div style={{ background: '#E2E8F0', borderRadius: '99pt', height: '8pt', overflow: 'hidden' }}>
                  <div style={{ width: `${item.value}%`, height: '100%', background: item.color || dp.accentColor, borderRadius: '99pt' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'columns': {
      const cb = block as ColumnsBlock
      const splitMap: Record<string, [string, string]> = {
        '50-50': ['50%', '50%'],
        '33-67': ['33.333%', '66.667%'],
        '67-33': ['66.667%', '33.333%'],
        '25-75': ['25%', '75%'],
        '75-25': ['75%', '25%'],
      }
      const [leftW, rightW] = splitMap[cb.split] ?? ['50%', '50%']
      return (
        <div style={{ display: 'flex', gap: `${cb.gap}pt`, alignItems: 'flex-start' }}>
          <div style={{ width: leftW, minWidth: 0, flexShrink: 0 }}>
            {cb.leftBlocks.map((b) => (
              <div key={b.id} style={{ marginBottom: '8pt', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                {renderPrintBlock(b, dp, report)}
              </div>
            ))}
          </div>
          <div style={{ width: rightW, minWidth: 0, flexShrink: 0 }}>
            {cb.rightBlocks.map((b) => (
              <div key={b.id} style={{ marginBottom: '8pt', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                {renderPrintBlock(b, dp, report)}
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
}

// ── Report Picker ───────────────────────────────────────────────────────────

function ReportPicker({ docs, userName, onOpen, onNew, onDelete }: {
  docs: ReportDoc[]; userName?: string | null
  onOpen: (d: ReportDoc) => void; onNew: () => void
  onDelete: (docId: string) => Promise<void>
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(docId: string) {
    setDeletingId(docId)
    try { await onDelete(docId) } finally { setDeletingId(null); setConfirmId(null) }
  }

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
            <div key={doc.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2D1B11] px-5 py-4 transition hover:border-[#C9A84C]/30">
              <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(doc)}>
                <p className="truncate text-sm font-semibold text-white">{doc.name || 'Untitled'}</p>
                <p className="mt-0.5 text-xs text-slate-500">{formatDate(doc.updatedAt)}</p>
              </button>
              <span className="shrink-0 text-xs font-medium text-[#C9A84C]">Open →</span>
              {confirmId === doc.id ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/40 px-2 py-1">
                  <span className="text-xs text-red-400">Delete?</span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={!!deletingId}
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {deletingId === doc.id ? '…' : 'Yes'}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:text-white">No</button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmId(doc.id) }}
                  title="Delete report"
                  className="shrink-0 rounded p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={onNew} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 text-sm font-medium text-slate-400 transition hover:border-[#C9A84C] hover:text-[#C9A84C]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Report
        </button>
        <div className="mt-6 text-center">
          <Link href="/workspace" className="text-xs text-slate-500 hover:text-slate-300 transition">← Back to Workspace</Link>
        </div>
      </div>
    </div>
  )
}

// ── Report Docs Modal ───────────────────────────────────────────────────────

function ReportDocsModal({ docs, currentId, onOpen, onNew, onDelete, onClose, onRefresh, onOpenShared }: {
  docs: ReportDoc[]; currentId: string | null;
  onOpen: (d: ReportDoc) => void; onNew: () => void;
  onDelete: (docId: string) => Promise<void>;
  onClose: () => void; onRefresh: () => void;
  onOpenShared?: (docId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine')
  const [sharedDocs, setSharedDocs] = useState<import('@/lib/collaboration').SharedDocEntry[]>([])
  const [loadingShared, setLoadingShared] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [dupError, setDupError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  useEffect(() => { onRefresh() }, [])

  useEffect(() => {
    if (activeTab !== 'shared' || sharedDocs.length > 0) return
    setLoadingShared(true)
    import('@/lib/collaboration')
      .then(({ listSharedDocuments }) => listSharedDocuments())
      .then((all) => setSharedDocs(all.filter((d) => d.type === 'report')))
      .catch(() => {})
      .finally(() => setLoadingShared(false))
  }, [activeTab])

  async function handleDuplicate(docId: string) {
    if (duplicatingId) return
    setDuplicatingId(docId)
    setDupError(null)
    try {
      const { duplicateDocument } = await import('@/lib/collaboration')
      const result = await duplicateDocument(docId)
      onRefresh()
      onOpenShared?.(result.id)
    } catch (err) {
      setDupError((err as Error).message || 'Failed to duplicate')
      setDuplicatingId(null)
    }
  }

  async function handleDeleteDoc(docId: string) {
    setDeletingId(docId)
    try {
      await onDelete(docId)
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-white">Reports</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 px-4 pt-2">
          {(['mine', 'shared'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-2 text-xs font-medium capitalize transition ${
                activeTab === t ? 'border-b-2 border-[#C9A84C] text-[#C9A84C]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'mine' ? 'My Reports' : 'Shared With Me'}
            </button>
          ))}
        </div>

        {dupError && (
          <p className="mx-3 mt-2 rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{dupError}</p>
        )}

        <div className="max-h-72 overflow-y-auto p-3">
          {activeTab === 'mine' && (
            docs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No reports yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {docs.map((doc) => (
                  <div key={doc.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition ${currentId === doc.id ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-white/10 hover:bg-white/5'}`}>
                    <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(doc)}>
                      <p className="truncate text-sm font-medium text-white">{doc.name || 'Untitled'}</p>
                      <p className="text-xs text-slate-500">{formatDate(doc.updatedAt)}</p>
                    </button>
                    {currentId === doc.id && <span className="shrink-0 text-[10px] text-[#C9A84C]">Current</span>}
                    {/* Duplicate */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(doc.id) }}
                      disabled={!!duplicatingId}
                      title="Duplicate report"
                      className="shrink-0 rounded p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-40"
                    >
                      {duplicatingId === doc.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    {/* Delete with inline confirm */}
                    {confirmDeleteId === doc.id ? (
                      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/40 px-2 py-1">
                        <span className="text-[10px] text-red-400">Delete?</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id) }}
                          disabled={!!deletingId}
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deletingId === doc.id ? '…' : 'Yes'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }} className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:text-white">No</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(doc.id) }}
                        title="Delete report"
                        className="shrink-0 rounded p-1.5 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'shared' && (
            loadingShared ? (
              <div className="flex justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
              </div>
            ) : sharedDocs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No shared reports yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {sharedDocs.map((doc) => (
                  <div
                    key={doc.docId}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition ${
                      currentId === doc.docId ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <button className="min-w-0 flex-1 text-left" onClick={() => onOpenShared?.(doc.docId)}>
                      <p className="truncate text-sm font-medium text-white">{doc.name || 'Untitled'}</p>
                      <p className="text-xs text-slate-500">By {doc.ownerEmail}</p>
                    </button>
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                      {doc.role}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(doc.docId) }}
                      disabled={!!duplicatingId}
                      title="Duplicate to my reports"
                      className="shrink-0 rounded p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200 disabled:opacity-40"
                    >
                      {duplicatingId === doc.docId ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )
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
            <Link href="/workspace" onClick={onClose} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Workspace
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

function ChartBlockView({ block, dp, forPrint = false, isSelected, onUpdate }: { block: ChartBlock; dp: DesignPack; forPrint?: boolean; isSelected?: boolean; onUpdate?: (u: Record<string, unknown>) => void }) {
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

  const showLabels = block.showLabels !== false // default true for old blocks without field

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
          isAnimationActive={false}
          label={showLabels
            ? ({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
            : false}
          labelLine={showLabels}
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
        {block.datasets.map((ds) => (
          <Bar key={ds.id} dataKey={ds.label} fill={ds.color} radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {showLabels && <LabelList dataKey={ds.label} position="top" style={{ fontSize: 9, fill: '#6B7280' }} />}
          </Bar>
        ))}
      </BarChart>
    )
  } else if (block.chartType === 'line') {
    chart = (
      <LineChart {...commonProps}>
        {gridEl}{xEl}{yEl}{ttEl}{lgEl}
        {block.datasets.map((ds) => (
          <Line key={ds.id} type="monotone" dataKey={ds.label} stroke={ds.color} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false}>
            {showLabels && <LabelList dataKey={ds.label} position="top" style={{ fontSize: 9, fill: '#6B7280' }} />}
          </Line>
        ))}
      </LineChart>
    )
  } else {
    chart = (
      <AreaChart {...commonProps}>
        {gridEl}{xEl}{yEl}{ttEl}{lgEl}
        {block.datasets.map((ds) => (
          <Area key={ds.id} type="monotone" dataKey={ds.label} stroke={ds.color} fill={`${ds.color}30`} strokeWidth={2} isAnimationActive={false}>
            {showLabels && <LabelList dataKey={ds.label} position="top" style={{ fontSize: 9, fill: '#6B7280' }} />}
          </Area>
        ))}
      </AreaChart>
    )
  }

  return (
    <div style={{ fontFamily: dp.fontFamily }}>
      {/* Title: inline-editable on canvas, static on print */}
      {(block.title || isSelected) && (
        forPrint ? (
          block.title ? <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: dp.headingColor }}>{block.title}</p> : null
        ) : (
          <InlineField
            value={block.title || ''}
            onChange={(v) => onUpdate?.({ title: v })}
            placeholder="Chart title..."
            isSelected={!!isSelected}
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: dp.headingColor }}
          />
        )
      )}
      {forPrint ? (
        <div style={{ width: '100%', height: block.height }}>
          <ResponsiveContainer width="100%" height="100%">{chart as React.ReactElement}</ResponsiveContainer>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={block.height}>{chart as React.ReactElement}</ResponsiveContainer>
      )}

      {/* Inline label editor — visible on canvas when block is selected */}
      {!forPrint && isSelected && onUpdate && (
        <div className="mt-2 rounded border border-blue-400/30 bg-blue-50/5 p-2" onClick={(e) => e.stopPropagation()}>
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            {block.chartType === 'pie' || block.chartType === 'donut' ? 'Slice Labels' : 'Category Labels'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {block.labels.map((lbl, i) => (
              <input
                key={i}
                value={lbl}
                placeholder={`Label ${i + 1}`}
                onChange={(e) => {
                  const next = [...block.labels]
                  next[i] = e.target.value
                  // keep dataset data arrays in sync (length unchanged)
                  onUpdate({ labels: next })
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="rounded border border-white/20 bg-[#120B07] px-1.5 py-0.5 text-[11px] text-white outline-none focus:border-blue-400"
                style={{ minWidth: 0, width: `${Math.max(5, lbl.length + 1)}ch` }}
              />
            ))}
            {/* Add / Remove label buttons */}
            <button
              onClick={() => {
                const next = [...block.labels, `Label ${block.labels.length + 1}`]
                const datasets = block.datasets.map((ds) => ({ ...ds, data: [...ds.data, 0] }))
                onUpdate({ labels: next, datasets })
              }}
              className="rounded border border-dashed border-white/20 px-1.5 py-0.5 text-[11px] text-slate-500 hover:border-blue-400 hover:text-blue-400 transition"
              title="Add label"
            >+ Add</button>
            {block.labels.length > 1 && (
              <button
                onClick={() => {
                  const next = block.labels.slice(0, -1)
                  const datasets = block.datasets.map((ds) => ({ ...ds, data: ds.data.slice(0, -1) }))
                  onUpdate({ labels: next, datasets })
                }}
                className="rounded border border-dashed border-white/20 px-1.5 py-0.5 text-[11px] text-slate-500 hover:border-red-400 hover:text-red-400 transition"
                title="Remove last label"
              >− Remove</button>
            )}
          </div>
        </div>
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

      <div className="flex gap-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.showLegend} onChange={(e) => onUpdate({ showLegend: e.target.checked })} />
          Legend
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.showGrid} onChange={(e) => onUpdate({ showGrid: e.target.checked })} />
          Grid
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={block.showLabels !== false} onChange={(e) => onUpdate({ showLabels: e.target.checked })} />
          Labels
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

interface XlsxStylesData {
  fonts: Array<{ bold: boolean; italic: boolean; underline: boolean; color?: string }>
  fills: Array<{ bgColor?: string }>
  borders: Array<{
    top?: { style: string; color: string }
    bottom?: { style: string; color: string }
    left?: { style: string; color: string }
    right?: { style: string; color: string }
  }>
  cellXfs: Array<{
    fontId: number; fillId: number; borderId: number; numFmtId: number
    alignment?: { horizontal?: string; indent?: number }
  }>
  numFmts: Record<number, string>
}

interface ParsedSheet {
  name: string
  rows: unknown[][]
  stylesData: XlsxStylesData | null
  cellXfIndices: Record<string, number>   // cell addr → XF index in cellXfs
}

// Convert ARGB (8-char) or RGB (6-char) to #RRGGBB, skipping white.
function parseArgbColor(argb: string | null | undefined): string | undefined {
  if (!argb || !/^[0-9A-Fa-f]{6,8}$/.test(argb)) return undefined
  const hex = argb.length === 8 ? argb.slice(2) : argb
  if (/^[Ff]{6}$/.test(hex)) return undefined  // white → no color
  return `#${hex.toUpperCase()}`
}

// Parse xl/styles.xml into typed style tables.
function parseXlsxStylesXml(xml: string): XlsxStylesData {
  const XMLNS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  let doc: Document
  try { doc = new DOMParser().parseFromString(xml, 'application/xml') }
  catch { return { fonts: [], fills: [], borders: [], cellXfs: [], numFmts: {} } }

  const getAll = (parent: Element | Document, tag: string): Element[] => {
    const r = Array.from(parent.getElementsByTagNameNS(XMLNS, tag))
    return r.length ? r : Array.from(parent.getElementsByTagName(tag))
  }
  const getFirst = (parent: Element | Document, tag: string) => getAll(parent, tag)[0]

  // numFmts
  const numFmts: Record<number, string> = {}
  getAll(doc, 'numFmt').forEach(el => {
    const id = parseInt(el.getAttribute('numFmtId') ?? '0', 10)
    numFmts[id] = el.getAttribute('formatCode') ?? ''
  })

  // fonts
  const fontsEl = getFirst(doc, 'fonts')
  const fonts: XlsxStylesData['fonts'] = fontsEl
    ? getAll(fontsEl, 'font').map(f => {
        const bEl = getFirst(f, 'b')
        const iEl = getFirst(f, 'i')
        const uEl = getFirst(f, 'u')
        const cEl = getFirst(f, 'color')
        return {
          bold:      !!bEl && bEl.getAttribute('val') !== '0',
          italic:    !!iEl && iEl.getAttribute('val') !== '0',
          underline: !!uEl && uEl.getAttribute('val') !== 'none',
          color: parseArgbColor(cEl?.getAttribute('rgb')),
        }
      })
    : []

  // fills (indices 0 and 1 are always the reserved none/gray125)
  const fillsEl = getFirst(doc, 'fills')
  const fills: XlsxStylesData['fills'] = fillsEl
    ? getAll(fillsEl, 'fill').map(f => {
        const pf = getFirst(f, 'patternFill')
        const pt = pf?.getAttribute('patternType') ?? 'none'
        if (pt === 'none' || pt === 'gray125') return {}
        const fg = getFirst(f, 'fgColor')
        return { bgColor: parseArgbColor(fg?.getAttribute('rgb')) }
      })
    : []

  // borders
  const bordersEl = getFirst(doc, 'borders')
  const borders: XlsxStylesData['borders'] = bordersEl
    ? getAll(bordersEl, 'border').map(b => {
        const side = (tag: string) => {
          const el = getFirst(b, tag)
          const sty = el?.getAttribute('style')
          if (!el || !sty || sty === 'none') return undefined
          const cEl = getFirst(el, 'color')
          return { style: sty, color: parseArgbColor(cEl?.getAttribute('rgb')) ?? '#000000' }
        }
        return { top: side('top'), bottom: side('bottom'), left: side('left'), right: side('right') }
      })
    : []

  // cellXfs
  const cellXfsEl = getFirst(doc, 'cellXfs')
  const cellXfs: XlsxStylesData['cellXfs'] = cellXfsEl
    ? getAll(cellXfsEl, 'xf').map(xf => {
        const aEl = getFirst(xf, 'alignment')
        return {
          fontId:   parseInt(xf.getAttribute('fontId')   ?? '0', 10),
          fillId:   parseInt(xf.getAttribute('fillId')   ?? '0', 10),
          borderId: parseInt(xf.getAttribute('borderId') ?? '0', 10),
          numFmtId: parseInt(xf.getAttribute('numFmtId') ?? '0', 10),
          alignment: aEl ? {
            horizontal: aEl.getAttribute('horizontal') ?? undefined,
            indent: parseInt(aEl.getAttribute('indent') ?? '0', 10) || undefined,
          } : undefined,
        }
      })
    : []

  return { fonts, fills, borders, cellXfs, numFmts }
}

// Parse xl/worksheets/sheet{n}.xml → map of cell addr → XF index.
function parseSheetXfIndices(xml: string): Record<string, number> {
  const result: Record<string, number> = {}
  // Match <c ...> tags and capture r= and s= attributes regardless of order/namespace.
  const re = /<[a-zA-Z0-9:]*c\s([^>]*\/?>)/g
  let m
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1]
    const rM = /\br="([A-Z]+\d+)"/.exec(attrs)
    const sM = /\bs="(\d+)"/.exec(attrs)
    if (rM && sM) result[rM[1]] = parseInt(sM[1], 10)
  }
  return result
}

// Convert a parsed border side to a CSS border string.
function xlsxBorderSideToCss(side?: { style: string; color: string }): string | undefined {
  if (!side) return undefined
  const { style: sty, color } = side
  if (sty === 'thin' || sty === 'hair') return `1px solid ${color}`
  if (sty === 'medium') return `2px solid ${color}`
  if (sty === 'thick') return `3px solid ${color}`
  if (sty === 'double') return `3px double ${color}`
  if (sty === 'dotted') return `1px dotted ${color}`
  return `1px dashed ${color}`  // dashed / dashDot / mediumDashed / etc.
}

function extractXlsxNumFormat(numFmtStr: string): TableCell['numberFormat'] {
  if (!numFmtStr) return undefined
  if (/\$|USD|£|€/i.test(numFmtStr)) {
    if (/\(/.test(numFmtStr)) return 'accounting'
    return 'currency'
  }
  if (/%/.test(numFmtStr)) return 'percentage'
  if (/0,0|#,##/.test(numFmtStr)) return 'number'
  return undefined
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
      const uint8 = new Uint8Array(buffer)

      // Use SheetJS for cell values and sheet names
      const wb = XLSX.read(uint8, { type: 'array', cellNF: true })

      // For XLSX/XLSM: parse the ZIP directly for complete style information.
      // SheetJS 0.18.x only exposes fill data via cell.s; font/border data is lost
      // during its internal parsing, so we must read styles.xml + sheet XMLs ourselves.
      let stylesData: XlsxStylesData | null = null
      const sheetXfMaps: Record<number, Record<string, number>> = {}

      if (/\.xlsx[m]?$/i.test(file.name)) {
        try {
          const { unzipSync, strFromU8 } = await import('fflate')
          const zipFiles = unzipSync(uint8)

          const stylesBytes = zipFiles['xl/styles.xml']
          if (stylesBytes) stylesData = parseXlsxStylesXml(strFromU8(stylesBytes))

          // Map each sheet index to its XF index table.
          // Standard Excel always names sheets sheet1.xml, sheet2.xml, … in order.
          wb.SheetNames.forEach((_, idx) => {
            const bytes = zipFiles[`xl/worksheets/sheet${idx + 1}.xml`]
            if (bytes) sheetXfMaps[idx] = parseSheetXfIndices(strFromU8(bytes))
          })
        } catch { /* ZIP parse failure — continue without style data */ }
      }

      const parsed: ParsedSheet[] = wb.SheetNames.map((name, idx) => {
        const ws = wb.Sheets[name]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
        return { name, rows, stylesData, cellXfIndices: sheetXfMaps[idx] ?? {} }
      })

      setSheets(parsed)
      setFileName(file.name)
      setCaption('')
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
      // Proper multi-letter column encoder (A–Z, AA–AZ, ...)
      function encodeCellAddr(r: number, c: number): string {
        let col = ''
        let n = c
        do { col = String.fromCharCode(65 + (n % 26)) + col; n = Math.floor(n / 26) - 1 } while (n >= 0)
        return `${col}${r + 1}`
      }

      const sd = sheet.stylesData

      // Look up a cell's resolved style from the pre-parsed style tables.
      function cellStyle(absRow: number, col: number) {
        const addr = encodeCellAddr(absRow, col)
        const xfIdx = sheet.cellXfIndices[addr]
        if (xfIdx === undefined || !sd) return null
        const xf = sd.cellXfs[xfIdx]
        if (!xf) return null
        return {
          font:      sd.fonts[xf.fontId],
          fill:      sd.fills[xf.fillId],
          border:    sd.borders[xf.borderId],
          alignment: xf.alignment,
          numFmtId:  xf.numFmtId,
        }
      }

      const [headerRow, ...dataRows] = sheet.rows
      const headers = (headerRow as unknown[]).map(String)

      // Header row styling: pick up background + text color from first header cell
      const hSt = cellStyle(0, 0)
      const headerBgDetected   = hSt?.fill?.bgColor
      const headerTextDetected = hSt?.font?.color

      const rows: TableCell[][] = dataRows.map((row, rIdx) =>
        (row as unknown[]).map((cellVal, cIdx) => {
          const st = cellStyle(rIdx + 1, cIdx)
          const font      = st?.font
          const fill      = st?.fill
          const border    = st?.border
          const alignment = st?.alignment

          const bold      = font?.bold      ?? false
          const italic    = font?.italic    ?? false
          const underline = font?.underline ?? false
          const color     = font?.color   // already #RRGGBB or undefined
          const bgColor   = fill?.bgColor  // already #RRGGBB or undefined

          const horz = alignment?.horizontal
          const align: 'left' | 'center' | 'right' = horz === 'right' ? 'right' : horz === 'center' ? 'center' : 'left'
          const indentLevel = alignment?.indent ?? 0

          const numFmtStr = (sd && st) ? (sd.numFmts[st.numFmtId] ?? '') : ''
          const numberFormat = extractXlsxNumFormat(numFmtStr)

          const bTop    = xlsxBorderSideToCss(border?.top)
          const bBottom = xlsxBorderSideToCss(border?.bottom)
          const bLeft   = xlsxBorderSideToCss(border?.left)
          const bRight  = xlsxBorderSideToCss(border?.right)
          const sideBorders = (bTop || bBottom || bLeft || bRight) ? {
            ...(bTop    ? { top: bTop }       : {}),
            ...(bBottom ? { bottom: bBottom } : {}),
            ...(bLeft   ? { left: bLeft }     : {}),
            ...(bRight  ? { right: bRight }   : {}),
          } : undefined

          return {
            content: String(cellVal ?? ''),
            bold, italic, underline, align,
            ...(indentLevel > 0 ? { indentLevel } : {}),
            ...(numberFormat   ? { numberFormat } : {}),
            ...(bgColor        ? { bgColor }      : {}),
            ...(color          ? { color }         : {}),
            ...(sideBorders    ? { sideBorders }   : {}),
          }
        })
      )

      const block: TableBlock = {
        id: uuidv4(), type: 'table', caption,
        headers, rows, striped: false, bordered: false,
        headerBg:   headerBgDetected  ?? '',
        headerText: headerTextDetected ?? '',
        allowBreak: true,
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
        height: 300, showLegend: true, showGrid: true, showLabels: true, sourceFile: fileName,
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

function CoverStylePanel({ coverPage, onUpdate, onDeselect }: {
  coverPage: ReportData['coverPage']
  onUpdate: (field: string, val: unknown) => void
  onDeselect: () => void
}) {
  const label = (t: string) => <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{t}</label>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#C9A84C]">Cover Page Style</span>
        <button onClick={onDeselect} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Deselect ✕</button>
      </div>

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
