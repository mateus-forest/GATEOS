"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, CalendarClock, Download, Eye, FileText, Gavel, MoreHorizontal, Paperclip, Plus, Scale, Search } from "lucide-react"

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getDiasAtraso,
  getValorAtualizado,
  juridicoDocumentTypes,
  juridicoEtapas,
  juridicoFormasPagamento,
  juridicoResponsaveis,
  juridicoRiscos,
  juridicoStatuses,
  type JuridicoCaso,
} from "@/lib/juridico-data"
import { exportPdfReport, featureInPreparation } from "@/lib/cta-actions"
import { buildLegalReport } from "@/lib/reports/report-builders"
import { createLegalCase, getLegalCases } from "@/lib/data/legal"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { formatCurrency } from "@/lib/utils"

type CaseForm = {
  cliente: string
  contrato: string
  valorOriginal: string
  status: string
  etapa: string
  responsavel: string
  dataEntrada: string
  risco: string
  processo: string
  advogado: string
  parcelas: string
  multa: string
  juros: string
  desconto: string
  custas: string
  honorarios: string
  valorNegociado: string
  parcelado: string
  quantidadeParcelas: string
  entrada: string
  primeiroVencimento: string
  formaPagamento: string
  resumo: string
}

const emptyForm: CaseForm = {
  cliente: "",
  contrato: "",
  valorOriginal: "",
  status: "",
  etapa: "",
  responsavel: "",
  dataEntrada: "",
  risco: "Médio",
  processo: "",
  advogado: "",
  parcelas: "",
  multa: "0",
  juros: "0",
  desconto: "0",
  custas: "0",
  honorarios: "0",
  valorNegociado: "0",
  parcelado: "Sim",
  quantidadeParcelas: "3",
  entrada: "0",
  primeiroVencimento: "",
  formaPagamento: "Boleto",
  resumo: "",
}

const clientesGate = ["Fribal", "Estácio Itapipoca", "Fortaleza Iguatemi", "Rio de Janeiro", "Intech", "Paulínia Nova", "Curitiba", "SG Itapipoca", "SG Atibaia"]

function normalizeLegalCase(item: Record<string, unknown>): JuridicoCaso {
  const valorOriginal = Number(item.original_value ?? item.valorOriginal ?? 0)
  const multa = Number(item.penalty_value ?? item.multa ?? 0)
  const juros = Number(item.interest_value ?? item.juros ?? 0)
  const desconto = Number(item.discount_value ?? item.desconto ?? 0)
  const custas = Number(item.legal_costs ?? item.custas ?? 0)
  const honorarios = Number(item.attorney_fees ?? item.honorarios ?? 0)
  const valorNegociado = Number(item.negotiated_value ?? item.valorNegociado ?? valorOriginal + multa + juros + custas + honorarios - desconto)

  return {
    id: String(item.id ?? ""),
    cliente: String(item.client_name ?? item.cliente ?? ""),
    contrato: String(item.contract_number ?? item.contrato ?? ""),
    parcelas: String(item.installments ?? item.parcelas ?? ""),
    processo: String(item.process_number ?? item.processo ?? ""),
    responsavel: String(item.internal_responsible ?? item.responsavel ?? ""),
    advogado: String(item.lawyer_name ?? item.advogado ?? ""),
    status: String(item.status ?? "Em análise") as JuridicoCaso["status"],
    etapa: String(item.stage ?? item.etapa ?? ""),
    risco: String(item.risk ?? item.risco ?? "Médio") as JuridicoCaso["risco"],
    valorOriginal,
    mensalidade: Number(item.monthly_value ?? item.mensalidade ?? valorOriginal),
    parcelasVencidas: Number(item.overdue_installments_count ?? item.parcelasVencidas ?? 0),
    multa,
    juros,
    desconto,
    custas,
    honorarios,
    valorNegociado,
    valorPago: Number(item.paid_value ?? item.valorPago ?? 0),
    dataEntrada: String(item.legal_entry_date ?? item.dataEntrada ?? ""),
    ultimaAtualizacao: String(item.last_update_date ?? item.ultimaAtualizacao ?? ""),
    proximoPrazo: String(item.next_deadline ?? item.proximoPrazo ?? ""),
    prazoPagamento: String(item.payment_deadline ?? item.prazoPagamento ?? ""),
    encerramentoPrevisto: String(item.expected_closing_date ?? item.encerramentoPrevisto ?? ""),
    parcelado: Boolean(item.is_installment_agreement ?? item.parcelado ?? false),
    acordoStatus: String(item.agreement_status ?? item.acordoStatus ?? ""),
    entrada: Number(item.down_payment ?? item.entrada ?? 0),
    quantidadeParcelas: Number(item.installments_count ?? item.quantidadeParcelas ?? 1),
    primeiroVencimento: String(item.first_due_date ?? item.primeiroVencimento ?? ""),
    formaPagamento: String(item.payment_method ?? item.formaPagamento ?? ""),
    resumo: String(item.case_summary ?? item.resumo ?? ""),
    ultimoAndamento: String(item.last_progress ?? item.ultimoAndamento ?? ""),
    resultadoEsperado: String(item.expected_result ?? item.resultadoEsperado ?? ""),
    resultadoAcao: String(item.lawsuit_result ?? item.resultadoAcao ?? ""),
    observacoes: String(item.internal_notes ?? item.observacoes ?? ""),
  }
}

