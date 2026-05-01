import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendPasswordResetCode } from '@/lib/mailer'
import { Timestamp } from 'firebase-admin/firestore'

const CODE_TTL_MS = 10 * 60 * 1000        // 10 minutes
const RATE_LIMIT_MS = 60 * 1000           // 1 request per minute per email

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) console.error('[forgot-password] RESEND_API_KEY is not set')

  try {
    const { email } = await req.json() as { email?: string }
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    // Verify user exists in Firebase
    try {
      await adminAuth().getUserByEmail(email)
    } catch {
      // Don't reveal whether the account exists — return success anyway
      return NextResponse.json({ ok: true })
    }

    const db = adminDb()
    const docRef = db.collection('passwordResets').doc(email)
    const existing = await docRef.get()

    if (existing.exists) {
      const data = existing.data()!
      const createdAt = (data.createdAt as Timestamp).toMillis()
      if (Date.now() - createdAt < RATE_LIMIT_MS) {
        return NextResponse.json({ error: 'Please wait a minute before requesting another code.' }, { status: 429 })
      }
    }

    const code = generateCode()
    const now = Timestamp.now()

    await docRef.set({
      code,
      createdAt: now,
      expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
      verified: false,
    })

    await sendPasswordResetCode(email, code)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err)
    console.error('[forgot-password] send failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
