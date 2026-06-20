import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import type { ResumeData } from '@/types/resume'

function resumeDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('resumes').doc(id)
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const doc = await resumeDoc(session.user.id, id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = doc.data()!
  return NextResponse.json({
    id: doc.id,
    name: data.name ?? 'Untitled',
    resume: data.resume,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
  })
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { name, resume } = await req.json() as { name: string; resume: ResumeData }
  await resumeDoc(session.user.id, id).set(
    { name, resume, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  )
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { name } = await req.json() as { name: string }
  await resumeDoc(session.user.id, id).update({ name, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  await resumeDoc(session.user.id, id).delete()
  return NextResponse.json({ ok: true })
}
