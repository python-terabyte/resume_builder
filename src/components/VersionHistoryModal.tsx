'use client'

import { useState, useEffect, useCallback } from 'react'
import { listVersions, restoreVersion } from '@/lib/collaboration'
import type { VersionRecord } from '@/types/collaboration'

interface Props {
  docId: string
  docName: string
  canEdit: boolean
  onClose: () => void
  onRestored?: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export default function VersionHistoryModal({ docId, docName, canEdit, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionRecord[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null)
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listVersions(docId)
      setVersions(data)
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => { void load() }, [load])

  async function handleRestore(versionId: string) {
    setRestoringId(versionId)
    setError(null)
    try {
      await restoreVersion(docId, versionId)
      setRestoreSuccess(true)
      setRestoreConfirmId(null)
      onRestored?.()
      setTimeout(() => setRestoreSuccess(false), 3000)
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Restore failed')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-white/10 bg-[#1E1108] shadow-2xl" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Version History</h2>
            <p className="mt-0.5 truncate text-xs text-slate-400">{docName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 panel-scroll">
          {restoreSuccess && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Version restored successfully.
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {!loading && versions && versions.length === 0 && (
            <div className="py-8 text-center">
              <svg className="mx-auto mb-3 h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-400">No versions saved yet.</p>
              <p className="mt-1 text-xs text-slate-600">Versions are created automatically each time you save.</p>
            </div>
          )}

          {!loading && versions && versions.length > 0 && (
            <div className="space-y-1">
              {versions.map((v, idx) => (
                <div key={v.id}>
                  <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                      idx === 0 ? 'border border-accent/20 bg-accent/5' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">v{v.versionNumber}</span>
                        {idx === 0 && (
                          <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(v.savedAt)} · {v.savedByEmail} · {formatSize(v.size)}
                      </p>
                    </div>

                    {canEdit && idx > 0 && (
                      restoreConfirmId === v.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setRestoreConfirmId(null)}
                            className="rounded px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRestore(v.id)}
                            disabled={restoringId === v.id}
                            className="rounded bg-accent/20 px-2 py-1 text-[10px] font-semibold text-accent transition hover:bg-accent/30 disabled:opacity-50"
                          >
                            {restoringId === v.id ? '…' : 'Confirm'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRestoreConfirmId(v.id)}
                          className="rounded px-2 py-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                          Restore
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-[11px] text-slate-600">
            Versions are saved automatically on each save. Up to 30 versions are retained per document.
          </p>
        </div>
      </div>
    </div>
  )
}
