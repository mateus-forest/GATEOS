import { clients } from "@/lib/mock-data"
import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getClients() {
  return selectRows("clients", clients, { orderBy: "created_at", ascending: false })
}

export async function getClientById(id: string) {
  const rows = await selectRows("clients", clients.filter((item) => item.id === id))
  return rows[0] ?? clients.find((item) => item.id === id) ?? null
}

export async function createClient(payload: SupabaseRow) {
  return insertRow("clients", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateClient(id: string, payload: SupabaseRow) {
  return updateRows("clients", payload, { id }, [{ ...payload, id }])
}
