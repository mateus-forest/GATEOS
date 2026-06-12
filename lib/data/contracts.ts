import { deleteRows, insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"
import { getEquipment, getEquipmentTotalQuantity, updateEquipment } from "@/lib/data/equipment"

export async function getContracts() {
  const [summaryRows, contractRows] = await Promise.all([
    selectRows<SupabaseRow>("v_contracts_summary", []),
    selectRows<SupabaseRow>("contracts", []),
  ])
  const contractsById = new Map(contractRows.map((contract) => [String(contract.id ?? ""), contract]))

  return summaryRows.map((summary) => {
    const contract = contractsById.get(String(summary.id ?? ""))
    return {
      ...summary,
      client_id: summary.client_id ?? contract?.client_id,
      public_access_token: contract?.public_access_token,
      public_access_enabled: contract?.public_access_enabled,
      public_access_created_at: contract?.public_access_created_at,
    }
  })
}

export async function createContract(payload: SupabaseRow) {
  return insertRow("contracts", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateContract(id: string, payload: SupabaseRow) {
  return updateRows("contracts", payload, { id }, [{ ...payload, id }])
}

export async function prepareInstallmentsForContract(contractId: string) {
  return { contract_id: contractId, ready: true }
}

export async function getContractEquipment(contractId?: string) {
  return selectRows<SupabaseRow>(
    "contract_equipment",
    [],
    contractId ? { eq: { contract_id: contractId } } : {}
  )
}

export async function createContractEquipment(payload: SupabaseRow) {
  return insertRow("contract_equipment", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateContractEquipment(id: string, payload: SupabaseRow) {
  return updateRows("contract_equipment", payload, { id }, [{ ...payload, id }])
}

export async function deleteContractEquipment(id: string) {
  return deleteRows("contract_equipment", { id }, [])
}

export async function recalculateEquipmentInventory(equipmentId: string) {
  const [equipmentRows, links] = await Promise.all([
    getEquipment(),
    getContractEquipment(),
  ])
  const equipment = equipmentRows.find((item) => String((item as SupabaseRow).id ?? "") === equipmentId) as SupabaseRow | undefined
  if (!equipment) {
    throw new Error("Equipamento nao encontrado para recalcular estoque.")
  }

  const total = getEquipmentTotalQuantity(equipment)
  const rented = links
    .filter((item) => String(item.equipment_id ?? "") === equipmentId)
    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
  const available = Math.max(0, total - rented)

  await updateEquipment(equipmentId, {
    quantity_rented: rented,
    quantity_available: available,
  })

  return { total, rented, available }
}
