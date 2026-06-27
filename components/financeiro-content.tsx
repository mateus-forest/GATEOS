"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  Filter,
  Download,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { createBankAccount, createFinancialEntry, deleteFinancialEntry, getFinancialEntries, getFinancialSelectOptions, updateFinancialEntry } from "@/lib/data/financial"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getInstallments, markInstallmentAsPaid } from "@/lib/data/installments"
import { uploadDocumentFile } from "@/lib/data/documents"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildFinancialEntriesReport } from "@/lib/reports/report-builders"
import {
  calculateMonthlyExpense,
  calculateMonthlyRevenueMetrics,
} from "@/lib/data/recurring-revenue"
import {
  financialStatusValues,
  getFinancialStatusForEntry,
  getFinancialStatusLabel,
  isFinancialStatusReceived,
  normalizeFinancialStatus,
  type FinancialStatus,
} from "@/lib/data/financial-status"
import { bankAccountLabel, clientLabel, dreCategoryLabel } from "@/lib/data/display-labels"
import type { SupabaseRow } from "@/lib/supabase/types"
import {
  attachmentTypes,
  paymentMethods,
} from "@/lib/dre-store"

const financialTypeOptions = [
  { label: "Receita", value: "receita" },
  { label: "Despesa", value: "despesa" },
] as const

const transactionTypeFilterOptions = [
  { label: "Todos", value: "all" },
  { label: "Receita", value: "income" },
  { label: "Despesa", value: "expense" },
] as const

const transactionStatusFilterOptions = [
  { label: "Todos", value: "all" },
  ...financialStatusValues.map((status) => ({ label: getFinancialStatusLabel(status), value: status })),
]

const recurrenceTypeOptions = [
  { label: "Nao se repete", value: "none" },
  { label: "Mais de uma vez", value: "fixed" },
  { label: "Sempre", value: "infinite" },
] as const

const recurrenceIntervalOptions = [
  { label: "Mensal", value: "monthly" },
  { label: "Semanal", value: "weekly" },
  { label: "Quinzenal", value: "biweekly" },
  { label: "Bimestral", value: "bimonthly" },
  { label: "Trimestral", value: "quarterly" },
  { label: "Semestral", value: "semiannual" },
  { label: "Anual", value: "annual" },
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
  recurrenceType: string
  recurrenceInterval: string
  recurrenceCount: string
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
  dueDate: string
  paymentDate: string
  status: FinancialStatus
  bankAccountId?: string
  clientId?: string
  dreCategoryId?: string
  paymentMethod?: string
  contractId?: string
}

type PeriodMode = "month" | "year"

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function addMonthsClamped(date: Date, months: number) {
  const target = new Date(date)
  const originalDay = target.getDate()
  target.setDate(1)
  target.setMonth(target.getMonth() + months)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(originalDay, lastDay))
  return target
}