function riskClass(risk: string) {
  if (risk === "Crítico") return "bg-red-100 text-red-700"
  if (risk === "Alto") return "bg-orange-100 text-orange-700"
  if (risk === "Médio") return "bg-amber-100 text-amber-700"
  return "bg-emerald-100 text-emerald-700"
}

function statusClass(status: string) {
  if (status === "Encerrado") return "bg-emerald-100 text-emerald-700"
  if (status === "Ação judicial" || status === "Em execução") return "bg-red-100 text-red-700"
  if (status === "Em negociação" || status === "Acordo firmado") return "bg-blue-100 text-blue-700"
  return "bg-amber-100 text-amber-700"
}

function CaseFormDialog({
  onCreate,
  clientOptions,
  contractOptions,
}: {
  onCreate: (caso: JuridicoCaso) => void | Promise<void>
  clientOptions: string[]
  contractOptions: string[]
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CaseForm>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)

  const setField = (field: keyof CaseForm, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value ?? "" }))
    setErrors((current) => ({ ...current, [field]: "" }))
    setSubmitError("")
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.cliente) nextErrors.cliente = "Informe o cliente."
    if (!form.status) nextErrors.status = "Informe o status."
    if (!form.etapa) nextErrors.etapa = "Informe a etapa."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    setSubmitError("")
    try {
      await onCreate({
      id: `jur-${Date.now()}`,
      cliente: form.cliente,
      contrato: form.contrato,
      parcelas: "",
      processo: "",
      responsavel: "",
      advogado: "",
      status: form.status as JuridicoCaso["status"],
      etapa: form.etapa,
      risco: form.risco as JuridicoCaso["risco"],
      valorOriginal: 0,
      mensalidade: 0,
      parcelasVencidas: 0,
      multa: 0,
      juros: 0,
      desconto: 0,
      custas: 0,
      honorarios: 0,
      valorNegociado: 0,
      valorPago: 0,
      dataEntrada: new Date().toISOString().slice(0, 10),
      ultimaAtualizacao: new Date().toISOString().slice(0, 10),
      proximoPrazo: form.primeiroVencimento,
      prazoPagamento: "",
      encerramentoPrevisto: "",
      parcelado: false,
      acordoStatus: "",
      entrada: 0,
      quantidadeParcelas: 0,
      primeiroVencimento: form.primeiroVencimento,
      formaPagamento: "",
      resumo: form.resumo,
      ultimoAndamento: "Caso criado no módulo jurídico.",
      resultadoEsperado: "",
      resultadoAcao: "",
      observacoes: form.resumo,
      })
      toast.success("Caso jurídico criado com sucesso")
      setForm(emptyForm)
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o caso jurídico."
      console.error("[juridico] Falha ao salvar caso", error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const select = (field: keyof CaseForm, label: string, options: string[]) => (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={form[field]} onValueChange={(value) => setField(field, value)}>
        <SelectTrigger className="w-full"><SelectValue placeholder={label} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  )

  const input = (field: keyof CaseForm, label: string, type = "text") => (
    <div className="grid gap-2">
      <Label htmlFor={`jur-${field}`}>{label}</Label>
      <Input id={`jur-${field}`} type={type} value={form[field]} onChange={(event) => setField(field, event.target.value)} />
      {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
    </div>
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Caso Jurídico
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Novo Caso Jurídico</DialogTitle>
            <DialogDescription>Cadastro para cobrança jurídica, acordos e ações.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-2 md:grid-cols-3">
            {select("cliente", "Cliente", clientOptions.length ? clientOptions : clientesGate)}
            {select("contrato", "Contrato vinculado", contractOptions)}
            {select("status", "Status", juridicoStatuses)}
            {select("etapa", "Etapa", juridicoEtapas)}
            {select("risco", "Risco", juridicoRiscos)}
            {input("primeiroVencimento", "Prazo", "date")}
            {input("resumo", "Resumo do caso")}
            {submitError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive md:col-span-3">
                {submitError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar caso"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CaseDetailDialog({ caso, onClose }: { caso: JuridicoCaso | null; onClose: () => void }) {
  if (!caso) return null
  const valorAtualizado = getValorAtualizado(caso)
  const saldo = valorAtualizado - caso.valorPago
  const valorParcela = caso.parcelado ? (caso.valorNegociado - caso.entrada) / caso.quantidadeParcelas : caso.valorNegociado

  return (
    <Dialog open={!!caso} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{caso.cliente} - {caso.contrato}</DialogTitle>
          <DialogDescription>Detalhe do caso jurídico.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="resumo">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
            <TabsTrigger value="valores">Valores</TabsTrigger>
            <TabsTrigger value="acordo">Acordo/Parcelamento</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="contrato">Contrato vinculado</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas vinculadas</TabsTrigger>
          </TabsList>
          <TabsContent value="resumo" className="grid gap-3 pt-4 md:grid-cols-3">
            {[
              ["Cliente", caso.cliente],
              ["Contrato", caso.contrato],
              ["Status", caso.status],
              ["Etapa atual", caso.etapa],
              ["Risco", caso.risco],
              ["Responsável", caso.responsavel],
              ["Última atualização", caso.ultimaAtualizacao],
              ["Próximo prazo", caso.proximoPrazo],
              ["Resultado da ação", caso.resultadoAcao],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="andamentos" className="space-y-3 pt-4">
            <div className="rounded-lg border p-3"><strong>Último andamento:</strong> {caso.ultimoAndamento}</div>
            <div className="rounded-lg border p-3"><strong>Resultado esperado:</strong> {caso.resultadoEsperado}</div>
            <Button onClick={() => featureInPreparation("Atualizacao de andamento depende do registro real do historico juridico.")}>Atualizar andamento</Button>
          </TabsContent>
          <TabsContent value="valores" className="grid gap-3 pt-4 md:grid-cols-3">
            {[
              ["Valor original", caso.valorOriginal],
              ["Multa", caso.multa],
              ["Juros", caso.juros],
              ["Custas", caso.custas],
              ["Honorários", caso.honorarios],
              ["Desconto", caso.desconto],
              ["Valor atualizado", valorAtualizado],
              ["Valor negociado", caso.valorNegociado],
              ["Valor pago", caso.valorPago],
              ["Saldo em aberto", saldo],
              ["Dias em atraso", getDiasAtraso(caso.dataEntrada)],
              ["Juros acumulado", caso.juros],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold">{typeof value === "number" && label !== "Dias em atraso" ? formatCurrency(value) : value}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="acordo" className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-3"><p className="text-sm text-muted-foreground">Tipo</p><p className="font-semibold">{caso.parcelado ? "Parcelado" : "À vista"}</p></div>
              <div className="rounded-lg border p-3"><p className="text-sm text-muted-foreground">Valor por parcela</p><p className="font-semibold">{formatCurrency(valorParcela)}</p></div>
              <div className="rounded-lg border p-3"><p className="text-sm text-muted-foreground">Status</p><p className="font-semibold">{caso.acordoStatus}</p></div>
              <div className="rounded-lg border p-3"><p className="text-sm text-muted-foreground">Parcelas pendentes</p><p className="font-semibold">{Math.max(0, caso.quantidadeParcelas - 1)}</p></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Parcela</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {Array.from({ length: caso.quantidadeParcelas }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}/{caso.quantidadeParcelas}</TableCell>
                    <TableCell>{formatCurrency(valorParcela)}</TableCell>
                    <TableCell>{caso.primeiroVencimento}</TableCell>
                    <TableCell>{index === 0 ? "Pago" : "Pendente"}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="link" size="sm" onClick={() => featureInPreparation("Baixa de parcela de acordo depende do fluxo real de pagamentos juridicos.")}>Marcar como pago</Button>
                      <Button variant="link" size="sm" onClick={() => featureInPreparation("Geracao de recibo juridico depende da rotina real de documentos.")}>Gerar recibo</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="documentos" className="pt-4">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Responsável</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {juridicoDocumentTypes.slice(0, 4).map((type, index) => (
                  <TableRow key={type}>
                    <TableCell>{type} - {caso.contrato}</TableCell>
                    <TableCell>{type}</TableCell>
                    <TableCell>04/06/2026</TableCell>
                    <TableCell>{caso.responsavel}</TableCell>
                    <TableCell><Button variant="link" size="sm" onClick={() => toast.error("Documento juridico sem arquivo real vinculado para visualizacao.")}>Visualizar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="historico" className="pt-4"><div className="rounded-lg border p-3">{caso.observacoes}</div></TabsContent>
          <TabsContent value="contrato" className="pt-4"><div className="rounded-lg border p-3">Contrato vinculado: <strong>{caso.contrato}</strong></div></TabsContent>
          <TabsContent value="parcelas" className="pt-4"><div className="rounded-lg border p-3">Parcelas vinculadas: <strong>{caso.parcelas}</strong></div></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function JuridicoContent() {
  const [cases, setCases] = useState<JuridicoCaso[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [etapaFilter, setEtapaFilter] = useState("all")
  const [responsavelFilter, setResponsavelFilter] = useState("all")
  const [periodoFilter, setPeriodoFilter] = useState("all")
  const [riscoFilter, setRiscoFilter] = useState("all")
  const [pagamentoFilter, setPagamentoFilter] = useState("all")
  const [selectedCase, setSelectedCase] = useState<JuridicoCaso | null>(null)
  const [clientOptions, setClientOptions] = useState<string[]>([])
  const [contractOptions, setContractOptions] = useState<string[]>([])

  useEffect(() => {
    getLegalCases().then((items) =>
      setCases(items.map((item) => normalizeLegalCase(item as Record<string, unknown>)))
    )
    getClients().then((items) => {
      setClientOptions(items.map((item) => {
        const record = item as Record<string, unknown>
        return String(record.name ?? record.nome_fantasia ?? record.razao_social ?? record.company_name ?? "")
      }).filter(Boolean))
    })
    getContracts().then((items) => {
      setContractOptions(items.map((item) => {
        const record = item as Record<string, unknown>
        return String(record.contract_number ?? record.number ?? record.numero ?? record.id ?? "")
      }).filter(Boolean))
    })
  }, [])

  const filteredCases = cases.filter((caso) => {
    const term = searchTerm.toLowerCase()
    return (
      (!term || caso.cliente.toLowerCase().includes(term) || caso.contrato.toLowerCase().includes(term) || caso.processo.toLowerCase().includes(term)) &&
      (statusFilter === "all" || caso.status === statusFilter) &&
      (etapaFilter === "all" || caso.etapa === etapaFilter) &&
      (responsavelFilter === "all" || caso.responsavel === responsavelFilter) &&
      (riscoFilter === "all" || caso.risco === riscoFilter) &&
      (pagamentoFilter === "all" || caso.formaPagamento === pagamentoFilter) &&
      periodoFilter
    )
  })

  const activeCases = cases.filter((caso) => caso.status !== "Encerrado" && caso.status !== "Perdido").length
  const negotiationCases = cases.filter((caso) => caso.status === "Em negociação").length
  const judicialCases = cases.filter((caso) => caso.status === "Ação judicial").length
  const closedCases = cases.filter((caso) => caso.status === "Encerrado").length
  const totalOriginal = cases.reduce((sum, caso) => sum + caso.valorOriginal, 0)
  const totalMulta = cases.reduce((sum, caso) => sum + caso.multa, 0)
  const totalJuros = cases.reduce((sum, caso) => sum + caso.juros, 0)
  const totalRecovered = cases.reduce((sum, caso) => sum + caso.valorPago, 0)
  const highRisk = cases.filter((caso) => caso.risco === "Alto" || caso.risco === "Crítico").length

  const metrics = [
    ["Casos ativos", activeCases],
    ["Casos em negociação", negotiationCases],
    ["Casos em ação judicial", judicialCases],
    ["Casos encerrados", closedCases],
    ["Valor total em cobrança", formatCurrency(totalOriginal)],
    ["Valor total de multas", formatCurrency(totalMulta)],
    ["Valor total de juros", formatCurrency(totalJuros)],
    ["Valor recuperado", formatCurrency(totalRecovered)],
    ["Próximos vencimentos de acordo", 2],
    ["Contratos com risco alto", highRisk],
  ]

  const selectFilter = (value: string, setter: (value: string) => void, label: string, options: string[]) => (
    <Select value={value} onValueChange={(next) => setter(next ?? "all")}>
      <SelectTrigger className="w-44"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jurídico</h1>
          <p className="text-muted-foreground">Gestão de contratos em cobrança, acordos e ações judiciais.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportPdfReport(buildLegalReport(filteredCases.map((caso) => ({
            id: caso.id,
            client_name: caso.cliente,
            contract_number: caso.contrato,
            processo: caso.processo,
            status: caso.status,
            type: caso.etapa,
            risco: caso.risco,
            amount: caso.valorOriginal,
            valorAtualizado: getValorAtualizado(caso),
            responsavel: caso.responsavel,
            proximoPrazo: caso.proximoPrazo,
          }))))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <CaseFormDialog
            clientOptions={clientOptions}
            contractOptions={contractOptions}
            onCreate={async (caso) => {
              const created = await createLegalCase({
                client_name: caso.cliente,
                contract_number: caso.contrato || null,
                status: caso.status,
                stage: caso.etapa,
                risk: caso.risco,
                next_deadline: caso.proximoPrazo,
                case_summary: caso.resumo,
                internal_notes: caso.observacoes,
              })
              setCases((current) => [normalizeLegalCase(created as Record<string, unknown>), ...current])
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {metrics.map(([label, value]) => (
          <Card key={String(label)}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
            <div className="relative flex-1 min-w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por cliente, contrato ou processo..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10" />
            </div>
            {selectFilter(statusFilter, setStatusFilter, "Status", juridicoStatuses)}
            {selectFilter(etapaFilter, setEtapaFilter, "Etapa", juridicoEtapas)}
            {selectFilter(responsavelFilter, setResponsavelFilter, "Responsável", juridicoResponsaveis)}
            {selectFilter(periodoFilter, setPeriodoFilter, "Período", ["Últimos 30 dias", "Este trimestre", "Este ano"])}
            {selectFilter(riscoFilter, setRiscoFilter, "Risco", juridicoRiscos)}
            {selectFilter(pagamentoFilter, setPagamentoFilter, "Forma de pagamento", juridicoFormasPagamento)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Casos jurídicos</CardTitle>
          <CardDescription>Contratos em cobrança, acordos e ações judiciais.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Valor original</TableHead>
                <TableHead>Multa</TableHead>
                <TableHead>Juros</TableHead>
                <TableHead>Valor atualizado</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última atualização</TableHead>
                <TableHead>Próximo prazo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caso) => (
                <TableRow key={caso.id}>
                  <TableCell className="font-medium">{caso.cliente}<Badge className={`ml-2 ${riskClass(caso.risco)}`}>{caso.risco}</Badge></TableCell>
                  <TableCell className="font-mono">{caso.contrato}</TableCell>
                  <TableCell>{caso.processo || "-"}</TableCell>
                  <TableCell>{formatCurrency(caso.valorOriginal)}</TableCell>
                  <TableCell>{formatCurrency(caso.multa)}</TableCell>
                  <TableCell>{formatCurrency(caso.juros)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(getValorAtualizado(caso))}</TableCell>
                  <TableCell>{caso.etapa}</TableCell>
                  <TableCell><Badge className={statusClass(caso.status)}>{caso.status}</Badge></TableCell>
                  <TableCell>{caso.ultimaAtualizacao}</TableCell>
                  <TableCell>{caso.proximoPrazo}</TableCell>
                  <TableCell>{caso.responsavel}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedCase(caso)}><Eye className="mr-2 h-4 w-4" />Ver caso</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => featureInPreparation("Edicao de caso juridico depende do formulario real de edicao.")}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => featureInPreparation("Atualizacao de andamento depende do registro real do historico juridico.")}>Atualizar andamento</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => featureInPreparation("Anexo de documento juridico depende de upload real no Storage.")}>Anexar documento</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => featureInPreparation("Registro de pagamento juridico depende do fluxo financeiro real.")}>Registrar pagamento</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => featureInPreparation("Criacao de acordo parcelado depende do cadastro real de parcelas juridicas.")}>Criar acordo</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => featureInPreparation("Encerramento de caso depende de persistencia real do status juridico.")}>Encerrar caso</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><AlertTriangle className="mb-2 h-5 w-5 text-amber-600" /><p className="font-semibold">Acordos vencendo</p><p className="text-sm text-muted-foreground">2 acordos exigem acompanhamento.</p></CardContent></Card>
        <Card><CardContent className="p-4"><CalendarClock className="mb-2 h-5 w-5 text-primary" /><p className="font-semibold">Audiências</p><p className="text-sm text-muted-foreground">1 audiência prevista este mês.</p></CardContent></Card>
        <Card><CardContent className="p-4"><Paperclip className="mb-2 h-5 w-5 text-emerald-600" /><p className="font-semibold">Documentos jurídicos</p><p className="text-sm text-muted-foreground">Contratos, notificações, petições e acordos vinculados ao caso.</p></CardContent></Card>
      </div>

      <CaseDetailDialog caso={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  )
}
