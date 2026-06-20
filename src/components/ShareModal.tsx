'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getDocumentCollabInfo,
  shareDocument,
  updateCollaboratorRole,
  removeCollaborator,
  revokeInvitation,
  transferOwnership,
  updateAllowCopy,
} from '@/lib/collaboration'
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  roleToPermissions,
  type DocumentCollabInfo,
  type CollaboratorRole,
  type CollaboratorRecord,
  type InvitationRecord,
} from '@/types/collaboration'
import { useAuth } from '@/lib/AuthContext'

interface Props {
  docId: string
  docName: string
  onClose: () => void
}

type Tab = 'people' | 'settings'

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: CollaboratorRole
  onChange: (role: CollaboratorRole) => void
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CollaboratorRole)}
        className="appearance-none rounded-lg border border-white/10 bg-[#1A0F08] px-3 py-2 pr-8 text-xs text-white outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r} value={r} className="bg-[#1A0F08]">
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function Avatar({ name, email }: { name?: string; email: string }) {
  const letter = (name || email)[0]?.toUpperCase() ?? '?'
  const colors = ['bg-amber-700', 'bg-teal-700', 'bg-purple-700', 'bg-blue-700', 'bg-rose-700']
  const color = colors[email.charCodeAt(0) % colors.length]
  return (
    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${color} text-xs font-bold text-white`}>
      {letter}
    </div>
  )
}

export default function ShareModal({ docId, docName, onClose }: Props) {
  const { user } = useAuth()
  const [info, setInfo] = useState<DocumentCollabInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('people')

  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('editor')
  const [sharing, setSharing] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)
  const [transferring, setTransferring] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDocumentCollabInfo(docId)
      setInfo(data)
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => { void load() }, [load])

  async function handleShare() {
    if (!email.trim()) return
    setSharing(true)
    setShareMsg(null)
    setShareError(null)
    try {
      const result = await shareDocument(docId, email.trim(), inviteRole)
      if (result.updated) setShareMsg(`${email} role updated.`)
      else if (result.added) setShareMsg(`${email} added as ${ROLE_LABELS[inviteRole]}.`)
      else setShareMsg(`Invitation sent to ${email}.`)
      setEmail('')
      await load()
    } catch (err) {
      setShareError((err as Error).message ?? 'Share failed')
    } finally {
      setSharing(false)
    }
  }

  async function handleRoleChange(uid: string, role: CollaboratorRole) {
    try {
      await updateCollaboratorRole(docId, uid, role)
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Failed to update role')
    }
  }

  async function handleRemove(uid: string) {
    try {
      await removeCollaborator(docId, uid)
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Failed to remove')
    }
  }

  async function handleRevokeInvitation(id: string) {
    try {
      await revokeInvitation(docId, id)
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Failed to revoke')
    }
  }

  async function handleTransfer() {
    if (!transferTarget) return
    setTransferring(true)
    try {
      await transferOwnership(docId, transferTarget)
      setShowTransferConfirm(false)
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  async function handleAllowCopyToggle() {
    if (!info) return
    try {
      await updateAllowCopy(docId, !info.allowCopy)
      setInfo((prev) => prev ? { ...prev, allowCopy: !prev.allowCopy } : prev)
    } catch (err) {
      setError((err as Error).message ?? 'Failed to update')
    }
  }

  const canManage = info?.myPermissions.canManagePermissions ?? false
  const canShare = info?.myPermissions.canShare ?? false
  const isOwner = info?.myRole === 'owner'

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#1E1108] shadow-2xl" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Share document</h2>
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

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 px-5 pt-3">
          {(['people', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium capitalize transition ${
                tab === t
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'people' ? 'People' : 'Settings'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 panel-scroll">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {!loading && info && tab === 'people' && (
            <div className="space-y-5">
              {/* Add people */}
              {(canShare || canManage) && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-300">Add people</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                      className="flex-1 rounded-lg border border-white/10 bg-[#120B07] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-accent"
                    />
                    <RoleSelect value={inviteRole} onChange={setInviteRole} />
                    <button
                      onClick={handleShare}
                      disabled={sharing || !email.trim()}
                      className="rounded-lg bg-accent/20 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sharing ? '...' : 'Share'}
                    </button>
                  </div>
                  {shareMsg && <p className="mt-1.5 text-xs text-emerald-400">{shareMsg}</p>}
                  {shareError && <p className="mt-1.5 text-xs text-red-400">{shareError}</p>}

                  {/* Role descriptions */}
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {ROLE_DESCRIPTIONS[inviteRole]}
                  </p>
                </div>
              )}

              {/* People with access */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">People with access</p>
                <div className="space-y-1">
                  {/* Owner row */}
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <Avatar email={info.ownerEmail} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {info.ownerEmail === user?.email ? 'You' : info.ownerEmail}
                      </p>
                    </div>
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      Owner
                    </span>
                  </div>

                  {/* Collaborator rows */}
                  {info.collaborators.map((c: CollaboratorRecord) => (
                    <div key={c.uid} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/5">
                      <Avatar email={c.email} name={c.displayName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {c.email === user?.email ? 'You' : (c.displayName || c.email)}
                        </p>
                        {c.displayName && <p className="text-[11px] text-slate-500">{c.email}</p>}
                      </div>
                      {canManage ? (
                        <div className="flex items-center gap-1">
                          <RoleSelect
                            value={c.role}
                            onChange={(role) => handleRoleChange(c.uid, role)}
                          />
                          <button
                            onClick={() => handleRemove(c.uid)}
                            title="Remove"
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{ROLE_LABELS[c.role]}</span>
                      )}
                    </div>
                  ))}

                  {/* Pending invitations */}
                  {info.pendingInvitations.map((inv: InvitationRecord) => (
                    <div key={inv.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 opacity-70 transition hover:bg-white/5 hover:opacity-100">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 text-slate-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-300">{inv.email}</p>
                        <p className="text-[11px] text-slate-500">Invitation pending</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{ROLE_LABELS[inv.role]}</span>
                        {canManage && (
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            title="Revoke invitation"
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {info.collaborators.length === 0 && info.pendingInvitations.length === 0 && (
                    <p className="py-3 text-center text-xs text-slate-500">Only you have access to this document.</p>
                  )}
                </div>
              </div>

              {/* Transfer Ownership */}
              {isOwner && info.collaborators.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-400">Transfer ownership</p>
                  {!showTransferConfirm ? (
                    <div className="flex gap-2">
                      <select
                        value={transferTarget ?? ''}
                        onChange={(e) => setTransferTarget(e.target.value || null)}
                        className="flex-1 appearance-none rounded-lg border border-white/10 bg-[#120B07] px-3 py-2 text-xs text-white outline-none focus:border-accent"
                      >
                        <option value="" className="bg-[#120B07]">Select collaborator…</option>
                        {info.collaborators.map((c) => (
                          <option key={c.uid} value={c.uid} className="bg-[#120B07]">
                            {c.displayName || c.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => transferTarget && setShowTransferConfirm(true)}
                        disabled={!transferTarget}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        Transfer
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="mb-3 text-xs text-amber-300">
                        You are transferring ownership. You will become a Manager and lose owner privileges. This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowTransferConfirm(false)}
                          className="flex-1 rounded-md border border-white/10 bg-white/5 py-1.5 text-xs text-white transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleTransfer}
                          disabled={transferring}
                          className="flex-1 rounded-md bg-amber-500/20 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-50"
                        >
                          {transferring ? 'Transferring…' : 'Confirm Transfer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && info && tab === 'settings' && (
            <div className="space-y-4">
              {/* My role info */}
              <div className="rounded-lg border border-white/10 bg-[#120B07] p-3">
                <p className="mb-1 text-xs font-medium text-slate-400">Your access</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {ROLE_LABELS[info.myRole]}
                  </span>
                  <span className="text-xs text-slate-400">— {ROLE_DESCRIPTIONS[info.myRole]}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {(Object.entries(roleToPermissions(info.myRole)) as [string, boolean][]).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5 text-[11px]">
                      <div className={`h-1.5 w-1.5 rounded-full ${val ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span className={val ? 'text-slate-300' : 'text-slate-600'}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^can /, '').toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allow copy setting */}
              {canManage && (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#120B07] p-3">
                  <div>
                    <p className="text-xs font-medium text-white">Allow duplicating</p>
                    <p className="text-[11px] text-slate-500">Collaborators with copy permission can duplicate this document</p>
                  </div>
                  <button
                    onClick={handleAllowCopyToggle}
                    className={`relative h-5 w-9 rounded-full transition-colors ${info.allowCopy ? 'bg-accent' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${info.allowCopy ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}

              {/* Document info */}
              <div className="rounded-lg border border-white/10 bg-[#120B07] p-3">
                <p className="mb-2 text-xs font-medium text-slate-400">Document info</p>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500">
                    <span className="text-slate-300">Type</span> — {info.type === 'resume' ? 'Resume' : 'Report'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    <span className="text-slate-300">Owner</span> — {info.ownerEmail}
                  </p>
                  {info.createdAt && (
                    <p className="text-[11px] text-slate-500">
                      <span className="text-slate-300">Created</span> — {new Date(info.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  {info.updatedAt && (
                    <p className="text-[11px] text-slate-500">
                      <span className="text-slate-300">Last updated</span> — {new Date(info.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
