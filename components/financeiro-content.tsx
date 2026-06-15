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
import { createBankAccount, createFinancialEntry, getFinancialEntries, getFinancialSelectOptions } from "@/lib/data/financial"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getInstallments, markInstallmentAsPaid } from "@/lib/data/installments"
import { uploadDocumentFile } from "@/lib/data/documents"
import { exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildFinancialEntriesReport } from "@/lib/reports/report-builders"
import {
  calculateMonthlyExpense,
  calculateMonthlyRevenueMetrics,
} from "@/lib/data/recurring-revenue"
import {
  financialStatusValues,
  getFinancialStatusForEntry,
  getFinancialStatusLabel,
  normalizeFinancialStatus,
  type FinancialStatus,
} from "@/lib/data/financial-status"
import { bankAccountLabel, clientLabel, dreCategoryLabel } from "@/lib/data/display-labels"
import type { SupabaseRow } from "@/lib/supabase/types"
import {
  attachmentTypes,
  paymentMethods,
} from "@/lib/dre-store"

const bankConnections = [
  { name: "Banco Itaú CNPJ", balance: 0, status: "Pendente", lastSync: "Sem sincronização" },
  { name: "Aplicação", balance: 0, status: "Pendente", lastSync: "Sem sincronização" },
  { name: "Caixa", balance: 0, status: "Manual", lastSync: "Sem sincronização" },
]

const financialTypeOptions = [
  { label: "Receita", value: "receita" },
  { label: "Despesa", value: "despesa" },
] as const

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

type BankAccountForm = {
  name: string
  bankName: string
  agency: string
  accountNumber: string
  accountType: string
  openingBalance: string
  isActive: string
}

type TransactionRow = {
  id: string
  type: string
  category: string
  description: string
  amount: number
  date: string
  status: FinancialStatus
  contractId?: string
}

function normalizeFinancialEntry(item: Record<string, unknown>): TransactionRow {
  const type = String(item.type ?? "").trim().toLowerCase()

  return {
    id: String(item.id ?? crypto.randomUUID()),
    type: ["receita", "income", "entrada"].includes(type) ? "income" : "expense",
    category: String(item.dre_category_name ?? item.category ?? item.categoria ?? ""),
    description: String(item.description ?? item.descricao ?? ""),
    amount: Number(item.value ?? item.amount ?? item.valor ?? 0),
    date: String(item.competence_date ?? item.date ?? item.data ?? ""),
    status: normalizeFinancialStatus(item.status),
    contractId: item.contract_id ? String(item.contract_id) : undefined,
  }
}

function normalizeFinancialEntryWithLabels(item: SupabaseRow, categories: SupabaseRow[]): TransactionRow {
  const base = normalizeFinancialEntry(item)
  const categoryId = String(item.dre_category_id ?? "")
  const category = categories.find((row) => String(row.id ?? "") === categoryId)
  return {
    ...base,
    category: category ? dreCategoryLabel(category) : categoryId ? "Sem categoria" : "Sem categoria",
  }
}

function getInstallmentAmount(item: SupabaseRow) {
  return Number(item.updated_value ?? item.original_value ?? item.installment_value ?? item.amount ?? item.value ?? 0)
}

function isOpenInstallment(item: SupabaseRow) {
  return String(item.status ?? "").toLowerCase() === "aberta" && !item.payment_date
}

