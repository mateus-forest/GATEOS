"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Printer, Mail, Calendar as CalendarIcon, Clock, BarChart3, PieChart, TrendingUp, Users, Package, FileSpreadsheet, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildGenericReport } from "@/lib/reports/report-builders"
import { cn } from "@/lib/utils"

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

const relatoriosRecentes = [
  { id: 1, nome: "Relatório Financeiro Mensal", data: "2024-02-20 14:30", formato: "PDF", tamanho: "1.2 MB" },
  { id: 2, nome: "Inventário de Equipamentos", data: "2024-02-19 10:15", formato: "XLSX", tamanho: "856 KB" },
  { id: 3, nome: "Contratos Ativos", data: "2024-02-18 16:45", formato: "PDF", tamanho: "2.4 MB" },
  { id: 4, nome: "DRE - Janeiro 2024", data: "2024-02-15 09:00", formato: "PDF", tamanho: "980 KB" },
  { id: 5, nome: "Análise de Inadimplência", data: "2024-02-12 11:30", formato: "PDF", tamanho: "654 KB" },
]

const agendados = [
  { id: 1, nome: "Relatório Financeiro Mensal", frequencia: "Mensal", proximaExecucao: "01/03/2024", destino: "admin@gate.com" },
  { id: 2, nome: "Inventário de Equipamentos", frequencia: "Semanal", proximaExecucao: "26/02/2024", destino: "operacoes@gate.com" },
  { id: 3, nome: "Análise de Inadimplência", frequencia: "Semanal", proximaExecucao: "25/02/2024", destino: "financeiro@gate.com" },
]

export function RelatoriosContent() {
  const [dataInicio, setDataInicio] = useState<Date>()
  const [dataFim, setDataFim] = useState<Date>()
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos")
  const [gerando, setGerando] = useState<number | null>(null)

  const relatoriosFiltrados = categoriaFiltro === "Todos" 
    ? relatoriosPredefinidos 
    : relatoriosPredefinidos.filter(r => r.categoria === categoriaFiltro)

  const handleGerarRelatorio = (id: number) => {
    setGerando(id)
    const relatorio = relatoriosPredefinidos.find((item) => item.id === id)
    if (relatorio) {
      exportPdfReport(buildGenericReport({
        title: relatorio.nome,
        subtitle: relatorio.categoria,
        description: relatorio.descricao,
        periodStart: dataInicio ? format(dataInicio, "yyyy-MM-dd") : undefined,
        periodEnd: dataFim ? format(dataFim, "yyyy-MM-dd") : undefined,
        rows: [],
      }))
    }
    setGerando(null)
  }

  const handleHistoricoDownload = (relatorio: (typeof relatoriosRecentes)[number]) =>
    exportPdfReport(buildGenericReport({
      title: relatorio.nome,
      subtitle: "Histórico de relatório",
      description: "Registro histórico de relatório gerado no GATE OS.",
      rows: [relatorio],
    }))

  const handlePrint = () => {
    window.print()
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
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {relatoriosRecentes.map((rel) => (
                    <div key={rel.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{rel.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(rel.data).toLocaleString("pt-BR")} - {rel.tamanho}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rel.formato}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleHistoricoDownload(rel)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handlePrint}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => featureInPreparation("Envio de relatorio por e-mail depende de servico de e-mail no backend.")}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
              <Button onClick={() => featureInPreparation("Agendamento automatico de relatorios depende de backend e rotina programada.")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agendados.map((ag) => (
                  <div key={ag.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Clock className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ag.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {ag.frequencia} - Próxima: {ag.proximaExecucao}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Destino</p>
                        <p className="text-sm text-foreground">{ag.destino}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">Ativo</Badge>
                      <Button variant="outline" size="sm" onClick={() => featureInPreparation("Edicao de agendamento depende do fluxo real de agendamentos.")}>Editar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
