import type {
  CollaboratorRole,
  DocumentCollabInfo,
  InvitationRecord,
  VersionRecord,
  DocumentType,
} from '@/types/collaboration'

export async function getDocumentCollabInfo(docId: string): Promise<DocumentCollabInfo> {
  const res = await fetch(`/api/documents/${docId}`)
  if (!res.ok) throw new Error('Failed to load collaboration info')
  return res.json() as Promise<DocumentCollabInfo>
}

export async function shareDocument(
  docId: string,
  email: string,
  role: CollaboratorRole,
): Promise<{ invited: boolean; added: boolean; updated?: boolean }> {
  const res = await fetch(`/api/documents/${docId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to share document')
  }
  return res.json() as Promise<{ invited: boolean; added: boolean; updated?: boolean }>
}

export async function updateCollaboratorRole(
  docId: string,
  uid: string,
  role: CollaboratorRole,
): Promise<void> {
  const res = await fetch(`/api/documents/${docId}/collaborators/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) throw new Error('Failed to update role')
}

export async function removeCollaborator(docId: string, uid: string): Promise<void> {
  const res = await fetch(`/api/documents/${docId}/collaborators/${uid}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to remove collaborator')
}

export async function revokeInvitation(docId: string, invitationId: string): Promise<void> {
  const res = await fetch(`/api/documents/${docId}/invitations/${invitationId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to revoke invitation')
}

export async function duplicateDocument(docId: string): Promise<{ id: string; name: string; type: DocumentType }> {
  const res = await fetch(`/api/documents/${docId}/duplicate`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to duplicate document')
  }
  return res.json() as Promise<{ id: string; name: string; type: DocumentType }>
}

export async function transferOwnership(docId: string, newOwnerUid: string): Promise<void> {
  const res = await fetch(`/api/documents/${docId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newOwnerUid }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to transfer ownership')
  }
}

export async function listVersions(docId: string): Promise<VersionRecord[]> {
  const res = await fetch(`/api/documents/${docId}/versions`)
  if (!res.ok) throw new Error('Failed to load version history')
  return res.json() as Promise<VersionRecord[]>
}

export async function restoreVersion(docId: string, versionId: string): Promise<void> {
  const res = await fetch(`/api/documents/${docId}/versions/${versionId}/restore`, {
    method: 'POST',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to restore version')
  }
}

export interface SharedDocEntry {
  docId: string
  type: DocumentType
  name: string
  ownerEmail: string
  role: CollaboratorRole
  updatedAt: string | null
}

export async function listSharedDocuments(): Promise<SharedDocEntry[]> {
  const res = await fetch('/api/documents/shared')
  if (!res.ok) throw new Error('Failed to load shared documents')
  return res.json() as Promise<SharedDocEntry[]>
}

export async function getPendingInvitations(): Promise<InvitationRecord[]> {
  const res = await fetch('/api/documents/notifications')
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json() as Promise<InvitationRecord[]>
}

export async function acceptInvitation(token: string): Promise<{ docId: string; type: DocumentType }> {
  const res = await fetch(`/api/documents/invitations/${token}/accept`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? 'Failed to accept invitation')
  }
  return res.json() as Promise<{ docId: string; type: DocumentType }>
}

export async function updateAllowCopy(docId: string, allowCopy: boolean): Promise<void> {
  const res = await fetch(`/api/documents/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allowCopy }),
  })
  if (!res.ok) throw new Error('Failed to update copy permission')
}
