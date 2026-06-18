'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { DESIGN_PACKS } from '@/types/report'
import type { ReportData, ReportBlock, DesignPack } from '@/types/report'

const CHART_PALETTE = ['#2D7DD2', '#0D9080', '#DC2626', '#C9A84C', '#a855f7', '#f97316', '#10b981', '#f43f5e']

function getDP(id: string): DesignPack {
  return DESIGN_PACKS.find((d) => d.id === id) ?? DESIGN_PACKS[0]
}

function BlockView({ block, dp }: { block: ReportBlock; dp: DesignPack }) {
  switch (block.type) {
    case 'heading': {
      const Tag = (`h${block.level}`) as 'h1' | 'h2' | 'h3'
      const size = block.level === 1 ? '1.7rem' : block.level === 2 ? '1.25rem' : '1rem'
      const mt = block.level === 1 ? '2rem' : '1.25rem'
      return (
        <Tag style={{ color: dp.headingColor, fontSize: size, fontWeight: 700, marginTop: mt, marginBottom: '0.5rem', textAlign: block.align as 'left' | 'center' | 'right', fontFamily: dp.fontFamily }}>
          {block.content}
        </Tag>
      )
    }
    case 'text':
      return (
        <div style={{ color: dp.textColor, lineHeight: 1.75, marginBottom: '0.75rem', fontFamily: dp.fontFamily, textAlign: block.align as 'left' | 'center' | 'right', whiteSpace: 'pre-wrap' }}>
          {block.content}
        </div>
      )
    case 'table': {
      const colWidth = `${100 / (block.headers.length || 1)}%`
      return (
        <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
          {block.caption && <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem', fontStyle: 'italic' }}>{block.caption}</p>}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', wordBreak: 'break-word', fontSize: '0.8rem', fontFamily: dp.fontFamily }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} style={{ background: dp.tableHeaderBg, color: dp.tableHeaderText, padding: '8px 10px', textAlign: 'left', width: colWidth }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} style={{ background: block.striped && ri % 2 === 1 ? '#F9FAFB' : '#FFF' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '7px 10px', borderBottom: '1px solid #E5E7EB', textAlign: cell.align as 'left' | 'center' | 'right', fontWeight: cell.bold ? 600 : 400, color: dp.textColor }}>
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
    case 'kpi':
      return (
        <div style={{ marginBottom: '1.25rem' }}>
          {block.title && <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{block.title}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns}, 1fr)`, gap: '0.75rem' }}>
            {block.items.map((item) => (
              <div key={item.id} style={{ background: '#F8F9FA', borderRadius: '8px', padding: '12px', border: `1px solid #E5E7EB`, textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: dp.kpiAccent, fontFamily: dp.fontFamily }}>
                  {item.prefix}{item.value}{item.suffix}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>{item.label}</div>
                {item.trendValue && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '4px', color: item.trend === 'up' ? '#059669' : item.trend === 'down' ? '#DC2626' : '#888' }}>
                    {item.trendValue}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    case 'chart': {
      const data = block.labels.map((label, i) => {
        const point: Record<string, string | number> = { name: label }
        block.datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0 })
        return point
      })
      const pieData = block.labels.map((label, i) => ({ name: label, value: block.datasets[0]?.data[i] ?? 0 }))
      const grid = block.showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /> : null
      const xEl = <XAxis dataKey="name" tick={{ fontSize: 10 }} />
      const yEl = <YAxis tick={{ fontSize: 10 }} />
      const tt = <Tooltip />
      const lg = block.showLegend ? <Legend wrapperStyle={{ fontSize: '11px' }} /> : null

      let chart: React.ReactNode
      if (block.chartType === 'pie' || block.chartType === 'donut') {
        chart = (
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={block.chartType === 'donut' ? '50%' : 0} outerRadius="70%" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine>
              {pieData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            {tt}{lg}
          </PieChart>
        )
      } else if (block.chartType === 'bar') {
        chart = <BarChart data={data}>{grid}{xEl}{yEl}{tt}{lg}{block.datasets.map((ds) => <Bar key={ds.id} dataKey={ds.label} fill={ds.color} radius={[2, 2, 0, 0]} />)}</BarChart>
      } else if (block.chartType === 'line') {
        chart = <LineChart data={data}>{grid}{xEl}{yEl}{tt}{lg}{block.datasets.map((ds) => <Line key={ds.id} type="monotone" dataKey={ds.label} stroke={ds.color} strokeWidth={2} dot={{ r: 3 }} />)}</LineChart>
      } else {
        chart = <AreaChart data={data}>{grid}{xEl}{yEl}{tt}{lg}{block.datasets.map((ds) => <Area key={ds.id} type="monotone" dataKey={ds.label} stroke={ds.color} fill={`${ds.color}30`} strokeWidth={2} />)}</AreaChart>
      }
      return (
        <div style={{ marginBottom: '1rem' }}>
          {block.title && <p style={{ fontSize: '0.75rem', fontWeight: 600, color: dp.headingColor, marginBottom: '0.5rem' }}>{block.title}</p>}
          <ResponsiveContainer width="100%" height={block.height}>{chart as React.ReactElement}</ResponsiveContainer>
          {block.sourceFile && <p style={{ fontSize: '0.65rem', color: '#AAA', marginTop: '4px', fontStyle: 'italic' }}>Source: {block.sourceFile}</p>}
        </div>
      )
    }
    case 'image':
      return block.url ? (
        <div style={{ textAlign: block.align as 'left' | 'center' | 'right', marginBottom: '1rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} style={{ maxWidth: block.width === 'small' ? '200px' : block.width === 'medium' ? '380px' : block.width === 'large' ? '580px' : '100%', borderRadius: '4px' }} />
          {block.caption && <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>{block.caption}</p>}
        </div>
      ) : null
    case 'divider':
      return <hr style={{ border: 'none', borderTop: `${block.thickness}px ${block.style} ${block.color || dp.primaryColor}`, margin: '1.25rem 0' }} />
    case 'spacer':
      return <div style={{ height: `${block.height}px` }} />
    default:
      return null
  }
}

export default function SharedReportView({ report, reportName, shareId }: { report: ReportData; reportName: string; shareId: string }) {
  const dp = getDP(report.designPackId)
  const coverPage = report.coverPage

  return (
    <div style={{ fontFamily: dp.fontFamily, background: '#F0F2F5', minHeight: '100vh' }}>
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: dp.primaryColor, padding: '0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
              <Image src="/logoface.png" alt="BrandFox" width={24} height={24} style={{ objectFit: 'contain' }} />
              <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.02em' }}>BrandFox</span>
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {reportName}
            </span>
          </div>
          <Link
            href="/login"
            style={{ background: '#C9A84C', color: '#000', padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Create Free Report
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Cover page */}
        {coverPage.enabled && (
          <div
            style={{
              background: coverPage.primaryColor || dp.primaryColor,
              borderRadius: '12px',
              marginBottom: '24px',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '320px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            {coverPage.backgroundImageUrl && (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${coverPage.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            {coverPage.backgroundImageUrl && (
              <div style={{ position: 'absolute', inset: 0, background: `${coverPage.primaryColor || dp.primaryColor}CC` }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, padding: '48px 48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '320px', color: coverPage.textColor || '#FFF' }}>
              {coverPage.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPage.logoUrl} alt="Logo" style={{ position: 'absolute', top: '32px', left: '48px', maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
              )}
              {coverPage.companyName && (
                <p style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7, marginBottom: '20px' }}>{coverPage.companyName}</p>
              )}
              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '10px' }}>
                {coverPage.reportTitle || 'Report'}
              </h1>
              {coverPage.subtitle && <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '6px' }}>{coverPage.subtitle}</p>}
              {coverPage.date && <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '16px' }}>{coverPage.date}</p>}
            </div>
          </div>
        )}

        {/* Pages */}
        {report.pages.map((page) => (
          <div
            key={page.id}
            style={{
              background: '#FFF',
              borderRadius: '10px',
              padding: '40px 48px',
              marginBottom: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${dp.primaryColor}`,
            }}
          >
            <p style={{ fontSize: '0.65rem', color: dp.primaryColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px', opacity: 0.7 }}>
              {page.title}
            </p>
            {page.blocks.map((block) => (
              <BlockView key={block.id} block={block} dp={dp} />
            ))}
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{ background: '#1C0D03', padding: '48px 20px', textAlign: 'center' }}>
        <Image src="/logoface.png" alt="BrandFox" width={40} height={40} style={{ objectFit: 'contain', margin: '0 auto 12px' }} />
        <h3 style={{ color: '#C9A84C', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Create beautiful reports with BrandFox</h3>
        <p style={{ color: '#7A6A50', fontSize: '0.8rem', marginBottom: '20px' }}>Financial reports, pitch decks, proposals — all in one tool.</p>
        <Link
          href="/login"
          style={{ background: '#C9A84C', color: '#000', padding: '10px 24px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
        >
          Get Started Free
        </Link>
        <p style={{ color: '#4A3A2A', fontSize: '0.7rem', marginTop: '24px' }}>
          Shared via BrandFox · ID: {shareId.slice(0, 8)}
        </p>
      </div>
    </div>
  )
}
