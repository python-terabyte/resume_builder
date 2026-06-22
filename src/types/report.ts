// ── Document Types ─────────────────────────────────────────────────────────

export type ReportDocumentType =
  | 'financial' | 'annual' | 'management' | 'board'
  | 'business-plan' | 'pitch-deck' | 'investor' | 'company-profile'
  | 'proposal' | 'research' | 'consultancy' | 'general'

export const DOCUMENT_TYPES: { id: ReportDocumentType; label: string }[] = [
  { id: 'financial',       label: 'Financial Report' },
  { id: 'annual',          label: 'Annual Report' },
  { id: 'management',      label: 'Management Report' },
  { id: 'board',           label: 'Board Report' },
  { id: 'business-plan',   label: 'Business Plan' },
  { id: 'pitch-deck',      label: 'Pitch Deck' },
  { id: 'investor',        label: 'Investor Presentation' },
  { id: 'company-profile', label: 'Company Profile' },
  { id: 'proposal',        label: 'Proposal' },
  { id: 'research',        label: 'Research Report' },
  { id: 'consultancy',     label: 'Consultancy Report' },
  { id: 'general',         label: 'General Document' },
]

// ── Shape Types ─────────────────────────────────────────────────────────────

export type ShapeType = 'rect' | 'circle' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'line' | 'arrow'

export interface ShapeItem {
  id: string
  type: ShapeType
  x: number          // left % of page width (0–100)
  y: number          // top % of page height (0–100)
  width: number      // % of page width
  height: number     // % of page height
  fill: string
  fillOpacity: number
  stroke: string
  strokeWidth: number
  opacity: number
  rotation: number
  borderRadius: number
  zIndex: number
}

export interface ShapeTemplate {
  id: string
  name: string
  shapes: ShapeItem[]
}

// ── Block Types ────────────────────────────────────────────────────────────

export interface HeadingBlock {
  id: string
  type: 'heading'
  content: string
  level: 1 | 2 | 3
  align: 'left' | 'center' | 'right'
  color: string
  // Rich formatting overrides
  bold?: boolean
  italic?: boolean
  fontSize?: number
  bgColor?: string
}

export interface TextBlock {
  id: string
  type: 'text'
  content: string
  align: 'left' | 'center' | 'right' | 'justify'
  // Rich formatting
  bold?: boolean
  italic?: boolean
  fontSize?: number
  color?: string
  bgColor?: string
}

export interface TableCell {
  content: string
  bold: boolean
  italic?: boolean
  underline?: boolean
  align: 'left' | 'center' | 'right'
  color?: string
  bgColor?: string
  numberFormat?: 'general' | 'number' | 'currency' | 'percentage' | 'accounting'
  indentLevel?: number
  // Cell-level border overrides — formatted CSS border strings, e.g. "1px solid #333"
  sideBorders?: { top?: string; bottom?: string; left?: string; right?: string }
}

export type CellBorderStyle = 'solid' | 'dashed' | 'dotted' | 'double'

export interface CellBorder {
  style: CellBorderStyle
  color: string
  width: 1 | 2 | 3  // thin / medium / thick
}

export interface TableBorders {
  top: CellBorder | null
  bottom: CellBorder | null
  left: CellBorder | null
  right: CellBorder | null
  innerH: CellBorder | null  // horizontal lines between rows
  innerV: CellBorder | null  // vertical lines between columns
}

export interface TableBlock {
  id: string
  type: 'table'
  caption: string
  headers: string[]
  rows: TableCell[][]
  striped: boolean
  bordered: boolean
  headerBg: string
  headerText: string
  bgColor?: string
  allowBreak?: boolean  // allow table rows to split across PDF pages
  borders?: TableBorders  // granular per-side border config; overrides `bordered`
}

export interface ImageBlock {
  id: string
  type: 'image'
  url: string
  alt: string
  caption: string
  width: 'full' | 'large' | 'medium' | 'small'
  align: 'left' | 'center' | 'right'
  bgColor?: string
}

export interface KpiItem {
  id: string
  label: string
  value: string
  prefix: string
  suffix: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
}

export interface KpiBlock {
  id: string
  type: 'kpi'
  title: string
  columns: 2 | 3 | 4
  items: KpiItem[]
  accentColor: string
  bgColor?: string
}

export interface DividerBlock {
  id: string
  type: 'divider'
  style: 'solid' | 'dashed' | 'double'
  color: string
  thickness: number
  bgColor?: string
}

