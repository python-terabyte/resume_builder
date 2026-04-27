import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json() as {
      email?: string
      password?: string
      name?: string
    }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    const user = await adminAuth().createUser({
      email,
      password,
      displayName: name || undefined,
    })
    return NextResponse.json({ uid: user.uid })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? ''
    const message = humanizeAdminError(code) ?? (err as Error)?.message ?? 'Sign up failed.'
    return NextResponse.json({ error: message, code }, { status: 400 })
  }
}

function humanizeAdminError(code: string): string | null {
  switch (code) {
    case 'auth/email-already-exists': return 'An account with that email already exists.'
    case 'auth/invalid-email': return 'That email address is invalid.'
    case 'auth/invalid-password': return 'Password must be at least 6 characters.'
    case 'auth/weak-password': return 'Password is too weak. Use at least 6 characters.'
    default: return null
  }
}
