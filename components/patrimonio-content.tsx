"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Download,
  Building,
  Package,
  Wrench,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  DollarSign,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { AssetView } from "@/lib/mock-data"
import { createAsset, getAssets } from "@/lib/data/assets"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"
import { exportCsv } from "@/lib/cta-actions"

const assetsByCategory = [
  { name: "Imóveis", value: 2450000, color: "#22B8CF" },
  { name: "Veículos", value: 580000, color: "#22C55E" },
  { name: "Equipamentos", value: 890000, color: "#F59E0B" },
  { name: "Móveis", value: 125000, color: "#8B5CF6" },
]

function normalizeAsset(item: Record<string, unknown>): AssetView {
  const name = String(item.name ?? item.nome ?? "")
  const code = String(item.code ?? item.codigo ?? "")
  const acquisitionValue = Number(item.acquisition_value ?? item.acquisitionValue ?? item.valor_aquisicao ?? 0)
  const currentValue = Number(item.current_value ?? item.currentValue ?? item.valor_atual ?? acquisitionValue)

  return {
    id: String(item.id ?? ""),
    nome: name,
    codigo: code,
    descricao: String(item.description ?? item.descricao ?? ""),
    categoria: String(item.category ?? item.categoria ?? "outro") as AssetView["categoria"],
    status: String(item.status ?? "active"),
    valorAquisicao: acquisitionValue,
    dataAquisicao: String(item.acquisition_date ?? item.acquisitionDate ?? item.data_aquisicao ?? ""),
    valorAtual: currentValue,
    depreciacao: Number(item.depreciation_value ?? item.depreciacao ?? 0),
    localizacao: String(item.location ?? item.localizacao ?? ""),
    responsavel: String(item.responsible ?? item.responsavel ?? ""),
    name,
    code,
    description: String(item.description ?? item.descricao ?? ""),
    acquisitionValue,
    currentValue,
    acquisitionDate: String(item.acquisition_date ?? item.acquisitionDate ?? item.data_aquisicao ?? ""),
    location: String(item.location ?? item.localizacao ?? ""),
    responsible: String(item.responsible ?? item.responsavel ?? ""),
  }
}

export function PatrimonioContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assets, setAssets] = useState<AssetView[]>([])

  useEffect(() => {
    getAssets().then((items) => setAssets(items.map((item) => normalizeAsset(item as Record<string, unknown>))))
  }, [])

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter
    const matchesStatus = statusFilter === "all" || a.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalPatrimonio = assets.reduce((sum, a) => sum + a.currentValue, 0)
  const totalDepreciacao = assets.reduce((sum, a) => sum + (a.acquisitionValue - a.currentValue), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Manutenção</Badge>
      case "disposed":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Alienado</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Inativo</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "imovel":
        return <Building className="h-4 w-4" />
      case "veiculo":
        return <Package className="h-4 w-4" />
      case "equipamento":
        return <Wrench className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patrimônio</h1>
          <p className="text-muted-foreground">Gestão de ativos e bens patrimoniais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCsv("gate-patrimonio.csv", filteredAssets.map((asset) => ({
            id: asset.id,
            nome: asset.name,
            codigo: asset.code,
            categoria: asset.category,
            valor_atual: asset.currentValue,
            status: asset.status,
          })))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <MockCreateDialog
            title="Novo Ativo"
            description="Preencha os dados do ativo para salvar no Supabase."
            triggerLabel="Novo Ativo"
            toastMessage="Ativo salvo com sucesso"
            sections={[
              {
                title: "Dados do ativo",
                fields: [
                  { name: "name", label: "Nome", required: true },
                  {
                    name: "category",
                    label: "Categoria",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Imóvel", value: "imovel" },
                      { label: "Veículo", value: "veiculo" },
                      { label: "Equipamento", value: "equipamento" },
                      { label: "Mobiliário", value: "mobiliario" },
                      { label: "Software", value: "software" },
                      { label: "Outro", value: "outro" },
                    ],
                  },
                  { name: "code", label: "Código patrimonial" },
                  { name: "location", label: "Localização" },
                  {
                    name: "status",
                    label: "Status",
                    type: "select",
                    required: true,
                    options: [
                      { label: "Ativo", value: "active" },
                      { label: "Manutenção", value: "maintenance" },
                      { label: "Baixado", value: "disposed" },
                      { label: "Vendido", value: "sold" },
                    ],
                  },
                ],
              },
              {
                title: "Valores",
                fields: [
                  { name: "acquisition_value", label: "Valor de aquisição em R$", type: "money", required: true },
                  { name: "current_value", label: "Valor atual em R$", type: "money" },
                  { name: "depreciation_value", label: "Depreciação acumulada em R$", type: "money" },
                  { name: "acquisition_date", label: "Data de aquisição", type: "date" },
                ],
              },
              {
                title: "Vínculo",
                fields: [
                  { name: "equipment_id", label: "Equipamento relacionado" },
                  { name: "contract_id", label: "Contrato relacionado" },
                  { name: "client_id", label: "Cliente relacionado" },
                ],
              },
              {
                title: "Documentos",
                fields: [
                  { name: "invoice_file", label: "Nota fiscal", type: "file" },
                  { name: "term_file", label: "Termo", type: "file" },
                  { name: "receipt_file", label: "Comprovante", type: "file" },
                  { name: "other_file", label: "Outros", type: "file" },
                ],
              },
            ]}
            onSave={async (values) => {
              const created = await createAsset({
                name: values.name ?? "",
                category: values.category ?? "",
                code: values.code ?? "",
                location: values.location ?? "",
                status: values.status ?? "active",
                acquisition_value: Number(values.acquisition_value ?? 0),
                current_value: Number(values.current_value || values.acquisition_value || 0),
                depreciation_value: Number(values.depreciation_value ?? 0),
                acquisition_date: values.acquisition_date ?? null,
                equipment_id: values.equipment_id || null,
                contract_id: values.contract_id || null,
                client_id: values.client_id || null,
              })
              const refreshed = await getAssets()
              setAssets(
                refreshed.length > 0
                  ? refreshed.map((item) => normalizeAsset(item as Record<string, unknown>))
                  : [normalizeAsset(created as Record<string, unknown>)]
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
                <p className="text-sm text-muted-foreground">Patrimônio Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPatrimonio)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Building className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Ativos</p>
                <p className="text-2xl font-bold">{assets.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Depreciação Acum.</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDepreciacao)}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold text-amber-600">
                  {assets.filter((a) => a.status === "maintenance").length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Valor total por tipo de ativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assetsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {assetsByCategory.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assets List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ativos Patrimoniais</CardTitle>
                <CardDescription>Lista de bens e ativos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="imovel">Imóvel</SelectItem>
                  <SelectItem value="veiculo">Veículo</SelectItem>
                  <SelectItem value="equipamento">Equipamento</SelectItem>
                  <SelectItem value="movel">Móvel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredAssets.slice(0, 6).map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background">
                      {getCategoryIcon(asset.category)}
                    </div>
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{asset.code}</span>
                        <span>•</span>
                        <span>{asset.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(asset.currentValue)}</p>
                      <p className="text-xs text-muted-foreground">
                        Aquisição: {formatCurrency(asset.acquisitionValue)}
                      </p>
                    </div>
                    {getStatusBadge(asset.status)}
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
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Alienar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
