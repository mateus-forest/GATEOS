"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Download, FileSpreadsheet, History, Lock, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exportExcelTable, exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildDreReport, buildGenericReport } from "@/lib/reports/report-builders"
import {
  createDreManualAdjustment,
  createDreMonthlyClosing,
  deleteAllDreManualAdjustments,
  deleteDreImportedAdjustments,
  deleteDreImportSnapshot,
  deleteDreHistoryImportSnapshots,
  deleteDreManualAdjustment,
  createDreImportSnapshot,
  getDreCategories,
  getDreImportSnapshotById,
  getDreImportSnapshots,
  getLatestDreImportSnapshot,
  getDreOperationalTemplateRows,
  replaceDreOperationalTemplateRows,
  getDreManualAdjustments,
  getDreMonthlyClosings,
} from "@/lib/data/dre"
import { formatCurrency } from "@/lib/utils"
import { getFinancialEntries } from "@/lib/data/financial"
import { getClients } from "@/lib/data/clients"
import { getFinancialSelectOptions } from "@/lib/data/financial"
import { getPartnerEntries } from "@/lib/data/partners"
import { getDreWorkbookSheets, parseDreImportFile, type DreImportMode, type DreImportPreview, type DreWorkbookSheet } from "@/lib/dre-import-parser"
import { clientLabel } from "@/lib/data/display-labels"
import {
  getEntryAmount,
  getEntryMonthKey,
  isEntryReceived,
  isExpenseEntry,
  isIncomeEntry,
} from "@/lib/data/recurring-revenue"
import type { SupabaseRow } from "@/lib/supabase/types"

const months = ["jan-26", "fev-26", "mar-26", "abr-26", "mai-26", "jun-26", "jul-26", "ago-26", "set-26", "out-26", "nov-26", "dez-26"]
const empty = Array(12).fill(0)

type RowKind = "section" | "normal" | "total" | "highlight" | "percent"

type DreRow = {
  id?: string
  label: string
  kind?: RowKind
  values: number[]
  totalValue?: number | null
  displayAsPercent?: boolean
  percentOf?: string
  categoryId?: string
  group: "revenue" | "expense" | "result" | "balance"
  groupName?: string
}

type ManualAdjustment = {
  id: string
  categoryId: string
  date: string
  category: string
  month: string
  monthIndex: number
  previousValue: number
  newValue: number
  reason: string
  responsible: string
}

