import type { SupabaseClient } from "@supabase/supabase-js"

type CosActionLogPayload = {
  userId: string
  actionType: string
  sourceFileName?: string
  sourceFileType?: string
  sourceConfidence?: number
  payload: Record<string, unknown>
  result?: Record<string, unknown>
  status: "success" | "error"
  errorMessage?: string
}

export function normalizeDocumentNumber(value: unknown) {
  return String(value ?? "").replace(/\D/g, "")
}

export function textField(value: unknown) {
  return String(value ?? "").trim()
}

export function normalizeCosClientName(value: unknown) {
  return textField(value)
    .replace(/\s+/g, " ")
    .replace(/\s*[,;]?\s*\b(CNPJ|CPF)\b\s*[:\-]?\s*[\d./-]+.*$/i, "")
    .replace(/\s*[,;]?\s*\bpessoa\s+jur[ií]dica\s+de\s+direito\s+privado\b.*$/i, "")
    .replace(/\s*[,;]?\s*\bdenominad[ao]\s+LOCAT[ÁA]RIA\b.*$/i, "")
    .replace(/\s*[,;]?\s*\bendere[cç]o\b\s*[:\-]?.*$/i, "")
    .replace(/\s*[,;]?\s*\b(Rua|Avenida|Av\.|Travessa|Rodovia)\b.*$/i, "")
    .replace(/[;,]+$/, "")
    .trim()
}

export function hasUnsafeCosClientName(value: unknown) {
  const text = textField(value)
  if (!text) return false
  return (
    /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/.test(text) ||
    /\bpessoa\s+jur[ií]dica\b/i.test(text) ||
    /\bdenominad[ao]\b/i.test(text) ||
    /\bendere[cç]o\b/i.test(text) ||
    /\b(Rua|Avenida|Av\.|Travessa|Rodovia)\b/i.test(text) ||
    /\b(CL[ÁA]USULA|CLAUSULA|foro|obriga[cç][aã]o|rescis[aã]o)\b/i.test(text) ||
    text.length > 160
  )
}

export function numberField(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  const text = String(value ?? "").trim()
  if (!text) return undefined
  const normalized = text.includes(",")
    ? text.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".")
    : text.replace(/[R$\s]/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function dateField(value: unknown) {
  const text = textField(value)
  if (!text) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text

  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/)
  if (!match) return undefined

  const day = match[1].padStart(2, "0")
  const month = match[2].padStart(2, "0")
  const year = match[3].length === 2 ? `20${match[3]}` : match[3]
  return `${year}-${month}-${day}`
}

export async function writeCosActionLog(
  supabase: SupabaseClient,
  {
    userId,
    actionType,
    sourceFileName,
    sourceFileType,
    sourceConfidence,
    payload,
    result,
    status,
    errorMessage,
  }: CosActionLogPayload
) {
  const { error } = await supabase.from("cos_action_logs").insert({
    user_id: userId,
    action_type: actionType,
    source_file_name: sourceFileName ?? null,
    source_file_type: sourceFileType ?? null,
    source_confidence: typeof sourceConfidence === "number" && Number.isFinite(sourceConfidence) ? sourceConfidence : null,
    payload,
    result: result ?? null,
    status,
    error_message: errorMessage ?? null,
  })

  if (error) {
    console.warn("[cos-actions] Nao foi possivel registrar log da acao", error)
    return { logged: false, error: error.message }
  }

  return { logged: true, error: null }
}