const initialLaunchForm: NewLaunchForm = {
  type: "receita",
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

const initialBankAccountForm: BankAccountForm = {
  name: "",
  bankName: "",
  agency: "",
  accountNumber: "",
  accountType: "corrente",
  openingBalance: "0",
  isActive: "true",
}

function NewBankAccountDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<BankAccountForm>(initialBankAccountForm)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const setField = (field: keyof BankAccountForm, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value ?? "" }))
    setErrorMessage("")
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrorMessage("Informe o nome da conta.")
      return
    }

    const openingBalance = Number(form.openingBalance.replace(",", ".") || 0)
    if (!Number.isFinite(openingBalance)) {
      setErrorMessage("Informe um saldo inicial valido.")
      return
    }

    setSaving(true)
    try {
      await createBankAccount({
        name: form.name,
        bank_name: form.bankName || null,
        agency: form.agency || null,
        account_number: form.accountNumber || null,
        account_type: form.accountType,
        opening_balance: openingBalance,
        current_balance: openingBalance,
        is_active: form.isActive === "true",
      })
      toast.success("Conta bancaria cadastrada.")
      setForm(initialBankAccountForm)
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel cadastrar a conta bancaria."
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Landmark className="mr-2 h-4 w-4" />
        Cadastrar conta
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar conta bancaria</DialogTitle>
            <DialogDescription>Cadastro manual salvo em bank_accounts. Sem conexao bancaria real.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nome da conta</Label>
              <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Banco</Label>
              <Input value={form.bankName} onChange={(event) => setField("bankName", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Agencia</Label>
              <Input value={form.agency} onChange={(event) => setField("agency", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Numero da conta</Label>
              <Input value={form.accountNumber} onChange={(event) => setField("accountNumber", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo da conta</Label>
              <Select value={form.accountType} onValueChange={(value) => setField("accountType", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupanca</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Saldo inicial</Label>
              <Input type="number" value={form.openingBalance} onChange={(event) => setField("openingBalance", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Ativa</Label>
              <Select value={form.isActive} onValueChange={(value) => setField("isActive", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Nao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorMessage && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                {errorMessage}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar conta"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NewLaunchDialog({ onCreated }: { onCreated: () => void | Promise<void> }) {
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
    if (!open) return

    Promise.all([getFinancialSelectOptions(), getClients()]).then(([options, clients]) => {
      const option = (item: unknown): SelectOption => {
        const record = item as Record<string, unknown>
        return {
          label: dreCategoryLabel(record),
          value: String(record.id ?? ""),
        }
      }
      const bankOption = (item: unknown): SelectOption => {
        const record = item as Record<string, unknown>
        return { label: bankAccountLabel(record), value: String(record.id ?? "") }
      }
      const clientOption = (item: unknown): SelectOption => {
        const record = item as Record<string, unknown>
        return { label: clientLabel(record), value: String(record.id ?? "") }
      }
      setSelectOptions({
        dreCategories: options.dreCategories.map(option).filter((item) => item.value),
        bankAccounts: options.bankAccounts.map(bankOption).filter((item) => item.value),
        clients: clients.map(clientOption).filter((item) => item.value),
      })
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar as categorias DRE.")
    })
  }, [open])

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
        status: getFinancialStatusForEntry(form.type, Boolean(form.paymentDate)),
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
            type: "comprovante",
          },
        })
      }
      await onCreated()
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
            {renderSelect("type", "Tipo de lançamento", financialTypeOptions)}
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
  const [rawFinancialEntries, setRawFinancialEntries] = useState<SupabaseRow[]>([])
  const [contracts, setContracts] = useState<SupabaseRow[]>([])
  const [clients, setClients] = useState<SupabaseRow[]>([])
  const [installments, setInstallments] = useState<SupabaseRow[]>([])

  const loadFinanceData = async () => {
    const [entries, contractRows, installmentRows, clientRows, options] = await Promise.all([
      getFinancialEntries(),
      getContracts(),
      getInstallments(),
      getClients(),
      getFinancialSelectOptions(),
    ])
    const categories = (options.dreCategories ?? []) as SupabaseRow[]
    setRawFinancialEntries(entries as SupabaseRow[])
    setFinancialEntries((entries as SupabaseRow[]).map((item) => normalizeFinancialEntryWithLabels(item, categories)))
    setContracts(contractRows as SupabaseRow[])
    setInstallments(installmentRows as SupabaseRow[])
    setClients(clientRows as SupabaseRow[])
  }

  useEffect(() => {
    let active = true
    Promise.resolve().then(async () => {
      try {
        await loadFinanceData()
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar o financeiro.")
      }
    })

    return () => {
      active = false
    }
  }, [])

  const allTransactions = financialEntries
  const currentRevenue = calculateMonthlyRevenueMetrics(contracts, rawFinancialEntries)
  const currentMonthKey = currentRevenue.monthKey
  const clientById = new Map(clients.map((client) => [String(client.id ?? ""), client]))
  const contractById = new Map(contracts.map((contract) => [String(contract.id ?? ""), contract]))
  const currentMonthTransactions = allTransactions.filter((transaction) => transaction.date.slice(0, 7) === currentMonthKey)
  const chartRows = allTransactions.reduce((acc, transaction) => {
    const month = transaction.date ? transaction.date.slice(0, 7) : "Sem data"
    const current = acc.get(month) ?? { month, receitas: 0, despesas: 0, balance: 0 }
    if (transaction.type === "income" && transaction.status === "recebido") {
      current.receitas += transaction.amount
      current.balance += transaction.amount
    } else if (transaction.type === "expense") {
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

  const totalReceitas = currentRevenue.totalRevenue
  
  const totalDespesas = calculateMonthlyExpense(rawFinancialEntries, currentMonthKey)
  const pendingReceivables = currentMonthTransactions.filter((t) => t.type === "income" && ["a_receber", "parcial"].includes(t.status))
  const pendingPayables = currentMonthTransactions.filter((t) => t.type === "expense" && ["a_pagar", "parcial"].includes(t.status))
  const installmentReceivables = installments
    .filter(isOpenInstallment)
    .map((installment) => {
      const contract = contractById.get(String(installment.contract_id ?? ""))
      const client = clientById.get(String(installment.client_id ?? ""))
      return {
        id: String(installment.id ?? ""),
        contractId: String(installment.contract_id ?? ""),
        clientId: String(installment.client_id ?? ""),
        description: `Parcela ${String(installment.installment_number ?? "")} - ${String(contract?.contract_number ?? "Contrato")}`,
        clientName: client ? clientLabel(client) : "Cliente nao informado",
        contractNumber: String(contract?.contract_number ?? "Contrato"),
        date: String(installment.due_date ?? ""),
        amount: getInstallmentAmount(installment),
      }
    })
  const pendingReceivableAmount =
    pendingReceivables.reduce((sum, t) => sum + t.amount, 0) +
    installmentReceivables.reduce((sum, item) => sum + item.amount, 0)

  const saldo = totalReceitas - totalDespesas

  const confirmInstallmentReceipt = async (item: (typeof installmentReceivables)[number]) => {
    const today = new Date().toISOString().slice(0, 10)
    const paymentDate = window.prompt("Data de recebimento (AAAA-MM-DD)", today)
    if (!paymentDate) return

    try {
      await markInstallmentAsPaid(item.id, item.amount, paymentDate)
      await createFinancialEntry({
        type: "receita",
        status: "recebido",
        description: `Recebimento contrato ${item.contractNumber} - ${item.clientName}`,
        value: item.amount,
        amount: item.amount,
        competence_date: paymentDate,
        due_date: item.date || null,
        payment_date: paymentDate,
        client_id: item.clientId || null,
        contract_id: item.contractId || null,
        installment_id: item.id,
      })
      await loadFinanceData()
      toast.success("Recebimento confirmado e lancamento financeiro criado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel confirmar o recebimento.")
    }
  }

  const getStatusBadge = (status: FinancialStatus) => {
    switch (status) {
      case "recebido":
      case "pago":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{getFinancialStatusLabel(status)}</Badge>
      case "a_receber":
      case "a_pagar":
      case "parcial":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{getFinancialStatusLabel(status)}</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{getFinancialStatusLabel(status)}</Badge>
      default:
        return <Badge variant="secondary">{getFinancialStatusLabel(status)}</Badge>
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
          <NewBankAccountDialog />
          <Button variant="outline" onClick={() => exportPdfReport(buildFinancialEntriesReport([
            ...installmentReceivables.map((installment) => ({
              id: installment.id,
              date: installment.date,
              description: installment.description,
              categoria: "Parcela de contrato",
              type: "income",
              status: "a_receber",
              amount: installment.amount,
            })),
            ...filteredTransactions.map((transaction) => ({
            id: transaction.id,
            date: transaction.date,
            description: transaction.description,
            categoria: transaction.category,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount,
          })),
          ]))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NewLaunchDialog onCreated={loadFinanceData} />
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
              Recebido em financial_entries
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
              {pendingReceivables.length + installmentReceivables.length} recebiveis pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro operacional</CardTitle>
          <CardDescription>Receita recorrente prevista por contratos ativos e receitas realizadas no mes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {[
              ["Receita prevista por contratos", formatCurrency(currentRevenue.contractExpectedRevenue)],
              ["Receita realizada", formatCurrency(currentRevenue.financialRealizedRevenue)],
              ["Receita pendente lancada", formatCurrency(currentRevenue.financialPendingRevenue)],
              ["Contratos ativos", currentRevenue.activeContracts.length],
              ["Parcelas abertas", installmentReceivables.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                    {financialStatusValues.map((status) => (
                      <SelectItem key={status} value={status}>{getFinancialStatusLabel(status)}</SelectItem>
                    ))}
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
                            <DropdownMenuItem onClick={() => featureInPreparation("A visualização detalhada do lançamento ainda precisa de modal persistente dedicado.")}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => featureInPreparation("A edição de lançamentos financeiros ainda precisa de validação de caixa, anexos e DRE.")}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => featureInPreparation("A exclusão de lançamentos financeiros exige trilha de auditoria e recálculo da DRE.")}
                            >
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
                  <Badge className="bg-emerald-100 text-emerald-700">{pendingReceivables.length + installmentReceivables.length} pendentes</Badge>
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
                  {installmentReceivables.map((item) => (
                    <div key={`installment-${item.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.clientName} - vence em {formatDate(item.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{formatCurrency(item.amount)}</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => confirmInstallmentReceipt(item)}>
                          Confirmar recebimento
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
