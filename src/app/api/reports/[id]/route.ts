import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { authOptions } from '@/lib/auth-options'
import { adminDb } from '@/lib/firebase-admin'
import type { ReportData } from '@/types/report'

function reportDoc(uid: string, id: string) {
  return adminDb().collection('users').doc(uid).collection('reports').doc(id)
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params
    const { name, report } = await req.json() as { name: string; report: ReportData }
    await reportDoc(session.user.id, id).set(
      { name, report, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/reports/:id]', err)
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to save report' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { name } = await req.json() as { name: string }
  await reportDoc(session.user.id, id).update({ name, updatedAt: FieldValue.serverTimestamp() })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  await reportDoc(session.user.id, id).delete()
  return NextResponse.json({ ok: true })
}
