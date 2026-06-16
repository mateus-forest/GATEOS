"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  FileText,
  Users,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildDashboardReport } from "@/lib/reports/report-builders"
import { formatCurrency } from "@/lib/utils"
import {
  getBankBalances,
  getContractsSummary,
  getDashboardFinancial,
  getDashboardNotifications,
  getEquipmentSummary,
  getOverdueInstallmentsSummary,
  getProfitDistribution,
} from "@/lib/data/dashboard"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getDreMonthly } from "@/lib/data/dre"
import { getEquipment } from "@/lib/data/equipment"
import { getFinancialEntries } from "@/lib/data/financial"
import { getInstallments } from "@/lib/data/installments"
import { getMaintenanceOrders } from "@/lib/data/maintenance"
import {
  calculateMonthlyRevenueMetrics,
  getContractMonthlyValue,
} from "@/lib/data/recurring-revenue"

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"]

// Computed metrics from the mock data
const monthlyRevenue = 0
const activeContracts = 0
const totalClients = 0
const totalEquipments = 0
const bankBalances = [
  { name: "Saldo Banco ItaÃº CNPJ", amount: 0 },
  { name: "Saldo AplicaÃ§Ã£o", amount: 0 },
  { name: "Saldo Caixa", amount: 0 },
]
const totalBankBalance = bankBalances.reduce((sum, item) => sum + item.amount, 0)
const profitDistribution = {
  revenue: 0,
  costs: 0,
  mateusFixed: 0,
}
const operatingProfit = profitDistribution.revenue - profitDistribution.costs
const distributableResult = Math.max(0, operatingProfit)
const mateusShare = distributableResult * 0.08
const carlosReceivable = distributableResult * 0.65
const renanReceivable = distributableResult * 0.35
const totalDistributed = carlosReceivable + renanReceivable + profitDistribution.mateusFixed + mateusShare
const retainedProfit = distributableResult - totalDistributed

type Row = Record<string, unknown>
type RevenuePoint = { month: string; revenue: number; target: number }
type StatusPoint = { name: string; value: number }
type Activity = { id: string; type: string; title: string; description: string; time: string; status: string }
type Payment = { id: string; client: string; dueDate: string; amount: number; status: string }

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : []
}

function num(row: Row | undefined, keys: string[], fallback = 0) {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value)
  }
  return fallback
}

function text(row: Row | undefined, keys: string[], fallback = "") {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (value !== null && value !== undefined && String(value).trim() !== "") return String(value)
  }
  return fallback
}

function formatActivityTime(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", " Ã s")
}

function isCurrentMonth(value: unknown) {
  if (!value) return false
  const date = new Date(String(value))
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function sumRows(rows: Row[], amountKeys: string[], predicate: (row: Row) => boolean) {
  return rows.filter(predicate).reduce((sum, row) => sum + num(row, amountKeys), 0)
}

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
}: {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: React.ElementType
  description: string
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex min-h-[148px] flex-col justify-between p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight text-foreground">
              {value}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="min-w-0 text-xs leading-5 text-muted-foreground">{description}</p>
          <div
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              changeType === "positive"
                ? "bg-emerald-50 text-emerald-700"
                : changeType === "negative"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {changeType === "positive" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : changeType === "negative" ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : null}
            <span>{change}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case "contract":
        return <FileText className="h-4 w-4" />
      case "payment":
        return <DollarSign className="h-4 w-4" />
      case "maintenance":
        return <Package className="h-4 w-4" />
      case "client":
        return <Users className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (activity.status) {
      case "success":
        return "bg-emerald-100 text-emerald-600"
      case "warning":
        return "bg-amber-100 text-amber-600"
      case "error":
        return "bg-red-100 text-red-600"
      default:
        return "bg-blue-100 text-blue-600"
    }
  }

  return (
    <div className="flex items-start gap-4 py-3">
      <div className={`p-2 rounded-lg ${getStatusColor()}`}>{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
    </div>
  )
}

