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
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportCsv, featureInPreparation } from "@/lib/cta-actions"

type ContractWithPublicLink = ContractView & {
  public_access_token?: string
  public_access_enabled?: boolean
}

function normalizeContractStatus(status: unknown) {
  const value = String(status ?? "ativo")
  const map: Record<string, string> = {
    active: "ativo",
    closed: "encerrado",
    cancelled: "encerrado",
    expired: "encerrado",
    overdue: "pendente",
    legal: "pendente",
    expiring: "pendente",
    draft: "pendente",
  }
  return map[value] ?? value
}

function toNumber(value: string | undefined) {
  if (!value) return null
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeContract(item: Record<string, unknown>): ContractWithPublicLink {
  const number = String(item.number ?? item.contract_number ?? item.numero ?? "")
  const clientName = String(item.clientName ?? item.client_name ?? item.client ?? item.nome_fantasia ?? "")
  const startDate = String(item.startDate ?? item.start_date ?? item.data_inicio ?? "")
  const endDate = String(item.endDate ?? item.end_date ?? item.data_fim ?? startDate)
  const monthlyValue = Number(item.monthlyValue ?? item.monthly_value ?? item.valor_mensal ?? 0)
  const status = normalizeContractStatus(item.status)

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
    status,
    startDate,
    endDate,
    monthlyValue,
    totalValue: Number(item.totalValue ?? item.total_value ?? item.valor_total ?? monthlyValue),
    description: String(item.description ?? item.descricao ?? ""),
    public_access_token: item.public_access_token ? String(item.public_access_token) : undefined,
    public_access_enabled: Boolean(item.public_access_enabled),
  }
}

export function ContratosContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [contracts, setContracts] = useState<ContractWithPublicLink[]>([])
  const [clientOptions, setClientOptions] = useState<Array<{ label: string; value: string }>>([])

  useEffect(() => {
    getContracts().then((items) => setContracts(items.map((item) => normalizeContract(item as Record<string, unknown>))))
    getClients().then((items) =>
      setClientOptions(
        items.map((item) => {
          const record = item as Record<string, unknown>
          return {
            label: String(record.name ?? record.trade_name ?? record.company_name ?? record.nome_fantasia ?? record.razao_social ?? record.id ?? ""),
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

  const activeContracts = contracts.filter((c) => c.status === "ativo").length
  const expiringContracts = contracts.filter((c) => c.status === "pendente").length
  const totalMonthlyValue = contracts
    .filter((c) => c.status === "ativo" || c.status === "pendente")
    .reduce((sum, c) => sum + c.monthlyValue, 0)

  const getPublicContractUrl = (token: string) => `${window.location.origin}/cliente/contrato/${token}`

  const handleCopyClientLink = async (contract: ContractWithPublicLink) => {
    const token = String((contract as Record<string, unknown>).public_access_token ?? "")
    if (!token) {
      toast.error("Este contrato ainda nao possui link publico ativo.")
      return
    }

    await navigator.clipboard.writeText(getPublicContractUrl(token))
    toast.success("Link do cliente copiado.")
  }

  const handleGenerateClientLink = async (contract: ContractWithPublicLink) => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase nao esta configurado. O link nao foi gerado.")
      return
    }

    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      toast.error("Nao foi possivel conectar ao Supabase. O link nao foi gerado.")
      return
    }

    const token = crypto.randomUUID()
    const { data, error } = await supabase
      .from("contracts")
      .update({
        public_access_token: token,
        public_access_enabled: true,
        public_access_created_at: new Date().toISOString(),
      })
      .eq("id", contract.id)
      .select("*")
      .single()

    if (error || !data) {
      toast.error("Nao foi possivel gerar o link. A migration de acesso publico provavelmente ainda nao foi aplicada.")
      return
    }

    const updated = normalizeContract(data as Record<string, unknown>)
    setContracts((current) => current.map((item) => (item.id === contract.id ? updated : item)))
    await navigator.clipboard.writeText(getPublicContractUrl(token))
    toast.success("Link do cliente gerado e copiado.")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
      case "pendente":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>
      case "encerrado":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Encerrado</Badge>
      case "suspenso":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspenso</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ativo":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case "pendente":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case "suspenso":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "encerrado":
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
          <Button variant="outline" onClick={() => exportCsv("gate-contratos.csv", filteredContracts.map((contract) => ({
            id: contract.id,
            numero: contract.number,
            cliente: contract.clientName,
            tipo: contract.type,
            status: contract.status,
            valor_mensal: contract.monthlyValue,
          })))}>
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
                      { label: "Manutenção", value: "manutencao" },
                      { label: "Suporte", value: "suporte" },
                    ],
                  },
                  {
                    name: "status",
                    label: "Status",
                    type: "select",
                    options: [
                      { label: "Ativo", value: "ativo" },
                      { label: "Pendente", value: "pendente" },
                      { label: "Suspenso", value: "suspenso" },
                      { label: "Encerrado", value: "encerrado" },
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
              const publicToken = crypto.randomUUID()
              const created = await createContract({
                client_id: values.client_id,
                contract_number: values.number,
                type: values.type ?? "locacao",
                status: values.status ?? "ativo",
                start_date: values.start_date,
                end_date: values.end_date || null,
                due_day: toNumber(values.due_day),
                monthly_value: toNumber(values.monthly_value),
                total_value: toNumber(values.total_value),
                installments_count: toNumber(values.installments_count),
                payment_method: values.payment_method || null,
                notes: values.notes || null,
                public_access_token: publicToken,
                public_access_enabled: true,
                public_access_created_at: new Date().toISOString(),
              })
              const createdContract = normalizeContract(created as Record<string, unknown>)
              const refreshed = await getContracts()
              const refreshedContracts = refreshed.map((item) => normalizeContract(item as Record<string, unknown>))
              const hasCreatedContract = refreshedContracts.some((contract) => contract.id === createdContract.id)
              setContracts(
                hasCreatedContract ? refreshedContracts : [createdContract, ...refreshedContracts]
              )
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
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
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
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
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
                            <DropdownMenuItem onClick={() => handleCopyClientLink(contract)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar link do cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateClientLink(contract)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Gerar/regenerar link
                            </DropdownMenuItem>
                            {isContratoEmJuridico(contract.number) ? (
                              <DropdownMenuItem onClick={() => { window.location.href = "/juridico" }}>
                                <Scale className="mr-2 h-4 w-4" />
                                Ver caso jurídico
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => featureInPreparation("Envio de contrato para o juridico depende da criacao real do caso juridico vinculado.")}>
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
