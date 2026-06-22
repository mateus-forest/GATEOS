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
  preview?: CosFileAnalysisPreview
}
type CosAttachment = {
  id: string
  name: string
  size: number
  type: string
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

function EntityActionButton({ children }: { children: string }) {
  return (
    <Button type="button" disabled variant="outline" className="mt-3 w-full rounded-2xl">
      {children} (proxima etapa)
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
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={index} className="border-t border-border/80">
                {columns.map((column) => (
                  <td key={column} className="max-w-44 truncate px-3 py-2 text-foreground">
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

function ContractExtractionCards({ preview }: { preview: CosFileAnalysisPreview["contractExtractions"][number] }) {
  const client = preview.extractedClient
  const contract = preview.extractedContract

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-white p-4">
      <div>
        <p className="font-semibold">Contrato analisado: {preview.sourceFile}</p>
        <p className="mt-1 text-muted-foreground">
          Confianca estimada: {preview.confidence}%. Nenhum dado foi gravado. Revise as informacoes antes de cadastrar.
        </p>
      </div>

      {client && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Cliente / Locataria</p>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>{client.legalName || "Razao social nao identificada"}</p>
            <p>CNPJ/Documento: {client.documentNumber || "-"}</p>
            <p>
              Local: {[client.city, client.state].filter(Boolean).join(" - ") || "-"}
              {client.postalCode ? `, CEP ${client.postalCode}` : ""}
            </p>
            {client.address && <p>Endereco: {client.address}</p>}
            {client.representative && <p>Representante: {client.representative}</p>}
            {client.guarantor && <p>Fiador: {client.guarantor}</p>}
          </div>
          <EntityActionButton>Cadastrar cliente</EntityActionButton>
        </div>
      )}

      {contract && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Contrato</p>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>Tipo: {contract.contractType || "-"}</p>
            <p>Locadora: {contract.lessor || "-"}</p>
            <p>Locataria: {contract.lessee || "-"}</p>
            <p>Valor mensal: {formatMoney(contract.monthlyValue)}</p>
            <p>Prazo: {contract.termMonths ? `${contract.termMonths} meses` : "-"}</p>
            <p>Inicio provavel: {contract.probableStartDate || "-"}</p>
            <p>Final previsto: {contract.calculatedEndDate || "-"}</p>
            <p>Vencimento: {contract.monthlyDueDay ? `dia ${contract.monthlyDueDay}` : "-"}</p>
            <p>Caucao: {formatMoney(contract.depositValue)}</p>
            <p>Indice de reajuste: {contract.adjustmentIndex || "-"}</p>
            <p>Multa/rescisao: {contract.terminationFine || "-"}</p>
            <p>Foro: {contract.venue || "-"}</p>
          </div>
          <EntityActionButton>Cadastrar contrato</EntityActionButton>
        </div>
      )}

      {preview.extractedEquipment.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Equipamentos</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            {preview.extractedEquipment.slice(0, 8).map((item, index) => (
              <p key={`${item.description}-${index}`}>
                {item.quantity ? `${item.quantity}x ` : ""}
                {item.description}
                {item.unitValue ? ` - unitario ${formatMoney(item.unitValue)}` : ""}
                {item.totalValue ? ` - total ${formatMoney(item.totalValue)}` : ""}
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
          <div className="mt-2 space-y-2 text-muted-foreground">
            {preview.extractedFinancialEntries.map((entry, index) => (
              <p key={`${entry.description}-${index}`}>
                {entry.description}: {formatMoney(entry.value)}
                {entry.dueDay ? `, vencimento dia ${entry.dueDay}` : ""}
                {entry.installments ? `, ${entry.installments} parcela(s)` : ""}
              </p>
            ))}
          </div>
          <EntityActionButton>Criar financeiro</EntityActionButton>
        </div>
      )}

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="font-semibold">Documento</p>
        <p className="mt-2 text-muted-foreground">{preview.extractedDocument.suggestedNotes}</p>
        <EntityActionButton>Anexar documento</EntityActionButton>
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

function FinancialOcrCards({ preview }: { preview: CosFileAnalysisPreview["financialOcrAnalyses"][number] }) {
  const revenueTotal = formatMoney(preview.summary.revenueTotal)
  const expenseTotal = formatMoney(preview.summary.expenseTotal)
  const resultTotal = formatMoney(preview.summary.operationalResult)

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-white p-4">
      <div>
        <p className="font-semibold">OCR financeiro: {preview.sourceFile}</p>
        <p className="mt-1 text-muted-foreground">
          Tipo detectado: {preview.detectedType}. Confianca estimada: {preview.confidence}%.
        </p>
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

      <div className="rounded-2xl bg-muted/60 p-3">
        <p className="font-semibold">Clientes encontrados</p>
        {preview.extractedClients.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {preview.extractedClients.map((client) => (
              <Badge key={client} variant="secondary" className="rounded-full">
                {client}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">Nenhum cliente identificado com confianca.</p>
        )}
        <EntityActionButton>Cadastrar clientes</EntityActionButton>
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
              <p key={`${item.description}-${index}`} className="truncate">
                {item.description}: {item.values.map((value) => formatMoney(value)).join(" | ")}
              </p>
            ))}
          </div>
          <EntityActionButton>Criar receitas</EntityActionButton>
        </div>
      )}

      {preview.extractedExpenses.length > 0 && (
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="font-semibold">Despesas encontradas</p>
          <div className="mt-2 space-y-2 text-muted-foreground">
            {preview.extractedExpenses.slice(0, 8).map((item, index) => (
              <p key={`${item.description}-${index}`} className="truncate">
                {item.description}: {item.values.map((value) => formatMoney(value)).join(" | ")}
              </p>
            ))}
          </div>
          <EntityActionButton>Criar despesas</EntityActionButton>
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
        <EntityActionButton>Anexar documento</EntityActionButton>
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

function CosPreviewPanel({ preview }: { preview: CosFileAnalysisPreview }) {
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
            <ContractExtractionCards key={contractPreview.sourceFile} preview={contractPreview} />
          ))}
        </div>
      )}

      {preview.financialOcrAnalyses.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Analise financeira por OCR</p>
          {preview.financialOcrAnalyses.map((ocrPreview) => (
            <FinancialOcrCards key={ocrPreview.sourceFile} preview={ocrPreview} />
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
  const [cosMessages, setCosMessages] = useState<CosChatMessage[]>([
    { id: "cos-initial", role: "assistant", content: COS_INITIAL_MESSAGE },
  ])
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
        | { answer?: string; error?: string; preview?: CosFileAnalysisPreview }
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
                      {message.preview && <CosPreviewPanel preview={message.preview} />}
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

    </header>
  )
}
