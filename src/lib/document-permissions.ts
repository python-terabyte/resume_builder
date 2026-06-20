import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from './firebase-admin'
import { roleToPermissions, type CollaboratorRole, type ActivityAction, type DocumentType } from '@/types/collaboration'

export function collabDoc(docId: string) {
  return adminDb().collection('documentCollaboration').doc(docId)
}

export interface AccessResult {
  ownerUid: string
  ownerEmail: string
  role: CollaboratorRole
  allowCopy: boolean
  name: string
  type: DocumentType
  canView: boolean
  canEdit: boolean
  canComment: boolean
  canDuplicate: boolean
  canShare: boolean
  canDelete: boolean
  canTransferOwnership: boolean
  canManagePermissions: boolean
}

/**
 * Returns the access record for a user on a document.
 * Returns null if no collab record exists (pre-collaboration legacy doc).
 * Returns null if the user has no access.
 */
export async function getDocumentAccess(docId: string, uid: string): Promise<AccessResult | null> {
  const doc = await collabDoc(docId).get()
  if (!doc.exists) return null

  const data = doc.data()!
  const ownerUid = data.ownerUid as string
  const ownerEmail = (data.ownerEmail ?? '') as string
  const allowCopy = (data.allowCopy ?? true) as boolean
  const name = (data.name ?? '') as string
  const type = (data.type ?? 'resume') as DocumentType

  let role: CollaboratorRole

  if (uid === ownerUid) {
    role = 'owner'
  } else {
    const collabSnap = await collabDoc(docId).collection('collaborators').doc(uid).get()
    if (!collabSnap.exists) return null
    role = (collabSnap.data()?.role ?? 'viewer') as CollaboratorRole
  }

  const perms = roleToPermissions(role)

  return {
    ownerUid,
    ownerEmail,
    role,
    allowCopy,
    name,
    type,
    canView: perms.canView,
    canEdit: perms.canEdit,
    canComment: perms.canComment,
    canDuplicate: perms.canDuplicate && allowCopy,
    canShare: perms.canShare,
    canDelete: perms.canDelete,
    canTransferOwnership: perms.canTransferOwnership,
    canManagePermissions: perms.canManagePermissions,
  }
}

/** Creates the top-level collaboration record. Called on document creation. */
export async function createCollabRecord(
  docId: string,
  type: DocumentType,
  ownerUid: string,
  ownerEmail: string,
  ownerDisplayName: string,
  name: string,
): Promise<void> {
  await collabDoc(docId).set({
    type,
    ownerUid,
    ownerEmail,
    ownerDisplayName,
    name,
    allowCopy: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  await logActivity(docId, ownerUid, ownerEmail, 'created', {})
}

/** Logs an activity event. Non-critical — errors are silently swallowed. */
export async function logActivity(
  docId: string,
  userId: string,
  userEmail: string,
  action: ActivityAction,
  meta: Record<string, string> = {},
): Promise<void> {
  try {
    await collabDoc(docId).collection('activity').add({
      userId,
      userEmail,
      action,
      timestamp: FieldValue.serverTimestamp(),
      meta,
    })
  } catch {
    // non-critical
  }
}

const CHUNK_SIZE = 900_000 // bytes — stays under Firestore 1MB doc limit
const MAX_VERSIONS = 30

/**
 * Creates a version snapshot of a document's content.
 * Stores data as blob chunks in a subcollection.
 * Prunes old versions beyond MAX_VERSIONS asynchronously.
 * Non-critical — errors are silently swallowed so saves are never blocked.
 */
export async function createVersionSnapshot(
  docId: string,
  type: DocumentType,
  savedBy: string,
  savedByEmail: string,
  data: object,
): Promise<void> {
  try {
    const versionCol = collabDoc(docId).collection('versions')

    const countSnap = await versionCol.orderBy('versionNumber', 'desc').limit(1).get()
    const lastNum = countSnap.empty ? 0 : ((countSnap.docs[0].data().versionNumber as number) ?? 0)
    const versionNumber = lastNum + 1

    const json = JSON.stringify(data)
    const size = Buffer.byteLength(json, 'utf8')

    const versionRef = versionCol.doc()
    await versionRef.set({
      versionNumber,
      label: `Version ${versionNumber}`,
      savedBy,
      savedByEmail,
      savedAt: FieldValue.serverTimestamp(),
      size,
      type,
    })

    const chunks: string[] = []
    for (let i = 0; i < json.length; i += CHUNK_SIZE) {
      chunks.push(json.slice(i, i + CHUNK_SIZE))
    }
    await Promise.all(
      chunks.map((chunk, idx) =>
        versionRef.collection('blob').doc(String(idx).padStart(6, '0')).set({ data: chunk }),
      ),
    )

    if (versionNumber > MAX_VERSIONS) {
      pruneOldVersions(docId, versionNumber - MAX_VERSIONS).catch(() => {})
    }
  } catch {
    // version creation is non-critical
  }
}

async function pruneOldVersions(docId: string, deleteCount: number): Promise<void> {
  const snap = await collabDoc(docId).collection('versions')
    .orderBy('versionNumber', 'asc')
    .limit(deleteCount)
    .get()
  for (const doc of snap.docs) {
    const blobs = await doc.ref.collection('blob').get()
    await Promise.all(blobs.docs.map((b) => b.ref.delete()))
    await doc.ref.delete()
  }
}

/** Loads version data from blob chunks. Returns null if empty. */
export async function loadVersionData(docId: string, versionId: string): Promise<object | null> {
  const snap = await collabDoc(docId).collection('versions').doc(versionId).collection('blob').get()
  if (snap.empty) return null
  const sorted = snap.docs.sort((a, b) => a.id.localeCompare(b.id))
  const json = sorted.map((d) => d.data().data as string).join('')
  return JSON.parse(json) as object
}

/** Converts a Firestore Timestamp to ISO string, or null. */
export function tsToIso(val: unknown): string | null {
  if (val instanceof Timestamp) return val.toDate().toISOString()
  return null
}
