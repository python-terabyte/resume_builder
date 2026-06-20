import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import {
  getDocumentAccess,
  createCollabRecord,
  logActivity,
  createVersionSnapshot,
  collabDoc,
} from '@/lib/document-permissions'
import type { ResumeData } from '@/types/resume'

function resumeDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('resumes').doc(id)
}

async function resolveResumeAccess(id: string, sessionUid: string) {
  // Fast path: check own collection first
  const ownDoc = await resumeDoc(sessionUid, id).get()
  if (ownDoc.exists) {
    return { ownerUid: sessionUid, doc: ownDoc, role: 'owner' as const, canEdit: true, canDelete: true }
  }

  // Shared path: check collaboration record
  const access = await getDocumentAccess(id, sessionUid)
  if (!access || !access.canView) return null

  const sharedDoc = await resumeDoc(access.ownerUid, id).get()
  if (!sharedDoc.exists) return null

  return { ownerUid: access.ownerUid, doc: sharedDoc, role: access.role, canEdit: access.canEdit, canDelete: access.canDelete }
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const resolved = await resolveResumeAccess(id, session.user.id)
  if (!resolved) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = resolved.doc.data()!
  return NextResponse.json({
    id: resolved.doc.id,
    name: data.name ?? 'Untitled',
    resume: data.resume,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    ownerUid: resolved.ownerUid,
    myRole: resolved.role,
    canEdit: resolved.canEdit,
  })
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { name, resume } = await req.json() as { name: string; resume: ResumeData }

  // Determine write target
  let ownerUid = session.user.id
  const ownDoc = await resumeDoc(session.user.id, id).get()

  if (!ownDoc.exists) {
    // Check collaboration access
    const access = await getDocumentAccess(id, session.user.id)
    if (!access || !access.canEdit) {
      return NextResponse.json({ error: access ? 'Forbidden' : 'Not found' }, { status: access ? 403 : 404 })
    }
    ownerUid = access.ownerUid
  } else {
    // Lazily create collab record for legacy documents
    const collabSnap = await collabDoc(id).get()
    if (!collabSnap.exists) {
      createCollabRecord(id, 'resume', session.user.id, session.user.email ?? '', session.user.name ?? '', name)
        .catch(() => {})
    } else {
      // Keep collab record name in sync
      collabDoc(id).update({ name, updatedAt: FieldValue.serverTimestamp() }).catch(() => {})
    }
  }

  await resumeDoc(ownerUid, id).set(
    { name, resume, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  )

  // Version snapshot (non-blocking)
  createVersionSnapshot(id, 'resume', session.user.id, session.user.email ?? '', { name, resume })
    .catch(() => {})

  // Activity log (non-blocking)
  logActivity(id, session.user.id, session.user.email ?? '', 'edited', {}).catch(() => {})

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { name } = await req.json() as { name: string }

  let ownerUid = session.user.id
  const ownDoc = await resumeDoc(session.user.id, id).get()

  if (!ownDoc.exists) {
    const access = await getDocumentAccess(id, session.user.id)
    if (!access || !access.canEdit) {
      return NextResponse.json({ error: access ? 'Forbidden' : 'Not found' }, { status: access ? 403 : 404 })
    }
    ownerUid = access.ownerUid
  }

  await resumeDoc(ownerUid, id).update({ name, updatedAt: FieldValue.serverTimestamp() })
  collabDoc(id).update({ name, updatedAt: FieldValue.serverTimestamp() }).catch(() => {})

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params

  // Only owner can delete
  const ownDoc = await resumeDoc(session.user.id, id).get()
  if (!ownDoc.exists) {
    const access = await getDocumentAccess(id, session.user.id)
    if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!access.canDelete) return NextResponse.json({ error: 'Only the owner can delete this document' }, { status: 403 })
    // Owner deletes from their own path (shouldn't reach here for owner, but guard anyway)
    return NextResponse.json({ error: 'Not found in your account' }, { status: 404 })
  }

  await resumeDoc(session.user.id, id).delete()
  logActivity(id, session.user.id, session.user.email ?? '', 'deleted', {}).catch(() => {})

  return NextResponse.json({ ok: true })
}