export interface SpacerBlock {
  id: string
  type: 'spacer'
  height: number
  bgColor?: string
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut'

export interface ChartDataset {
  id: string
  label: string
  data: number[]
  color: string
}

export interface ChartBlock {
  id: string
  type: 'chart'
  title: string
  chartType: ChartType
  labels: string[]
  datasets: ChartDataset[]
  height: number
  showLegend: boolean
  showGrid: boolean
  showLabels: boolean
  sourceFile: string
  bgColor?: string
}

export interface TocBlock {
  id: string
  type: 'toc'
  title: string
  includePageNumbers: boolean
  bgColor?: string
}

export interface CalloutBlock {
  id: string
  type: 'callout'
  content: string
  variant: 'info' | 'warning' | 'success' | 'danger'
  bold?: boolean
  italic?: boolean
  fontSize?: number
  bgColor?: string
}

export interface QuoteBlock {
  id: string
  type: 'quote'
  content: string
  attribution?: string
  bold?: boolean
  italic?: boolean
  fontSize?: number
  color?: string
  bgColor?: string
}

export interface StatusItem {
  id: string
  label: string
  status: 'done' | 'in-progress' | 'pending' | 'blocked'
}

export interface StatusBlock {
  id: string
  type: 'status'
  title: string
  items: StatusItem[]
  bgColor?: string
}

export interface ProgressItem {
  id: string
  label: string
  value: number
  color?: string
}

export interface ProgressBlock {
  id: string
  type: 'progress'
  title: string
  items: ProgressItem[]
  bgColor?: string
}

export interface ColumnsBlock {
  id: string
  type: 'columns'
  split: '50-50' | '33-67' | '67-33' | '25-75' | '75-25'
  leftBlocks: ReportBlock[]
  rightBlocks: ReportBlock[]
  gap: number
  bgColor?: string
}

export type ReportBlock =
  | HeadingBlock
  | TextBlock
  | TableBlock
  | ImageBlock
  | KpiBlock
  | DividerBlock
  | SpacerBlock
  | ChartBlock
  | TocBlock
  | CalloutBlock
  | QuoteBlock
  | StatusBlock
  | ProgressBlock
  | ColumnsBlock

export type ReportBlockType = ReportBlock['type']

// ── Page & Document ────────────────────────────────────────────────────────

export interface PageStyle {
  backgroundColor?: string
  backgroundImage?: string
  backgroundPattern?: 'none' | 'grid' | 'dots' | 'diagonal'
}

export interface ReportPage {
  id: string
  title: string
  blocks: ReportBlock[]
  shapes?: ShapeItem[]
  style?: PageStyle
  noWatermark?: boolean
}

export type DesignPackId =
  | 'corporate-navy'
  | 'modern-teal'
  | 'minimal-slate'
  | 'bold-red'
  | 'elegant-gold'
  | 'professional-blue'

export interface DesignPack {
  id: string
  name: string
  primaryColor: string
  accentColor: string
  headingColor: string
  textColor: string
  tableHeaderBg: string
  tableHeaderText: string
  kpiAccent: string
  fontFamily: string
}

export type ReportStatus = 'draft' | 'published' | 'archived'

export interface CoverFieldStyle {
  bold?: boolean
  italic?: boolean
  fontSize?: number
  align?: 'left' | 'center' | 'right'
  color?: string
  bgColor?: string
}

export interface ReportCoverPage {
  enabled: boolean
  companyName: string
  logoUrl: string
  logoPosition?: 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br'
  backgroundImageUrl: string
  reportTitle: string
  subtitle?: string
  date: string
  primaryColor: string
  textColor: string
  pattern: 'none' | 'grid' | 'dots' | 'diagonal'
  coverBlocks?: ReportBlock[]
  fieldStyles?: {
    reportTitle?: CoverFieldStyle
    subtitle?: CoverFieldStyle
    companyName?: CoverFieldStyle
    date?: CoverFieldStyle
  }
}

export interface ReportBranding {
  logoUrl?: string
  companyName?: string
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
}

export interface ReportData {
  documentType: ReportDocumentType
  coverPage: ReportCoverPage
  pages: ReportPage[]
  designPackId: string
  pageSize: 'A4' | 'Letter'
  headerFooter: {
    showHeader: boolean
    headerLeft: string
    headerRight: string
    headerStyle?: 'line' | 'band' | 'double' | 'gradient' | 'accent-band' | 'minimal'
    headerBg?: string
    showFooter: boolean
    footerLeft: string
    footerRight: string
    footerStyle?: 'line' | 'band' | 'double' | 'gradient' | 'accent-band' | 'minimal'
    footerBg?: string
    showPageNumbers: boolean
  }
  watermark: {
    enabled: boolean
    text: string
    opacity: number
    rotation: number
    imageUrl?: string
    color?: string
    excludeCover?: boolean
  }
  status: ReportStatus
  branding?: ReportBranding
  colorOverrides?: {
    headingColor?: string
    textColor?: string
    accentColor?: string
    primaryColor?: string
    tableHeaderBg?: string
    tableHeaderText?: string
    kpiAccent?: string
    fontFamily?: string
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

export const DESIGN_PACKS: DesignPack[] = [
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    primaryColor: '#1E3A5F',
    accentColor: '#2D7DD2',
    headingColor: '#1E3A5F',
    textColor: '#374151',
    tableHeaderBg: '#1E3A5F',
    tableHeaderText: '#FFFFFF',
    kpiAccent: '#2D7DD2',
    fontFamily: 'Inter',
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    primaryColor: '#0D9080',
    accentColor: '#14B8A6',
    headingColor: '#065F46',
    textColor: '#374151',
    tableHeaderBg: '#0D9080',
    tableHeaderText: '#FFFFFF',
    kpiAccent: '#0D9080',
    fontFamily: 'DM Sans',
  },
  {
    id: 'minimal-slate',
    name: 'Minimal Slate',
    primaryColor: '#334155',
    accentColor: '#64748B',
    headingColor: '#1E293B',
    textColor: '#475569',
    tableHeaderBg: '#F1F5F9',
    tableHeaderText: '#334155',
    kpiAccent: '#475569',
    fontFamily: 'Inter',
  },
  {
    id: 'bold-red',
    name: 'Bold Red',
    primaryColor: '#DC2626',
    accentColor: '#EF4444',
    headingColor: '#991B1B',
    textColor: '#374151',
    tableHeaderBg: '#DC2626',
    tableHeaderText: '#FFFFFF',
    kpiAccent: '#DC2626',
    fontFamily: 'DM Sans',
  },
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    primaryColor: '#92400E',
    accentColor: '#C9A84C',
    headingColor: '#78350F',
    textColor: '#44403C',
    tableHeaderBg: '#C9A84C',
    tableHeaderText: '#FFFFFF',
    kpiAccent: '#C9A84C',
    fontFamily: 'Georgia',
  },
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    primaryColor: '#1D4ED8',
    accentColor: '#3B82F6',
    headingColor: '#1E3A8A',
    textColor: '#374151',
    tableHeaderBg: '#EFF6FF',
    tableHeaderText: '#1D4ED8',
    kpiAccent: '#3B82F6',
    fontFamily: 'Open Sans',
  },
]

