import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getEquipment() {
  return selectRows("equipment", [])
}

export async function createEquipment(payload: SupabaseRow) {
  return insertRow("equipment", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateEquipment(id: string, payload: SupabaseRow) {
  return updateRows("equipment", payload, { id }, [{ ...payload, id }])
}
