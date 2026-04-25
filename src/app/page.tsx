'use client'

import dynamic from 'next/dynamic'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import AuthGate from '@/components/AuthGate'

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), {
  ssr: false,
  loading: () => <Loading />,
})

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0f0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="animate-pulse text-slate-400">Loading Resume Builder…</p>
      </div>
    </div>
  )
}

function Shell() {
  const { user, loading, configured } = useAuth()
  if (loading) return <Loading />
  if (!user) return <AuthGate configured={configured} />
  return <ResumeBuilder />
}

export default function Home() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
