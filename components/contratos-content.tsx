"use client"

import { useEffect, useState } from "react"
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
  Trash2,
  RefreshCw,
  Copy,
  Plus,
  Package,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { ContractView } from "@/lib/mock-data"
import { getClients } from "@/lib/data/clients"
import type { Contrato } from "@/lib/types"
import { createContract, createContractEquipment, deleteContract, getContracts, recalculateEquipmentInventory } from "@/lib/data/contracts"
import { getEquipment, getEquipmentAvailableQuantity, getEquipmentTotalQuantity } from "@/lib/data/equipment"
import { createInstallment } from "@/lib/data/installments"
import { uploadDocumentFile } from "@/lib/data/documents"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildContractsReport } from "@/lib/reports/report-builders"
import type { SupabaseRow } from "@/lib/supabase/types"
import { clientLabel, equipmentLabel } from "@/lib/data/display-labels"

type ContractWithPublicLink = ContractView & {
  public_access_token?: string
  public_access_enabled?: boolean
}

type ClientOption = { label: string; value: string }
type EquipmentOption = {
  id: string
  name: string
  category: string
  status: string
  totalQuantity: number
  availableQuantity: number
}
type ContractEquipmentDraft = {
  equipmentId: string
  quantity: string
}

function normalizeContractStatus(status: unknown) {
  const value = String(status ?? "ativo")
  const map: Record<string, string> = {
    active: "ativo",
    closed: "encerrado",
    cancelled: "cancelado",
    expired: "encerrado",
    overdue: "inadimplente",
    legal: "inadimplente",
    juridico: "inadimplente",
    expiring: "ativo",
    draft: "ativo",
  }
  return map[value] ?? value
}

function toNumber(value: string | undefined) {
  if (!value) return null
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

function isEquipmentAvailable(status: string, availableQuantity: number) {
  return ["available", "active", "ativo", "disponivel"].includes(status.toLowerCase()) && availableQuantity > 0
}

function buildContractInstallmentDates(startDate: string, endDate: string | null | undefined, dueDay: number) {
  const start = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(start.getTime())) return []

  const end = endDate ? new Date(`${endDate}T00:00:00`) : new Date(start)
  if (!endDate) end.setMonth(end.getMonth() + 11)
  if (Number.isNaN(end.getTime())) return []

  const dates: string[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), Math.min(Math.max(1, dueDay), 28))
  if (current < start) current.setMonth(current.getMonth() + 1)

  while (current <= end && dates.length < 120) {
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    current.setDate(Math.min(Math.max(1, dueDay), lastDay))
    dates.push(current.toISOString().slice(0, 10))
    current.setMonth(current.getMonth() + 1)
  }

  return dates
}

function friendlyContractSaveError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.error("[contratos] Falha ao salvar contrato", error)

  if (message.includes("23505") || message.toLowerCase().includes("duplicate key")) {
    return "Ja existe um contrato com esse numero. Gere novamente ou tente salvar outra vez."
  }

  if (message.toLowerCase().includes("row-level security") || message.toLowerCase().includes("permission") || message.toLowerCase().includes("policy")) {
    return "Nao foi possivel salvar por restricao de permissao no Supabase."
  }

  return message || "Nao foi possivel salvar o contrato."
}

