import type { CollectionReference } from 'firebase-admin/firestore'
import type { ReportData } from '@/types/report'

// Firestore hard limit is 1 MB per document.
// We chunk the JSON into 900 KB pieces stored in a subcollection so documents
// stay well under the limit regardless of report size.
const CHUNK_SIZE = 900_000 // bytes

export async function saveReportBlob(blobCol: CollectionReference, report: ReportData): Promise<void> {
  const json = JSON.stringify(report)

  // Delete existing chunks first
  const existing = await blobCol.get()
  if (!existing.empty) {
    await Promise.all(existing.docs.map((d) => d.ref.delete()))
  }

  // Split and write in parallel
  const chunks: string[] = []
  for (let i = 0; i < json.length; i += CHUNK_SIZE) {
    chunks.push(json.slice(i, i + CHUNK_SIZE))
  }
  await Promise.all(
    chunks.map((chunk, idx) =>
      blobCol.doc(String(idx).padStart(6, '0')).set({ data: chunk }),
    ),
  )
}

export async function loadReportBlob(blobCol: CollectionReference): Promise<ReportData | null> {
  const snap = await blobCol.get()
  if (snap.empty) return null
  const sorted = snap.docs.sort((a, b) => a.id.localeCompare(b.id))
  const json = sorted.map((d) => d.data().data as string).join('')
  return JSON.parse(json) as ReportData
}

export async function deleteReportBlob(blobCol: CollectionReference): Promise<void> {
  const snap = await blobCol.get()
  if (!snap.empty) {
    await Promise.all(snap.docs.map((d) => d.ref.delete()))
  }
}
