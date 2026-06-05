import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getLegalCases() {
  return selectRows("legal_cases", [])
}

export async function getLegalSummary() {
  return selectRows("v_legal_summary", [])
}

export async function createLegalCase(payload: SupabaseRow) {
  return insertRow("legal_cases", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateLegalCase(id: string, payload: SupabaseRow) {
  return updateRows("legal_cases", payload, { id }, [{ ...payload, id }])
}

export async function createLegalUpdate(payload: SupabaseRow) {
  return insertRow("legal_updates", payload, { ...payload, id: crypto.randomUUID() })
}

export async function createLegalAgreementInstallment(payload: SupabaseRow) {
  return insertRow("legal_agreement_installments", payload, { ...payload, id: crypto.randomUUID() })
}
