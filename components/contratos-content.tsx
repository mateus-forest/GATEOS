"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Search,
  Download,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Copy,
  Scale,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ContractView } from "@/lib/mock-data"
import { getClients } from "@/lib/data/clients"
import type { Contrato } from "@/lib/types"
import { createContract, getContracts } from "@/lib/data/contracts"
import { isContratoEmJuridico } from "@/lib/juridico-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"

function normalizeContract(item: Record<string, unknown>): ContractView {
  const number = String(item.number ?? item.numero ?? "")
  const clientName = String(item.clientName ?? item.client_name ?? item.client ?? item.nome_fantasia ?? "")
  const startDate = String(item.startDate ?? item.start_date ?? item.data_inicio ?? "")
  const endDate = String(item.endDate ?? item.end_date ?? item.data_fim ?? startDate)
  const monthlyValue = Number(item.monthlyValue ?? item.monthly_value ?? item.valor_mensal ?? 0)

  return {
    id: String(item.id ?? ""),
    numero: number,
    clienteId: String(item.clienteId ?? item.client_id ?? ""),
    tipo: String(item.type ?? item.tipo ?? "locacao") as Contrato["tipo"],
    dataInicio: startDate,
    dataFim: endDate,
    valorMensal: monthlyValue,
    valorTotal: Number(item.totalValue ?? item.total_value ?? item.valor_total ?? monthlyValue),
    descricao: String(item.description ?? item.descricao ?? ""),
    equipamentos: [],
    parcelas: [],
    documentos: [],
    dataCriacao: String(item.created_at ?? ""),
    dataAtualizacao: String(item.updated_at ?? ""),
    number,
    client: clientName,
    clientName,
    type: String(item.type ?? item.tipo ?? "locacao"),
    status: String(item.status ?? "active"),
    startDate,
    endDate,
    monthlyValue,
    totalValue: Number(item.totalValue ?? item.total_value ?? item.valor_total ?? monthlyValue),
    description: String(item.description ?? item.descricao ?? ""),
  }
}

