import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { collabDoc, getDocumentAccess, logActivity } from '@/lib/document-permissions'
import type { CollaboratorRole } from '@/types/collaboration'
import { ASSIGNABLE_ROLES } from '@/types/collaboration'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ docId: string; uid: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId, uid } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canManagePermissions) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { role } = await req.json() as { role: CollaboratorRole }
  if (!(ASSIGNABLE_ROLES as string[]).includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const collabRef = collabDoc(docId).collection('collaborators').doc(uid)
  const snap = await collabRef.get()
  if (!snap.exists) return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })

  await Promise.all([
    collabRef.update({ role, updatedAt: FieldValue.serverTimestamp() }),
    adminDb().collection('users').doc(uid).collection('sharedWith').doc(docId)
      .set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
  ])
  await logActivity(docId, session.user.id, session.user.email ?? '', 'collaborator_role_changed', {
    targetUid: uid,
    targetEmail: (snap.data()?.email as string) ?? '',
    newRole: role,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ docId: string; uid: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId, uid } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Users can remove themselves; managers/owners can remove others
  const isSelf = uid === session.user.id
  if (!isSelf && !access.canManagePermissions) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const collabRef = collabDoc(docId).collection('collaborators').doc(uid)
  const snap = await collabRef.get()
  if (!snap.exists) return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })

  const targetEmail = (snap.data()?.email as string) ?? ''
  await Promise.all([
    collabRef.delete(),
    adminDb().collection('users').doc(uid).collection('sharedWith').doc(docId).delete(),
  ])
  await logActivity(docId, session.user.id, session.user.email ?? '', 'collaborator_removed', {
    targetUid: uid,
    targetEmail,
  })

  return NextResponse.json({ ok: true })
}
