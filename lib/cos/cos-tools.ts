import {
  dateIsInMonth,
  formatCurrency,
  formatDate,
  getNumericValue,
  isActiveStatus,
  isClosedMaintenanceStatus,
  isPaidStatus,
  isReceivedStatus,
  monthLabel,
  normalizeText,
  selectCosRows,
  type CosSupabaseClient,
} from "@/lib/cos/cos-context"
import type { SupabaseRow } from "@/lib/supabase/types"

function nameOf(row: SupabaseRow) {
  return String(row.name ?? row.nome ?? row.nome_fantasia ?? row.razao_social ?? row.description ?? "Sem nome")
}

function contractNumber(row: SupabaseRow) {
  return String(row.contract_number ?? row.number ?? row.numero ?? row.id ?? "sem numero")
}

function contractEndDate(row: SupabaseRow) {
  return row.end_date ?? row.final_date ?? row.vigencia_fim ?? row.expires_at ?? row.due_date
}

function equipmentTotal(row: SupabaseRow) {
  return getNumericValue(row, ["quantity_total", "total_quantity", "quantity", "quantidade_total", "total"])
}

function equipmentAvailable(row: SupabaseRow) {
  const explicit = getNumericValue(row, ["quantity_available", "available_quantity", "quantidade_disponivel"])
  if (explicit > 0) return explicit
  const total = equipmentTotal(row)
  const rented = getNumericValue(row, ["quantity_rented", "rented_quantity", "quantidade_locada"])
  return Math.max(0, total - rented)
}

function equipmentMaintenance(row: SupabaseRow) {
  return getNumericValue(row, ["quantity_maintenance", "maintenance_quantity", "quantidade_manutencao"])
}

export async function getClientsSummary(supabase: CosSupabaseClient) {
  const rows = await selectCosRows(supabase, "clients")
  const active = rows.filter((row) => {
    const status = row.status ?? row.situacao ?? row.active
    if (typeof status === "boolean") return status
    return isActiveStatus(status) || normalizeText(status) === ""
  })

  return {
    total: rows.length,
    active: active.length,
    sample: active.slice(0, 5).map(nameOf),
  }
}

export async function getContractsSummary(supabase: CosSupabaseClient) {
  const rows = await selectCosRows(supabase, "contracts")
  const now = new Date()
  const thirtyDays = new Date(now)
  thirtyDays.setDate(now.getDate() + 30)

  const active = rows.filter((row) => {
    const status = row.status ?? row.situacao
    const end = contractEndDate(row)
    if (isActiveStatus(status)) return true
    if (!end) return false
    const endDate = new Date(String(end))
    return !Number.isNaN(endDate.getTime()) && endDate >= now
  })

  const expiring = active.filter((row) => {
    const end = contractEndDate(row)
    const endDate = new Date(String(end ?? ""))
    return !Number.isNaN(endDate.getTime()) && endDate >= now && endDate <= thirtyDays
  })

  const expired = rows.filter((row) => {
    const end = contractEndDate(row)
    const endDate = new Date(String(end ?? ""))
    return !Number.isNaN(endDate.getTime()) && endDate < now
  })

  return {
    total: rows.length,
    active,
    expiring,
    expired,
  }
}

export async function getEquipmentSummary(supabase: CosSupabaseClient) {
  const rows = await selectCosRows(supabase, "equipment")
  const available = rows.reduce((sum, row) => sum + equipmentAvailable(row), 0)
  const maintenance = rows.reduce((sum, row) => {
    const explicit = equipmentMaintenance(row)
    if (explicit > 0) return sum + explicit
    return normalizeText(row.status).includes("manutencao") ? sum + Math.max(1, equipmentTotal(row)) : sum
  }, 0)
  const rented = rows.reduce((sum, row) => sum + getNumericValue(row, ["quantity_rented", "rented_quantity", "quantidade_locada"]), 0)

  return {
    totalItems: rows.length,
    available,
    rented,
    maintenance,
    availableSample: rows.filter((row) => equipmentAvailable(row) > 0).slice(0, 5).map(nameOf),
    maintenanceSample: rows
      .filter((row) => equipmentMaintenance(row) > 0 || normalizeText(row.status).includes("manutencao"))
      .slice(0, 5)
      .map(nameOf),
  }
}

