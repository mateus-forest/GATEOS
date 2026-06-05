"use client"

import { useEffect, useState } from "react"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getContracts } from "@/lib/data/contracts"
import type { InstallmentView } from "@/lib/mock-data"
import { createInstallment, getInstallments, markInstallmentAsPaid } from "@/lib/data/installments"
import { isContratoEmJuridico } from "@/lib/juridico-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportCsv, featureInPreparation } from "@/lib/cta-actions"

function normalizeInstallment(item: Record<string, unknown>): InstallmentView {
  const amount = Number(item.amount ?? item.valor ?? item.value ?? 0)
  const status = String(item.status ?? "pending")

  return {
    id: String(item.id ?? ""),
    contratoId: String(item.contratoId ?? item.contract_id ?? ""),
    numero: Number(item.numero ?? item.number ?? 1),
    valor: amount,
    dataVencimento: String(item.dataVencimento ?? item.due_date ?? item.data_vencimento ?? ""),
    dataPagamento: item.payment_date || item.dataPagamento ? String(item.payment_date ?? item.dataPagamento) : undefined,
    formaPagamento: item.payment_method ? String(item.payment_method) : undefined,
    number: Number(item.number ?? item.numero ?? 1),
    totalParcelas: Number(item.totalParcelas ?? item.total_installments ?? 1),
    contractNumber: String(item.contractNumber ?? item.contract_number ?? item.numero_contrato ?? ""),
    clientName: String(item.clientName ?? item.client_name ?? item.nome_fantasia ?? ""),
    amount,
    dueDate: String(item.dueDate ?? item.due_date ?? item.data_vencimento ?? ""),
    paymentDate: item.paymentDate || item.payment_date ? String(item.paymentDate ?? item.payment_date) : undefined,
    status,
  }
}

