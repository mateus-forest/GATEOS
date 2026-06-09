import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { SupabaseRow } from "@/lib/supabase/types"

type QueryOptions = {
  orderBy?: string
  ascending?: boolean
  limit?: number
  eq?: SupabaseRow
}

const writableColumnsByTable: Record<string, Set<string>> = {
  clients: new Set([
    "name",
    "document",
    "type",
    "status",
    "email",
    "phone",
    "whatsapp",
    "city",
    "notes",
    "company_name",
    "trade_name",
    "legal_name",
    "fantasy_name",
    "document_number",
  ]),
  contracts: new Set([
    "client_id",
    "contract_number",
    "type",
    "status",
    "start_date",
    "end_date",
    "due_day",
    "monthly_value",
    "total_value",
    "public_access_token",
    "public_access_enabled",
    "public_access_created_at",
  ]),
  financial_entries: new Set([
    "type",
    "status",
    "description",
    "value",
    "amount",
    "competence_date",
    "due_date",
    "payment_date",
    "dre_category_id",
    "bank_account_id",
    "client_id",
    "payment_method",
    "attachment_type",
  ]),
  equipment: new Set([
    "name",
    "category",
    "type",
    "status",
    "total_quantity",
    "description",
    "notes",
  ]),
  assets: new Set([
    "equipment_id",
    "name",
    "category",
    "status",
    "description",
  ]),
  maintenance_orders: new Set([
    "client_id",
    "contract_id",
    "equipment_id",
    "type",
    "status",
    "priority",
    "problem",
    "description",
    "entry_date",
    "expected_exit_date",
  ]),
  legal_cases: new Set([
    "client_id",
    "contract_id",
    "client_name",
    "contract_number",
    "status",
    "stage",
    "risk",
    "next_deadline",
    "case_summary",
    "internal_notes",
  ]),
  documents: new Set([
    "name",
    "file_name",
    "type",
    "mime_type",
    "size",
    "file_size",
    "bucket",
    "storage_bucket",
    "path",
    "storage_path",
    "category",
    "client_id",
    "contract_id",
    "financial_entry_id",
    "legal_case_id",
    "notes",
    "created_at",
  ]),
  partner_entries: new Set([
    "partner_id",
    "partner_name",
    "type",
    "entry_type",
    "amount",
    "value",
    "date",
    "reference_month",
    "description",
    "status",
  ]),
  dre_manual_adjustments: new Set([
    "description",
    "amount",
    "value",
    "reference_month",
    "category",
    "type",
  ]),
}

function warnFallback(context: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Supabase fallback] ${context}`, error ?? "")
  }
}

function describeSupabaseError(error: unknown) {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    return [
      typeof record.message === "string" ? record.message : "",
      typeof record.details === "string" ? record.details : "",
      typeof record.hint === "string" ? record.hint : "",
      typeof record.code === "string" ? `Codigo: ${record.code}` : "",
    ].filter(Boolean).join(" ")
  }

  return error instanceof Error ? error.message : String(error)
}

function sanitizePayload(table: string, payload: SupabaseRow) {
  const allowedColumns = writableColumnsByTable[table]
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([key]) => !allowedColumns || allowedColumns.has(key))
      .map(([key, value]) => [key, value === undefined || value === "" ? null : value])
  ) satisfies SupabaseRow
}

export async function selectRows<T>(
  table: string,
  fallback: T[],
  options: QueryOptions = {}
) {
  if (!isSupabaseConfigured()) {
    warnFallback(`${table}: env não configurado`)
    return fallback
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) return fallback

  let query = supabase.from(table).select("*")
  if (options.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    warnFallback(`${table}: falha na consulta`, error)
    return fallback
  }

  return (data ?? fallback) as T[]
}

export async function insertRow<T>(
  table: string,
  payload: SupabaseRow,
  fallback: T
) {
  void fallback
  if (!isSupabaseConfigured()) {
    throw new Error(`${table}: Supabase nao esta configurado. O registro nao foi salvo.`)
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(`${table}: nao foi possivel iniciar a conexao com o Supabase.`)
  }

  const cleanPayload = sanitizePayload(table, payload)

  const { data, error } = await supabase.from(table).insert(cleanPayload).select("*").single()
  if (error) {
    console.error(`[${table}] Falha ao inserir no Supabase`, error)
    throw new Error(`${table}: falha ao inserir no Supabase. ${describeSupabaseError(error)}`)
  }

  if (!data) {
    throw new Error(`${table}: Supabase nao retornou o registro criado.`)
  }

  return data as T
}

export async function updateRows<T>(
  table: string,
  payload: SupabaseRow,
  match: SupabaseRow,
  fallback: T
) {
  void fallback
  if (!isSupabaseConfigured()) {
    throw new Error(`${table}: Supabase nao esta configurado. A alteracao nao foi salva.`)
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(`${table}: nao foi possivel iniciar a conexao com o Supabase.`)
  }

  const cleanPayload = sanitizePayload(table, payload)

  let query = supabase.from(table).update(cleanPayload)
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data, error } = await query.select("*")
  if (error) {
    console.error(`[${table}] Falha ao atualizar no Supabase`, error)
    throw new Error(`${table}: falha ao atualizar no Supabase. ${describeSupabaseError(error)}`)
  }

  if (!data) {
    throw new Error(`${table}: Supabase nao retornou o registro atualizado.`)
  }

  return data as T
}

export async function deleteRows<T>(
  table: string,
  match: SupabaseRow,
  fallback: T
) {
  void fallback
  if (!isSupabaseConfigured()) {
    throw new Error(`${table}: Supabase nao esta configurado. A exclusao nao foi executada.`)
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(`${table}: nao foi possivel iniciar a conexao com o Supabase.`)
  }

  let query = supabase.from(table).delete()
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data, error } = await query.select("*")
  if (error) {
    console.error(`[${table}] Falha ao excluir no Supabase`, error)
    throw new Error(`${table}: falha ao excluir no Supabase. ${describeSupabaseError(error)}`)
  }

  return (data ?? fallback) as T
}

export async function callRpc<T>(
  name: string,
  args: SupabaseRow,
  fallback: T
) {
  if (!isSupabaseConfigured()) {
    throw new Error(`${name}: Supabase nao esta configurado. A acao nao foi executada.`)
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error(`${name}: nao foi possivel iniciar a conexao com o Supabase.`)
  }

  const { data, error } = await supabase.rpc(name, args)
  if (error) {
    console.error(`[${name}] Falha na RPC Supabase`, error)
    throw new Error(`${name}: falha na RPC Supabase. ${describeSupabaseError(error)}`)
  }

  return (data ?? fallback) as T
}
