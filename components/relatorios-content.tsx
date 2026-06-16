"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Calendar as CalendarIcon, Clock, BarChart3, PieChart, TrendingUp, Users, Package, FileSpreadsheet, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildContractsReport, buildFinancialEntriesReport, buildGenericReport } from "@/lib/reports/report-builders"
import { cn } from "@/lib/utils"
import { getContracts } from "@/lib/data/contracts"
import { getFinancialEntries } from "@/lib/data/financial"
import {
  calculateMonthlyExpense,
  calculateMonthlyRevenueMetrics,
  getContractDueDateForMonth,
  getContractMonthlyValue,
} from "@/lib/data/recurring-revenue"
import type { SupabaseRow } from "@/lib/supabase/types"

const relatoriosPredefinidos = [
  {
    id: 1,
    nome: "Relatório Financeiro Mensal",
    descricao: "Resumo completo de receitas, despesas e lucro",
    categoria: "Financeiro",
    icon: BarChart3,
    cor: "text-green-500",
    bgCor: "bg-green-500/10"
  },
  {
    id: 2,
    nome: "DRE - Demonstração de Resultados",
    descricao: "Demonstração do resultado do exercício",
    categoria: "Financeiro",
    icon: TrendingUp,
    cor: "text-blue-500",
    bgCor: "bg-blue-500/10"
  },
  {
    id: 3,
    nome: "Relatório de Clientes",
    descricao: "Lista completa de clientes e status",
    categoria: "Comercial",
    icon: Users,
    cor: "text-purple-500",
    bgCor: "bg-purple-500/10"
  },
  {
    id: 4,
    nome: "Contratos Ativos",
    descricao: "Todos os contratos vigentes com detalhes",
    categoria: "Comercial",
    icon: FileText,
    cor: "text-cyan-500",
    bgCor: "bg-cyan-500/10"
  },
  {
    id: 5,
    nome: "Inventário de Equipamentos",
    descricao: "Lista completa do patrimônio da empresa",
    categoria: "Operacional",
    icon: Package,
    cor: "text-orange-500",
    bgCor: "bg-orange-500/10"
  },
  {
    id: 6,
    nome: "Manutenções Realizadas",
    descricao: "Histórico de manutenções por período",
    categoria: "Operacional",
    icon: FileSpreadsheet,
    cor: "text-yellow-500",
    bgCor: "bg-yellow-500/10"
  },
  {
    id: 7,
    nome: "Análise de Inadimplência",
    descricao: "Clientes com parcelas em atraso",
    categoria: "Financeiro",
    icon: PieChart,
    cor: "text-red-500",
    bgCor: "bg-red-500/10"
  },
  {
    id: 8,
    nome: "Performance de Vendas",
    descricao: "Métricas de vendas e conversão",
    categoria: "Comercial",
    icon: TrendingUp,
    cor: "text-emerald-500",
    bgCor: "bg-emerald-500/10"
  },
]

