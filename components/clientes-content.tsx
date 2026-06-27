"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  Download,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  Eye,
  FileText,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ClientView } from "@/lib/mock-data"
import { createClient, deleteClient, getClientDeleteBlockMessage, getClientRelationCounts, getClients, inactivateClient } from "@/lib/data/clients"
import { formatCurrency, formatCPFCNPJ, formatPhone } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildClientsReport } from "@/lib/reports/report-builders"
import { toast } from "sonner"

function normalizeClient(item: Record<string, unknown>): ClientView {
  const name = String(item.name ?? item.trade_name ?? item.nome_fantasia ?? item.nomeFantasia ?? item.razao_social ?? item.razaoSocial ?? "")
  const companyName = String(item.companyName ?? item.company_name ?? item.razao_social ?? item.razaoSocial ?? name)
  const document = String(item.document_number ?? item.document ?? item.cnpj ?? item.cpf ?? "")
  const phone = String(item.phone ?? item.telefone ?? "")
  const segment = String(item.segment ?? item.segmento ?? "")
  const status = String(item.status ?? (item.ativo === false ? "inativo" : "ativo"))

  return {
    id: String(item.id ?? ""),
    razaoSocial: companyName,
    nomeFantasia: name,
    cnpj: document,
    email: String(item.email ?? ""),
    telefone: phone,
    endereco: {
      logradouro: String(item.logradouro ?? ""),
      numero: String(item.numero ?? ""),
      bairro: String(item.bairro ?? ""),
      cidade: String(item.cidade ?? ""),
      estado: String(item.estado ?? ""),
      cep: String(item.cep ?? ""),
    },
    contato: {
      nome: String(item.contato_nome ?? item.contact_name ?? ""),
      cargo: String(item.contato_cargo ?? item.contact_role ?? ""),
      email: String(item.contato_email ?? item.email ?? ""),
      telefone: phone,
    },
    dataCadastro: String(item.dataCadastro ?? item.created_at ?? ""),
    ativo: status !== "inativo",
    segmento: segment,
    name,
    companyName,
    document,
    phone,
    segment,
    type: String(item.type ?? item.tipo ?? "pj"),
    address: String(item.address ?? item.endereco ?? ""),
    status,
    contractsCount: Number(item.contractsCount ?? item.contracts_count ?? 0),
    monthlyRevenue: Number(item.monthlyRevenue ?? item.monthly_revenue ?? 0),
  }
}