export const DEFAULT_REPORT: ReportData = {
  documentType: 'financial',
  coverPage: {
    enabled: true,
    companyName: 'Acme Corporation',
    logoUrl: '',
    backgroundImageUrl: '',
    reportTitle: 'Q4 2025 Financial Report',
    date: '31 December 2025',
    primaryColor: '#1E3A5F',
    textColor: '#FFFFFF',
    pattern: 'grid',
    coverBlocks: [
      {
        id: 'cover-block-h1',
        type: 'heading',
        content: 'Report Overview',
        level: 2,
        align: 'left',
        color: '',
      },
      {
        id: 'cover-block-t1',
        type: 'text',
        content: 'This report presents a comprehensive overview of performance, key metrics, and strategic insights for the period under review.',
        align: 'left',
      },
    ],
  },
  pages: [
    {
      id: 'page-1',
      title: 'Executive Summary',
      shapes: [],
      blocks: [
        {
          id: 'block-h1',
          type: 'heading',
          content: 'Executive Summary',
          level: 1,
          align: 'left',
          color: '',
        },
        {
          id: 'block-t1',
          type: 'text',
          content:
            'This report presents the consolidated financial results for Acme Corporation for the fourth quarter ending 31 December 2025. The company delivered strong performance across all key metrics, driven by continued growth in core product lines and successful cost optimisation initiatives.\n\nRevenue reached $12.4 million, representing an 18% increase year-over-year. Operating profit improved by 22%, reflecting disciplined expense management and improved operational efficiency. Cash position remains strong at $3.2 million.',
          align: 'left',
        },
        {
          id: 'block-kpi1',
          type: 'kpi',
          title: 'Key Financial Metrics — Q4 2025',
          columns: 4,
          accentColor: '',
          items: [
            { id: 'kpi-1', label: 'Total Revenue',    value: '12.4', prefix: '$', suffix: 'M', trend: 'up',      trendValue: '+18%'  },
            { id: 'kpi-2', label: 'Operating Profit', value: '3.1',  prefix: '$', suffix: 'M', trend: 'up',      trendValue: '+22%'  },
            { id: 'kpi-3', label: 'Net Margin',       value: '24.7', prefix: '',  suffix: '%', trend: 'up',      trendValue: '+2.1pp'},
            { id: 'kpi-4', label: 'Cash Position',    value: '3.2',  prefix: '$', suffix: 'M', trend: 'neutral', trendValue: ''      },
          ],
        },
      ],
    },
    {
      id: 'page-2',
      title: 'Financial Overview',
      shapes: [],
      blocks: [
        {
          id: 'block-h2',
          type: 'heading',
          content: 'Financial Overview',
          level: 1,
          align: 'left',
          color: '',
        },
        {
          id: 'block-h2b',
          type: 'heading',
          content: 'Profit & Loss Summary',
          level: 2,
          align: 'left',
          color: '',
        },
        {
          id: 'block-table1',
          type: 'table',
          caption: 'Table 1: Consolidated P&L — Q4 2025 vs Q4 2024',
          headers: ['Line Item', 'Q4 2025', 'Q4 2024', 'Change', '% Change'],
          rows: [
            [
              { content: 'Revenue',              bold: true,  align: 'left'  },
              { content: '$12,400,000',           bold: false, align: 'right' },
              { content: '$10,500,000',           bold: false, align: 'right' },
              { content: '+$1,900,000',           bold: false, align: 'right' },
              { content: '+18.1%',                bold: false, align: 'right' },
            ],
            [
              { content: 'Cost of Goods Sold',   bold: false, align: 'left'  },
              { content: '$6,820,000',            bold: false, align: 'right' },
              { content: '$5,985,000',            bold: false, align: 'right' },
              { content: '+$835,000',             bold: false, align: 'right' },
              { content: '+13.9%',                bold: false, align: 'right' },
            ],
            [
              { content: 'Gross Profit',         bold: true,  align: 'left'  },
              { content: '$5,580,000',            bold: true,  align: 'right' },
              { content: '$4,515,000',            bold: true,  align: 'right' },
              { content: '+$1,065,000',           bold: false, align: 'right' },
              { content: '+23.6%',                bold: false, align: 'right' },
            ],
            [
              { content: 'Operating Expenses',   bold: false, align: 'left'  },
              { content: '$2,480,000',            bold: false, align: 'right' },
              { content: '$2,075,000',            bold: false, align: 'right' },
              { content: '+$405,000',             bold: false, align: 'right' },
              { content: '+19.5%',                bold: false, align: 'right' },
            ],
            [
              { content: 'Operating Profit',     bold: true,  align: 'left'  },
              { content: '$3,100,000',            bold: true,  align: 'right' },
              { content: '$2,440,000',            bold: true,  align: 'right' },
              { content: '+$660,000',             bold: false, align: 'right' },
              { content: '+27.0%',                bold: false, align: 'right' },
            ],
          ],
          striped: true,
          bordered: true,
          headerBg: '',
          headerText: '',
        },
        {
          id: 'block-t2',
          type: 'text',
          content:
            'Revenue growth was primarily driven by increased sales in the Enterprise segment (+24%) and strong performance from the newly launched Professional tier (+41%). The Americas region continued to be the largest contributor at 52% of total revenue, with EMEA growing 31% to represent 29% of revenue.',
          align: 'left',
        },
      ],
    },
    {
      id: 'page-3',
      title: 'Looking Ahead',
      shapes: [],
      blocks: [
        {
          id: 'block-h3',
          type: 'heading',
          content: 'Outlook & Strategic Priorities',
          level: 1,
          align: 'left',
          color: '',
        },
        {
          id: 'block-t3',
          type: 'text',
          content:
            "Management remains confident in the company's growth trajectory for 2026. Key priorities for the upcoming year include:\n\n• Market expansion into Southeast Asia and Latin America\n• Launch of AI-powered product suite in Q2 2026\n• Continued investment in R&D to maintain competitive advantage\n• Cost efficiency programme targeting 3–5% reduction in operational overheads",
          align: 'left',
        },
        {
          id: 'block-div1',
          type: 'divider',
          style: 'solid',
          color: '',
          thickness: 1,
        },
        {
          id: 'block-t4',
          type: 'text',
          content:
            'This report has been prepared by the Finance Department and reviewed by the Board of Directors. The financial figures contained herein are unaudited and subject to final audit confirmation.',
          align: 'left',
        },
      ],
    },
  ],
  designPackId: 'corporate-navy',
  pageSize: 'A4',
  headerFooter: {
    showHeader: true,
    headerLeft: 'Acme Corporation',
    headerRight: 'Q4 2025 Financial Report',
    showFooter: true,
    footerLeft: 'Confidential',
    footerRight: '',
    showPageNumbers: true,
  },
  watermark: {
    enabled: false,
    text: 'CONFIDENTIAL',
    opacity: 0.1,
    rotation: -45,
    imageUrl: '',
    color: '#888888',
  },
  status: 'draft',
}
