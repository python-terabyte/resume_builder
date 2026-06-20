import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { tsToIso } from '@/lib/document-permissions'
import type { CollaboratorRole, DocumentType } from '@/types/collaboration'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Read the reverse index: users/{uid}/sharedWith/{docId}
  const sharedSnap = await adminDb()
    .collection('users')
    .doc(session.user.id)
    .collection('sharedWith')
    .get()

  if (sharedSnap.empty) return NextResponse.json([])

  const results = await Promise.all(
    sharedSnap.docs.map(async (d) => {
      const docId = d.id
      const role = (d.data().role ?? 'viewer') as CollaboratorRole

      const parentSnap = await adminDb().collection('documentCollaboration').doc(docId).get()
      if (!parentSnap.exists) return null
      const data = parentSnap.data()!

      return {
        docId,
        type: (data.type ?? 'resume') as DocumentType,
        name: (data.name ?? 'Untitled') as string,
        ownerEmail: (data.ownerEmail ?? '') as string,
        ownerUid: (data.ownerUid ?? '') as string,
        role,
        updatedAt: tsToIso(data.updatedAt),
      }
    }),
  )

  return NextResponse.json(results.filter(Boolean))
}
