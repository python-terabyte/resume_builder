import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { collabDoc, logActivity } from '@/lib/document-permissions'
import type { CollaboratorRole, DocumentType } from '@/types/collaboration'

export async function POST(
  _req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await context.params

  // Find the invitation by token
  const snap = await adminDb()
    .collectionGroup('invitations')
    .where('token', '==', token)
    .where('status', '==', 'pending')
    .limit(1)
    .get()

  if (snap.empty) return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 })

  const invDoc = snap.docs[0]
  const invData = invDoc.data()

  // Verify it's addressed to this user
  if (invData.email?.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: 'This invitation was sent to a different email address' }, { status: 403 })
  }

  // Check expiry
  const expiresAt = invData.expiresAt?.toDate?.()
  if (expiresAt && expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
  }

  const parentRef = invDoc.ref.parent.parent
  if (!parentRef) return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 })

  const docId = parentRef.id
  const role = (invData.role ?? 'viewer') as CollaboratorRole
  const type = (invData.documentType ?? 'resume') as DocumentType

  // Add as collaborator
  await collabDoc(docId).collection('collaborators').doc(session.user.id).set({
    uid: session.user.id,
    email: session.user.email,
    displayName: session.user.name ?? '',
    role,
    addedAt: FieldValue.serverTimestamp(),
    addedBy: invData.invitedBy ?? '',
    addedByEmail: invData.invitedByEmail ?? '',
  })

  // Mark invitation as accepted
  await invDoc.ref.update({ status: 'accepted', acceptedAt: FieldValue.serverTimestamp() })

  await logActivity(docId, session.user.id, session.user.email, 'invitation_accepted', {
    invitedBy: invData.invitedByEmail ?? '',
  })

  return NextResponse.json({ docId, type })
}
