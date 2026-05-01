import { NextResponse } from 'next/server'
import { sendContactMessage } from '@/lib/mailer'

export async function POST(req: Request) {
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
    console.error('[contact] error:', msg)
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json({ error: isDev ? msg : 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
