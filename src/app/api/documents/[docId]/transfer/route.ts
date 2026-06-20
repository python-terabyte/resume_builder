import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { saveReportBlob, loadReportBlob, deleteReportBlob } from '@/lib/report-storage'
import { collabDoc, getDocumentAccess, logActivity } from '@/lib/document-permissions'

function resumeDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('resumes').doc(id)
}
function reportDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('reports').doc(id)
}

export async function POST(req: Request, context: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canTransferOwnership) return NextResponse.json({ error: 'Only the owner can transfer ownership' }, { status: 403 })

  const { newOwnerUid } = await req.json() as { newOwnerUid: string }
  if (!newOwnerUid || newOwnerUid === session.user.id) {
    return NextResponse.json({ error: 'Invalid new owner' }, { status: 400 })
  }

  // Verify new owner is a current collaborator
  const newOwnerCollab = await collabDoc(docId).collection('collaborators').doc(newOwnerUid).get()
  if (!newOwnerCollab.exists) {
    return NextResponse.json({ error: 'New owner must already be a collaborator' }, { status: 400 })
  }

  const newOwnerRecord = await adminAuth().getUser(newOwnerUid)
  const newOwnerEmail = newOwnerRecord.email ?? ''

  try {
    if (access.type === 'resume') {
      const srcDoc = await resumeDoc(session.user.id, docId).get()
      if (!srcDoc.exists) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      const srcData = srcDoc.data()!

      // Move document to new owner's collection under the same ID
      await resumeDoc(newOwnerUid, docId).set({
        ...srcData,
        updatedAt: FieldValue.serverTimestamp(),
      })
      await resumeDoc(session.user.id, docId).delete()
    } else {
      const srcDoc = await reportDoc(session.user.id, docId).get()
      if (!srcDoc.exists) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      const srcData = srcDoc.data()!

      const report = await loadReportBlob(srcDoc.ref.collection('blob'))
      if (!report) return NextResponse.json({ error: 'Report data not found' }, { status: 404 })

      const newDocRef = reportDoc(newOwnerUid, docId)
      const { report: _r, ...metaWithoutReport } = srcData
      void _r
      await newDocRef.set({ ...metaWithoutReport, updatedAt: FieldValue.serverTimestamp() })
      await saveReportBlob(newDocRef.collection('blob'), report as import('@/types/report').ReportData)

      await deleteReportBlob(srcDoc.ref.collection('blob'))
      await reportDoc(session.user.id, docId).delete()
    }

    // Update collaboration record
    await collabDoc(docId).update({
      ownerUid: newOwnerUid,
      ownerEmail: newOwnerEmail,
      ownerDisplayName: newOwnerRecord.displayName ?? '',
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Remove new owner from collaborators (they are now owner)
    await collabDoc(docId).collection('collaborators').doc(newOwnerUid).delete()

    // Add previous owner as a manager collaborator
    await collabDoc(docId).collection('collaborators').doc(session.user.id).set({
      uid: session.user.id,
      email: session.user.email ?? '',
      displayName: session.user.name ?? '',
      role: 'manager',
      addedAt: FieldValue.serverTimestamp(),
      addedBy: newOwnerUid,
      addedByEmail: newOwnerEmail,
    })

    await logActivity(docId, session.user.id, session.user.email ?? '', 'ownership_transferred', {
      newOwnerUid,
      newOwnerEmail,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/documents/:id/transfer]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Transfer failed' }, { status: 500 })
  }
}
