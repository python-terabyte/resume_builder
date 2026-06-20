import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { saveReportBlob, loadReportBlob } from '@/lib/report-storage'
import { getDocumentAccess, createCollabRecord, logActivity } from '@/lib/document-permissions'
import type { ResumeData } from '@/types/resume'
import type { ReportData } from '@/types/report'

function resumeDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('resumes').doc(id)
}
function reportDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('reports').doc(id)
}

/** Generates a "Copy of X" name that doesn't collide with existing names. */
function makeCopyName(original: string, existingNames: string[]): string {
  const base = `Copy of ${original}`
  if (!existingNames.includes(base)) return base
  for (let n = 2; n <= 99; n++) {
    const candidate = `Copy (${n}) of ${original}`
    if (!existingNames.includes(candidate)) return candidate
  }
  return `${base} (${Date.now()})`
}

export async function POST(req: Request, context: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await context.params

  // Determine access — either owner or someone with canDuplicate
  let ownerUid = session.user.id
  let sourceType: 'resume' | 'report' = 'resume'
  let sourceName = 'Document'

  const ownResumeDoc = await resumeDoc(session.user.id, docId).get()
  const ownReportDoc = await reportDoc(session.user.id, docId).get()

  if (!ownResumeDoc.exists && !ownReportDoc.exists) {
    const access = await getDocumentAccess(docId, session.user.id)
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!access.canDuplicate) return NextResponse.json({ error: 'Forbidden — copy not allowed' }, { status: 403 })
    ownerUid = access.ownerUid
    sourceType = access.type
    sourceName = access.name
  } else if (ownResumeDoc.exists) {
    sourceType = 'resume'
    sourceName = (ownResumeDoc.data()?.name as string) ?? 'Resume'
  } else {
    sourceType = 'report'
    sourceName = (ownReportDoc.data()?.name as string) ?? 'Report'
  }

  try {
    if (sourceType === 'resume') {
      const srcDoc = await resumeDoc(ownerUid, docId).get()
      if (!srcDoc.exists) return NextResponse.json({ error: 'Source not found' }, { status: 404 })
      const srcData = srcDoc.data()!

      // Get existing resume names to avoid collision
      const existingSnap = await adminDb().collection('users').doc(session.user.id).collection('resumes').get()
      const existingNames = existingSnap.docs.map((d) => (d.data().name as string) ?? '')
      const newName = makeCopyName(sourceName, existingNames)

      const newRef = await adminDb().collection('users').doc(session.user.id).collection('resumes').add({
        name: newName,
        resume: srcData.resume as ResumeData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      await createCollabRecord(newRef.id, 'resume', session.user.id, session.user.email ?? '', session.user.name ?? '', newName)
        .catch(() => {})
      await logActivity(docId, session.user.id, session.user.email ?? '', 'duplicated', { newDocId: newRef.id })

      return NextResponse.json({ id: newRef.id, name: newName, type: 'resume' })
    } else {
      const srcDoc = await reportDoc(ownerUid, docId).get()
      if (!srcDoc.exists) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

      const report = await loadReportBlob(srcDoc.ref.collection('blob'))
      if (!report) return NextResponse.json({ error: 'Report data not found' }, { status: 404 })

      const existingSnap = await adminDb().collection('users').doc(session.user.id).collection('reports').get()
      const existingNames = existingSnap.docs.map((d) => (d.data().name as string) ?? '')
      const newName = makeCopyName(sourceName, existingNames)

      const newRef = await adminDb().collection('users').doc(session.user.id).collection('reports').add({
        name: newName,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      await saveReportBlob(newRef.collection('blob'), report as ReportData)
      await createCollabRecord(newRef.id, 'report', session.user.id, session.user.email ?? '', session.user.name ?? '', newName)
        .catch(() => {})
      await logActivity(docId, session.user.id, session.user.email ?? '', 'duplicated', { newDocId: newRef.id })

      return NextResponse.json({ id: newRef.id, name: newName, type: 'report' })
    }
  } catch (err) {
    console.error('[POST /api/documents/:id/duplicate]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Duplicate failed' }, { status: 500 })
  }
}
