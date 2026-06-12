"use client"

import { useEffect, useMemo, useState } from "react"
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
  deleteDreManualAdjustment,
  getDreCategories,
  getDreManualAdjustments,
  getDreMonthlyClosings,
} from "@/lib/data/dre"
import { formatCurrency } from "@/lib/utils"
import { getContracts } from "@/lib/data/contracts"
import { getFinancialEntries } from "@/lib/data/financial"
import {
  calculateContractRevenueByMonth,
  getEntryAmount,
  getEntryMonthKey,
  isExpenseEntry,
  isIncomeEntry,
} from "@/lib/data/recurring-revenue"
import type { SupabaseRow } from "@/lib/supabase/types"

const months = ["jan-26", "fev-26", "mar-26", "abr-26", "mai-26", "jun-26", "jul-26", "ago-26", "set-26", "out-26", "nov-26", "dez-26"]
const empty = Array(12).fill(0)

type RowKind = "normal" | "total" | "highlight" | "percent"

type DreRow = {
  label: string
  kind?: RowKind
  values: number[]
  percentOf?: string
  categoryId?: string
  group: "revenue" | "expense" | "result" | "balance"
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

function normalizeCategoryType(category: SupabaseRow) {
  const value = String(category.type ?? category.group_name ?? "").toLowerCase()
  if (["receita", "revenue", "income"].includes(value)) return "revenue"
  if (["despesa", "expense", "cost", "custo"].includes(value)) return "expense"
  return "expense"
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

function buildRows({
  year,
  categories,
  contracts,
  financialEntries,
  adjustments,
}: {
  year: string
  categories: SupabaseRow[]
  contracts: SupabaseRow[]
  financialEntries: SupabaseRow[]
  adjustments: ManualAdjustment[]
}) {
  const categoryById = new Map(categories.map((category) => [String(category.id ?? ""), category]))
  const rowMap = new Map<string, DreRow>()

  const ensureRow = (key: string, row: Omit<DreRow, "values"> & { values?: number[] }) => {
    const current = rowMap.get(key)
    if (current) return current
    const created: DreRow = { ...row, values: row.values ?? [...empty] }
    rowMap.set(key, created)
    return created
  }

  const numericYear = Number(year)
  const contractValues = Number.isFinite(numericYear)
    ? calculateContractRevenueByMonth(contracts, financialEntries, numericYear)
    : [...empty]

  if (sum(contractValues) > 0) {
    ensureRow("contracts", {
      label: "Contratos ativos",
      group: "revenue",
      values: contractValues,
    })
  }

  financialEntries.forEach((entry) => {
    const monthKey = getEntryMonthKey(entry)
    if (!monthKey.startsWith(`${year}-`)) return

    const monthIndex = Number(monthKey.slice(5, 7)) - 1
    if (monthIndex < 0 || monthIndex > 11) return

    const categoryId = String(entry.dre_category_id ?? "")
    const category = categoryById.get(categoryId)
    const group = isIncomeEntry(entry) ? "revenue" : isExpenseEntry(entry) ? "expense" : null
    if (!group) return

    const key = categoryId || `fallback-${group}`
    const row = ensureRow(key, {
      label: category ? getCategoryName(category) : group === "revenue" ? "Outras receitas" : "Outras despesas",
      group,
      categoryId: categoryId || undefined,
    })
    row.values[monthIndex] += Math.abs(getEntryAmount(entry))
  })

  adjustments.forEach((adjustment) => {
    const category = categoryById.get(adjustment.categoryId)
    if (!category) return
    const group = normalizeCategoryType(category)
    const row = ensureRow(adjustment.categoryId, {
      label: getCategoryName(category),
      group,
      categoryId: adjustment.categoryId,
    })
    row.values[adjustment.monthIndex] = adjustment.newValue
  })

  const detailRows = Array.from(rowMap.values())
  const revenueRows = detailRows.filter((row) => row.group === "revenue")
  const expenseRows = detailRows.filter((row) => row.group === "expense")
  const receitaTotal = revenueRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const despesasTotal = expenseRows.reduce((acc, row) => addValues(acc, row.values), [...empty])
  const resultado = subtractValues(receitaTotal, despesasTotal)

  if (detailRows.length === 0) {
    return {
      rows: [] as DreRow[],
      receitaTotal,
      despesasTotal,
      resultado,
      hasRealData: false,
    }
  }

  return {
    rows: [
      ...revenueRows,
      { label: "RECEITA TOTAL", kind: "total", group: "result", values: receitaTotal },
      ...expenseRows,
      { label: "Total de Despesas Operacionais", kind: "highlight", group: "result", values: despesasTotal },
      {
        label: "% Despesas s/Receita",
        kind: "percent",
        group: "result",
        percentOf: "Total de Despesas Operacionais",
        values: despesasTotal,
      },
      { label: "RESULTADO OPERACIONAL", kind: "total", group: "result", values: resultado },
    ] as DreRow[],
    receitaTotal,
    despesasTotal,
    resultado,
    hasRealData: true,
  }
}

function rowClass(kind: RowKind = "normal") {
  if (kind === "total") return "bg-emerald-100 font-bold"
  if (kind === "highlight") return "bg-yellow-100 font-bold"
  if (kind === "percent") return "bg-muted/40 text-xs italic"
  return "bg-background"
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
  const [contracts, setContracts] = useState<SupabaseRow[]>([])
  const [financialEntries, setFinancialEntries] = useState<SupabaseRow[]>([])
  const [dreCategories, setDreCategories] = useState<SupabaseRow[]>([])
  const [closings, setClosings] = useState<SupabaseRow[]>([])

  useEffect(() => {
    Promise.all([
      getContracts(),
      getFinancialEntries(),
      getDreCategories(),
      getDreManualAdjustments(),
      getDreMonthlyClosings(),
    ]).then(([contractRows, entryRows, categoryRows, adjustmentRows, closingRows]) => {
      const categories = categoryRows as SupabaseRow[]
      const categoryById = new Map(categories.map((category) => [String(category.id ?? ""), category]))

      setContracts(contractRows as SupabaseRow[])
      setFinancialEntries(entryRows as SupabaseRow[])
      setDreCategories(categories)
      setAdjustments((adjustmentRows as SupabaseRow[]).map((item) => normalizeAdjustment(item, categoryById)))
      setClosings(closingRows as SupabaseRow[])
    })
  }, [])

  const { rows, receitaTotal, despesasTotal, resultado, hasRealData } = useMemo(
    () => buildRows({ year, categories: dreCategories, contracts, financialEntries, adjustments }),
    [adjustments, contracts, dreCategories, financialEntries, year]
  )

  const monthIndex = months.indexOf(closingMonth)
  const safeMonthIndex = monthIndex >= 0 ? monthIndex : 0
  const selectedClosing = closings.find((closing) =>
    Number(closing.year) === Number(year) && Number(closing.month) === monthLabelToNumber(closingMonth)
  )
  const isClosed = Boolean(selectedClosing)
  const closedMonths = closings
    .filter((closing) => Number(closing.year) === Number(year))
    .map((closing) => monthNumberToLabel(closing.month))

  const saldoAnterior = empty
  const saldoOperacao = resultado
  const saldoBanco = empty
  const diferenca = empty
  const lucroOperacional = resultado

  const handleCloseMonth = async () => {
    try {
      const month = monthLabelToNumber(closingMonth)
      const created = await createDreMonthlyClosing({
        year: Number(year),
        month,
        revenue_total: receitaTotal[safeMonthIndex] ?? 0,
        expenses_total: despesasTotal[safeMonthIndex] ?? 0,
        operational_profit: lucroOperacional[safeMonthIndex] ?? 0,
        operational_result: resultado[safeMonthIndex] ?? 0,
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

  const renderValue = (row: DreRow, month: number) => {
    if (row.kind === "percent" && row.percentOf) {
      const value = rows.find((item) => item.label === row.percentOf)?.values?.[month] ?? 0
      const revenue = receitaTotal[month]
      return revenue ? `${((value / revenue) * 100).toFixed(2)}%` : "-"
    }
    const value = row.values?.[month] ?? 0
    return value ? formatCurrency(value) : "-"
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
      rows: rows.length
        ? rows.map((row) => [
            row.label,
            ...months.map((_, index) => renderValue(row, index)),
            row.kind === "percent" ? "" : formatCurrency(sum(row.values)),
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
        { indicador: "Receita do mes", valor: formatCurrency(receitaTotal[safeMonthIndex] ?? 0) },
        { indicador: "Despesas do mes", valor: formatCurrency(despesasTotal[safeMonthIndex] ?? 0) },
        { indicador: "Lucro operacional", valor: formatCurrency(lucroOperacional[safeMonthIndex] ?? 0) },
        { indicador: "Resultado operacional", valor: formatCurrency(resultado[safeMonthIndex] ?? 0) },
        { indicador: "Saldo anterior", valor: formatCurrency(saldoAnterior[safeMonthIndex] ?? 0) },
        { indicador: "Saldo operacao", valor: formatCurrency(saldoOperacao[safeMonthIndex] ?? 0) },
        { indicador: "Saldo banco", valor: formatCurrency(saldoBanco[safeMonthIndex] ?? 0) },
        { indicador: "Diferenca", valor: formatCurrency(diferenca[safeMonthIndex] ?? 0) },
      ],
    }))

  const exportDrePdf = () =>
    exportPdfReport(buildDreReport(
      rows.length
        ? rows.map((row) => ({
            name: row.label,
            jan: renderValue(row, 0),
            fev: renderValue(row, 1),
            mar: renderValue(row, 2),
            total: row.kind === "percent" ? "" : formatCurrency(sum(row.values)),
          }))
        : [{
            name: "Sem dados financeiros para o periodo selecionado.",
            jan: "-",
            fev: "-",
            mar: "-",
            total: formatCurrency(0),
          }]
    ))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">DRE Gerencial</h1>
          <p className="text-muted-foreground">Controle mensal gerencial com dados reais do Supabase.</p>
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
          <Button variant="outline" onClick={() => featureInPreparation("Importação Excel ainda não configurada.")}>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(sum(receitaTotal))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Despesas Operacionais</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(sum(despesasTotal))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Resultado Operacional</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(sum(resultado))}</p>
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
              ["Receita do mes", receitaTotal[safeMonthIndex] ?? 0, "text-emerald-600"],
              ["Despesas do mes", despesasTotal[safeMonthIndex] ?? 0, "text-red-600"],
              ["Lucro operacional", lucroOperacional[safeMonthIndex] ?? 0, ""],
              ["Resultado operacional", resultado[safeMonthIndex] ?? 0, ""],
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
          <CardDescription>Ano selecionado: {year}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!hasRealData ? (
            <div className="p-10 text-center text-muted-foreground">
              Sem dados financeiros para o período selecionado.
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
                  {rows.map((row) => (
                    <tr key={row.label} className={rowClass(row.kind)}>
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
                        {row.kind === "percent" ? "" : formatCurrency(sum(row.values))}
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
              <strong className="text-emerald-600">{formatCurrency(receitaTotal[safeMonthIndex] ?? 0)}</strong>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Despesas operacionais</span>
              <strong className="text-red-600">{formatCurrency(despesasTotal[safeMonthIndex] ?? 0)}</strong>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Resultado operacional</span>
              <strong>{formatCurrency(resultado[safeMonthIndex] ?? 0)}</strong>
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
