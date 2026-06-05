"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { AlertTriangle, Calendar, CheckCircle2, Clock, FileText, Loader2, Mail, Phone, Wrench } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { formatCurrency, formatDate } from "@/lib/utils"

type Row = Record<string, unknown>

type PublicData = {
  contract: Row
  client: Row | null
  equipment: Row[]
  installments: Row[]
  maintenanceOrders: Row[]
}

type TicketForm = {
  requester: string
  phone: string
  email: string
  type: string
  priority: string
  description: string
}

const initialForm: TicketForm = {
  requester: "",
  phone: "",
  email: "",
  type: "corretiva",
  priority: "medium",
  description: "",
}

function text(row: Row | null | undefined, keys: string[], fallback = "-") {
  if (!row) return fallback
  const value = keys.map((key) => row[key]).find((item) => item !== undefined && item !== null && item !== "")
  return value === undefined || value === null || value === "" ? fallback : String(value)
}

function numberValue(row: Row | null | undefined, keys: string[]) {
  const value = keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null && item !== "")
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateValue(row: Row, keys: string[]) {
  const raw = text(row, keys, "")
  return raw ? formatDate(raw) : "-"
}

function normalizeStatus(status: string) {
  const lower = status.toLowerCase()
  if (["active", "ativo"].includes(lower)) return "Ativo"
  if (["suspended", "suspenso"].includes(lower)) return "Suspenso"
  if (["overdue", "inadimplente"].includes(lower)) return "Inadimplente"
  if (["closed", "encerrado"].includes(lower)) return "Encerrado"
  if (["paid", "pago"].includes(lower)) return "Pago"
  if (["pending", "pendente", "open"].includes(lower)) return "Pendente"
  if (["cancelled", "cancelado"].includes(lower)) return "Cancelado"
  return status || "-"
}

function statusClass(status: string) {
  const normalized = normalizeStatus(status).toLowerCase()
  if (normalized.includes("ativo") || normalized.includes("pago")) return "bg-emerald-100 text-emerald-700"
  if (normalized.includes("inadimplente") || normalized.includes("vencido")) return "bg-red-100 text-red-700"
  if (normalized.includes("pendente") || normalized.includes("suspenso")) return "bg-amber-100 text-amber-700"
  return "bg-slate-100 text-slate-700"
}

function isOverdue(installment: Row) {
  const status = text(installment, ["status"], "").toLowerCase()
  const dueDate = text(installment, ["due_date", "vencimento"], "")
  return status !== "paid" && status !== "pago" && Boolean(dueDate) && new Date(dueDate) < new Date()
}

async function loadPublicContract(token: string): Promise<PublicData> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao esta configurado para carregar o contrato publico.")
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) throw new Error("Nao foi possivel iniciar a conexao com o Supabase.")

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*")
    .eq("public_access_token", token)
    .eq("public_access_enabled", true)
    .maybeSingle()

  if (contractError) {
    throw new Error("A consulta por token publico falhou. Verifique se a migration do link publico foi aplicada.")
  }
  if (!contract) {
    throw new Error("Link invalido, expirado ou desativado.")
  }

  const contractRow = contract as Row
  const contractId = text(contractRow, ["id"], "")
  const clientId = text(contractRow, ["client_id", "cliente_id"], "")

  const [clientResult, contractEquipmentResult, equipmentByContractResult, installmentsResult, maintenanceResult] =
    await Promise.all([
      clientId
        ? supabase.from("clients").select("*").eq("id", clientId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("contract_equipment").select("*").eq("contract_id", contractId),
      supabase.from("equipment").select("*").eq("contract_id", contractId),
      supabase.from("installments").select("*").eq("contract_id", contractId),
      supabase.from("maintenance_orders").select("*").eq("contract_id", contractId),
    ])

  const linkedRows = (contractEquipmentResult.data ?? []) as Row[]
  const linkedEquipmentIds = linkedRows.map((item) => text(item, ["equipment_id"], "")).filter(Boolean)
  let linkedEquipment: Row[] = []
  if (linkedEquipmentIds.length > 0) {
    const { data } = await supabase.from("equipment").select("*").in("id", linkedEquipmentIds)
    linkedEquipment = (data ?? []) as Row[]
  }

  const equipmentById = new Map<string, Row>()
  ;[...(equipmentByContractResult.data ?? []) as Row[], ...linkedEquipment].forEach((item) => {
    equipmentById.set(text(item, ["id"], crypto.randomUUID()), item)
  })

  return {
    contract: contractRow,
    client: (clientResult.data as Row | null) ?? null,
    equipment: Array.from(equipmentById.values()),
    installments: (installmentsResult.data ?? []) as Row[],
    maintenanceOrders: (maintenanceResult.data ?? []) as Row[],
  }
}