function normalizeContract(item: Record<string, unknown>, clients: SupabaseRow[] = []): ContractWithPublicLink {
  const number = String(item.number ?? item.contract_number ?? item.numero ?? "")
  const clientId = String(item.clienteId ?? item.client_id ?? "")
  const rawClientName = String(item.clientName ?? item.client_name ?? item.client ?? item.nome_fantasia ?? "")
  const linkedClient = clients.find((client) => String(client.id ?? "") === clientId)
  const clientName = rawClientName && !isUuidLike(rawClientName)
    ? rawClientName
    : linkedClient ? clientLabel(linkedClient) : "Cliente nao encontrado"
  const startDate = String(item.startDate ?? item.start_date ?? item.data_inicio ?? "")
  const endDate = String(item.endDate ?? item.end_date ?? item.data_fim ?? startDate)
  const monthlyValue = Number(item.monthlyValue ?? item.monthly_value ?? item.valor_mensal ?? 0)
  const status = normalizeContractStatus(item.status)

  return {
    id: String(item.id ?? ""),
    numero: number,
    clienteId: clientId,
    tipo: String(item.type ?? item.tipo ?? "locacao") as Contrato["tipo"],
    dataInicio: startDate,
    dataFim: endDate,
    valorMensal: monthlyValue,
    valorTotal: Number(item.totalValue ?? item.total_value ?? item.valor_total ?? monthlyValue),
    descricao: String(item.description ?? item.descricao ?? ""),
    equipamentos: [],
    parcelas: [],
    documentos: [],
    dataCriacao: String(item.created_at ?? ""),
    dataAtualizacao: String(item.updated_at ?? ""),
    number,
    client: clientName,
    clientName,
    type: String(item.type ?? item.tipo ?? "locacao"),
    status,
    startDate,
    endDate,
    monthlyValue,
    totalValue: Number(item.totalValue ?? item.total_value ?? item.valor_total ?? monthlyValue),
    description: String(item.description ?? item.descricao ?? ""),
    public_access_token: item.public_access_token ? String(item.public_access_token) : undefined,
    public_access_enabled: Boolean(item.public_access_enabled),
  }
}

