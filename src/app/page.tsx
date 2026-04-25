'use client'

import dynamic from 'next/dynamic'

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#0f0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="animate-pulse text-slate-400">Loading Resume Builder…</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return <ResumeBuilder />
}
