'use client'

import { useEffect, useState } from 'react'
import { deleteResume, listResumes, renameResume, type ResumeDoc } from '@/lib/resumes'
import { duplicateDocument, listSharedDocuments, type SharedDocEntry } from '@/lib/collaboration'
import { ROLE_LABELS } from '@/types/collaboration'
import ShareModal from './ShareModal'

interface Props {
  currentDocId: string | null
  onOpen: (doc: ResumeDoc) => void
  onClose: () => void
  onCreateNew: () => void
  onOpenShared?: (docId: string) => void
}

type ActiveTab = 'mine' | 'shared'

export default function DocumentsPanel({ currentDocId, onOpen, onClose, onCreateNew, onOpenShared }: Props) {
  const [docs, setDocs] = useState<ResumeDoc[] | null>(null)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [sharedDocs, setSharedDocs] = useState<SharedDocEntry[] | null>(null)
  const [sharedError, setSharedError] = useState<string | null>(null)
  const [tab, setTab] = useState<ActiveTab>('mine')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [shareDocId, setShareDocId] = useState<string | null>(null)
  const [shareDocName, setShareDocName] = useState('')
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Load independently so a shared-endpoint failure doesn't break My Resumes
    listResumes()
      .then((own) => { if (!cancelled) setDocs(own) })
      .catch((err) => { if (!cancelled) setDocsError((err as Error).message ?? 'Failed to load resumes.') })

    listSharedDocuments()
      .then((all) => { if (!cancelled) setSharedDocs(all.filter((d) => d.type === 'resume')) })
      .catch((err) => { if (!cancelled) setSharedError((err as Error).message ?? 'Failed to load shared resumes.') })

    return () => { cancelled = true }
  }, [])

  async function handleDelete(docId: string) {
    try {
      await deleteResume(docId)
      setDocs((prev) => (prev ? prev.filter((d) => d.id !== docId) : prev))
      setDeleteConfirmId(null)
    } catch (err) {
      setDocsError((err as Error).message ?? 'Delete failed.')
      setDeleteConfirmId(null)
    }
  }

  async function handleDuplicate(docId: string) {
    if (duplicating) return
    setDuplicating(docId)
    try {
      const result = await duplicateDocument(docId)
      const updated = await listResumes()
      setDocs(updated)
      onOpenShared?.(result.id)
    } catch (err) {
      setDocsError((err as Error).message ?? 'Duplicate failed.')
    } finally {
      setDuplicating(null)
    }
  }

  async function commitRename(docId: string) {
    const trimmed = renameText.trim()
    if (!trimmed) { setRenamingId(null); return }
    try {
      await renameResume(docId, trimmed)
      setDocs((prev) => (prev ? prev.map((d) => (d.id === docId ? { ...d, name: trimmed } : d)) : prev))
    } catch (err) {
      setDocsError((err as Error).message ?? 'Rename failed.')
    } finally {
      setRenamingId(null)
    }
  }

  const sharedResumeCount = sharedDocs?.length ?? 0

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#2D1B11] shadow-2xl" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-bold text-white">Resumes</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 px-5 pt-2">
          <button
            onClick={() => setTab('mine')}
            className={`px-3 py-2 text-xs font-medium transition ${
              tab === 'mine' ? 'border-b-2 border-accent text-accent' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Resumes
          </button>
          <button
            onClick={() => setTab('shared')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${
              tab === 'shared' ? 'border-b-2 border-accent text-accent' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shared With Me
            {sharedResumeCount > 0 && (
              <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                {sharedResumeCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 panel-scroll">

          {/* MY RESUMES TAB */}
          {tab === 'mine' && (
            <>
              <button
                onClick={onCreateNew}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-white/20 py-3 text-sm font-medium text-slate-300 transition hover:border-accent hover:text-accent"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Resume
              </button>

              {docsError && (
                <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {docsError}
                </div>
              )}

              {!docs && !docsError && <p className="text-sm text-slate-500">Loading...</p>}

              {docs && docs.length === 0 && (
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

                        {/* Share button */}
                        <button
                          onClick={() => { setShareDocId(d.id); setShareDocName(d.name || 'Untitled') }}
                          title="Share"
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>

                        {/* Duplicate button */}
                        <button
                          onClick={() => handleDuplicate(d.id)}
                          disabled={!!duplicating}
                          title="Duplicate"
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                        >
                          {duplicating === d.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>

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
                          onClick={() => setDeleteConfirmId(d.id)}
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
            </>
          )}

          {/* SHARED WITH ME TAB */}
          {tab === 'shared' && (
            <>
              {sharedError && (
                <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {sharedError}
                </div>
              )}

              {!sharedDocs && !sharedError && <p className="text-sm text-slate-500">Loading...</p>}

              {sharedDocs && sharedDocs.length === 0 && (
                <div className="py-8 text-center">
                  <svg className="mx-auto mb-3 h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <p className="text-sm text-slate-400">No shared resumes yet.</p>
                  <p className="mt-1 text-xs text-slate-600">When someone shares a resume with you, it will appear here.</p>
                </div>
              )}

              {sharedDocs && sharedDocs.length > 0 && (
                <div className="flex flex-col gap-2">
                  {sharedDocs.map((d) => (
                    <div
                      key={d.docId}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                        d.docId === currentDocId
                          ? 'border-accent bg-accent/10'
                          : 'border-white/10 bg-[#120B07] hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => onOpenShared?.(d.docId)}
                          className="block w-full truncate text-left text-sm font-semibold text-white hover:text-accent"
                        >
                          {d.name || 'Untitled'}
                          {d.docId === currentDocId && <span className="ml-2 text-[10px] text-accent">· current</span>}
                        </button>
                        <div className="text-[11px] text-slate-500">
                          By {d.ownerEmail} · {formatTimestamp(d.updatedAt)}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        {ROLE_LABELS[d.role]}
                      </span>
                      {/* Duplicate to my resumes */}
                      <button
                        onClick={() => handleDuplicate(d.docId)}
                        disabled={!!duplicating}
                        title="Duplicate to my resumes"
                        className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                      >
                        {duplicating === d.docId ? (
                          <div className="h-4 w-4 animate-spin rounded-full border border-slate-400 border-t-transparent" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#2D1B11] p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-bold text-white">Delete this document?</h3>
            <p className="mb-6 text-sm text-slate-400">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-lg bg-red-500/20 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareDocId && (
        <ShareModal
          docId={shareDocId}
          docName={shareDocName}
          onClose={() => setShareDocId(null)}
        />
      )}
    </div>
  )
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `Updated ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
