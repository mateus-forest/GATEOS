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

export async function getDreImportSnapshots(year?: string) {
  const supabase = getDreSupabaseClient()
  let query = supabase
    .from("dre_imports")
    .select("*")
    .order("created_at", { ascending: false })

  if (year) query = query.eq("year", Number(year))

  const { data, error } = await query
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_imports")) {
      return { missingStructure: true as const, imports: [] as SupabaseRow[] }
    }
    throw new Error(`dre_imports: falha ao listar importacoes. ${error.message}`)
  }

  return { missingStructure: false as const, imports: data ?? [] }
}

export async function getDreOperationalTemplateRows(year?: string) {
  const supabase = getDreSupabaseClient()
  let query = supabase
    .from("dre_operational_template_rows")
    .select("*")
    .eq("active", true)
    .order("row_index", { ascending: true })

  if (year) query = query.eq("year", Number(year))

  const { data, error } = await query
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_operational_template_rows")) {
      return { missingStructure: true as const, rows: [] as SupabaseRow[] }
    }
    throw new Error(`dre_operational_template_rows: falha ao consultar template. ${error.message}`)
  }

  return { missingStructure: false as const, rows: data ?? [] }
}

export async function replaceDreOperationalTemplateRows(year: number, rows: SupabaseRow[]) {
  const supabase = getDreSupabaseClient()
  const { error: deleteError } = await supabase
    .from("dre_operational_template_rows")
    .delete()
    .eq("year", year)

  if (deleteError) {
    if (deleteError.code === "42P01" || deleteError.code === "PGRST205" || deleteError.message.toLowerCase().includes("dre_operational_template_rows")) {
      return { missingStructure: true as const, rows: [] as SupabaseRow[] }
    }
    throw new Error(`dre_operational_template_rows: falha ao substituir template. ${deleteError.message}`)
  }

  if (!rows.length) return { missingStructure: false as const, rows: [] as SupabaseRow[] }

  const { data, error } = await supabase
    .from("dre_operational_template_rows")
    .insert(rows.map((row) => ({ ...row, year })))
    .select("*")

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_operational_template_rows")) {
      return { missingStructure: true as const, rows: [] as SupabaseRow[] }
    }
    throw new Error(`dre_operational_template_rows: falha ao salvar template. ${error.message}`)
  }

  return { missingStructure: false as const, rows: data ?? [] }
}

export async function getDreImportSnapshotById(importId: string) {
  const supabase = getDreSupabaseClient()
  const { data: dreImport, error } = await supabase
    .from("dre_imports")
    .select("*")
    .eq("id", importId)
    .maybeSingle()

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_imports")) {
      return { missingStructure: true as const, snapshot: null }
    }
    throw new Error(`dre_imports: falha ao consultar importacao. ${error.message}`)
  }

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
  importKind?: string
  requireRawData?: boolean
  rows: SupabaseRow[]
}) {
  const supabase = getDreSupabaseClient()
  let insertPayload: SupabaseRow = {
    file_name: payload.fileName,
    sheet_name: payload.sheetName,
    year: payload.year,
    imported_by: payload.importedBy,
    import_kind: payload.importKind ?? "historico",
  }
  let result = await supabase.from("dre_imports").insert(insertPayload).select("*").single()

  if (result.error && (result.error.code === "PGRST204" || result.error.message.toLowerCase().includes("import_kind"))) {
    console.warn("[dre-import] Coluna dre_imports.import_kind ausente. Execute supabase/gate-os-dre-history-import-support.sql para classificar historico/operacional.")
    insertPayload = {
      file_name: payload.fileName,
      sheet_name: payload.sheetName,
      year: payload.year,
      imported_by: payload.importedBy,
    }
    result = await supabase.from("dre_imports").insert(insertPayload).select("*").single()
  }

  const dreImport = result.data
  if (result.error) {
    if (result.error.code === "42P01" || result.error.code === "PGRST205" || result.error.message.toLowerCase().includes("dre_imports")) {
      throw new Error("Estrutura de historico da DRE incompleta. Execute o SQL de suporte.")
    }
    throw new Error(`dre_imports: falha ao salvar importacao. ${result.error.message}`)
  }

  const importId = dreImport.id
  const rows = payload.rows.map((row) => ({ ...row, import_id: importId }))
  let rowsResult = await supabase
    .from("dre_import_rows")
    .insert(rows)
    .select("*")

  if (rowsResult.error && (rowsResult.error.code === "PGRST204" || rowsResult.error.message.toLowerCase().includes("raw_data"))) {
    if (payload.requireRawData) {
      await supabase.from("dre_imports").delete().eq("id", importId)
      throw new Error("Para importar historico com multiplos anos, execute o SQL de suporte com raw_data.")
    }
    console.warn("[dre-import] Coluna dre_import_rows.raw_data ausente. Execute supabase/gate-os-dre-history-import-support.sql para preservar historicos genericos completos.")
    rowsResult = await supabase
      .from("dre_import_rows")
      .insert(rows.map(({ raw_data, ...row }) => row))
      .select("*")
  }

  if (rowsResult.error) {
    if (rowsResult.error.code === "42P01" || rowsResult.error.code === "PGRST205" || rowsResult.error.message.toLowerCase().includes("dre_import_rows")) {
      throw new Error("Estrutura de historico da DRE incompleta. Execute o SQL de suporte.")
    }
    throw new Error(`dre_import_rows: falha ao salvar linhas importadas. ${rowsResult.error.message}`)
  }

  return { import: dreImport, rows: rowsResult.data ?? [] }
}