export function ContratosContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [contracts, setContracts] = useState<ContractView[]>([])
  const [clientOptions, setClientOptions] = useState<Array<{ label: string; value: string }>>([])

  useEffect(() => {
    getContracts().then((items) => setContracts(items.map((item) => normalizeContract(item as Record<string, unknown>))))
    getClients().then((items) =>
      setClientOptions(
        items.map((item) => {
          const record = item as Record<string, unknown>
          return {
            label: String(record.name ?? record.nome_fantasia ?? record.razao_social ?? record.id ?? ""),
            value: String(record.id ?? ""),
          }
        }).filter((item) => item.value)
      )
    )
  }, [])

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesType = typeFilter === "all" || c.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const activeContracts = contracts.filter((c) => c.status === "active").length
  const expiringContracts = contracts.filter((c) => c.status === "expiring").length
  const totalMonthlyValue = contracts
    .filter((c) => c.status === "active" || c.status === "expiring")
    .reduce((sum, c) => sum + c.monthlyValue, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
      case "expiring":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Vencendo</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Vencido</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelado</Badge>
      case "draft":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Rascunho</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case "expiring":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    const progress = ((now - start) / (end - start)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gestão de contratos e renovações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <MockCreateDialog
            title="Novo Contrato"
            description="Preencha os dados do contrato para salvar no Supabase."
            triggerLabel="Novo Contrato"
            toastMessage="Contrato salvo com sucesso"
            sections={[
              {
                title: "Cliente",
                fields: [
                  { name: "client_id", label: "Cliente", type: "select", required: true, options: clientOptions },
                  {
                    name: "type",
                    label: "Tipo de contrato",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Locação", value: "locacao" },
                      { label: "Venda", value: "venda" },
                      { label: "Serviço", value: "servico" },
                    ],
                  },
                  {
                    name: "status",
                    label: "Status",
                    type: "select",
                    options: [
                      { label: "Ativo", value: "active" },
                      { label: "Encerrado", value: "closed" },
                      { label: "Cancelado", value: "cancelled" },
                      { label: "Inadimplente", value: "overdue" },
                      { label: "Jurídico", value: "legal" },
                    ],
                  },
                ],
              },
              {
                title: "Dados do contrato",
                fields: [
                  { name: "number", label: "Número do contrato", required: true },
                  { name: "start_date", label: "Data inicial", type: "date", required: true },
                  { name: "end_date", label: "Data final", type: "date" },
                  { name: "due_day", label: "Dia de vencimento", type: "number" },
                  { name: "notes", label: "Observações", type: "textarea" },
                ],
              },
              {
                title: "Financeiro",
                fields: [
                  { name: "monthly_value", label: "Valor mensal em R$", type: "money" },
                  { name: "total_value", label: "Valor total em R$", type: "money" },
                  { name: "installments_count", label: "Quantidade de parcelas", type: "number", required: true },
                  { name: "entry_value", label: "Entrada em R$", type: "money" },
                  {
                    name: "payment_method",
                    label: "Forma de pagamento",
                    type: "select",
                    options: [
                      { label: "PIX", value: "PIX" },
                      { label: "TED", value: "TED" },
                      { label: "Boleto", value: "Boleto" },
                      { label: "Cartão", value: "Cartao" },
                      { label: "Dinheiro", value: "Dinheiro" },
                    ],
                  },
                  { name: "cost_center_name", label: "Centro de custo/lucro" },
                  { name: "dre_category_name", label: "Categoria DRE" },
                ],
              },
              {
                title: "Equipamentos vinculados",
                fields: [
                  { name: "equipment_id", label: "Equipamento selecionável" },
                  { name: "equipment_quantity", label: "Quantidade", type: "number" },
                  { name: "linked_asset_value", label: "Valor patrimonial vinculado", type: "money" },
                ],
              },
              {
                title: "Anexos",
                fields: [
                  { name: "contract_pdf", label: "Contrato PDF", type: "file" },
                  { name: "receipt_file", label: "Comprovante", type: "file" },
                  { name: "other_file", label: "Outros documentos", type: "file" },
                ],
              },
            ]}
            onSave={async (values) => {
              const created = await createContract({
                client_id: values.client_id ?? "",
                number: values.number ?? "",
                type: values.type ?? "locacao",
                status: values.status ?? "active",
                start_date: values.start_date ?? "",
                end_date: values.end_date ?? "",
                due_day: Number(values.due_day ?? 0),
                monthly_value: Number(values.monthly_value ?? 0),
                total_value: Number(values.total_value ?? 0),
                installments_count: Number(values.installments_count ?? 0),
                entry_value: Number(values.entry_value ?? 0),
                payment_method: values.payment_method ?? "",
                cost_center_name: values.cost_center_name ?? "",
                dre_category_name: values.dre_category_name ?? "",
                notes: values.notes ?? "",
              })
              setContracts((current) => [normalizeContract(created as Record<string, unknown>), ...current])
            }}
          />
        </div>
      </div>

      {/* Alerts */}
      {expiringContracts > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {expiringContracts} contratos vencem nos próximos 30 dias
                </p>
                <p className="text-xs text-amber-600">
                  Inicie o processo de renovação para manter a continuidade dos serviços
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Ver contratos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Contratos</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{activeContracts}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMonthlyValue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Vencer (30d)</p>
                <p className="text-2xl font-bold text-amber-600">{expiringContracts}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="ativos">Ativos</TabsTrigger>
          <TabsTrigger value="vencendo">Vencendo</TabsTrigger>
          <TabsTrigger value="renovacoes">Renovações</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="expiring">Vencendo</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contracts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(contract.status)}
                          <span className="font-mono font-medium">{contract.number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.clientName}</p>
                          <p className="text-sm text-muted-foreground">{contract.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{contract.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(contract.startDate)}</p>
                          <p className="text-muted-foreground">até {formatDate(contract.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress 
                            value={calculateProgress(contract.startDate, contract.endDate)} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {calculateProgress(contract.startDate, contract.endDate).toFixed(0)}% concluído
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(contract.monthlyValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(contract.status)}
                          {isContratoEmJuridico(contract.number) && (
                            <Badge className="w-fit bg-red-100 text-red-700 hover:bg-red-100">Em Jurídico</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            {isContratoEmJuridico(contract.number) ? (
                              <DropdownMenuItem onClick={() => { window.location.href = "/juridico" }}>
                                <Scale className="mr-2 h-4 w-4" />
                                Ver caso jurídico
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => toast.success("Contrato enviado para o jurídico")}>
                                <Scale className="mr-2 h-4 w-4" />
                                Enviar para jurídico
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renovar contrato
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-28 text-center">
                        <div className="space-y-1">
                          <p className="font-medium">Nenhum contrato cadastrado ainda.</p>
                          <p className="text-sm text-muted-foreground">Clique em Novo Contrato para começar.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ativos">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Mostrando apenas contratos ativos...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencendo">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Mostrando contratos que vencem em breve...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renovacoes">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Mostrando contratos em processo de renovação...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
