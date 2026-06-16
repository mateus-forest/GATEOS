"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Download,
  Monitor,
  Server,
  Printer,
  Wifi,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Wrench,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import type { EquipmentView } from "@/lib/mock-data"
import { createEquipment, getEquipment, getEquipmentAvailableQuantity, getEquipmentTotalQuantity } from "@/lib/data/equipment"
import { createAsset } from "@/lib/data/assets"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildEquipmentReport } from "@/lib/reports/report-builders"

type EquipmentInventoryView = EquipmentView & {
  totalQuantity: number
  availableQuantity: number
  rentedQuantity: number
  maintenanceQuantity: number
}

function normalizeEquipment(item: Record<string, unknown>): EquipmentInventoryView {
  const name = String(item.name ?? item.nome ?? "")
  const code = String(item.code ?? item.codigo ?? "")
  const value = Number(item.value ?? item.valor_compra ?? item.valorCompra ?? 0)
  const status = String(item.status ?? "disponivel")
  const totalQuantity = getEquipmentTotalQuantity(item)
  const availableQuantity = getEquipmentAvailableQuantity(item)
  const rentedQuantity = Math.max(0, totalQuantity - availableQuantity)
  const maintenanceQuantity = Number(item.quantity_maintenance ?? item.maintenance_quantity ?? 0)

  return {
    id: String(item.id ?? ""),
    codigo: code,
    nome: name,
    descricao: String(item.description ?? item.descricao ?? ""),
    categoria: String(item.type ?? item.categoria ?? "outro") as EquipmentView["categoria"],
    marca: String(item.brand ?? item.marca ?? ""),
    modelo: String(item.model ?? item.modelo ?? ""),
    numeroSerie: String(item.serialNumber ?? item.serial_number ?? item.numeroSerie ?? ""),
    valorCompra: value,
    valorLocacao: Number(item.rentalValue ?? item.valor_locacao ?? item.valorLocacao ?? 0),
    dataCompra: String(item.purchaseDate ?? item.data_compra ?? item.dataCompra ?? ""),
    garantiaAte: item.warrantyUntil || item.garantia_ate ? String(item.warrantyUntil ?? item.garantia_ate) : undefined,
    name,
    code,
    description: String(item.description ?? item.descricao ?? ""),
    type: String(item.type ?? item.categoria ?? ""),
    brand: String(item.brand ?? item.marca ?? ""),
    model: String(item.model ?? item.modelo ?? ""),
    serialNumber: String(item.serialNumber ?? item.serial_number ?? item.numeroSerie ?? ""),
    clientName: String(item.clientName ?? item.client_name ?? item.nome_fantasia ?? ""),
    location: String(item.location ?? item.localizacao ?? ""),
    contractNumber: String(item.contractNumber ?? item.contract_number ?? ""),
    value,
    rentalValue: Number(item.rentalValue ?? item.valor_locacao ?? item.valorLocacao ?? 0),
    purchaseDate: String(item.purchaseDate ?? item.data_compra ?? item.dataCompra ?? ""),
    warrantyUntil: item.warrantyUntil || item.garantia_ate ? String(item.warrantyUntil ?? item.garantia_ate) : undefined,
    status,
    totalQuantity,
    availableQuantity,
    rentedQuantity,
    maintenanceQuantity: Number.isFinite(maintenanceQuantity) ? maintenanceQuantity : 0,
  }
}

