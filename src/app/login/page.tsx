import type { Metadata } from 'next'
import AuthGate from '@/components/AuthGate'

export const metadata: Metadata = {
  title: 'Sign In — BrandFox',
}

export default function LoginPage() {
  return <AuthGate />
}
