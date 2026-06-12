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
    "legal_name",
    "document_number",
    "fantasy_name",
    "email",
    "phone",
    "whatsapp",
    "address",
    "city",
    "state",
    "zip_code",
    "status",
    "notes",
    "address_zipcode",
    "address_street",
    "address_number",
    "address_complement",
    "address_neighborhood",
    "address_city",
    "address_state",
    "company_name",
    "trade_name",
    "document",
    "type",
    "district",
    "street",
    "number",
    "complement",
  ]),
  contracts: new Set([
    "contract_number",
    "client_id",
    "type",
    "status",
    "start_date",
    "end_date",
    "due_day",
    "monthly_value",
    "total_value",
    "installments_count",
    "paid_installments",
    "pending_installments",
    "overdue_installments",
    "amount_paid",
    "amount_pending",
    "amount_overdue",
    "linked_asset_value",
    "notes",
    "public_access_token",
    "public_access_enabled",
    "public_access_created_at",
    "contract_type",
    "down_payment",
    "payment_method",
    "cost_center",
    "dre_category",
    "equipment_id",
    "equipment_quantity",
    "contract_pdf_url",
    "receipt_url",
    "other_documents_url",
  ]),
  financial_entries: new Set([
    "type",
    "status",
    "description",
    "value",
    "competence_date",
    "due_date",
    "payment_date",
    "bank_account_id",
    "dre_category_id",
    "cost_center_id",
    "client_id",
    "contract_id",
    "installment_id",
    "supplier_name",
    "payment_method",
    "recurrence",
    "tags",
    "notes",
    "amount",
    "attachment_type",
    "attachment_url",
  ]),
  installments: new Set([
    "contract_id",
    "client_id",
    "installment_number",
    "original_value",
    "updated_value",
    "paid_value",
    "due_date",
    "payment_date",
    "status",
    "fine_value",
    "interest_value",
    "discount_value",
    "days_overdue",
    "notes",
    "total_contract_value",
    "installments_count",
    "down_payment",
    "installment_value",
    "first_due_date",
    "fixed_due_day",
    "apply_late_fee",
    "fine_amount",
    "interest_amount",
  ]),
  equipment: new Set([
    "name",
    "category",
    "quantity_total",
    "quantity_available",
    "quantity_rented",
    "quantity_reserved",
    "quantity_maintenance",
    "status",
    "notes",
    "description",
    "brand",
    "model",
    "configuration",
    "serial_number",
    "purchase_value",
    "sale_value",
    "rental_value",
    "total_quantity",
    "available_quantity",
    "rented_quantity",
    "reserved_quantity",
    "maintenance_quantity",
    "purchase_unit_value",
    "monthly_rental_value",
  ]),
  contract_equipment: new Set([
    "contract_id",
    "equipment_id",
    "quantity",
    "asset_value",
  ]),
  assets: new Set([
    "name",
    "category",
    "acquisition_value",
    "current_value",
    "depreciation_value",
    "location",
    "status",
    "equipment_id",
  ]),
  maintenance_orders: new Set([
    "ticket_number",
    "equipment_id",
    "client_id",
    "contract_id",
    "problem",
    "diagnosis",
    "solution",
    "priority",
    "technician",
    "status",
    "entry_date",
    "expected_exit_date",
    "completed_at",
    "cost",
    "notes",
  ]),
  legal_cases: new Set([
    "case_number",
    "client_id",
    "contract_id",
    "installment_id",
    "process_number",
    "responsible_internal",
    "lawyer_name",
    "law_office",
    "status",
    "stage",
    "risk",
    "next_deadline",
    "summary",
    "case_summary",
    "notes",
    "original_value",
    "monthly_value",
    "overdue_installments",
    "fine_value",
    "interest_value",
    "court_costs",
    "attorney_fees",
    "discount_value",
    "updated_value",
    "negotiated_value",
    "paid_value",
    "balance_due",
    "is_installment_agreement",
    "agreement_installments",
    "agreement_down_payment",
    "agreement_installment_value",
    "first_due_date",
    "payment_method",
    "original_open_amount",
    "fine_amount",
    "interest_amount",
    "discount_amount",
    "negotiated_amount",
    "will_be_installment",
    "installments_count",
    "down_payment",
  ]),
  documents: new Set([
    "name",
    "type",
    "file_url",
    "file_path",
    "mime_type",
    "size_bytes",
    "client_id",
    "contract_id",
    "installment_id",
    "financial_entry_id",
    "equipment_id",
    "legal_case_id",
    "notes",
    "bucket",
    "path",
  ]),
  partner_entries: new Set([
    "partner_id",
    "type",
    "description",
    "competence_date",
    "value",
    "status",
    "financial_entry_id",
  ]),
  partners: new Set([
    "name",
    "participation_percentage",
    "fixed_monthly_value",
    "result_participation_percentage",
    "active",
  ]),
  dre_manual_adjustments: new Set([
    "year",
    "month",
    "dre_category_id",
    "previous_value",
    "new_value",
    "reason",
    "responsible",
  ]),
  dre_monthly_closings: new Set([
    "year",
    "month",
    "revenue_total",
    "expenses_total",
    "operational_profit",
    "operational_result",
    "previous_balance",
    "operation_balance",
    "bank_balance",
    "difference",
    "status",
    "closed_at",
    "closed_by",
  ]),
  dre_categories: new Set([
    "name",
    "group_name",
    "type",
    "sort_order",
    "active",
  ]),
  bank_accounts: new Set([
    "name",
    "bank_name",
    "agency",
    "account_number",
    "account_type",
    "opening_balance",
    "current_balance",
    "is_active",
    "open_finance_connected",
    "last_sync_at",
  ]),
  notifications: new Set([
    "title",
    "message",
    "type",
    "related_route",
    "read",
    "created_at",
  ]),
  users: new Set([
    "auth_user_id",
    "name",
    "email",
    "role",
    "avatar_url",
    "active",
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
  const entries = Object.entries(payload)
  const discarded = allowedColumns ? entries.map(([key]) => key).filter((key) => !allowedColumns.has(key)) : []
  if (discarded.length) {
    console.warn(`[Supabase payload] ${table}: campos descartados por nao existirem no schema real: ${discarded.join(", ")}`)
  }

  return Object.fromEntries(
    entries
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
