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
  const firstPayload = {
    ...payload,
    contract_number: await getNextContractNumber(String(payload.contract_number ?? "")),
  }

  try {
    return await insertRow("contracts", firstPayload, { ...firstPayload, id: crypto.randomUUID() })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes("23505") && !message.toLowerCase().includes("duplicate key")) throw error

    console.warn("[contracts] Numero de contrato duplicado. Gerando novo identificador e tentando novamente.", error)
    const retryPayload = {
      ...payload,
      contract_number: await getNextContractNumber(String(firstPayload.contract_number ?? "")),
    }
    return insertRow("contracts", retryPayload, { ...retryPayload, id: crypto.randomUUID() })
  }
}

function splitContractNumber(value: string) {
  const clean = value.trim().toUpperCase()
  const match = clean.match(/^(.*)-(\d{3})$/)
  return {
    prefix: match?.[1] || clean || `GATE-CONTRATO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`,
    sequence: match ? Number(match[2]) : 0,
  }
}

async function getNextContractNumber(requestedNumber: string) {
  const { prefix, sequence } = splitContractNumber(requestedNumber)
  const contracts = await selectRows<SupabaseRow>("contracts", [])
  const usedNumbers = new Set(contracts.map((contract) => String(contract.contract_number ?? "").trim().toUpperCase()))

  if (sequence > 0 && !usedNumbers.has(`${prefix}-${String(sequence).padStart(3, "0")}`)) {
    return `${prefix}-${String(sequence).padStart(3, "0")}`
  }

  const maxSequence = contracts.reduce((max, contract) => {
    const current = String(contract.contract_number ?? "").trim().toUpperCase()
    const match = current.match(new RegExp(`^${escapeRegExp(prefix)}-(\\d{3})$`))
    if (!match) return max
    return Math.max(max, Number(match[1]))
  }, sequence)

  return `${prefix}-${String(maxSequence + 1).padStart(3, "0")}`
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function updateContract(id: string, payload: SupabaseRow) {
  return updateRows("contracts", payload, { id }, [{ ...payload, id }])
}

export async function deleteContract(id: string) {
  return deleteRows("contracts", { id }, [])
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