export function EquipamentosContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [equipments, setEquipments] = useState<EquipmentInventoryView[]>([])

  useEffect(() => {
    getEquipment().then((items) => setEquipments(items.map((item) => normalizeEquipment(item as Record<string, unknown>))))
  }, [])

  const filteredEquipments = equipments.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || e.type === typeFilter
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalEquipments = equipments.reduce((sum, item) => sum + item.totalQuantity, 0)
  const rentedEquipments = equipments.reduce((sum, item) => sum + item.rentedQuantity, 0)
  const availableEquipments = equipments.reduce((sum, item) => sum + item.availableQuantity, 0)
  const maintenanceEquipments = equipments.reduce(
    (sum, item) => sum + (["manutencao", "maintenance"].includes(item.status) ? Math.max(1, item.maintenanceQuantity) : item.maintenanceQuantity),
    0
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponivel":
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Disponivel</Badge>
      case "locado":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Locado</Badge>
      case "reservado":
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Reservado</Badge>
      case "manutencao":
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">ManutenÃ§Ã£o</Badge>
      case "vendido":
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Vendido</Badge>
      case "baixado":
      case "inactive":
      case "disposed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Baixado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "computador":
        return <Monitor className="h-4 w-4" />
      case "servidor":
        return <Server className="h-4 w-4" />
      case "impressora":
        return <Printer className="h-4 w-4" />
      case "rede":
        return <Wifi className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">GestÃ£o de equipamentos e inventÃ¡rio</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildEquipmentReport(filteredEquipments.map((equipment) => ({
            id: equipment.id,
            name: equipment.name,
            serial_number: equipment.serialNumber,
            type: equipment.type,
            status: equipment.status,
            value: equipment.value,
            client_name: equipment.clientName,
            location: equipment.location,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <MockCreateDialog
            title="Novo Equipamento"
            description="Preencha os dados do equipamento para salvar no Supabase."
            triggerLabel="Novo Equipamento"
            toastMessage="Equipamento salvo com sucesso"
            sections={[
              {
                title: "IdentificaÃ§Ã£o",
                fields: [
                  { name: "name", label: "Nome do equipamento", required: true },
                  {
                    name: "category",
                    label: "Categoria",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Servidor", value: "servidor" },
                      { label: "Computador", value: "computador" },
                      { label: "Impressora", value: "impressora" },
                      { label: "Rede", value: "rede" },
                      { label: "Telefonia", value: "telefonia" },
                      { label: "SeguranÃ§a", value: "seguranca" },
                      { label: "Outro", value: "outro" },
                    ],
                  },
                  { name: "description", label: "ObservaÃ§Ãµes", type: "textarea" },
                ],
              },
              {
                title: "Quantidade",
                fields: [
                  { name: "quantity_total", label: "Quantidade total", type: "number", required: true },
                ],
              },
              {
                title: "Status",
                fields: [
                  {
                    name: "status",
                    label: "Status",
                    type: "select",
                    required: true,
                    options: [
                      { label: "DisponÃ­vel", value: "disponivel" },
                      { label: "Locado", value: "locado" },
                      { label: "Reservado", value: "reservado" },
                      { label: "ManutenÃ§Ã£o", value: "manutencao" },
                      { label: "Vendido", value: "vendido" },
                      { label: "Baixado", value: "baixado" },
                    ],
                  },
                  { name: "notes", label: "ObservaÃ§Ãµes internas", type: "textarea" },
                ],
              },
            ]}
            onSave={async (values) => {
              const totalQuantity = Number(values.quantity_total ?? 0)
              const created = await createEquipment({
                name: values.name ?? "",
                category: values.category ?? "",
                description: values.description ?? "",
                quantity_total: totalQuantity,
                quantity_available: totalQuantity,
                quantity_rented: 0,
                quantity_reserved: 0,
                quantity_maintenance: 0,
                status: values.status ?? "disponivel",
                notes: values.notes ?? "",
              })
              const equipmentId = String((created as Record<string, unknown>).id ?? "")
              await createAsset({
                equipment_id: equipmentId,
                name: values.name ?? "",
                category: values.category ?? "equipamento",
                status: values.status ?? "disponivel",
                description: values.description ?? "",
              })
              setEquipments((current) => [normalizeEquipment(created as Record<string, unknown>), ...current])
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
                <p className="text-sm text-muted-foreground">Total Equipamentos</p>
                <p className="text-2xl font-bold">{totalEquipments}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Locados</p>
                <p className="text-2xl font-bold text-emerald-600">{rentedEquipments}</p>
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
                <p className="text-sm text-muted-foreground">Disponiveis</p>
                <p className="text-2xl font-bold text-amber-600">{availableEquipments}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Manutencao</p>
                <p className="text-2xl font-bold">{maintenanceEquipments}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Server className="h-6 w-6 text-blue-600" />
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
                placeholder="Buscar por nome, nÃºmero de sÃ©rie ou cliente..."
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
                <SelectItem value="computador">Computador</SelectItem>
                <SelectItem value="servidor">Servidor</SelectItem>
                <SelectItem value="impressora">Impressora</SelectItem>
                <SelectItem value="rede">Rede</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="disponivel">Disponivel</SelectItem>
                <SelectItem value="locado">Locado</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="manutencao">ManutenÃ§Ã£o</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="baixado">Baixado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>NÃºmero de SÃ©rie</TableHead>
                <TableHead>Cliente / LocalizaÃ§Ã£o</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getTypeIcon(equipment.type)}
                      </div>
                      <div>
                        <p className="font-medium">{equipment.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{equipment.type}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{equipment.serialNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{equipment.clientName}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {equipment.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{equipment.contractNumber}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Total: {equipment.totalQuantity}</p>
                      <p className="text-muted-foreground">
                        Locado: {equipment.rentedQuantity} | Disponivel: {equipment.availableQuantity}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(equipment.value)}</TableCell>
                  <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { window.location.href = "/manutencoes" }}>
                          <Wrench className="mr-2 h-4 w-4" />
                          Registrar manutenÃ§Ã£o
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEquipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-28 text-center">
                    <div className="space-y-1">
                      <p className="font-medium">Nenhum equipamento cadastrado ainda.</p>
                      <p className="text-sm text-muted-foreground">Clique em Novo Equipamento para comeÃ§ar.</p>
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
