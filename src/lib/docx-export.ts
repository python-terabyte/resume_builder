import type { ReportData, DesignPack } from '@/types/report'

function getDesignPackLocal(id: string, PACKS: DesignPack[]): DesignPack {
  return PACKS.find((d) => d.id === id) ?? PACKS[0]
}

export async function exportToDocx(report: ReportData, docName: string) {
  const {
    Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle, Packer,
    Header, Footer, PageNumber, NumberFormat,
  } = await import('docx')

  const { DESIGN_PACKS } = await import('@/types/report')
  const dp = getDesignPackLocal(report.designPackId, DESIGN_PACKS as DesignPack[])

  type DocChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>

  const headerChildren: InstanceType<typeof Paragraph>[] = []
  const footerChildren: InstanceType<typeof Paragraph>[] = []

  if (report.headerFooter.showHeader) {
    headerChildren.push(
      new Paragraph({
        children: [
          ...(report.headerFooter.headerLeft ? [new TextRun({ text: report.headerFooter.headerLeft })] : []),
          new TextRun({ text: '\t' }),
          ...(report.headerFooter.headerRight ? [new TextRun({ text: report.headerFooter.headerRight })] : []),
        ],
        tabStops: [{ type: 'right', position: 9000 }],
      })
    )
  }

  if (report.headerFooter.showFooter || report.headerFooter.showPageNumbers) {
    footerChildren.push(
      new Paragraph({
        children: [
          ...(report.headerFooter.footerLeft ? [new TextRun({ text: report.headerFooter.footerLeft })] : []),
          new TextRun({ text: '\t' }),
          ...(report.headerFooter.showPageNumbers
            ? [new TextRun({ children: [PageNumber.CURRENT] }), new TextRun({ text: ' / ' }), new TextRun({ children: [PageNumber.TOTAL_PAGES] })]
            : []),
        ],
        tabStops: [{ type: 'right', position: 9000 }],
      })
    )
  }

  const bodyChildren: DocChild[] = []

  function addText(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; align?: string } = {}): void {
    if (!text) return
    const alignment = opts.align === 'center' ? AlignmentType.CENTER
      : opts.align === 'right' ? AlignmentType.RIGHT
      : AlignmentType.LEFT
    for (const line of text.split('\n')) {
      bodyChildren.push(
        new Paragraph({
          alignment,
          children: [new TextRun({
            text: line,
            bold: opts.bold,
            italics: opts.italic,
            size: opts.size,
            color: opts.color?.replace('#', ''),
          })],
          spacing: { after: 100 },
        })
      )
    }
  }

  // ── Cover page ────────────────────────────────────────────────────────────
  if (report.coverPage.enabled) {
    if (report.coverPage.companyName) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: report.coverPage.companyName, bold: true, size: 20, allCaps: true, color: '666666' })],
        spacing: { before: 2400, after: 400 },
        alignment: AlignmentType.LEFT,
      }))
    }
    bodyChildren.push(new Paragraph({
      children: [new TextRun({ text: report.coverPage.reportTitle || 'Report', bold: true, size: 52 })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    }))
    if (report.coverPage.subtitle) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: report.coverPage.subtitle, size: 28, color: '555555' })],
        spacing: { after: 200 },
      }))
    }
    if (report.coverPage.date) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: report.coverPage.date, size: 20, color: '888888' })],
        spacing: { after: 600 },
      }))
    }
    // Page break
    bodyChildren.push(new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }))
  }

  // ── Pages ─────────────────────────────────────────────────────────────────
  for (let pi = 0; pi < report.pages.length; pi++) {
    const page = report.pages[pi]

    // Page break between pages (not before first page if no cover)
    if (pi > 0 || report.coverPage.enabled) {
      bodyChildren.push(new Paragraph({
        children: [new TextRun({ text: '', break: 1 })],
        pageBreakBefore: true,
      }))
    }

    for (const block of page.blocks) {
      switch (block.type) {
        case 'heading': {
          const level = block.level === 1 ? HeadingLevel.HEADING_1
            : block.level === 2 ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3
          const size = block.level === 1 ? 32 : block.level === 2 ? 26 : 22
          const align = block.align === 'center' ? AlignmentType.CENTER
            : block.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT
          bodyChildren.push(new Paragraph({
            heading: level,
            alignment: align,
            children: [new TextRun({ text: block.content, bold: true, size, color: dp.headingColor.replace('#', '') })],
            spacing: { before: 240, after: 120 },
          }))
          break
        }
        case 'text': {
          const align = block.align === 'center' ? AlignmentType.CENTER
            : block.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT
          for (const line of block.content.split('\n')) {
            bodyChildren.push(new Paragraph({
              alignment: align,
              children: [new TextRun({ text: line, color: dp.textColor.replace('#', '') })],
              spacing: { after: 80 },
            }))
          }
          break
        }
        case 'table': {
          if (block.caption) addText(block.caption, { italic: true, size: 18 })
          const tableRows: InstanceType<typeof TableRow>[] = [
            // Header row
            new TableRow({
              tableHeader: true,
              children: block.headers.map((h) => new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: h, bold: true, color: dp.tableHeaderText.replace('#', '') })],
                })],
                shading: { fill: dp.tableHeaderBg.replace('#', '') },
              })),
            }),
            ...block.rows.map((row) => new TableRow({
              children: row.map((cell) => new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: cell.content, bold: cell.bold })],
                  alignment: cell.align === 'right' ? AlignmentType.RIGHT
                    : cell.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                })],
              })),
            })),
          ]
          bodyChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }))
          bodyChildren.push(new Paragraph({ text: '', spacing: { after: 160 } }))
          break
        }
        case 'kpi': {
          if (block.title) addText(block.title, { bold: true, size: 22 })
          // Render KPIs as a simple table row
          bodyChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: block.items.map((item) => new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: `${item.prefix}${item.value}${item.suffix}`, bold: true, size: 28, color: dp.kpiAccent.replace('#', '') })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: item.label, size: 18 })],
                    }),
                    ...(item.trendValue ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: item.trendValue, size: 16, color: item.trend === 'up' ? '059669' : item.trend === 'down' ? 'DC2626' : '888888' })],
                    })] : []),
                  ],
                })),
              }),
            ],
          }))
          bodyChildren.push(new Paragraph({ text: '', spacing: { after: 160 } }))
          break
        }
        case 'image':
          addText(block.caption ? `[Image: ${block.caption}]` : '[Image]', { italic: true, color: '#888888' })
          break
        case 'chart':
          addText(`[Chart: ${block.title || block.chartType}]`, { italic: true, color: '#888888' })
          break
        case 'divider':
          bodyChildren.push(new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: dp.primaryColor.replace('#', '') } },
            spacing: { before: 160, after: 160 },
            children: [],
          }))
          break
        case 'spacer':
          bodyChildren.push(new Paragraph({ text: '', spacing: { after: block.height ?? 80 } }))
          break
      }
    }
  }

  const doc = new Document({
    title: docName,
    numbering: { config: [{ reference: 'default', levels: [] }] },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
        titlePage: report.coverPage.enabled,
      },
      headers: headerChildren.length > 0 ? { default: new Header({ children: headerChildren }) } : undefined,
      footers: footerChildren.length > 0 ? { default: new Footer({ children: footerChildren }) } : undefined,
      children: bodyChildren,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${docName.replace(/[^\w\s-]/g, '').trim() || 'report'}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
