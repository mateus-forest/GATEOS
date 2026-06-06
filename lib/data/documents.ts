import { insertRow, selectRows } from "@/lib/data/supabase-helpers"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
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

export async function uploadDocumentFile({
  bucket = "gate-documents",
  file,
  folder = "documents",
  record,
}: {
  bucket?: (typeof documentBuckets)[number]
  file: File
  folder?: string
  record?: SupabaseRow
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao esta configurado. O arquivo nao foi enviado.")
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error("Nao foi possivel iniciar a conexao com o Supabase Storage.")
  }

  const safeName = file.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const path = `${folder}/${crypto.randomUUID()}-${safeName || "arquivo"}`
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    console.error("[documents] Falha no upload", uploadError)
    throw new Error(`Falha no upload para o bucket ${bucket}. ${uploadError.message}`)
  }

  return createDocumentRecord({
    name: file.name,
    file_name: file.name,
    type: file.type || "application/octet-stream",
    mime_type: file.type || null,
    size: file.size,
    file_size: file.size,
    bucket,
    storage_bucket: bucket,
    path,
    storage_path: path,
    category: String(record?.category ?? "Documento"),
    created_at: new Date().toISOString(),
    ...record,
  })
}
