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
import { transactions, cashFlowData } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { createFinancialEntry, getFinancialSelectOptions } from "@/lib/data/financial"
import { exportCsv, featureInPreparation } from "@/lib/cta-actions"
import {
  addDreLaunch,
  attachmentTypes,
  bankAccounts,
  costCenters,
  dreCategories,
  launchStatuses,
  launchTypes,
  paymentMethods,
  recurrenceOptions,
  useDreLaunches,
  type DreLaunch,
} from "@/lib/dre-store"

const monthlyData: Array<{ month: string; receitas: number; despesas: number }> = []

const bankConnections = [
  { name: "Banco Itaú CNPJ", balance: 0, status: "Pendente", lastSync: "Sem sincronização" },
  { name: "Aplicação", balance: 0, status: "Pendente", lastSync: "Sem sincronização" },
  { name: "Caixa", balance: 0, status: "Manual", lastSync: "Sem sincronização" },
]

type NewLaunchForm = Omit<DreLaunch, "id" | "amount"> & { amount: string }

const initialLaunchForm: NewLaunchForm = {
  type: "Receita",
  status: "Recebido",
  description: "",
  amount: "",
  competenceDate: "",
  dueDate: "",
  paymentDate: "",
  bankAccount: "Banco Itaú CNPJ",
  dreCategory: "",
  costCenter: "",
  party: "",
  paymentMethod: "PIX",
  recurrence: "Não se repete",
  tags: "",
  attachment: "Comprovante",
}

const parties: string[] = []

function NewLaunchDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NewLaunchForm>(initialLaunchForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [selectOptions, setSelectOptions] = useState({
    dreCategories: [] as string[],
    costCenters: [] as string[],
    bankAccounts: [] as string[],
  })

  useEffect(() => {
    getFinancialSelectOptions().then((options) => {
      const label = (item: unknown) => {
        const record = item as Record<string, unknown>
        return String(record.name ?? record.nome ?? record.label ?? record.description ?? "")
      }
      setSelectOptions({
        dreCategories: options.dreCategories.map(label).filter(Boolean),
        costCenters: options.costCenters.map(label).filter(Boolean),
        bankAccounts: options.bankAccounts.map(label).filter(Boolean),
      })
    })
  }, [])

  const setField = (field: keyof NewLaunchForm, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value ?? "" }))
    setErrors((current) => ({ ...current, [field]: "" }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.type) nextErrors.type = "Informe o tipo."
    if (!form.description.trim()) nextErrors.description = "Informe a descrição."
    if (!Number(form.amount.replace(",", "."))) nextErrors.amount = "Informe um valor válido."
    if (!form.competenceDate) nextErrors.competenceDate = "Informe a competência."
    if (!form.dreCategory) nextErrors.dreCategory = "Selecione a categoria DRE."
    if (!form.costCenter) nextErrors.costCenter = "Selecione o centro de custo/lucro."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const amount = Number(form.amount.replace(",", "."))
    await createFinancialEntry({
      type: form.type,
      status: form.status,
      description: form.description,
      value: amount,
      competence_date: form.competenceDate,
      due_date: form.dueDate || null,
      payment_date: form.paymentDate || null,
      bank_account_name: form.bankAccount,
      dre_category_name: form.dreCategory,
      cost_center_name: form.costCenter,
      party_name: form.party,
      payment_method: form.paymentMethod,
      recurrence: form.recurrence,
      tags: form.tags,
      attachment_type: form.attachment,
    })
    addDreLaunch({
      ...form,
      amount,
    })
    toast.success("Lançamento salvo e DRE atualizado")
    setForm(initialLaunchForm)
    setErrors({})
    setOpen(false)
  }

  const renderSelect = (field: keyof NewLaunchForm, label: string, options: readonly string[]) => (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={String(form[field])} onValueChange={(value) => setField(field, value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
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
            {renderSelect("status", "Status", launchStatuses)}
            {renderInput("description", "Descrição")}
            {renderInput("amount", "Valor", "number")}
            {renderInput("competenceDate", "Data de competência", "date")}
            {renderInput("dueDate", "Data de vencimento", "date")}
            {renderInput("paymentDate", "Data de pagamento", "date")}
            {renderSelect("bankAccount", "Conta bancária", bankAccounts)}
            {renderSelect("dreCategory", "Categoria DRE", dreCategories)}
            {renderSelect("costCenter", "Centro de custo/lucro", costCenters)}
            {renderSelect("party", "Cliente ou fornecedor", parties)}
            {renderSelect("paymentMethod", "Forma de pagamento", paymentMethods)}
            {renderSelect("recurrence", "Recorrência", recurrenceOptions)}
            {renderSelect("attachment", "Anexos", attachmentTypes)}
            <div className="md:col-span-2">
              {renderInput("tags", "Tags")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar lançamento</Button>
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
  const dreLaunches = useDreLaunches()
  const mockTransactions = dreLaunches.map((launch) => ({
    id: launch.id,
    type: launch.type === "Receita" || launch.type === "Aporte" ? "income" : "expense",
    category: launch.dreCategory,
    description: launch.description,
    amount: launch.amount,
    date: launch.competenceDate,
    status: launch.status === "Cancelado" ? "cancelled" : launch.status.includes("pagar") || launch.status.includes("receber") ? "pending" : "completed",
  }))
  const allTransactions = [...mockTransactions, ...transactions]

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
          <Button variant="outline" onClick={() => exportCsv("gate-lancamentos.csv", filteredTransactions.map((transaction) => ({
            id: transaction.id,
            data: transaction.date,
            descricao: transaction.description,
            categoria: transaction.category,
            tipo: transaction.type,
            status: transaction.status,
            valor: transaction.amount,
          })))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NewLaunchDialog />
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
              +12.5% vs. mês anterior
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
              +8.2% vs. mês anterior
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
              Margem: {((saldo / totalReceitas) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold">{formatCurrency(0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              0 faturas pendentes
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
                  <ResponsiveContainer width="100%" height="100%">
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
                  <ResponsiveContainer width="100%" height="100%">
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
                  <Badge className="bg-emerald-100 text-emerald-700">12 pendentes</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {([] as Array<{ client: string; amount: number; dueDate: string }>).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.client}</p>
                        <p className="text-sm text-muted-foreground">Vence em {item.dueDate}</p>
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
                  <Badge className="bg-red-100 text-red-700">8 pendentes</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {([] as Array<{ supplier: string; amount: number; dueDate: string }>).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.supplier}</p>
                        <p className="text-sm text-muted-foreground">Vence em {item.dueDate}</p>
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
