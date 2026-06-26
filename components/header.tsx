"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Bell, ChevronDown, FileText, LogOut, Plus, Search, Send, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { getClients } from "@/lib/data/clients"
import { getContracts } from "@/lib/data/contracts"
import { getDocuments } from "@/lib/data/documents"
import { getEquipment } from "@/lib/data/equipment"
import { getFinancialEntries } from "@/lib/data/financial"
import { getInstallments } from "@/lib/data/installments"
import { getNotifications, markNotificationAsRead } from "@/lib/data/notifications"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { CosFileAnalysisPreview } from "@/lib/cos/cos-file-analysis"
import type { StructuredInputAction, StructuredInputPreview } from "@/lib/cos/structured-input-preview"

type SearchRecord = Record<string, unknown>
type SearchItem = { label: string; description: string; href: string }
type NotificationItem = Record<string, unknown> & {
  id: string
  read?: boolean
  lida?: boolean
  title?: string
  message?: string
  time?: string
  link?: string
}
type CosChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: CosAttachment[]
  preview?: CosAssistantPreview
}
type CosAssistantPreview = CosFileAnalysisPreview | StructuredInputPreview
type CosAttachment = {
  id: string
  name: string
  size: number
  type: string
}
type CosActionKind = "create_client" | "create_financial_entry" | "attach_document"
type CosActionReview = {
  kind: CosActionKind
  title: string
  description: string
  endpoint: string
  payload: Record<string, unknown>
  source: {
    fileName?: string
    type?: string
    confidence?: number
    detectedType?: string
  }
  fileName?: string
  requiresNoDocumentConfirmation?: boolean
  requiresExtraConfirmation?: string
}
type CosReviewField = {
  key: string
  label: string
  type?: "text" | "date" | "money" | "textarea"
  required?: boolean
}
type SessionProfile = {
  name: string
  email: string
  role: string
  avatar?: string
  cargo?: string
}

function text(value: unknown) {
  return String(value ?? "")
}

function CosLogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block overflow-hidden rounded-md ${className}`}>
      <Image
        src="/images/cos-logo-official.jpeg"
        alt="COS"
        fill
        sizes="40px"
        className="object-contain"
      />
    </span>
  )
}

const COS_INITIAL_MESSAGE =
  "Olá! Sou o COS, seu assistente da GATE Center. Como posso ajudar você hoje?"

const COS_SUGGESTIONS = [
  "Mostrar contratos ativos",
  "Clientes inadimplentes",
  "Receita deste mês",
  "Equipamentos disponíveis",
  "Abrir chamado",
  "Resumo financeiro",
]

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatPreviewValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "boolean") return value ? "Sim" : "Nao"
  return String(value)
}

function formatMoney(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

const COS_ANALYSIS_STORAGE_KEY = "gate-cos-last-analysis-v1"
const COS_REVIEW_FIELDS: Record<CosActionKind, CosReviewField[]> = {
  create_client: [
    { key: "name", label: "Razao social", required: true },
    { key: "document_number", label: "CNPJ/CPF", required: true },
    { key: "address", label: "Endereco", type: "textarea" },
    { key: "city", label: "Cidade" },
    { key: "state", label: "Estado" },
    { key: "zip_code", label: "CEP" },
    { key: "representative", label: "Representante legal" },
    { key: "contact_name", label: "Contato principal" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Telefone" },
  ],
  create_financial_entry: [
    { key: "type", label: "Tipo", required: true },
    { key: "description", label: "Descricao", type: "textarea", required: true },
    { key: "value", label: "Valor", type: "money", required: true },
    { key: "competence_date", label: "Competencia", type: "date", required: true },
    { key: "due_date", label: "Data de vencimento", type: "date", required: true },
    { key: "status", label: "Status" },
    { key: "category", label: "Categoria" },
  ],
  attach_document: [
    { key: "detectedType", label: "Tipo do documento", required: true },
    { key: "notes", label: "Observacoes", type: "textarea" },
  ],
}
const COS_FIELD_LABELS: Record<string, string> = {
  due_date: "Data de vencimento",
  competence_date: "Competencia",
  status: "Status",
  suggested_due_day: "Dia sugerido de vencimento",
  category: "Categoria",
  description: "Descricao",
  value: "Valor",
  confidence: "Confianca",
  confidenceLevel: "Nivel de confianca",
  source_file: "Arquivo de origem",
  sourceType: "Tipo de origem",
  documentType: "Tipo de documento",
  file: "Arquivo",
  entities: "Entidades",
  modules: "Modulos",
  type: "Tipo",
  name: "Nome",
  document_number: "CNPJ/CPF",
  email: "E-mail",
  phone: "Telefone",
  city: "Cidade",
  address: "Endereco",
  quantity_total: "Quantidade",
}

function fieldLabel(key: string) {
  return COS_FIELD_LABELS[key] ?? key.replace(/_/g, " ")
}

function normalizeDocumentForReview(value: unknown) {
  return String(value ?? "").replace(/\D/g, "")
}

function cleanClientNameForReview(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*[,;]?\s*\b(CNPJ|CPF)\b\s*[:\-]?\s*[\d./-]+.*$/i, "")
    .replace(/\s*[,;]?\s*\bpessoa\s+jur[ií]dica\s+de\s+direito\s+privado\b.*$/i, "")
    .replace(/\s*[,;]?\s*\bdenominad[ao]\s+LOCAT[ÁA]RIA\b.*$/i, "")
    .replace(/\s*[,;]?\s*\bendere[cç]o\b\s*[:\-]?.*$/i, "")
    .replace(/\s*[,;]?\s*\b(Rua|Avenida|Av\.|Travessa|Rodovia)\b.*$/i, "")
    .replace(/[;,]+$/, "")
    .trim()
}

function unsafeClientNameReason(value: unknown) {
  const current = String(value ?? "").trim()
  if (!current) return "Dados do cliente ainda precisam de revisão manual."
  if (
    /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/.test(current) ||
    /\bpessoa\s+jur[ií]dica\b/i.test(current) ||
    /\bdenominad[ao]\b/i.test(current) ||
    /\bendere[cç]o\b/i.test(current) ||
    /\b(Rua|Avenida|Av\.|Travessa|Rodovia)\b/i.test(current) ||
    /\b(CL[ÁA]USULA|CLAUSULA|foro|obriga[cç][aã]o|rescis[aã]o)\b/i.test(current) ||
    current.length > 160
  ) {
    return "Dados do cliente ainda precisam de revisão manual."
  }
  return ""
}

function toDateInput(value: unknown) {
  const text = String(value ?? "").trim()
  if (!text) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/)
  if (!match) return ""
  const day = match[1].padStart(2, "0")
  const month = match[2].padStart(2, "0")
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]
  return `${year}-${month}-${day}`
}

function firstDueDateFromDay(startDate: unknown, dueDay?: number) {
  const isoStart = toDateInput(startDate)
  if (!isoStart || !dueDay) return ""
  const [year, month, day] = isoStart.split("-").map(Number)
  const dueDate = new Date(year, month - 1, dueDay)
  if (dueDay < day) dueDate.setMonth(dueDate.getMonth() + 1)
  return `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`
}

function parseReviewNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  const text = String(value ?? "").trim()
  if (!text) return undefined
  const normalized = text.includes(",")
    ? text.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".")
    : text.replace(/[R$\s]/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function hasCosPreview(messages: CosChatMessage[]) {
  return messages.some((message) => Boolean(message.preview))
}

function loadPersistedCosMessages(): CosChatMessage[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(COS_ANALYSIS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { messages?: CosChatMessage[] }
    return Array.isArray(parsed.messages) && hasCosPreview(parsed.messages) ? parsed.messages : null
  } catch {
    return null
  }
}

function persistCosMessages(messages: CosChatMessage[]) {
  if (typeof window === "undefined" || !hasCosPreview(messages)) return
  window.localStorage.setItem(
    COS_ANALYSIS_STORAGE_KEY,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      messages,
    })
  )
}

function ConfidenceBadge({ confidence, level }: { confidence?: number; level?: string }) {
  const numeric = typeof confidence === "number" && Number.isFinite(confidence) ? confidence : undefined
  const resolvedLevel = level ?? (numeric === undefined ? "baixa" : numeric >= 75 ? "alta" : numeric >= 50 ? "media" : "baixa")
  const className =
    resolvedLevel === "alta"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : resolvedLevel === "media"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-900"

  return (
    <Badge variant="outline" className={`rounded-full ${className}`}>
      {resolvedLevel} confianca{numeric !== undefined ? ` (${numeric}%)` : ""}
    </Badge>
  )
}

function FieldWarnings({ warnings, missingFields }: { warnings?: string[]; missingFields?: string[] }) {
  const visibleWarnings = warnings?.filter(Boolean) ?? []
  const visibleMissing = missingFields?.filter(Boolean) ?? []
  if (visibleWarnings.length === 0 && visibleMissing.length === 0) return null

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
      {visibleWarnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
      {visibleMissing.length > 0 && <p>Campos para revisar: {visibleMissing.join(", ")}.</p>}
    </div>
  )
}

function EntityActionButton({
  children,
  disabled = true,
  onClick,
}: {
  children: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <Button type="button" disabled={disabled} variant="outline" className="mt-3 w-full rounded-2xl" onClick={onClick}>
      {children}
      {disabled ? " (proxima etapa)" : ""}
    </Button>
  )
}

function PreviewTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: string[] }) {
  const visibleRows = rows.slice(0, 5)
  if (visibleRows.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-muted/70 text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                  {fieldLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={index} className="border-t border-border/80">
                {columns.map((column) => (
                  <td key={column} className="max-w-56 px-3 py-2 text-foreground [overflow-wrap:anywhere]">
                    {formatPreviewValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > visibleRows.length && (
        <p className="border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Mostrando 5 de {rows.length} item(ns) na previa.
        </p>
      )}
    </div>
  )
}

function ContractExtractionCards({
  preview,
  onAction,
}: {
  preview: CosFileAnalysisPreview["contractExtractions"][number]
  onAction: (review: CosActionReview) => void
}) {
  const client = preview.extractedClient
  const contract = preview.extractedContract
  const source = {
    fileName: preview.sourceFile,
    type: "contract",
    confidence: preview.confidence,
    detectedType: "Contrato",
  }
  const cleanClientName = cleanClientNameForReview(client?.legalName)
  const clientDocument = normalizeDocumentForReview(client?.documentNumber)
  const clientBlockReason =
    client && (unsafeClientNameReason(cleanClientName) || (!clientDocument && client.confidenceLevel !== "alta"))
      ? "Dados do cliente ainda precisam de revisão manual."
      : ""

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-white p-4 [overflow-wrap:anywhere]">
      <div>
        <p className="font-semibold">Contrato analisado: {preview.sourceFile}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ConfidenceBadge confidence={preview.confidence} />
          <span className="text-muted-foreground">Nenhum dado foi gravado.</span>
        </div>
      </div>

      {preview.extractedParties?.lessor && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Locadora</p>
            <ConfidenceBadge
              confidence={preview.extractedParties.lessor.confidence}
              level={preview.extractedParties.lessor.confidenceLevel}
            />
          </div>
          <div className="mt-2 space-y-1 text-muted-foreground [overflow-wrap:anywhere]">
            <p>{preview.extractedParties.lessor.legalName || "Razao social nao identificada"}</p>
            <p>CNPJ/Documento: {preview.extractedParties.lessor.documentNumber || "-"}</p>
            <p>Endereco: {preview.extractedParties.lessor.address || "-"}</p>
            <p>Representante: {preview.extractedParties.lessor.representative || "-"}</p>
          </div>
          <FieldWarnings
            warnings={preview.extractedParties.lessor.warnings}
            missingFields={preview.extractedParties.lessor.missingFields}
          />
        </div>
      )}

      {client && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Cliente / Locataria</p>
            <ConfidenceBadge confidence={client.confidence} level={client.confidenceLevel} />
          </div>
          <div className="mt-2 space-y-1 text-muted-foreground [overflow-wrap:anywhere]">
            <p>{cleanClientName || "Razao social nao identificada"}</p>
            <p>CNPJ/Documento: {client.documentNumber || "-"}</p>
            <p>
              Local: {[client.city, client.state].filter(Boolean).join(" - ") || "-"}
              {client.postalCode ? `, CEP ${client.postalCode}` : ""}
            </p>
            {client.address && <p>Endereco: {client.address}</p>}
            {client.representative && <p>Representante: {client.representative}</p>}
            {client.representativeDocument && <p>Documento do representante: {client.representativeDocument}</p>}
            {client.phone && <p>Telefone: {client.phone}</p>}
            {client.email && <p>E-mail: {client.email}</p>}
            {client.primaryContact && <p>Contato principal: {client.primaryContact}</p>}
            {client.guarantor && <p>Fiador: {client.guarantor}</p>}
          </div>
          <FieldWarnings warnings={client.warnings} missingFields={client.missingFields} />
          {clientBlockReason && (
            <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-amber-900">{clientBlockReason}</p>
          )}
          <EntityActionButton
            disabled={Boolean(clientBlockReason)}
            onClick={() =>
              onAction({
                kind: "create_client",
                title: "Cadastrar cliente",
                description: "Revise os dados extraidos antes de criar o cliente.",
                endpoint: "/api/cos/actions/create-client",
                payload: {
                  name: cleanClientName,
                  legal_name: cleanClientName,
                  document_number: clientDocument,
                  address: client.address ?? "",
                  city: client.city ?? "",
                  state: client.state ?? "",
                  zip_code: client.postalCode ?? "",
                  representative: client.representative ?? "",
                  contact_name: client.primaryContact ?? "",
                  email: client.email ?? "",
                  phone: client.phone ?? "",
                  confidence: client.confidence ?? preview.confidence,
                  source_file: preview.sourceFile,
                },
                source,
                requiresNoDocumentConfirmation: !client.documentNumber,
                requiresExtraConfirmation:
                  client.confidenceLevel === "baixa"
                    ? "Confirmo que revisei manualmente os campos de baixa confianca antes de gravar."
                    : undefined,
              })
            }
          >
            Cadastrar cliente
          </EntityActionButton>
        </div>
      )}

      {contract && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Contrato</p>
            <ConfidenceBadge confidence={contract.confidence} level={contract.confidenceLevel} />
          </div>
          <div className="mt-2 space-y-1 text-muted-foreground [overflow-wrap:anywhere]">
            <p>Titulo: {contract.title || "-"}</p>
            <p>Tipo: {contract.contractType || "-"}</p>
            <p>Locadora: {contract.lessor || "-"}</p>
            <p>Locataria: {contract.lessee || "-"}</p>
            <p>Valor mensal: {formatMoney(contract.monthlyValue)}</p>
            <p>Valor total: {formatMoney(contract.totalValue)}</p>
            <p>Prazo: {contract.termMonths ? `${contract.termMonths} meses` : "-"}</p>
            <p>Vigencia: {contract.validity || "-"}</p>
            <p>Inicio provavel: {contract.probableStartDate || "-"}</p>
            <p>Final: {contract.endDate || contract.calculatedEndDate || "-"}</p>
            <p>Vencimento: {contract.monthlyDueDay ? `dia ${contract.monthlyDueDay}` : "-"}</p>
            <p>Caucao: {formatMoney(contract.depositValue)}</p>
            <p>Entrada: {formatMoney(contract.entryValue)}</p>
            <p>Recorrencia: {contract.recurrence || "-"}</p>
            <p>Indice de reajuste: {contract.adjustmentIndex || "-"}</p>
            <p>Regra de reajuste: {contract.adjustmentRule || "-"}</p>
            <p>Multa/rescisao: {contract.terminationFine || "-"}</p>
            <p>Juros: {contract.interest || "-"}</p>
            <p>Aviso previo: {contract.noticePeriod || "-"}</p>
            <p>Foro: {contract.venue || "-"}</p>
            {contract.intelligentNotes && contract.intelligentNotes.length > 0 && (
              <p>Observacoes: {contract.intelligentNotes.join(" ")}</p>
            )}
          </div>
          <FieldWarnings warnings={contract.warnings} missingFields={contract.missingFields} />
          <EntityActionButton>Cadastrar contrato</EntityActionButton>
        </div>
      )}

      {preview.extractedEquipment.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Equipamentos</p>
          <div className="mt-2 space-y-2 text-muted-foreground [overflow-wrap:anywhere]">
            {preview.extractedEquipment.slice(0, 8).map((item, index) => (
              <p key={`${item.description}-${index}`}>
                {item.quantity ? `${item.quantity}x ` : ""}
                {item.description}
                {item.configuration ? ` - ${item.configuration}` : ""}
                {item.unitValue ? ` - unitario ${formatMoney(item.unitValue)}` : ""}
                {item.totalValue ? ` - total ${formatMoney(item.totalValue)}` : ""}
                {item.confidenceLevel ? ` - ${item.confidenceLevel} confianca` : ""}
              </p>
            ))}
            {preview.extractedEquipment.length > 8 && (
              <p>Mais {preview.extractedEquipment.length - 8} item(ns) identificados.</p>
            )}
          </div>
          <EntityActionButton>Cadastrar equipamentos</EntityActionButton>
        </div>
      )}

      {preview.extractedFinancialEntries.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Financeiro sugerido</p>
          <div className="mt-2 space-y-2 text-muted-foreground [overflow-wrap:anywhere]">
            {preview.extractedFinancialEntries.map((entry, index) => (
              <div key={`${entry.description}-${index}`} className="rounded-xl bg-white/70 p-2">
                {(() => {
                  const competenceDate = toDateInput(entry.firstCompetence)
                  const dueDate = firstDueDateFromDay(entry.firstCompetence, entry.dueDay)
                  const sourceContractValue = preview.extractedContract?.monthlyValue
                  const financialBlocked =
                    !entry.value ||
                    (typeof entry.value === "number" && entry.value < 100 && typeof sourceContractValue === "number" && sourceContractValue >= 100) ||
                    !competenceDate ||
                    !dueDate ||
                    /\b(CL[ÁA]USULA|CLAUSULA|foro|obriga[cç][aã]o|rescis[aã]o)\b/i.test(entry.description)
                  return (
                    <>
                <p>
                  {entry.description}: {formatMoney(entry.value)}
                  {entry.dueDay ? `, vencimento dia ${entry.dueDay}` : ""}
                  {entry.installments ? `, ${entry.installments} parcela(s)` : ""}
                </p>
                {financialBlocked && (
                  <p className="mt-2 rounded-2xl bg-amber-50 p-2 text-amber-900">
                    Lancamento financeiro precisa de revisão manual antes de gravar.
                  </p>
                )}
                <EntityActionButton
                  disabled={financialBlocked}
                  onClick={() =>
                    onAction({
                      kind: "create_financial_entry",
                      title: "Criar lancamento financeiro",
                      description: "Revise o lancamento individual antes de gravar no financeiro.",
                      endpoint: "/api/cos/actions/create-financial-entry",
                      payload: {
                        type: entry.type,
                        description: entry.description,
                        value: entry.value,
                        due_date: dueDate,
                        competence_date: competenceDate,
                        status: "pendente",
                        category: entry.source,
                        source_contract_value: sourceContractValue ?? "",
                        value_confidence: entry.value ? "alta" : "baixa",
                      },
                      source,
                    })
                  }
                >
                  Criar lancamento financeiro
                </EntityActionButton>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="font-semibold">Documento</p>
        <p className="mt-2 text-muted-foreground">{preview.extractedDocument.suggestedNotes}</p>
        <EntityActionButton
          disabled={false}
          onClick={() =>
            onAction({
              kind: "attach_document",
              title: "Anexar documento",
              description: "Revise os metadados antes de anexar o arquivo ao sistema.",
              endpoint: "/api/cos/actions/attach-document",
              payload: {
                detectedType: preview.extractedDocument.type,
                notes: preview.extractedDocument.suggestedNotes,
              },
              source,
              fileName: preview.sourceFile,
            })
          }
        >
          Anexar documento
        </EntityActionButton>
      </div>

      {preview.warnings.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-900">
          {preview.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function FinancialOcrCards({
  preview,
  onAction,
}: {
  preview: CosFileAnalysisPreview["financialOcrAnalyses"][number]
  onAction: (review: CosActionReview) => void
}) {
  const revenueTotal = formatMoney(preview.summary.revenueTotal)
  const expenseTotal = formatMoney(preview.summary.expenseTotal)
  const resultTotal = formatMoney(preview.summary.operationalResult)
  const source = {
    fileName: preview.sourceFile,
    type: preview.sourceType,
    confidence: preview.confidence,
    detectedType: preview.detectedType,
  }

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-white p-4">
      <div>
        <p className="font-semibold">OCR financeiro: {preview.sourceFile}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {preview.detectedType}
          </Badge>
          <ConfidenceBadge confidence={preview.confidence} />
        </div>
        <p className="mt-1 text-muted-foreground">
          Nenhum dado foi gravado. Revise as informacoes antes de qualquer cadastro.
        </p>
      </div>

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="font-semibold">Resumo financeiro</p>
        <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2">
          <p>Valores detectados: {preview.summary.valuesDetected}</p>
          <p>Percentuais detectados: {preview.summary.percentagesDetected}</p>
          <p>Receita total: {revenueTotal}</p>
          <p>Despesas totais: {expenseTotal}</p>
          <p>Resultado operacional: {resultTotal}</p>
          <p>Colunas: {preview.extractedColumns.join(", ") || "-"}</p>
        </div>
        <EntityActionButton>Salvar analise</EntityActionButton>
      </div>

      {preview.diagnostics.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Diagnostico inteligente</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            {preview.diagnostics.slice(0, 5).map((diagnostic) => (
              <div key={`${diagnostic.type}-${diagnostic.title}`} className="rounded-xl bg-white/70 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{diagnostic.title}</p>
                  <ConfidenceBadge confidence={diagnostic.confidence} level={diagnostic.confidenceLevel} />
                </div>
                <p className="mt-1">{diagnostic.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {diagnostic.suggestedActions.map((action) => (
                    <Badge key={action} variant="outline" className="rounded-full">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.extractedDreRows.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Linhas DRE / gerenciais</p>
          <PreviewTable
            rows={preview.extractedDreRows}
            columns={["label", "rowKind", "category", "total", "confidenceLevel"]}
          />
          <EntityActionButton>Criar lancamentos sugeridos</EntityActionButton>
        </div>
      )}

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="font-semibold">Clientes encontrados</p>
        {preview.extractedClients.length > 0 ? (
          <div className="mt-2 space-y-2">
            {preview.extractedClients.map((client) => (
              <div key={client} className="rounded-xl bg-white/70 p-2">
                <Badge variant="secondary" className="rounded-full">
                  {client}
                </Badge>
                <EntityActionButton
                  disabled={false}
                  onClick={() =>
                    onAction({
                      kind: "create_client",
                      title: "Cadastrar cliente",
                      description: "Revise o cliente identificado pelo OCR antes de cadastrar.",
                      endpoint: "/api/cos/actions/create-client",
                      payload: { name: client, legalName: client },
                      source,
                      requiresNoDocumentConfirmation: true,
                    })
                  }
                >
                  Cadastrar cliente
                </EntityActionButton>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">Nenhum cliente identificado com confianca.</p>
        )}
      </div>

      {preview.extractedCategories.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Categorias DRE encontradas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {preview.extractedCategories.map((category) => (
              <Badge key={category} variant="outline" className="rounded-full">
                {category}
              </Badge>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <EntityActionButton>Criar categorias DRE</EntityActionButton>
            <EntityActionButton>Vincular categorias</EntityActionButton>
          </div>
        </div>
      )}

      {preview.extractedRevenue.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Receitas encontradas</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            {preview.extractedRevenue.slice(0, 8).map((item, index) => (
              <div key={`${item.description}-${index}`} className="rounded-xl bg-white/70 p-2">
                <p className="truncate">
                  {item.description}: {item.values.map((value) => formatMoney(value)).join(" | ")}
                </p>
                <EntityActionButton
                  disabled={false}
                  onClick={() =>
                    onAction({
                      kind: "create_financial_entry",
                      title: "Criar lancamento financeiro",
                      description: "Revise esta receita individual antes de gravar no financeiro.",
                      endpoint: "/api/cos/actions/create-financial-entry",
                      payload: {
                        type: "receita",
                        description: item.description,
                        value: item.values[item.values.length - 1],
                        category: item.category,
                        competence_date: "",
                        due_date: "",
                        status: "pendente",
                      },
                      source,
                    })
                  }
                >
                  Criar lancamento financeiro
                </EntityActionButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.extractedExpenses.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Despesas encontradas</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            {preview.extractedExpenses.slice(0, 8).map((item, index) => (
              <div key={`${item.description}-${index}`} className="rounded-xl bg-white/70 p-2">
                <p className="truncate">
                  {item.description}: {item.values.map((value) => formatMoney(value)).join(" | ")}
                </p>
                <EntityActionButton
                  disabled={false}
                  onClick={() =>
                    onAction({
                      kind: "create_financial_entry",
                      title: "Criar lancamento financeiro",
                      description: "Revise esta despesa individual antes de gravar no financeiro.",
                      endpoint: "/api/cos/actions/create-financial-entry",
                      payload: {
                        type: "despesa",
                        description: item.description,
                        value: item.values[item.values.length - 1],
                        category: item.category,
                        competence_date: "",
                        due_date: "",
                        status: "pendente",
                      },
                      source,
                    })
                  }
                >
                  Criar lancamento financeiro
                </EntityActionButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.extractedFinancialEntries.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Lancamentos financeiros sugeridos</p>
          <PreviewTable rows={preview.extractedFinancialEntries} columns={["type", "description", "value", "category", "source"]} />
          <EntityActionButton>Criar lancamentos financeiros</EntityActionButton>
        </div>
      )}

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="font-semibold">Documento</p>
        <p className="mt-2 text-muted-foreground">
          O arquivo original pode ser anexado ao sistema em uma etapa futura. Nesta versao, a analise permanece somente leitura.
        </p>
        <EntityActionButton
          disabled={false}
          onClick={() =>
            onAction({
              kind: "attach_document",
              title: "Anexar documento",
              description: "Revise os metadados antes de anexar o arquivo ao sistema.",
              endpoint: "/api/cos/actions/attach-document",
              payload: {
                detectedType: preview.detectedType,
                notes: `Analise OCR financeira: ${preview.detectedType}.`,
              },
              source,
              fileName: preview.sourceFile,
            })
          }
        >
          Anexar documento
        </EntityActionButton>
      </div>

      {preview.extractedWarnings.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-900">
          {preview.extractedWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function StructuredValueList({ title, data }: { title: string; data?: Record<string, unknown> }) {
  const rows = Object.entries(data ?? {}).filter(([, value]) => value !== undefined && value !== "")
  if (!rows.length) return null

  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 space-y-1 text-muted-foreground [overflow-wrap:anywhere]">
        {rows.map(([key, value]) => (
          <p key={key}>
            {COS_FIELD_LABELS[key] ?? key}: {formatPreviewValue(value)}
          </p>
        ))}
      </div>
    </div>
  )
}

function structuredActionToReview(action: StructuredInputAction): CosActionReview | null {
  if (!action.enabled) return null
  if (action.kind === "prepare_contract" || action.kind === "prepare_equipment") return null
  return {
    kind: action.kind,
    title: action.title,
    description: action.description,
    endpoint: action.endpoint,
    payload: action.payload,
    source: action.source,
    requiresNoDocumentConfirmation: action.requiresNoDocumentConfirmation,
  }
}

function StructuredInputCards({
  preview,
  onAction,
}: {
  preview: StructuredInputPreview
  onAction: (review: CosActionReview) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold">Entrada estruturada operacional</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {preview.source.detectedType}
          </Badge>
          <ConfidenceBadge confidence={preview.source.confidence} />
          <span className="text-muted-foreground">Nenhum dado foi gravado.</span>
        </div>
      </div>

      <StructuredValueList title="Cliente identificado" data={preview.client as Record<string, unknown> | undefined} />
      <StructuredValueList title="Contrato identificado" data={preview.contract as Record<string, unknown> | undefined} />
      <StructuredValueList title="Financeiro identificado" data={preview.financial as Record<string, unknown> | undefined} />
      <StructuredValueList title="Documento identificado" data={preview.document as Record<string, unknown> | undefined} />
      <StructuredValueList title="DRE identificada" data={preview.dre as Record<string, unknown> | undefined} />

      {preview.equipment.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Equipamentos identificados</p>
          <div className="mt-2 space-y-1 text-muted-foreground [overflow-wrap:anywhere]">
            {preview.equipment.map((item, index) => (
              <p key={`${item.description}-${index}`}>
                {item.quantity ? `${item.quantity}x ` : ""}
                {item.description}
                {item.brand_model ? ` - ${item.brand_model}` : ""}
                {item.notes ? ` (${item.notes})` : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      {preview.pending.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-900">
          <p className="font-semibold">Pendencias</p>
          <div className="mt-2 space-y-1">
            {preview.pending.map((item) => (
              <p key={item}>- {item}</p>
            ))}
          </div>
        </div>
      )}

      {preview.actions.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Acoes disponiveis</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {preview.actions.map((action) => {
              const review = structuredActionToReview(action)
              return (
                <div key={action.title} className="rounded-xl bg-white/70 p-2">
                  <EntityActionButton disabled={!review} onClick={review ? () => onAction(review) : undefined}>
                    {action.title}
                  </EntityActionButton>
                  {!action.enabled && action.blockedReason && (
                    <p className="mt-2 text-[11px] text-muted-foreground">{action.blockedReason}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CosPreviewPanel({
  preview,
  onAction,
}: {
  preview: CosAssistantPreview
  onAction: (review: CosActionReview) => void
}) {
  if (preview.kind === "structured_input") {
    return (
      <div className="mt-4 space-y-4 rounded-3xl border border-border bg-white p-4 text-xs text-foreground">
        <StructuredInputCards preview={preview} onAction={onAction} />
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4 rounded-3xl border border-border bg-white p-4 text-xs text-foreground">
      <div>
        <p className="font-semibold">Arquivos analisados</p>
        <div className="mt-2 space-y-2">
          {preview.files.map((file) => (
            <div key={`${file.name}-${file.size}`} className="rounded-2xl bg-muted/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{file.name}</span>
                <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
              {file.sheets.length > 0 && (
                <div className="mt-2 space-y-1 text-muted-foreground">
                  {file.sheets.map((sheet) => (
                    <div key={sheet.name} className="space-y-2 rounded-xl bg-white/70 p-3">
                      <p className="font-medium text-foreground">{sheet.name}</p>
                      {sheet.probableType && <p>Tipo provavel: {sheet.probableType}</p>}
                      <p>
                        Linhas analisadas: {sheet.rowCount}. Colunas uteis: {sheet.usefulColumns}. Cabecalho provavel:{" "}
                        {sheet.headerRow ? `linha ${sheet.headerRow}` : "nao identificado"}.
                      </p>
                      <p>Linhas vazias ignoradas: {sheet.ignoredEmptyRows}.</p>
                      <p>Colunas detectadas: {sheet.columns.slice(0, 12).join(", ") || "-"}</p>
                      {sheet.detectedSections.length > 0 && (
                        <p>Secoes detectadas: {sheet.detectedSections.slice(0, 8).join(", ")}</p>
                      )}
                      {sheet.sampleRows.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="font-medium text-foreground">Amostra estruturada</p>
                          <PreviewTable
                            rows={sheet.sampleRows}
                            columns={["_rowNumber", "_rowType", ...sheet.columns.slice(0, 6)]}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {file.notes.map((note) => (
                <p key={note} className="mt-2 text-muted-foreground">
                  {note}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {preview.contractExtractions.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Entidades extraidas de contratos</p>
          {preview.contractExtractions.map((contractPreview) => (
            <ContractExtractionCards key={contractPreview.sourceFile} preview={contractPreview} onAction={onAction} />
          ))}
        </div>
      )}

      {preview.financialOcrAnalyses.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Analise financeira por OCR</p>
          {preview.financialOcrAnalyses.map((ocrPreview) => (
            <FinancialOcrCards key={ocrPreview.sourceFile} preview={ocrPreview} onAction={onAction} />
          ))}
        </div>
      )}

      {preview.financialEntries.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Possiveis lancamentos financeiros</p>
          <PreviewTable
            rows={preview.financialEntries}
            columns={["type", "description", "competence_date", "due_date", "value", "status"]}
          />
        </div>
      )}

      {preview.clients.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Possiveis clientes</p>
          <PreviewTable rows={preview.clients} columns={["name", "document_number", "email", "phone", "city", "status"]} />
        </div>
      )}

      {preview.equipment.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Possiveis equipamentos</p>
          <PreviewTable rows={preview.equipment} columns={["name", "category", "quantity_total", "status"]} />
        </div>
      )}

      {preview.normalizedExtractions.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Inteligencia operacional</p>
          <div className="space-y-2">
            {preview.normalizedExtractions.slice(0, 4).map((item) => (
              <div key={`${item.sourceFile.name}-${item.sourceType}`} className="rounded-2xl bg-muted/60 p-3 [overflow-wrap:anywhere]">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.operationalIntelligence.documentTypeLabel}</p>
                  <ConfidenceBadge confidence={item.confidence} level={item.confidenceLevel} />
                </div>
                <p className="mt-1 text-muted-foreground">
                  {item.operationalIntelligence.executiveSummary ||
                    "Identifiquei um documento operacional com dados para revisao antes de qualquer gravacao."}
                </p>
                {item.operationalIntelligence.businessEntities.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-foreground">Dados encontrados</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from(new Set(item.operationalIntelligence.businessEntities.map((entity) => entity.entityType))).map((entityType) => (
                        <Badge key={entityType} variant="outline" className="rounded-full">
                          {entityType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.operationalIntelligence.missingData.length > 0 && (
                  <p className="mt-2 text-amber-900">Dados ausentes: {item.operationalIntelligence.missingData.join(", ")}.</p>
                )}
                {item.operationalIntelligence.possibleDivergences.length > 0 && (
                  <p className="mt-2 text-amber-900">
                    Divergencias possiveis: {item.operationalIntelligence.possibleDivergences.join(" ")}
                  </p>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Ver detalhes tecnicos</summary>
                  <div className="mt-2 space-y-2 text-muted-foreground">
                    {item.operationalIntelligence.logicalStructure.length > 0 && (
                      <p>Estrutura: {item.operationalIntelligence.logicalStructure.map((section) => section.name).join(", ")}.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {item.operationalIntelligence.operationalMappings.slice(0, 8).map((mapping) => (
                        <Badge key={`${mapping.entityType}-${mapping.gateModule}`} variant="secondary" className="rounded-full">
                          {mapping.entityType} {"->"} {mapping.gateModule}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.diagnostics.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Diagnosticos</p>
          <div className="space-y-2">
            {preview.diagnostics.slice(0, 6).map((diagnostic) => (
              <div key={`${diagnostic.type}-${diagnostic.title}`} className="rounded-2xl bg-muted/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{diagnostic.title}</p>
                  <ConfidenceBadge confidence={diagnostic.confidence} level={diagnostic.confidenceLevel} />
                </div>
                <p className="mt-1 text-muted-foreground">{diagnostic.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {diagnostic.suggestedActions.map((action) => (
                    <Badge key={action} variant="outline" className="rounded-full">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-3 text-amber-900">
          {preview.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <Button type="button" disabled className="w-full rounded-2xl">
        Confirmar execucao (proxima etapa)
      </Button>
    </div>
  )
}

export function Header() {
  const router = useRouter()
  const cosFileInputRef = useRef<HTMLInputElement | null>(null)
  const [cosOpen, setCosOpen] = useState(false)
  const [cosInput, setCosInput] = useState("")
  const [cosLoading, setCosLoading] = useState(false)
  const [cosDragActive, setCosDragActive] = useState(false)
  const [cosAttachments, setCosAttachments] = useState<File[]>([])
  const [cosUploadedFiles, setCosUploadedFiles] = useState<Record<string, File>>({})
  const [cosActionReview, setCosActionReview] = useState<CosActionReview | null>(null)
  const [cosActionPayload, setCosActionPayload] = useState<Record<string, string>>({})
  const [cosActionConfirmNoDocument, setCosActionConfirmNoDocument] = useState(false)
  const [cosActionSubmitting, setCosActionSubmitting] = useState(false)
  const [cosMessages, setCosMessages] = useState<CosChatMessage[]>(() => {
    return loadPersistedCosMessages() ?? [{ id: "cos-initial", role: "assistant", content: COS_INITIAL_MESSAGE }]
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [profile, setProfile] = useState<SessionProfile>({
    name: "Usuário GATE",
    email: "",
    role: "Usuário autenticado",
  })
  const [searchData, setSearchData] = useState({
    clients: [] as SearchRecord[],
    contracts: [] as SearchRecord[],
    equipments: [] as SearchRecord[],
    installments: [] as SearchRecord[],
    transactions: [] as SearchRecord[],
    documents: [] as SearchRecord[],
  })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase?.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) return

      const metadata = user.user_metadata ?? {}
      const name =
        String(metadata.full_name ?? metadata.name ?? "").trim() ||
        user.email?.split("@")[0] ||
        "Usuário GATE"

      setProfile({
        name,
        email: user.email ?? "",
        role: String(metadata.role ?? metadata.cargo ?? "Usuário autenticado"),
        avatar: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
        cargo: String(metadata.cargo ?? metadata.role ?? "Usuário autenticado"),
      })
    })

    getNotifications().then((items) => setNotifications(items as NotificationItem[]))
    Promise.all([
      getClients(),
      getContracts(),
      getEquipment(),
      getInstallments(),
      getFinancialEntries(),
      getDocuments(),
    ]).then(([clients, contracts, equipments, installments, transactions, documents]) => {
      setSearchData({
        clients: clients as SearchRecord[],
        contracts: contracts as SearchRecord[],
        equipments: equipments as SearchRecord[],
        installments: installments as SearchRecord[],
        transactions: transactions as SearchRecord[],
        documents: documents as SearchRecord[],
      })
    })
  }, [])

  useEffect(() => {
    persistCosMessages(cosMessages)
  }, [cosMessages])

  useEffect(() => {
    if (!cosActionReview || typeof document === "undefined") return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [cosActionReview])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []

    const groups: Array<{ group: string; items: SearchItem[] }> = [
      {
        group: "Clientes",
        items: searchData.clients.map((item) => ({
          label: text(item.name ?? item.nome_fantasia ?? item.razao_social),
          description: text(item.document ?? item.cnpj ?? item.cpf),
          href: `/clientes/${text(item.id)}`,
        })),
      },
      {
        group: "Contratos",
        items: searchData.contracts.map((item) => ({
          label: text(item.number ?? item.numero),
          description: text(item.clientName ?? item.client_name ?? item.client),
          href: `/contratos/${text(item.id)}`,
        })),
      },
      {
        group: "Equipamentos",
        items: searchData.equipments.map((item) => ({
          label: text(item.name ?? item.nome),
          description: text(item.serialNumber ?? item.serial_number ?? item.numero_serie),
          href: "/equipamentos",
        })),
      },
      {
        group: "Financeiro",
        items: searchData.installments.map((item) => ({
          label: text(item.contractNumber ?? item.contract_number ?? item.contract_id),
          description: text(item.clientName ?? item.client_name),
          href: "/financeiro",
        })),
      },
      {
        group: "Financeiro",
        items: searchData.transactions.map((item) => ({
          label: text(item.description ?? item.descricao),
          description: text(item.category ?? item.categoria ?? item.dre_category_name),
          href: "/financeiro",
        })),
      },
      {
        group: "Documentos",
        items: searchData.documents.map((item) => ({
          label: text(item.nome ?? item.name ?? item.file_name),
          description: text(item.tipo ?? item.type ?? item.category),
          href: "/documentos",
        })),
      },
      {
        group: "DRE",
        items: [{ label: "DRE", description: "Demonstrativo de resultado", href: "/dre" }],
      },
    ]

    return groups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => item.label.toLowerCase().includes(term) || item.description.toLowerCase().includes(term))
          .slice(0, 3),
      }))
      .filter((group) => group.items.length > 0)
  }, [searchData, searchTerm])

  const handleNavigate = (href: string) => {
    setSearchTerm("")
    router.push(href)
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markNotificationAsRead(notification.id)
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true, lida: true } : item))
    )
    handleNavigate(notification.link ?? "/dashboard")
  }

  const appendCosFiles = (files: FileList | File[]) => {
    const selected = Array.from(files)
    if (selected.length === 0) return

    setCosAttachments((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      const next = selected.filter((file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`))
      return [...current, ...next].slice(0, 8)
    })
  }

  const removeCosAttachment = (index: number) => {
    setCosAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const clearCosAnalysis = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(COS_ANALYSIS_STORAGE_KEY)
    }
    setCosMessages([{ id: "cos-initial", role: "assistant", content: COS_INITIAL_MESSAGE }])
    setCosUploadedFiles({})
    setCosAttachments([])
    toast.success("Analise do COS limpa.")
  }

  const openCosActionReview = (review: CosActionReview) => {
    const normalizedPayload = Object.fromEntries(
      Object.entries(review.payload).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)])
    )
    if (review.kind === "create_client") {
      const cleanName = cleanClientNameForReview(normalizedPayload.name || normalizedPayload.legal_name)
      normalizedPayload.name = cleanName
      normalizedPayload.legal_name = cleanName
      normalizedPayload.document_number = normalizeDocumentForReview(
        normalizedPayload.document_number || normalizedPayload.documentNumber
      )
    }
    setCosActionReview(review)
    setCosActionPayload(normalizedPayload)
    setCosActionConfirmNoDocument(false)
  }

  const closeCosActionReview = () => {
    if (cosActionSubmitting) return
    setCosActionReview(null)
    setCosActionPayload({})
    setCosActionConfirmNoDocument(false)
  }

  const executeCosAction = async () => {
    if (!cosActionReview || cosActionSubmitting) return

    setCosActionSubmitting(true)
    try {
      const file = cosActionReview.fileName ? cosUploadedFiles[cosActionReview.fileName] : undefined
      const response =
        cosActionReview.kind === "attach_document"
          ? await fetch(cosActionReview.endpoint, {
              method: "POST",
              body: (() => {
                const formData = new FormData()
                if (file) formData.append("file", file)
                formData.append("sourceFileName", cosActionReview.source.fileName ?? cosActionReview.fileName ?? "")
                formData.append("sourceFileType", cosActionReview.source.type ?? "")
                formData.append("sourceConfidence", String(cosActionReview.source.confidence ?? ""))
                formData.append("detectedType", cosActionPayload.detectedType ?? cosActionReview.source.detectedType ?? "")
                formData.append("notes", cosActionPayload.notes ?? "")
                return formData
              })(),
            })
          : await fetch(cosActionReview.endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payload: cosActionPayload,
                source: cosActionReview.source,
                confirmNoDocument: cosActionConfirmNoDocument,
              }),
            })

      const result = (await response.json().catch(() => null)) as { error?: string; log?: { logged?: boolean } } | null

      if (!response.ok) {
        toast.error(result?.error || "Nao foi possivel executar a acao do COS.")
        return
      }

      toast.success(result?.log?.logged === false ? "Acao executada. Log pendente de tabela COS." : "Acao executada com sucesso.")
      setCosMessages((current) => [
        ...current,
        {
          id: `assistant-action-${Date.now()}`,
          role: "assistant",
          content:
            result?.log?.logged === false
              ? "A acao foi executada com sucesso, mas o log do COS nao foi registrado porque a tabela de auditoria ainda precisa ser aplicada."
              : "Acao executada com sucesso e registrada no log do COS.",
        },
      ])
      setCosActionReview(null)
      setCosActionPayload({})
      setCosActionConfirmNoDocument(false)
    } catch (error) {
      console.error("[cos] Falha ao executar acao isolada", error)
      toast.error("Nao foi possivel executar a acao do COS.")
    } finally {
      setCosActionSubmitting(false)
    }
  }

  const sendCosMessage = async (rawMessage?: string) => {
    const message = (rawMessage ?? cosInput).trim()
    const filesToSend = cosAttachments
    if ((!message && filesToSend.length === 0) || cosLoading) return

    const userMessage: CosChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message || "Analisar arquivo",
      attachments: filesToSend.map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type || "arquivo",
      })),
    }

    setCosMessages((current) => [...current, userMessage])
    setCosInput("")
    setCosAttachments([])
    setCosLoading(true)

    try {
      const response =
        filesToSend.length > 0
          ? await fetch("/api/cos", {
              method: "POST",
              body: (() => {
                const formData = new FormData()
                formData.append("message", message || "Analisar arquivo")
                filesToSend.forEach((file) => formData.append("files", file))
                return formData
              })(),
            })
          : await fetch("/api/cos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message }),
            })
      const payload = (await response.json().catch(() => null)) as
        | { answer?: string; error?: string; preview?: CosAssistantPreview }
        | null

      const assistantMessage: CosChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          response.ok && payload?.answer
            ? payload.answer
            : payload?.error || "Não consegui acessar esses dados no momento.",
      }

      if (response.ok && payload?.preview) {
        assistantMessage.preview = payload.preview
        setCosUploadedFiles((current) => {
          const next = { ...current }
          filesToSend.forEach((file) => {
            next[file.name] = file
          })
          return next
        })
      }

      setCosMessages((current) => [...current, assistantMessage])
    } catch (error) {
      console.error("[cos] Falha na chamada do assistente", error)
      setCosMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "Não consegui acessar esses dados no momento.",
        },
      ])
    } finally {
      setCosLoading(false)
    }
  }

  const initials = profile.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    const { error } = supabase ? await supabase.auth.signOut() : { error: null }
    if (error) {
      toast.error(error.message || "Não foi possível encerrar a sessão.")
      return
    }

    toast.success("Sessão encerrada")
    router.replace("/login")
    router.refresh()
  }

  const cosActionNeedsDate =
    cosActionReview?.kind === "create_financial_entry" &&
    !String(cosActionPayload.competence_date ?? "").trim() &&
    !String(cosActionPayload.due_date ?? "").trim()
  const cosActionNeedsNoDocumentConfirmation =
    cosActionReview?.requiresNoDocumentConfirmation && !cosActionConfirmNoDocument
  const cosActionNeedsExtraConfirmation =
    Boolean(cosActionReview?.requiresExtraConfirmation) && !cosActionConfirmNoDocument
  const cosActionNeedsFile =
    cosActionReview?.kind === "attach_document" &&
    (!cosActionReview.fileName || !cosUploadedFiles[cosActionReview.fileName])
  const cosActionValidationError = (() => {
    if (!cosActionReview) return ""
    if (cosActionReview.kind === "create_client") {
      const name = cleanClientNameForReview(cosActionPayload.name ?? cosActionPayload.legal_name)
      const documentNumber = normalizeDocumentForReview(cosActionPayload.document_number)
      const confidence = Number(cosActionPayload.confidence)
      const nameReason = unsafeClientNameReason(name)
      if (nameReason) return nameReason
      if (!documentNumber && (!Number.isFinite(confidence) || confidence < 75)) {
        return "Dados do cliente ainda precisam de revisão manual."
      }
    }
    if (cosActionReview.kind === "create_financial_entry") {
      const value = parseReviewNumber(cosActionPayload.value)
      const sourceContractValue = parseReviewNumber(cosActionPayload.source_contract_value)
      const description = String(cosActionPayload.description ?? "")
      if (typeof value === "number" && typeof sourceContractValue === "number" && sourceContractValue >= 100 && value < 100) {
        return "Valor financeiro inconsistente com o contrato. Revise o valor mensal antes de gravar."
      }
      if (String(cosActionPayload.value_confidence ?? "") === "baixa" || String(cosActionPayload.value_confidence ?? "") === "ambiguous") {
        return "Valor financeiro com baixa confianca. Revise manualmente antes de gravar."
      }
      if (description.length > 180 || /\b(CL[ÁA]USULA|CLAUSULA|foro|obriga[cç][aã]o|rescis[aã]o)\b/i.test(description)) {
        return "Descricao financeira parece conter texto juridico. Revise manualmente antes de gravar."
      }
    }
    return ""
  })()
  const cosActionCanConfirm =
    Boolean(cosActionReview) &&
    !cosActionSubmitting &&
    !cosActionNeedsDate &&
    !cosActionNeedsNoDocumentConfirmation &&
    !cosActionNeedsExtraConfirmation &&
    !cosActionNeedsFile &&
    !cosActionValidationError
  const cosReviewFields = cosActionReview ? COS_REVIEW_FIELDS[cosActionReview.kind] : []

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="relative w-full max-w-[620px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, contratos, equipamentos..."
            className="h-12 rounded-2xl border-border/80 bg-card pl-11 pr-12 shadow-[0_10px_35px_rgba(15,23,42,0.05)]"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline-flex">
            ⌘K
          </span>
          {searchTerm && (
            <div className="absolute left-0 top-14 z-50 w-full rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              {searchResults.length > 0 ? (
                <div className="max-h-96 overflow-auto">
                  {searchResults.map((group) => (
                    <div key={group.group} className="py-1">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.group}</p>
                      {group.items.map((item) => (
                        <button
                          key={`${group.group}-${item.label}-${item.href}`}
                          type="button"
                          className="flex w-full flex-col rounded-xl px-3 py-2.5 text-left hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleNavigate(item.href)}
                        >
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          onClick={() => setCosOpen(true)}
          className="h-11 rounded-2xl bg-neutral-950 px-3 text-white shadow-[0_14px_38px_rgba(15,23,42,0.24)] hover:bg-neutral-800 sm:px-4"
        >
          <CosLogoMark className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Abrir no COS</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-2xl">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificacoes
              <Badge variant="secondary">{unreadCount} novas</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center gap-2">
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                    <span className="font-medium text-sm">{notification.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="p-3 text-sm text-muted-foreground">
                Nenhuma notificacao encontrada.
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary cursor-pointer" onClick={() => handleNavigate("/dashboard")}>
              Abrir Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-11 items-center gap-2 rounded-2xl px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">{profile.name}</span>
                <span className="text-xs text-muted-foreground">{profile.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={12} className="z-[80] w-72 rounded-2xl p-2 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{profile.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.email || "Usuário autenticado"}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.role || "Usuário autenticado"}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-xl text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {cosOpen &&
        typeof document !== "undefined" &&
        createPortal(
        <div className="fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Fechar COS"
            className="absolute inset-0 bg-neutral-950/35 backdrop-blur-md"
            onClick={() => setCosOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cos-assistant-title"
            className="fixed left-1/2 top-1/2 z-[1000] flex max-h-[calc(100vh-96px)] w-[min(calc(100vw-32px),520px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-border/80 bg-white shadow-[0_32px_120px_rgba(15,23,42,0.28)]"
            onDragOver={(event) => {
              event.preventDefault()
              setCosDragActive(true)
            }}
            onDragLeave={() => setCosDragActive(false)}
            onDrop={(event) => {
              event.preventDefault()
              setCosDragActive(false)
              appendCosFiles(event.dataTransfer.files)
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <CosLogoMark className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 id="cos-assistant-title" className="truncate text-base font-semibold text-foreground">
                    COS Assistant
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">Inteligência da GATE</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar COS"
                className="h-9 w-9 shrink-0 rounded-2xl"
                onClick={() => setCosOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {hasCosPreview(cosMessages) && (
              <div className="shrink-0 border-b border-border bg-muted/30 px-6 py-2 text-right">
                <Button type="button" variant="ghost" size="sm" className="rounded-2xl" onClick={clearCosAnalysis}>
                  Limpar analise
                </Button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                {cosDragActive && (
                  <div className="rounded-3xl border border-dashed border-neutral-300 bg-muted/60 px-5 py-4 text-center text-sm text-muted-foreground">
                    Solte os arquivos aqui para o COS analisar.
                  </div>
                )}
                {cosMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                        <CosLogoMark className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-3xl px-5 py-4 text-sm leading-6 ${
                        message.role === "user" ? "bg-neutral-950 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      {message.content}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                              <span className="shrink-0 opacity-80">{formatFileSize(attachment.size)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.preview && <CosPreviewPanel preview={message.preview} onAction={openCosActionReview} />}
                    </div>
                  </div>
                ))}
                {cosLoading && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                      <CosLogoMark className="h-5 w-5" />
                    </div>
                    <div className="rounded-3xl bg-muted px-5 py-4 text-sm leading-6 text-muted-foreground">
                      Consultando dados reais do GATE OS...
                    </div>
                  </div>
                )}
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Sugestões
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COS_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={cosLoading}
                        className="rounded-full bg-muted px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => sendCosMessage(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-white px-4 py-4">
              <input
                ref={cosFileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={(event) => {
                  if (event.target.files) appendCosFiles(event.target.files)
                  event.currentTarget.value = ""
                }}
              />
              {cosAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {cosAttachments.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex max-w-full items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="max-w-48 truncate">{file.name}</span>
                      <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
                      <button
                        type="button"
                        aria-label={`Remover ${file.name}`}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => removeCosAttachment(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendCosMessage()
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-2xl"
                  disabled={cosLoading}
                  aria-label="Anexar arquivo ao COS"
                  onClick={() => cosFileInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Input
                  aria-label="Mensagem para o COS"
                  placeholder="Pergunte ou anexe um arquivo..."
                  className="h-10 rounded-2xl"
                  value={cosInput}
                  onChange={(event) => setCosInput(event.target.value)}
                  disabled={cosLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 rounded-2xl"
                  disabled={cosLoading || (!cosInput.trim() && cosAttachments.length === 0)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </section>
        </div>,
        document.body
      )}

      {cosActionReview &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/45 p-3 backdrop-blur-sm sm:p-4">
            <button
              type="button"
              aria-label="Fechar revisao do COS"
              className="absolute inset-0 cursor-default"
              onClick={closeCosActionReview}
              disabled={cosActionSubmitting}
            />
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="cos-action-review-title"
              aria-describedby="cos-action-review-description"
              className="relative z-[10000] flex h-auto max-h-[min(90vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-white text-foreground shadow-[0_32px_120px_rgba(15,23,42,0.34)]"
            >
              <div className="shrink-0 border-b border-border bg-white px-5 py-4 pr-14 sm:px-7 sm:py-5">
                <h2 id="cos-action-review-title" className="text-lg font-semibold tracking-normal sm:text-xl">
                  {cosActionReview.title ?? "Revisar acao do COS"}
                </h2>
                <p id="cos-action-review-description" className="mt-1 text-sm text-muted-foreground">
                  {cosActionReview.description ?? "Revise os dados antes de gravar."} Nenhuma acao sera executada sem esta confirmacao.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fechar revisao"
                  className="absolute right-4 top-4 rounded-2xl"
                  onClick={closeCosActionReview}
                  disabled={cosActionSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
                <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm">
                  <p className="font-semibold">Origem</p>
                  <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2 [overflow-wrap:anywhere]">
                    <p>Arquivo: {cosActionReview.source.fileName || cosActionReview.fileName || "-"}</p>
                    <p>Tipo: {cosActionReview.source.detectedType || cosActionReview.source.type || "-"}</p>
                    <p>Confianca: {cosActionReview.source.confidence ?? "-"}%</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {cosReviewFields.map((field) => {
                    const value = cosActionPayload[field.key] ?? ""
                    const isLong = field.type === "textarea"
                    return (
                      <label key={field.key} className={isLong ? "sm:col-span-2" : ""}>
                        <span className="mb-1 block text-xs font-medium text-muted-foreground">
                          {field.label}
                          {field.required ? " *" : ""}
                        </span>
                        {isLong ? (
                          <textarea
                            className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm [overflow-wrap:anywhere]"
                            value={value}
                            onChange={(event) =>
                              setCosActionPayload((current) => ({ ...current, [field.key]: event.target.value }))
                            }
                          />
                        ) : (
                          <Input
                            type={field.type === "date" ? "date" : "text"}
                            value={value}
                            onChange={(event) =>
                              setCosActionPayload((current) => ({ ...current, [field.key]: event.target.value }))
                            }
                          />
                        )}
                      </label>
                    )
                  })}
                </div>

                {cosActionNeedsDate && (
                  <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                    Informe competencia ou data de vencimento antes de criar o lancamento financeiro.
                  </p>
                )}

                {cosActionValidationError && (
                  <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-900">
                    {cosActionValidationError}
                  </p>
                )}

                {cosActionReview.requiresNoDocumentConfirmation && (
                  <label className="flex items-start gap-3 rounded-2xl border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={cosActionConfirmNoDocument}
                      onChange={(event) => setCosActionConfirmNoDocument(event.target.checked)}
                    />
                    <span>
                      Confirmo que desejo cadastrar este cliente mesmo sem CNPJ/CPF identificado na extracao.
                    </span>
                  </label>
                )}

                {cosActionReview.requiresExtraConfirmation && !cosActionReview.requiresNoDocumentConfirmation && (
                  <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={cosActionConfirmNoDocument}
                      onChange={(event) => setCosActionConfirmNoDocument(event.target.checked)}
                    />
                    <span>{cosActionReview.requiresExtraConfirmation}</span>
                  </label>
                )}

                {cosActionNeedsFile && (
                  <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-900">
                    O arquivo original nao esta mais disponivel nesta sessao do COS. Envie o arquivo novamente para anexar.
                  </p>
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-white px-5 py-4 sm:flex sm:justify-end sm:gap-3 sm:px-7">
                <Button type="button" variant="outline" onClick={closeCosActionReview} disabled={cosActionSubmitting} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="button" onClick={executeCosAction} disabled={!cosActionCanConfirm} className="mt-2 w-full sm:mt-0 sm:w-auto">
                  {cosActionSubmitting ? "Gravando..." : "Confirmar e gravar"}
                </Button>
              </div>
            </section>
          </div>,
          document.body
        )}

    </header>
  )
}
