import { MONTH_NAMES, normalizeText } from "@/lib/cos/cos-context"

export type StructuredInputSection = "client" | "contract" | "financial" | "equipment" | "document" | "dre" | "unknown"

export type StructuredClientInput = {
  name?: string
  legal_name?: string
  fantasy_name?: string
  document_number?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  representative?: string
  phone?: string
  email?: string
  status?: string
}

export type StructuredContractInput = {
  client?: string
  type?: string
  status?: string
  start_date?: string
  end_date?: string
  term_months?: string
  due_day?: string
  monthly_value?: number
  deposit_value?: number
  adjustment?: string
  fine?: string
  interest?: string
  notes?: string
}

export type StructuredFinancialInput = {
  type?: string
  description?: string
  value?: number
  competence_date?: string
  due_date?: string
  installments?: string
  category?: string
  client?: string
  contract?: string
  status?: string
}

export type StructuredEquipmentInput = {
  quantity?: number
  description: string
  brand_model?: string
  notes?: string
}

export type StructuredDocumentInput = {
  type?: string
  name?: string
  notes?: string
}

export type StructuredDreInput = {
  category?: string
  competence?: string
  notes?: string
}

export type StructuredInputParseResult = {
  sections: StructuredInputSection[]
  client?: StructuredClientInput
  contract?: StructuredContractInput
  financial?: StructuredFinancialInput
  equipment: StructuredEquipmentInput[]
  document?: StructuredDocumentInput
  dre?: StructuredDreInput
  rawSections: Record<string, string[]>
}

const SECTION_ALIASES: Record<string, StructuredInputSection> = {
  cliente: "client",
  contrato: "contract",
  financeiro: "financial",
  equipamentos: "equipment",
  equipamento: "equipment",
  documento: "document",
  dre: "dre",
}

function sectionFromLine(line: string): StructuredInputSection | null {
  const key = normalizeText(line).replace(/[:\s]+$/g, "")
  return SECTION_ALIASES[key] ?? null
}

function parseMoney(value: string) {
  const normalized = value
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
  const number = Number(normalized.match(/\d+(?:\.\d+)?/)?.[0])
  return Number.isFinite(number) ? number : undefined
}

function parseDate(value: string) {
  const text = normalizeText(value)
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (numeric) {
    const day = Number(numeric[1])
    const month = Number(numeric[2])
    const year = Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3])
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const monthIndex = MONTH_NAMES.findIndex((name) => text.includes(name))
  const yearMatch = text.match(/\b(20\d{2})\b/)
  if (monthIndex >= 0 && yearMatch) {
    return `${yearMatch[1]}-${String(monthIndex + 1).padStart(2, "0")}-01`
  }

  const monthYear = text.match(/\b(\d{1,2})[/-](20\d{2})\b/)
  if (monthYear) return `${monthYear[2]}-${String(Number(monthYear[1])).padStart(2, "0")}-01`

  return ""
}

function splitField(line: string) {
  const match = line.match(/^([^:]{2,80}):\s*(.+)$/)
  if (!match) return null
  return {
    key: normalizeText(match[1]),
    value: match[2].trim(),
  }
}

function applyClientField(client: StructuredClientInput, key: string, value: string) {
  if (["razao social", "razão social", "nome", "cliente"].includes(key)) client.legal_name = value
  else if (["nome fantasia", "fantasia"].includes(key)) client.fantasy_name = value
  else if (["cnpj", "cpf", "cnpj/cpf", "documento"].includes(key)) client.document_number = value
  else if (["endereco", "endereço"].includes(key)) client.address = value
  else if (key === "cidade") client.city = value
  else if (["estado", "uf"].includes(key)) client.state = value
  else if (["cep", "codigo postal", "código postal"].includes(key)) client.zip_code = value
  else if (["representante", "representante legal"].includes(key)) client.representative = value
  else if (["telefone", "celular"].includes(key)) client.phone = value
  else if (["email", "e-mail"].includes(key)) client.email = value
  else if (key === "status") client.status = value
}

function applyContractField(contract: StructuredContractInput, key: string, value: string) {
  if (key === "cliente") contract.client = value
  else if (key === "tipo") contract.type = value
  else if (key === "status") contract.status = value
  else if (["data inicio", "data início", "inicio", "início"].includes(key)) contract.start_date = parseDate(value) || value
  else if (["data final", "fim", "final"].includes(key)) contract.end_date = parseDate(value) || value
  else if (["prazo", "prazo meses"].includes(key)) contract.term_months = value
  else if (["vencimento", "dia vencimento"].includes(key)) contract.due_day = value
  else if (["valor mensal", "mensalidade", "valor"].includes(key)) contract.monthly_value = parseMoney(value)
  else if (["caucao", "caução"].includes(key)) contract.deposit_value = parseMoney(value)
  else if (["reajuste", "indice reajuste", "índice reajuste"].includes(key)) contract.adjustment = value
  else if (["multa"].includes(key)) contract.fine = value
  else if (["juros"].includes(key)) contract.interest = value
  else if (["observacoes", "observações", "obs"].includes(key)) contract.notes = value
}

