import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { collabDoc, getDocumentAccess } from '@/lib/document-permissions'

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ docId: string; inviteId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId, inviteId } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canManagePermissions) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invRef = collabDoc(docId).collection('invitations').doc(inviteId)
  const snap = await invRef.get()
  if (!snap.exists) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

  await invRef.update({ status: 'declined' })
  return NextResponse.json({ ok: true })
}
