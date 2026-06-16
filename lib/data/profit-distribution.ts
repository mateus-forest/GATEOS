import { insertRow, selectRowsStrict, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export type ProfitDistributionRule = SupabaseRow & {
  id?: string
  name?: string
  rule_type?: string
  percentage?: number | string | null
  fixed_amount?: number | string | null
  is_active?: boolean | null
}

export async function getProfitDistributionRules() {
  return selectRowsStrict<ProfitDistributionRule>("partner_distribution_rules", {
    orderBy: "created_at",
    ascending: true,
  })
}

export async function createProfitDistributionRule(payload: SupabaseRow) {
  return insertRow("partner_distribution_rules", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateProfitDistributionRule(id: string, payload: SupabaseRow) {
  return updateRows("partner_distribution_rules", payload, { id }, [{ ...payload, id }])
}

