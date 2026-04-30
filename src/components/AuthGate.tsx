'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signInEmail, signInGoogle, signUpEmail } from '@/lib/auth'

type Mode = 'signin' | 'signup'

export default function AuthGate() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUpEmail(email, password, name || undefined)
      } else {
        await signInEmail(email, password)
      }
      router.push('/')
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong.')
      setBusy(false)
    }
  }

  async function googleSignIn() {
    setError(null)
    setBusy(true)
    try {
      await signInGoogle()
    } catch (err) {
      setError((err as Error).message ?? 'Google sign-in failed.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#120B07] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#2D1B11] p-6 shadow-2xl">
        <div className="mb-5">
          <Image src="/logoface.png" alt="BrandFox" width={140} height={40} className="h-9 w-auto object-contain" />
        </div>

        <h1 className="text-xl font-bold text-white">
          {mode === 'signin' ? 'Sign in' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === 'signin' ? 'Welcome back. Pick up where you left off.' : 'Save your progress and edit it from anywhere.'}
        </p>

        <button
          onClick={googleSignIn}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-white/10" />
          or
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-md border border-white/10 bg-[#120B07] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-white/10 bg-[#120B07] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-white/10 bg-[#120B07] px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button onClick={() => setMode('signup')} className="text-accent hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have one?{' '}
              <button onClick={() => setMode('signin')} className="text-accent hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-5 text-center text-xs text-slate-600">
          By continuing, you agree to our{' '}
          <Link href="/privacy" className="text-slate-500 underline hover:text-slate-300 transition">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
