import { insertRow, selectRowsStrict, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getEquipment() {
  return selectRowsStrict("equipment")
}

export async function createEquipment(payload: SupabaseRow) {
  return insertRow("equipment", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateEquipment(id: string, payload: SupabaseRow) {
  return updateRows("equipment", payload, { id }, [{ ...payload, id }])
}

export function getEquipmentTotalQuantity(equipment: SupabaseRow) {
  const value = equipment.quantity_total ?? equipment.total_quantity ?? equipment.quantity ?? equipment.quantidade_total ?? equipment.total ?? 0
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function getEquipmentAvailableQuantity(equipment: SupabaseRow) {
  const explicit = equipment.quantity_available ?? equipment.available_quantity ?? equipment.quantidade_disponivel
  if (explicit !== undefined && explicit !== null && String(explicit) !== "") {
    const number = Number(explicit)
    return Number.isFinite(number) ? number : 0
  }

  const total = getEquipmentTotalQuantity(equipment)
  const rented = Number(equipment.quantity_rented ?? equipment.rented_quantity ?? equipment.quantidade_locada ?? 0)
  return Math.max(0, total - (Number.isFinite(rented) ? rented : 0))
}
