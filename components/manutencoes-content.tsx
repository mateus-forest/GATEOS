"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportPdfReport } from "@/lib/cta-actions"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { clientLabel, contractLabel, equipmentLabel } from "@/lib/data/display-labels"
import { getEquipment } from "@/lib/data/equipment"
import {
  createMaintenanceOrder,
  deleteMaintenanceOrder,
  getMaintenanceOrders,
  updateMaintenanceOrder,
} from "@/lib/data/maintenance"
import type { MaintenanceView } from "@/lib/mock-data"
import { buildMaintenanceReport } from "@/lib/reports/report-builders"
import { formatDate } from "@/lib/utils"

type Option = { label: string; value: string }

type MaintenanceTicketView = MaintenanceView & {
  clientId: string
  equipmentId: string
  contractId: string
  requester: string
  phone: string
  email: string
  problemType: string
  rawProblem: string
}

type MaintenanceFormState = {
  equipment_id: string
  client_id: string
  contract_id: string
  type: string
  priority: string
  status: string
  problem: string
  technician: string
  expected_exit_date: string
}

const initialMaintenanceForm: MaintenanceFormState = {
  equipment_id: "",
  client_id: "",
  contract_id: "",
  type: "corretiva",
  priority: "medium",
  status: "open",
  problem: "",
  technician: "",
  expected_exit_date: "",
}

const typeOptions = [
  { label: "Preventiva", value: "preventiva" },
  { label: "Corretiva", value: "corretiva" },
  { label: "Emergencial", value: "emergencial" },
]

const priorityOptions = [
  { label: "Baixa", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
  { label: "Critica", value: "critical" },
]

const statusOptions = [
  { label: "Aberto", value: "open" },
  { label: "Em andamento", value: "in_progress" },
  { label: "Concluido", value: "completed" },
  { label: "Cancelado", value: "cancelled" },
]

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

function extractProblemField(problem: string, label: string) {
  const line = problem.split("\n").find((item) => item.toLowerCase().startsWith(label.toLowerCase()))
  return line?.split(":").slice(1).join(":").trim() ?? ""
}

function cleanProblemDescription(problem: string) {
  const lines = problem.split("\n")
  const firstDescriptionLine = lines.findIndex((line) => !line.includes(":") && line.trim())
  const description = firstDescriptionLine >= 0 ? lines.slice(firstDescriptionLine).join("\n") : problem
  return description.replace(/^\[[^\]]+\]\s*/, "").trim()
}

function typeLabel(type: string) {
  return typeOptions.find((item) => item.value === type)?.label ?? type
}

function priorityLabel(priority: string) {
  return priorityOptions.find((item) => item.value === priority)?.label ?? priority
}

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status
}

function initials(value: string) {
  return (value || "NA").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
}

function normalizeMaintenance(
  item: Record<string, unknown>,
  labels: { equipment: Map<string, string>; clients: Map<string, string> }
): MaintenanceTicketView {
  const equipmentId = String(item.equipment_id ?? "")
  const clientId = String(item.client_id ?? "")
  const contractId = String(item.contract_id ?? "")
  const rawProblem = String(item.problem ?? item.description ?? "")
  const bracketType = rawProblem.match(/^\[([^\]]+)\]/)?.[1] ?? ""
  const publicType = extractProblemField(rawProblem, "Tipo do problema")
  const type = String(item.type ?? (bracketType || publicType || "corretiva")).toLowerCase()
  const equipmentName = String(item.equipment_name ?? "")
  const clientName = String(item.client_name ?? "")
  const description = cleanProblemDescription(rawProblem)

  return {
    id: String(item.id ?? ""),
    equipamentoId: equipmentId,
    tipo: type as MaintenanceView["tipo"],
    status: String(item.status ?? "open") as MaintenanceView["status"],
    prioridade: String(item.priority ?? "medium") as MaintenanceView["prioridade"],
    descricao: description,
    dataAgendada: String(item.entry_date ?? item.scheduled_date ?? ""),
    tecnico: String(item.technician ?? ""),
    custo: Number(item.cost ?? 0),
    equipment: equipmentId,
    equipmentName: equipmentName && !isUuidLike(equipmentName) ? equipmentName : labels.equipment.get(equipmentId) ?? "Equipamento nao informado",
    clientName: clientName && !isUuidLike(clientName) ? clientName : labels.clients.get(clientId) ?? "Cliente nao informado",
    ticketNumber: String(item.ticket_number ?? item.id ?? ""),
    type,
    priority: String(item.priority ?? "medium"),
    description,
    scheduledDate: String(item.entry_date ?? item.scheduled_date ?? ""),
    startDate: item.start_date ? String(item.start_date) : undefined,
    completedDate: item.completed_at || item.completed_date ? String(item.completed_at ?? item.completed_date) : undefined,
    technician: String(item.technician ?? ""),
    cost: Number(item.cost ?? 0),
    clientId,
    equipmentId,
    contractId,
    requester: extractProblemField(rawProblem, "Solicitante"),
    phone: extractProblemField(rawProblem, "Telefone/WhatsApp"),
    email: extractProblemField(rawProblem, "E-mail"),
    problemType: publicType || bracketType || type,
    rawProblem,
  }
}

