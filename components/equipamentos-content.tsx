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
  Eye,
  Edit,
  Trash2,
  Wrench,
  MapPin,
  QrCode,
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
import type { EquipmentView } from "@/lib/mock-data"
import { createEquipment, getEquipment } from "@/lib/data/equipment"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildEquipmentReport } from "@/lib/reports/report-builders"

function normalizeEquipment(item: Record<string, unknown>): EquipmentView {
  const name = String(item.name ?? item.nome ?? "")
  const code = String(item.code ?? item.codigo ?? "")
  const value = Number(item.value ?? item.valor_compra ?? item.valorCompra ?? 0)
  const status = String(item.status ?? "available")

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
  }
}

export function EquipamentosContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [equipments, setEquipments] = useState<EquipmentView[]>([])

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

  const totalEquipments = equipments.length
  const activeEquipments = equipments.filter((e) => e.status === "active").length
  const maintenanceEquipments = equipments.filter((e) => e.status === "maintenance").length
  const totalValue = equipments.reduce((sum, e) => sum + e.value, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Manutenção</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inativo</Badge>
      case "disposed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Descartado</Badge>
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
          <p className="text-muted-foreground">Gestão de equipamentos e inventário</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => featureInPreparation("Geração e impressão avançada de etiquetas está em preparação.")}>
            <QrCode className="mr-2 h-4 w-4" />
            Gerar Etiquetas
          </Button>
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
                title: "Identificação",
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
                      { label: "Segurança", value: "seguranca" },
                      { label: "Outro", value: "outro" },
                    ],
                  },
                  { name: "brand", label: "Marca" },
                  { name: "model", label: "Modelo" },
                  { name: "configuration", label: "Configuração" },
                  { name: "serial_number", label: "Número de série" },
                ],
              },
              {
                title: "Quantidade",
                fields: [
                  { name: "total_quantity", label: "Quantidade total", type: "number", required: true },
                  { name: "available_quantity", label: "Quantidade disponível", type: "number" },
                  { name: "rented_quantity", label: "Quantidade locada", type: "number" },
                  { name: "reserved_quantity", label: "Quantidade reservada", type: "number" },
                  { name: "maintenance_quantity", label: "Quantidade em manutenção", type: "number" },
                ],
              },
              {
                title: "Valores",
                fields: [
                  { name: "purchase_value", label: "Valor de compra unitário em R$", type: "money", required: true },
                  { name: "sale_value", label: "Valor de venda em R$", type: "money" },
                  { name: "rental_value", label: "Valor de locação mensal em R$", type: "money" },
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
                      { label: "Disponível", value: "available" },
                      { label: "Locado", value: "active" },
                      { label: "Reservado", value: "reserved" },
                      { label: "Manutenção", value: "maintenance" },
                      { label: "Vendido", value: "sold" },
                      { label: "Baixado", value: "disposed" },
                    ],
                  },
                  { name: "notes", label: "Observações internas", type: "textarea" },
                ],
              },
            ]}
            onSave={async (values) => {
              const created = await createEquipment({
                name: values.name ?? "",
                category: values.category ?? "",
                brand: values.brand ?? "",
                model: values.model ?? "",
                configuration: values.configuration ?? "",
                serial_number: values.serial_number ?? "",
                total_quantity: Number(values.total_quantity ?? 0),
                available_quantity: Number(values.available_quantity ?? 0),
                rented_quantity: Number(values.rented_quantity ?? 0),
                reserved_quantity: Number(values.reserved_quantity ?? 0),
                maintenance_quantity: Number(values.maintenance_quantity ?? 0),
                purchase_value: Number(values.purchase_value ?? 0),
                sale_value: Number(values.sale_value ?? 0),
                rental_value: Number(values.rental_value ?? 0),
                status: values.status ?? "available",
                notes: values.notes ?? "",
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
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-emerald-600">{activeEquipments}</p>
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
                <p className="text-sm text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold text-amber-600">{maintenanceEquipments}</p>
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
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
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
                placeholder="Buscar por nome, número de série ou cliente..."
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="disposed">Descartado</SelectItem>
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
                <TableHead>Número de Série</TableHead>
                <TableHead>Cliente / Localização</TableHead>
                <TableHead>Contrato</TableHead>
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Wrench className="mr-2 h-4 w-4" />
                          Registrar manutenção
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Descartar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEquipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    <div className="space-y-1">
                      <p className="font-medium">Nenhum equipamento cadastrado ainda.</p>
                      <p className="text-sm text-muted-foreground">Clique em Novo Equipamento para começar.</p>
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
