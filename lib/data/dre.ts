import { callRpc, deleteRows, insertRow, selectRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getDreMonthly(year?: string) {
  const rows = await selectRows("v_dre_monthly", [])
  return year ? rows.filter((row) => String(row.year ?? row.reference_year ?? "").includes(year)) : rows
}

export async function getDreMonthlyClosings() {
  return selectRows("dre_monthly_closings", [])
}

export async function getDreCategories() {
  return selectRows("dre_categories", [])
}

export async function createDreManualAdjustment(payload: SupabaseRow) {
  return insertRow("dre_manual_adjustments", payload, { ...payload, id: crypto.randomUUID() })
}

export async function deleteDreManualAdjustment(id: string) {
  return deleteRows("dre_manual_adjustments", { id }, [])
}

export async function closeDreMonth(payload: SupabaseRow) {
  return callRpc("close_dre_month", payload, { ok: true })
}

export async function reopenDreMonth(payload: SupabaseRow) {
  return callRpc("reopen_dre_month", payload, { ok: true })
}