export async function getFinancialSummary(supabase: CosSupabaseClient, year: number, month: number) {
  const rows = await selectCosRows(supabase, "financial_entries")
  const monthRows = rows.filter((row) => dateIsInMonth(row.competence_date ?? row.payment_date ?? row.due_date, year, month))

  const revenue = monthRows
    .filter((row) => normalizeText(row.type) === "receita" && isReceivedStatus(row.status))
    .reduce((sum, row) => sum + getNumericValue(row), 0)

  const expenses = monthRows
    .filter((row) => normalizeText(row.type) === "despesa" && isPaidStatus(row.status))
    .reduce((sum, row) => sum + getNumericValue(row), 0)

  const pendingRevenue = monthRows
    .filter((row) => normalizeText(row.type) === "receita" && !isReceivedStatus(row.status))
    .reduce((sum, row) => sum + getNumericValue(row), 0)

  const pendingExpenses = monthRows
    .filter((row) => normalizeText(row.type) === "despesa" && !isPaidStatus(row.status))
    .reduce((sum, row) => sum + getNumericValue(row), 0)

  return {
    year,
    month,
    entries: monthRows.length,
    revenue,
    expenses,
    result: revenue - expenses,
    pendingRevenue,
    pendingExpenses,
    label: `${monthLabel(month)}/${year}`,
  }
}

export async function getDocumentsSummary(supabase: CosSupabaseClient) {
  const rows = await selectCosRows(supabase, "documents")
  return {
    total: rows.length,
    recent: rows
      .slice()
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
      .slice(0, 5)
      .map((row) => String(row.name ?? row.nome ?? row.file_name ?? "Documento sem nome")),
  }
}

export async function getMaintenanceSummary(supabase: CosSupabaseClient) {
  const rows = await selectCosRows(supabase, "maintenance_orders")
  const open = rows.filter((row) => !isClosedMaintenanceStatus(row.status))
  return {
    total: rows.length,
    open,
    openSample: open.slice(0, 5).map((row) => ({
      ticket: String(row.ticket_number ?? row.protocol ?? row.id ?? "sem protocolo"),
      problem: String(row.problem ?? row.description ?? "sem descrição"),
      priority: String(row.priority ?? "sem prioridade"),
      date: formatDate(row.entry_date ?? row.created_at),
    })),
  }
}

export async function getOverdueClientsSummary(supabase: CosSupabaseClient) {
  const installments = await selectCosRows(supabase, "installments")
  const overdue = installments.filter((row) => {
    const status = normalizeText(row.status)
    if (["vencido", "overdue", "atrasado"].includes(status)) return true
    const dueDate = new Date(String(row.due_date ?? row.vencimento ?? ""))
    return !Number.isNaN(dueDate.getTime()) && dueDate < new Date() && !isPaidStatus(row.status)
  })

  const clientIds = new Set(overdue.map((row) => String(row.client_id ?? "")).filter(Boolean))
  const totalValue = overdue.reduce((sum, row) => sum + getNumericValue(row), 0)

  return {
    overdueInstallments: overdue.length,
    overdueClients: clientIds.size,
    totalValue,
  }
}

export async function getDreSummary(supabase: CosSupabaseClient, year: number, month: number) {
  if (year >= 2022 && year <= 2025) {
    const rows = (await selectCosRows(supabase, "dre_historical_values")).filter(
      (row) => Number(row.year) === year && Number(row.month) === month
    )
    const findValue = (terms: string[]) => {
      const row = rows.find((item) => {
        const name = normalizeText(item.line_name)
        return terms.some((term) => name.includes(term))
      })
      return row ? getNumericValue(row) : 0
    }

    return {
      year,
      month,
      label: `${monthLabel(month)}/${year}`,
      revenue: findValue(["receita total", "receita liquida total"]),
      expenses: findValue(["total de despesas operacionais", "total despesas operacionais"]),
      result: findValue(["resultado operacional"]),
      source: "dre_historical_values",
    }
  }

  const financial = await getFinancialSummary(supabase, year, month)
  return {
    year,
    month,
    label: `${monthLabel(month)}/${year}`,
    revenue: financial.revenue,
    expenses: financial.expenses,
    result: financial.result,
    source: "financial_entries",
  }
}

export function formatContractList(rows: SupabaseRow[]) {
  if (rows.length === 0) return "Nenhum contrato encontrado nesse criterio."
  return rows
    .slice(0, 5)
    .map((row) => `${contractNumber(row)} (${formatDate(contractEndDate(row))})`)
    .join("; ")
}

export { formatCurrency }
