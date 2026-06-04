import { transactions } from "@/lib/mock-data"
import { insertRow, selectRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getFinancialEntries() {
  return selectRows("financial_entries", transactions, { orderBy: "competence_date", ascending: false })
}

export async function createFinancialEntry(payload: SupabaseRow) {
  return insertRow("financial_entries", payload, { ...payload, id: crypto.randomUUID() })
}

export async function getFinancialSelectOptions() {
  const [dreCategories, costCenters, bankAccounts, clients, contracts] = await Promise.all([
    selectRows("dre_categories", []),
    selectRows("cost_centers", []),
    selectRows("bank_accounts", []),
    selectRows("clients", []),
    selectRows("contracts", []),
  ])
  return { dreCategories, costCenters, bankAccounts, clients, contracts }
}
