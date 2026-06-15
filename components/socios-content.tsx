"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Eye, HandCoins, MoreHorizontal, Plus, TrendingUp, Users } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { exportPdfReport } from "@/lib/cta-actions"
import { buildPartnersReport } from "@/lib/reports/report-builders"
import { createPartnerEntry, getPartnerEntries, getPartners, updatePartner } from "@/lib/data/partners"
import { partnerLabel } from "@/lib/data/display-labels"
import { formatCurrency } from "@/lib/utils"

const colors = ["#22B8CF", "#22C55E", "#F59E0B"]

type Partner = {
  id: string
  name: string
  participationPercentage: number
  fixedMonthlyValue: number
  resultParticipationPercentage: number
  active: boolean
  received: number
  distributions: number
  contributions: number
  returns: number
}

type PartnerEntry = {
  id: string
  partnerId: string
  partner: string
  type: string
  typeLabel: string
  date: string
  description: string
  amount: number
  status: string
}

const partnerEntryTypeOptions = [
  { label: "Distribuição de lucro", value: "distribuicao_lucro" },
  { label: "Participação no resultado", value: "participacao_resultado" },
  { label: "Aporte", value: "aporte" },
  { label: "Devolução", value: "devolucao" },
  { label: "Fixo mensal", value: "fixo_mensal" },
] as const

function getPartnerEntryTypeLabel(value: unknown) {
  const type = String(value ?? "")
  return partnerEntryTypeOptions.find((item) => item.value === type)?.label ?? (type || "Distribuição de lucro")
}

function normalizePartner(item: Record<string, unknown>, entries: PartnerEntry[] = []): Partner {
  const name = partnerLabel(item)
  const partnerEntries = entries.filter((entry) => entry.partnerId === String(item.id ?? ""))
  const distributions = partnerEntries.filter((entry) => entry.type === "distribuicao_lucro" || entry.type === "participacao_resultado" || entry.type === "fixo_mensal").reduce((sum, entry) => sum + entry.amount, 0)
  const contributions = partnerEntries.filter((entry) => entry.type === "aporte").reduce((sum, entry) => sum + entry.amount, 0)
  const returns = partnerEntries.filter((entry) => entry.type === "devolucao").reduce((sum, entry) => sum + entry.amount, 0)
  return {
    id: String(item.id ?? ""),
    name,
    participationPercentage: Number(item.participation_percentage ?? 0),
    fixedMonthlyValue: Number(item.fixed_monthly_value ?? 0),
    resultParticipationPercentage: Number(item.result_participation_percentage ?? 0),
    active: item.active !== false,
    received: distributions + returns,
    distributions,
    contributions,
    returns,
  }
}

function normalizePartnerEntry(item: Record<string, unknown>): PartnerEntry {
  return {
    id: String(item.id ?? crypto.randomUUID()),
    partnerId: String(item.partner_id ?? ""),
    partner: String(item.partner ?? item.partner_name ?? item.socio ?? item.partner_id ?? "Registro sem nome"),
    type: String(item.type ?? "distribuicao_lucro"),
    typeLabel: getPartnerEntryTypeLabel(item.type),
    date: String(item.competence_date ?? ""),
    description: String(item.description ?? ""),
    amount: Number(item.value ?? 0),
    status: String(item.status ?? "previsto"),
  }
}

