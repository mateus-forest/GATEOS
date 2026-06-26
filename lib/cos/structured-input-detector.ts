import { normalizeText } from "@/lib/cos/cos-context"

const SECTION_TITLES = ["cliente", "contrato", "financeiro", "equipamentos", "equipamento", "documento", "dre"]

const STRUCTURED_TERMS = [
  "razao social",
  "cnpj",
  "cpf",
  "data inicio",
  "data final",
  "valor mensal",
  "quantidade parcelas",
  "receita recorrente",
  "competencia",
  "vencimento",
  "parcelas",
]

const FIELD_LABELS = [
  "razao social",
  "nome fantasia",
  "cnpj",
  "cpf",
  "cliente",
  "tipo",
  "status",
  "data inicio",
  "data final",
  "prazo",
  "valor mensal",
  "descricao",
  "valor",
  "competencia",
  "vencimento",
  "categoria",
  "contrato",
]

function isSectionTitle(line: string) {
  const text = normalizeText(line).replace(/[:\s]+$/g, "")
  return SECTION_TITLES.includes(text)
}

function hasSectionWord(text: string) {
  return SECTION_TITLES.some((section) => new RegExp(`\\b${section}\\b`).test(text))
}

function isStructuredField(line: string) {
  const match = line.match(/^([^:]{2,80}):\s*(.*)$/)
  if (!match) return false

  const key = normalizeText(match[1])
  return FIELD_LABELS.includes(key) || FIELD_LABELS.some((label) => key.includes(label))
}

export function isStructuredOperationalInput(message: string) {
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return false

  const text = normalizeText(message)
  const sectionCount = lines.filter(isSectionTitle).length
  const fieldCount = lines.filter(isStructuredField).length
  const equipmentListCount = lines.filter((line) => /^\d+\s+[\p{L}\p{N}]/u.test(line)).length
  const termCount = STRUCTURED_TERMS.filter((term) => text.includes(term)).length

  if (sectionCount >= 2) return true
  if (sectionCount >= 1 && fieldCount >= 1) return true
  if (hasSectionWord(text) && fieldCount >= 2) return true
  if (fieldCount >= 3 && termCount >= 2) return true
  if (sectionCount >= 1 && equipmentListCount >= 1 && termCount >= 1) return true

  return false
}
