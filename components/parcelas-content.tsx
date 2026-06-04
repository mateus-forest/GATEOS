"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  CreditCard,
  Receipt,
  DollarSign,
  Scale,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { parcelas } from "@/lib/mock-data"
import { isContratoEmJuridico } from "@/lib/juridico-data"
import { formatCurrency, formatDate } from "@/lib/utils"

export function ParcelasContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [selectedParcela, setSelectedParcela] = useState<typeof parcelas[0] | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)

  const filteredParcelas = parcelas.filter((p) => {
    const matchesSearch = p.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPendente = parcelas
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0)

  const totalAtrasado = parcelas
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPago = parcelas
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pago</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Atrasado</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const handleView = (parcela: typeof parcelas[0]) => {
    setSelectedParcela(parcela)
    setDetailsOpen(true)
  }

  const handleReceive = (parcela: typeof parcelas[0]) => {
    setSelectedParcela(parcela)
    setReceiveOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parcelas</h1>
          <p className="text-muted-foreground">Gestão de parcelas e cobranças</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Gerar Parcelas
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total em Parcelas</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendente + totalAtrasado + totalPago)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPago)}</p>
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
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendente)}</p>
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
                <p className="text-sm text-muted-foreground">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAtrasado)}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
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
                placeholder="Buscar por contrato ou cliente..."
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
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                <SelectItem value="01">Janeiro</SelectItem>
                <SelectItem value="02">Fevereiro</SelectItem>
                <SelectItem value="03">Março</SelectItem>
                <SelectItem value="04">Abril</SelectItem>
                <SelectItem value="05">Maio</SelectItem>
                <SelectItem value="06">Junho</SelectItem>
                <SelectItem value="07">Julho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parcelas Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParcelas.map((parcela) => (
                <TableRow key={parcela.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(parcela.status)}
                      <span className="font-medium">{parcela.number}/{parcela.totalParcelas}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{parcela.contractNumber}</TableCell>
                  <TableCell>{parcela.clientName}</TableCell>
                  <TableCell>{formatDate(parcela.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(parcela.amount)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(parcela.status)}
                      {isContratoEmJuridico(parcela.contractNumber) && (
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
                        <DropdownMenuItem onClick={() => handleView(parcela)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        {parcela.status !== "paid" && (
                          <DropdownMenuItem onClick={() => handleReceive(parcela)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Receber
                          </DropdownMenuItem>
                        )}
                        {parcela.status === "overdue" && (
                          <DropdownMenuItem onClick={() => toast.info("Renegociação mockada aberta")}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Renegociar
                          </DropdownMenuItem>
                        )}
                        {isContratoEmJuridico(parcela.contractNumber) ? (
                          <DropdownMenuItem onClick={() => { window.location.href = "/juridico" }}>
                            <Scale className="mr-2 h-4 w-4" />
                            Ver caso jurídico
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => toast.success("Parcela enviada para o jurídico")}>
                            <Scale className="mr-2 h-4 w-4" />
                            Enviar para jurídico
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.success("Comprovante anexado com sucesso")}>
                          <Receipt className="mr-2 h-4 w-4" />
                          Anexar comprovante
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Recibo gerado com sucesso")}>
                          <Download className="mr-2 h-4 w-4" />
                          Gerar recibo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Edição mockada aberta")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da parcela</DialogTitle>
            <DialogDescription>Informações mockadas da cobrança selecionada</DialogDescription>
          </DialogHeader>
          {selectedParcela && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrato</span>
                <span className="font-medium">{selectedParcela.contractNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{selectedParcela.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium">{formatCurrency(selectedParcela.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimento</span>
                <span className="font-medium">{formatDate(selectedParcela.dueDate)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receber parcela</DialogTitle>
            <DialogDescription>Registro mockado de pagamento</DialogDescription>
          </DialogHeader>
          {selectedParcela && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium">{selectedParcela.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedParcela.contractNumber} - {formatCurrency(selectedParcela.amount)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReceiveOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setReceiveOpen(false)
                    toast.success("Pagamento registrado com sucesso")
                  }}
                >
                  Salvar recebimento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
