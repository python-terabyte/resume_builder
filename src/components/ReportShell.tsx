'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import Link from 'next/link'

const ReportBuilder = dynamic(() => import('@/components/ReportBuilder'), {
  ssr: false,
  loading: () => <AppLoading />,
})

function AppLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: '#120B07' }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 animate-spin rounded-full border-4" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          <Image src="/logoface.png" alt="BrandFox" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <p className="animate-pulse text-sm" style={{ color: '#8B7340' }}>Loading Report Builder...</p>
      </div>
    </div>
  )
}

function Shell() {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />
  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6" style={{ background: '#120B07' }}>
        <Image src="/logoface.png" alt="BrandFox" width={56} height={56} className="h-14 w-14 object-contain" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Sign in to use Report Builder</h1>
          <p className="mt-2 text-sm text-slate-400">Your account gives you access to both the Resume Builder and Report Builder.</p>
        </div>
        <Link
          href="/login"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          style={{ background: '#C9A84C' }}
        >
          Sign In
        </Link>
      </div>
    )
  }
  return <ReportBuilder />
}

export default function ReportShell() {
  return (
    <SessionProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SessionProvider>
  )
}