export function RelatoriosContent() {
  const [dataInicio, setDataInicio] = useState<Date>()
  const [dataFim, setDataFim] = useState<Date>()
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos")
  const [gerando, setGerando] = useState<number | null>(null)
  const [contracts, setContracts] = useState<SupabaseRow[]>([])
  const [financialEntries, setFinancialEntries] = useState<SupabaseRow[]>([])

  useEffect(() => {
    Promise.all([getContracts(), getFinancialEntries()]).then(([contractRows, entryRows]) => {
      setContracts(contractRows as SupabaseRow[])
      setFinancialEntries(entryRows as SupabaseRow[])
    })
  }, [])

  const relatoriosFiltrados = categoriaFiltro === "Todos" 
    ? relatoriosPredefinidos 
    : relatoriosPredefinidos.filter(r => r.categoria === categoriaFiltro)

  const handleGerarRelatorio = (id: number) => {
    setGerando(id)
    const relatorio = relatoriosPredefinidos.find((item) => item.id === id)
    if (relatorio) {
      const revenue = calculateMonthlyRevenueMetrics(contracts, financialEntries)
      const expense = calculateMonthlyExpense(financialEntries, revenue.monthKey)
      if (id === 1) {
        exportPdfReport(buildFinancialEntriesReport([
          ...revenue.pendingContractReceivables.map((contract) => ({
            id: String(contract.id ?? ""),
            date: getContractDueDateForMonth(contract, revenue.monthKey),
            description: `Receita prevista contrato ${String(contract.contract_number ?? contract.number ?? "")}`,
            type: "income",
            categoria: "Contrato ativo",
            status: "previsto",
            amount: getContractMonthlyValue(contract),
          })),
          ...financialEntries,
          { id: "summary-revenue", description: "Receita total do mes", type: "summary", amount: revenue.totalRevenue },
          { id: "summary-expense", description: "Despesas do mes", type: "summary", amount: expense },
          { id: "summary-balance", description: "Saldo operacional", type: "summary", amount: revenue.totalRevenue - expense },
        ]))
      } else if (id === 2) {
        exportPdfReport(buildGenericReport({
          title: relatorio.nome,
          subtitle: "DRE operacional",
          description: "DRE gerencial considerando contratos ativos e lancamentos financeiros.",
          rows: [
            { indicador: "Receita prevista por contratos", valor: revenue.contractExpectedRevenue },
            { indicador: "Receita realizada", valor: revenue.financialRealizedRevenue },
            { indicador: "Receita pendente lancada", valor: revenue.financialPendingRevenue },
            { indicador: "Despesas", valor: expense },
            { indicador: "Resultado", valor: revenue.totalRevenue - expense },
          ],
        }))
      } else if (id === 4) {
        exportPdfReport(buildContractsReport(contracts))
      } else {
        exportPdfReport(buildGenericReport({
          title: relatorio.nome,
          subtitle: relatorio.categoria,
          description: relatorio.descricao,
          periodStart: dataInicio ? format(dataInicio, "yyyy-MM-dd") : undefined,
          periodEnd: dataFim ? format(dataFim, "yyyy-MM-dd") : undefined,
          rows: [],
        }))
      }
    }
    setGerando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Geração e exportação de relatórios do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="gerar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gerar">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="agendados">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Agendados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-4">
          {/* Filtros de Período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Período do Relatório</CardTitle>
              <CardDescription>Selecione o intervalo de datas para geração</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio ? format(dataInicio, "PPP", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, "PPP", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                      <SelectItem value="Operacional">Operacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Relatórios */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {relatoriosFiltrados.map((relatorio) => {
              const Icon = relatorio.icon
              return (
                <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`p-3 rounded-lg ${relatorio.bgCor} w-fit mb-3`}>
                      <Icon className={`h-6 w-6 ${relatorio.cor}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{relatorio.nome}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{relatorio.descricao}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{relatorio.categoria}</Badge>
                      <Button 
                        size="sm" 
                        onClick={() => handleGerarRelatorio(relatorio.id)}
                        disabled={gerando === relatorio.id}
                      >
                        {gerando === relatorio.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Gerar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Opções de Exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opções de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="pdf" defaultChecked />
                  <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="xlsx" />
                  <Label htmlFor="xlsx" className="cursor-pointer">Excel (XLSX)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer">CSV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="email" />
                  <Label htmlFor="email" className="cursor-pointer">Enviar por e-mail</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Recentes</CardTitle>
              <CardDescription>Histórico de relatórios gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold text-foreground">Nenhum relatório gerado ainda.</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os relatórios exportados nesta tela ainda não possuem histórico persistido.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendados" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Relatórios Agendados</CardTitle>
                <CardDescription>Geração automática de relatórios</CardDescription>
              </div>
              <Button disabled>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold text-foreground">Nenhum agendamento configurado.</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A criação de agendamentos permanece indisponível até existir persistência real.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