export function DashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState("")
  const [data, setData] = useState({
    financialSummary: [] as Row[],
    bankBalanceRows: [] as Row[],
    contractSummaryRows: [] as Row[],
    overdueRows: [] as Row[],
    equipmentSummaryRows: [] as Row[],
    profitRows: [] as Row[],
    notifications: [] as Row[],
    clients: [] as Row[],
    contracts: [] as Row[],
    dreRows: [] as Row[],
    equipment: [] as Row[],
    financialEntries: [] as Row[],
    installments: [] as Row[],
    maintenanceOrders: [] as Row[],
  })

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      setLoading(true)
      setDashboardError("")
      try {
        const [
          financialSummary,
          bankBalanceRows,
          contractSummaryRows,
          overdueRows,
          equipmentSummaryRows,
          profitRows,
          notifications,
          clients,
          contracts,
          dreRows,
          equipment,
          financialEntries,
          installments,
          maintenanceOrders,
        ] = await Promise.all([
          getDashboardFinancial(),
          getBankBalances(),
          getContractsSummary(),
          getOverdueInstallmentsSummary(),
          getEquipmentSummary(),
          getProfitDistribution(),
          getDashboardNotifications(),
          getClients(),
          getContracts(),
          getDreMonthly(),
          getEquipment(),
          getFinancialEntries(),
          getInstallments(),
          getMaintenanceOrders(),
        ])

        if (!active) return
        setData({
          financialSummary: asRows(financialSummary),
          bankBalanceRows: asRows(bankBalanceRows),
          contractSummaryRows: asRows(contractSummaryRows),
          overdueRows: asRows(overdueRows),
          equipmentSummaryRows: asRows(equipmentSummaryRows),
          profitRows: asRows(profitRows),
          notifications: asRows(notifications),
          clients: asRows(clients),
          contracts: asRows(contracts),
          dreRows: asRows(dreRows),
          equipment: asRows(equipment),
          financialEntries: asRows(financialEntries),
          installments: asRows(installments),
          maintenanceOrders: asRows(maintenanceOrders),
        })
      } catch (error) {
        if (!active) return
        setDashboardError(error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [])

  const dashboard = useMemo(() => {
    const financial = data.financialSummary[0]
    const equipmentSummary = data.equipmentSummaryRows[0]
    const profit = data.profitRows[0]
    const currentMonthExpensesFromEntries = sumRows(
      data.financialEntries,
      ["amount", "valor", "value"],
      (row) =>
        isCurrentMonth(row.competence_date ?? row.due_date ?? row.date ?? row.created_at) &&
        ["despesa", "expense", "saida"].includes(text(row, ["type", "tipo", "entry_type"]).toLowerCase())
    )
    const currentMonthReceivedRevenue = sumRows(
      data.financialEntries,
      ["amount", "valor", "value"],
      (row) =>
        isCurrentMonth(row.competence_date ?? row.payment_date ?? row.due_date ?? row.date ?? row.created_at) &&
        ["receita", "income", "entrada"].includes(text(row, ["type", "tipo", "entry_type"]).toLowerCase()) &&
        ["recebido", "received", "completed"].includes(text(row, ["status"]).toLowerCase())
    )
    const activeContractsFromTable = data.contracts.filter((row) =>
      ["ativo", "active"].includes(text(row, ["status"]).toLowerCase())
    )
    const revenueMetrics = calculateMonthlyRevenueMetrics(data.contracts, data.financialEntries)
    const activeContractMonthlyValue = activeContractsFromTable.reduce((sum, row) => sum + getContractMonthlyValue(row), 0)
    const overdueAmount = data.overdueRows.length
      ? sumRows(data.overdueRows, ["amount", "valor", "value", "total_amount"], () => true)
      : sumRows(
          data.installments,
          ["updated_value", "original_value", "installment_value", "amount", "valor", "value"],
          (row) => {
            const dueDate = new Date(String(row.due_date ?? row.vencimento ?? ""))
            return Boolean(row.due_date ?? row.vencimento) && dueDate < new Date() && !row.paid_at && !row.payment_date
          }
        )
    const receivableAmount = sumRows(
      data.installments,
      ["updated_value", "original_value", "installment_value", "amount", "valor", "value"],
      (row) => !row.paid_at && !row.payment_date && !["paga", "cancelada"].includes(text(row, ["status"]).toLowerCase())
    )
    const bankBalances = data.bankBalanceRows.map((row, index) => ({
      name: text(row, ["name", "account_name", "bank_name", "description"], `Conta ${index + 1}`),
      amount: num(row, ["balance", "amount", "saldo", "current_balance"]),
    }))
    const revenueData: RevenuePoint[] = data.dreRows.slice(-12).map((row) => ({
      month: text(row, ["month", "reference_month", "competence_month", "mes"], "-"),
      revenue: num(row, ["revenue", "gross_revenue", "receita", "receita_total"]),
      target: num(row, ["target", "meta", "revenue_target"], num(row, ["revenue", "gross_revenue", "receita", "receita_total"])),
    }))
    const statusCounts = new Map<string, number>()
    data.contracts.forEach((row) => {
      const status = text(row, ["status"], "Sem status")
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
    })
    const contractsByStatus: StatusPoint[] = Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value }))
    const recentActivities: Activity[] = data.notifications.slice(0, 6).map((row, index) => ({
      id: text(row, ["id"], String(index)),
      type: text(row, ["type", "tipo"], "notification"),
      title: text(row, ["title", "titulo"], "Notificacao"),
      description: text(row, ["message", "description", "mensagem"], ""),
      time: formatActivityTime(text(row, ["time", "created_at", "createdAt"], "")),
      status: text(row, ["status", "severity"], "info"),
    }))
    const today = new Date()
    const sevenDays = new Date()
    sevenDays.setDate(today.getDate() + 7)
    const upcomingPayments: Payment[] = data.installments
      .filter((row) => {
        const due = new Date(String(row.due_date ?? row.vencimento ?? ""))
        return Boolean(row.due_date ?? row.vencimento) && due >= today && due <= sevenDays && !row.paid_at && !row.payment_date
      })
      .slice(0, 5)
      .map((row, index) => ({
        id: text(row, ["id"], String(index)),
        client: text(row, ["client_name", "cliente", "client"], "Cliente nao informado"),
        dueDate: text(row, ["due_date", "vencimento"], "-"),
        amount: num(row, ["updated_value", "original_value", "installment_value", "amount", "valor", "value"]),
        status: text(row, ["status"], "pending"),
      }))
    const totalBankBalance = bankBalances.reduce((sum, item) => sum + item.amount, 0)
    const monthlyRevenue = currentMonthReceivedRevenue
    const monthlyExpenses = num(financial, ["monthly_expenses", "expenses_month", "expenses", "despesas_mensais"], currentMonthExpensesFromEntries)
    const profitDistribution = {
      revenue: num(profit, ["revenue", "receita"], monthlyRevenue),
      costs: num(profit, ["costs", "expenses", "custos", "despesas"], monthlyExpenses),
      mateusFixed: num(profit, ["mateus_fixed", "mateus_fixo"]),
    }
    const operatingProfit = num(financial, ["monthly_profit", "profit_month", "profit", "lucro_mensal"], profitDistribution.revenue - profitDistribution.costs)
    const distributableResult = Math.max(0, num(profit, ["distributable_result", "resultado_distribuivel"], operatingProfit))
    const mateusShare = num(profit, ["mateus_share", "mateus_participation"], distributableResult * 0.08)
    const carlosReceivable = num(profit, ["carlos_receivable", "carlos_a_receber"], distributableResult * 0.65)
    const renanReceivable = num(profit, ["renan_receivable", "renan_a_receber"], distributableResult * 0.35)
    const totalDistributed = num(
      profit,
      ["total_distributed", "total_distribuido"],
      carlosReceivable + renanReceivable + profitDistribution.mateusFixed + mateusShare
    )

    return {
      monthlyRevenue,
      forecastRevenue: revenueMetrics.contractExpectedRevenue,
      monthlyExpenses,
      monthlyProfit: operatingProfit,
      activeContracts: revenueMetrics.activeContracts.length || num(data.contractSummaryRows[0], ["active_contracts", "ativos"], activeContractsFromTable.length),
      totalClients: data.clients.length,
      totalEquipments: num(equipmentSummary, ["total_equipment", "total", "equipments"], data.equipment.length),
      equipmentInMaintenance: num(
        equipmentSummary,
        ["in_maintenance", "maintenance_equipment", "maintenance", "em_manutencao"],
        data.maintenanceOrders.filter((row) => !["closed", "concluido", "finalizado"].includes(text(row, ["status"]).toLowerCase())).length
      ),
      totalBankBalance,
      bankBalances,
      profitDistribution,
      operatingProfit,
      distributableResult,
      mateusShare,
      carlosReceivable,
      renanReceivable,
      totalDistributed,
      retainedProfit: distributableResult - totalDistributed,
      revenueData,
      contractsByStatus,
      recentActivities,
      upcomingPayments,
      renewalRate: data.contracts.length ? Math.round((activeContractsFromTable.length / data.contracts.length) * 100) : 0,
      averageTicket: revenueMetrics.activeContracts.length
        ? revenueMetrics.mrr / revenueMetrics.activeContracts.length
        : 0,
      mrr: revenueMetrics.mrr || activeContractMonthlyValue,
      arr: revenueMetrics.arr || activeContractMonthlyValue * 12,
      delinquencyRate: receivableAmount > 0 ? Math.min(100, (overdueAmount / receivableAmount) * 100) : 0,
      receivableAmount,
      payableAmount: sumRows(
        data.financialEntries,
        ["amount", "valor", "value"],
        (row) => ["despesa", "expense", "saida"].includes(text(row, ["type", "tipo", "entry_type"]).toLowerCase()) && !row.paid_at && !row.payment_date
      ),
      expiringContracts: data.contracts.filter((row) => {
        const endDate = new Date(String(row.end_date ?? row.data_fim ?? ""))
        const limit = new Date()
        limit.setDate(limit.getDate() + 30)
        return Boolean(row.end_date ?? row.data_fim) && endDate >= new Date() && endDate <= limit
      }).length,
    }
  }, [data])

  const {
    monthlyRevenue,
    forecastRevenue,
    monthlyExpenses,
    monthlyProfit,
    activeContracts,
    totalClients,
    totalEquipments,
    equipmentInMaintenance,
    totalBankBalance,
    bankBalances,
    profitDistribution,
    operatingProfit,
    distributableResult,
    mateusShare,
    carlosReceivable,
    renanReceivable,
    totalDistributed,
    retainedProfit,
    revenueData,
    contractsByStatus,
    recentActivities,
    upcomingPayments,
    renewalRate,
    averageTicket,
    delinquencyRate,
    receivableAmount,
    payableAmount,
    expiringContracts,
    mrr,
    arr,
  } = dashboard

  const handleExportReport = () => {
    exportPdfReport(buildDashboardReport([
      { indicador: "Receita Mensal", valor: dashboard.monthlyRevenue },
      { indicador: "Contratos Ativos", valor: dashboard.activeContracts },
      { indicador: "Clientes", valor: dashboard.totalClients },
      { indicador: "Equipamentos", valor: dashboard.totalEquipments },
      { indicador: "Saldo total consolidado", valor: dashboard.totalBankBalance },
      { indicador: "Lucro operacional", valor: dashboard.operatingProfit },
      { indicador: "Resultado distribuivel", valor: dashboard.distributableResult },
      { indicador: "Total distribuido", valor: dashboard.totalDistributed },
      { indicador: "Lucro retido", valor: dashboard.retainedProfit },
    ]))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">VisÃ£o geral do sistema GATE OS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportReport}>
            Exportar RelatÃ³rio
          </Button>
        </div>
      </div>

      {dashboardError && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{dashboardError}</CardContent>
        </Card>
      )}

      {/* Alerts */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {loading ? "Carregando contratos..." : `${expiringContracts} contratos vencem nos proximos 30 dias`}
              </p>
              <p className="text-xs text-amber-600">
                Revise os contratos e inicie o processo de renovaÃ§Ã£o
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => router.push("/contratos")}>
              Ver contratos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Receita Realizada Mensal"
          value={formatCurrency(monthlyRevenue)}
          change={formatCurrency(monthlyProfit)}
          changeType={monthlyProfit >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          description="recebida no mes"
        />
        <MetricCard
          title="Contratos Ativos"
          value={activeContracts.toString()}
          change={loading ? "..." : "real"}
          changeType="neutral"
          icon={FileText}
          description="base Supabase"
        />
        <MetricCard
          title="Clientes"
          value={totalClients.toString()}
          change={loading ? "..." : "real"}
          changeType="neutral"
          icon={Users}
          description="base Supabase"
        />
        <MetricCard
          title="Equipamentos"
          value={totalEquipments.toString()}
          change={equipmentInMaintenance.toString()}
          changeType={equipmentInMaintenance > 0 ? "negative" : "neutral"}
          icon={Package}
          description="em manutenÃ§Ã£o"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financeiro operacional</CardTitle>
          <CardDescription>Indicadores derivados de views e tabelas financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {[
              ["Receita prevista", formatCurrency(forecastRevenue)],
              ["Despesas mensais", formatCurrency(monthlyExpenses)],
              ["Contas a receber", formatCurrency(receivableAmount)],
              ["Contas a pagar", formatCurrency(payableAmount)],
              ["MRR", formatCurrency(mrr)],
              ["ARR", formatCurrency(arr)],
              ["Inadimplencia", `${delinquencyRate.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Saldo BancÃ¡rio
            </CardTitle>
            <CardDescription>PosiÃ§Ã£o consolidada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankBalances.length > 0 ? (
              bankBalances.map((balance) => (
                <div key={balance.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">{balance.name}</span>
                  <span className="font-semibold">{formatCurrency(balance.amount)}</span>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Nenhum saldo bancario retornado por v_bank_balances.
              </p>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">Saldo total consolidado</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalBankBalance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>DistribuiÃ§Ã£o de Lucros</CardTitle>
            <CardDescription>SimulaÃ§Ã£o do resultado distribuÃ­vel do mÃªs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Receita do mÃªs", profitDistribution.revenue],
                ["Custos/despesas", profitDistribution.costs],
                ["Lucro operacional", operatingProfit],
                ["Resultado distribuÃ­vel", distributableResult],
                ["Carlos a receber", carlosReceivable],
                ["Renan a receber", renanReceivable],
                ["Mateus fixo", profitDistribution.mateusFixed],
                ["Mateus participaÃ§Ã£o 8%", mateusShare],
                ["Total distribuÃ­do", totalDistributed],
                ["Lucro retido", retainedProfit],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`font-semibold ${Number(value) < 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>EvoluÃ§Ã£o da Receita</CardTitle>
                <CardDescription>Receita mensal dos Ãºltimos 12 meses</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Meta</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22B8CF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22B8CF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22B8CF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Line type="monotone" dataKey="target" stroke="#22C55E" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                  Nenhuma linha retornada por v_dre_monthly.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contracts by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Contratos por Status</CardTitle>
            <CardDescription>DistribuiÃ§Ã£o atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {contractsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                  <Pie
                    data={contractsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {contractsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                  Nenhum contrato retornado para distribuir por status.
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {contractsByStatus.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Ãšltimas atualizaÃ§Ãµes do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="py-4 text-sm text-muted-foreground">Nenhuma atividade recente encontrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PrÃ³ximos Pagamentos</CardTitle>
                <CardDescription>Vencimentos dos prÃ³ximos 7 dias</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/financeiro")}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.length > 0 ? (
                upcomingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {payment.client.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{payment.client}</p>
                      <p className="text-xs text-muted-foreground">Vence em {payment.dueDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(payment.amount)}</p>
                    <Badge
                      variant={payment.status === "pending" ? "secondary" : "default"}
                      className={payment.status === "overdue" ? "bg-destructive" : ""}
                    >
                      {payment.status === "pending" ? "Pendente" : "Atrasado"}
                    </Badge>
                  </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  Nenhuma parcela vencendo nos proximos 7 dias.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Taxa de RenovaÃ§Ã£o</h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Base real</Badge>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{renewalRate}%</span>
              <span className="text-emerald-600 text-sm mb-1">{activeContracts} ativos</span>
            </div>
            <Progress value={renewalRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Ticket MÃ©dio</h3>
              <Badge variant="secondary">Mensal</Badge>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{formatCurrency(averageTicket)}</span>
              <span className="text-emerald-600 text-sm mb-1">{activeContracts} contratos</span>
            </div>
            <p className="text-xs text-muted-foreground">Baseado nos contratos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">InadimplÃªncia</h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">AtenÃ§Ã£o</Badge>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{delinquencyRate.toFixed(1)}%</span>
              <span className="text-destructive text-sm mb-1">{formatCurrency(receivableAmount)}</span>
            </div>
            <Progress value={delinquencyRate} max={100} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
