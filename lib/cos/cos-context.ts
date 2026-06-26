import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, SupabaseRow } from "@/lib/supabase/types"

export type CosSupabaseClient = SupabaseClient<Database>

export type CosIntent =
  | "active_clients"
  | "overdue_clients"
  | "active_contracts"
  | "expiring_contracts"
  | "expired_contracts"
  | "available_equipment"
  | "maintenance_equipment"
  | "financial_revenue"
  | "financial_summary"
  | "dre_summary"
  | "documents_summary"
  | "open_maintenance"
  | "open_ticket_guidance"
  | "overview"

export type CosAnswer = {
  intent: CosIntent | "file_analysis" | "read_only_foundation" | "read_only_write_blocked"
  answer: string
  sources: string[]
  preview?: unknown
}

export const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(value: unknown) {
  const text = String(value ?? "")
  if (!text) return "sem data"
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date)
}

export function getNumericValue(row: SupabaseRow, keys = ["value", "amount", "valor", "total_value", "monthly_value"]) {
  for (const key of keys) {
    const raw = row[key]
    if (raw === null || raw === undefined || raw === "") continue
    const number = Number(raw)
    if (Number.isFinite(number)) return number
  }
  return 0
}

export function currentYearMonth() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

export function monthLabel(month: number) {
  return MONTH_NAMES[month - 1] ?? `mes ${month}`
}

export function parseRequestedPeriod(question: string) {
  const normalized = normalizeText(question)
  const current = currentYearMonth()
  const yearMatch = normalized.match(/\b(20\d{2})\b/)
  const year = yearMatch ? Number(yearMatch[1]) : current.year
  const monthIndex = MONTH_NAMES.findIndex((name) => normalized.includes(name))

  const shortMonths = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  const shortIndex = shortMonths.findIndex((name) => normalized.includes(name))

  return {
    year,
    month: monthIndex >= 0 ? monthIndex + 1 : shortIndex >= 0 ? shortIndex + 1 : current.month,
  }
}

export function dateIsInMonth(value: unknown, year: number, month: number) {
  const text = String(value ?? "")
  if (!text) return false
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return false
  return date.getFullYear() === year && date.getMonth() + 1 === month
}

export function isPaidStatus(status: unknown) {
  const normalized = normalizeText(status)
  return ["pago", "recebido", "realizado", "paid", "received", "settled"].includes(normalized)
}

export function isReceivedStatus(status: unknown) {
  const normalized = normalizeText(status)
  return ["recebido", "received", "pago", "paid", "realizado", "settled"].includes(normalized)
}

export function isActiveStatus(status: unknown) {
  const normalized = normalizeText(status)
  return ["ativo", "active", "vigente", "em andamento", "em_andamento"].includes(normalized)
}

export function isClosedMaintenanceStatus(status: unknown) {
  const normalized = normalizeText(status)
  return ["concluido", "cancelado", "fechado", "completed", "cancelled", "closed"].includes(normalized)
}

export async function selectCosRows(
  supabase: CosSupabaseClient,
  table: string,
  columns = "*"
) {
  const { data, error } = await supabase.from(table).select(columns)
  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as SupabaseRow[]
}
