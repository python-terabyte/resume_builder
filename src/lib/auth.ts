'use client'

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'

export type AuthUser = User

export function subscribeToAuth(cb: (user: User | null) => void) {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, cb)
}

export async function signInEmail(email: string, password: string) {
  const auth = getFirebaseAuth()
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signUpEmail(email: string, password: string, displayName?: string) {
  const auth = getFirebaseAuth()
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  return cred.user
}

export async function signInGoogle() {
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  return cred.user
}

export async function signOut() {
  const auth = getFirebaseAuth()
  await fbSignOut(auth)
}