export function ParcelasContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [parcelas, setParcelas] = useState<InstallmentView[]>([])
  const [selectedParcela, setSelectedParcela] = useState<InstallmentView | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [contracts, setContracts] = useState<Array<Record<string, unknown>>>([])
  const [generateForm, setGenerateForm] = useState({
    contract_id: "",
    client_name: "",
    total_value: "",
    installments_count: "",
    entry_value: "",
    installment_value: "",
    first_due_date: "",
    due_day: "",
    status: "open",
    auto_fees: "no",
    notes: "",
  })
  const [generateErrors, setGenerateErrors] = useState<Record<string, string>>({})
  const [generateLoading, setGenerateLoading] = useState(false)

  useEffect(() => {
    getInstallments().then((items) => setParcelas(items.map((item) => normalizeInstallment(item as Record<string, unknown>))))
    getContracts().then((items) => setContracts(items as Array<Record<string, unknown>>))
  }, [])

  const setGenerateField = (field: keyof typeof generateForm, value: string) => {
    setGenerateForm((current) => ({ ...current, [field]: value }))
    setGenerateErrors((current) => ({ ...current, [field]: "" }))
  }

  const selectedContract = contracts.find((contract) => String(contract.id ?? "") === generateForm.contract_id)
  const totalValue = Number(generateForm.total_value || selectedContract?.total_value || selectedContract?.monthly_value || 0)
  const entryValue = Number(generateForm.entry_value || 0)
  const installmentsCount = Number(generateForm.installments_count || 0)
  const installmentValue = Number(generateForm.installment_value || (installmentsCount ? (totalValue - entryValue) / installmentsCount : 0))
  const lastDueDate = generateForm.first_due_date && installmentsCount > 0
    ? new Date(new Date(generateForm.first_due_date).setMonth(new Date(generateForm.first_due_date).getMonth() + installmentsCount - 1))
    : null

  const handleGenerateInstallments = async () => {
    const nextErrors: Record<string, string> = {}
    if (!generateForm.contract_id) nextErrors.contract_id = "Selecione o contrato."
    if (!installmentsCount) nextErrors.installments_count = "Informe a quantidade."
    if (!installmentValue) nextErrors.installment_value = "Informe o valor por parcela."
    if (!generateForm.first_due_date) nextErrors.first_due_date = "Informe o primeiro vencimento."
    setGenerateErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setGenerateLoading(true)
    try {
      const createdItems: InstallmentView[] = []
      for (let index = 0; index < installmentsCount; index += 1) {
        const dueDate = new Date(generateForm.first_due_date)
        dueDate.setMonth(dueDate.getMonth() + index)
        if (generateForm.due_day) dueDate.setDate(Number(generateForm.due_day))

        const created = await createInstallment({
          contract_id: generateForm.contract_id,
          contract_number: String(selectedContract?.number ?? selectedContract?.numero ?? generateForm.contract_id),
          client_name: generateForm.client_name || String(selectedContract?.client_name ?? selectedContract?.clientName ?? ""),
          number: index + 1,
          total_installments: installmentsCount,
          amount: installmentValue,
          due_date: dueDate.toISOString().slice(0, 10),
          status: generateForm.status,
          auto_fees: generateForm.auto_fees === "yes",
          notes: generateForm.notes,
        })
        createdItems.push(normalizeInstallment(created as Record<string, unknown>))
      }
      setParcelas((current) => [...createdItems, ...current])
      setGenerateOpen(false)
      toast.success("Parcelas geradas com sucesso")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar as parcelas.")
    } finally {
      setGenerateLoading(false)
    }
  }

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

  const handleView = (parcela: InstallmentView) => {
    setSelectedParcela(parcela)
    setDetailsOpen(true)
  }

  const handleReceive = (parcela: InstallmentView) => {
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
          <Button variant="outline" onClick={() => exportCsv("gate-parcelas.csv", filteredParcelas.map((parcela) => ({
            id: parcela.id,
            contrato: parcela.contractNumber,
            cliente: parcela.clientName,
            vencimento: parcela.dueDate,
            valor: parcela.amount,
            status: parcela.status,
          })))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setGenerateOpen(true)}>
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
                          <DropdownMenuItem onClick={() => toast.info("Renegociação aberta")}>
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
                          <DropdownMenuItem onClick={() => featureInPreparation("Envio automático para o jurídico está em preparação.")}>
                            <Scale className="mr-2 h-4 w-4" />
                            Enviar para jurídico
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => featureInPreparation("Anexo de comprovante por parcela está em preparação.")}>
                          <Receipt className="mr-2 h-4 w-4" />
                          Anexar comprovante
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => featureInPreparation("Geração de recibo está em preparação.")}>
                          <Download className="mr-2 h-4 w-4" />
                          Gerar recibo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Edição aberta")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredParcelas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center">
                    <div className="space-y-1">
                      <p className="font-medium">Nenhuma parcela cadastrada ainda.</p>
                      <p className="text-sm text-muted-foreground">Crie um contrato ou gere parcelas para começar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da parcela</DialogTitle>
            <DialogDescription>Informações da cobrança selecionada</DialogDescription>
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

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Parcelas</DialogTitle>
            <DialogDescription>Informe os dados para criar as parcelas no Supabase.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Contrato *</Label>
                <Select
                  value={generateForm.contract_id}
                  onValueChange={(value) => {
                    const contract = contracts.find((item) => String(item.id ?? "") === value)
                    setGenerateForm((current) => ({
                      ...current,
                      contract_id: value,
                      client_name: String(contract?.client_name ?? contract?.clientName ?? ""),
                      total_value: String(contract?.total_value ?? contract?.valor_total ?? ""),
                    }))
                    setGenerateErrors((current) => ({ ...current, contract_id: "" }))
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
                  <SelectContent>
                    {contracts.length > 0 ? contracts.map((contract) => (
                      <SelectItem key={String(contract.id)} value={String(contract.id)}>
                        {String(contract.number ?? contract.numero ?? contract.id)}
                      </SelectItem>
                    )) : <SelectItem value="empty" disabled>Nenhum registro encontrado</SelectItem>}
                  </SelectContent>
                </Select>
                {generateErrors.contract_id && <p className="text-xs text-destructive">{generateErrors.contract_id}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Input value={generateForm.client_name} onChange={(event) => setGenerateField("client_name", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Valor total do contrato em R$</Label>
                <Input type="number" step="0.01" value={generateForm.total_value} onChange={(event) => setGenerateField("total_value", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Quantidade de parcelas *</Label>
                <Input type="number" min="1" value={generateForm.installments_count} onChange={(event) => setGenerateField("installments_count", event.target.value)} />
                {generateErrors.installments_count && <p className="text-xs text-destructive">{generateErrors.installments_count}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Valor de entrada em R$</Label>
                <Input type="number" step="0.01" value={generateForm.entry_value} onChange={(event) => setGenerateField("entry_value", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Valor de cada parcela em R$ *</Label>
                <Input type="number" step="0.01" value={generateForm.installment_value} onChange={(event) => setGenerateField("installment_value", event.target.value)} placeholder={installmentValue ? String(installmentValue.toFixed(2)) : ""} />
                {generateErrors.installment_value && <p className="text-xs text-destructive">{generateErrors.installment_value}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Primeiro vencimento *</Label>
                <Input type="date" value={generateForm.first_due_date} onChange={(event) => setGenerateField("first_due_date", event.target.value)} />
                {generateErrors.first_due_date && <p className="text-xs text-destructive">{generateErrors.first_due_date}</p>}
              </div>
              <div className="grid gap-2">
                <Label>Dia fixo de vencimento</Label>
                <Input type="number" min="1" max="31" value={generateForm.due_day} onChange={(event) => setGenerateField("due_day", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Status inicial</Label>
                <Select value={generateForm.status} onValueChange={(value) => setGenerateField("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberta</SelectItem>
                    <SelectItem value="pending">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Aplicar multa/juros automáticos?</Label>
                <Select value={generateForm.auto_fees} onValueChange={(value) => setGenerateField("auto_fees", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Observações</Label>
                <Input value={generateForm.notes} onChange={(event) => setGenerateField("notes", event.target.value)} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium">Resumo automático</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <span>Total a parcelar: {formatCurrency(Math.max(totalValue - entryValue, 0))}</span>
                <span>Quantidade de parcelas: {installmentsCount || 0}</span>
                <span>Valor por parcela: {formatCurrency(installmentValue || 0)}</span>
                <span>Primeiro vencimento: {generateForm.first_due_date || "-"}</span>
                <span>Último vencimento: {lastDueDate ? lastDueDate.toLocaleDateString("pt-BR") : "-"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)} disabled={generateLoading}>Cancelar</Button>
            <Button onClick={handleGenerateInstallments} disabled={generateLoading}>
              {generateLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receber parcela</DialogTitle>
            <DialogDescription>Registro de pagamento</DialogDescription>
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
                  onClick={async () => {
                    await markInstallmentAsPaid(
                      selectedParcela.id,
                      selectedParcela.amount,
                      new Date().toISOString().slice(0, 10)
                    )
                    setParcelas((current) =>
                      current.map((item) =>
                        item.id === selectedParcela.id ? { ...item, status: "paid" } : item
                      )
                    )
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
