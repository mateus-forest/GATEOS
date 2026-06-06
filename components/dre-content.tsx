"use client"

import { useMemo, useState } from "react"
import { CalendarCheck2, Download, FileSpreadsheet, History, Lock, RotateCcw } from "lucide-react"
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
import {
  getDreRowLabel,
  getDreSignedAmount,
  getMonthIndexFromCompetence,
  useDreLaunches,
  type DreLaunch,
} from "@/lib/dre-store"
import { exportCsv, exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildDreReport } from "@/lib/reports/report-builders"
import { formatCurrency } from "@/lib/utils"

const months = ["jan-26", "fev-26", "mar-26", "abr-26", "mai-26", "jun-26", "jul-26", "ago-26", "set-26", "out-26", "nov-26", "dez-26"]

type RowKind = "section" | "normal" | "total" | "highlight" | "percent" | "spacer"

type DreRow = {
  label: string
  kind?: RowKind
  values?: number[]
  percentOf?: string
}

type ManualAdjustment = {
  id: string
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

const empty = Array(12).fill(0)
const v = (...values: number[]) => [...values, ...Array(12 - values.length).fill(0)]

const baseRows: DreRow[] = [
  { label: "RECEITAS 2026", kind: "section" },
  { label: "Fribal", values: v(8903.88, 8903.88, 8903.88, 8903.88, 8903.88) },
  { label: "Estacio Itapipoca", values: v(0, 1900, 0, 0, 1500) },
  { label: "Fortaleza Iguatemi", values: v(3599, 3599, 3599, 3599) },
  { label: "Rio de Janeiro", values: v(4158.14, 4158.14, 4158.14, 4158.14, 2000) },
  { label: "Intech", values: v(1913.65, 1913.65, 1913.65, 0, 1913.65) },
  { label: "Paulinia Nova", values: v(2421.67, 2421.67, 2887.85, 2619.79, 2850) },
  { label: "Curitiba", values: v(5772.28, 5772.28, 5772.28, 5772.28, 5772.28) },
  { label: "SG Itapipoca", values: v(3900, 3850, 0, 4141.01, 4177.98) },
  { label: "SG Atibaia", values: v(3506.16, 3506.16, 3506.16, 3506.16, 3506.16) },
  { label: "Venda de produto", values: v(3250, 5883.77, 2547, 0, 38990) },
  { label: "Rendimento aplicacao", values: v(0.43, 1.47) },
  { label: "Outras receitas", values: empty },
  { label: "RECEITA TOTAL", kind: "total" },
  { label: "CUSTO DO PRODUTO VENDIDO (CPV)", kind: "highlight", values: empty },
  { label: "CPV", values: empty },
  { label: "Compra de equipamentos", values: empty },
  { label: "Fretes", values: empty },
  { label: "Manutencao vinculada a venda", values: empty },
  { label: "RECEITA LIQUIDA TOTAL", kind: "total" },
  { label: "", kind: "spacer" },
  { label: "DESPESAS COM PESSOAL", kind: "section" },
  { label: "Salarios", values: v(6100, 4000, 4000, 4000, 4000) },
  { label: "Ferias", values: empty },
  { label: "Fgts", values: empty },
  { label: "Inss", values: empty },
  { label: "Freelancer", values: empty },
  { label: "Alimentacao", values: empty },
  { label: "Ajuda de Custo", values: empty },
  { label: "Vale transporte", values: empty },
  { label: "Rescisao", values: empty },
  { label: "13 Salario", values: empty },
  { label: "Outros Custos com Socios", values: empty },
  { label: "Premiacoes e Comissoes", values: v(0, 0, 2300, 0, 2959.2) },
  { label: "TOTAL DESPESAS COM PESSOAL", kind: "total" },
  { label: "% Despesas s/Receita", kind: "percent", percentOf: "TOTAL DESPESAS COM PESSOAL" },
  { label: "DESPESAS OPERACIONAIS", kind: "section" },
  { label: "Aluguel", values: v(0, 0, 579) },
  { label: "Condominio", values: v(0, 0, 0, 388.44) },
  { label: "Contabilidade", values: v(706, 706, 706, 706, 706) },
  { label: "Energia Eletrica", values: empty },
  { label: "Serv. de Terceiros", values: empty },
  { label: "Sistema", values: v(626.07, 1337.23, 1831.62, 1079.07, 1187.07) },
  { label: "Mat. Limpeza e Higiene", values: empty },
  { label: "Mat. Escritorio/grafico", values: empty },
  { label: "Taxas - outras", values: v(200, 200, 200, 200, 200) },
  { label: "Propagandas e Marketing", values: empty },
  { label: "Material de Manutencao e Reparos", values: v(0, 695.25, 577.25, 367.25) },
  { label: "Internet/ip", values: empty },
  { label: "Materiais Diversos (embalagens)", values: empty },
  { label: "Prestacao de servicos", values: v(1621, 1518, 0, 3036, 1518) },
  { label: "Viagens", values: v(289.64, 289.64) },
  { label: "Imposto", values: v(10.99, 10.99, 683.88) },
  { label: "Simples Nacional", values: empty },
  { label: "TOTAL DESPESAS GERAIS", kind: "total" },
  { label: "% Despesas s/Receita", kind: "percent", percentOf: "TOTAL DESPESAS GERAIS" },
  { label: "Tarifa Bancaria", values: v(381.79, 990.67, 1324.47, 510, 365) },
  { label: "Juros e Emprestimos", values: v(2226.79, 2226.79, 2226.79, 2226.79, 2226.79) },
  { label: "Total de despesas financeiras", kind: "total" },
  { label: "% Despesas s/Receita", kind: "percent", percentOf: "Total de despesas financeiras" },
  { label: "Total de Despesas Operacionais", kind: "highlight" },
  { label: "% Despesas s/Receita", kind: "percent", percentOf: "Total de Despesas Operacionais" },
  { label: "LUCRO OPERACIONAL", kind: "total" },
  { label: "Lucro operacional %", kind: "percent", percentOf: "LUCRO OPERACIONAL" },
  { label: "OUTRAS DESPESAS NAO OPERACIONAIS", kind: "section" },
  { label: "Investimento Imobilizado Gamer Tech", values: v(10030.53, 6584.32, 5599.08, 1872.45, 1849.47) },
  { label: "Outros Custos Investimentos (Fretes, Outros)", values: v(0, 0, 97) },
  { label: "Participacao Resultado", values: v(1755.87, 2021.03, 2394.84, 1508.72, 1614.94, 4516.15) },
  { label: "Distribuicao Lucros - Socios", values: v(10000, 10000, 11428.57, 11428.57, 32000) },
  { label: "Devolucao de Emprestimos", values: v(5555.56, 5555.56, 5555.56, 5555.56, 5555.56) },
  { label: "Total de despesas nao operacionais", kind: "highlight" },
  { label: "RESULTADO OPERACIONAL", kind: "total" },
  { label: "", kind: "spacer" },
  { label: "Aporte Carlos Forest", values: empty },
  { label: "Aporte Renan Linhares", values: empty },
  { label: "Aporte Mateus", values: empty },
  { label: "TOTAL APORTES TERCEIROS", kind: "section" },
  { label: "SALDO ANTERIOR", values: v(11590.96, 9511.93, 15287.46, 9070.44, 8891.21, 23503.29) },
  { label: "SALDO OPERACAO -(RO+SALDO ANT)", kind: "total" },
  { label: "SALDO BANCO", values: v(9511.93, 15287.46, 9070.44, 8891.21, 23503.29) },
  { label: "DIFERENCA", kind: "highlight", values: v(0, 0.99, 0.92, 0.64, 819.84, 18987.14) },
]

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const addRows = (labels: string[], rows: Map<string, number[]>) =>
  labels.reduce((acc, label) => acc.map((value, index) => value + (rows.get(label)?.[index] ?? 0)), Array(12).fill(0))
const subtractRows = (a: number[], b: number[]) => a.map((value, index) => value - b[index])

const derivedRows = new Set([
  "RECEITA TOTAL",
  "RECEITA LIQUIDA TOTAL",
  "TOTAL DESPESAS COM PESSOAL",
  "TOTAL DESPESAS GERAIS",
  "Total de despesas financeiras",
  "Total de Despesas Operacionais",
  "LUCRO OPERACIONAL",
  "Total de despesas nao operacionais",
  "RESULTADO OPERACIONAL",
  "TOTAL APORTES TERCEIROS",
  "SALDO OPERACAO -(RO+SALDO ANT)",
])

function useDreRows(launches: DreLaunch[], adjustments: ManualAdjustment[]) {
  return useMemo(() => {
    const rows = new Map<string, number[]>()
    baseRows.forEach((row) => {
      if (row.values) rows.set(row.label, row.values)
    })

    launches.forEach((launch) => {
      const monthIndex = getMonthIndexFromCompetence(launch.competenceDate)
      const rowLabel = getDreRowLabel(launch.dreCategory, launch.type)
      if (monthIndex < 0 || monthIndex > 11 || !rows.has(rowLabel)) return
      const current = [...(rows.get(rowLabel) ?? empty)]
      current[monthIndex] += getDreSignedAmount(launch)
      rows.set(rowLabel, current)
    })

    adjustments
      .filter((adjustment) => !derivedRows.has(adjustment.category))
      .forEach((adjustment) => {
        const current = [...(rows.get(adjustment.category) ?? empty)]
        current[adjustment.monthIndex] = adjustment.newValue
        rows.set(adjustment.category, current)
      })

    const receitaTotal = addRows(
      ["Fribal", "Estacio Itapipoca", "Fortaleza Iguatemi", "Rio de Janeiro", "Intech", "Paulinia Nova", "Curitiba", "SG Itapipoca", "SG Atibaia", "Venda de produto", "Rendimento aplicacao", "Outras receitas"],
      rows
    )
    rows.set("RECEITA TOTAL", receitaTotal)
    const cpvTotal = addRows(["CPV", "Compra de equipamentos", "Fretes", "Manutencao vinculada a venda"], rows)
    rows.set("CUSTO DO PRODUTO VENDIDO (CPV)", cpvTotal)
    rows.set("RECEITA LIQUIDA TOTAL", subtractRows(receitaTotal, cpvTotal))
    rows.set("TOTAL DESPESAS COM PESSOAL", addRows(["Salarios", "Ferias", "Fgts", "Inss", "Freelancer", "Alimentacao", "Ajuda de Custo", "Vale transporte", "Rescisao", "13 Salario", "Outros Custos com Socios", "Premiacoes e Comissoes"], rows))
    rows.set("TOTAL DESPESAS GERAIS", addRows(["Aluguel", "Condominio", "Contabilidade", "Energia Eletrica", "Serv. de Terceiros", "Sistema", "Mat. Limpeza e Higiene", "Mat. Escritorio/grafico", "Taxas - outras", "Propagandas e Marketing", "Material de Manutencao e Reparos", "Internet/ip", "Materiais Diversos (embalagens)", "Prestacao de servicos", "Viagens", "Imposto", "Simples Nacional"], rows))
    rows.set("Total de despesas financeiras", addRows(["Tarifa Bancaria", "Juros e Emprestimos"], rows))
    rows.set("Total de Despesas Operacionais", addRows(["TOTAL DESPESAS COM PESSOAL", "TOTAL DESPESAS GERAIS", "Total de despesas financeiras"], rows))
    rows.set("LUCRO OPERACIONAL", subtractRows(receitaTotal, rows.get("Total de Despesas Operacionais") ?? empty))
    rows.set("Total de despesas nao operacionais", addRows(["Investimento Imobilizado Gamer Tech", "Outros Custos Investimentos (Fretes, Outros)", "Participacao Resultado", "Distribuicao Lucros - Socios", "Devolucao de Emprestimos"], rows))
    rows.set("RESULTADO OPERACIONAL", subtractRows(rows.get("LUCRO OPERACIONAL") ?? empty, rows.get("Total de despesas nao operacionais") ?? empty))
    rows.set("TOTAL APORTES TERCEIROS", addRows(["Aporte Carlos Forest", "Aporte Renan Linhares", "Aporte Mateus"], rows))
    rows.set("SALDO OPERACAO -(RO+SALDO ANT)", addRows(["RESULTADO OPERACIONAL", "SALDO ANTERIOR"], rows))

    adjustments.forEach((adjustment) => {
      const current = [...(rows.get(adjustment.category) ?? empty)]
      current[adjustment.monthIndex] = adjustment.newValue
      rows.set(adjustment.category, current)
    })

    return baseRows.map((row) => ({ ...row, values: rows.get(row.label) ?? row.values ?? empty }))
  }, [launches, adjustments])
}

function rowClass(kind: RowKind = "normal") {
  if (kind === "section") return "bg-slate-100 font-bold text-slate-900"
  if (kind === "total") return "bg-emerald-100 font-bold"
  if (kind === "highlight") return "bg-yellow-100 font-bold"
  if (kind === "percent") return "bg-muted/40 text-xs italic"
  if (kind === "spacer") return "h-4 bg-background"
  return "bg-background"
}

export function DREContent() {
  const [year, setYear] = useState("2026")
  const [closingMonth, setClosingMonth] = useState("mai-26")
  const [closedMonths, setClosedMonths] = useState<string[]>(["jan-26", "fev-26"])
  const [closeOpen, setCloseOpen] = useState(false)
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([])
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [closedEditTarget, setClosedEditTarget] = useState<EditTarget | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [reason, setReason] = useState("")
  const [responsible, setResponsible] = useState("Carlos Silva")
  const launches = useDreLaunches()
  const rows = useDreRows(launches, adjustments)

  const receitaTotal = rows.find((row) => row.label === "RECEITA TOTAL")?.values ?? empty
  const despesasOperacionais = rows.find((row) => row.label === "Total de Despesas Operacionais")?.values ?? empty
  const resultado = rows.find((row) => row.label === "RESULTADO OPERACIONAL")?.values ?? empty
  const monthIndex = months.indexOf(closingMonth)
  const isClosed = closedMonths.includes(closingMonth)

  const handleCloseMonth = () => {
    if (!closedMonths.includes(closingMonth)) {
      setClosedMonths((current) => [...current, closingMonth])
    }
    setCloseOpen(false)
    toast.info(`Fechamento de ${closingMonth} marcado localmente. Nenhuma rotina externa foi executada.`)
  }

  const handleReopenMonth = () => {
    setClosedMonths((current) => current.filter((month) => month !== closingMonth))
    toast.info(`${closingMonth} reaberto localmente para revisao.`)
  }

  const saldoAnterior = rows.find((row) => row.label === "SALDO ANTERIOR")?.values ?? empty
  const saldoOperacao = rows.find((row) => row.label === "SALDO OPERACAO -(RO+SALDO ANT)")?.values ?? empty
  const saldoBanco = rows.find((row) => row.label === "SALDO BANCO")?.values ?? empty
  const diferenca = rows.find((row) => row.label === "DIFERENCA")?.values ?? empty
  const lucroOperacional = rows.find((row) => row.label === "LUCRO OPERACIONAL")?.values ?? empty

  const openManualEdit = (target: EditTarget) => {
    if (closedMonths.includes(target.month)) {
      setClosedEditTarget(target)
      return
    }

    setEditTarget(target)
    setNewValue(String(target.currentValue))
    setReason("")
    setResponsible("Carlos Silva")
  }

  const handleApplyAdjustment = () => {
    if (!editTarget) return
    const parsedValue = Number(newValue.replace(",", "."))
    if (Number.isNaN(parsedValue)) {
      toast.error("Informe um novo valor valido")
      return
    }

    setAdjustments((current) => [
      {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString("pt-BR"),
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
    toast.success("Ajuste manual aplicado ao DRE")
  }

  const handleReopenForEdit = () => {
    if (!closedEditTarget) return
    setClosedMonths((current) => current.filter((month) => month !== closedEditTarget.month))
    const target = closedEditTarget
    setClosedEditTarget(null)
    openManualEdit(target)
    toast.info(`${target.month} reaberto localmente para ajuste.`)
  }

  const exportDreRows = (filename: string) =>
    exportCsv(
      filename,
      rows
        .filter((row) => row.kind !== "spacer")
        .map((row) => ({
          conta: row.label,
          ...Object.fromEntries(months.map((month, index) => [month, renderValue(row, index)])),
          total: row.kind === "percent" || row.kind === "section" ? "" : sum(row.values ?? empty),
        }))
    )

  const exportClosingRows = () =>
    exportCsv("gate-dre-fechamento.csv", [
      { indicador: "Mes", valor: closingMonth },
      { indicador: "Status", valor: isClosed ? "Fechado" : "Em conferencia" },
      { indicador: "Receita do mes", valor: receitaTotal[monthIndex] },
      { indicador: "Despesas do mes", valor: despesasOperacionais[monthIndex] },
      { indicador: "Lucro operacional", valor: lucroOperacional[monthIndex] },
      { indicador: "Resultado operacional", valor: resultado[monthIndex] },
      { indicador: "Saldo anterior", valor: saldoAnterior[monthIndex] },
      { indicador: "Saldo operacao", valor: saldoOperacao[monthIndex] },
      { indicador: "Saldo banco", valor: saldoBanco[monthIndex] },
      { indicador: "Diferenca", valor: diferenca[monthIndex] },
    ])

  const exportDrePdf = () =>
    exportPdfReport(buildDreReport(
      rows
        .filter((row) => row.kind !== "spacer")
        .map((row) => ({
          name: row.label,
          jan: renderValue(row, 0),
          fev: renderValue(row, 1),
          mar: renderValue(row, 2),
          total: row.kind === "percent" || row.kind === "section" ? "" : formatCurrency(sum(row.values ?? empty)),
        }))
    ))

  const renderValue = (row: DreRow, month: number) => {
    if (row.kind === "spacer") return ""
    if (row.kind === "section" && !sum(row.values ?? empty)) return ""
    if (row.kind === "percent" && row.percentOf) {
      const value = rows.find((item) => item.label === row.percentOf)?.values?.[month] ?? 0
      const revenue = receitaTotal[month]
      return revenue ? `${((value / revenue) * 100).toFixed(2)}%` : "-"
    }
    const value = row.values?.[month] ?? 0
    return value ? formatCurrency(value) : "-"
  }

  const isEditableRow = (row: DreRow) =>
    row.kind !== "section" && row.kind !== "percent" && row.kind !== "spacer"

  const hasAdjustment = (row: DreRow, monthIndex: number) =>
    adjustments.some((adjustment) => adjustment.category === row.label && adjustment.monthIndex === monthIndex)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">DRE Gerencial</h1>
          <p className="text-muted-foreground">Controle mensal Gamer Tech em formato gerencial.</p>
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
          <Button variant="outline" onClick={() => featureInPreparation("Importacao de planilha ainda depende do fluxo real de leitura e validacao dos dados.")}>
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
            <p className="text-2xl font-bold text-red-600">{formatCurrency(sum(despesasOperacionais))}</p>
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
              <CardDescription>Bloqueio mockado do mes apos conferencia dos saldos.</CardDescription>
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
              <Button variant="outline" onClick={() => featureInPreparation("Analise de divergencias ainda depende da comparacao real entre banco, saldo e aportes.")}>
                Ver divergencias
              </Button>
              <Button variant="outline" onClick={exportClosingRows}>
                Exportar fechamento
              </Button>
              {isClosed ? (
                <Button variant="outline" onClick={handleReopenMonth}>
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
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Receita do mes</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(receitaTotal[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Despesas do mes</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(despesasOperacionais[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Lucro operacional</p>
              <p className="text-xl font-bold">{formatCurrency(lucroOperacional[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Resultado operacional</p>
              <p className="text-xl font-bold">{formatCurrency(resultado[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Saldo anterior</p>
              <p className="text-xl font-bold">{formatCurrency(saldoAnterior[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Saldo operacao</p>
              <p className="text-xl font-bold">{formatCurrency(saldoOperacao[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Saldo banco</p>
              <p className="text-xl font-bold">{formatCurrency(saldoBanco[monthIndex])}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Diferenca</p>
              <p className="text-xl font-bold">{formatCurrency(diferenca[monthIndex])}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DRE Gerencial - Gamer Tech</CardTitle>
          <CardDescription>Ano selecionado: {year}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1420px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-200">
                  <th className="sticky left-0 z-20 border px-3 py-2 text-left bg-slate-200">Conta</th>
                  {months.map((month) => (
                    <th key={month} className="border px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-1">
                        {closedMonths.includes(month) && <CalendarCheck2 className="h-3 w-3 text-emerald-600" />}
                        {month}
                      </span>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 border px-3 py-2 text-right bg-slate-200">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.label}-${index}`} className={rowClass(row.kind)}>
                    <td className={`sticky left-0 z-10 border px-3 py-1.5 ${rowClass(row.kind)}`}>{row.label}</td>
                    {months.map((month, monthIndex) => (
                      <td
                        key={`${row.label}-${month}`}
                        className={`relative border px-3 py-1.5 text-right ${closedMonths.includes(month) ? "bg-emerald-50/60" : ""}`}
                      >
                        {isEditableRow(row) ? (
                          <button
                            type="button"
                            className="relative w-full text-right"
                            onClick={() =>
                              openManualEdit({
                                row,
                                month,
                                monthIndex,
                                currentValue: row.values?.[monthIndex] ?? 0,
                              })
                            }
                          >
                            {renderValue(row, monthIndex)}
                            {hasAdjustment(row, monthIndex) && (
                              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </button>
                        ) : (
                          renderValue(row, monthIndex)
                        )}
                      </td>
                    ))}
                    <td className={`sticky right-0 z-10 border px-3 py-1.5 text-right ${rowClass(row.kind)}`}>
                      {row.kind === "percent" || row.kind === "section" || row.kind === "spacer" ? "" : formatCurrency(sum(row.values ?? empty))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar {closingMonth}</DialogTitle>
            <DialogDescription>Confira o resumo antes de bloquear o mes para edicao.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex justify-between rounded-lg border p-3">
              <span>Receita</span>
              <strong className="text-emerald-600">{formatCurrency(receitaTotal[monthIndex])}</strong>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Despesas operacionais</span>
              <strong className="text-red-600">{formatCurrency(despesasOperacionais[monthIndex])}</strong>
            </div>
            <div className="flex justify-between rounded-lg border p-3">
              <span>Resultado operacional</span>
              <strong>{formatCurrency(resultado[monthIndex])}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancelar</Button>
            <Button onClick={handleCloseMonth}>Confirmar fechamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste manual do DRE</DialogTitle>
            <DialogDescription>Correção manual aplicada somente ao valor visual/mockado da DRE.</DialogDescription>
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
              <div className="grid gap-2">
                <Label>Data do ajuste</Label>
                <Input value={new Date().toLocaleDateString("pt-BR")} readOnly />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleApplyAdjustment}>Salvar ajuste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!closedEditTarget} onOpenChange={(open) => !open && setClosedEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mes fechado</DialogTitle>
            <DialogDescription>Este mes esta fechado. Deseja reabrir para ajustar?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosedEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleReopenForEdit}>Reabrir para ajustar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ajustes manuais</DialogTitle>
            <DialogDescription>Histórico mockado dos ajustes aplicados na DRE.</DialogDescription>
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
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      Nenhum ajuste manual registrado.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="border-t">
                      <td className="px-3 py-2">{adjustment.date}</td>
                      <td className="px-3 py-2">{adjustment.category}</td>
                      <td className="px-3 py-2">{adjustment.month}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(adjustment.previousValue)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(adjustment.newValue)}</td>
                      <td className="px-3 py-2">{adjustment.reason || "-"}</td>
                      <td className="px-3 py-2">{adjustment.responsible}</td>
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
