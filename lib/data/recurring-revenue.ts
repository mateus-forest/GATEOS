import type { SupabaseRow } from "@/lib/supabase/types"

export type MonthlyRevenueMetrics = {
  monthKey: string
  mrr: number
  arr: number
  contractExpectedRevenue: number
  financialRealizedRevenue: number
  financialPendingRevenue: number
  totalRevenue: number
  activeContracts: SupabaseRow[]
  pendingContractReceivables: SupabaseRow[]
}

export function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

export function getContractMonthlyValue(contract: SupabaseRow) {
  return numberValue(contract, ["monthly_value", "valor_mensal", "monthlyValue", "value", "total_value"])
}

export function isActiveContract(contract: SupabaseRow) {
  return ["ativo", "active"].includes(textValue(contract, ["status"]).toLowerCase())
}

export function isIncomeEntry(entry: SupabaseRow) {
  return ["receita", "income", "entrada"].includes(textValue(entry, ["type", "tipo", "entry_type"]).toLowerCase())
}

export function isExpenseEntry(entry: SupabaseRow) {
  return ["despesa", "expense", "saida"].includes(textValue(entry, ["type", "tipo", "entry_type"]).toLowerCase())
}

export function getEntryAmount(entry: SupabaseRow) {
  return numberValue(entry, ["amount", "valor", "value"])
}

export function getEntryMonthKey(entry: SupabaseRow) {
  return textValue(entry, ["competence_date", "due_date", "payment_date", "date", "created_at"]).slice(0, 7)
}

export function isEntryReceived(entry: SupabaseRow) {
  const status = textValue(entry, ["status"]).toLowerCase()
  return ["recebido", "pago", "paid", "received", "completed", "concluido"].some((item) => status.includes(item))
}

export function isContractActiveInMonth(contract: SupabaseRow, monthKey: string) {
  if (!isActiveContract(contract)) return false
  const monthStart = new Date(`${monthKey}-01T00:00:00`)
  const monthEnd = new Date(monthStart)
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  monthEnd.setDate(0)

  const start = parseDate(contract.start_date ?? contract.data_inicio)
  const end = parseDate(contract.end_date ?? contract.data_fim)
  if (start && start > monthEnd) return false
  if (end && end < monthStart) return false
  return true
}

export function getContractDueDateForMonth(contract: SupabaseRow, monthKey: string) {
  const dueDay = numberValue(contract, ["due_day", "dia_vencimento"], 1)
  const date = new Date(`${monthKey}-01T00:00:00`)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(Math.max(1, dueDay), lastDay))
  return date.toISOString().slice(0, 10)
}

export function hasRevenueEntryForContractMonth(
  financialEntries: SupabaseRow[],
  contractId: string,
  monthKey: string
) {
  return financialEntries.some((entry) =>
    String(entry.contract_id ?? "") === contractId &&
    isIncomeEntry(entry) &&
    getEntryMonthKey(entry) === monthKey
  )
}

export function calculateMonthlyRevenueMetrics(
  contracts: SupabaseRow[],
  financialEntries: SupabaseRow[],
  date = new Date()
): MonthlyRevenueMetrics {
  const monthKey = getMonthKey(date)
  const activeContracts = contracts.filter((contract) => isContractActiveInMonth(contract, monthKey))
  const mrr = activeContracts.reduce((sum, contract) => sum + getContractMonthlyValue(contract), 0)
  const pendingContractReceivables = activeContracts.filter((contract) =>
    !hasRevenueEntryForContractMonth(financialEntries, String(contract.id ?? ""), monthKey)
  )
  const contractExpectedRevenue = pendingContractReceivables.reduce(
    (sum, contract) => sum + getContractMonthlyValue(contract),
    0
  )
  const currentMonthEntries = financialEntries.filter((entry) => getEntryMonthKey(entry) === monthKey)
  const incomeEntries = currentMonthEntries.filter(isIncomeEntry)
  const financialRealizedRevenue = incomeEntries.filter(isEntryReceived).reduce((sum, entry) => sum + getEntryAmount(entry), 0)
  const financialPendingRevenue = incomeEntries.filter((entry) => !isEntryReceived(entry)).reduce((sum, entry) => sum + getEntryAmount(entry), 0)

  return {
    monthKey,
    mrr,
    arr: mrr * 12,
    contractExpectedRevenue,
    financialRealizedRevenue,
    financialPendingRevenue,
    totalRevenue: contractExpectedRevenue + financialRealizedRevenue + financialPendingRevenue,
    activeContracts,
    pendingContractReceivables,
  }
}

export function calculateMonthlyExpense(financialEntries: SupabaseRow[], monthKey: string) {
  return financialEntries
    .filter((entry) => getEntryMonthKey(entry) === monthKey && isExpenseEntry(entry))
    .reduce((sum, entry) => sum + getEntryAmount(entry), 0)
}

export function calculateContractRevenueByMonth(
  contracts: SupabaseRow[],
  financialEntries: SupabaseRow[],
  year: number
) {
  return Array.from({ length: 12 }, (_, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`
    return calculateMonthlyRevenueMetrics(contracts, financialEntries, new Date(`${monthKey}-01T00:00:00`)).contractExpectedRevenue
  })
}

function textValue(row: SupabaseRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value)
  }
  return ""
}

function numberValue(row: SupabaseRow, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row[key]
    const parsed = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function parseDate(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}
