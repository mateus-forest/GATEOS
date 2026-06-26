import {
  dateIsInMonth,
  formatCurrency,
  formatDate,
  getNumericValue,
  isActiveStatus,
  monthLabel,
  normalizeText,
  selectCosRows,
  type CosSupabaseClient,
} from "@/lib/cos/cos-context"
import type { ReadOnlyEntityRef, ReadOnlyOperationalContext } from "@/lib/cos/read-only-context"
import { resolveReadOnlyPeriod } from "@/lib/cos/read-only-period"
import type { SupabaseRow } from "@/lib/supabase/types"

export type DeepSearchEntityType = "client" | "contract" | "equipment" | "financial" | "document" | "legal" | "partner"

export type DeepSearchCandidate = {
  type: DeepSearchEntityType
  id: string
  name: string
  description: string
  score: number
  row: SupabaseRow
}

export type DeepSearchGroup = {
  type: DeepSearchEntityType
  label: string
  candidates: DeepSearchCandidate[]
}

export type DeepSearchResult = {
  title: string
  answer: string
  groups: DeepSearchGroup[]
  query: string
}

const SEARCH_CONFIG: Record<
  DeepSearchEntityType,
  {
    table: string
    label: string
    fields: string[]
  }
> = {
  client: {
    table: "clients",
    label: "Clientes",
    fields: ["name", "legal_name", "company_name", "fantasy_name", "document_number", "document", "cnpj", "cpf", "email", "phone", "city", "status"],
  },
  contract: {
    table: "contracts",
    label: "Contratos",
    fields: ["contract_number", "number", "numero", "client_name", "customer_name", "type", "contract_type", "status", "notes"],
  },
  equipment: {
    table: "equipment",
    label: "Equipamentos",
    fields: ["name", "category", "description", "brand", "model", "configuration", "serial", "serial_number", "status"],
  },
  financial: {
    table: "financial_entries",
    label: "Financeiro",
    fields: ["description", "type", "status", "client_name", "customer_name", "notes"],
  },
  document: {
    table: "documents",
    label: "Documentos",
    fields: ["name", "file_name", "type", "document_type", "notes", "client_name"],
  },
  legal: {
    table: "legal_cases",
    label: "Juridico",
    fields: ["title", "description", "case_number", "process_number", "status", "risk", "client_name"],
  },
  partner: {
    table: "partners",
    label: "Socios",
    fields: ["name", "legal_name", "status", "role"],
  },
}

function rowId(row: SupabaseRow) {
  return String(row.id ?? "")
}

function rowName(type: DeepSearchEntityType, row: SupabaseRow) {
  if (type === "contract") return String(row.contract_number ?? row.number ?? row.numero ?? row.id ?? "contrato sem numero")
  if (type === "equipment") return String(row.name ?? row.description ?? row.model ?? row.id ?? "equipamento sem nome")
  if (type === "financial") return String(row.description ?? row.name ?? row.id ?? "lancamento sem descricao")
  if (type === "document") return String(row.name ?? row.file_name ?? row.id ?? "documento sem nome")
  if (type === "legal") return String(row.title ?? row.case_number ?? row.process_number ?? row.id ?? "caso juridico sem titulo")
  return String(row.name ?? row.legal_name ?? row.company_name ?? row.fantasy_name ?? row.id ?? "registro sem nome")
}

function rowDocument(row: SupabaseRow) {
  return String(row.document_number ?? row.document ?? row.cnpj ?? row.cpf ?? "")
}

function rowDate(row: SupabaseRow) {
  return row.competence_date ?? row.payment_date ?? row.due_date ?? row.end_date ?? row.created_at
}