function applyFinancialField(financial: StructuredFinancialInput, key: string, value: string) {
  if (key === "tipo") financial.type = value
  else if (["descricao", "descrição"].includes(key)) financial.description = value
  else if (["valor", "valor mensal", "mensalidade"].includes(key)) financial.value = parseMoney(value)
  else if (["competencia", "competência"].includes(key)) financial.competence_date = parseDate(value) || value
  else if (["vencimento", "data vencimento"].includes(key)) financial.due_date = parseDate(value) || value
  else if (["quantidade parcelas", "parcelas"].includes(key)) financial.installments = value
  else if (["categoria", "categoria dre"].includes(key)) financial.category = value
  else if (key === "cliente") financial.client = value
  else if (key === "contrato") financial.contract = value
  else if (key === "status") financial.status = value
  else if (key === "receita recorrente" && normalizeText(value).startsWith("sim")) financial.type = financial.type || "receita"
}

function applyDocumentField(document: StructuredDocumentInput, key: string, value: string) {
  if (["tipo", "tipo documento"].includes(key)) document.type = value
  else if (["nome", "arquivo"].includes(key)) document.name = value
  else if (["observacoes", "observações", "notas"].includes(key)) document.notes = value
}

function applyDreField(dre: StructuredDreInput, key: string, value: string) {
  if (["categoria", "categoria dre"].includes(key)) dre.category = value
  else if (["competencia", "competência"].includes(key)) dre.competence = value
  else if (["observacoes", "observações", "notas"].includes(key)) dre.notes = value
}

function parseEquipmentLine(line: string): StructuredEquipmentInput | null {
  const field = splitField(line)
  if (field) {
    return {
      description: field.value,
      notes: field.key,
    }
  }

  const match = line.match(/^\s*(\d+)\s+(.*)$/)
  if (!match) return line.trim() ? { description: line.trim() } : null
  return {
    quantity: Number(match[1]),
    description: match[2].trim(),
  }
}

export function parseStructuredOperationalInput(message: string): StructuredInputParseResult {
  const rawSections: Record<string, string[]> = {}
  const client: StructuredClientInput = {}
  const contract: StructuredContractInput = {}
  const financial: StructuredFinancialInput = {}
  const equipment: StructuredEquipmentInput[] = []
  const document: StructuredDocumentInput = {}
  const dre: StructuredDreInput = {}
  let current: StructuredInputSection = "unknown"

  for (const rawLine of message.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const section = sectionFromLine(line)
    if (section) {
      current = section
      rawSections[current] = rawSections[current] ?? []
      continue
    }

    rawSections[current] = [...(rawSections[current] ?? []), line]
    const field = splitField(line)

    if (current === "equipment") {
      const item = parseEquipmentLine(line)
      if (item) equipment.push(item)
      continue
    }

    if (!field) continue
    if (current === "client") applyClientField(client, field.key, field.value)
    else if (current === "contract") applyContractField(contract, field.key, field.value)
    else if (current === "financial") applyFinancialField(financial, field.key, field.value)
    else if (current === "document") applyDocumentField(document, field.key, field.value)
    else if (current === "dre") applyDreField(dre, field.key, field.value)
  }

  if (!financial.value && contract.monthly_value) financial.value = contract.monthly_value
  if (!financial.type && financial.value) financial.type = "receita"
  if (!financial.description && (contract.client || client.legal_name)) {
    financial.description = `Receita contratual ${contract.client ?? client.legal_name}`
  }
  if (!financial.client && (contract.client || client.legal_name)) financial.client = contract.client ?? client.legal_name
  if (!client.name && client.legal_name) client.name = client.legal_name

  const sections = Object.keys(rawSections).filter((key) => key !== "unknown") as StructuredInputSection[]

  return {
    sections,
    client: Object.keys(client).length ? client : undefined,
    contract: Object.keys(contract).length ? contract : undefined,
    financial: Object.keys(financial).length ? financial : undefined,
    equipment,
    document: Object.keys(document).length ? document : undefined,
    dre: Object.keys(dre).length ? dre : undefined,
    rawSections,
  }
}