function addRecurrenceInterval(date: Date, interval: string, index: number) {
  const target = new Date(date)
  switch (interval) {
    case "weekly":
      target.setDate(target.getDate() + 7 * index)
      return target
    case "biweekly":
      target.setDate(target.getDate() + 15 * index)
      return target
    case "bimonthly":
      return addMonthsClamped(date, 2 * index)
    case "quarterly":
      return addMonthsClamped(date, 3 * index)
    case "semiannual":
      return addMonthsClamped(date, 6 * index)
    case "annual":
      return addMonthsClamped(date, 12 * index)
    case "monthly":
    default:
      return addMonthsClamped(date, index)
  }
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
    dueDate: String(item.due_date ?? item.vencimento ?? item.competence_date ?? ""),
    paymentDate: String(item.payment_date ?? ""),
    status: normalizeFinancialStatus(item.status),
    bankAccountId: item.bank_account_id ? String(item.bank_account_id) : undefined,
    clientId: item.client_id ? String(item.client_id) : undefined,
    dreCategoryId: item.dre_category_id ? String(item.dre_category_id) : undefined,
    paymentMethod: item.payment_method ? String(item.payment_method) : undefined,
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

function getBankConnectionStatus(account: SupabaseRow) {
  if (account.open_finance_connected === true) return "Conectado"
  if (account.is_active === false) return "Inativa"
  return "Manual"
}

function getBankConnectionBalance(account: SupabaseRow) {
  const value = account.current_balance ?? account.opening_balance ?? 0
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function getFriendlyBankAccountLabel(account: SupabaseRow) {
  const parts = [
    String(account.name ?? "").trim(),
    String(account.bank_name ?? "").trim(),
    String(account.account_number ?? "").trim(),
  ].filter(Boolean)
  const uniqueParts = parts.filter((part, index) =>
    parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index
  )
  return uniqueParts.join(" - ") || "Conta sem nome"
}

function getEntryStatusForOpen(type: string): FinancialStatus {
  return String(type).toLowerCase() === "despesa" ? "a_pagar" : "a_receber"
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

function rowMatchesPeriod(dateValue: string, mode: PeriodMode, selectedMonth: string, selectedYear: string) {
  if (!dateValue) return false
  return mode === "month" ? dateValue.slice(0, 7) === selectedMonth : dateValue.slice(0, 4) === selectedYear
}

function periodDate(mode: PeriodMode, selectedMonth: string, selectedYear: string) {
  return new Date(`${mode === "month" ? selectedMonth : `${selectedYear}-01`}-01T00:00:00`)
}

function getBankLastSync(account: SupabaseRow) {
  const value = String(account.last_sync_at ?? "")
  return value ? new Date(value).toLocaleString("pt-BR") : "Sem sincronizacao"
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
  recurrenceType: "none",
  recurrenceInterval: "monthly",
  recurrenceCount: "2",
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
        return { label: getFriendlyBankAccountLabel(record), value: String(record.id ?? "") }
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
    if (form.recurrenceType !== "none" && !form.recurrenceInterval) {
      nextErrors.recurrenceInterval = "Selecione a periodicidade."
    }
    if (form.recurrenceType === "fixed") {
      const count = Number(form.recurrenceCount)
      if (!Number.isInteger(count) || count <= 1) {
        nextErrors.recurrenceCount = "Informe um numero inteiro maior que 1."
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const amount = Number(form.amount.replace(",", "."))

    if (form.recurrenceType === "infinite") {
      const message = "Recorrencia continua ainda nao esta habilitada nesta versao."
      setSubmitError(message)
      toast.error(message)
      return
    }

    setSaving(true)
    setSubmitError("")
    try {
      const recurrenceCount = form.recurrenceType === "fixed" ? Number(form.recurrenceCount) : 1
      const baseDate = parseLocalDate(form.dueDate)

      if (!baseDate) {
        const message = "Informe uma data de vencimento valida para calcular a recorrencia."
        setSubmitError(message)
        toast.error(message)
        return
      }

      for (let index = 0; index < recurrenceCount; index += 1) {
        const occurrenceDate = form.recurrenceType === "fixed"
          ? formatLocalDate(addRecurrenceInterval(baseDate, form.recurrenceInterval, index))
          : form.dueDate

      const created = await createFinancialEntry({
        type: form.type,
        status: getEntryStatusForOpen(form.type),
        description: recurrenceCount > 1 ? `${form.description} ${index + 1}/${recurrenceCount}` : form.description,
        value: amount,
        competence_date: occurrenceDate,
        due_date: occurrenceDate,
        payment_date: null,
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
      }
      await onCreated()
      toast.success(recurrenceCount > 1 ? `${recurrenceCount} lancamentos salvos e DRE atualizada.` : "Lancamento salvo e DRE atualizado")
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
    (() => {
      const normalizedOptions = options.map((option) => (typeof option === "string" ? { label: option, value: option } : option))
      const selected = normalizedOptions.find((option) => option.value === String(form[field]))

      return (
        <div className="grid gap-2">
          <Label>{label}</Label>
          <Select value={String(form[field])} onValueChange={(value) => setField(field, value)}>
            <SelectTrigger className="w-full">
              <span data-slot="select-value" className={selected ? "flex flex-1 text-left" : "flex flex-1 text-left text-muted-foreground"}>
                {selected?.label ?? label}
              </span>
            </SelectTrigger>
            <SelectContent>
              {normalizedOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
        </div>
      )
    })()
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
            {renderSelect("dreCategoryId", "Categoria DRE", selectOptions.dreCategories)}
            {renderSelect("bankAccountId", "Conta bancária", selectOptions.bankAccounts)}
            {renderSelect("clientId", "Cliente ou fornecedor", selectOptions.clients)}
            {renderSelect("paymentMethod", "Forma de pagamento", paymentMethods)}
            {renderSelect("attachment", "Tipo de anexo", attachmentTypes)}
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:col-span-2">
              <div className="grid gap-2">
                <Label>Repetir</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {recurrenceTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={form.recurrenceType === option.value ? "default" : "outline"}
                      onClick={() => setField("recurrenceType", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              {form.recurrenceType !== "none" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {renderSelect("recurrenceInterval", "Periodicidade", recurrenceIntervalOptions)}
                  {form.recurrenceType === "fixed" && renderInput("recurrenceCount", "Por quantas vezes", "number")}
                </div>
              )}
              {form.recurrenceType !== "none" && (
                <p className="text-xs text-muted-foreground">
                  Esta versao prepara o parcelamento/recorrencia na tela, mas ainda grava apenas lancamentos individuais.
                </p>
              )}
            </div>
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
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month")
  const [selectedMonth, setSelectedMonth] = useState(monthKey())
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [financialEntries, setFinancialEntries] = useState<TransactionRow[]>([])
  const [rawFinancialEntries, setRawFinancialEntries] = useState<SupabaseRow[]>([])
  const [contracts, setContracts] = useState<SupabaseRow[]>([])
  const [clients, setClients] = useState<SupabaseRow[]>([])
  const [installments, setInstallments] = useState<SupabaseRow[]>([])
  const [bankAccounts, setBankAccounts] = useState<SupabaseRow[]>([])
  const [viewingTransaction, setViewingTransaction] = useState<TransactionRow | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null)
  const [editForm, setEditForm] = useState({
    type: "receita",
    description: "",
    amount: "",
    dueDate: "",
    competenceDate: "",
    bankAccountId: "",
    dreCategoryId: "",
    clientId: "",
    status: "a_receber",
  })

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
    setBankAccounts((options.bankAccounts ?? []) as SupabaseRow[])
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
  const selectedPeriodDate = periodDate(periodMode, selectedMonth, selectedYear)
  const currentRevenue = calculateMonthlyRevenueMetrics(contracts, rawFinancialEntries, selectedPeriodDate)
  const currentMonthKey = currentRevenue.monthKey
  const clientById = new Map(clients.map((client) => [String(client.id ?? ""), client]))
  const contractById = new Map(contracts.map((contract) => [String(contract.id ?? ""), contract]))
  const periodTransactions = allTransactions.filter((transaction) => rowMatchesPeriod(transaction.date, periodMode, selectedMonth, selectedYear))
  const chartRows = allTransactions.reduce((acc, transaction) => {
    const month = transaction.date ? transaction.date.slice(0, 7) : "Sem data"
    const current = acc.get(month) ?? { month, receitas: 0, despesas: 0, balance: 0 }
    if (!isFinancialStatusReceived(transaction.status)) {
      acc.set(month, current)
      return acc
    }
    if (transaction.type === "income") {
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

  const filteredTransactions = periodTransactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || t.type === typeFilter
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalReceitas = periodTransactions
    .filter((t) => t.type === "income" && isFinancialStatusReceived(t.status))
    .reduce((sum, t) => sum + t.amount, 0)
   
  const totalDespesas = periodTransactions
    .filter((t) => t.type === "expense" && isFinancialStatusReceived(t.status))
    .reduce((sum, t) => sum + t.amount, 0)
  const pendingReceivables = periodTransactions.filter((t) => t.type === "income" && ["a_receber", "parcial"].includes(t.status))
  const pendingPayables = periodTransactions.filter((t) => t.type === "expense" && ["a_pagar", "parcial"].includes(t.status))
  const installmentReceivables = installments
    .filter(isOpenInstallment)
    .filter((installment) => rowMatchesPeriod(String(installment.due_date ?? ""), periodMode, selectedMonth, selectedYear))
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

  const calculatedBankBalance = (account: SupabaseRow) => {
    const accountId = String(account.id ?? "")
    const openingBalance = Number(account.opening_balance ?? 0)
    const movementBalance = allTransactions
      .filter((transaction) => transaction.bankAccountId === accountId && isFinancialStatusReceived(transaction.status))
      .reduce((sum, transaction) => sum + (transaction.type === "income" ? transaction.amount : -transaction.amount), 0)
    return (Number.isFinite(openingBalance) ? openingBalance : 0) + movementBalance
  }

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

  const confirmFinancialEntryPayment = async (transaction: TransactionRow) => {
    const today = new Date().toISOString().slice(0, 10)
    const paymentDate = window.prompt("Data de pagamento/recebimento (AAAA-MM-DD)", today)
    if (!paymentDate) return

    try {
      await updateFinancialEntry(transaction.id, {
        status: transaction.type === "income" ? "recebido" : "pago",
        payment_date: paymentDate,
      })
      await loadFinanceData()
      toast.success(transaction.type === "income" ? "Recebimento confirmado." : "Pagamento confirmado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel confirmar a baixa.")
    }
  }

  const openEditTransaction = (transaction: TransactionRow) => {
    setEditingTransaction(transaction)
    setEditForm({
      type: transaction.type === "income" ? "receita" : "despesa",
      description: transaction.description,
      amount: String(transaction.amount),
      dueDate: transaction.dueDate || transaction.date,
      competenceDate: transaction.date,
      bankAccountId: transaction.bankAccountId ?? "",
      dreCategoryId: transaction.dreCategoryId ?? "",
      clientId: transaction.clientId ?? "",
      status: transaction.status,
    })
  }

  const handleSaveTransactionEdit = async () => {
    if (!editingTransaction) return
    const amount = Number(editForm.amount.replace(",", "."))
    if (!editForm.description.trim() || !Number.isFinite(amount) || amount <= 0 || !editForm.competenceDate) {
      toast.error("Informe descricao, valor e competencia validos.")
      return
    }

    try {
      await updateFinancialEntry(editingTransaction.id, {
        type: editForm.type,
        status: editForm.status,
        description: editForm.description,
        value: amount,
        amount,
        competence_date: editForm.competenceDate,
        due_date: editForm.dueDate || editForm.competenceDate,
        bank_account_id: editForm.bankAccountId || null,
        dre_category_id: editForm.dreCategoryId || null,
        client_id: editForm.clientId || null,
      })
      await loadFinanceData()
      setEditingTransaction(null)
      toast.success("Lancamento atualizado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o lancamento.")
    }
  }

  const handleDeleteTransaction = async (transaction: TransactionRow) => {
    if (!window.confirm(`Excluir lancamento "${transaction.description}"?`)) return
    try {
      await deleteFinancialEntry(transaction.id)
      await loadFinanceData()
      toast.success("Lancamento excluido.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o lancamento.")
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
              ["Receita prevista por contratos", formatCurrency(currentRevenue.mrr)],
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
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Contas bancarias
          </CardTitle>
          <CardDescription>Contas cadastradas manualmente no financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          {bankAccounts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {bankAccounts.map((account) => {
                const status = getBankConnectionStatus(account)
                return (
                  <div key={String(account.id ?? getFriendlyBankAccountLabel(account))} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{getFriendlyBankAccountLabel(account)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ultima sincronizacao: {getBankLastSync(account)}
                        </p>
                      </div>
                      <Badge
                        className={
                          status === "Conectado"
                            ? "bg-emerald-100 text-emerald-700"
                            : status === "Inativa"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-blue-100 text-blue-700"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                    <p className="mt-4 text-2xl font-bold">{formatCurrency(calculatedBankBalance(account))}</p>
                    <p className="text-xs text-muted-foreground">Saldo inicial + lancamentos confirmados</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Landmark className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-semibold text-foreground">Nenhuma conta bancaria cadastrada.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre uma conta manual para acompanhar saldos reais do sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="grid gap-2">
              <Label>Período</Label>
              <Select value={periodMode} onValueChange={(value) => setPeriodMode(value as PeriodMode)}>
                <SelectTrigger className="w-40">
                  <span>{periodMode === "month" ? "Mês/Ano" : "Ano"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mês/Ano</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {periodMode === "month" ? (
              <div className="grid gap-2">
                <Label>Mês/Ano</Label>
                <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="w-44" />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Ano</Label>
                <Input type="number" min="2000" max="2100" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="w-32" />
              </div>
            )}
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
                    <span>{transactionTypeFilterOptions.find((item) => item.value === typeFilter)?.label ?? "Tipo"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypeFilterOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <span>{transactionStatusFilterOptions.find((item) => item.value === statusFilter)?.label ?? "Status"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {transactionStatusFilterOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
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
                            <DropdownMenuItem onClick={() => setViewingTransaction(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTransaction(transaction)}>
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
                    <CardDescription>Vencimentos do periodo selecionado</CardDescription>
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
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => confirmFinancialEntryPayment(item)}>
                          Confirmar recebimento
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
                    <CardDescription>Vencimentos do periodo selecionado</CardDescription>
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
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => confirmFinancialEntryPayment(item)}>
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

      <Dialog open={Boolean(viewingTransaction)} onOpenChange={(open) => !open && setViewingTransaction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do lancamento</DialogTitle>
            <DialogDescription>{viewingTransaction?.description}</DialogDescription>
          </DialogHeader>
          {viewingTransaction && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Data</span><span>{formatDate(viewingTransaction.date)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Vencimento</span><span>{formatDate(viewingTransaction.dueDate)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tipo</span><span>{viewingTransaction.type === "income" ? "Receita" : "Despesa"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Status</span><span>{getFinancialStatusLabel(viewingTransaction.status)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Valor</span><span className="font-semibold">{formatCurrency(viewingTransaction.amount)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Categoria</span><span>{viewingTransaction.category}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingTransaction(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingTransaction)} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar lancamento</DialogTitle>
            <DialogDescription>Atualize os dados principais do lancamento financeiro.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={editForm.type} onValueChange={(value) => setEditForm((current) => ({ ...current, type: value, status: getEntryStatusForOpen(value) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {financialStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>{getFinancialStatusLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Descricao</Label>
              <Input value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Valor</Label>
              <Input type="number" min="0" step="0.01" value={editForm.amount} onChange={(event) => setEditForm((current) => ({ ...current, amount: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Competencia</Label>
              <Input type="date" value={editForm.competenceDate} onChange={(event) => setEditForm((current) => ({ ...current, competenceDate: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Vencimento</Label>
              <Input type="date" value={editForm.dueDate} onChange={(event) => setEditForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Conta bancaria</Label>
              <Select value={editForm.bankAccountId || "none"} onValueChange={(value) => setEditForm((current) => ({ ...current, bankAccountId: value === "none" ? "" : value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem conta</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={String(account.id ?? "")} value={String(account.id ?? "")}>{getFriendlyBankAccountLabel(account)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancelar</Button>
            <Button onClick={handleSaveTransactionEdit}>Salvar alteracoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