type EditTarget = {
  row: DreRow
  month: string
  monthIndex: number
  currentValue: number
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function addValues(a: number[], b: number[]) {
  return a.map((value, index) => value + b[index])
}

function subtractValues(a: number[], b: number[]) {
  return a.map((value, index) => value - b[index])
}

function monthLabelToNumber(label: string) {
  return months.indexOf(label) + 1
}

function monthNumberToLabel(month: unknown) {
  const index = Number(month) - 1
  return months[index] ?? months[0]
}

function getCategoryName(category: SupabaseRow) {
  return String(category.name ?? category.description ?? "Registro sem nome")
}

function normalizeTextKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function normalizeCategoryType(category: SupabaseRow) {
  const value = String(category.type ?? category.group_name ?? "").toLowerCase()
  if (["receita", "revenue", "income"].includes(value)) return "revenue"
  if (["despesa", "expense", "cost", "custo"].includes(value)) return "expense"
  return "expense"
}

function isRevenueType(value: unknown) {
  return ["receita", "revenue", "income"].includes(String(value ?? "").toLowerCase())
}

function isCategoryActive(category: SupabaseRow) {
  return category.active !== false
}

function categoryGroupKey(value: unknown) {
  const normalized = normalizeTextKey(value)
  if (normalized.includes("pessoal")) return "people"
  if (normalized.includes("financeira")) return "financial"
  if (normalized.includes("nao operacion")) return "non-operational"
  if (normalized.includes("custo do produto")) return "cpv"
  if (normalized.includes("aporte")) return "aporte"
  if (normalized.includes("fechamento")) return "closing"
  if (normalized.includes("operacion")) return "operational"
  return "operational"
}

function monthIndexFromDate(value: unknown, year: string) {
  const date = String(value ?? "")
  if (!date.startsWith(`${year}-`)) return -1
  const index = Number(date.slice(5, 7)) - 1
  return index >= 0 && index <= 11 ? index : -1
}

function partnerEntryConfig(type: unknown) {
  const normalized = String(type ?? "").toLowerCase()
  if (normalized === "distribuicao_lucro") {
    return { key: "partner-distribuicao", label: "Distribuicao Lucros - Socios", groupName: "Outras despesas nao operacionais", group: "expense" as const }
  }
  if (normalized === "participacao_resultado") {
    return { key: "partner-participacao", label: "Participacao Resultado", groupName: "Outras despesas nao operacionais", group: "expense" as const }
  }
  if (normalized === "aporte") {
    return { key: "partner-aportes", label: "Aportes de Socios", groupName: "Aportes", group: "revenue" as const }
  }
  if (normalized === "devolucao") {
    return { key: "partner-devolucao", label: "Devolucao de Emprestimos", groupName: "Outras despesas nao operacionais", group: "expense" as const }
  }
  return { key: "partner-fixo", label: "Outros Custos com Socios", groupName: "Despesas com pessoal", group: "expense" as const }
}

function normalizeAdjustment(item: SupabaseRow, categoryById: Map<string, SupabaseRow>): ManualAdjustment {
  const categoryId = String(item.dre_category_id ?? "")
  const monthNumber = Number(item.month ?? 1)
  const category = categoryById.get(categoryId)

  return {
    id: String(item.id ?? ""),
    categoryId,
    date: String(item.created_at ?? ""),
    category: category ? getCategoryName(category) : "Registro sem nome",
    month: monthNumberToLabel(monthNumber),
    monthIndex: Math.max(0, Math.min(11, monthNumber - 1)),
    previousValue: Number(item.previous_value ?? 0),
    newValue: Number(item.new_value ?? 0),
    reason: String(item.reason ?? ""),
    responsible: String(item.responsible ?? ""),
  }
}

function isOperationalDreSheetName(sheetName: string) {
  const normalized = normalizeTextKey(sheetName)
  return normalized.startsWith("dre") && normalized.includes("2026")
}

function isHistorySheetName(sheetName: string) {
  const normalized = normalizeTextKey(sheetName)
  return normalized.includes("2024") || normalized.includes("2025") || normalized.includes("2023") || (normalized.startsWith("dre") && !normalized.includes("2026"))
}

function importKindLabel(value: unknown) {
  return String(value ?? "") === "operacional" ? "DRE operacional atual" : "Historico"
}

function dreImportRowTypeLabel(type: string) {
  const labels: Record<string, string> = {
    group: "grupo",
    account: "conta",
    total: "total",
    percent: "percentual",
    result: "resultado",
    balance: "saldo",
    structural_blank: "vazia estrutural",
  }
  return labels[type] ?? "linha"
}

function yearFromSheetName(sheetName: string, fallbackYear: string) {
  const fullYearMatch = sheetName.match(/20\d{2}/)
  if (fullYearMatch) return Number(fullYearMatch[0])

  const shortYears = Array.from(sheetName.matchAll(/(?:^|\D)(2[0-9])(?:\D|$)/g))
    .map((match) => 2000 + Number(match[1]))
    .filter((value) => value >= 2020 && value <= 2099)
  if (shortYears.length) return Math.max(...shortYears)

  return Number(fallbackYear)
}

function templateRowsToDreRows(rows: SupabaseRow[]) {
  return rows
    .map((row) => ({
      label: String(row.account_name ?? "").trim(),
      groupName: String(row.group_name ?? "").trim(),
      rowType: String(row.row_type ?? "").trim(),
    }))
    .filter((row) => row.label)
}

function templateRowGroup(row: { label: string; groupName: string; rowType: string }) {
  const label = normalizeTextKey(row.label)
  const group = categoryGroupKey(row.groupName)
  if (label.includes("aporte")) return "revenue"
  if (label.includes("cpv") || label.includes("custo do produto")) return "cpv"
  if (label.includes("salario") || label.includes("ferias") || label.includes("fgts") || label.includes("inss") || label.includes("pessoal")) return "people"
  if (label.includes("tarifa") || label.includes("juros") || label.includes("emprestimo") || label.includes("financeira")) return "financial"
  if (label.includes("investimento") || label.includes("distribuicao") || label.includes("devolucao")) return "non-operational"
  if (group === "receita") return "revenue"
  if (group === "cpv") return "cpv"
  if (group === "pessoal") return "people"
  if (group === "financeiro") return "financial"
  if (group === "nao-operacional") return "non-operational"
  if (row.rowType === "account") return "operational"
  return ""
}

function shouldCreateTemplateOperationalRow(row: { label: string; groupName: string; rowType: string }) {
  const label = normalizeTextKey(row.label)
  if (!row.label || ["total", "percent", "result", "balance", "section", "structural_blank"].includes(row.rowType)) return false
  return ![
    "receita total",
    "receita liquida total",
    "custo do produto vendido",
    "total despesas",
    "lucro operacional",
    "resultado operacional",
    "saldo anterior",
    "saldo operacao",
    "saldo banco",
    "diferenca",
  ].some((fixedLabel) => label.includes(fixedLabel))
}

function templateRowKind(row: { label: string; groupName: string; rowType: string }): RowKind {
  const label = normalizeTextKey(row.label)
  if (row.rowType === "group" || label.startsWith("receitas ") || label.includes("despesas operacionais") || label.includes("despesas com pessoal") || label.includes("outras despesas")) {
    return "section"
  }
  if (row.rowType === "percent" || label.includes("%")) return "percent"
  if (row.rowType === "total" || row.rowType === "result" || label.includes("total") || label.includes("lucro operacional") || label.includes("resultado operacional") || label.includes("receita liquida")) {
    return "total"
  }
  if (row.rowType === "balance" || label.includes("saldo") || label.includes("diferenca")) return "highlight"
  return "normal"
}

function makeRowLookup(rows: DreRow[]) {
  const lookup = new Map<string, DreRow>()
  rows.forEach((row) => {
    const key = normalizeTextKey(row.label)
    if (key && !lookup.has(key)) lookup.set(key, row)
  })
  return lookup
}

function buildRows({
  year,
  categories,
  clients,
  financialEntries,
  adjustments,
  partnerEntries,
  bankAccounts,
  closings,
  templateRows,
}: {
  year: string
  categories: SupabaseRow[]
  clients: SupabaseRow[]
  financialEntries: SupabaseRow[]
  adjustments: ManualAdjustment[]
  partnerEntries: SupabaseRow[]
  bankAccounts: SupabaseRow[]
  closings: SupabaseRow[]
  templateRows: Array<{ label: string; groupName: string; rowType: string }>
}) {
  const categoryById = new Map(categories.map((category) => [String(category.id ?? ""), category]))
  const clientIdByName = new Map(
    clients.map((client) => [normalizeTextKey(clientLabel(client)), String(client.id ?? "")])
  )
  const rowMap = new Map<string, DreRow>()

  const ensureRow = (key: string, row: Omit<DreRow, "values"> & { values?: number[] }) => {
    const current = rowMap.get(key)
    if (current) return current
    const created: DreRow = { ...row, values: row.values ?? [...empty] }
    rowMap.set(key, created)
    return created
  }

  ensureRow("section-revenue", {
    label: `RECEITAS ${year}`,
    kind: "section",
    group: "revenue",
  })

  clients.forEach((client) => {
    const clientId = String(client.id ?? "")
    const clientIncomeEntries = financialEntries
      .filter((entry) =>
        String(entry.client_id ?? "") === clientId &&
        isIncomeEntry(entry) &&
        isEntryReceived(entry) &&
        getEntryMonthKey(entry).startsWith(`${year}-`)
      )
    const values = [...empty]

    clientIncomeEntries.forEach((entry) => {
        const monthIndex = Number(getEntryMonthKey(entry).slice(5, 7)) - 1
        if (monthIndex >= 0 && monthIndex <= 11) values[monthIndex] += Math.abs(getEntryAmount(entry))
      })

    ensureRow(`client-${clientId}`, {
      label: clientLabel(client),
      group: "revenue",
      groupName: "Clientes/Contratos",
      values,
    })
  })

  templateRows
    .filter(shouldCreateTemplateOperationalRow)
    .forEach((templateRow) => {
      const group = templateRowGroup(templateRow)
      if (!group) return
      ensureRow(`template-${normalizeTextKey(templateRow.label)}`, {
        label: templateRow.label,
        group,
        groupName: templateRow.groupName || "Template operacional",
      })
    })

  categories
    .filter((category) => isCategoryActive(category) && isRevenueType(category.type))
    .forEach((category) => {
      const id = String(category.id ?? "")
      if (!id) return
      ensureRow(id, {
        label: getCategoryName(category),
        group: "revenue",
        groupName: String(category.group_name ?? "Receitas"),
        categoryId: id,
      })
    })

  ensureRow("section-expenses-people", {
    label: "DESPESAS COM PESSOAL",
    kind: "section",
    group: "expense",
  })
  ensureRow("section-expenses-operational", {
    label: "DESPESAS OPERACIONAIS",
    kind: "section",
    group: "expense",
  })
  ensureRow("section-expenses-non-operational", {
    label: "OUTRAS DESPESAS NAO OPERACIONAIS",
    kind: "section",
    group: "expense",
  })

  categories
    .filter((category) => isCategoryActive(category) && !isRevenueType(category.type))
    .forEach((category) => {
      const id = String(category.id ?? "")
      if (!id) return
      ensureRow(id, {
        label: getCategoryName(category),
        group: "expense",
        groupName: String(category.group_name ?? "Despesas operacionais"),
        categoryId: id,
      })
    })

  financialEntries.forEach((entry) => {
    const monthKey = getEntryMonthKey(entry)
    if (!monthKey.startsWith(`${year}-`)) return

    const monthIndex = Number(monthKey.slice(5, 7)) - 1
    if (monthIndex < 0 || monthIndex > 11) return

    const categoryId = String(entry.dre_category_id ?? "")
    const category = categoryById.get(categoryId)
    if (isIncomeEntry(entry) && !isEntryReceived(entry)) return
    if (isIncomeEntry(entry) && entry.client_id) return

    const group = isIncomeEntry(entry) ? "revenue" : isExpenseEntry(entry) ? "expense" : null
    if (!group) return

    const key = categoryId || `fallback-${group}`
    const row = ensureRow(key, {
      label: category ? getCategoryName(category) : group === "revenue" ? "Outras receitas" : "Outras despesas",
      group,
      groupName: category ? String(category.group_name ?? "") : "",
      categoryId: categoryId || undefined,
    })
    row.values[monthIndex] += Math.abs(getEntryAmount(entry))
  })

  partnerEntries.forEach((entry) => {
    const monthIndex = monthIndexFromDate(entry.competence_date ?? entry.created_at, year)
    if (monthIndex < 0) return
    const config = partnerEntryConfig(entry.type)
    const row = ensureRow(config.key, {
      label: config.label,
      group: config.group,
      groupName: config.groupName,
    })
    row.values[monthIndex] += Math.abs(Number(entry.value ?? 0))
  })

  adjustments.forEach((adjustment) => {
    const category = categoryById.get(adjustment.categoryId)
    if (!category) return
    const matchedClientId = clientIdByName.get(normalizeTextKey(getCategoryName(category)))
    const matchedClientRow = matchedClientId ? rowMap.get(`client-${matchedClientId}`) : undefined
    if (matchedClientRow) {
      matchedClientRow.values[adjustment.monthIndex] += adjustment.newValue
      return
    }

    const group = normalizeCategoryType(category)
    const row = ensureRow(adjustment.categoryId, {
      label: getCategoryName(category),
      group,
      groupName: String(category.group_name ?? ""),
      categoryId: adjustment.categoryId,
    })
    row.values[adjustment.monthIndex] = adjustment.newValue
  })

  const allRows = Array.from(rowMap.values())
  const detailRows = allRows.filter((row) => row.kind !== "section")
  const revenueRows = detailRows.filter((row) => row.group === "revenue")
  const expenseRows = detailRows.filter((row) => row.group === "expense")
  const expenseRowsByGroup = (key: string) =>
    expenseRows.filter((row) => categoryGroupKey(row.groupName) === key)
  const cpvRows = expenseRowsByGroup("cpv")
  const peopleRows = expenseRowsByGroup("people")
  const operationalRows = expenseRowsByGroup("operational")
  const financialRows = expenseRowsByGroup("financial")
  const nonOperationalRows = expenseRowsByGroup("non-operational")
  const aporteRows = revenueRows.filter((row) => categoryGroupKey(row.groupName) === "aporte")
  const closingRows = revenueRows.filter((row) => categoryGroupKey(row.groupName) === "closing")
  const ordinaryRevenueRows = revenueRows.filter((row) => !["aporte", "closing"].includes(categoryGroupKey(row.groupName)))
  const templateOrder = new Map(templateRows.map((row, index) => [normalizeTextKey(row.label), index]))
  const sortByTemplate = (items: DreRow[]) =>
    [...items].sort((a, b) => {
      const aIndex = templateOrder.get(normalizeTextKey(a.label)) ?? Number.MAX_SAFE_INTEGER
      const bIndex = templateOrder.get(normalizeTextKey(b.label)) ?? Number.MAX_SAFE_INTEGER
      if (aIndex !== bIndex) return aIndex - bIndex
      return 0
    })
  const receitaTotal = ordinaryRevenueRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const cpvTotal = cpvRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const peopleTotal = peopleRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const generalTotal = operationalRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const financialTotal = financialRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const nonOperationalTotal = nonOperationalRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const receitaLiquida = subtractValues(receitaTotal, cpvTotal)
  const despesasOperacionais = [peopleTotal, generalTotal, financialTotal].reduce((acc, values) => addValues(acc, values), [...empty])
  const lucroOperacional = subtractValues(receitaLiquida, despesasOperacionais)
  const resultado = subtractValues(lucroOperacional, nonOperationalTotal)
  const closingSaldoAnteriorValues = closingRows
    .filter((row) => normalizeTextKey(row.label).includes("saldo anterior"))
    .reduce((acc, row) => addValues(acc, row.values), [...empty])
  const manualSaldoBancoValues = closingRows
    .filter((row) => normalizeTextKey(row.label).includes("saldo banco"))
    .reduce((acc, row) => addValues(acc, row.values), [...empty])
  const saldoAnteriorValues = closings.reduce((values, closing) => {
    const closingYear = Number(closing.year)
    const closingMonth = Number(closing.month)
    if (closingYear !== Number(year) || closingMonth < 1 || closingMonth > 11) return values
    values[closingMonth] = Number(closing.operation_balance ?? closing.bank_balance ?? 0)
    return values
  }, closingSaldoAnteriorValues)
  const currentBankBalance = bankAccounts.reduce((total, account) => total + Number(account.current_balance ?? 0), 0)
  const saldoBancoValues = manualSaldoBancoValues.some((value) => value !== 0)
    ? manualSaldoBancoValues
    : empty.map(() => currentBankBalance)
  const saldoOperacaoValues = addValues(resultado, saldoAnteriorValues)
  const diferencaValues = subtractValues(saldoOperacaoValues, saldoBancoValues)

  const defaultRows = [
    rowMap.get("section-revenue"),
    ...sortByTemplate(ordinaryRevenueRows),
    { label: "RECEITA TOTAL", kind: "total", group: "result", values: receitaTotal },
    { label: "CUSTO DO PRODUTO VENDIDO (CPV)", kind: "highlight", group: "result", values: cpvTotal },
    ...sortByTemplate(cpvRows),
    { label: "RECEITA LIQUIDA TOTAL", kind: "total", group: "result", values: receitaLiquida },
    rowMap.get("section-expenses-people"),
    ...sortByTemplate(peopleRows),
    { label: "TOTAL DESPESAS COM PESSOAL", kind: "total", group: "result", values: peopleTotal },
    { label: "% Despesas s/Receita", kind: "percent", group: "result", percentOf: "TOTAL DESPESAS COM PESSOAL", values: peopleTotal },
    rowMap.get("section-expenses-operational"),
    ...sortByTemplate(operationalRows),
    { label: "TOTAL DESPESAS GERAIS", kind: "total", group: "result", values: generalTotal },
    { label: "% Despesas s/Receita", kind: "percent", group: "result", percentOf: "TOTAL DESPESAS GERAIS", values: generalTotal },
    ...sortByTemplate(financialRows),
    { label: "Total de despesas financeiras", kind: "total", group: "result", values: financialTotal },
    { label: "% Despesas s/Receita", kind: "percent", group: "result", percentOf: "Total de despesas financeiras", values: financialTotal },
    { label: "Total de Despesas Operacionais", kind: "highlight", group: "result", values: despesasOperacionais },
    {
      label: "% Despesas s/Receita",
      kind: "percent",
      group: "result",
      percentOf: "Total de Despesas Operacionais",
      values: despesasOperacionais,
    },
    { label: "LUCRO OPERACIONAL", kind: "total", group: "result", values: lucroOperacional },
    { label: "Lucro operacional %", kind: "percent", group: "result", percentOf: "LUCRO OPERACIONAL", values: lucroOperacional },
    rowMap.get("section-expenses-non-operational"),
    ...sortByTemplate(nonOperationalRows),
    { label: "Total de despesas nao operacionais", kind: "highlight", group: "result", values: nonOperationalTotal },
    { label: "RESULTADO OPERACIONAL", kind: "total", group: "result", values: resultado },
    ...sortByTemplate(aporteRows),
    { label: "TOTAL APORTES TERCEIROS", kind: "highlight", group: "result", values: aporteRows.reduce((acc, row) => addValues(acc, row.values), [...empty]) },
    { label: "SALDO ANTERIOR", group: "balance", values: saldoAnteriorValues },
    { label: "SALDO OPERACAO - (RO+SALDO ANT)", kind: "total", group: "balance", values: saldoOperacaoValues },
    { label: "SALDO BANCO", group: "balance", values: saldoBancoValues },
    { label: "DIFERENCA", kind: "highlight", group: "balance", values: diferencaValues },
  ].filter(Boolean) as DreRow[]

  if (templateRows.length > 0) {
    const rowLookup = makeRowLookup(defaultRows)
    const templateRenderedRows = templateRows.map((templateRow) => {
      const matchedRow = rowLookup.get(normalizeTextKey(templateRow.label))
      return {
        label: templateRow.label,
        kind: matchedRow?.kind ?? templateRowKind(templateRow),
        group: matchedRow?.group ?? (templateRowGroup(templateRow) || "template"),
        groupName: templateRow.groupName,
        values: matchedRow?.values ?? [...empty],
        percentOf: matchedRow?.percentOf,
      } as DreRow
    })

    return {
      rows: templateRenderedRows,
      receitaTotal,
      despesasTotal: despesasOperacionais,
      resultado,
      lucroOperacional,
      saldoAnteriorValues,
      saldoOperacaoValues,
      saldoBancoValues,
      diferencaValues,
      hasRealData: true,
    }
  }

  if (clients.length === 0 && categories.length === 0 && detailRows.every((row) => sum(row.values) === 0)) {
    return {
      rows: [] as DreRow[],
      receitaTotal,
      despesasTotal: despesasOperacionais,
      resultado,
      hasRealData: false,
      lucroOperacional,
      saldoAnteriorValues,
      saldoOperacaoValues,
      saldoBancoValues,
      diferencaValues,
    }
  }

  return {
    rows: defaultRows,
    receitaTotal,
    despesasTotal: despesasOperacionais,
    resultado,
    lucroOperacional,
    saldoAnteriorValues,
    saldoOperacaoValues,
    saldoBancoValues,
    diferencaValues,
    hasRealData: true,
  }
}

function rowClass(kind: RowKind = "normal") {
  if (kind === "section") return "bg-slate-100 font-bold text-slate-900"
  if (kind === "total") return "bg-emerald-100 font-bold"
  if (kind === "highlight") return "bg-yellow-100 font-bold"
  if (kind === "percent") return "bg-muted/40 text-xs italic"
  return "bg-background"
}

function valuesFromImportedRow(row: SupabaseRow) {
  return [
    row.jan,
    row.fev,
    row.mar,
    row.abr,
    row.mai,
    row.jun,
    row.jul,
    row.ago,
    row.set,
    row.out,
    row.nov,
    row.dez,
  ].map((value) => Number(value ?? 0))
}

function kindFromImportedRow(rowType: unknown): RowKind {
  const type = String(rowType ?? "")
  if (type === "group") return "section"
  if (type === "total") return "total"
  if (type === "percent") return "percent"
  if (type === "result") return "highlight"
  if (type === "balance") return "total"
  if (type === "structural_blank") return "normal"
  return "normal"
}

function groupFromImportedRow(groupName: unknown): DreRow["group"] {
  const normalized = normalizeTextKey(groupName)
  if (normalized.includes("receita") || normalized.includes("aporte")) return "revenue"
  if (normalized.includes("fechamento") || normalized.includes("saldo")) return "balance"
  if (normalized.includes("resultado")) return "result"
  return "expense"
}

function snapshotRowsToDreRows(rows: SupabaseRow[]) {
  return rows.map((row) => ({
    id: String(row.id ?? `${row.row_index}-${row.account_name}`),
    label: String(row.account_name ?? row.raw_label ?? "Linha sem descricao"),
    kind: kindFromImportedRow(row.row_type),
    values: valuesFromImportedRow(row),
    totalValue: row.total === null || row.total === undefined ? null : Number(row.total),
    displayAsPercent: String(row.row_type ?? "") === "percent",
    group: groupFromImportedRow(row.group_name),
    groupName: String(row.group_name ?? ""),
  })) satisfies DreRow[]
}

function findRowValues(rows: DreRow[], labelIncludes: string) {
  const key = normalizeTextKey(labelIncludes)
  return rows.find((row) => normalizeTextKey(row.label).includes(key))?.values ?? [...empty]
}

export function DREContent() {
  const [year, setYear] = useState("2026")
  const [closingMonth, setClosingMonth] = useState("mai-26")
  const [closeOpen, setCloseOpen] = useState(false)
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([])
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [reason, setReason] = useState("")
  const [responsible, setResponsible] = useState("Administrador GATE")
  const [clients, setClients] = useState<SupabaseRow[]>([])
  const [financialEntries, setFinancialEntries] = useState<SupabaseRow[]>([])
  const [partnerEntries, setPartnerEntries] = useState<SupabaseRow[]>([])
  const [bankAccounts, setBankAccounts] = useState<SupabaseRow[]>([])
  const [dreCategories, setDreCategories] = useState<SupabaseRow[]>([])
  const [closings, setClosings] = useState<SupabaseRow[]>([])
  const [operationalTemplateRows, setOperationalTemplateRows] = useState<Array<{ label: string; groupName: string; rowType: string }>>([])
  const [importPreviews, setImportPreviews] = useState<DreImportPreview[]>([])
  const [importMode, setImportMode] = useState<DreImportMode>("operational")
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<DreWorkbookSheet[]>([])
  const [selectedSheetNames, setSelectedSheetNames] = useState<string[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cleanupMode, setCleanupMode] = useState<"imported-selected" | "imported-all" | "manual" | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [importedRows, setImportedRows] = useState<DreRow[]>([])
  const [importedSnapshotInfo, setImportedSnapshotInfo] = useState<SupabaseRow | null>(null)
  const [importHistory, setImportHistory] = useState<SupabaseRow[]>([])
  const [selectedImportId, setSelectedImportId] = useState("")
  const [importStructureMissing, setImportStructureMissing] = useState(false)
  const [dreView, setDreView] = useState<"operational" | "imported">("operational")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      getClients(),
      getFinancialEntries(),
      getDreCategories(),
      getDreManualAdjustments(),
      getDreMonthlyClosings(),
      getPartnerEntries(),
      getFinancialSelectOptions(),
      getLatestDreImportSnapshot(year),
      getDreImportSnapshots(year),
      getDreOperationalTemplateRows(year),
    ]).then(([clientRows, entryRows, categoryRows, adjustmentRows, closingRows, partnerEntryRows, financialOptions, importResult, importListResult, templateResult]) => {
      const categories = categoryRows as SupabaseRow[]
      const categoryById = new Map(categories.map((category) => [String(category.id ?? ""), category]))

      setClients(clientRows as SupabaseRow[])
      setFinancialEntries(entryRows as SupabaseRow[])
      setPartnerEntries(partnerEntryRows as SupabaseRow[])
      setBankAccounts((financialOptions as { bankAccounts?: SupabaseRow[] }).bankAccounts ?? [])
      setDreCategories(categories)
      setAdjustments((adjustmentRows as SupabaseRow[]).map((item) => normalizeAdjustment(item, categoryById)))
      setClosings(closingRows as SupabaseRow[])
      setImportStructureMissing(importResult.missingStructure)
      setImportedSnapshotInfo(importResult.snapshot?.import ?? null)
      setImportedRows(importResult.snapshot?.rows ? snapshotRowsToDreRows(importResult.snapshot.rows as SupabaseRow[]) : [])
      setImportHistory(importListResult.imports)
      setSelectedImportId(String(importResult.snapshot?.import?.id ?? importListResult.imports[0]?.id ?? ""))
      console.log("[DRE Template] linhas carregadas", templateResult.rows.length)
      console.log("[DRE Template] ano selecionado", year)
      console.log("[DRE Template] primeira linha", templateResult.rows[0] ?? null)
      setOperationalTemplateRows(templateRowsToDreRows(templateResult.rows))
    })
  }, [year])

  useEffect(() => {
    if (!selectedImportId) return

    let active = true
    getDreImportSnapshotById(selectedImportId)
      .then((result) => {
        if (!active || !result.snapshot) return
        setImportStructureMissing(result.missingStructure)
        setImportedSnapshotInfo(result.snapshot.import as SupabaseRow)
        setImportedRows(snapshotRowsToDreRows(result.snapshot.rows as SupabaseRow[]))
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar o historico importado."))

    return () => {
      active = false
    }
  }, [selectedImportId])

  const {
    rows,
    receitaTotal,
    despesasTotal,
    resultado,
    lucroOperacional,
    saldoAnteriorValues,
    saldoOperacaoValues,
    saldoBancoValues,
    diferencaValues,
    hasRealData,
  } = useMemo(
    () => buildRows({
      year,
      categories: dreCategories,
      clients,
      financialEntries,
      adjustments,
      partnerEntries,
      bankAccounts,
      closings,
      templateRows: operationalTemplateRows,
    }),
    [adjustments, bankAccounts, clients, closings, dreCategories, financialEntries, operationalTemplateRows, partnerEntries, year]
  )

  const usingImportedDre = dreView === "imported" && importedRows.length > 0
  const activeRows = usingImportedDre ? importedRows : rows
  const activeHasRealData = usingImportedDre || hasRealData
  const activeReceitaTotal = usingImportedDre ? findRowValues(importedRows, "RECEITA TOTAL") : receitaTotal
  const activeDespesasTotal = usingImportedDre ? findRowValues(importedRows, "Total de Despesas Operacionais") : despesasTotal
  const activeResultado = usingImportedDre ? findRowValues(importedRows, "RESULTADO OPERACIONAL") : resultado
  const activeLucroOperacional = usingImportedDre ? findRowValues(importedRows, "LUCRO OPERACIONAL") : lucroOperacional
  const activeSaldoAnterior = usingImportedDre ? findRowValues(importedRows, "SALDO ANTERIOR") : saldoAnteriorValues
  const activeSaldoOperacao = usingImportedDre ? findRowValues(importedRows, "SALDO OPERACAO") : saldoOperacaoValues
  const activeSaldoBanco = usingImportedDre ? findRowValues(importedRows, "SALDO BANCO") : saldoBancoValues
  const activeDiferenca = usingImportedDre ? findRowValues(importedRows, "DIFERENCA") : diferencaValues

  const monthIndex = months.indexOf(closingMonth)
  const safeMonthIndex = monthIndex >= 0 ? monthIndex : 0
  const selectedClosing = closings.find((closing) =>
    Number(closing.year) === Number(year) && Number(closing.month) === monthLabelToNumber(closingMonth)
  )
  const isClosed = Boolean(selectedClosing)
  const closedMonths = closings
    .filter((closing) => Number(closing.year) === Number(year))
    .map((closing) => monthNumberToLabel(closing.month))

  const saldoAnterior = activeSaldoAnterior
  const saldoOperacao = activeSaldoOperacao
  const saldoBanco = activeSaldoBanco
  const diferenca = activeDiferenca

  const handleCloseMonth = async () => {
    try {
      const month = monthLabelToNumber(closingMonth)
      const created = await createDreMonthlyClosing({
        year: Number(year),
        month,
        revenue_total: activeReceitaTotal[safeMonthIndex] ?? 0,
        expenses_total: activeDespesasTotal[safeMonthIndex] ?? 0,
        operational_profit: activeLucroOperacional[safeMonthIndex] ?? 0,
        operational_result: activeResultado[safeMonthIndex] ?? 0,
        previous_balance: saldoAnterior[safeMonthIndex] ?? 0,
        operation_balance: saldoOperacao[safeMonthIndex] ?? 0,
        bank_balance: saldoBanco[safeMonthIndex] ?? 0,
        difference: diferenca[safeMonthIndex] ?? 0,
        status: "fechado",
        closed_at: new Date().toISOString(),
      })
      setClosings((current) => [created as SupabaseRow, ...current])
      setCloseOpen(false)
      toast.success("Fechamento salvo com valores reais atuais.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel fechar o mes.")
    }
  }

  const openManualEdit = (target: EditTarget) => {
    if (!target.row.categoryId) {
      toast.error("Esta linha nao possui categoria DRE real para ajuste.")
      return
    }
    setEditTarget(target)
    setNewValue(String(target.currentValue))
    setReason("")
    setResponsible("Administrador GATE")
  }

  const handleApplyAdjustment = async () => {
    if (!editTarget?.row.categoryId) return

    const parsedValue = Number(newValue.replace(",", "."))
    if (Number.isNaN(parsedValue)) {
      toast.error("Informe um novo valor valido")
      return
    }

    try {
      const created = await createDreManualAdjustment({
        year: Number(year),
        month: editTarget.monthIndex + 1,
        dre_category_id: editTarget.row.categoryId,
        previous_value: editTarget.currentValue,
        new_value: parsedValue,
        reason,
        responsible,
      }) as SupabaseRow

      setAdjustments((current) => [
        {
          id: String(created.id ?? crypto.randomUUID()),
          categoryId: editTarget.row.categoryId ?? "",
          date: String(created.created_at ?? new Date().toISOString()),
          category: editTarget.row.label,
          month: editTarget.month,
          monthIndex: editTarget.monthIndex,
          previousValue: editTarget.currentValue,
          newValue: parsedValue,
          reason,
          responsible,
        },
        ...current,
      ])
      setEditTarget(null)
      toast.success("Ajuste manual salvo no Supabase.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o ajuste manual.")
    }
  }

  const handleDeleteAdjustment = async (adjustment: ManualAdjustment) => {
    if (!window.confirm(`Excluir ajuste de ${adjustment.category} em ${adjustment.month}?`)) return
    try {
      await deleteDreManualAdjustment(adjustment.id)
      setAdjustments((current) => current.filter((item) => item.id !== adjustment.id))
      toast.success("Ajuste manual excluido.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o ajuste.")
    }
  }

  const openImportPreview = async (file: File, sheetNamesToParse: string[], mode = importMode) => {
    const previews = await Promise.all(sheetNamesToParse.map((sheetName) => parseDreImportFile(file, sheetName, { mode })))
    setImportPreviews(previews)
    setImportOpen(true)
  }

  const handleImportFile = async (file: File | null | undefined) => {
    if (!file) return
    try {
      const sheets = await getDreWorkbookSheets(file)
      const extension = file.name.split(".").pop()?.toLowerCase()
      if (extension !== "csv") {
        const operationalSheets = sheets.filter((sheet) => isOperationalDreSheetName(sheet.name))
        const historySheets = sheets.filter((sheet) => isHistorySheetName(sheet.name))
        const nextMode = operationalSheets.length ? "operational" : "history"
        setPendingImportFile(file)
        setSheetNames(sheets)
        setImportMode(nextMode)
        setSelectedSheetNames((nextMode === "operational" ? operationalSheets : (historySheets.length ? historySheets : sheets)).map((sheet) => sheet.name).filter(Boolean))
        setSheetOpen(true)
        return
      }

      const singleSheetName = sheets[0]?.name ?? "CSV"
      const nextMode = isOperationalDreSheetName(singleSheetName) ? "operational" : "history"
      setImportMode(nextMode)
      await openImportPreview(file, [singleSheetName], nextMode)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel ler o arquivo.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleConfirmSheet = async () => {
    if (!pendingImportFile || selectedSheetNames.length === 0) return
    if (importMode === "operational" && selectedSheetNames.some((sheetName) => !isOperationalDreSheetName(sheetName))) {
      toast.error("DRE operacional atual deve usar a aba DRE 2026. Use o modo Historico para arquivar anos anteriores.")
      return
    }
    try {
      await openImportPreview(pendingImportFile, selectedSheetNames)
      setSheetOpen(false)
      setPendingImportFile(null)
      setSheetNames([])
      setSelectedSheetNames([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel ler a aba selecionada.")
    }
  }

  const handleConfirmImport = async () => {
    if (importPreviews.length === 0) return

    setImporting(true)
    try {
      let latestSnapshot: Awaited<ReturnType<typeof createDreImportSnapshot>> | null = null
      for (const preview of importPreviews) {
        const savedMonths = new Set(preview.rows.flatMap((row) => Object.keys(row.values))).size

        if (importMode === "operational") {
          const templateResult = await replaceDreOperationalTemplateRows(yearFromSheetName(preview.sheetName, year), preview.rows.map((row) => ({
            row_index: row.rowIndex,
            group_name: row.groupName,
            account_name: row.account,
            row_type: row.rowType,
            source_sheet: preview.sheetName,
            active: true,
          })))

          if (templateResult.missingStructure) {
            throw new Error("Estrutura de template operacional da DRE incompleta. Execute o SQL de suporte.")
          }

          console.info("[dre-template] Template operacional salvo", {
            sheetName: preview.sheetName,
            rowsSaved: templateResult.rows.length,
            monthsIdentified: preview.monthNumbers.length,
            monthsSaved: savedMonths,
            ignoredRows: preview.ignoredRows.length,
          })
          console.log("[DRE Template] linhas carregadas", templateResult.rows.length)
          console.log("[DRE Template] ano selecionado", yearFromSheetName(preview.sheetName, year))
          console.log("[DRE Template] primeira linha", templateResult.rows[0] ?? null)
          setOperationalTemplateRows(templateRowsToDreRows(templateResult.rows))
        } else {
          latestSnapshot = await createDreImportSnapshot({
            fileName: preview.fileName,
            sheetName: preview.sheetName,
            year: yearFromSheetName(preview.sheetName, year),
            importedBy: responsible || "Sistema",
            importKind: "historico",
            rows: preview.rows.map((row) => ({
              row_index: row.rowIndex,
              group_name: row.groupName,
              account_name: row.account,
              row_type: row.rowType,
              jan: row.values[1] ?? null,
              fev: row.values[2] ?? null,
              mar: row.values[3] ?? null,
              abr: row.values[4] ?? null,
              mai: row.values[5] ?? null,
              jun: row.values[6] ?? null,
              jul: row.values[7] ?? null,
              ago: row.values[8] ?? null,
              set: row.values[9] ?? null,
              out: row.values[10] ?? null,
              nov: row.values[11] ?? null,
              dez: row.values[12] ?? null,
              total: row.total,
              raw_label: row.rawLabel,
              raw_data: row.rawData ?? null,
            })),
          })

          console.info("[dre-import] Snapshot historico salvo", {
            importId: latestSnapshot.import.id,
            sheetName: preview.sheetName,
            rowsSaved: latestSnapshot.rows.length,
            monthsIdentified: preview.monthNumbers.length,
            monthsSaved: savedMonths,
            ignoredRows: preview.ignoredRows.length,
          })
        }
      }

      if (importMode === "operational") {
        setDreView("operational")
        setImportOpen(false)
        setImportPreviews([])
        toast.success("Estrutura da DRE operacional atualizada. Os valores continuam vindo do sistema.")
      } else if (latestSnapshot) {
        const snapshotImport = latestSnapshot.import as SupabaseRow
        const snapshotYear = String(snapshotImport.year ?? year)
        const refreshedImports = await getDreImportSnapshots(snapshotYear)
        setImportedSnapshotInfo(latestSnapshot.import as SupabaseRow)
        setImportedRows(snapshotRowsToDreRows(latestSnapshot.rows as SupabaseRow[]))
        setSelectedImportId(String(snapshotImport.id ?? ""))
        setImportHistory(refreshedImports.imports.length ? refreshedImports.imports : [snapshotImport])
        if (snapshotYear !== year) setYear(snapshotYear)
        setDreView("imported")
        setImportOpen(false)
        setImportPreviews([])
        toast.success("Importacao salva no Historico importado. A DRE operacional nao foi alterada.", {
          action: {
            label: "Ver historico importado",
            onClick: () => setDreView("imported"),
          },
        })
      }
      setImportStructureMissing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel confirmar a importacao.")
    } finally {
      setImporting(false)
    }
  }

  const handleCleanup = async () => {
    if (!cleanupMode) return
    setCleaning(true)
    try {
      if (cleanupMode === "imported-selected") {
        if (!selectedImportId) {
          toast.info("Nenhum historico importado selecionado para limpar.")
          return
        }
        const deletedSnapshots = await deleteDreImportSnapshot(selectedImportId)
        setImportHistory((current) => current.filter((item) => String(item.id ?? "") !== selectedImportId))
        setImportedRows([])
        setImportedSnapshotInfo(null)
        setSelectedImportId("")
        setDreView("operational")
        if (deletedSnapshots.length) {
          toast.success("Historico importado selecionado removido.")
        } else {
          toast.info("Nenhum historico importado encontrado para limpar.")
        }
      } else if (cleanupMode === "imported-all") {
        const deletedAdjustments = await deleteDreImportedAdjustments()
        const deletedSnapshots = await deleteDreHistoryImportSnapshots()
        const refreshedImports = await getDreImportSnapshots(year)
        const nextImportId = String(refreshedImports.imports[0]?.id ?? "")
        setAdjustments((current) => current.filter((item) => {
          const reason = item.reason.toUpperCase()
          return !reason.startsWith("IMPORTACAO_DRE:") && !reason.startsWith("IMPORTACAO EXCEL -") && !reason.startsWith("IMPORTAÇÃO EXCEL -")
        }))
        setImportedRows([])
        setImportedSnapshotInfo(null)
        setImportHistory(refreshedImports.imports)
        setSelectedImportId(nextImportId)
        setDreView("operational")
        if (deletedAdjustments.length || deletedSnapshots.length) {
          toast.success("Historicos importados da DRE removidos.")
        } else {
          toast.info("Nenhum historico importado encontrado para limpar.")
        }
      } else {
        await deleteAllDreManualAdjustments()
        setAdjustments([])
        toast.success("Ajustes manuais da DRE zerados.")
      }
      window.localStorage.removeItem("gate-dre-import")
      window.sessionStorage.removeItem("gate-dre-import")
      setCleanupMode(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel limpar a DRE manual.")
    } finally {
      setCleaning(false)
    }
  }

  const renderValue = (row: DreRow, month: number) => {
    const value = row.values?.[month] ?? 0
    if (row.displayAsPercent) return value ? `${value.toFixed(2)}%` : "-"
    if (row.kind === "percent" && row.percentOf) {
      const percentValue = activeRows.find((item) => item.label === row.percentOf)?.values?.[month] ?? 0
      const revenue = activeReceitaTotal[month]
      return revenue ? `${((percentValue / revenue) * 100).toFixed(2)}%` : "-"
    }
    return value ? formatCurrency(value) : "-"
  }

  const renderTotal = (row: DreRow) => {
    if (row.kind === "percent" || row.displayAsPercent) return row.totalValue ? `${row.totalValue.toFixed(2)}%` : ""
    return formatCurrency(row.totalValue ?? sum(row.values))
  }

  const exportDreRows = (filename: string) =>
    exportExcelTable({
      filename: filename.replace(/\.csv$/i, ".xls"),
      title: "DRE Gerencial",
      metadata: [
        ["Ano", year],
        ["Mes em analise", closingMonth],
        ["Data de emissao", new Date().toLocaleDateString("pt-BR")],
      ],
      columns: ["Conta", ...months, "Total"],
      rows: activeRows.length
        ? activeRows.map((row) => [
            row.label,
            ...months.map((_, index) => renderValue(row, index)),
            renderTotal(row),
          ])
        : [["Sem dados financeiros para o periodo selecionado.", ...months.map(() => "-"), formatCurrency(0)]],
    })

  const exportClosingRows = () =>
    exportPdfReport(buildGenericReport({
      title: `Fechamento DRE ${closingMonth}`,
      subtitle: "DRE Gerencial",
      description: "Resumo do fechamento mensal do DRE.",
      rows: [
        { indicador: "Mes", valor: closingMonth },
        { indicador: "Status", valor: isClosed ? "Fechado" : "Em conferencia" },
        { indicador: "Receita do mes", valor: formatCurrency(activeReceitaTotal[safeMonthIndex] ?? 0) },
        { indicador: "Despesas do mes", valor: formatCurrency(activeDespesasTotal[safeMonthIndex] ?? 0) },
        { indicador: "Lucro operacional", valor: formatCurrency(activeLucroOperacional[safeMonthIndex] ?? 0) },
        { indicador: "Resultado operacional", valor: formatCurrency(activeResultado[safeMonthIndex] ?? 0) },
        { indicador: "Saldo anterior", valor: formatCurrency(saldoAnterior[safeMonthIndex] ?? 0) },
        { indicador: "Saldo operacao", valor: formatCurrency(saldoOperacao[safeMonthIndex] ?? 0) },
        { indicador: "Saldo banco", valor: formatCurrency(saldoBanco[safeMonthIndex] ?? 0) },
        { indicador: "Diferenca", valor: formatCurrency(diferenca[safeMonthIndex] ?? 0) },
      ],
    }))

  const exportDrePdf = () =>
    exportPdfReport(buildDreReport(
      activeRows.length
        ? activeRows.map((row) => ({
            name: row.label,
            jan: renderValue(row, 0),
            fev: renderValue(row, 1),
            mar: renderValue(row, 2),
            total: renderTotal(row),
          }))
        : [{
            name: "Sem dados financeiros para o periodo selecionado.",
            jan: "-",
            fev: "-",
            mar: "-",
            total: formatCurrency(0),
          }]
    ))

  const totalImportRowsRead = importPreviews.reduce((total, preview) => total + preview.totalRowsRead, 0)
  const totalImportRows = importPreviews.reduce((total, preview) => total + preview.rows.length, 0)
  const totalIgnoredRows = importPreviews.reduce((total, preview) => total + preview.ignoredRows.length, 0)
  const importPreviewRows = importPreviews.flatMap((preview) =>
    preview.rows.flatMap((row) => {
      const entries = Object.entries(row.values)
      if (!entries.length) {
        return [{
          sheetName: preview.sheetName,
          rowIndex: row.rowIndex,
          account: row.account,
          groupName: row.groupName,
          type: row.type,
          rowType: row.rowType,
          month: 0,
          value: 0,
        }]
      }

      return entries.map(([month, value]) => ({
        sheetName: preview.sheetName,
        rowIndex: row.rowIndex,
        account: row.account,
        groupName: row.groupName,
        type: row.type,
        rowType: row.rowType,
        month: Number(month),
        value,
      }))
    })
  )
  const importPreviewMonthTotals = importPreviewRows.reduce((totals, row) => {
    if (!row.month) return totals
    totals.set(row.month, (totals.get(row.month) ?? 0) + row.value)
    return totals
  }, new Map<number, number>())

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">DRE Gerencial</h1>
          <p className="text-muted-foreground">
            {usingImportedDre
              ? `Exibindo DRE importada de ${String(importedSnapshotInfo?.file_name ?? "planilha")} / ${String(importedSnapshotInfo?.sheet_name ?? "aba")}.`
              : "Controle mensal gerencial com dados reais do Supabase."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={(value) => value && setYear(value)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant={usingImportedDre ? "default" : "outline"}>
            {usingImportedDre ? "DRE importada" : "DRE do sistema"}
          </Badge>
          <Select value={dreView} onValueChange={(value) => setDreView(value as "operational" | "imported")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">DRE operacional</SelectItem>
              <SelectItem value="imported" disabled={!importedRows.length}>Historico importado</SelectItem>
            </SelectContent>
          </Select>
          {dreView === "imported" && importHistory.length > 0 && (
            <Select value={selectedImportId} onValueChange={setSelectedImportId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Escolha ano/aba" />
              </SelectTrigger>
              <SelectContent>
                {importHistory.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {String(item.sheet_name ?? "Aba sem nome")} - {String(item.file_name ?? "arquivo sem nome")} ({String(item.year ?? "-")}, {importKindLabel(item.import_kind)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => handleImportFile(event.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button variant="outline" onClick={() => exportDreRows("gate-dre.csv")}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={exportDrePdf}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            Ver ajustes manuais
          </Button>
          <Button variant="outline" onClick={() => setCleanupMode("imported-selected")} disabled={!selectedImportId}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar historico
          </Button>
          <Button variant="outline" onClick={() => setCleanupMode("imported-all")} disabled={!importHistory.length}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar todos
          </Button>
          <Button variant="outline" onClick={() => setCleanupMode("manual")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Zerar DRE manual
          </Button>
        </div>
      </div>

      {usingImportedDre && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-900">
            Visualizacao historica. Esses dados ficam arquivados para consulta, relatorios e exportacoes, mas nao alimentam a DRE operacional, o Dashboard ou o Financeiro.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(sum(activeReceitaTotal))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Despesas Operacionais</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(sum(activeDespesasTotal))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Resultado Operacional</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(sum(activeResultado))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Meses Fechados</p>
            <p className="text-2xl font-bold">{closedMonths.length}/12</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Fechamento Mensal</CardTitle>
              <CardDescription>Fechamento persistido em `dre_monthly_closings`.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={closingMonth} onValueChange={(value) => value && setClosingMonth(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge className={isClosed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                {isClosed ? "Fechado" : "Em conferencia"}
              </Badge>
              <Button variant="outline" onClick={() => featureInPreparation("Análise de divergências ainda não configurada.")}>
                Ver divergencias
              </Button>
              <Button variant="outline" onClick={exportClosingRows}>
                Exportar fechamento
              </Button>
              {isClosed ? (
                <Button variant="outline" onClick={() => featureInPreparation("Reabertura de mês ainda não configurada.")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reabrir
                </Button>
              ) : (
                <Button onClick={() => setCloseOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Fechar mes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {[
              ["Receita do mes", activeReceitaTotal[safeMonthIndex] ?? 0, "text-emerald-600"],
              ["Despesas do mes", activeDespesasTotal[safeMonthIndex] ?? 0, "text-red-600"],
              ["Lucro operacional", activeLucroOperacional[safeMonthIndex] ?? 0, ""],
              ["Resultado operacional", activeResultado[safeMonthIndex] ?? 0, ""],
              ["Saldo anterior", saldoAnterior[safeMonthIndex] ?? 0, ""],
              ["Saldo operacao", saldoOperacao[safeMonthIndex] ?? 0, ""],
              ["Saldo banco", saldoBanco[safeMonthIndex] ?? 0, ""],
              ["Diferenca", diferenca[safeMonthIndex] ?? 0, ""],
            ].map(([label, value, className]) => (
              <div key={String(label)} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-xl font-bold ${className}`}>{formatCurrency(Number(value))}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DRE Gerencial</CardTitle>
          <CardDescription>
            {usingImportedDre ? "Snapshot fiel da planilha importada, sem recalcular totais." : `Ano selecionado: ${year}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {importStructureMissing && !usingImportedDre && (
            <div className="border-b bg-amber-50 p-4 text-sm text-amber-800">
              Estrutura de importacao integral da DRE ainda nao foi criada. Execute o SQL indicado em supabase/gate-os-dre-imported-snapshots.sql.
            </div>
          )}
          {!activeHasRealData ? (
            <div className="p-10 text-center text-muted-foreground">
              {dreCategories.length === 0
                ? "Cadastre categorias DRE ou execute o seed base para iniciar."
                : "Sem dados financeiros para o período selecionado."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1420px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="sticky left-0 z-20 border bg-slate-200 px-3 py-2 text-left">Conta</th>
                    {months.map((month) => (
                      <th key={month} className="border px-3 py-2 text-right">{month}</th>
                    ))}
                    <th className="sticky right-0 z-20 border bg-slate-200 px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row, rowIndex) => (
                    <tr key={row.id ?? `${row.label}-${rowIndex}`} className={rowClass(row.kind)}>
                      <td className={`sticky left-0 z-10 border px-3 py-1.5 ${rowClass(row.kind)}`}>{row.label}</td>
                      {months.map((month, currentMonthIndex) => (
                        <td key={`${row.label}-${month}`} className="relative border px-3 py-1.5 text-right">
                          {row.categoryId ? (
                            <button
                              type="button"
                              className="relative w-full text-right"
                              onClick={() =>
                                openManualEdit({
                                  row,
                                  month,
                                  monthIndex: currentMonthIndex,
                                  currentValue: row.values?.[currentMonthIndex] ?? 0,
                                })
                              }
                            >
                              {renderValue(row, currentMonthIndex)}
                            </button>
                          ) : (
                            renderValue(row, currentMonthIndex)
                          )}
                        </td>
                      ))}
                      <td className={`sticky right-0 z-10 border px-3 py-1.5 text-right ${rowClass(row.kind)}`}>
                        {renderTotal(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar {closingMonth}</DialogTitle>
            <DialogDescription>
              O fechamento sera salvo com os valores reais atuais. Se o banco estiver zerado, os valores salvos serao R$ 0,00.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex justify-between rounded-lg border p-3">
              <span>Receita</span>
              <strong className="text-emerald-600">{formatCurrency(activeReceitaTotal[safeMonthIndex] ?? 0)}</strong>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Despesas operacionais</span>
              <strong className="text-red-600">{formatCurrency(activeDespesasTotal[safeMonthIndex] ?? 0)}</strong>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Resultado operacional</span>
              <strong>{formatCurrency(activeResultado[safeMonthIndex] ?? 0)}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancelar</Button>
            <Button onClick={handleCloseMonth}>Confirmar fechamento real</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste manual do DRE</DialogTitle>
            <DialogDescription>Correção persistida em `dre_manual_adjustments`.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Mes</p>
                  <p className="font-semibold">{editTarget.month}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-semibold">{editTarget.row.label}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Valor atual</Label>
                <Input value={formatCurrency(editTarget.currentValue)} readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dre-new-value">Novo valor</Label>
                <Input id="dre-new-value" type="number" value={newValue} onChange={(event) => setNewValue(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dre-reason">Motivo do ajuste</Label>
                <Input id="dre-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dre-responsible">Responsavel</Label>
                <Input id="dre-responsible" value={responsible} onChange={(event) => setResponsible(event.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleApplyAdjustment}>Salvar ajuste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar aba da planilha</DialogTitle>
            <DialogDescription>
              Escolha o modo de importacao e depois selecione as abas que serao processadas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Modo de importacao</Label>
              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="button"
                  className={`rounded-lg border p-3 text-left text-sm ${importMode === "operational" ? "border-primary bg-primary/10" : "bg-background"}`}
                  onClick={() => {
                    setImportMode("operational")
                    setSelectedSheetNames(sheetNames.filter((sheet) => isOperationalDreSheetName(sheet.name)).map((sheet) => sheet.name))
                  }}
                >
                  <span className="font-semibold">DRE operacional atual</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Use para importar a estrutura atual da DRE 2026. Essa visao serve de referencia para a DRE viva do sistema.
                  </span>
                </button>
                <button
                  type="button"
                  className={`rounded-lg border p-3 text-left text-sm ${importMode === "history" ? "border-primary bg-primary/10" : "bg-background"}`}
                  onClick={() => {
                    setImportMode("history")
                    setSelectedSheetNames(sheetNames.filter((sheet) => isHistorySheetName(sheet.name)).map((sheet) => sheet.name))
                  }}
                >
                  <span className="font-semibold">Historico</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Use para arquivar DREs antigas, como 2024 e 2025. Esses dados ficam disponiveis para consulta e relatorios, mas nao alteram a DRE operacional.
                  </span>
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Abas DRE atuais/recomendadas</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {sheetNames.filter((sheet) => isOperationalDreSheetName(sheet.name)).length ? (
                  sheetNames.filter((sheet) => isOperationalDreSheetName(sheet.name)).map((sheet) => (
                    <label key={sheet.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSheetNames.includes(sheet.name)}
                        onChange={(event) => {
                          setSelectedSheetNames((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, sheet.name]))
                              : current.filter((name) => name !== sheet.name)
                          )
                        }}
                      />
                      <span className="font-medium">{sheet.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma aba DRE 2026 foi detectada.</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Abas historicas</Label>
              <div className="space-y-2 rounded-lg border p-3">
                {sheetNames.filter((sheet) => isHistorySheetName(sheet.name)).length ? (
                  sheetNames.filter((sheet) => isHistorySheetName(sheet.name)).map((sheet) => (
                    <label key={sheet.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedSheetNames.includes(sheet.name)}
                        onChange={(event) => {
                          setSelectedSheetNames((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, sheet.name]))
                              : current.filter((name) => name !== sheet.name)
                          )
                        }}
                      />
                      <span className="font-medium">{sheet.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma aba historica foi detectada.</p>
                )}
                {importMode === "history" && (
                  <p className="text-xs text-muted-foreground">
                    Essas abas serao arquivadas para consulta e relatorios. Elas nao alteram a DRE operacional.
                  </p>
                )}
              </div>
            </div>
            {sheetNames.some((sheet) => !isOperationalDreSheetName(sheet.name) && !isHistorySheetName(sheet.name)) && (
              <div className="grid gap-2">
                <Label>Outras abas</Label>
                <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {sheetNames.filter((sheet) => !isOperationalDreSheetName(sheet.name) && !isHistorySheetName(sheet.name)).map((sheet) => (
                    <label key={sheet.name} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSheetNames.includes(sheet.name)}
                        disabled={importMode !== "history"}
                        onChange={(event) => {
                          setSelectedSheetNames((current) =>
                            event.target.checked
                              ? Array.from(new Set([...current, sheet.name]))
                              : current.filter((name) => name !== sheet.name)
                          )
                        }}
                      />
                      <span>{sheet.name}</span>
                    </label>
                  ))}
                  <p className="text-xs">Outras abas so podem ser arquivadas no modo Historico.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmSheet} disabled={selectedSheetNames.length === 0}>Continuar para preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview da importacao DRE</DialogTitle>
            <DialogDescription>
              Confira os dados que serao importados para a DRE gerencial.
            </DialogDescription>
          </DialogHeader>
          {importPreviews.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <p><strong>Arquivo:</strong> {importPreviews[0]?.fileName}</p>
                <p><strong>Abas:</strong> {importPreviews.map((preview) => preview.sheetName).join(", ")}</p>
                <p><strong>Linhas lidas:</strong> {totalImportRowsRead}</p>
                <p><strong>Linhas que serao importadas:</strong> {totalImportRows}</p>
                <p><strong>Modo:</strong> {importMode === "operational" ? "DRE operacional atual" : "Historico"}</p>
                <p><strong>Meses identificados:</strong> {Array.from(new Set(importPreviews.flatMap((preview) => preview.monthNumbers))).map((month) => months[month - 1] ?? month).join(", ") || "Tabela historica generica"}</p>
                <p><strong>Linhas ignoradas:</strong> {totalIgnoredRows}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                {Array.from(importPreviewMonthTotals.entries()).map(([month, total]) => (
                  <div key={month} className="rounded-lg border p-2 text-sm">
                    <p className="text-muted-foreground">{months[month - 1] ?? month}</p>
                    <p className="font-semibold">{formatCurrency(total)}</p>
                  </div>
                ))}
              </div>
              <div className="max-h-80 overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Conta</th>
                      <th className="px-3 py-2 text-left">Aba</th>
                      <th className="px-3 py-2 text-left">Linha</th>
                      <th className="px-3 py-2 text-left">Grupo</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Tipo de linha</th>
                      <th className="px-3 py-2 text-left">Mes</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreviewRows
                      .map((row) => (
                        <tr key={`${row.sheetName}-${row.rowIndex}-${row.groupName}-${row.account}-${row.month}`} className="border-t">
                          <td className="px-3 py-2">{row.account}</td>
                          <td className="px-3 py-2">{row.sheetName}</td>
                          <td className="px-3 py-2">{row.rowIndex}</td>
                          <td className="px-3 py-2">{row.groupName}</td>
                          <td className="px-3 py-2">{row.type === "receita" ? "Receita" : row.type === "despesa" ? "Despesa" : "Neutro"}</td>
                          <td className="px-3 py-2">{dreImportRowTypeLabel(row.rowType)}</td>
                          <td className="px-3 py-2">{row.month ? months[row.month - 1] ?? row.month : "-"}</td>
                          <td className="px-3 py-2 text-right font-semibold">{row.month ? formatCurrency(row.value) : "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {totalIgnoredRows > 0 && (
                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Linhas ignoradas</p>
                  <p>Foram ignoradas apenas linhas vazias, sem conta e sem valor.</p>
                  <ul className="mt-2 max-h-24 overflow-auto">
                    {importPreviews.flatMap((preview) => preview.ignoredRows.map((row) => ({ ...row, sheetName: preview.sheetName }))).slice(0, 10).map((row) => (
                      <li key={`${row.sheetName}-${row.rowIndex}-${row.reason}`}>{row.sheetName}, linha {row.rowIndex}: {row.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancelar</Button>
            <Button onClick={handleConfirmImport} disabled={importing || importPreviews.length === 0}>
              {importing ? "Importando..." : "Confirmar importacao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cleanupMode} onOpenChange={(open) => !open && setCleanupMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cleanupMode === "manual" ? "Zerar DRE manual" : cleanupMode === "imported-all" ? "Limpar todos os historicos da DRE" : "Limpar historico selecionado da DRE"}</DialogTitle>
            <DialogDescription>
              {cleanupMode === "manual"
                ? "Esta acao apaga todos os registros de dre_manual_adjustments. Contratos, clientes, financeiro, categorias e fechamentos mensais serao preservados."
                : cleanupMode === "imported-all"
                  ? "Esta acao apaga todos os snapshots importados da DRE. Operacao, contratos, clientes, financeiro e ajustes manuais serao preservados."
                  : "Esta acao apaga somente o historico importado selecionado. Operacao, contratos, clientes, financeiro e ajustes manuais serao preservados."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Confirme apenas se voce ja validou que deseja remover esses ajustes da DRE. A tela sera recalculada com os dados reais restantes do Supabase.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupMode(null)} disabled={cleaning}>Cancelar</Button>
            <Button variant="destructive" onClick={handleCleanup} disabled={cleaning}>
              {cleaning ? "Limpando..." : "Confirmar limpeza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajustes manuais</DialogTitle>
            <DialogDescription>Registros reais de `dre_manual_adjustments`.</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Mes</th>
                  <th className="px-3 py-2 text-right">Anterior</th>
                  <th className="px-3 py-2 text-right">Novo</th>
                  <th className="px-3 py-2 text-left">Motivo</th>
                  <th className="px-3 py-2 text-left">Responsavel</th>
                  <th className="px-3 py-2 text-right">Acao</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Nenhum ajuste manual registrado.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="border-t">
                      <td className="px-3 py-2">
                        {adjustment.date ? new Date(adjustment.date).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="px-3 py-2">{adjustment.category}</td>
                      <td className="px-3 py-2">{adjustment.month}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(adjustment.previousValue)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(adjustment.newValue)}</td>
                      <td className="px-3 py-2">{adjustment.reason || "-"}</td>
                      <td className="px-3 py-2">{adjustment.responsible || "-"}</td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAdjustment(adjustment)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
