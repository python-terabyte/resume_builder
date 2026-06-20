'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { WorkspaceDashboard } from '@/components/HomeShell'

function AppLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: '#120B07' }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 animate-spin rounded-full border-4" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          <Image src="/logoface.png" alt="BrandFox" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <p className="animate-pulse text-sm" style={{ color: '#8B7340' }}>Loading BrandFox...</p>
      </div>
    </div>
  )
}

function Shell() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) return <AppLoading />
  return <WorkspaceDashboard />
}

export default function WorkspaceShell() {
  return (
    <SessionProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SessionProvider>
  )
}
