import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { saveReportBlob } from '@/lib/report-storage'
import {
  collabDoc,
  getDocumentAccess,
  loadVersionData,
  createVersionSnapshot,
  logActivity,
} from '@/lib/document-permissions'
import type { ResumeData } from '@/types/resume'
import type { ReportData } from '@/types/report'

function resumeDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('resumes').doc(id)
}
function reportDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('reports').doc(id)
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ docId: string; versionId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId, versionId } = await context.params
  const access = await getDocumentAccess(docId, session.user.id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const versionSnap = await collabDoc(docId).collection('versions').doc(versionId).get()
  if (!versionSnap.exists) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  const versionData = versionSnap.data()!
  const type = (versionData.type as string) ?? access.type

  const content = await loadVersionData(docId, versionId)
  if (!content) return NextResponse.json({ error: 'Version content not found' }, { status: 404 })

  try {
    const ownerUid = access.ownerUid

    if (type === 'resume') {
      const { name, resume } = content as { name: string; resume: ResumeData }
      await resumeDoc(ownerUid, docId).set(
        { name, resume, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      await collabDoc(docId).update({ name, updatedAt: FieldValue.serverTimestamp() }).catch(() => {})
    } else {
      const reportContent = content as ReportData
      const srcDoc = await reportDoc(ownerUid, docId).get()
      const currentName = (srcDoc.data()?.name as string) ?? 'Report'
      await Promise.all([
        saveReportBlob(reportDoc(ownerUid, docId).collection('blob'), reportContent),
        reportDoc(ownerUid, docId).update({ updatedAt: FieldValue.serverTimestamp() }),
      ])
      await collabDoc(docId).update({ updatedAt: FieldValue.serverTimestamp() }).catch(() => {})
      void currentName
    }

    // Create a new version snapshot recording the restore
    createVersionSnapshot(
      docId,
      type as 'resume' | 'report',
      session.user.id,
      session.user.email ?? '',
      content,
    ).catch(() => {})

    await logActivity(docId, session.user.id, session.user.email ?? '', 'version_restored', {
      versionId,
      versionNumber: String(versionData.versionNumber ?? ''),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/documents/:id/versions/:vId/restore]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Restore failed' }, { status: 500 })
  }
}
