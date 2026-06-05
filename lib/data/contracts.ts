import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getContracts() {
  return selectRows("v_contracts_summary", [])
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
