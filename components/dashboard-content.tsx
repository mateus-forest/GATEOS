"use client"

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
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Scale,
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
import { revenueData, contractsByStatus, recentActivities, upcomingPayments } from "@/lib/mock-data"
import { exportCsv, featureInPreparation } from "@/lib/cta-actions"
import { formatCurrency } from "@/lib/utils"

const COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"]

// Computed metrics from the mock data
const monthlyRevenue = 0
const activeContracts = 0
const totalClients = 0
const totalEquipments = 0
const activeLegalCases = 0
const legalCollectionValue = 0
const brokenAgreements = 0
const agreementsDue = 0
const legalContracts = activeLegalCases
const bankBalances = [
  { name: "Saldo Banco Itaú CNPJ", amount: 0 },
  { name: "Saldo Aplicação", amount: 0 },
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center gap-1 text-sm ${
                changeType === "positive"
                  ? "text-emerald-600"
                  : changeType === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {changeType === "positive" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : changeType === "negative" ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : null}
              {change}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: typeof recentActivities[0] }) {
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

  const handleExportReport = () => {
    exportCsv("gate-dashboard.csv", [
      { indicador: "Receita Mensal", valor: monthlyRevenue },
      { indicador: "Contratos Ativos", valor: activeContracts },
      { indicador: "Clientes", valor: totalClients },
      { indicador: "Equipamentos", valor: totalEquipments },
      { indicador: "Saldo total consolidado", valor: totalBankBalance },
      { indicador: "Lucro operacional", valor: operatingProfit },
      { indicador: "Resultado distribuivel", valor: distributableResult },
      { indicador: "Total distribuido", valor: totalDistributed },
      { indicador: "Lucro retido", valor: retainedProfit },
    ])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema GATE OS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => featureInPreparation("Filtro de ultimo mes depende da consulta real por periodo no dashboard.")}>
            <Calendar className="mr-2 h-4 w-4" />
            Último mês
          </Button>
          <Button onClick={handleExportReport}>
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                0 contratos vencem nos próximos 30 dias
              </p>
              <p className="text-xs text-amber-600">
                Revise os contratos e inicie o processo de renovação
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => router.push("/contratos")}>
              Ver contratos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5 text-primary" />
            Jurídico
          </CardTitle>
          <CardDescription>Resumo compacto de cobranças e acordos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {[
              ["Casos jurídicos ativos", activeLegalCases],
              ["Valor em cobrança jurídica", formatCurrency(legalCollectionValue)],
              ["Acordos vencendo", agreementsDue],
              ["Acordos quebrados", brokenAgreements],
              ["Contratos em jurídico", legalContracts],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Mensal"
          value={formatCurrency(monthlyRevenue)}
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          description="vs. mês anterior"
        />
        <MetricCard
          title="Contratos Ativos"
          value={activeContracts.toString()}
          change="+8"
          changeType="positive"
          icon={FileText}
          description="novos este mês"
        />
        <MetricCard
          title="Clientes"
          value={totalClients.toString()}
          change="+3"
          changeType="positive"
          icon={Users}
          description="novos este mês"
        />
        <MetricCard
          title="Equipamentos"
          value={totalEquipments.toString()}
          change="-2%"
          changeType="negative"
          icon={Package}
          description="em manutenção"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Saldo Bancário
            </CardTitle>
            <CardDescription>Posição consolidada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankBalances.map((balance) => (
              <div key={balance.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground">{balance.name}</span>
                <span className="font-semibold">{formatCurrency(balance.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="font-medium">Saldo total consolidado</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalBankBalance)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de Lucros</CardTitle>
            <CardDescription>Simulação do resultado distribuível do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["Receita do mês", profitDistribution.revenue],
                ["Custos/despesas", profitDistribution.costs],
                ["Lucro operacional", operatingProfit],
                ["Resultado distribuível", distributableResult],
                ["Carlos a receber", carlosReceivable],
                ["Renan a receber", renanReceivable],
                ["Mateus fixo", profitDistribution.mateusFixed],
                ["Mateus participação 8%", mateusShare],
                ["Total distribuído", totalDistributed],
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
                <CardTitle>Evolução da Receita</CardTitle>
                <CardDescription>Receita mensal dos últimos 12 meses</CardDescription>
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
              <ResponsiveContainer width="100%" height="100%">
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
            </div>
          </CardContent>
        </Card>

        {/* Contracts by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Contratos por Status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Últimas atualizações do sistema</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/relatorios")}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Próximos Pagamentos</CardTitle>
                <CardDescription>Vencimentos dos próximos 7 dias</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/parcelas")}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((payment) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Taxa de Renovação</h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Excelente</Badge>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">92%</span>
              <span className="text-emerald-600 text-sm mb-1">+5% vs. ano passado</span>
            </div>
            <Progress value={92} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Ticket Médio</h3>
              <Badge variant="secondary">Mensal</Badge>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">{formatCurrency(8450)}</span>
              <span className="text-emerald-600 text-sm mb-1">+8.2%</span>
            </div>
            <p className="text-xs text-muted-foreground">Baseado nos contratos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Inadimplência</h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">Atenção</Badge>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold">3.2%</span>
              <span className="text-destructive text-sm mb-1">+0.8% vs. mês anterior</span>
            </div>
            <Progress value={3.2} max={10} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
