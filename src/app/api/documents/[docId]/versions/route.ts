import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { collabDoc, getDocumentAccess, tsToIso } from '@/lib/document-permissions'

export async function GET(_req: Request, context: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)

  // Fall back: check if it's a legacy doc the user owns (no collab record yet)
  if (!access) {
    // Legacy docs have no collab record and thus no versions yet
    return NextResponse.json([])
  }
  if (!access.canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const snap = await collabDoc(docId).collection('versions')
    .orderBy('versionNumber', 'desc')
    .limit(50)
    .get()

  const versions = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      versionNumber: (data.versionNumber as number) ?? 0,
      label: (data.label as string) ?? `Version ${data.versionNumber}`,
      savedBy: (data.savedBy as string) ?? '',
      savedByEmail: (data.savedByEmail as string) ?? '',
      savedAt: tsToIso(data.savedAt),
      size: (data.size as number) ?? 0,
    }
  })

  return NextResponse.json(versions)
}
