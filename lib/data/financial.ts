import { insertRow, selectRows } from "@/lib/data/supabase-helpers"
import { getDreCategories } from "@/lib/data/dre"
import { normalizeFinancialStatus } from "@/lib/data/financial-status"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getFinancialEntries() {
  return selectRows("financial_entries", [], { orderBy: "competence_date", ascending: false })
}

export async function createFinancialEntry(payload: SupabaseRow) {
  return insertRow(
    "financial_entries",
    {
      ...payload,
      status: normalizeFinancialStatus(payload.status),
    },
    { ...payload, id: crypto.randomUUID() }
  )
}

export async function getFinancialSelectOptions() {
  const [dreCategories, costCenters, bankAccounts, clients, contracts] = await Promise.all([
    getDreCategories(),
    selectRows("cost_centers", []),
    selectRows("bank_accounts", []),
    selectRows("clients", []),
    selectRows("contracts", []),
  ])
  return { dreCategories, costCenters, bankAccounts, clients, contracts }
}

export async function createBankAccount(payload: SupabaseRow) {
  return insertRow("bank_accounts", payload, { ...payload, id: crypto.randomUUID() })
}
