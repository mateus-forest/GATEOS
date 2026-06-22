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

export function numberField(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  const normalized = String(value ?? "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
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
