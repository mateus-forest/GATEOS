"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, PieChart, Target } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getEquipment } from "@/lib/data/equipment"
import { getFinancialEntries } from "@/lib/data/financial"
import { getInstallments } from "@/lib/data/installments"
import { getMaintenanceOrders } from "@/lib/data/maintenance"
import { calculateMonthlyExpense, calculateMonthlyRevenueMetrics, getEntryAmount, getEntryMonthKey, isExpenseEntry, isIncomeEntry } from "@/lib/data/recurring-revenue"
import { formatCurrency } from "@/lib/utils"
import type { SupabaseRow } from "@/lib/supabase/types"

const COLORS = ["#22B8CF", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444"]

type ChartPoint = { month: string; receita: number; despesa: number; lucro: number }

function periodMonths(periodo: string) {
  if (periodo === "1m") return 1
  if (periodo === "3m") return 3
  if (periodo === "1y") return 12
  return 6
}

function monthKeyFromOffset(offset: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - offset)
  return date.toISOString().slice(0, 7)
}

function shortMonth(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00`)
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
}

export function AnaliseContent() {
  const [periodo, setPeriodo] = useState("6m")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    contracts: [] as SupabaseRow[],
    financialEntries: [] as SupabaseRow[],
    clients: [] as SupabaseRow[],
    equipment: [] as SupabaseRow[],
    maintenanceOrders: [] as SupabaseRow[],
    installments: [] as SupabaseRow[],
  })

  useEffect(() => {
    let active = true
    Promise.all([
      getContracts(),
      getFinancialEntries(),
      getClients(),
      getEquipment(),
      getMaintenanceOrders(),
      getInstallments(),
    ]).then(([contracts, financialEntries, clients, equipment, maintenanceOrders, installments]) => {
      if (!active) return
      setData({
        contracts: contracts as SupabaseRow[],
        financialEntries: financialEntries as SupabaseRow[],
        clients: clients as SupabaseRow[],
        equipment: equipment as SupabaseRow[],
        maintenanceOrders: maintenanceOrders as SupabaseRow[],
        installments: installments as SupabaseRow[],
      })
      setLoading(false)
    }).catch(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const analytics = useMemo(() => {
    const months = Array.from({ length: periodMonths(periodo) }, (_, index) => monthKeyFromOffset(periodMonths(periodo) - index - 1))
    const chartData: ChartPoint[] = months.map((month) => {
      const revenue = calculateMonthlyRevenueMetrics(data.contracts, data.financialEntries, new Date(`${month}-01T00:00:00`))
      const despesa = calculateMonthlyExpense(data.financialEntries, month)
      return {
        month: shortMonth(month),
        receita: revenue.totalRevenue,
        despesa,
        lucro: revenue.totalRevenue - despesa,
      }
    })
    const currentRevenue = calculateMonthlyRevenueMetrics(data.contracts, data.financialEntries)
    const currentExpense = calculateMonthlyExpense(data.financialEntries, currentRevenue.monthKey)
    const activeContracts = currentRevenue.activeContracts.length
    const ticketMedio = activeContracts ? currentRevenue.mrr / activeContracts : 0
    const overdueInstallments = data.installments.filter((row) => {
      const dueDate = new Date(String(row.due_date ?? row.vencimento ?? ""))
      return Boolean(row.due_date ?? row.vencimento) && dueDate < new Date() && !row.paid_at && !row.payment_date
    })
    const equipmentMaintenance = data.maintenanceOrders.filter((row) =>
      !["closed", "concluido", "finalizado"].includes(String(row.status ?? "").toLowerCase())
    ).length
    const revenueByType = data.financialEntries
      .filter(isIncomeEntry)
      .reduce<Record<string, number>>((acc, entry) => {
        const label = String(entry.category ?? entry.dre_category_name ?? entry.type ?? "Receitas")
        acc[label] = (acc[label] ?? 0) + getEntryAmount(entry)
        return acc
      }, {})
    const categoryData = Object.entries(revenueByType).map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }))
    const hasData =
      data.contracts.length > 0 ||
      data.financialEntries.length > 0 ||
      data.clients.length > 0 ||
      data.equipment.length > 0 ||
      data.maintenanceOrders.length > 0 ||
      data.installments.length > 0

    return {
      chartData,
      categoryData,
      currentRevenue,
      currentExpense,
      ticketMedio,
      overdueInstallments: overdueInstallments.length,
      equipmentMaintenance,
      hasData,
      totalClients: data.clients.length,
      totalEquipment: data.equipment.length,
      realizedRevenue: data.financialEntries
        .filter((entry) => isIncomeEntry(entry) && getEntryMonthKey(entry) === currentRevenue.monthKey)
        .reduce((sum, entry) => sum + getEntryAmount(entry), 0),
      expenses: data.financialEntries
        .filter((entry) => isExpenseEntry(entry) && getEntryMonthKey(entry) === currentRevenue.monthKey)
        .reduce((sum, entry) => sum + getEntryAmount(entry), 0),
    }
  }, [data, periodo])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analise de Negocios</h1>
          <p className="text-muted-foreground">Indicadores reais derivados do Supabase.</p>
        </div>
        <Select value={periodo} onValueChange={(value) => value && setPeriodo(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Ultimo mes</SelectItem>
            <SelectItem value="3m">Ultimos 3 meses</SelectItem>
            <SelectItem value="6m">Ultimos 6 meses</SelectItem>
            <SelectItem value="1y">Ultimo ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!analytics.hasData && !loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Sem dados suficientes para analise no periodo selecionado.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              ["MRR", formatCurrency(analytics.currentRevenue.mrr)],
              ["ARR", formatCurrency(analytics.currentRevenue.arr)],
              ["Ticket Medio", formatCurrency(analytics.ticketMedio)],
              ["Clientes", analytics.totalClients],
              ["Equipamentos", analytics.totalEquipment],
              ["Inadimplencia", analytics.overdueInstallments],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="financeiro" className="space-y-4">
            <TabsList>
              <TabsTrigger value="financeiro"><BarChart3 className="mr-2 h-4 w-4" />Financeiro</TabsTrigger>
              <TabsTrigger value="receitas"><PieChart className="mr-2 h-4 w-4" />Receitas</TabsTrigger>
              <TabsTrigger value="operacional"><Target className="mr-2 h-4 w-4" />Operacional</TabsTrigger>
            </TabsList>

            <TabsContent value="financeiro" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolucao financeira</CardTitle>
                  <CardDescription>Contratos ativos e lancamentos financeiros reais.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    {analytics.chartData.some((item) => item.receita || item.despesa || item.lucro) ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={analytics.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                          <Bar dataKey="receita" fill="#22B8CF" name="Receita" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="despesa" fill="#EF4444" name="Despesa" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="lucro" fill="#22C55E" name="Lucro" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                        Sem dados suficientes para analise no periodo selecionado.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="receitas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuicao de receitas</CardTitle>
                  <CardDescription>Baseada em financial_entries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {analytics.categoryData.length ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <RePieChart>
                          <Pie data={analytics.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                            {analytics.categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                        Sem receitas lancadas para distribuir.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operacional">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo operacional</CardTitle>
                  <CardDescription>Leitura direta de contratos, equipamentos, parcelas e manutencoes.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                  {[
                    ["Contratos ativos", analytics.currentRevenue.activeContracts.length],
                    ["Receita realizada", formatCurrency(analytics.realizedRevenue)],
                    ["Despesas", formatCurrency(analytics.expenses)],
                    ["Manutencoes abertas", analytics.equipmentMaintenance],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 font-semibold">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
