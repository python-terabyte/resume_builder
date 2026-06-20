import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { collabDoc, getDocumentAccess, logActivity } from '@/lib/document-permissions'
import { v4 as uuidv4 } from 'uuid'
import type { CollaboratorRole } from '@/types/collaboration'
import { ASSIGNABLE_ROLES } from '@/types/collaboration'

export async function POST(req: Request, context: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canShare) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, role } = await req.json() as { email: string; role: CollaboratorRole }

  if (!email?.trim() || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
  }
  if (!(ASSIGNABLE_ROLES as string[]).includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (email.toLowerCase() === session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 })
  }
  if (email.toLowerCase() === access.ownerEmail.toLowerCase()) {
    return NextResponse.json({ error: 'User is already the owner' }, { status: 400 })
  }

  // Try to find an existing Firebase user
  try {
    const userRecord = await adminAuth().getUserByEmail(email)
    const uid = userRecord.uid

    const collabRef = collabDoc(docId).collection('collaborators').doc(uid)
    const existing = await collabRef.get()

    const sharedWithRef = adminDb().collection('users').doc(uid).collection('sharedWith').doc(docId)

    if (existing.exists) {
      await Promise.all([
        collabRef.update({ role, updatedAt: FieldValue.serverTimestamp() }),
        sharedWithRef.set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
      ])
      await logActivity(docId, session.user.id, session.user.email ?? '', 'collaborator_role_changed', {
        targetEmail: email,
        newRole: role,
      })
      return NextResponse.json({ added: true, invited: false, updated: true })
    }

    await Promise.all([
      collabRef.set({
        uid,
        email: userRecord.email ?? email,
        displayName: userRecord.displayName ?? '',
        role,
        addedAt: FieldValue.serverTimestamp(),
        addedBy: session.user.id,
        addedByEmail: session.user.email ?? '',
      }),
      sharedWithRef.set({
        role,
        addedAt: FieldValue.serverTimestamp(),
        addedBy: session.user.id,
        addedByEmail: session.user.email ?? '',
      }),
    ])

    await logActivity(docId, session.user.id, session.user.email ?? '', 'collaborator_added', {
      targetEmail: email,
      role,
    })

    return NextResponse.json({ added: true, invited: false })
  } catch {
    // User not found in Firebase Auth → create a pending invitation
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Check for an existing pending invite for this email
    const existing = await collabDoc(docId).collection('invitations')
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get()

    if (!existing.empty) {
      await existing.docs[0].ref.update({
        role,
        token,
        expiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else {
      await collabDoc(docId).collection('invitations').add({
        email: email.toLowerCase(),
        role,
        token,
        status: 'pending',
        invitedBy: session.user.id,
        invitedByEmail: session.user.email ?? '',
        invitedAt: FieldValue.serverTimestamp(),
        expiresAt,
        documentName: access.name,
        documentType: access.type,
      })
    }

    await logActivity(docId, session.user.id, session.user.email ?? '', 'invitation_sent', {
      targetEmail: email,
      role,
    })

    return NextResponse.json({ added: false, invited: true })
  }
}
