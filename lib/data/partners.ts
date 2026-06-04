import { partners } from "@/lib/mock-data"
import { insertRow, selectRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getPartners() {
  return selectRows("partners", partners)
}

export async function getPartnerEntries() {
  return selectRows("partner_entries", [])
}

export async function getProfitDistribution() {
  return selectRows("v_profit_distribution_current_month", [])
}

export async function createPartnerEntry(payload: SupabaseRow) {
  return insertRow("partner_entries", payload, { ...payload, id: crypto.randomUUID() })
}
