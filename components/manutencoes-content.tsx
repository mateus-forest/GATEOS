"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Download,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  User,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MaintenanceView } from "@/lib/mock-data"
import { createMaintenanceOrder, getMaintenanceOrders } from "@/lib/data/maintenance"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getEquipment } from "@/lib/data/equipment"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildMaintenanceReport } from "@/lib/reports/report-builders"

function normalizeMaintenance(item: Record<string, unknown>): MaintenanceView {
  return {
    id: String(item.id ?? ""),
    equipamentoId: String(item.equipment_id ?? ""),
    tipo: String(item.type ?? "corretiva") as MaintenanceView["tipo"],
    status: String(item.status ?? "open") as MaintenanceView["status"],
    prioridade: String(item.priority ?? "medium") as MaintenanceView["prioridade"],
    descricao: String(item.problem ?? item.description ?? ""),
    dataAgendada: String(item.entry_date ?? item.scheduled_date ?? ""),
    tecnico: String(item.technician ?? ""),
    custo: Number(item.cost ?? 0),
    equipment: String(item.equipment_id ?? ""),
    equipmentName: String(item.equipment_name ?? item.equipment_id ?? ""),
    clientName: String(item.client_name ?? item.client_id ?? ""),
    ticketNumber: String(item.ticket_number ?? item.id ?? ""),
    type: String(item.type ?? "corretiva"),
    priority: String(item.priority ?? "medium"),
    description: String(item.problem ?? item.description ?? ""),
    scheduledDate: String(item.entry_date ?? item.scheduled_date ?? ""),
    startDate: item.start_date ? String(item.start_date) : undefined,
    completedDate: item.completed_date ? String(item.completed_date) : undefined,
    technician: String(item.technician ?? ""),
    cost: Number(item.cost ?? 0),
  }
}

