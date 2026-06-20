import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { tsToIso } from '@/lib/document-permissions'
import type { CollaboratorRole, DocumentType } from '@/types/collaboration'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // CollectionGroup query: find pending invitations addressed to this user's email
  const snap = await adminDb()
    .collectionGroup('invitations')
    .where('email', '==', session.user.email.toLowerCase())
    .where('status', '==', 'pending')
    .get()

  if (snap.empty) return NextResponse.json([])

  const now = new Date()
  const invitations = snap.docs
    .map((d) => {
      const data = d.data()
      const expiresAt = data.expiresAt instanceof Date
        ? data.expiresAt
        : data.expiresAt?.toDate?.()
      // Filter out expired
      if (expiresAt && expiresAt < now) return null

      const parentRef = d.ref.parent.parent
      return {
        id: d.id,
        email: (data.email ?? '') as string,
        role: (data.role ?? 'viewer') as CollaboratorRole,
        token: (data.token ?? '') as string,
        status: 'pending' as const,
        invitedBy: (data.invitedBy ?? '') as string,
        invitedByEmail: (data.invitedByEmail ?? '') as string,
        invitedAt: tsToIso(data.invitedAt),
        expiresAt: tsToIso(data.expiresAt),
        documentName: (data.documentName ?? '') as string,
        documentType: (data.documentType ?? 'resume') as DocumentType,
        docId: parentRef?.id ?? '',
      }
    })
    .filter(Boolean)

  return NextResponse.json(invitations)
}
