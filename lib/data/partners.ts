import { insertRow, selectRowsStrict, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getPartners() {
  return selectRowsStrict("partners")
}

export async function getPartnerEntries() {
  return selectRowsStrict("partner_entries")
}

export async function getProfitDistribution() {
  return selectRowsStrict("v_profit_distribution_current_month")
}

export async function createPartnerEntry(payload: SupabaseRow) {
  return insertRow("partner_entries", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updatePartner(id: string, payload: SupabaseRow) {
  return updateRows("partners", payload, { id }, [{ ...payload, id }])
}
