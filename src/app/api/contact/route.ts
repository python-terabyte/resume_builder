import { NextResponse } from 'next/server'
import { sendContactMessage } from '@/lib/mailer'

export async function POST(req: Request) {
  // Surface missing env vars immediately in logs
  if (!process.env.RESEND_API_KEY) console.error('[contact] RESEND_API_KEY is not set')
  if (!process.env.CONTACT_EMAIL)  console.error('[contact] CONTACT_EMAIL is not set')

  try {
    const { name, email, message } = await req.json() as {
      name?: string; email?: string; message?: string
    }
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 })
    }

    await sendContactMessage(name.trim(), email.trim(), message.trim())
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = (err as Error)?.message ?? String(err)
    console.error('[contact] send failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
