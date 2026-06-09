"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Download,
  Landmark,
  Upload,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { createFinancialEntry, getFinancialEntries, getFinancialSelectOptions } from "@/lib/data/financial"
import { getClients } from "@/lib/data/clients"
import { uploadDocumentFile } from "@/lib/data/documents"
import { exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildFinancialEntriesReport } from "@/lib/reports/report-builders"
import {
  attachmentTypes,
  launchTypes,
  paymentMethods,
} from "@/lib/dre-store"

const bankConnections = [
  { name: "Banco Itaú CNPJ", balance: 0, status: "Pendente", lastSync: "Sem sincronização" },
  { name: "Aplicação", balance: 0, status: "Pendente", lastSync: "Sem sincronização" },
  { name: "Caixa", balance: 0, status: "Manual", lastSync: "Sem sincronização" },
]

type SelectOption = { label: string; value: string }

type NewLaunchForm = {
  type: string
  description: string
  amount: string
  dueDate: string
  paymentDate: string
  dreCategoryId: string
  bankAccountId: string
  clientId: string
  paymentMethod: string
  attachment: string
}

type TransactionRow = {
  id: string
  type: string
  category: string
  description: string
  amount: number
  date: string
  status: string
}

function normalizeFinancialEntry(item: Record<string, unknown>): TransactionRow {
  const type = String(item.type ?? "")
  const status = String(item.status ?? "")

  return {
    id: String(item.id ?? crypto.randomUUID()),
    type: type === "Receita" || type === "income" ? "income" : "expense",
    category: String(item.dre_category_name ?? item.category ?? item.categoria ?? ""),
    description: String(item.description ?? item.descricao ?? ""),
    amount: Number(item.value ?? item.amount ?? item.valor ?? 0),
    date: String(item.competence_date ?? item.date ?? item.data ?? ""),
    status: status === "Cancelado" || status === "cancelled" ? "cancelled" : status.includes("pagar") || status.includes("receber") || status === "pending" ? "pending" : "completed",
  }
}

const initialLaunchForm: NewLaunchForm = {
  type: "Receita",
  description: "",
  amount: "",
  dueDate: "",
  paymentDate: "",
  bankAccountId: "",
  dreCategoryId: "",
  clientId: "",
  paymentMethod: "PIX",
  attachment: "Comprovante",
}

