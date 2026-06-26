import { normalizeText } from "@/lib/cos/cos-context"

const SECTION_TITLES = ["cliente", "contrato", "financeiro", "equipamentos", "equipamento", "documento", "dre"]
const STRUCTURED_TERMS = [
  "razao social",
  "razão social",
  "cnpj",
  "cpf",
  "data inicio",
  "data início",
  "data final",
  "valor mensal",
  "quantidade parcelas",
  "receita recorrente",
  "competencia",
  "competência",
  "vencimento",
  "parcelas",
]

function isSectionTitle(line: string) {
  const text = normalizeText(line).replace(/[:\s]+$/g, "")
  return SECTION_TITLES.includes(text)
}

export function isStructuredOperationalInput(message: string) {
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return false

  const sectionCount = lines.filter(isSectionTitle).length
  const fieldCount = lines.filter((line) => /^[^:]{2,60}:\s*.+/.test(line)).length
  const equipmentListCount = lines.filter((line) => /^\d+\s+[\p{L}\p{N}]/u.test(line)).length
  const text = normalizeText(message)
  const termCount = STRUCTURED_TERMS.filter((term) => text.includes(normalizeText(term))).length

  if (sectionCount >= 2) return true
  if (sectionCount >= 1 && fieldCount >= 1) return true
  if (fieldCount >= 3 && termCount >= 2) return true
  if (sectionCount >= 1 && equipmentListCount >= 1 && termCount >= 1) return true

  return false
}
