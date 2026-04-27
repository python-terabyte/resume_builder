'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export interface AuthUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const user: AuthUser | null = session?.user
    ? { id: session.user.id, email: session.user.email, name: session.user.name, image: session.user.image }
    : null

  return (
    <AuthContext.Provider value={{ user, loading: status === 'loading' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