export async function deleteDreHistoryImportSnapshots() {
  const supabase = getDreSupabaseClient()
  const { data: imports, error: selectError } = await supabase.from("dre_imports").select("*")

  if (selectError) {
    if (selectError.code === "42P01" || selectError.code === "PGRST205" || selectError.message.toLowerCase().includes("dre_imports")) {
      return []
    }
    throw new Error(`dre_imports: falha ao buscar historicos. ${selectError.message}`)
  }

  const ids = (imports ?? [])
    .filter((row) => {
      const kind = String(row.import_kind ?? "").toLowerCase()
      const sheet = String(row.sheet_name ?? "").toLowerCase()
      return kind === "historico" || (!kind && !sheet.includes("2026"))
    })
    .map((row) => row.id)
    .filter(Boolean)
  if (!ids.length) return []

  const { error: rowsError } = await supabase.from("dre_import_rows").delete().in("import_id", ids)
  if (rowsError && rowsError.code !== "42P01" && rowsError.code !== "PGRST205") {
    throw new Error(`dre_import_rows: falha ao excluir linhas historicas. ${rowsError.message}`)
  }

  const { data, error } = await supabase
    .from("dre_imports")
    .delete()
    .in("id", ids)
    .select("*")

  if (error) {
    throw new Error(`dre_imports: falha ao excluir historicos. ${error.message}`)
  }

  return data ?? []
}

export async function deleteDreImportSnapshot(importId: string) {
  const supabase = getDreSupabaseClient()
  const { error: rowsError } = await supabase
    .from("dre_import_rows")
    .delete()
    .eq("import_id", importId)

  if (rowsError && rowsError.code !== "42P01" && rowsError.code !== "PGRST205") {
    throw new Error(`dre_import_rows: falha ao excluir linhas da importacao. ${rowsError.message}`)
  }

  const { data, error } = await supabase
    .from("dre_imports")
    .delete()
    .eq("id", importId)
    .select("*")

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || error.message.toLowerCase().includes("dre_imports")) {
      return []
    }
    throw new Error(`dre_imports: falha ao excluir importacao. ${error.message}`)
  }

  return data ?? []
}

export async function closeDreMonth(payload: SupabaseRow) {
  return callRpc("close_dre_month", payload, { ok: true })
}

export async function reopenDreMonth(payload: SupabaseRow) {
  return callRpc("reopen_dre_month", payload, { ok: true })
}
