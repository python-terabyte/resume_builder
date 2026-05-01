import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json() as { email?: string; code?: string }
    if (!email || !code) return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 })

    const docRef = adminDb().collection('passwordResets').doc(email)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'No reset code found. Please request a new one.' }, { status: 400 })
    }

    const data = doc.data()!
    const expiresAt = (data.expiresAt as Timestamp).toMillis()

    if (Date.now() > expiresAt) {
      await docRef.delete()
      return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 })
    }

    if (data.code !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
    }

    await docRef.update({ verified: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('verify-reset-code error', err)
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 })
  }
}
