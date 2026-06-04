"use client"

import { useState } from "react"
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
import { contracts } from "@/lib/mock-data"
import { isContratoEmJuridico } from "@/lib/juridico-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { MockCreateDialog } from "@/components/mock-create-dialog"

export function ContratosContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

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
            description="Cadastro mockado de contrato."
            triggerLabel="Novo Contrato"
            toastMessage="Contrato salvo com sucesso"
            fields={["Cliente", "Numero", "Tipo", "Valor mensal", "Vencimento"]}
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
