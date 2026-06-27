import { deleteRows, insertRow, selectRowsStrict, updateRows } from "@/lib/data/supabase-helpers"
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

export async function deleteEquipment(id: string) {
  const [contractLinks, maintenanceOrders] = await Promise.all([
    selectRowsStrict<SupabaseRow>("contract_equipment", { eq: { equipment_id: id } }),
    selectRowsStrict<SupabaseRow>("maintenance_orders", { eq: { equipment_id: id } }),
  ])

  const blockers = [
    contractLinks.length ? `${contractLinks.length} contrato(s) vinculado(s)` : "",
    maintenanceOrders.length ? `${maintenanceOrders.length} chamado(s)/ordem(ns) de manutencao` : "",
  ].filter(Boolean)

  if (blockers.length) {
    throw new Error(`Equipamento nao pode ser excluido porque possui ${blockers.join(" e ")}.`)
  }

  return deleteRows("equipment", { id }, [])
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
