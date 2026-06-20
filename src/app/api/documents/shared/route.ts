import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { tsToIso } from '@/lib/document-permissions'
import type { CollaboratorRole, DocumentType } from '@/types/collaboration'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // CollectionGroup query: find all 'collaborators' docs where uid == current user
  const snap = await adminDb()
    .collectionGroup('collaborators')
    .where('uid', '==', session.user.id)
    .get()

  if (snap.empty) return NextResponse.json([])

  // For each collaborator record, fetch the parent documentCollaboration doc
  const results = await Promise.all(
    snap.docs.map(async (collabDoc) => {
      const parentRef = collabDoc.ref.parent.parent
      if (!parentRef) return null
      const parentSnap = await parentRef.get()
      if (!parentSnap.exists) return null
      const data = parentSnap.data()!
      const role = (collabDoc.data().role ?? 'viewer') as CollaboratorRole

      return {
        docId: parentRef.id,
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
