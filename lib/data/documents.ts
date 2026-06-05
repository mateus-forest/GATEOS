import { insertRow, selectRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export const documentBuckets = ["gate-documents", "gate-contracts", "gate-legal"] as const

export async function getDocuments() {
  return selectRows("documents", [])
}

export async function createDocumentRecord(payload: SupabaseRow) {
  return insertRow("documents", payload, { ...payload, id: crypto.randomUUID() })
}

export async function prepareDocumentUpload(bucket: (typeof documentBuckets)[number], path: string) {
  return { bucket, path, ready: true }
}
