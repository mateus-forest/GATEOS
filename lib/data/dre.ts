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
  const { data: rows, error: selectError } = await supabase
    .from("dre_manual_adjustments")
    .select("id")
    .or("reason.ilike.IMPORTACAO_DRE:%,reason.ilike.Importacao Excel -%,reason.ilike.Importação Excel -%")

  if (selectError) {
    throw new Error(`dre_manual_adjustments: falha ao buscar importacoes no Supabase. ${selectError.message}`)
  }

  const ids = (rows ?? []).map((row) => row.id).filter(Boolean)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from("dre_manual_adjustments")
    .delete()
    .in("id", ids)
    .select("*")

  if (error) {
    throw new Error(`dre_manual_adjustments: falha ao excluir no Supabase. ${error.message}`)
  }

  return data ?? []
}

export async function deleteAllDreManualAdjustments() {
  const supabase = getDreSupabaseClient()
  const { data: rows, error: selectError } = await supabase
    .from("dre_manual_adjustments")
    .select("id")

  if (selectError) {
    throw new Error(`dre_manual_adjustments: falha ao buscar ajustes no Supabase. ${selectError.message}`)
  }

  const ids = (rows ?? []).map((row) => row.id).filter(Boolean)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from("dre_manual_adjustments")
    .delete()
    .in("id", ids)
    .select("*")

  if (error) {
    throw new Error(`dre_manual_adjustments: falha ao excluir no Supabase. ${error.message}`)
  }

  return data ?? []
}

export async function getLatestDreImportSnapshot(year?: string) {
  const supabase = getDreSupabaseClient()
  let query = supabase
    .from("dre_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (year) query = query.eq("year", Number(year))

  const { data: imports, error } = await query
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_imports")) {
      return { missingStructure: true as const, snapshot: null }
    }
    throw new Error(`dre_imports: falha ao consultar importacao. ${error.message}`)
  }

  const dreImport = imports?.[0]
  if (!dreImport?.id) return { missingStructure: false as const, snapshot: null }

  const { data: rows, error: rowsError } = await supabase
    .from("dre_import_rows")
    .select("*")
    .eq("import_id", dreImport.id)
    .order("row_index", { ascending: true })

  if (rowsError) {
    if (rowsError.code === "42P01" || rowsError.code === "PGRST205" || rowsError.message.toLowerCase().includes("dre_import_rows")) {
      return { missingStructure: true as const, snapshot: null }
    }
    throw new Error(`dre_import_rows: falha ao consultar linhas importadas. ${rowsError.message}`)
  }

  return { missingStructure: false as const, snapshot: { import: dreImport, rows: rows ?? [] } }
}

export async function createDreImportSnapshot(payload: {
  fileName: string
  sheetName: string
  year: number
  importedBy: string
  rows: SupabaseRow[]
}) {
  const supabase = getDreSupabaseClient()
  const { data: dreImport, error } = await supabase
    .from("dre_imports")
    .insert({
      file_name: payload.fileName,
      sheet_name: payload.sheetName,
      year: payload.year,
      imported_by: payload.importedBy,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_imports")) {
      throw new Error("Estrutura de importacao integral da DRE ainda nao foi criada. Execute o SQL indicado.")
    }
    throw new Error(`dre_imports: falha ao salvar importacao. ${error.message}`)
  }

  const importId = dreImport.id
  const rows = payload.rows.map((row) => ({ ...row, import_id: importId }))
  const { data, error: rowsError } = await supabase
    .from("dre_import_rows")
    .insert(rows)
    .select("*")

  if (rowsError) {
    throw new Error(`dre_import_rows: falha ao salvar linhas importadas. ${rowsError.message}`)
  }

  return { import: dreImport, rows: data ?? [] }
}

export async function deleteDreImportSnapshots() {
  const supabase = getDreSupabaseClient()
  const { data: imports, error: selectError } = await supabase.from("dre_imports").select("id")

  if (selectError) {
    if (selectError.code === "42P01" || selectError.code === "PGRST205" || selectError.message.toLowerCase().includes("dre_imports")) {
      return []
    }
    throw new Error(`dre_imports: falha ao buscar importacoes. ${selectError.message}`)
  }

  const ids = (imports ?? []).map((row) => row.id).filter(Boolean)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from("dre_imports")
    .delete()
    .in("id", ids)
    .select("*")

  if (error) {
    throw new Error(`dre_imports: falha ao excluir importacoes. ${error.message}`)
  }

  return data ?? []
}

export async function closeDreMonth(payload: SupabaseRow) {
  return callRpc("close_dre_month", payload, { ok: true })
}

export async function reopenDreMonth(payload: SupabaseRow) {
  return callRpc("reopen_dre_month", payload, { ok: true })
}