function NewContractDialog({
  clientOptions,
  equipmentOptions,
  generateContractNumber,
  onCreated,
}: {
  clientOptions: ClientOption[]
  equipmentOptions: EquipmentOption[]
  generateContractNumber: (clientId: string, startDate: string) => string
  onCreated: (contract: ContractWithPublicLink) => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [values, setValues] = useState({
    client_id: "",
    type: "locacao",
    status: "ativo",
    start_date: "",
    end_date: "",
    due_date: "",
    monthly_value: "",
  })
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [equipmentDrafts, setEquipmentDrafts] = useState<ContractEquipmentDraft[]>([
    { equipmentId: "", quantity: "1" },
  ])

  const selectedEquipmentIds = new Set(equipmentDrafts.map((item) => item.equipmentId).filter(Boolean))

  const setValue = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrorMessage("")
  }

  const setEquipmentDraft = (index: number, next: Partial<ContractEquipmentDraft>) => {
    setEquipmentDrafts((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item))
    )
    setErrorMessage("")
  }

  const validate = () => {
    if (!values.client_id) return "Selecione um cliente."
    if (!values.type) return "Selecione o tipo de contrato."
    if (!values.status) return "Selecione o status do contrato."
    if (!values.start_date) return "Informe a data inicial."
    if (!values.due_date) return "Informe a data de vencimento."
    if (!toNumber(values.monthly_value)) return "Informe um valor mensal valido."

    const filledDrafts = equipmentDrafts.filter((item) => item.equipmentId)
    if (values.type === "locacao" && filledDrafts.length === 0) {
      return "Contrato de locacao precisa ter pelo menos um equipamento vinculado."
    }

    for (const draft of filledDrafts) {
      const equipment = equipmentOptions.find((item) => item.id === draft.equipmentId)
      const quantity = Number(draft.quantity)
      if (!equipment) return "Equipamento selecionado nao foi encontrado."
      if (!Number.isFinite(quantity) || quantity <= 0) return "Informe uma quantidade valida para o equipamento."
      if (quantity > equipment.availableQuantity) {
        return `Estoque insuficiente. Disponivel: ${equipment.availableQuantity} unidades.`
      }
    }

    return ""
  }

  const reset = () => {
    setValues({
      client_id: "",
      type: "locacao",
      status: "ativo",
      start_date: "",
      end_date: "",
      due_date: "",
      monthly_value: "",
    })
    setContractFile(null)
    setEquipmentDrafts([{ equipmentId: "", quantity: "1" }])
    setErrorMessage("")
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setSaving(true)
    setErrorMessage("")
    let createdContractId = ""
    try {
      const publicToken = crypto.randomUUID()
      const contractNumber = generateContractNumber(values.client_id, values.start_date)
      const dueDate = new Date(`${values.due_date}T00:00:00`)
      const created = await createContract({
        client_id: values.client_id,
        contract_number: contractNumber,
        type: values.type,
        status: values.status,
        start_date: values.start_date,
        end_date: values.end_date || null,
        due_day: dueDate.getDate(),
        monthly_value: toNumber(values.monthly_value),
        total_value: toNumber(values.monthly_value),
        public_access_token: publicToken,
        public_access_enabled: true,
        public_access_created_at: new Date().toISOString(),
      })

      const contractId = String((created as SupabaseRow).id ?? "")
      createdContractId = contractId
      const monthlyValue = toNumber(values.monthly_value) ?? 0
      const installmentDates = buildContractInstallmentDates(values.start_date, values.end_date || null, dueDate.getDate())
      for (const [index, installmentDate] of installmentDates.entries()) {
        await createInstallment({
          contract_id: contractId,
          client_id: values.client_id,
          installment_number: index + 1,
          original_value: monthlyValue,
          updated_value: monthlyValue,
          paid_value: 0,
          due_date: installmentDate,
          status: "aberta",
          notes: `Parcela gerada automaticamente pelo contrato ${contractNumber}`,
        })
      }

      const selectedDrafts = equipmentDrafts.filter((item) => item.equipmentId)
      for (const draft of selectedDrafts) {
        await createContractEquipment({
          contract_id: contractId,
          equipment_id: draft.equipmentId,
          quantity: Number(draft.quantity),
        })
      }

      for (const equipmentId of new Set(selectedDrafts.map((item) => item.equipmentId))) {
        await recalculateEquipmentInventory(equipmentId)
      }

      createdContractId = ""

      if (contractFile) {
        await uploadDocumentFile({
          bucket: "gate-contracts",
          file: contractFile,
          folder: `contracts/${contractId}`,
          record: {
            contract_id: contractId,
            type: "contrato",
          },
        })
      }

      const selectedClientLabel = clientOptions.find((client) => client.value === values.client_id)?.label
      await onCreated(normalizeContract({
        ...(created as Record<string, unknown>),
        client_name: selectedClientLabel,
      }))
      toast.success("Contrato salvo e estoque atualizado.")
      reset()
      setOpen(false)
    } catch (error) {
      if (createdContractId) {
        try {
          await deleteContract(createdContractId)
        } catch (rollbackError) {
          console.error("[contratos] Falha no rollback logico do contrato", rollbackError)
        }
      }
      const message = friendlyContractSaveError(error)
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Contrato
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>Crie o contrato, vincule equipamentos e atualize o estoque real.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="contract-client">Cliente *</Label>
                <Select value={values.client_id} onValueChange={(value) => setValue("client_id", value)}>
                  <SelectTrigger id="contract-client">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.length ? (
                      clientOptions.map((client) => (
                        <SelectItem key={client.value} value={client.value}>
                          {client.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>Nenhum cliente encontrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-status">Status *</Label>
                <Select value={values.status} onValueChange={(value) => setValue("status", value)}>
                  <SelectTrigger id="contract-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="inadimplente">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-type">Tipo *</Label>
                <Select value={values.type} onValueChange={(value) => setValue("type", value)}>
                  <SelectTrigger id="contract-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locacao">Locacao</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="servico">Servico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-start">Data inicial *</Label>
                <Input id="contract-start" type="date" value={values.start_date} onChange={(event) => setValue("start_date", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-end">Data final</Label>
                <Input id="contract-end" type="date" value={values.end_date} onChange={(event) => setValue("end_date", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-due">Data de vencimento *</Label>
                <Input id="contract-due" type="date" value={values.due_date} onChange={(event) => setValue("due_date", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contract-value">Valor mensal *</Label>
                <Input
                  id="contract-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.monthly_value}
                  onChange={(event) => setValue("monthly_value", event.target.value)}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="contract-file">Anexo opcional</Label>
                <Input id="contract-file" type="file" onChange={(event) => setContractFile(event.target.files?.[0] ?? null)} />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Equipamentos vinculados</h3>
                  <p className="text-xs text-muted-foreground">Selecione apenas equipamentos com estoque disponivel.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEquipmentDrafts((current) => [...current, { equipmentId: "", quantity: "1" }])}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {equipmentDrafts.map((draft, index) => {
                  const equipment = equipmentOptions.find((item) => item.id === draft.equipmentId)
                  return (
                    <div key={`${draft.equipmentId}-${index}`} className="grid gap-3 rounded-lg bg-muted/40 p-3 md:grid-cols-[1fr_120px_40px]">
                      <div className="grid gap-2">
                        <Label>Equipamento</Label>
                        <Select value={draft.equipmentId} onValueChange={(value) => setEquipmentDraft(index, { equipmentId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o equipamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipmentOptions.length ? (
                              equipmentOptions.map((item) => (
                                <SelectItem
                                  key={item.id}
                                  value={item.id}
                                  disabled={selectedEquipmentIds.has(item.id) && item.id !== draft.equipmentId}
                                >
                                  {item.name} - disponivel: {item.availableQuantity}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>Nenhum equipamento disponivel</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {equipment && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1">
                              <Package className="h-3 w-3" />
                              Total: {equipment.totalQuantity}
                            </span>
                            <span className="rounded-md bg-background px-2 py-1">
                              Disponivel: {equipment.availableQuantity}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          max={equipment?.availableQuantity}
                          value={draft.quantity}
                          onChange={(event) => setEquipmentDraft(index, { quantity: event.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setEquipmentDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          disabled={equipmentDrafts.length === 1}
                          aria-label="Remover equipamento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar contrato"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ContratosContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [contracts, setContracts] = useState<ContractWithPublicLink[]>([])
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([])

  useEffect(() => {
    Promise.all([getContracts(), getClients()]).then(([contractRows, clientRows]) => {
      const clients = clientRows as SupabaseRow[]
      setContracts(contractRows.map((item) => normalizeContract(item as Record<string, unknown>, clients)))
      setClientOptions(
        clients.map((item) => {
          const record = item as Record<string, unknown>
          return {
            label: clientLabel(record),
            value: String(record.id ?? ""),
          }
        }).filter((item) => item.value)
      )
    })
    getEquipment().then((items) =>
      setEquipmentOptions(
        items
          .map((item) => {
            const record = item as SupabaseRow
            const totalQuantity = getEquipmentTotalQuantity(record)
            const availableQuantity = getEquipmentAvailableQuantity(record)
            const status = String(record.status ?? "available")
            return {
              id: String(record.id ?? ""),
              name: equipmentLabel(record),
              category: String(record.category ?? record.type ?? record.categoria ?? ""),
              status,
              totalQuantity,
              availableQuantity,
            }
          })
          .filter((item) => item.id && isEquipmentAvailable(item.status, item.availableQuantity))
      )
    )
  }, [])

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesType = typeFilter === "all" || c.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const activeContracts = contracts.filter((c) => c.status === "ativo").length
  const expiringContracts = contracts.filter((contract) => {
    if (contract.status !== "ativo" || !contract.endDate) return false
    const diffDays = (new Date(`${contract.endDate}T00:00:00`).getTime() - Date.now()) / 86400000
    return diffDays >= 0 && diffDays <= 30
  }).length
  const totalMonthlyValue = contracts
    .filter((c) => c.status === "ativo")
    .reduce((sum, c) => sum + c.monthlyValue, 0)

  const getPublicContractUrl = (token: string) => `${window.location.origin}/cliente/contrato/${token}`

  const generateContractNumber = (clientId: string, startDate: string) => {
    const clientLabel = clientOptions.find((client) => client.value === clientId)?.label ?? "CLIENTE"
    const safeClient = clientLabel
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 16) || "CLIENTE"
    const safeDate = (startDate || new Date().toISOString().slice(0, 10)).replaceAll("-", "")
    return `GATE-${safeClient}-${safeDate}-001`
  }

  const handleCopyClientLink = async (contract: ContractWithPublicLink) => {
    const token = String((contract as Record<string, unknown>).public_access_token ?? "")
    if (!token) {
      toast.error("Este contrato ainda nao possui link publico ativo.")
      return
    }

    await navigator.clipboard.writeText(getPublicContractUrl(token))
    toast.success("Link do cliente copiado.")
  }

  const handleGenerateClientLink = async (contract: ContractWithPublicLink) => {
    if (!isSupabaseConfigured()) {
      toast.error("Supabase nao esta configurado. O link nao foi gerado.")
      return
    }

    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      toast.error("Nao foi possivel conectar ao Supabase. O link nao foi gerado.")
      return
    }

    const token = crypto.randomUUID()
    const { data, error } = await supabase
      .from("contracts")
      .update({
        public_access_token: token,
        public_access_enabled: true,
        public_access_created_at: new Date().toISOString(),
      })
      .eq("id", contract.id)
      .select("*")
      .single()

    if (error || !data) {
      toast.error("Nao foi possivel gerar o link. A migration de acesso publico provavelmente ainda nao foi aplicada.")
      return
    }

    const updated = normalizeContract(data as Record<string, unknown>)
    setContracts((current) => current.map((item) => (item.id === contract.id ? updated : item)))
    await navigator.clipboard.writeText(getPublicContractUrl(token))
    toast.success("Link do cliente gerado e copiado.")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
      case "inadimplente":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Inadimplente</Badge>
      case "encerrado":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Encerrado</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ativo":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case "inadimplente":
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case "cancelado":
      case "encerrado":
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
          <p className="text-muted-foreground">GestÃ£o de contratos e renovaÃ§Ãµes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildContractsReport(filteredContracts.map((contract) => ({
            id: contract.id,
            contract_number: contract.number,
            client_name: contract.clientName,
            tipo: contract.type,
            status: contract.status,
            monthly_value: contract.monthlyValue,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NewContractDialog
            clientOptions={clientOptions}
            equipmentOptions={equipmentOptions}
            generateContractNumber={generateContractNumber}
            onCreated={async (createdContract) => {
              const [refreshedContracts, refreshedEquipment, refreshedClients] = await Promise.all([
                getContracts(),
                getEquipment(),
                getClients(),
              ])
              const normalizedContracts = refreshedContracts.map((item) => normalizeContract(item as Record<string, unknown>, refreshedClients as SupabaseRow[]))
              const hasCreatedContract = normalizedContracts.some((contract) => contract.id === createdContract.id)
              setContracts(hasCreatedContract ? normalizedContracts : [createdContract, ...normalizedContracts])
              setEquipmentOptions(
                refreshedEquipment
                  .map((item) => {
                    const record = item as SupabaseRow
                    const totalQuantity = getEquipmentTotalQuantity(record)
                    const availableQuantity = getEquipmentAvailableQuantity(record)
                    const status = String(record.status ?? "available")
                    return {
                      id: String(record.id ?? ""),
                      name: equipmentLabel(record),
                      category: String(record.category ?? record.type ?? record.categoria ?? ""),
                      status,
                      totalQuantity,
                      availableQuantity,
                    }
                  })
                  .filter((item) => item.id && isEquipmentAvailable(item.status, item.availableQuantity))
              )
            }}
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
                  {expiringContracts} contratos vencem nos prÃ³ximos 30 dias
                </p>
                <p className="text-xs text-amber-600">
                  Inicie o processo de renovaÃ§Ã£o para manter a continuidade dos serviÃ§os
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
          <TabsTrigger value="renovacoes">RenovaÃ§Ãµes</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nÃºmero ou cliente..."
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
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="inadimplente">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="locacao">LocaÃ§Ã£o</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="servico">ServiÃ§o</SelectItem>
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
                    <TableHead>VigÃªncia</TableHead>
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
                          <p className="text-muted-foreground">atÃ© {formatDate(contract.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress 
                            value={calculateProgress(contract.startDate, contract.endDate)} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {calculateProgress(contract.startDate, contract.endDate).toFixed(0)}% concluÃ­do
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(contract.monthlyValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(contract.status)}
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
                            <DropdownMenuItem onClick={() => { window.location.href = `/contratos/${contract.id}` }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyClientLink(contract)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar link do cliente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateClientLink(contract)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Gerar/regenerar link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-28 text-center">
                        <div className="space-y-1">
                          <p className="font-medium">Nenhum contrato cadastrado ainda.</p>
                          <p className="text-sm text-muted-foreground">Clique em Novo Contrato para comeÃ§ar.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
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
              <p className="text-muted-foreground">Mostrando contratos em processo de renovaÃ§Ã£o...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
