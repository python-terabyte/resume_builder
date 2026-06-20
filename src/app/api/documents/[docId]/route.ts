import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import {
  collabDoc,
  getDocumentAccess,
  createCollabRecord,
  tsToIso,
} from '@/lib/document-permissions'
import type { CollaboratorRole, DocumentType } from '@/types/collaboration'

/**
 * For legacy documents (no collab record), detect ownership by checking
 * the user's own resume/report subcollections. Returns doc info or null.
 */
async function detectLegacyOwnership(
  docId: string,
  uid: string,
  email: string,
  name: string,
): Promise<{ type: DocumentType; docName: string } | null> {
  const [resumeSnap, reportSnap] = await Promise.all([
    adminDb().collection('users').doc(uid).collection('resumes').doc(docId).get(),
    adminDb().collection('users').doc(uid).collection('reports').doc(docId).get(),
  ])

  if (resumeSnap.exists) {
    const docName = (resumeSnap.data()?.name as string) ?? 'Untitled Resume'
    await createCollabRecord(docId, 'resume', uid, email, name, docName).catch(() => {})
    return { type: 'resume', docName }
  }
  if (reportSnap.exists) {
    const docName = (reportSnap.data()?.name as string) ?? 'Untitled Report'
    await createCollabRecord(docId, 'report', uid, email, name, docName).catch(() => {})
    return { type: 'report', docName }
  }
  return null
}

export async function GET(_req: Request, context: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await context.params
  let access = await getDocumentAccess(docId, session.user.id)

  // Legacy document — no collab record yet. Check if current user owns it.
  if (!access) {
    const legacy = await detectLegacyOwnership(
      docId,
      session.user.id,
      session.user.email ?? '',
      session.user.name ?? '',
    )
    if (!legacy) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Re-read now that the record was created
    access = await getDocumentAccess(docId, session.user.id)
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!access.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [docSnap, collabSnap, invSnap] = await Promise.all([
    collabDoc(docId).get(),
    collabDoc(docId).collection('collaborators').get(),
    access.canShare
      ? collabDoc(docId).collection('invitations').where('status', '==', 'pending').get()
      : Promise.resolve(null),
  ])

  const data = docSnap.data()!

  const collaborators = collabSnap.docs.map((d) => {
    const cd = d.data()
    return {
      uid: d.id,
      email: cd.email ?? '',
      displayName: cd.displayName ?? '',
      role: (cd.role ?? 'viewer') as CollaboratorRole,
      addedAt: tsToIso(cd.addedAt),
      addedBy: cd.addedBy ?? '',
      addedByEmail: cd.addedByEmail ?? '',
    }
  })

  const pendingInvitations = invSnap
    ? invSnap.docs.map((d) => {
        const inv = d.data()
        return {
          id: d.id,
          email: inv.email ?? '',
          role: (inv.role ?? 'viewer') as CollaboratorRole,
          token: inv.token ?? '',
          status: inv.status ?? 'pending',
          invitedBy: inv.invitedBy ?? '',
          invitedByEmail: inv.invitedByEmail ?? '',
          invitedAt: tsToIso(inv.invitedAt),
          expiresAt: tsToIso(inv.expiresAt),
          documentName: inv.documentName ?? '',
          documentType: inv.documentType ?? 'resume',
        }
      })
    : []

  return NextResponse.json({
    docId,
    type: access.type,
    ownerUid: access.ownerUid,
    ownerEmail: access.ownerEmail,
    name: access.name,
    allowCopy: access.allowCopy,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
    myRole: access.role,
    myPermissions: {
      canView: access.canView,
      canEdit: access.canEdit,
      canComment: access.canComment,
      canDuplicate: access.canDuplicate,
      canShare: access.canShare,
      canDelete: access.canDelete,
      canTransferOwnership: access.canTransferOwnership,
      canManagePermissions: access.canManagePermissions,
    },
    collaborators,
    pendingInvitations,
  })
}

export async function PATCH(req: Request, context: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await context.params
  let access = await getDocumentAccess(docId, session.user.id)

  if (!access) {
    const legacy = await detectLegacyOwnership(
      docId,
      session.user.id,
      session.user.email ?? '',
      session.user.name ?? '',
    )
    if (!legacy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    access = await getDocumentAccess(docId, session.user.id)
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!access.canManagePermissions) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { allowCopy?: boolean; name?: string }
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
  if (typeof body.allowCopy === 'boolean') updates.allowCopy = body.allowCopy
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()

  await collabDoc(docId).update(updates)
  return NextResponse.json({ ok: true })
}
