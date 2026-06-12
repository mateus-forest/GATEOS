import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getClients() {
  return selectRows("clients", [], { orderBy: "created_at", ascending: false })
}

export async function getClientById(id: string) {
  const rows = await selectRows("clients", [], { eq: { id } })
  return rows[0] ?? null
}

export async function createClient(payload: SupabaseRow) {
  return insertRow("clients", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateClient(id: string, payload: SupabaseRow) {
  return updateRows("clients", payload, { id }, [{ ...payload, id }])
}
