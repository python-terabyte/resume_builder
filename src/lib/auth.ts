import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'

export async function signInEmail(email: string, password: string) {
  const result = await nextAuthSignIn('credentials', { email, password, redirect: false })
  if (result?.error) throw new Error('Invalid email or password.')
}

export async function signUpEmail(email: string, password: string, name?: string) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  if (!res.ok) {
    const data = await res.json() as { error?: string }
    throw new Error(data.error ?? 'Sign up failed.')
  }
  await signInEmail(email, password)
}

export async function signInGoogle() {
  await nextAuthSignIn('google', { callbackUrl: '/' })
}

export async function signOut() {
  await nextAuthSignOut({ redirect: false })
}