export function ManutencoesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [maintenances, setMaintenances] = useState<MaintenanceView[]>([])
  const [relationshipOptions, setRelationshipOptions] = useState({
    equipment: [] as Array<{ label: string; value: string }>,
    clients: [] as Array<{ label: string; value: string }>,
    contracts: [] as Array<{ label: string; value: string }>,
  })

  useEffect(() => {
    getMaintenanceOrders().then((items) =>
      setMaintenances(items.map((item) => normalizeMaintenance(item as Record<string, unknown>)))
    )
    Promise.all([getEquipment(), getClients(), getContracts()]).then(([equipment, clients, contracts]) => {
      const option = (item: unknown, labelKeys: string[]) => {
        const record = item as Record<string, unknown>
        const label = labelKeys.map((key) => record[key]).find(Boolean) ?? record.id
        return { label: String(label ?? ""), value: String(record.id ?? "") }
      }
      setRelationshipOptions({
        equipment: equipment.map((item) => option(item, ["name", "nome", "serial_number"])).filter((item) => item.value),
        clients: clients.map((item) => option(item, ["name", "nome_fantasia", "razao_social"])).filter((item) => item.value),
        contracts: contracts.map((item) => option(item, ["contract_number", "number", "numero"])).filter((item) => item.value),
      })
    })
  }, [])

  const filteredMaintenances = maintenances.filter((m) => {
    const matchesSearch = m.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || m.status === statusFilter
    const matchesType = typeFilter === "all" || m.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const openMaintenances = maintenances.filter((m) => m.status === "open" || m.status === "in_progress").length
  const completedThisMonth = maintenances.filter((m) => m.status === "completed").length
  const avgResponseTime = "4.2h"

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Aberto</Badge>
      case "in_progress":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Em Andamento</Badge>
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Concluído</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "medium":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Média</Badge>
      case "low":
        return <Badge variant="secondary">Baixa</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manutenções</h1>
          <p className="text-muted-foreground">Gestão de chamados e ordens de serviço</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildMaintenanceReport(filteredMaintenances.map((maintenance) => ({
            id: maintenance.id,
            protocol: maintenance.ticketNumber,
            equipment_name: maintenance.equipmentName,
            client_name: maintenance.clientName,
            type: maintenance.type,
            priority: maintenance.priority,
            status: maintenance.status,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <MockCreateDialog
            title="Nova Manutencao"
            description="Preencha os dados da ordem de manutenção para salvar no Supabase."
            triggerLabel="Nova Manutencao"
            toastMessage="Manutencao salva com sucesso"
            sections={[
              {
                title: "Vínculos",
                fields: [
                  { name: "equipment_id", label: "Equipamento", type: "select", required: true, options: relationshipOptions.equipment },
                  { name: "client_id", label: "Cliente", type: "select", options: relationshipOptions.clients },
                  { name: "contract_id", label: "Contrato", type: "select", options: relationshipOptions.contracts },
                ],
              },
              {
                title: "Chamado",
                fields: [
                  { name: "ticket_number", label: "Número do ticket" },
                  {
                    name: "type",
                    label: "Tipo",
                    type: "select",
                    options: [
                      { label: "Preventiva", value: "preventiva" },
                      { label: "Corretiva", value: "corretiva" },
                      { label: "Emergencial", value: "emergencial" },
                    ],
                  },
                  {
                    name: "priority",
                    label: "Prioridade",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Baixa", value: "low" },
                      { label: "Média", value: "medium" },
                      { label: "Alta", value: "high" },
                      { label: "Crítica", value: "critical" },
                    ],
                  },
                  {
                    name: "status",
                    label: "Status",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Aberto", value: "open" },
                      { label: "Em andamento", value: "in_progress" },
                      { label: "Concluído", value: "completed" },
                      { label: "Cancelado", value: "cancelled" },
                    ],
                  },
                ],
              },
              {
                title: "Descrição",
                fields: [
                  { name: "problem", label: "Problema relatado", type: "textarea", required: true },
                  { name: "diagnosis", label: "Diagnóstico", type: "textarea" },
                  { name: "solution", label: "Solução", type: "textarea" },
                ],
              },
              {
                title: "Datas",
                fields: [
                  { name: "entry_date", label: "Data de entrada", type: "date" },
                  { name: "expected_exit_date", label: "Data prevista de saída", type: "date" },
                  { name: "completed_date", label: "Data de conclusão", type: "date" },
                ],
              },
              {
                title: "Custos",
                fields: [
                  { name: "cost", label: "Custo da manutenção em R$", type: "money" },
                  { name: "technician", label: "Responsável / Técnico" },
                ],
              },
              {
                title: "Anexos",
                fields: [
                  { name: "photos", label: "Fotos", type: "file" },
                  { name: "invoice", label: "Nota fiscal", type: "file" },
                  { name: "receipt", label: "Comprovantes", type: "file" },
                  { name: "technical_report", label: "Relatório técnico", type: "file" },
                ],
              },
            ]}
            onSave={async (values) => {
              const created = await createMaintenanceOrder({
                equipment_id: values.equipment_id ?? "",
                client_id: values.client_id || null,
                contract_id: values.contract_id || null,
                ticket_number: values.ticket_number ?? "",
                type: values.type ?? "preventiva",
                priority: values.priority ?? "medium",
                status: values.status ?? "open",
                problem: values.problem ?? "",
                diagnosis: values.diagnosis ?? "",
                solution: values.solution ?? "",
                entry_date: values.entry_date || null,
                expected_exit_date: values.expected_exit_date || null,
                completed_date: values.completed_date || null,
                cost: Number(values.cost ?? 0),
                technician: values.technician ?? "",
              })
              const refreshed = await getMaintenanceOrders()
              setMaintenances(
                refreshed.length > 0
                  ? refreshed.map((item) => normalizeMaintenance(item as Record<string, unknown>))
                  : [normalizeMaintenance(created as Record<string, unknown>)]
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
                <p className="text-sm text-muted-foreground">Total Chamados</p>
                <p className="text-2xl font-bold">{maintenances.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Aberto</p>
                <p className="text-2xl font-bold text-amber-600">{openMaintenances}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos (mês)</p>
                <p className="text-2xl font-bold text-emerald-600">{completedThisMonth}</p>
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
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{avgResponseTime}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="abertos">Em Aberto</TabsTrigger>
          <TabsTrigger value="andamento">Em Andamento</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por equipamento, cliente ou ticket..."
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
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="instalacao">Instalação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Maintenances Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenances.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-mono font-medium">
                        {maintenance.ticketNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{maintenance.equipmentName}</p>
                          <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {maintenance.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{maintenance.type}</Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(maintenance.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {maintenance.technician.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{maintenance.technician}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
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
                              <User className="mr-2 h-4 w-4" />
                              Atribuir técnico
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abertos">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Mostrando apenas chamados em aberto...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="andamento">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Mostrando chamados em andamento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concluidos">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Mostrando chamados concluídos...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
