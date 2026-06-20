import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import { createCollabRecord } from '@/lib/document-permissions'
import type { ResumeData } from '@/types/resume'

function resumesCol(uid: string) {
  return adminDb().collection('users').doc(uid).collection('resumes')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const snap = await resumesCol(session.user.id).orderBy('updatedAt', 'desc').get()
  const docs = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name as string,
      resume: data.resume as ResumeData,
      createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
      updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate?.()?.toISOString() ?? null,
    }
  })
  return NextResponse.json(docs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, resume } = await req.json() as { name: string; resume: ResumeData }
  const ref = await resumesCol(session.user.id).add({
    name,
    resume,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Create collaboration record for this new document
  await createCollabRecord(
    ref.id,
    'resume',
    session.user.id,
    session.user.email ?? '',
    session.user.name ?? '',
    name,
  ).catch(() => {}) // non-blocking

  return NextResponse.json({ id: ref.id })
}