export function ManutencoesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [maintenances, setMaintenances] = useState<MaintenanceTicketView[]>([])
  const [viewingTicket, setViewingTicket] = useState<MaintenanceTicketView | null>(null)
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicketView | null>(null)
  const [statusTicket, setStatusTicket] = useState<MaintenanceTicketView | null>(null)
  const [editForm, setEditForm] = useState<MaintenanceFormState>(initialMaintenanceForm)
  const [nextStatus, setNextStatus] = useState("open")
  const [saving, setSaving] = useState(false)
  const [relationshipOptions, setRelationshipOptions] = useState({
    equipment: [] as Option[],
    clients: [] as Option[],
    contracts: [] as Option[],
  })

  const loadMaintenanceData = async () => {
    const [orders, equipment, clients, contracts] = await Promise.all([
      getMaintenanceOrders(),
      getEquipment(),
      getClients(),
      getContracts(),
    ])
    const equipmentOptions = equipment.map((item) => {
      const record = item as Record<string, unknown>
      return { label: equipmentLabel(record), value: String(record.id ?? "") }
    }).filter((item) => item.value)
    const clientOptions = clients.map((item) => {
      const record = item as Record<string, unknown>
      return { label: clientLabel(record), value: String(record.id ?? "") }
    }).filter((item) => item.value)
    const contractOptions = contracts.map((item) => {
      const record = item as Record<string, unknown>
      return { label: contractLabel(record), value: String(record.id ?? "") }
    }).filter((item) => item.value)
    const labels = {
      equipment: new Map(equipmentOptions.map((item) => [item.value, item.label])),
      clients: new Map(clientOptions.map((item) => [item.value, item.label])),
    }

    setRelationshipOptions({ equipment: equipmentOptions, clients: clientOptions, contracts: contractOptions })
    setMaintenances(orders.map((item) => normalizeMaintenance(item as Record<string, unknown>, labels)))
  }

  useEffect(() => {
    let active = true
    Promise.all([
      getMaintenanceOrders(),
      getEquipment(),
      getClients(),
      getContracts(),
    ]).then(([orders, equipment, clients, contracts]) => {
      if (!active) return
      const equipmentOptions = equipment.map((item) => {
        const record = item as Record<string, unknown>
        return { label: equipmentLabel(record), value: String(record.id ?? "") }
      }).filter((item) => item.value)
      const clientOptions = clients.map((item) => {
        const record = item as Record<string, unknown>
        return { label: clientLabel(record), value: String(record.id ?? "") }
      }).filter((item) => item.value)
      const contractOptions = contracts.map((item) => {
        const record = item as Record<string, unknown>
        return { label: contractLabel(record), value: String(record.id ?? "") }
      }).filter((item) => item.value)
      const labels = {
        equipment: new Map(equipmentOptions.map((item) => [item.value, item.label])),
        clients: new Map(clientOptions.map((item) => [item.value, item.label])),
      }
      setRelationshipOptions({ equipment: equipmentOptions, clients: clientOptions, contracts: contractOptions })
      setMaintenances(orders.map((item) => normalizeMaintenance(item as Record<string, unknown>, labels)))
    })
    return () => {
      active = false
    }
  }, [])

  const filteredMaintenances = maintenances.filter((item) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = !term ||
      item.equipmentName.toLowerCase().includes(term) ||
      item.clientName.toLowerCase().includes(term) ||
      item.ticketNumber.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const openMaintenances = maintenances.filter((item) => item.status === "open" || item.status === "in_progress").length
  const completedThisMonth = maintenances.filter((item) => item.status === "completed").length
  const avgResponseTime = "4.2h"

  const getStatusBadge = (status: string) => {
    if (status === "open") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Aberto</Badge>
    if (status === "in_progress") return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Em andamento</Badge>
    if (status === "completed") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Concluido</Badge>
    if (status === "cancelled") return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelado</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === "critical") return <Badge variant="destructive">Critica</Badge>
    if (priority === "high") return <Badge variant="destructive">Alta</Badge>
    if (priority === "medium") return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Media</Badge>
    if (priority === "low") return <Badge variant="secondary">Baixa</Badge>
    return <Badge variant="secondary">{priority}</Badge>
  }

  const openEditTicket = (ticket: MaintenanceTicketView) => {
    setEditingTicket(ticket)
    setEditForm({
      equipment_id: ticket.equipmentId,
      client_id: ticket.clientId,
      contract_id: ticket.contractId,
      type: ticket.type || "corretiva",
      priority: ticket.priority || "medium",
      status: ticket.status || "open",
      problem: ticket.description,
      technician: ticket.technician,
      expected_exit_date: "",
    })
  }

  const openStatusTicket = (ticket: MaintenanceTicketView) => {
    setStatusTicket(ticket)
    setNextStatus(ticket.status)
  }

  const handleSaveEdit = async () => {
    if (!editingTicket) return
    if (!editForm.equipment_id || !editForm.problem.trim()) {
      toast.error("Informe equipamento e descricao do problema.")
      return
    }

    setSaving(true)
    try {
      await updateMaintenanceOrder(editingTicket.id, {
        equipment_id: editForm.equipment_id,
        client_id: editForm.client_id || null,
        contract_id: editForm.contract_id || null,
        priority: editForm.priority,
        status: editForm.status,
        problem: `[${editForm.type}] ${editForm.problem}`.trim(),
        technician: editForm.technician,
        expected_exit_date: editForm.expected_exit_date || null,
      })
      setEditingTicket(null)
      toast.success("Chamado atualizado com sucesso.")
      await loadMaintenanceData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o chamado.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveStatus = async () => {
    if (!statusTicket) return
    setSaving(true)
    try {
      await updateMaintenanceOrder(statusTicket.id, {
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      })
      setStatusTicket(null)
      toast.success("Status atualizado com sucesso.")
      await loadMaintenanceData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel alterar o status.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTicket = async (ticket: MaintenanceTicketView) => {
    if (!window.confirm(`Excluir o chamado ${ticket.ticketNumber}? Esta acao nao pode ser desfeita.`)) return
    try {
      await deleteMaintenanceOrder(ticket.id)
      setMaintenances((current) => current.filter((item) => item.id !== ticket.id))
      toast.success("Chamado excluido com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o chamado.")
    }
  }

  const detailRow = (label: string, value: string | undefined) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manutencoes</h1>
          <p className="text-muted-foreground">Gestao de chamados e ordens de servico</p>
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
            title="Nova manutencao"
            description="Preencha os dados da ordem de manutencao para salvar no Supabase."
            triggerLabel="Nova manutencao"
            toastMessage="Manutencao salva com sucesso"
            sections={[
              {
                title: "Vinculos",
                fields: [
                  { name: "client_id", label: "Cliente", type: "select", required: true, options: relationshipOptions.clients },
                  { name: "contract_id", label: "Contrato", type: "select", options: relationshipOptions.contracts },
                  { name: "equipment_id", label: "Equipamento", type: "select", required: true, options: relationshipOptions.equipment },
                ],
              },
              {
                title: "Chamado",
                fields: [
                  { name: "type", label: "Tipo", type: "select", options: typeOptions },
                  { name: "priority", label: "Prioridade", type: "select", required: true, options: priorityOptions },
                  { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
                ],
              },
              {
                title: "Descricao",
                fields: [
                  { name: "problem", label: "Descricao", type: "textarea", required: true },
                ],
              },
              {
                title: "Data prevista",
                fields: [
                  { name: "expected_exit_date", label: "Data prevista", type: "date" },
                ],
              },
            ]}
            onSave={async (values) => {
              const ticketNumber = `GATE-MAN-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
              await createMaintenanceOrder({
                equipment_id: values.equipment_id ?? "",
                client_id: values.client_id || null,
                contract_id: values.contract_id || null,
                ticket_number: ticketNumber,
                priority: values.priority ?? "medium",
                status: values.status ?? "open",
                problem: `${values.type ? `[${values.type}] ` : ""}${values.problem ?? ""}`.trim(),
                entry_date: new Date().toISOString().slice(0, 10),
                expected_exit_date: values.expected_exit_date || null,
              })
              await loadMaintenanceData()
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Chamados</p><p className="text-2xl font-bold">{maintenances.length}</p></div><div className="rounded-xl bg-primary/10 p-3"><Wrench className="h-6 w-6 text-primary" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Em Aberto</p><p className="text-2xl font-bold text-amber-600">{openMaintenances}</p></div><div className="rounded-xl bg-amber-100 p-3"><Clock className="h-6 w-6 text-amber-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Concluidos (mes)</p><p className="text-2xl font-bold text-emerald-600">{completedThisMonth}</p></div><div className="rounded-xl bg-emerald-100 p-3"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Tempo Medio</p><p className="text-2xl font-bold">{avgResponseTime}</p></div><div className="rounded-xl bg-blue-100 p-3"><Calendar className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por equipamento, cliente, ticket ou problema..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {typeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {priorityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chamado</TableHead>
                <TableHead>Equipamento / Cliente</TableHead>
                <TableHead>Problema</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Tecnico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenances.map((maintenance) => (
                <TableRow key={maintenance.id}>
                  <TableCell><div className="space-y-1"><p className="font-mono text-sm font-medium">{maintenance.ticketNumber}</p><p className="text-xs text-muted-foreground">{maintenance.scheduledDate ? formatDate(maintenance.scheduledDate) : "Sem data"}</p></div></TableCell>
                  <TableCell><div className="min-w-0 space-y-1"><p className="truncate font-medium" title={maintenance.equipmentName}>{maintenance.equipmentName}</p><p className="truncate text-sm text-muted-foreground" title={maintenance.clientName}>{maintenance.clientName}</p></div></TableCell>
                  <TableCell><div className="max-w-md space-y-1"><Badge variant="outline" className="capitalize">{typeLabel(maintenance.problemType)}</Badge><p className="line-clamp-2 text-sm text-muted-foreground" title={maintenance.description}>{maintenance.description || "Sem descricao"}</p>{(maintenance.requester || maintenance.phone || maintenance.email) && <p className="truncate text-xs text-muted-foreground" title={[maintenance.requester, maintenance.phone, maintenance.email].filter(Boolean).join(" / ")}>{[maintenance.requester, maintenance.phone, maintenance.email].filter(Boolean).join(" / ")}</p>}</div></TableCell>
                  <TableCell>{getPriorityBadge(maintenance.priority)}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(maintenance.technician)}</AvatarFallback></Avatar><span className="text-sm">{maintenance.technician || "Nao atribuido"}</span></div></TableCell>
                  <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingTicket(maintenance)}><Eye className="mr-2 h-4 w-4" />Abrir detalhes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openStatusTicket(maintenance)}><RefreshCw className="mr-2 h-4 w-4" />Mudar status</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditTicket(maintenance)}><Edit className="mr-2 h-4 w-4" />Editar chamado</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTicket(maintenance)}><Trash2 className="mr-2 h-4 w-4" />Excluir chamado</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMaintenances.length === 0 && <TableRow><TableCell colSpan={7} className="h-28 text-center"><div className="space-y-1"><p className="font-medium">Nenhum chamado encontrado.</p><p className="text-sm text-muted-foreground">Ajuste os filtros ou abra uma nova manutencao.</p></div></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(viewingTicket)} onOpenChange={(open) => !open && setViewingTicket(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Detalhes do chamado</DialogTitle><DialogDescription>{viewingTicket?.ticketNumber}</DialogDescription></DialogHeader>
          {viewingTicket && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {detailRow("Equipamento", viewingTicket.equipmentName)}
                {detailRow("Cliente", viewingTicket.clientName)}
                <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-1">{getStatusBadge(viewingTicket.status)}</div></div>
                {detailRow("Solicitante", viewingTicket.requester)}
                {detailRow("Telefone/WhatsApp", viewingTicket.phone)}
                {detailRow("E-mail", viewingTicket.email)}
                {detailRow("Tipo do problema", typeLabel(viewingTicket.problemType))}
                <div><p className="text-xs text-muted-foreground">Prioridade</p><div className="mt-1">{getPriorityBadge(viewingTicket.priority)}</div></div>
                {detailRow("Tecnico", viewingTicket.technician || "Nao atribuido")}
                {detailRow("Abertura", viewingTicket.scheduledDate ? formatDate(viewingTicket.scheduledDate) : "-")}
                {detailRow("Conclusao", viewingTicket.completedDate ? formatDate(viewingTicket.completedDate) : "-")}
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Descricao</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{viewingTicket.description || "-"}</p>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewingTicket(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(statusTicket)} onOpenChange={(open) => !open && setStatusTicket(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mudar status</DialogTitle><DialogDescription>{statusTicket?.ticketNumber}</DialogDescription></DialogHeader>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={nextStatus} onValueChange={setNextStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStatusTicket(null)} disabled={saving}>Cancelar</Button><Button onClick={handleSaveStatus} disabled={saving}>{saving ? "Salvando..." : "Salvar status"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingTicket)} onOpenChange={(open) => !open && setEditingTicket(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Editar chamado</DialogTitle><DialogDescription>{editingTicket?.ticketNumber}</DialogDescription></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label>Cliente</Label><Select value={editForm.client_id || "none"} onValueChange={(value) => setEditForm((current) => ({ ...current, client_id: value === "none" ? "" : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem cliente</SelectItem>{relationshipOptions.clients.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Equipamento</Label><Select value={editForm.equipment_id} onValueChange={(value) => setEditForm((current) => ({ ...current, equipment_id: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{relationshipOptions.equipment.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Contrato</Label><Select value={editForm.contract_id || "none"} onValueChange={(value) => setEditForm((current) => ({ ...current, contract_id: value === "none" ? "" : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem contrato</SelectItem>{relationshipOptions.contracts.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Tipo</Label><Select value={editForm.type} onValueChange={(value) => setEditForm((current) => ({ ...current, type: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{typeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Prioridade</Label><Select value={editForm.priority} onValueChange={(value) => setEditForm((current) => ({ ...current, priority: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={editForm.status} onValueChange={(value) => setEditForm((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="maintenance-technician">Tecnico</Label><Input id="maintenance-technician" value={editForm.technician} onChange={(event) => setEditForm((current) => ({ ...current, technician: event.target.value }))} /></div>
            <div className="grid gap-2"><Label htmlFor="maintenance-date">Data prevista</Label><Input id="maintenance-date" type="date" value={editForm.expected_exit_date} onChange={(event) => setEditForm((current) => ({ ...current, expected_exit_date: event.target.value }))} /></div>
            <div className="grid gap-2 md:col-span-2"><Label htmlFor="maintenance-problem">Descricao</Label><textarea id="maintenance-problem" className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" value={editForm.problem} onChange={(event) => setEditForm((current) => ({ ...current, problem: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingTicket(null)} disabled={saving}>Cancelar</Button><Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Salvando..." : "Salvar alteracoes"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