function NewLaunchDialog({ onCreated }: { onCreated: (entry: TransactionRow) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NewLaunchForm>(initialLaunchForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [selectOptions, setSelectOptions] = useState({
    dreCategories: [] as SelectOption[],
    bankAccounts: [] as SelectOption[],
    clients: [] as SelectOption[],
  })

  useEffect(() => {
    Promise.all([getFinancialSelectOptions(), getClients()]).then(([options, clients]) => {
      const option = (item: unknown): SelectOption => {
        const record = item as Record<string, unknown>
        return {
          label: String(record.name ?? record.nome ?? record.label ?? record.description ?? record.id ?? ""),
          value: String(record.id ?? ""),
        }
      }
      setSelectOptions({
        dreCategories: options.dreCategories.map(option).filter((item) => item.value),
        bankAccounts: options.bankAccounts.map(option).filter((item) => item.value),
        clients: clients.map(option).filter((item) => item.value),
      })
    })
  }, [])

  const setField = (field: keyof NewLaunchForm, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value ?? "" }))
    setErrors((current) => ({ ...current, [field]: "" }))
    setSubmitError("")
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.type) nextErrors.type = "Informe o tipo."
    if (!form.description.trim()) nextErrors.description = "Informe a descrição."
    if (!Number(form.amount.replace(",", "."))) nextErrors.amount = "Informe um valor válido."
    if (!form.dueDate) nextErrors.dueDate = "Informe a data de vencimento."
    if (!form.dreCategoryId) nextErrors.dreCategoryId = "Selecione a categoria DRE."
    if (!form.bankAccountId) nextErrors.bankAccountId = "Selecione a conta bancária."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const amount = Number(form.amount.replace(",", "."))
    setSaving(true)
    setSubmitError("")
    try {
      const created = await createFinancialEntry({
        type: form.type,
        status: form.paymentDate ? "Recebido" : "A receber",
        description: form.description,
        value: amount,
        competence_date: form.dueDate,
        due_date: form.dueDate || null,
        payment_date: form.paymentDate || null,
        bank_account_id: form.bankAccountId,
        dre_category_id: form.dreCategoryId,
        client_id: form.clientId || null,
        payment_method: form.paymentMethod,
        attachment_type: form.attachment,
      })
      if (attachmentFile) {
        await uploadDocumentFile({
          bucket: "gate-documents",
          file: attachmentFile,
          folder: `financial/${String((created as Record<string, unknown>).id ?? "entry")}`,
          record: {
            financial_entry_id: String((created as Record<string, unknown>).id ?? ""),
            category: form.attachment || "Comprovante",
          },
        })
      }
      onCreated(normalizeFinancialEntry(created as Record<string, unknown>))
      toast.success("Lançamento salvo e DRE atualizado")
      setForm(initialLaunchForm)
      setAttachmentFile(null)
      setErrors({})
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o lançamento."
      console.error("[financeiro] Falha ao salvar lançamento", error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const renderSelect = (field: keyof NewLaunchForm, label: string, options: readonly (string | SelectOption)[]) => (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={String(form[field])} onValueChange={(value) => setField(field, value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const item = typeof option === "string" ? { label: option, value: option } : option
            return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          })}
        </SelectContent>
      </Select>
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  )

  const renderInput = (field: keyof NewLaunchForm, label: string, type = "text") => (
    <div className="grid gap-2">
      <Label htmlFor={`new-launch-${field}`}>{label}</Label>
      <Input
        id={`new-launch-${field}`}
        type={type}
        value={String(form[field])}
        onChange={(event) => setField(field, event.target.value)}
      />
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Lançamento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
            <DialogDescription>O lançamento entra no mês da competência e alimenta a linha escolhida da DRE.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {renderSelect("type", "Tipo de lançamento", launchTypes)}
            {renderInput("description", "Descrição")}
            {renderInput("amount", "Valor", "number")}
            {renderInput("dueDate", "Data de vencimento", "date")}
            {renderInput("paymentDate", "Data de pagamento", "date")}
            {renderSelect("dreCategoryId", "Categoria DRE", selectOptions.dreCategories)}
            {renderSelect("bankAccountId", "Conta bancária", selectOptions.bankAccounts)}
            {renderSelect("clientId", "Cliente ou fornecedor", selectOptions.clients)}
            {renderSelect("paymentMethod", "Forma de pagamento", paymentMethods)}
            {renderSelect("attachment", "Tipo de anexo", attachmentTypes)}
            <div className="grid gap-2">
              <Label htmlFor="new-launch-file">Arquivo anexado</Label>
              <Input id="new-launch-file" type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)} />
            </div>
            {submitError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                {submitError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar lançamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function FinanceiroContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [financialEntries, setFinancialEntries] = useState<TransactionRow[]>([])

  useEffect(() => {
    getFinancialEntries().then((items) =>
      setFinancialEntries(items.map((item) => normalizeFinancialEntry(item as Record<string, unknown>)))
    )
  }, [])
  const allTransactions = financialEntries
  const chartRows = allTransactions.reduce((acc, transaction) => {
    const month = transaction.date ? transaction.date.slice(0, 7) : "Sem data"
    const current = acc.get(month) ?? { month, receitas: 0, despesas: 0, balance: 0 }
    if (transaction.type === "income") {
      current.receitas += transaction.amount
      current.balance += transaction.amount
    } else {
      current.despesas += transaction.amount
      current.balance -= transaction.amount
    }
    acc.set(month, current)
    return acc
  }, new Map<string, { month: string; receitas: number; despesas: number; balance: number }>())
  const monthlyData = Array.from(chartRows.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
  const cashFlowData = monthlyData.reduce((items, item) => {
    const previous = items.at(-1)?.balance ?? 0
    items.push({ date: item.month, balance: previous + item.balance })
    return items
  }, [] as Array<{ date: string; balance: number }>)

  const filteredTransactions = allTransactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || t.type === typeFilter
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalReceitas = allTransactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalDespesas = allTransactions
    .filter((t) => t.type === "expense" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)
  const pendingReceivables = allTransactions.filter((t) => t.type === "income" && t.status === "pending")
  const pendingPayables = allTransactions.filter((t) => t.type === "expense" && t.status === "pending")
  const pendingReceivableAmount = pendingReceivables.reduce((sum, t) => sum + t.amount, 0)

  const saldo = totalReceitas - totalDespesas

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Concluído</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gestão de receitas, despesas e fluxo de caixa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildFinancialEntriesReport(filteredTransactions.map((transaction) => ({
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            categoria: transaction.category,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NewLaunchDialog onCreated={(entry) => setFinancialEntries((current) => [entry, ...current])} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas (mês)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceitas)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <ArrowUpRight className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Base financial_entries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas (mês)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <TrendingUp className="h-4 w-4" />
              Base financial_entries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(saldo)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Margem: {totalReceitas > 0 ? ((saldo / totalReceitas) * 100).toFixed(1) : "0.0"}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingReceivableAmount)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {pendingReceivables.length} faturas pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Conexões bancárias
              </CardTitle>
              <CardDescription>Integração futura para importação e conciliação.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => featureInPreparation("Conexão bancária/Open Finance ainda depende de integração futura.")}>
                <Landmark className="mr-2 h-4 w-4" />
                Conectar banco
              </Button>
              <Button variant="outline" onClick={() => featureInPreparation("Importação OFX/CSV completa ainda depende de parser e validação final.")}>
                <Upload className="mr-2 h-4 w-4" />
                Importar OFX/CSV
              </Button>
              <Button variant="outline" onClick={() => featureInPreparation("Conciliação bancária automática ainda depende do motor de conciliação.")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Conciliar lançamentos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {bankConnections.map((connection) => (
              <div key={connection.name} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{connection.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Última sincronização: {connection.lastSync}
                    </p>
                  </div>
                  <Badge
                    className={
                      connection.status === "Conectado"
                        ? "bg-emerald-100 text-emerald-700"
                        : connection.status === "Pendente"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                    }
                  >
                    {connection.status}
                  </Badge>
                </div>
                <p className="mt-4 text-2xl font-bold">{formatCurrency(connection.balance)}</p>
                <p className="text-xs text-muted-foreground">Status da conexão</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lancamentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="contas">Contas a Pagar/Receber</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar lançamentos..."
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
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.type === "income" ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <ArrowUpRight className="h-4 w-4" />
                            Receita
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <ArrowDownRight className="h-4 w-4" />
                            Despesa
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        transaction.type === "income" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
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
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
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

        <TabsContent value="fluxo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
                <CardDescription>Comparativo mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="receitas" fill="#22C55E" radius={[4, 4, 0, 0]} name="Receitas" />
                      <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} name="Despesas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Evolução do saldo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#22B8CF" 
                        strokeWidth={2}
                        dot={{ fill: "#22B8CF" }}
                        name="Saldo"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-emerald-600">Contas a Receber</CardTitle>
                    <CardDescription>Próximos vencimentos</CardDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">{pendingReceivables.length} pendentes</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReceivables.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">Vence em {formatDate(item.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatCurrency(item.amount)}</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          Registrar pagamento
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-red-600">Contas a Pagar</CardTitle>
                    <CardDescription>Próximos vencimentos</CardDescription>
                  </div>
                  <Badge className="bg-red-100 text-red-700">{pendingPayables.length} pendentes</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPayables.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">Vence em {formatDate(item.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(item.amount)}</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          Pagar conta
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
