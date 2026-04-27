import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { adminAuth } from './firebase-admin'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                returnSecureToken: true,
              }),
            },
          )
          if (!res.ok) return null
          const data = await res.json() as { localId: string; email: string; displayName?: string }
          return { id: data.localId, email: data.email, name: data.displayName ?? null }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google' && user.email) {
          try {
            const fbUser = await adminAuth().getUserByEmail(user.email)
            token.uid = fbUser.uid
          } catch {
            const created = await adminAuth().createUser({
              email: user.email,
              displayName: user.name ?? undefined,
              photoURL: user.image ?? undefined,
            })
            token.uid = created.uid
          }
        } else {
          token.uid = user.id
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.uid
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
}
