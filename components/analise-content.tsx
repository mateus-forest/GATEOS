"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, BarChart3, PieChart, Activity } from "lucide-react"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"

const receitaMensalData = [
  { mes: "Jan", receita: 125000, despesa: 98000, lucro: 27000 },
  { mes: "Fev", receita: 138000, despesa: 102000, lucro: 36000 },
  { mes: "Mar", receita: 142000, despesa: 105000, lucro: 37000 },
  { mes: "Abr", receita: 155000, despesa: 110000, lucro: 45000 },
  { mes: "Mai", receita: 168000, despesa: 115000, lucro: 53000 },
  { mes: "Jun", receita: 172000, despesa: 118000, lucro: 54000 },
]

const categoriaReceitaData = [
  { name: "Locação", value: 65, color: "#22d3ee" },
  { name: "Manutenção", value: 20, color: "#0ea5e9" },
  { name: "Consultoria", value: 10, color: "#6366f1" },
  { name: "Outros", value: 5, color: "#94a3b8" },
]

const performanceData = [
  { subject: "Receita", A: 85, fullMark: 100 },
  { subject: "Margem", A: 72, fullMark: 100 },
  { subject: "Clientes", A: 90, fullMark: 100 },
  { subject: "Contratos", A: 78, fullMark: 100 },
  { subject: "Pagamentos", A: 88, fullMark: 100 },
  { subject: "Satisfação", A: 82, fullMark: 100 },
]

const kpis = [
  { titulo: "Ticket Médio", valor: 4250, meta: 4000, unidade: "R$", trend: "up" },
  { titulo: "CAC", valor: 850, meta: 1000, unidade: "R$", trend: "down" },
  { titulo: "LTV", valor: 51000, meta: 45000, unidade: "R$", trend: "up" },
  { titulo: "Churn Rate", valor: 2.3, meta: 3, unidade: "%", trend: "down" },
  { titulo: "NPS", valor: 72, meta: 70, unidade: "pts", trend: "up" },
  { titulo: "ROI", valor: 185, meta: 150, unidade: "%", trend: "up" },
]

const alertas = [
  { tipo: "warning", mensagem: "3 contratos vencem nos próximos 30 dias", acao: "Renovar" },
  { tipo: "danger", mensagem: "Cliente Fribal com 2 parcelas em atraso", acao: "Cobrar" },
  { tipo: "success", mensagem: "Meta de receita de Junho atingida", acao: "Ver" },
  { tipo: "info", mensagem: "5 equipamentos com manutenção preventiva pendente", acao: "Agendar" },
]

export function AnaliseContent() {
  const [periodo, setPeriodo] = useState("6m")
  const monthCount = periodo === "1m" ? 1 : periodo === "3m" ? 3 : periodo === "1y" ? 12 : 6
  const filteredReceitaData = receitaMensalData.slice(-monthCount)
  const totals = filteredReceitaData.reduce(
    (acc, item) => ({
      receita: acc.receita + item.receita,
      despesa: acc.despesa + item.despesa,
      lucro: acc.lucro + item.lucro,
    }),
    { receita: 0, despesa: 0, lucro: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise de Negócios</h1>
          <p className="text-muted-foreground">Indicadores e insights para tomada de decisão</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Último mês</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alertas */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {alertas.map((alerta, idx) => (
          <Card key={idx} className={`border-l-4 ${
            alerta.tipo === "warning" ? "border-l-yellow-500" :
            alerta.tipo === "danger" ? "border-l-red-500" :
            alerta.tipo === "success" ? "border-l-green-500" :
            "border-l-blue-500"
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {alerta.tipo === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />}
                {alerta.tipo === "danger" && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />}
                {alerta.tipo === "success" && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                {alerta.tipo === "info" && <Activity className="h-5 w-5 text-blue-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{alerta.mensagem}</p>
                  <button className="text-xs text-primary font-medium mt-1 hover:underline">
                    {alerta.acao}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, idx) => {
          const atingido = kpi.trend === "down" 
            ? kpi.valor <= kpi.meta 
            : kpi.valor >= kpi.meta
          const progresso = kpi.trend === "down"
            ? Math.min(100, (kpi.meta / kpi.valor) * 100)
            : Math.min(100, (kpi.valor / kpi.meta) * 100)
          
          return (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{kpi.titulo}</span>
                  {kpi.trend === "up" ? (
                    <TrendingUp className={`h-4 w-4 ${atingido ? "text-green-500" : "text-red-500"}`} />
                  ) : (
                    <TrendingDown className={`h-4 w-4 ${atingido ? "text-green-500" : "text-red-500"}`} />
                  )}
                </div>
                <p className="text-xl font-bold text-foreground">
                  {kpi.unidade === "R$" ? formatCurrency(kpi.valor) : `${kpi.valor}${kpi.unidade}`}
                </p>
                <Progress value={progresso} className="h-1 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: {kpi.unidade === "R$" ? formatCurrency(kpi.meta) : `${kpi.meta}${kpi.unidade}`}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="financeiro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financeiro">
            <BarChart3 className="h-4 w-4 mr-2" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="receitas">
            <PieChart className="h-4 w-4 mr-2" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Target className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Financeira</CardTitle>
              <CardDescription>Receita, despesa e lucro mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={filteredReceitaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="receita" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.6} name="Receita" />
                    <Area type="monotone" dataKey="despesa" stackId="2" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} name="Despesa" />
                    <Area type="monotone" dataKey="lucro" stackId="3" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Lucro" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.receita)}</p>
                    <div className="flex items-center gap-1 text-green-500 text-sm mt-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>+12.5% vs período anterior</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Despesa Total</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.despesa)}</p>
                    <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>+8.2% vs período anterior</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.lucro)}</p>
                    <div className="flex items-center gap-1 text-green-500 text-sm mt-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>+18.3% vs período anterior</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receitas</CardTitle>
                <CardDescription>Por categoria de serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <RePieChart>
                      <Pie
                        data={categoriaReceitaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {categoriaReceitaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Clientes por Receita</CardTitle>
                <CardDescription>Concentração de faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nome: "Fribal", valor: 185000, percent: 20.5 },
                    { nome: "Estacio Itapipoca", valor: 142000, percent: 15.8 },
                    { nome: "Comércio Beta ME", valor: 98000, percent: 10.9 },
                    { nome: "Fortaleza Iguatemi", valor: 76000, percent: 8.4 },
                    { nome: "Rio de Janeiro", valor: 65000, percent: 7.2 },
                  ].map((cliente, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{cliente.nome}</span>
                        <span className="text-muted-foreground">{formatCurrency(cliente.valor)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={cliente.percent * 3} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-12">{cliente.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Radar de Performance</CardTitle>
                <CardDescription>Visão geral dos indicadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Radar name="Performance" dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metas vs Realizado</CardTitle>
                <CardDescription>Comparativo mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={[
                      { mes: "Jan", meta: 130000, realizado: 125000 },
                      { mes: "Fev", meta: 135000, realizado: 138000 },
                      { mes: "Mar", meta: 140000, realizado: 142000 },
                      { mes: "Abr", meta: 150000, realizado: 155000 },
                      { mes: "Mai", meta: 160000, realizado: 168000 },
                      { mes: "Jun", meta: 170000, realizado: 172000 },
                    ].slice(-monthCount)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="meta" fill="#94a3b8" name="Meta" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realizado" fill="#22d3ee" name="Realizado" radius={[4, 4, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