export function ClientesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clients, setClients] = useState<ClientView[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientView | null>(null)

  useEffect(() => {
    getClients().then((items) => setClients(items.map((item) => normalizeClient(item as Record<string, unknown>))))
  }, [])

  const filteredClients = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || c.type === typeFilter
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const activeClients = clients.filter((c) => c.status === "ativo").length
  const totalRevenue = clients.reduce((sum, c) => sum + c.monthlyRevenue, 0)
  const averageTicket = activeClients > 0 ? totalRevenue / activeClients : 0

  const refreshClients = async () => {
    const refreshed = await getClients()
    setClients(refreshed.map((item) => normalizeClient(item as Record<string, unknown>)))
  }

  const handleDeleteClient = async (client: ClientView) => {
    if (!client.id) {
      toast.error("Cliente sem ID real. Nao foi possivel executar a acao.")
      return
    }

    try {
      const counts = await getClientRelationCounts(client.id)
      if (counts.total > 0) {
        toast.error(getClientDeleteBlockMessage(counts))
        return
      }

      if (!window.confirm(`Excluir permanentemente o cliente ${client.name}? Esta acao nao pode ser desfeita.`)) return
      await deleteClient(client.id)
      await refreshClients()
      toast.success("Cliente excluido com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o cliente.")
    }
  }

  const handleInactivateClient = async (client: ClientView) => {
    if (!client.id) {
      toast.error("Cliente sem ID real. Nao foi possivel executar a acao.")
      return
    }

    try {
      if (!window.confirm(`Inativar o cliente ${client.name}? Nenhum dado vinculado sera excluido.`)) return
      await inactivateClient(client.id)
      await refreshClients()
      toast.success("Cliente inativado com seguranca.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel verificar ou inativar o cliente.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
      case "inativo":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inativo</Badge>
      case "inadimplente":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Inadimplente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestão de clientes e prospects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildClientsReport(filteredClients.map((client) => ({
            id: client.id,
            name: client.name,
            document: client.document,
            email: client.email,
            phone: client.phone,
            status: client.status,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <MockCreateDialog
            title="Novo Cliente"
            description="Preencha os dados do cliente para salvar no Supabase."
            triggerLabel="Novo Cliente"
            toastMessage="Cliente salvo com sucesso"
            sections={[
              {
                title: "Dados principais",
                fields: [
                  { name: "name", label: "Nome / Razão social", required: true },
                  { name: "document", label: "CPF/CNPJ" },
                  {
                    name: "type",
                    label: "Tipo de cliente",
                    type: "select",
                    options: [
                      { label: "Pessoa física", value: "pf" },
                      { label: "Pessoa jurídica", value: "pj" },
                    ],
                  },
                  {
                    name: "status",
                    label: "Status",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Ativo", value: "ativo" },
                      { label: "Inativo", value: "inativo" },
                      { label: "Inadimplente", value: "inadimplente" },
                    ],
                  },
                ],
              },
              {
                title: "Contato",
                fields: [
                  { name: "email", label: "E-mail", type: "email" },
                  { name: "phone", label: "Telefone", type: "tel" },
                  { name: "whatsapp", label: "WhatsApp", type: "tel" },
                ],
              },
              {
                title: "Localização",
                fields: [
                  { name: "city", label: "Cidade" },
                ],
              },
              {
                title: "Observações",
                fields: [
                  { name: "notes", label: "Observações internas", type: "textarea" },
                ],
              },
            ]}
            onSave={async (values) => {
              const created = await createClient({
                name: values.name,
                document_number: values.document || null,
                type: values.type ?? "pj",
                status: values.status ?? "ativo",
                email: values.email || null,
                phone: values.phone || null,
                whatsapp: values.whatsapp || null,
                city: values.city || null,
                notes: values.notes || null,
              })
              const refreshed = await getClients()
              setClients(
                refreshed.length > 0
                  ? refreshed.map((item) => normalizeClient(item as Record<string, unknown>))
                  : [normalizeClient(created as Record<string, unknown>)]
              )
            }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{activeClients}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <User className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(averageTicket)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ/CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                <SelectItem value="pf">Pessoa Física</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="inadimplente">Inadimplente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="overflow-hidden p-0">
          <Table className="min-w-[920px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Cliente</TableHead>
                <TableHead className="w-[15%]">CNPJ/CPF</TableHead>
                <TableHead className="w-[24%]">Contato</TableHead>
                <TableHead className="w-[11%]">Contratos</TableHead>
                <TableHead className="w-[13%]">Receita Mensal</TableHead>
                <TableHead className="w-[9%]">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="min-w-0 whitespace-normal">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={client.name}>{client.name}</p>
                        <p className="truncate text-sm text-muted-foreground" title={client.segment}>{client.segment}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="truncate font-mono text-sm" title={formatCPFCNPJ(client.document)}>
                    {formatCPFCNPJ(client.document)}
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal">
                    <div className="space-y-1">
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate" title={client.email}>{client.email}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate" title={formatPhone(client.phone)}>{formatPhone(client.phone)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.contractsCount} contratos</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(client.monthlyRevenue)}
                  </TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DialogTrigger asChild>
                            <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={() => { window.location.href = "/contratos" }}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver contratos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInactivateClient(client)}>
                            <User className="mr-2 h-4 w-4" />
                            Inativar cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => handleDeleteClient(client)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do cliente</DialogTitle>
                          <DialogDescription>
                            Informações completas do cliente
                          </DialogDescription>
                        </DialogHeader>
                        {selectedClient && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                  {selectedClient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h3 className="break-words text-xl font-bold">{selectedClient.name}</h3>
                                <p className="break-words text-muted-foreground">{selectedClient.segment}</p>
                                {getStatusBadge(selectedClient.status)}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm text-muted-foreground">CNPJ/CPF</p>
                                <p className="break-all font-mono">{formatCPFCNPJ(selectedClient.document)}</p>
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm text-muted-foreground">E-mail</p>
                                <p className="break-all">{selectedClient.email}</p>
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm text-muted-foreground">Telefone</p>
                                <p className="break-words">{formatPhone(selectedClient.phone)}</p>
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm text-muted-foreground">Endereço</p>
                                <p className="break-words">{selectedClient.address}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                                <p className="font-semibold">{selectedClient.contractsCount}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                                <p className="font-semibold text-emerald-600">
                                  {formatCurrency(selectedClient.monthlyRevenue)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    <div className="space-y-1">
                      <p className="font-medium">Nenhum cliente cadastrado ainda.</p>
                      <p className="text-sm text-muted-foreground">Clique em Novo Cliente para começar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
