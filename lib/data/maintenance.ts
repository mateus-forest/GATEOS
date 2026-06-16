import { insertRow, selectRowsStrict, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getMaintenanceOrders() {
  return selectRowsStrict("maintenance_orders")
}

export async function createMaintenanceOrder(payload: SupabaseRow) {
  return insertRow("maintenance_orders", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateMaintenanceOrder(id: string, payload: SupabaseRow) {
  return updateRows("maintenance_orders", payload, { id }, [{ ...payload, id }])
}