export function SociosContent() {
  const [entries, setEntries] = useState<PartnerEntry[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<Partner | null>(null)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    participationPercentage: "",
    fixedMonthlyValue: "",
    resultParticipationPercentage: "",
    active: "true",
  })
  const [savingPartner, setSavingPartner] = useState(false)
  const [form, setForm] = useState({ partner: "", type: "distribuicao_lucro", date: new Date().toISOString().slice(0, 10), amount: "", description: "", status: "previsto" })

  useEffect(() => {
    Promise.all([getPartnerEntries(), getPartners()]).then(([entryItems, partnerItems]) => {
      const partnerNameById = new Map(
        partnerItems.map((item) => {
          const record = item as Record<string, unknown>
          return [String(record.id ?? ""), partnerLabel(record)]
        })
      )
      const normalizedEntries = entryItems.map((item) => {
        const record = item as Record<string, unknown>
        return normalizePartnerEntry({
          ...record,
          partner: partnerNameById.get(String(record.partner_id ?? "")) ?? "Registro sem nome",
        })
      })
      setEntries(normalizedEntries)
      setPartners(partnerItems.map((item) => normalizePartner(item as Record<string, unknown>, normalizedEntries)))
    })
  }, [])

  const totals = useMemo(() => {
    const received = partners.reduce((total, partner) => total + partner.received, 0)
    const distributions = partners.reduce((total, partner) => total + partner.distributions, 0)
    const contributions = partners.reduce((total, partner) => total + partner.contributions, 0)
    const returns = partners.reduce((total, partner) => total + partner.returns, 0)
    return { received, distributions, contributions, returns, net: received + returns - contributions }
  }, [partners])

  const chartData = partners.map((partner) => ({ name: partner.name, value: partner.participationPercentage }))

  const openEditPartner = (partner: Partner) => {
    setEditingPartner(partner)
    setEditForm({
      name: partner.name,
      participationPercentage: String(partner.participationPercentage || ""),
      fixedMonthlyValue: String(partner.fixedMonthlyValue || ""),
      resultParticipationPercentage: String(partner.resultParticipationPercentage || ""),
      active: String(partner.active),
    })
  }

  const handleUpdatePartner = async () => {
    if (!editingPartner) return
    setSavingPartner(true)
    try {
      const updated = await updatePartner(editingPartner.id, {
        name: editForm.name,
        participation_percentage: Number(editForm.participationPercentage || 0),
        fixed_monthly_value: Number(editForm.fixedMonthlyValue || 0),
        result_participation_percentage: Number(editForm.resultParticipationPercentage || 0),
        active: editForm.active === "true",
      })
      const normalized = normalizePartner(updated as Record<string, unknown>, entries)
      setPartners((current) => current.map((partner) => (partner.id === normalized.id ? normalized : partner)))
      setEditingPartner(null)
      toast.success("Sócio atualizado com sucesso")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o sócio.")
    } finally {
      setSavingPartner(false)
    }
  }

  const handleSave = async () => {
    const amount = Number(form.amount.replace(",", "."))
    if (!amount) {
      toast.error("Informe um valor válido")
      return
    }

    try {
      const created = await createPartnerEntry({
        partner_id: form.partner || null,
        type: form.type,
        competence_date: form.date,
        value: amount,
        description: form.description,
        status: form.status,
      })
      const partnerName = partners.find((partner) => partner.id === form.partner)?.name ?? "Registro sem nome"
      const normalized = normalizePartnerEntry({ ...(created as Record<string, unknown>), partner: partnerName })
      setEntries((current) => [normalized, ...current])
      toast.success("Lançamento de sócio salvo com sucesso")
      setOpen(false)
      setForm({ partner: "", type: "distribuicao_lucro", date: new Date().toISOString().slice(0, 10), amount: "", description: "", status: "previsto" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o lançamento de sócio."
      console.error("[socios] Falha ao salvar lançamento", error)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sócios</h1>
          <p className="text-muted-foreground">Participações, aportes, distribuições e saldo líquido.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildPartnersReport(entries.map((entry) => ({
            id: entry.id,
            partner: entry.partner,
            type: entry.typeLabel,
            date: entry.date,
            status: entry.status,
            amount: entry.amount,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo lançamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <Users className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Sócios</p>
            <p className="text-2xl font-bold">{partners.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <HandCoins className="mb-3 h-5 w-5 text-emerald-600" />
            <p className="text-sm text-muted-foreground">Total recebido</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.received)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <TrendingUp className="mb-3 h-5 w-5 text-blue-600" />
            <p className="text-sm text-muted-foreground">Distribuições</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.distributions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Aportes</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.contributions)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Devoluções: {formatCurrency(totals.returns)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Saldo líquido</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.net)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Participação societária</CardTitle>
            <CardDescription>Divisão percentual atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {partners.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum sócio cadastrado ou visível para o usuário atual.</p>
              )}
              {partners.map((partner, index) => (
                <div key={partner.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                    {partner.name}
                  </span>
                  <strong>{partner.participationPercentage}%</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quadro de sócios</CardTitle>
            <CardDescription>Indicadores individuais dos sócios.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partners.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum sócio retornado pela consulta atual.</p>
              )}
              {partners.map((partner, index) => (
                <div key={partner.id} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="text-white" style={{ backgroundColor: colors[index] }}>
                        {partner.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">{partner.active ? "Ativo" : "Inativo"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Participação</p>
                      <p className="font-bold">{partner.participationPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recebido</p>
                      <p className="font-bold">{formatCurrency(partner.received)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Aportes</p>
                      <p className="font-bold">{formatCurrency(partner.contributions)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(partner.received + partner.returns - partner.contributions)}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetails(partner)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditPartner(partner)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportPdfReport(buildPartnersReport(entries.filter((entry) => entry.partner === partner.name).map((entry) => ({
                        id: entry.id,
                        partner: entry.partner,
                        type: entry.typeLabel,
                        date: entry.date,
                        status: entry.status,
                        amount: entry.amount,
                      }))))}>Exportar histórico</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações dos sócios</CardTitle>
          <CardDescription>Distribuições, aportes e devoluções.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sócio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.partner}</TableCell>
                  <TableCell>{entry.typeLabel}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.description || "-"}</TableCell>
                  <TableCell>
                    <Badge className={entry.status === "pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {entry.status === "pago" ? "Pago" : "Previsto"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(entry.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento de sócio</DialogTitle>
            <DialogDescription>Registro salvo em partner_entries.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {[
              ["partner", "Sócio"],
              ["type", "Tipo"],
              ["date", "Data"],
              ["description", "Descrição"],
              ["status", "Status"],
              ["amount", "Valor"],
            ].map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{label}</Label>
                {key === "partner" ? (
                  <Select value={form.partner} onValueChange={(value) => setForm((current) => ({ ...current, partner: value ?? "" }))}>
                    <SelectTrigger id={key}>
                      <SelectValue placeholder="Selecione o sócio" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.length ? partners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                      )) : <SelectItem value="empty" disabled>Nenhum sócio disponível</SelectItem>}
                    </SelectContent>
                  </Select>
                ) : key === "type" ? (
                  <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value ?? "" }))}>
                    <SelectTrigger id={key}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerEntryTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : key === "status" ? (
                  <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value ?? "" }))}>
                    <SelectTrigger id={key}>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previsto">Previsto</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={key}
                    value={form[key as keyof typeof form]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!details} onOpenChange={(nextOpen) => !nextOpen && setDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{details?.name}</DialogTitle>
            <DialogDescription>{details?.active ? "Ativo" : "Inativo"}</DialogDescription>
          </DialogHeader>
          {details && (
            <div className="grid gap-3">
              <div className="flex justify-between rounded-lg border p-3">
                <span>Participação nos lucros</span>
                <strong>{details.participationPercentage}%</strong>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span>Distribuições</span>
                <strong>{formatCurrency(details.distributions)}</strong>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span>Aportes</span>
                <strong>{formatCurrency(details.contributions)}</strong>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span>Saldo líquido</span>
                <strong>{formatCurrency(details.received + details.returns - details.contributions)}</strong>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPartner} onOpenChange={(nextOpen) => !nextOpen && setEditingPartner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sócio</DialogTitle>
            <DialogDescription>Atualização real na tabela partners.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {[
              ["name", "Nome"],
              ["participationPercentage", "Participação (%)"],
              ["fixedMonthlyValue", "Fixo mensal"],
              ["resultParticipationPercentage", "Participação no resultado (%)"],
              ["active", "Ativo (true/false)"],
            ].map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={`partner-${key}`}>{label}</Label>
                <Input
                  id={`partner-${key}`}
                  value={editForm[key as keyof typeof editForm]}
                  onChange={(event) => setEditForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPartner(null)} disabled={savingPartner}>Cancelar</Button>
            <Button onClick={handleUpdatePartner} disabled={savingPartner}>{savingPartner ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