export function PublicContractPage({ token }: { token: string }) {
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedEquipment, setSelectedEquipment] = useState<Row | null>(null)
  const [form, setForm] = useState<TicketForm>(initialForm)
  const [sending, setSending] = useState(false)
  const [protocol, setProtocol] = useState("")

  useEffect(() => {
    let active = true
    loadPublicContract(token)
      .then((nextData) => {
        if (!active) return
        setData(nextData)
        setError("")
      })
      .catch((caught: unknown) => {
        if (!active) return
        setError(caught instanceof Error ? caught.message : "Nao foi possivel carregar o contrato.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const overdueInstallments = useMemo(() => data?.installments.filter(isOverdue) ?? [], [data])
  const overdueTotal = overdueInstallments.reduce((total, item) => total + numberValue(item, ["value", "amount", "valor", "installment_value"]), 0)
  const nextInstallments = useMemo(
    () =>
      (data?.installments ?? [])
        .filter((item) => !["paid", "pago", "cancelled", "cancelado"].includes(text(item, ["status"], "").toLowerCase()))
        .slice(0, 5),
    [data]
  )

  const setField = (field: keyof TicketForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleOpenTicket = (equipment: Row) => {
    setSelectedEquipment(equipment)
    setProtocol("")
    setForm(initialForm)
  }

  const handleSubmitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!data || !selectedEquipment) return
    if (!form.requester.trim() || !form.phone.trim() || !form.description.trim()) {
      toast.error("Preencha solicitante, telefone/WhatsApp e descricao do problema.")
      return
    }
    if (!isSupabaseConfigured()) {
      toast.error("Supabase nao esta configurado. O chamado nao foi criado.")
      return
    }

    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      toast.error("Nao foi possivel conectar ao Supabase. O chamado nao foi criado.")
      return
    }

    const ticketNumber = `GATE-${Date.now().toString().slice(-8)}`
    setSending(true)
    const { data: created, error: insertError } = await supabase
      .from("maintenance_orders")
      .insert({
        equipment_id: text(selectedEquipment, ["id"], ""),
        client_id: text(data.contract, ["client_id", "cliente_id"], "") || null,
        contract_id: text(data.contract, ["id"], ""),
        ticket_number: ticketNumber,
        type: form.type,
        priority: form.priority,
        status: "open",
        problem: `Solicitante: ${form.requester}\nTelefone/WhatsApp: ${form.phone}\nE-mail: ${form.email || "-"}\n\n${form.description}`,
        entry_date: new Date().toISOString().slice(0, 10),
      })
      .select("*")
      .single()
    setSending(false)

    if (insertError || !created) {
      toast.error(insertError?.message ?? "Nao foi possivel criar o chamado.")
      return
    }

    const createdRow = created as Row
    setProtocol(text(createdRow, ["ticket_number"], ticketNumber))
    setData((current) =>
      current ? { ...current, maintenanceOrders: [createdRow, ...current.maintenanceOrders] } : current
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando contrato...</span>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl pt-16">
          <Card>
            <CardHeader>
              <CardTitle>Link indisponivel</CardTitle>
              <CardDescription>{error || "Nao foi possivel carregar este contrato."}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  const contract = data.contract
  const clientName = text(data.client, ["name", "nome_fantasia", "razao_social"], text(contract, ["client_name"], "Cliente"))
  const contractNumber = text(contract, ["number", "numero", "name"], "Contrato")
  const contractStatus = normalizeStatus(text(contract, ["status"], "Ativo"))

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide text-primary">GATE OS</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">{clientName}</h1>
            <p className="text-sm text-slate-600">{contractNumber}</p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-slate-500">Status</p>
              <Badge className={statusClass(contractStatus)}>{contractStatus}</Badge>
            </div>
            <div>
              <p className="text-slate-500">Inicio</p>
              <p className="font-medium">{dateValue(contract, ["start_date", "data_inicio"])}</p>
            </div>
            <div>
              <p className="text-slate-500">Termino</p>
              <p className="font-medium">{dateValue(contract, ["end_date", "data_fim"])}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {overdueInstallments.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Existem parcelas vencidas neste contrato.</p>
                  <p className="text-sm text-red-700">
                    {overdueInstallments.length} parcela(s) em aberto, totalizando {formatCurrency(overdueTotal)}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <FileText className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Plano/servico</p>
              <p className="font-semibold">{text(contract, ["type", "tipo", "description", "descricao"], "Contrato GATE")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Calendar className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-semibold">{formatCurrency(numberValue(contract, ["monthly_value", "valor_mensal", "total_value", "valor_total"]))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Wrench className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Maquinas vinculadas</p>
              <p className="font-semibold">{data.equipment.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Situacao financeira</p>
              <p className="font-semibold">{overdueInstallments.length ? "Com pendencias" : "Sem pendencias vencidas"}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Maquinas e equipamentos</CardTitle>
            <CardDescription>Equipamentos vinculados a este contrato.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {data.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum equipamento vinculado a este contrato.</p>
            ) : (
              data.equipment.map((equipment) => (
                <div key={text(equipment, ["id"], crypto.randomUUID())} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{text(equipment, ["name", "nome", "model", "modelo"], "Equipamento")}</p>
                      <p className="text-sm text-muted-foreground">Identificacao: {text(equipment, ["code", "number", "numero", "patrimony_code"])}</p>
                    </div>
                    <Badge className={statusClass(text(equipment, ["status"], "Ativo"))}>{normalizeStatus(text(equipment, ["status"], "Ativo"))}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span>Serie: {text(equipment, ["serial_number", "numero_serie"])}</span>
                    <span>Local: {text(equipment, ["location", "localizacao"])}</span>
                    <span className="sm:col-span-2">Configuracao: {text(equipment, ["configuration", "configuracao", "description", "descricao"])}</span>
                  </div>
                  <Button className="mt-4 w-full sm:w-auto" onClick={() => handleOpenTicket(equipment)}>
                    Abrir chamado para esta maquina
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>Proximas parcelas, vencidas e historico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.installments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma parcela encontrada para este contrato.</p>
              ) : (
                data.installments.map((installment) => {
                  const status = isOverdue(installment) ? "Vencido" : normalizeStatus(text(installment, ["status"], "Pendente"))
                  return (
                    <div key={text(installment, ["id"], crypto.randomUUID())} className="flex items-center justify-between rounded-lg border bg-white p-3">
                      <div>
                        <p className="font-medium">{formatCurrency(numberValue(installment, ["value", "amount", "valor", "installment_value"]))}</p>
                        <p className="text-xs text-muted-foreground">Vencimento: {dateValue(installment, ["due_date", "vencimento"])}</p>
                        <p className="text-xs text-muted-foreground">Pagamento: {dateValue(installment, ["payment_date", "paid_at", "data_pagamento"])}</p>
                      </div>
                      <Badge className={statusClass(status)}>{status}</Badge>
                    </div>
                  )
                })
              )}
              {nextInstallments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Proximo vencimento: {dateValue(nextInstallments[0], ["due_date", "vencimento"])}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historico de chamados</CardTitle>
              <CardDescription>Acompanhamento dos chamados deste contrato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.maintenanceOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum chamado aberto para este contrato.</p>
              ) : (
                data.maintenanceOrders.map((order) => (
                  <div key={text(order, ["id"], crypto.randomUUID())} className="rounded-lg border bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{text(order, ["ticket_number"], "Chamado")}</p>
                      <Badge className={statusClass(text(order, ["status"], "open"))}>{normalizeStatus(text(order, ["status"], "open"))}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{text(order, ["problem"], "Sem descricao").slice(0, 140)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Atualizacao: {dateValue(order, ["updated_at", "entry_date", "created_at"])}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedEquipment} onOpenChange={(open) => !open && setSelectedEquipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir chamado</DialogTitle>
            <DialogDescription>
              Maquina selecionada: {text(selectedEquipment, ["name", "nome", "model", "modelo"], "Equipamento")}
            </DialogDescription>
          </DialogHeader>
          {protocol ? (
            <div className="rounded-lg border bg-emerald-50 p-4 text-emerald-800">
              <p className="font-semibold">Chamado criado com sucesso.</p>
              <p className="text-sm">Protocolo: {protocol}</p>
            </div>
          ) : (
            <form id="public-ticket-form" className="grid gap-4" onSubmit={handleSubmitTicket}>
              <div className="grid gap-2">
                <Label htmlFor="requester">Nome do solicitante</Label>
                <Input id="requester" value={form.requester} onChange={(event) => setField("requester", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone/WhatsApp</Label>
                  <Input id="phone" value={form.phone} onChange={(event) => setField("phone", event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</Label>
                  <Input id="email" type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tipo do problema</Label>
                  <Select value={form.type} onValueChange={(value) => setField("type", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="emergencial">Emergencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={(value) => setField("priority", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Critica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descricao do problema</Label>
                <textarea
                  id="description"
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                />
              </div>
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                Anexos/fotos serao habilitados quando o fluxo publico de upload no Storage estiver liberado.
              </div>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEquipment(null)}>Fechar</Button>
            {!protocol && (
              <Button type="submit" form="public-ticket-form" disabled={sending}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar chamado
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
