'use client'

import { useEffect, useState } from 'react'
import { deleteResume, listResumes, renameResume, type ResumeDoc } from '@/lib/resumes'

interface Props {
  currentDocId: string | null
  onOpen: (doc: ResumeDoc) => void
  onClose: () => void
  onCreateNew: () => void
}

export default function DocumentsPanel({ currentDocId, onOpen, onClose, onCreateNew }: Props) {
  const [docs, setDocs] = useState<ResumeDoc[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  useEffect(() => {
    let cancelled = false
    setError(null)
    listResumes()
      .then((list) => { if (!cancelled) setDocs(list) })
      .catch((err) => {
        if (cancelled) return
        setError((err as Error).message ?? 'Failed to load.')
      })
    return () => { cancelled = true }
  }, [])

  async function handleDelete(docId: string) {
    if (!confirm('Delete this resume? This cannot be undone.')) return
    try {
      await deleteResume(docId)
      setDocs((prev) => (prev ? prev.filter((d) => d.id !== docId) : prev))
    } catch (err) {
      setError((err as Error).message ?? 'Delete failed.')
    }
  }

  async function commitRename(docId: string) {
    const trimmed = renameText.trim()
    if (!trimmed) { setRenamingId(null); return }
    try {
      await renameResume(docId, trimmed)
      setDocs((prev) => (prev ? prev.map((d) => (d.id === docId ? { ...d, name: trimmed } : d)) : prev))
    } catch (err) {
      setError((err as Error).message ?? 'Rename failed.')
    } finally {
      setRenamingId(null)
    }
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-bold text-white">My Resumes</h2>
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
          <button
            onClick={onCreateNew}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/20 py-3 text-sm font-medium text-slate-300 transition hover:border-accent hover:text-accent"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Resume
          </button>

          {error && (
            <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {!docs && <p className="text-sm text-slate-500">Loading...</p>}

          {docs && docs.length === 0 && !error && (
            <p className="text-sm text-slate-500">No saved resumes yet. Click <span className="text-white">New Resume</span> above to start.</p>
          )}

          {docs && docs.length > 0 && (
            <div className="flex flex-col gap-2">
              {docs.map((d) => {
                const isCurrent = d.id === currentDocId
                const isRenaming = renamingId === d.id
                return (
                  <div
                    key={d.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                      isCurrent
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 bg-[#120B07] hover:border-white/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          onBlur={() => commitRename(d.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(d.id)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          className="w-full rounded-md border border-white/10 bg-[#120B07] px-2 py-1 text-sm text-white outline-none focus:border-accent"
                        />
                      ) : (
                        <button
                          onClick={() => onOpen(d)}
                          className="block w-full truncate text-left text-sm font-semibold text-white hover:text-accent"
                          title="Open"
                        >
                          {d.name || 'Untitled'}
                          {isCurrent && <span className="ml-2 text-[10px] text-accent">· current</span>}
                        </button>
                      )}
                      <div className="text-[11px] text-slate-500">
                        {formatTimestamp(d.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => { setRenamingId(d.id); setRenameText(d.name) }}
                      title="Rename"
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      title="Delete"
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `Updated ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
