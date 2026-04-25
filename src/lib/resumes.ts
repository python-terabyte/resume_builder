'use client'

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getDb } from './firebase'
import { ResumeData } from '@/types/resume'

export interface ResumeDoc {
  id: string
  name: string
  resume: ResumeData
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function userResumesRef(uid: string) {
  return collection(getDb(), 'users', uid, 'resumes')
}

function userResumeRef(uid: string, docId: string) {
  return doc(getDb(), 'users', uid, 'resumes', docId)
}

export async function listResumes(uid: string): Promise<ResumeDoc[]> {
  const q = query(userResumesRef(uid), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data() as Omit<ResumeDoc, 'id'>
    return { id: d.id, ...data }
  })
}

export async function getResume(uid: string, docId: string): Promise<ResumeDoc | null> {
  const snap = await getDoc(userResumeRef(uid, docId))
  if (!snap.exists()) return null
  const data = snap.data() as Omit<ResumeDoc, 'id'>
  return { id: snap.id, ...data }
}

export async function createResume(uid: string, name: string, resume: ResumeData): Promise<string> {
  const ref = await addDoc(userResumesRef(uid), {
    name,
    resume,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function saveResume(uid: string, docId: string, name: string, resume: ResumeData): Promise<void> {
  await setDoc(
    userResumeRef(uid, docId),
    { name, resume, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function renameResume(uid: string, docId: string, name: string): Promise<void> {
  await updateDoc(userResumeRef(uid, docId), { name, updatedAt: serverTimestamp() })
}

export async function deleteResume(uid: string, docId: string): Promise<void> {
  await deleteDoc(userResumeRef(uid, docId))
}