function rowValue(row: SupabaseRow) {
  return getNumericValue(row, ["value", "amount", "valor", "monthly_value", "total_value", "original_value", "updated_value"])
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function extractQuery(message: string) {
  const normalized = normalizeText(message)
  const cleaned = normalized
    .replace(/\b(procure|buscar|busque|mostre|mostrar|agora|contrato|contratos|cliente|clientes|equipamento|equipamentos|financeiro|documento|documentos|juridico|juridico|socios|socio|pagamento|receita|receitas|despesa|despesas|de|da|do|dos|das|o|a|os|as|um|uma|pelo|pela|com|sobre|apenas|so|somente)\b/g, " ")
    .replace(/\br\$?\s*\d+(?:[.,]\d{1,2})?\b/g, " ")
  return compact(cleaned)
}

function extractAmount(message: string) {
  const text = normalizeText(message)
  const match = text.match(/\b(?:r\$?\s*)?(\d{1,9}(?:[.,]\d{1,2})?)\s*(?:reais|real)?\b/)
  if (!match) return null
  const amount = Number(match[1].replace(",", "."))
  return Number.isFinite(amount) ? amount : null
}

function scoreText(row: SupabaseRow, query: string, fields: string[]) {
  if (!query) return 0
  const haystack = normalizeText(fields.map((field) => row[field]).join(" "))
  const document = normalizeText(rowDocument(row))
  const normalizedQuery = normalizeText(query)
  if (!haystack && !document) return 0
  if (document && document.replace(/\D/g, "") === normalizedQuery.replace(/\D/g, "")) return 120
  if (haystack === normalizedQuery) return 100
  if (haystack.includes(normalizedQuery)) return 70
  const tokens = normalizedQuery.split(" ").filter(Boolean)
  return tokens.reduce((score, token) => score + (haystack.includes(token) || document.includes(token) ? 12 : 0), 0)
}

function contextBoost(row: SupabaseRow, context?: ReadOnlyOperationalContext) {
  let score = 0
  if (context?.activeClient?.id && String(row.client_id ?? row.customer_id ?? "") === context.activeClient.id) score += 35
  if (context?.activeContract?.id && String(row.contract_id ?? "") === context.activeContract.id) score += 25
  if (context?.activeEquipment?.id && String(row.equipment_id ?? "") === context.activeEquipment.id) score += 20
  if (context?.activePeriod && dateIsInMonth(rowDate(row), context.activePeriod.year, context.activePeriod.month)) score += 20
  return score
}

function statusBoost(row: SupabaseRow) {
  return isActiveStatus(row.status) ? 8 : 0
}

function amountBoost(row: SupabaseRow, amount: number | null) {
  if (amount === null) return 0
  return Math.abs(rowValue(row) - amount) < 0.01 ? 50 : 0
}

function periodBoost(row: SupabaseRow, message: string, context?: ReadOnlyOperationalContext) {
  const period = resolveReadOnlyPeriod(message, context)
  if (period.kind !== "resolved") return 0
  return dateIsInMonth(rowDate(row), period.period.year, period.period.month) ? 20 : -5
}

function describeCandidate(type: DeepSearchEntityType, row: SupabaseRow) {
  if (type === "client") {
    return [rowDocument(row), String(row.status ?? ""), String(row.city ?? row.state ?? "")].filter(Boolean).join(" | ")
  }

  if (type === "contract") {
    return [
      String(row.status ?? "sem status"),
      rowValue(row) ? formatCurrency(rowValue(row)) : null,
      rowDate(row) ? `data ${formatDate(rowDate(row))}` : null,
    ].filter(Boolean).join(" | ")
  }

  if (type === "equipment") {
    return [String(row.category ?? "sem categoria"), String(row.status ?? "sem status"), String(row.model ?? row.serial ?? row.serial_number ?? "")].filter(Boolean).join(" | ")
  }

  if (type === "financial") {
    return [String(row.type ?? "sem tipo"), rowValue(row) ? formatCurrency(rowValue(row)) : null, String(row.status ?? "sem status"), formatDate(rowDate(row))].filter(Boolean).join(" | ")
  }

  if (type === "document") {
    return [String(row.type ?? row.document_type ?? "sem tipo"), formatDate(row.created_at ?? rowDate(row))].filter(Boolean).join(" | ")
  }

  if (type === "legal") {
    return [String(row.status ?? "sem status"), String(row.risk ?? "sem risco"), row.next_deadline ? `prazo ${formatDate(row.next_deadline)}` : null].filter(Boolean).join(" | ")
  }

  return [String(row.status ?? ""), String(row.role ?? "")].filter(Boolean).join(" | ")
}

async function safeSelectRows(supabase: CosSupabaseClient, table: string) {
  try {
    return await selectCosRows(supabase, table)
  } catch {
    return []
  }
}

export function candidateToRef(candidate: DeepSearchCandidate): ReadOnlyEntityRef {
  return {
    type: candidate.type,
    id: candidate.id,
    name: candidate.name,
    description: candidate.description,
  }
}

export function periodLabelFromContext(context?: ReadOnlyOperationalContext) {
  return context?.activePeriod ? `${monthLabel(context.activePeriod.month)}/${context.activePeriod.year}` : null
}

export async function resolveEntityCandidatesReadOnly(
  supabase: CosSupabaseClient,
  type: DeepSearchEntityType,
  message: string,
  context?: ReadOnlyOperationalContext,
  limit = 5
) {
  const config = SEARCH_CONFIG[type]
  const rows = await safeSelectRows(supabase, config.table)
  const query = extractQuery(message)
  const amount = extractAmount(message)
  const normalized = normalizeText(message)

  return rows
    .map((row) => {
      let score = scoreText(row, query, config.fields) + contextBoost(row, context) + statusBoost(row) + amountBoost(row, amount) + periodBoost(row, message, context)
      if (normalized.includes("ativo") && isActiveStatus(row.status)) score += 20
      if (normalized.includes("vencido") && normalizeText(row.status).includes("venc")) score += 20
      if (normalized.includes("em aberto") && !["pago", "recebido", "realizado"].includes(normalizeText(row.status))) score += 15
      return {
        type,
        id: rowId(row),
        name: rowName(type, row),
        description: describeCandidate(type, row),
        score,
        row,
      }
    })
    .filter((candidate) => candidate.id && candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function deepSearchReadOnly(
  supabase: CosSupabaseClient,
  message: string,
  context?: ReadOnlyOperationalContext
): Promise<DeepSearchResult> {
  const query = extractQuery(message)
  const types: DeepSearchEntityType[] = ["client", "contract", "financial", "document", "equipment", "legal", "partner"]
  const groups = (
    await Promise.all(
      types.map(async (type) => {
        const candidates = await resolveEntityCandidatesReadOnly(supabase, type, message, context, 4)
        return {
          type,
          label: SEARCH_CONFIG[type].label,
          candidates,
        }
      })
    )
  ).filter((group) => group.candidates.length)

  if (!groups.length) {
    return {
      title: "Busca profunda",
      query,
      groups,
      answer: [
        `Nao encontrei registros com o termo "${query || message}".`,
        "",
        "Busquei em:",
        "- clientes;",
        "- contratos;",
        "- financeiro;",
        "- documentos;",
        "- equipamentos;",
        "- juridico;",
        "- socios.",
        "",
        "Voce pode tentar informar CNPJ, numero do contrato, valor, status ou periodo.",
      ].join("\n"),
    }
  }

  const lines = [`Encontrei resultados para "${query || message}".`, "", "Agrupei por modulo:"]
  for (const group of groups) {
    lines.push("", `${group.label}:`)
    lines.push(...group.candidates.map((candidate, index) => `${index + 1}. ${candidate.name}${candidate.description ? ` - ${candidate.description}` : ""}`))
  }
  lines.push("", "Se quiser, posso analisar um deles ou filtrar por status/periodo.")

  return {
    title: "Busca profunda",
    query,
    groups,
    answer: lines.join("\n"),
  }
}
