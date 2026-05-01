import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json() as { email?: string; newPassword?: string }
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required.' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const docRef = adminDb().collection('passwordResets').doc(email)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Reset session not found. Please start over.' }, { status: 400 })
    }

    const data = doc.data()!

    if (!data.verified) {
      return NextResponse.json({ error: 'Code not verified. Please verify your code first.' }, { status: 400 })
    }

    const expiresAt = (data.expiresAt as Timestamp).toMillis()
    if (Date.now() > expiresAt) {
      await docRef.delete()
      return NextResponse.json({ error: 'Reset session expired. Please start over.' }, { status: 400 })
    }

    const user = await adminAuth().getUserByEmail(email)
    await adminAuth().updateUser(user.uid, { password: newPassword })
    await docRef.delete()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password error', err)
    return NextResponse.json({ error: 'Password reset failed. Please try again.' }, { status: 500 })
  }
}
