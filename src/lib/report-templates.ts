import type { ReportData } from '@/types/report'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  emoji: string
  accentColor: string
  designPackId: string
  data: ReportData
}

const emptyHeader = { showHeader: false, headerLeft: '', headerRight: '', showFooter: false, footerLeft: '', footerRight: '', showPageNumbers: true }
const emptyWatermark = { enabled: false, text: 'DRAFT', opacity: 0.08, rotation: -30 }

const blankCover = (title: string, company = '', subtitle = ''): ReportData['coverPage'] => ({
  enabled: !!company,
  companyName: company,
  logoUrl: '',
  backgroundImageUrl: '',
  reportTitle: title,
  subtitle,
  date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  primaryColor: '',
  textColor: '',
  pattern: 'none',
})

// ── Templates ─────────────────────────────────────────────────────────────

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // ── Blank ──────────────────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start from scratch with an empty page.',
    category: 'General',
    emoji: '📄',
    accentColor: '#6B7280',
    designPackId: 'minimal-slate',
    data: {
      documentType: 'general',
      coverPage: { ...blankCover('', ''), enabled: false },
      pages: [{ id: 'p1', title: 'Page 1', blocks: [] }],
      designPackId: 'minimal-slate',
      pageSize: 'A4',
      headerFooter: emptyHeader,
      watermark: emptyWatermark,
      status: 'draft',
    },
  },

  // ── Financial Report ───────────────────────────────────────────────────
  {
    id: 'financial-report',
    name: 'Financial Report',
    description: 'P&L, KPI metrics, balance sheet, and financial outlook.',
    category: 'Finance',
    emoji: '💼',
    accentColor: '#1E3A5F',
    designPackId: 'corporate-navy',
    data: {
      documentType: 'financial',
      coverPage: { ...blankCover('Q4 2025 Financial Report', 'Acme Corporation', 'October – December 2025'), enabled: true, pattern: 'grid', primaryColor: '#1E3A5F', textColor: '#FFFFFF' },
      pages: [
        {
          id: 'fp1', title: 'Financial Highlights', blocks: [
            { id: 'fh1', type: 'heading', content: 'Financial Highlights', level: 1, align: 'left', color: '' },
            { id: 'fh2', type: 'kpi', title: 'Key Metrics', columns: 4, accentColor: '', items: [
              { id: 'ki1', label: 'Revenue', value: '$4.2M', prefix: '', suffix: '', trend: 'up', trendValue: '+12%' },
              { id: 'ki2', label: 'Gross Profit', value: '$1.8M', prefix: '', suffix: '', trend: 'up', trendValue: '+9%' },
              { id: 'ki3', label: 'EBITDA', value: '$640K', prefix: '', suffix: '', trend: 'up', trendValue: '+6%' },
              { id: 'ki4', label: 'Net Income', value: '$310K', prefix: '', suffix: '', trend: 'down', trendValue: '-2%' },
            ]},
            { id: 'fh3', type: 'heading', content: 'Profit & Loss Summary', level: 2, align: 'left', color: '' },
            { id: 'fh4', type: 'table', caption: 'Q4 2025 vs Q3 2025 (in USD thousands)', headers: ['Item', 'Q4 2025', 'Q3 2025', 'Change'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Revenue', bold: true, align: 'left' }, { content: '4,200', bold: false, align: 'right' }, { content: '3,750', bold: false, align: 'right' }, { content: '+12.0%', bold: false, align: 'right' }],
                [{ content: 'Cost of Goods Sold', bold: false, align: 'left' }, { content: '2,400', bold: false, align: 'right' }, { content: '2,180', bold: false, align: 'right' }, { content: '+10.1%', bold: false, align: 'right' }],
                [{ content: 'Gross Profit', bold: true, align: 'left' }, { content: '1,800', bold: false, align: 'right' }, { content: '1,570', bold: false, align: 'right' }, { content: '+14.6%', bold: false, align: 'right' }],
                [{ content: 'Operating Expenses', bold: false, align: 'left' }, { content: '1,160', bold: false, align: 'right' }, { content: '1,100', bold: false, align: 'right' }, { content: '+5.5%', bold: false, align: 'right' }],
                [{ content: 'EBITDA', bold: true, align: 'left' }, { content: '640', bold: false, align: 'right' }, { content: '470', bold: false, align: 'right' }, { content: '+36.2%', bold: false, align: 'right' }],
                [{ content: 'Net Income', bold: true, align: 'left' }, { content: '310', bold: false, align: 'right' }, { content: '316', bold: false, align: 'right' }, { content: '-1.9%', bold: false, align: 'right' }],
              ],
            },
          ],
        },
        {
          id: 'fp2', title: 'Outlook', blocks: [
            { id: 'fo1', type: 'heading', content: 'Q1 2026 Outlook', level: 1, align: 'left', color: '' },
            { id: 'fo2', type: 'text', content: 'Looking ahead to Q1 2026, the business anticipates continued revenue growth driven by new product launches, expanded partnerships, and operational efficiency improvements. Management remains focused on margin expansion and disciplined capital allocation.', align: 'left' },
            { id: 'fo3', type: 'divider', style: 'solid', thickness: 1, color: '' },
            { id: 'fo4', type: 'text', content: 'This report was prepared by the Finance team and has been reviewed by senior management. All figures are unaudited.', align: 'left' },
          ],
        },
      ],
      designPackId: 'corporate-navy',
      pageSize: 'A4',
      headerFooter: { showHeader: true, headerLeft: 'Acme Corporation', headerRight: 'CONFIDENTIAL', showFooter: true, footerLeft: 'Q4 2025 Financial Report', footerRight: '', showPageNumbers: true },
      watermark: emptyWatermark,
      status: 'draft',
    },
  },

  // ── Annual Report ──────────────────────────────────────────────────────
  {
    id: 'annual-report',
    name: 'Annual Report',
    description: 'CEO letter, year in review, financials, and strategic outlook.',
    category: 'Finance',
    emoji: '📊',
    accentColor: '#C9A84C',
    designPackId: 'elegant-gold',
    data: {
      documentType: 'annual',
      coverPage: { ...blankCover('Annual Report 2025', 'Your Company', 'A Year of Growth and Innovation'), enabled: true, pattern: 'diagonal', primaryColor: '#1a1a2e', textColor: '#C9A84C' },
      pages: [
        {
          id: 'ar1', title: 'Letter from CEO', blocks: [
            { id: 'al1', type: 'heading', content: 'A Message from Our CEO', level: 1, align: 'center', color: '' },
            { id: 'al2', type: 'divider', style: 'solid', thickness: 1, color: '' },
            { id: 'al3', type: 'text', content: 'Dear Shareholders and Stakeholders,\n\nI am proud to share that 2025 was a landmark year for our company. We exceeded our financial targets, expanded into new markets, and made significant investments in our people and technology.\n\nOur revenue grew by 24% year-over-year, reaching a record high, while we maintained a strong balance sheet and continued to deliver value to our shareholders. The strategic initiatives we launched earlier in the year are bearing fruit, and we enter 2026 with considerable momentum.\n\nThank you for your continued trust and support.\n\nSincerely,\n[CEO Name], Chief Executive Officer', align: 'left' },
          ],
        },
        {
          id: 'ar2', title: 'Year in Numbers', blocks: [
            { id: 'an1', type: 'heading', content: '2025 at a Glance', level: 1, align: 'left', color: '' },
            { id: 'an2', type: 'kpi', title: 'Annual Performance', columns: 3, accentColor: '', items: [
              { id: 'ak1', label: 'Annual Revenue', value: '$18.4M', prefix: '', suffix: '', trend: 'up', trendValue: '+24%' },
              { id: 'ak2', label: 'New Customers', value: '1,240', prefix: '', suffix: '', trend: 'up', trendValue: '+31%' },
              { id: 'ak3', label: 'Employees', value: '287', prefix: '', suffix: '', trend: 'up', trendValue: '+18%' },
              { id: 'ak4', label: 'Markets Served', value: '14', prefix: '', suffix: '', trend: 'up', trendValue: '+4' },
              { id: 'ak5', label: 'Customer Retention', value: '94%', prefix: '', suffix: '', trend: 'up', trendValue: '+2pp' },
              { id: 'ak6', label: 'Net Promoter Score', value: '72', prefix: '', suffix: '', trend: 'up', trendValue: '+8' },
            ]},
          ],
        },
        {
          id: 'ar3', title: 'Financial Summary', blocks: [
            { id: 'afs1', type: 'heading', content: 'Financial Performance', level: 1, align: 'left', color: '' },
            { id: 'afs2', type: 'table', caption: 'Five-Year Financial Summary (USD millions)', headers: ['Metric', '2021', '2022', '2023', '2024', '2025'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Revenue', bold: true, align: 'left' }, { content: '7.2', bold: false, align: 'right' }, { content: '9.8', bold: false, align: 'right' }, { content: '12.1', bold: false, align: 'right' }, { content: '14.8', bold: false, align: 'right' }, { content: '18.4', bold: false, align: 'right' }],
                [{ content: 'Gross Profit', bold: false, align: 'left' }, { content: '3.1', bold: false, align: 'right' }, { content: '4.2', bold: false, align: 'right' }, { content: '5.4', bold: false, align: 'right' }, { content: '6.7', bold: false, align: 'right' }, { content: '8.3', bold: false, align: 'right' }],
                [{ content: 'EBITDA', bold: false, align: 'left' }, { content: '0.9', bold: false, align: 'right' }, { content: '1.4', bold: false, align: 'right' }, { content: '2.0', bold: false, align: 'right' }, { content: '2.8', bold: false, align: 'right' }, { content: '3.7', bold: false, align: 'right' }],
                [{ content: 'Net Income', bold: false, align: 'left' }, { content: '0.4', bold: false, align: 'right' }, { content: '0.7', bold: false, align: 'right' }, { content: '1.0', bold: false, align: 'right' }, { content: '1.4', bold: false, align: 'right' }, { content: '1.9', bold: false, align: 'right' }],
              ],
            },
          ],
        },
        {
          id: 'ar4', title: 'Outlook', blocks: [
            { id: 'ao1', type: 'heading', content: 'Strategic Priorities for 2026', level: 1, align: 'left', color: '' },
            { id: 'ao2', type: 'text', content: '1. Accelerate international expansion into 6 new markets\n2. Launch next-generation product platform in Q2\n3. Achieve $25M+ in revenue with improved margins\n4. Grow headcount by 30% with focus on R&D and sales\n5. Continue shareholder return program', align: 'left' },
            { id: 'ao3', type: 'divider', style: 'solid', thickness: 1, color: '' },
            { id: 'ao4', type: 'text', content: 'Forward-looking statements are subject to risk and uncertainty. Past performance is not indicative of future results.', align: 'left' },
          ],
        },
      ],
      designPackId: 'elegant-gold',
      pageSize: 'A4',
      headerFooter: { showHeader: true, headerLeft: 'Annual Report 2025', headerRight: 'Your Company', showFooter: true, footerLeft: '', footerRight: '', showPageNumbers: true },
      watermark: emptyWatermark,
      status: 'draft',
    },
  },

  // ── Board Report ───────────────────────────────────────────────────────
  {
    id: 'board-report',
    name: 'Board Report',
    description: 'Executive summary, KPIs, financial update, and recommendations for the board.',
    category: 'Management',
    emoji: '📋',
    accentColor: '#2D7DD2',
    designPackId: 'professional-blue',
    data: {
      documentType: 'board',
      coverPage: { ...blankCover('Board of Directors Report', 'Your Company', 'Q4 2025 — Board Meeting'), enabled: true, pattern: 'grid', primaryColor: '#0F2547', textColor: '#FFFFFF' },
      pages: [
        {
          id: 'br1', title: 'Executive Summary', blocks: [
            { id: 'be1', type: 'heading', content: 'Executive Summary', level: 1, align: 'left', color: '' },
            { id: 'be2', type: 'text', content: 'This report provides the Board of Directors with an update on Q4 2025 business performance, key operational developments, financial results, and strategic recommendations for the coming quarter.', align: 'left' },
            { id: 'be3', type: 'kpi', title: 'Q4 2025 Performance Snapshot', columns: 4, accentColor: '', items: [
              { id: 'bk1', label: 'Revenue', value: '$4.2M', prefix: '', suffix: '', trend: 'up', trendValue: '+12%' },
              { id: 'bk2', label: 'Operating Margin', value: '18.2%', prefix: '', suffix: '', trend: 'up', trendValue: '+1.4pp' },
              { id: 'bk3', label: 'Cash & Equivalents', value: '$2.1M', prefix: '', suffix: '', trend: 'up', trendValue: '+8%' },
              { id: 'bk4', label: 'Customer Churn', value: '3.2%', prefix: '', suffix: '', trend: 'up', trendValue: '-0.5pp' },
            ]},
          ],
        },
        {
          id: 'br2', title: 'Operational Update', blocks: [
            { id: 'bo1', type: 'heading', content: 'Operational Highlights', level: 1, align: 'left', color: '' },
            { id: 'bo2', type: 'text', content: 'Product: Version 3.2 launched on schedule. Initial customer adoption exceeding projections by 18%.\n\nSales: New business pipeline reached a 12-month high. Three enterprise deals closed ahead of Q1.\n\nPeople: Headcount grew to 214 FTEs. Key hires completed in Engineering and Customer Success.\n\nOperations: Data centre migration completed Q4, resulting in 23% infrastructure cost reduction.', align: 'left' },
          ],
        },
        {
          id: 'br3', title: 'Financial Review', blocks: [
            { id: 'bf1', type: 'heading', content: 'Financial Review', level: 1, align: 'left', color: '' },
            { id: 'bf2', type: 'table', caption: 'Q4 2025 Financial Summary', headers: ['Metric', 'Budget', 'Actual', 'Variance'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Revenue', bold: true, align: 'left' }, { content: '$3.95M', bold: false, align: 'right' }, { content: '$4.20M', bold: false, align: 'right' }, { content: '+6.3%', bold: false, align: 'right' }],
                [{ content: 'Gross Profit', bold: false, align: 'left' }, { content: '$1.70M', bold: false, align: 'right' }, { content: '$1.80M', bold: false, align: 'right' }, { content: '+5.9%', bold: false, align: 'right' }],
                [{ content: 'Operating Expenses', bold: false, align: 'left' }, { content: '$1.20M', bold: false, align: 'right' }, { content: '$1.16M', bold: false, align: 'right' }, { content: '-3.3%', bold: false, align: 'right' }],
                [{ content: 'EBITDA', bold: true, align: 'left' }, { content: '$500K', bold: false, align: 'right' }, { content: '$640K', bold: false, align: 'right' }, { content: '+28.0%', bold: false, align: 'right' }],
              ],
            },
          ],
        },
        {
          id: 'br4', title: 'Recommendations', blocks: [
            { id: 'brec1', type: 'heading', content: 'Board Recommendations', level: 1, align: 'left', color: '' },
            { id: 'brec2', type: 'text', content: '1. APPROVE the Q1 2026 operating budget as presented\n2. ENDORSE the proposed Series B fundraise process commencing January 2026\n3. NOTE the risk register update, particularly regarding regulatory compliance in EU markets\n4. REVIEW and approve proposed executive compensation changes', align: 'left' },
            { id: 'brec3', type: 'divider', style: 'solid', thickness: 1, color: '' },
            { id: 'brec4', type: 'text', content: 'Next board meeting: [Date TBD] | Prepared by: [Name], CEO', align: 'left' },
          ],
        },
      ],
      designPackId: 'professional-blue',
      pageSize: 'A4',
      headerFooter: { showHeader: true, headerLeft: 'Board Report', headerRight: 'CONFIDENTIAL', showFooter: true, footerLeft: '', footerRight: '', showPageNumbers: true },
      watermark: { enabled: true, text: 'CONFIDENTIAL', opacity: 0.07, rotation: -30 },
      status: 'draft',
    },
  },

  // ── Pitch Deck ─────────────────────────────────────────────────────────
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Investor pitch structure: problem, solution, market, model, traction, ask.',
    category: 'Business',
    emoji: '🚀',
    accentColor: '#DC2626',
    designPackId: 'bold-red',
    data: {
      documentType: 'pitch-deck',
      coverPage: { ...blankCover('Investor Pitch Deck', 'Your Startup', '2025 Series A'), enabled: true, pattern: 'diagonal', primaryColor: '#1a0505', textColor: '#DC2626' },
      pages: [
        {
          id: 'pd1', title: 'The Problem', blocks: [
            { id: 'pp1', type: 'heading', content: 'The Problem', level: 1, align: 'center', color: '' },
            { id: 'pp2', type: 'text', content: 'Describe the core pain point your product solves. Be specific — who experiences this, how often, and what does it cost them (in time, money, or frustration)?', align: 'left' },
            { id: 'pp3', type: 'kpi', title: 'Problem Scale', columns: 3, accentColor: '', items: [
              { id: 'pk1', label: 'Affected Businesses', value: '2.4M+', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'pk2', label: 'Hours Lost per Year', value: '340hrs', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'pk3', label: 'Cost per Business', value: '$28K/yr', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
            ]},
          ],
        },
        {
          id: 'pd2', title: 'Our Solution', blocks: [
            { id: 'ps1', type: 'heading', content: 'Our Solution', level: 1, align: 'center', color: '' },
            { id: 'ps2', type: 'text', content: 'Explain your product or service clearly. Focus on the value it delivers, not just features. What makes your approach unique?', align: 'left' },
          ],
        },
        {
          id: 'pd3', title: 'Market Opportunity', blocks: [
            { id: 'pm1', type: 'heading', content: 'Market Opportunity', level: 1, align: 'center', color: '' },
            { id: 'pm2', type: 'kpi', title: 'Market Size', columns: 3, accentColor: '', items: [
              { id: 'pmk1', label: 'Total Addressable Market', value: '$12B', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'pmk2', label: 'Serviceable Market', value: '$3.2B', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'pmk3', label: 'Target Market', value: '$480M', prefix: '', suffix: '', trend: 'up', trendValue: '+22% CAGR' },
            ]},
            { id: 'pm3', type: 'text', content: 'Describe the market dynamics, tailwinds, and timing. Why is now the right moment for this solution?', align: 'left' },
          ],
        },
        {
          id: 'pd4', title: 'Business Model', blocks: [
            { id: 'pbm1', type: 'heading', content: 'Business Model', level: 1, align: 'center', color: '' },
            { id: 'pbm2', type: 'table', caption: 'Revenue Streams', headers: ['Revenue Stream', 'Pricing', 'Target Customer', 'Stage'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'SaaS Subscription', bold: true, align: 'left' }, { content: '$299–$999/mo', bold: false, align: 'left' }, { content: 'SMB', bold: false, align: 'left' }, { content: 'Live', bold: false, align: 'left' }],
                [{ content: 'Enterprise License', bold: true, align: 'left' }, { content: 'Custom', bold: false, align: 'left' }, { content: 'Enterprise', bold: false, align: 'left' }, { content: 'Q2 2026', bold: false, align: 'left' }],
                [{ content: 'Professional Services', bold: false, align: 'left' }, { content: '$180/hr', bold: false, align: 'left' }, { content: 'All', bold: false, align: 'left' }, { content: 'Live', bold: false, align: 'left' }],
              ],
            },
          ],
        },
        {
          id: 'pd5', title: 'Traction', blocks: [
            { id: 'pt1', type: 'heading', content: 'Traction', level: 1, align: 'center', color: '' },
            { id: 'pt2', type: 'kpi', title: 'Key Metrics', columns: 4, accentColor: '', items: [
              { id: 'ptk1', label: 'ARR', value: '$1.2M', prefix: '', suffix: '', trend: 'up', trendValue: '+18% MoM' },
              { id: 'ptk2', label: 'Customers', value: '148', prefix: '', suffix: '', trend: 'up', trendValue: '+22 this month' },
              { id: 'ptk3', label: 'NRR', value: '122%', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'ptk4', label: 'CAC Payback', value: '7mo', prefix: '', suffix: '', trend: 'up', trendValue: '-2mo' },
            ]},
          ],
        },
        {
          id: 'pd6', title: 'The Ask', blocks: [
            { id: 'pa1', type: 'heading', content: 'The Ask', level: 1, align: 'center', color: '' },
            { id: 'pa2', type: 'kpi', title: 'Raising', columns: 3, accentColor: '', items: [
              { id: 'pak1', label: 'Raising', value: '$5M', prefix: '', suffix: '', trend: 'up', trendValue: 'Series A' },
              { id: 'pak2', label: 'Use of Funds', value: '18 mo', prefix: '', suffix: '', trend: 'up', trendValue: 'runway' },
              { id: 'pak3', label: 'Target Close', value: 'Q2 2026', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
            ]},
            { id: 'pa3', type: 'text', content: 'Allocation of funds: 50% Product & Engineering · 30% Sales & Marketing · 20% Operations & G&A\n\nMilestones: $3M ARR by Q4 2026 · 300+ customers · 3 enterprise accounts', align: 'left' },
            { id: 'pa4', type: 'divider', style: 'solid', thickness: 1, color: '' },
            { id: 'pa5', type: 'text', content: 'Contact: [Your Name] · [email] · [phone]', align: 'center' },
          ],
        },
      ],
      designPackId: 'bold-red',
      pageSize: 'A4',
      headerFooter: { showHeader: false, headerLeft: '', headerRight: '', showFooter: true, footerLeft: 'CONFIDENTIAL — DO NOT DISTRIBUTE', footerRight: '', showPageNumbers: true },
      watermark: emptyWatermark,
      status: 'draft',
    },
  },

  // ── Business Plan ──────────────────────────────────────────────────────
  {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'Full business plan with exec summary, market analysis, and projections.',
    category: 'Business',
    emoji: '📝',
    accentColor: '#0D9080',
    designPackId: 'modern-teal',
    data: {
      documentType: 'business-plan',
      coverPage: { ...blankCover('Business Plan 2025–2028', 'Your Company', 'Confidential'), enabled: true, pattern: 'none', primaryColor: '#0D4F47', textColor: '#FFFFFF' },
      pages: [
        {
          id: 'bp1', title: 'Executive Summary', blocks: [
            { id: 'bpe1', type: 'heading', content: 'Executive Summary', level: 1, align: 'left', color: '' },
            { id: 'bpe2', type: 'text', content: 'Provide a concise 1–2 paragraph overview of your business: what it does, the market opportunity, your competitive advantage, and what you are seeking (funding, partnerships, customers).', align: 'left' },
            { id: 'bpe3', type: 'kpi', title: 'Business at a Glance', columns: 4, accentColor: '', items: [
              { id: 'bpek1', label: 'Founded', value: '2024', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'bpek2', label: 'Stage', value: 'Growth', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'bpek3', label: 'Team Size', value: '22', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'bpek4', label: 'Revenue', value: '$1.8M', prefix: '', suffix: '', trend: 'up', trendValue: 'ARR' },
            ]},
          ],
        },
        {
          id: 'bp2', title: 'Products & Services', blocks: [
            { id: 'bps1', type: 'heading', content: 'Products & Services', level: 1, align: 'left', color: '' },
            { id: 'bps2', type: 'text', content: 'Describe your products or services in detail. What problem does each solve? What is the value proposition? What is the pricing model?', align: 'left' },
            { id: 'bps3', type: 'table', caption: 'Product Portfolio', headers: ['Product/Service', 'Description', 'Price', 'Status'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Core Platform', bold: true, align: 'left' }, { content: 'SaaS subscription product', bold: false, align: 'left' }, { content: '$299/mo', bold: false, align: 'left' }, { content: '✓ Live', bold: false, align: 'left' }],
                [{ content: 'Enterprise Suite', bold: false, align: 'left' }, { content: 'Full-featured enterprise tier', bold: false, align: 'left' }, { content: 'Custom', bold: false, align: 'left' }, { content: 'Q3 2025', bold: false, align: 'left' }],
                [{ content: 'Consulting', bold: false, align: 'left' }, { content: 'Implementation & training', bold: false, align: 'left' }, { content: '$180/hr', bold: false, align: 'left' }, { content: '✓ Live', bold: false, align: 'left' }],
              ],
            },
          ],
        },
        {
          id: 'bp3', title: 'Market Analysis', blocks: [
            { id: 'bpm1', type: 'heading', content: 'Market Analysis', level: 1, align: 'left', color: '' },
            { id: 'bpm2', type: 'text', content: 'Describe the target market: size, growth rate, key segments, customer profile, and buying behaviour. Reference any relevant research or industry reports.', align: 'left' },
            { id: 'bpm3', type: 'heading', content: 'Competitive Landscape', level: 2, align: 'left', color: '' },
            { id: 'bpm4', type: 'table', caption: 'Competitor Comparison', headers: ['Competitor', 'Pricing', 'Key Strength', 'Key Weakness'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Competitor A', bold: false, align: 'left' }, { content: '$$$', bold: false, align: 'left' }, { content: 'Brand recognition', bold: false, align: 'left' }, { content: 'Complex UX', bold: false, align: 'left' }],
                [{ content: 'Competitor B', bold: false, align: 'left' }, { content: '$', bold: false, align: 'left' }, { content: 'Low price', bold: false, align: 'left' }, { content: 'Limited features', bold: false, align: 'left' }],
                [{ content: 'Your Company', bold: true, align: 'left' }, { content: '$$', bold: false, align: 'left' }, { content: 'Ease of use + AI', bold: false, align: 'left' }, { content: 'Newer entrant', bold: false, align: 'left' }],
              ],
            },
          ],
        },
        {
          id: 'bp4', title: 'Financial Projections', blocks: [
            { id: 'bpf1', type: 'heading', content: 'Financial Projections', level: 1, align: 'left', color: '' },
            { id: 'bpf2', type: 'table', caption: 'Three-Year Revenue Projection (USD thousands)', headers: ['Metric', '2025 (A)', '2026 (F)', '2027 (F)', '2028 (F)'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Revenue', bold: true, align: 'left' }, { content: '1,800', bold: false, align: 'right' }, { content: '3,600', bold: false, align: 'right' }, { content: '6,500', bold: false, align: 'right' }, { content: '11,000', bold: false, align: 'right' }],
                [{ content: 'Gross Profit', bold: false, align: 'left' }, { content: '1,260', bold: false, align: 'right' }, { content: '2,520', bold: false, align: 'right' }, { content: '4,875', bold: false, align: 'right' }, { content: '8,800', bold: false, align: 'right' }],
                [{ content: 'Gross Margin', bold: false, align: 'left' }, { content: '70%', bold: false, align: 'right' }, { content: '70%', bold: false, align: 'right' }, { content: '75%', bold: false, align: 'right' }, { content: '80%', bold: false, align: 'right' }],
                [{ content: 'EBITDA', bold: true, align: 'left' }, { content: '-240', bold: false, align: 'right' }, { content: '360', bold: false, align: 'right' }, { content: '1,625', bold: false, align: 'right' }, { content: '3,850', bold: false, align: 'right' }],
              ],
            },
          ],
        },
      ],
      designPackId: 'modern-teal',
      pageSize: 'A4',
      headerFooter: { showHeader: true, headerLeft: 'Business Plan — Confidential', headerRight: '', showFooter: true, footerLeft: '', footerRight: '', showPageNumbers: true },
      watermark: emptyWatermark,
      status: 'draft',
    },
  },

  // ── Project Proposal ───────────────────────────────────────────────────
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Professional proposal with scope, timeline, investment, and terms.',
    category: 'Operations',
    emoji: '📑',
    accentColor: '#475569',
    designPackId: 'minimal-slate',
    data: {
      documentType: 'proposal',
      coverPage: { ...blankCover('Project Proposal', 'Your Company', 'Prepared for: [Client Name]'), enabled: true, pattern: 'grid', primaryColor: '#1E293B', textColor: '#FFFFFF' },
      pages: [
        {
          id: 'pp1', title: 'Project Overview', blocks: [
            { id: 'pro1', type: 'heading', content: 'Project Overview', level: 1, align: 'left', color: '' },
            { id: 'pro2', type: 'text', content: 'Summarise the project: what is being proposed, why it matters to the client, and what outcome they can expect. This section should be written from the client\'s perspective.', align: 'left' },
            { id: 'pro3', type: 'kpi', title: 'Project Summary', columns: 4, accentColor: '', items: [
              { id: 'prok1', label: 'Start Date', value: 'Q1 2026', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'prok2', label: 'Duration', value: '12 weeks', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
              { id: 'prok3', label: 'Team Size', value: '5', prefix: '', suffix: '', trend: 'up', trendValue: 'Specialists' },
              { id: 'prok4', label: 'Total Investment', value: '$48,000', prefix: '', suffix: '', trend: 'neutral', trendValue: '' },
            ]},
          ],
        },
        {
          id: 'pp2', title: 'Scope of Work', blocks: [
            { id: 'psow1', type: 'heading', content: 'Scope of Work', level: 1, align: 'left', color: '' },
            { id: 'psow2', type: 'text', content: 'Describe what is included in the project scope. Be specific to set clear expectations and avoid scope creep. List both what IS included and what is NOT included.', align: 'left' },
            { id: 'psow3', type: 'heading', content: 'Deliverables', level: 2, align: 'left', color: '' },
            { id: 'psow4', type: 'table', caption: '', headers: ['Deliverable', 'Description', 'Due Date'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Discovery & Audit', bold: true, align: 'left' }, { content: 'Current state analysis and requirements', bold: false, align: 'left' }, { content: 'Week 2', bold: false, align: 'left' }],
                [{ content: 'Strategy Document', bold: false, align: 'left' }, { content: 'Recommended approach and roadmap', bold: false, align: 'left' }, { content: 'Week 4', bold: false, align: 'left' }],
                [{ content: 'Implementation', bold: false, align: 'left' }, { content: 'Build and configure the solution', bold: false, align: 'left' }, { content: 'Week 10', bold: false, align: 'left' }],
                [{ content: 'Training & Handover', bold: false, align: 'left' }, { content: 'Team training and documentation', bold: false, align: 'left' }, { content: 'Week 12', bold: false, align: 'left' }],
              ],
            },
          ],
        },
        {
          id: 'pp3', title: 'Investment', blocks: [
            { id: 'pi1', type: 'heading', content: 'Investment', level: 1, align: 'left', color: '' },
            { id: 'pi2', type: 'table', caption: 'Fee Schedule', headers: ['Item', 'Description', 'Hours', 'Rate', 'Total'], striped: true, bordered: true, headerBg: '', headerText: '',
              rows: [
                [{ content: 'Discovery Phase', bold: true, align: 'left' }, { content: 'Audit, interviews, analysis', bold: false, align: 'left' }, { content: '40', bold: false, align: 'right' }, { content: '$180', bold: false, align: 'right' }, { content: '$7,200', bold: false, align: 'right' }],
                [{ content: 'Strategy & Design', bold: false, align: 'left' }, { content: 'Architecture and planning', bold: false, align: 'left' }, { content: '60', bold: false, align: 'right' }, { content: '$180', bold: false, align: 'right' }, { content: '$10,800', bold: false, align: 'right' }],
                [{ content: 'Implementation', bold: false, align: 'left' }, { content: 'Build and configuration', bold: false, align: 'left' }, { content: '120', bold: false, align: 'right' }, { content: '$180', bold: false, align: 'right' }, { content: '$21,600', bold: false, align: 'right' }],
                [{ content: 'Training & Support', bold: false, align: 'left' }, { content: 'Handover and 30-day support', bold: false, align: 'left' }, { content: '48', bold: false, align: 'right' }, { content: '$180', bold: false, align: 'right' }, { content: '$8,640', bold: false, align: 'right' }],
                [{ content: 'TOTAL', bold: true, align: 'left' }, { content: '', bold: false, align: 'left' }, { content: '268', bold: true, align: 'right' }, { content: '', bold: false, align: 'right' }, { content: '$48,240', bold: true, align: 'right' }],
              ],
            },
            { id: 'pi3', type: 'text', content: 'Payment terms: 30% deposit on project commencement, 40% at mid-point milestone, 30% on completion. Expenses billed at cost. Any additional work beyond this scope will be quoted separately and requires written approval.', align: 'left' },
          ],
        },
        {
          id: 'pp4', title: 'Terms & Next Steps', blocks: [
            { id: 'ptn1', type: 'heading', content: 'Terms & Next Steps', level: 1, align: 'left', color: '' },
            { id: 'ptn2', type: 'text', content: 'This proposal is valid for 30 days from the date of issue. Work will commence within 10 business days of receiving a signed agreement and deposit payment.\n\nAll deliverables remain the intellectual property of the client upon full payment. We maintain confidentiality of all client information.\n\nTo proceed, please sign and return the attached agreement with your deposit payment.', align: 'left' },
            { id: 'ptn3', type: 'divider', style: 'solid', thickness: 1, color: '' },
            { id: 'ptn4', type: 'text', content: 'Prepared by: [Your Name] · [Company] · [Email] · [Phone]', align: 'center' },
          ],
        },
      ],
      designPackId: 'minimal-slate',
      pageSize: 'A4',
      headerFooter: { showHeader: true, headerLeft: 'Project Proposal', headerRight: '[Client Name]', showFooter: true, footerLeft: '', footerRight: '', showPageNumbers: true },
      watermark: emptyWatermark,
      status: 'draft',
    },
  },
]

export const TEMPLATE_CATEGORIES = ['All', 'Finance', 'Business', 'Management', 'Operations', 'General']
