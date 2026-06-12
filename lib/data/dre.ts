import { callRpc, deleteRows, insertRow, selectRows } from "@/lib/data/supabase-helpers"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
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

export async function getDreManualAdjustments() {
  return selectRows("dre_manual_adjustments", [])
}

export async function createDreManualAdjustment(payload: SupabaseRow) {
  return insertRow("dre_manual_adjustments", payload, { ...payload, id: crypto.randomUUID() })
}

export async function createDreMonthlyClosing(payload: SupabaseRow) {
  return insertRow("dre_monthly_closings", payload, { ...payload, id: crypto.randomUUID() })
}

export async function createDreCategory(payload: SupabaseRow) {
  return insertRow("dre_categories", payload, { ...payload, id: crypto.randomUUID() })
}

export async function deleteDreManualAdjustment(id: string) {
  return deleteRows("dre_manual_adjustments", { id }, [])
}

function getDreSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("dre_manual_adjustments: Supabase nao esta configurado. A exclusao nao foi executada.")
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error("dre_manual_adjustments: nao foi possivel iniciar a conexao com o Supabase.")
  }

  return supabase
}

export async function deleteDreImportedAdjustments() {
  const supabase = getDreSupabaseClient()
  const { data, error } = await supabase
    .from("dre_manual_adjustments")
    .delete()
    .ilike("reason", "IMPORTACAO_DRE:%")
    .select("*")

  if (error) {
    throw new Error(`dre_manual_adjustments: falha ao excluir no Supabase. ${error.message}`)
  }

  return data ?? []
}

export async function deleteAllDreManualAdjustments() {
  const supabase = getDreSupabaseClient()
  const { data, error } = await supabase
    .from("dre_manual_adjustments")
    .delete()
    .neq("id", "__never__")
    .select("*")

  if (error) {
    throw new Error(`dre_manual_adjustments: falha ao excluir no Supabase. ${error.message}`)
  }

  return data ?? []
}

export async function closeDreMonth(payload: SupabaseRow) {
  return callRpc("close_dre_month", payload, { ok: true })
}

export async function reopenDreMonth(payload: SupabaseRow) {
  return callRpc("reopen_dre_month", payload, { ok: true })
}
