import * as XLSX from "xlsx"
import { inflateRawSync } from "node:zlib"

type TabularRow = Record<string, unknown>

export type CosExtractedClient = {
  legalName?: string
  documentNumber?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  representative?: string
  guarantor?: string
}

export type CosExtractedContract = {
  contractType?: string
  lessor?: string
  lessee?: string
  signatureDate?: string
  probableStartDate?: string
  termMonths?: number
  calculatedEndDate?: string
  monthlyDueDay?: number
  monthlyValue?: number
  depositValue?: number
  adjustmentIndex?: string
  terminationFine?: string
  venue?: string
  suggestedStatus?: string
}

export type CosExtractedEquipment = {
  quantity?: number
  description: string
  unitValue?: number
  totalValue?: number
  suggestedCategory?: string
  suggestedStatus?: string
  contractLink?: string
}

export type CosExtractedFinancialEntry = {
  type: string
  description: string
  value?: number
  dueDay?: number
  installments?: number
  firstCompetence?: string
  lastCompetence?: string
  source: string
}

export type CosContractExtractionPreview = {
  sourceFile: string
  extractedClient?: CosExtractedClient
  extractedContract?: CosExtractedContract
  extractedEquipment: CosExtractedEquipment[]
  extractedFinancialEntries: CosExtractedFinancialEntry[]
  extractedDocument: {
    fileName: string
    type: string
    suggestedNotes: string
  }
  confidence: number
  warnings: string[]
  textSample: string
}

export type CosFinancialOcrLine = {
  description: string
  sourceLine: string
  values: number[]
  category?: string
  columns?: string[]
}

export type CosFinancialOcrPreview = {
  sourceType: "financial_image"
  sourceFile: string
  detectedType: string
  confidence: number
  extractedColumns: string[]
  extractedClients: string[]
  extractedRevenue: CosFinancialOcrLine[]
  extractedExpenses: CosFinancialOcrLine[]
  extractedCategories: string[]
  extractedFinancialEntries: TabularRow[]
  extractedWarnings: string[]
  suggestedActions: string[]
  summary: {
    valuesDetected: number
    percentagesDetected: number
    revenueTotal?: number
    expenseTotal?: number
    operationalResult?: number
  }
  textSample: string
}

export type CosFileSheetPreview = {
  name: string
  rowCount: number
  columns: string[]
  usefulColumns: number
  headerRow: number | null
  ignoredEmptyRows: number
  probableType?: string
  detectedSections: string[]
  sampleRows: TabularRow[]
}

export type CosFilePreview = {
  name: string
  type: string
  size: number
  sheets: CosFileSheetPreview[]
  notes: string[]
  contractExtraction?: CosContractExtractionPreview
  financialOcr?: CosFinancialOcrPreview
}

export type CosFileAnalysisPreview = {
  kind: "file_analysis"
  files: CosFilePreview[]
  financialEntries: TabularRow[]
  clients: TabularRow[]
  equipment: TabularRow[]
  contractExtractions: CosContractExtractionPreview[]
  financialOcrAnalyses: CosFinancialOcrPreview[]
  warnings: string[]
}

type WorkbookRows = {
  fileName: string
  sheetName: string
  rows: TabularRow[]
  columns: string[]
  headerRow: number | null
  sourceType?: string
}

const MAX_PREVIEW_ROWS = 50
const MAX_STRUCTURED_SAMPLE_ROWS = 20

const MONTH_TERMS = [
  "jan",
  "janeiro",
  "fev",
  "fevereiro",
  "mar",
  "marco",
  "abr",
  "abril",
  "mai",
  "maio",
  "jun",
  "junho",
  "jul",
  "julho",
  "ago",
  "agosto",
  "set",
  "setembro",
  "out",
  "outubro",
  "nov",
  "novembro",
  "dez",
  "dezembro",
]

const DRE_TERMS = [
  "dre",
  "demonstrativo",
  "receita",
  "receita_bruta",
  "receita_total",
  "despesa",
  "despesas",
  "custo",
  "custos",
  "resultado",
  "lucro",
  "cpv",
]

const CONTRACT_TERMS = [
  "contrato",
  "locacao",
  "locadora",
  "locataria",
  "clausula",
  "objeto",
  "prazo",
  "preco",
  "caucao",
  "foro",
]

const FINANCIAL_OCR_ACTIONS = [
  "Cadastrar clientes",
  "Criar receitas",
  "Criar despesas",
  "Criar categorias DRE",
  "Vincular categorias",
  "Criar lancamentos financeiros",
  "Salvar analise",
  "Anexar documento",
]

const FINANCIAL_CATEGORY_TERMS = [
  { label: "Receitas", terms: ["receita", "receitas", "faturamento", "entrada"] },
  { label: "Despesas com pessoal", terms: ["pessoal", "salario", "salarios", "ferias", "fgts", "inss", "freelancer"] },
  { label: "Despesas operacionais", terms: ["despesas operacionais", "aluguel", "condominio", "sistema", "internet", "prestacao"] },
  { label: "Despesas financeiras", terms: ["despesas financeiras", "tarifa", "juros", "emprestimo", "bancaria"] },
  { label: "Despesas nao operacionais", terms: ["nao operacionais", "investimento", "distribuicao", "devolucao"] },
  { label: "Impostos", terms: ["imposto", "simples nacional", "tributo"] },
  { label: "Investimentos", terms: ["investimento", "imobilizado"] },
  { label: "Distribuicao de lucros", terms: ["distribuicao", "lucros", "socios"] },
  { label: "Aportes", terms: ["aporte", "aportes"] },
  { label: "Saldo banco", terms: ["saldo banco"] },
  { label: "Saldo anterior", terms: ["saldo anterior"] },
  { label: "Resultado operacional", terms: ["resultado operacional"] },
  { label: "Lucro operacional", terms: ["lucro operacional"] },
]

const FINANCIAL_CLIENT_TERMS = [
  "Fribal",
  "Estacio Itapipoca",
  "Estacio",
  "Fortaleza Iguatemi",
  "Rio de Janeiro",
  "Intech",
  "Paulinia nova",
  "Curitiba",
  "SG Itapipoca",
  "SG Atibaia",
  "Venda de produto",
]

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function normalizeLoose(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function normalizeDocumentText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function stripXmlToText(xml: string) {
  return normalizeDocumentText(
    decodeXmlEntities(
      xml
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<\/w:tr>/g, "\n")
        .replace(/<\/w:tc>/g, " | ")
        .replace(/<[^>]+>/g, " ")
    )
  )
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset
  }
  return -1
}

function readZipEntries(buffer: Buffer) {
  const entries = new Map<string, Buffer>()
  const eocdOffset = findEndOfCentralDirectory(buffer)
  if (eocdOffset < 0) return entries

  const centralDirectoryEntries = buffer.readUInt16LE(eocdOffset + 10)
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16)
  let offset = centralDirectoryOffset

  for (let index = 0; index < centralDirectoryEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break

    const compressionMethod = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const fileNameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8")

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize)

    if (compressionMethod === 0) {
      entries.set(fileName, compressed)
    } else if (compressionMethod === 8) {
      entries.set(fileName, inflateRawSync(compressed))
    }

    offset += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

async function extractDocxText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const entries = readZipEntries(buffer)
  const xmlParts = [
    entries.get("word/document.xml"),
    ...Array.from(entries.entries())
      .filter(([name]) => /^word\/(header|footer)\d+\.xml$/.test(name))
      .map(([, content]) => content),
  ].filter((entry): entry is Buffer => Boolean(entry))

  if (xmlParts.length === 0) {
    throw new Error("Nao encontrei o conteudo principal do DOCX.")
  }

  return normalizeDocumentText(xmlParts.map((part) => stripXmlToText(part.toString("utf8"))).join("\n"))
}

function decodePdfLiteralString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
}

async function extractPdfText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const raw = buffer.toString("latin1")
  const matches = Array.from(raw.matchAll(/\((?:\\.|[^\\)]){2,}\)\s*Tj|\((?:\\.|[^\\)]){2,}\)/g))
  const text = matches
    .map((match) => match[0].replace(/\)\s*Tj$/, "").replace(/^\(|\)$/g, ""))
    .map(decodePdfLiteralString)
    .join(" ")

  const normalized = normalizeDocumentText(text)
  if (normalized.length < 40) {
    throw new Error("Nao consegui extrair texto suficiente do PDF. O arquivo pode estar escaneado ou protegido.")
  }

  return normalized
}

function supportedContractDocument(file: File) {
  const name = file.name.toLowerCase()
  return name.endsWith(".docx") || name.endsWith(".pdf")
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

function rowValues(row: unknown[]) {
  return row.map(cellText)
}

function rowNonEmptyCount(row: unknown[]) {
  return rowValues(row).filter(Boolean).length
}

function isMonthLike(value: unknown) {
  const normalized = normalizeHeader(value)
  return MONTH_TERMS.some((month) => normalized === month || normalized.startsWith(`${month}_`) || normalized.includes(`_${month}_`))
}

function isTotalLike(value: unknown) {
  const normalized = normalizeHeader(value)
  return normalized === "total" || normalized.includes("total")
}

function isValueLike(value: unknown) {
  const normalized = normalizeHeader(value)
  return ["valor", "value", "amount", "total", "saldo"].some((term) => normalized.includes(term))
}

function columnNameFromValue(value: unknown, index: number) {
  const text = cellText(value)
  const normalized = normalizeHeader(text)
  if (normalized) return text
  return `Coluna ${index + 1}`
}

function uniqueColumns(columns: string[]) {
  const used = new Map<string, number>()
  return columns.map((column, index) => {
    const clean = columnNameFromValue(column, index)
    const count = used.get(clean) ?? 0
    used.set(clean, count + 1)
    return count === 0 ? clean : `${clean} ${count + 1}`
  })
}

function usefulColumnIndexes(rows: unknown[][]) {
  const maxColumns = Math.max(0, ...rows.map((row) => row.length))
  const indexes: number[] = []

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    const hasValue = rows.some((row) => cellText(row[columnIndex]))
    if (hasValue) indexes.push(columnIndex)
  }

  return indexes
}

function detectHeaderRow(rows: unknown[][]) {
  let bestIndex: number | null = null
  let bestScore = 0

  rows.slice(0, 30).forEach((row, index) => {
    const values = rowValues(row)
    const nonEmpty = values.filter(Boolean)
    if (nonEmpty.length < 2) return

    const monthCount = nonEmpty.filter(isMonthLike).length
    const totalCount = nonEmpty.filter(isTotalLike).length
    const valueCount = nonEmpty.filter(isValueLike).length
    const textCount = nonEmpty.filter((value) => Number.isNaN(Number(String(value).replace(",", ".")))).length
    const score = nonEmpty.length + monthCount * 4 + totalCount * 3 + valueCount * 2 + textCount

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestIndex
}

function detectProbableType(rows: TabularRow[], columns: string[]) {
  const joined = [columns.join(" "), ...rows.slice(0, 80).map((row) => Object.values(row).join(" "))].join(" ")
  const normalized = normalizeHeader(joined)
  const matches = DRE_TERMS.filter((term) => normalized.includes(term)).length
  const monthColumns = columns.filter(isMonthLike).length

  if (matches >= 4 || (matches >= 2 && monthColumns >= 3)) {
    return "DRE / Demonstrativo financeiro"
  }

  if (monthColumns >= 3 && normalized.includes("receita")) {
    return "Planilha financeira mensal"
  }

  return undefined
}

function classifyStructuredRow(row: TabularRow, columns: string[]) {
  const values = Object.values(row).map(cellText).filter(Boolean)
  const firstValue = cellText(row[columns[0]])
  const numericValues = values.filter((value) => Number.isFinite(Number(value.replace(/\./g, "").replace(",", "."))))
  const hasMonthValue = columns.some((column) => isMonthLike(column) && cellText(row[column]))

  if (values.length === 1 && firstValue) return "section"
  if (firstValue && values.length <= 2 && !hasMonthValue) return "title"
  if (firstValue && numericValues.length >= 1) return "detail"
  return "row"
}

function detectSections(rows: TabularRow[], columns: string[]) {
  const sections = new Set<string>()

  for (const row of rows) {
    const rowType = classifyStructuredRow(row, columns)
    const firstValue = cellText(row[columns[0]])
    if (!firstValue) continue

    const normalized = normalizeHeader(firstValue)
    const looksLikeSection =
      rowType === "section" ||
      rowType === "title" ||
      ["receita", "receitas", "despesa", "despesas", "custo", "custos", "resultado", "lucro", "deducao", "deducoes"].some((term) =>
        normalized.includes(term)
      )

    if (looksLikeSection && firstValue.length <= 80) {
      sections.add(firstValue)
    }
  }

  return Array.from(sections).slice(0, 20)
}

function textValue(row: TabularRow, keys: string[]) {
  for (const key of keys) {
    const match = Object.keys(row).find((column) => normalizeHeader(column) === key)
    if (!match) continue
    const value = row[match]
    if (value === null || value === undefined || value === "") continue
    return String(value).trim()
  }
  return ""
}

function numberValue(row: TabularRow, keys: string[]) {
  const raw = textValue(row, keys)
  if (!raw) return 0

  const normalized = raw
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateValue(row: TabularRow, keys: string[]) {
  const value = textValue(row, keys)
  if (!value) return ""

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return value
}

function hasColumn(row: TabularRow, keys: string[]) {
  const normalizedColumns = Object.keys(row).map(normalizeHeader)
  return keys.some((key) => normalizedColumns.includes(key))
}

function inferFinancialType(row: TabularRow) {
  const explicit = normalizeHeader(textValue(row, ["tipo", "type", "natureza"]))
  if (["receita", "entrada", "credito", "credit"].includes(explicit)) return "receita"
  if (["despesa", "saida", "debito", "debit"].includes(explicit)) return "despesa"

  const value = numberValue(row, ["valor", "value", "amount", "total"])
  return value < 0 ? "despesa" : "receita"
}

function parseBrazilianCurrency(value: string) {
  const cleaned = value.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : undefined
}

function currencyNear(text: string, terms: string[]) {
  for (const term of terms) {
    const pattern = new RegExp(`${term}[\\s\\S]{0,180}?(R\\$\\s*\\d{1,3}(?:\\.\\d{3})*,\\d{2}|\\d{1,3}(?:\\.\\d{3})*,\\d{2})`, "i")
    const match = text.match(pattern)
    if (match?.[1]) return parseBrazilianCurrency(match[1])
  }
  return undefined
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/[.;,]+$/, "")
  }
  return undefined
}

function firstNumber(text: string, patterns: RegExp[]) {
  const value = firstMatch(text, patterns)
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseDate(value?: string) {
  if (!value) return undefined
  const match = value.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/)
  if (!match) return undefined
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3])
  if (!day || !month || !year) return undefined
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
}

function addMonths(dateText: string | undefined, months: number | undefined) {
  if (!dateText || !months) return undefined
  const parsed = parseDate(dateText)
  if (!parsed) return undefined
  const [day, month, year] = parsed.split("/").map(Number)
  const date = new Date(year, month - 1, day)
  date.setMonth(date.getMonth() + months)
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

function extractParty(text: string, label: string) {
  const pattern = new RegExp(`${label}[\\s\\S]{0,500}`, "i")
  const segment = text.match(pattern)?.[0] ?? ""
  const company =
    segment.match(/([A-Z0-9][A-Z0-9 .,&\-ÇÃÕÁÉÍÓÚÂÊÔ]+?(?:LTDA|S\.A\.|EIRELI|ME|EPP))/)?.[1]?.trim() ??
    undefined
  const cnpj = segment.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0]
  return { company, cnpj, segment }
}

function extractAddress(segment: string) {
  const address = firstMatch(segment, [
    /endere[cç]o(?:\s*[:\-])?\s*([^,\n]+(?:,\s*[^,\n]+){0,3})/i,
    /(Rua|Avenida|Av\.|Travessa|Rodovia)\s+[^,\n]+(?:,\s*[^,\n]+){0,3}/i,
  ])
  const cityState = segment.match(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ\s.'-]+)\s*[-\/]\s*([A-Z]{2})/)
  const postalCode = segment.match(/\d{5}-?\d{3}/)?.[0]

  return {
    address,
    city: cityState?.[1]?.trim(),
    state: cityState?.[2],
    postalCode,
  }
}

function extractRepresentative(text: string) {
  return firstMatch(text, [
    /representad[ao]\s+por\s+([^,\n.]+)/i,
    /representante(?:\s+legal)?(?:\s*[:\-])?\s*([^,\n.]+)/i,
  ])
}

function extractGuarantor(text: string) {
  return firstMatch(text, [
    /fiador(?:a)?(?:\s*[:\-])?\s*([^,\n.]+)/i,
    /FIADOR(?:A)?[\s\S]{0,120}?([A-Z][A-ZÀ-ÿ\s.'-]{4,})/i,
  ])
}

function extractLabeledBlock(text: string, startPattern: RegExp, endPatterns: RegExp[], maxLength = 1600) {
  const startMatch = text.match(startPattern)
  if (!startMatch || startMatch.index === undefined) return ""

  const rest = text.slice(startMatch.index)
  const searchArea = rest.slice(startMatch[0].length)
  const endIndex = endPatterns
    .map((pattern) => {
      const match = searchArea.match(pattern)
      return match?.index === undefined ? -1 : match.index + startMatch[0].length
    })
    .filter((index) => index > startMatch[0].length + 20)
    .sort((a, b) => a - b)[0]

  return rest.slice(0, endIndex || maxLength)
}

function extractCompanyFromBlock(block: string) {
  const cnpjIndex = block.search(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
  const candidates = [cnpjIndex >= 0 ? block.slice(Math.max(0, cnpjIndex - 280), cnpjIndex + 40) : "", block]

  for (const candidate of candidates) {
    const matches = Array.from(candidate.matchAll(/([A-Z0-9][A-Z0-9\s.,&'()/-]{8,}?(?:LTDA|S\.A\.|EIRELI|ME|EPP))/g))
    const best = matches
      .map((match) => match[1].replace(/\s+/g, " ").replace(/^[^A-Z0-9]+/, "").trim())
      .sort((a, b) => b.length - a.length)[0]
    if (best) return best
  }

  return undefined
}

function extractLocatariaAccurate(text: string) {
  const block = extractLabeledBlock(text, /LOCAT.RIA|LOCATARIA/i, [
    /FIADOR/i,
    /CLAUSULA|CL.USULA/i,
    /LOCADORA/i,
  ])
  const fallback = extractParty(text, "locat[Ã¡a]ria")

  return {
    company: extractCompanyFromBlock(block) ?? fallback.company,
    cnpj: block.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0] ?? fallback.cnpj,
    segment: block || fallback.segment,
  }
}

function extractAddressFromLocatariaBlock(segment: string) {
  const fallback = extractAddress(segment)
  const addressMatch = segment.match(/((?:Rua|Avenida|Av\.|Travessa|Rodovia)\s+[\s\S]{0,220}?CEP\s*\d{2}\.?\d{3}-?\d{3})/i)
  const fullAddress = addressMatch?.[1]?.replace(/\s+/g, " ").trim()
  const cep = fullAddress?.match(/\d{2}\.?\d{3}-?\d{3}/)?.[0] ?? fallback.postalCode
  const cityState = (fullAddress ?? segment).match(/([A-Za-zÀ-ÿ\s.'-]+?)\s*[-\/]\s*([A-Z]{2})(?:\s*,?\s*CEP|\s|$)/)
  const address = fullAddress
    ?.replace(/\s*,?\s*CEP\s*\d{2}\.?\d{3}-?\d{3}.*/i, "")
    .replace(/\s*,?\s*[A-Za-zÀ-ÿ\s.'-]+?\s*[-\/]\s*[A-Z]{2}\s*$/i, "")
    .trim()

  return {
    address: address || fallback.address,
    city: cityState?.[1]?.replace(/.*Bairro\s+[^,]+,\s*/i, "").trim() || fallback.city,
    state: cityState?.[2] || fallback.state,
    postalCode: cep,
  }
}

function extractTermMonthsAccurate(text: string) {
  return firstNumber(text, [
    /prazo\s+determinado\s+de\s+(\d{1,3})\s*mes/i,
    /prazo[\s\S]{0,160}?determinado[\s\S]{0,100}?(\d{1,3})\s*mes/i,
    /vigencia[\s\S]{0,160}?(\d{1,3})\s*mes/i,
    /vig.ncia[\s\S]{0,160}?(\d{1,3})\s*mes/i,
    /(\d{1,3})\s*meses/i,
  ])
}

function extractDepositValueAccurate(text: string) {
  return currencyNear(text, [
    "pagamento antecipado de um aluguel",
    "antecipado de um aluguel",
    "um aluguel",
    "caucao",
    "cau.ao",
    "garantia",
  ])
}

function extractContractObjectBlock(text: string) {
  return extractLabeledBlock(
    text,
    /CLAUSULA\s*1|CL.USULA\s*1|DO OBJETO|OBJETO/i,
    [/\bTotal\b/i, /CLAUSULA\s*2|CL.USULA\s*2|DO PRAZO/i],
    2600
  )
}

function extractEquipmentFromContract(text: string) {
  const equipment: CosExtractedEquipment[] = []
  const objectBlock = extractContractObjectBlock(text)
  const lines = (objectBlock || text)
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+\|\s+/))
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const normalized = normalizeLoose(line)
    const hasEquipmentSignal = /(monitor|ryzen|rtx|computador|pc gamer|notebook|ssd|hd|memoria|ram|processador|equipamento)/i.test(line)
    const quantityMatch = line.match(/(?:^|\s)(\d{1,3})\s*(?:x|un|und|unidade|unidades)?\s+/i)
    if (!hasEquipmentSignal || !quantityMatch) continue
    if (/(fiador|foro|multa|rescis|clausula|locataria|locadora|assinatura|testemunha)/i.test(normalized)) continue

    const quantity = Number(quantityMatch[1])
    const moneyMatches = Array.from(line.matchAll(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}(?:\.\d{3})*,\d{2}/g)).map((match) =>
      parseBrazilianCurrency(match[0])
    )
    const unitValue = moneyMatches[0]
    const totalValue = moneyMatches[moneyMatches.length - 1]

    equipment.push({
      quantity,
      description: line.replace(/^\d{1,3}\s*(?:x|un|und|unidade|unidades)?\s*/i, "").trim(),
      unitValue,
      totalValue,
      suggestedCategory: normalized.includes("monitor") ? "Monitor" : "Computador",
      suggestedStatus: "disponivel",
      contractLink: "Vincular ao contrato extraido",
    })
  }

  return equipment.slice(0, 30)
}

function contractConfidence(extraction: Omit<CosContractExtractionPreview, "confidence">) {
  let score = 0
  if (extraction.extractedClient?.legalName) score += 18
  if (extraction.extractedClient?.documentNumber) score += 18
  if (extraction.extractedContract?.contractType) score += 12
  if (extraction.extractedContract?.monthlyValue) score += 16
  if (extraction.extractedContract?.termMonths) score += 12
  if (extraction.extractedContract?.monthlyDueDay) score += 8
  if (extraction.extractedEquipment.length > 0) score += 10
  if (extraction.extractedFinancialEntries.length > 0) score += 6
  return Math.min(score, 100)
}

function analyzeContractText(file: File, text: string): CosContractExtractionPreview {
  const normalized = normalizeLoose(text)
  const locataria = extractParty(text, "locat[áa]ria")
  const locadora = extractParty(text, "locadora")
  const signatureDate = parseDate(firstMatch(text, [/assinad[oa][\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i, /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/]))
  const termMonths = Number(firstMatch(text, [/prazo[\s\S]{0,120}?(\d{1,3})\s*mes/i, /(\d{1,3})\s*meses/i])) || undefined
  const probableStartDate = parseDate(firstMatch(text, [/in[ií]cio[\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i, /vig[eê]ncia[\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i])) ?? signatureDate
  const monthlyDueDay = Number(firstMatch(text, [/vencimento[\s\S]{0,120}?dia\s*(\d{1,2})/i, /todo\s+dia\s*(\d{1,2})/i, /dia\s*(\d{1,2})\s+de\s+cada\s+m[eê]s/i])) || undefined
  const monthlyValue = currencyNear(text, ["pre[cç]o", "valor mensal", "mensalidade", "aluguel"])
  const depositValue = currencyNear(text, ["cau[cç][aã]o", "garantia"])
  const adjustmentIndex = firstMatch(text, [/(IGP-M|IPCA|INPC|IPC|SELIC)/i])
  const terminationFine = firstMatch(text, [/multa[\s\S]{0,180}?((?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}%|[0-9]+\s*%)/i])
  const venue = firstMatch(text, [/foro[\s\S]{0,160}?comarca\s+de\s+([^,\n.]+)/i, /foro\s+de\s+([^,\n.]+)/i])
  const extractedEquipment = extractEquipmentFromContract(text)
  const refinedLocataria = extractLocatariaAccurate(text)
  const refinedAddress = extractAddressFromLocatariaBlock(refinedLocataria.segment || locataria.segment || text)
  const refinedTermMonths = extractTermMonthsAccurate(text) ?? termMonths
  const refinedDepositValue = extractDepositValueAccurate(text) ?? depositValue
  const warnings: string[] = []

  console.info("[cos] Refined contract extraction", {
    fileName: file.name,
    lessee: refinedLocataria.company,
    cnpj: refinedLocataria.cnpj,
    city: refinedAddress.city,
    state: refinedAddress.state,
    termMonths: refinedTermMonths,
    monthlyValue,
    depositValue: refinedDepositValue,
    equipmentItems: extractedEquipment.length,
  })

  if (!refinedLocataria.company) warnings.push("Nao identifiquei a razao social da locataria com alta confianca.")
  if (!monthlyValue) warnings.push("Nao identifiquei valor mensal com alta confianca.")
  if (!refinedTermMonths) warnings.push("Nao identifiquei prazo em meses com alta confianca.")
  if (extractedEquipment.length === 0) warnings.push("Nao identifiquei equipamentos estruturados no contrato.")

  const extractedContract: CosExtractedContract = {
    contractType: normalized.includes("locacao") ? "Locacao de equipamentos" : "Contrato operacional",
    lessor: locadora.company,
    lessee: refinedLocataria.company,
    signatureDate,
    probableStartDate,
    termMonths: refinedTermMonths,
    calculatedEndDate: addMonths(probableStartDate, refinedTermMonths),
    monthlyDueDay,
    monthlyValue,
    depositValue: refinedDepositValue,
    adjustmentIndex,
    terminationFine,
    venue,
    suggestedStatus: "ativo",
  }

  const extractedFinancialEntries: CosExtractedFinancialEntry[] = []
  if (monthlyValue) {
    extractedFinancialEntries.push({
      type: "receita",
      description: `Receita recorrente mensal${refinedLocataria.company ? ` - ${refinedLocataria.company}` : ""}`,
      value: monthlyValue,
      dueDay: monthlyDueDay,
      installments: refinedTermMonths,
      firstCompetence: probableStartDate,
      lastCompetence: addMonths(probableStartDate, refinedTermMonths),
      source: file.name,
    })
  }
  if (refinedDepositValue) {
    extractedFinancialEntries.push({
      type: "receita",
      description: `Caucao contratual${refinedLocataria.company ? ` - ${refinedLocataria.company}` : ""}`,
      value: refinedDepositValue,
      dueDay: monthlyDueDay,
      installments: 1,
      firstCompetence: probableStartDate,
      source: file.name,
    })
  }

  const previewWithoutConfidence = {
    sourceFile: file.name,
    extractedClient: {
      legalName: refinedLocataria.company,
      documentNumber: refinedLocataria.cnpj,
      ...refinedAddress,
      representative: extractRepresentative(text),
      guarantor: extractGuarantor(text),
    },
    extractedContract,
    extractedEquipment,
    extractedFinancialEntries,
    extractedDocument: {
      fileName: file.name,
      type: file.type || "contrato",
      suggestedNotes: "Contrato analisado pelo COS. Nenhum dado foi gravado.",
    },
    warnings,
    textSample: text.slice(0, 1200),
  }

  return {
    ...previewWithoutConfidence,
    confidence: contractConfidence(previewWithoutConfidence),
  }
}

function looksLikeContract(text: string) {
  const normalized = normalizeLoose(text)
  const matches = CONTRACT_TERMS.filter((term) => normalized.includes(term)).length
  return matches >= 3
}

function buildFinancialPreview(rows: WorkbookRows[]) {
  const preview: TabularRow[] = []

  for (const sheet of rows) {
    for (const row of sheet.rows) {
      if (preview.length >= MAX_PREVIEW_ROWS) return preview
      if (!hasColumn(row, ["valor", "value", "amount", "total"])) continue

      const description = textValue(row, [
        "descricao",
        "description",
        "historico",
        "lancamento",
        "nome",
        "cliente",
        "fornecedor",
      ])
      const value = numberValue(row, ["valor", "value", "amount", "total"])
      if (!description && value === 0) continue

      preview.push({
        selected: true,
        type: inferFinancialType(row),
        description: description || "Lancamento identificado",
        supplier_name: textValue(row, ["fornecedor", "supplier", "cliente", "client"]),
        dre_category: textValue(row, ["categoria_dre", "categoria", "category"]),
        competence_date: dateValue(row, ["competencia", "competence_date", "data", "date"]),
        due_date: dateValue(row, ["vencimento", "due_date"]),
        payment_date: dateValue(row, ["pagamento", "payment_date", "data_pagamento"]),
        value: Math.abs(value),
        status: textValue(row, ["status", "situacao", "situacao_financeira"]) || "pendente",
        source: `${sheet.fileName} / ${sheet.sheetName}`,
        notes: "Previa gerada pelo COS. Nenhum dado foi gravado.",
      })
    }
  }

  return preview
}

function buildClientPreview(rows: WorkbookRows[]) {
  const preview: TabularRow[] = []

  for (const sheet of rows) {
    for (const row of sheet.rows) {
      if (preview.length >= MAX_PREVIEW_ROWS) return preview
      if (!hasColumn(row, ["cliente", "name", "nome", "razao_social"])) continue

      const name = textValue(row, ["cliente", "name", "nome", "razao_social", "nome_fantasia"])
      if (!name) continue

      preview.push({
        selected: true,
        name,
        type: textValue(row, ["tipo", "type"]) || "cliente",
        document_number: textValue(row, ["documento", "cnpj", "cpf", "document_number"]),
        email: textValue(row, ["email", "e_mail"]),
        phone: textValue(row, ["telefone", "phone", "celular"]),
        whatsapp: textValue(row, ["whatsapp", "zap"]),
        city: textValue(row, ["cidade", "city"]),
        status: textValue(row, ["status", "situacao"]) || "ativo",
        notes: `Origem: ${sheet.fileName} / ${sheet.sheetName}`,
      })
    }
  }

  return preview
}

function buildEquipmentPreview(rows: WorkbookRows[]) {
  const preview: TabularRow[] = []

  for (const sheet of rows) {
    for (const row of sheet.rows) {
      if (preview.length >= MAX_PREVIEW_ROWS) return preview
      if (!hasColumn(row, ["equipamento", "equipment", "maquina", "name", "nome"])) continue

      const name = textValue(row, ["equipamento", "equipment", "maquina", "name", "nome", "modelo"])
      if (!name) continue

      const quantity = numberValue(row, ["quantidade", "quantity", "quantity_total", "qtd", "total"])
      preview.push({
        selected: true,
        name,
        category: textValue(row, ["categoria", "category", "tipo"]),
        quantity_total: quantity || 1,
        quantity_available: quantity || 1,
        quantity_rented: numberValue(row, ["locados", "quantity_rented"]),
        quantity_reserved: numberValue(row, ["reservados", "quantity_reserved"]),
        quantity_maintenance: numberValue(row, ["manutencao", "quantity_maintenance"]),
        status: textValue(row, ["status", "situacao"]) || "disponivel",
        notes: `Origem: ${sheet.fileName} / ${sheet.sheetName}`,
      })
    }
  }

  return preview
}

function workbookToRows(workbook: XLSX.WorkBook, fileName: string) {
  const rows: WorkbookRows[] = []
  const sheets: CosFileSheetPreview[] = []

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "", raw: false })
    const nonEmptyRows = matrix.filter((row) => rowNonEmptyCount(row) > 0)
    const ignoredEmptyRows = matrix.length - nonEmptyRows.length
    const usefulIndexes = usefulColumnIndexes(nonEmptyRows)
    const compactRows = nonEmptyRows.map((row) => usefulIndexes.map((index) => row[index]))
    const headerRowIndex = detectHeaderRow(compactRows)
    const headerValues = headerRowIndex === null ? compactRows[0] ?? [] : compactRows[headerRowIndex] ?? []
    const columns = uniqueColumns(headerValues)

    const dataStartIndex = headerRowIndex === null ? 0 : headerRowIndex + 1
    const structuredRows = compactRows.slice(dataStartIndex).map((row, index) => {
      const structuredRow: TabularRow = {
        _rowNumber: (headerRowIndex === null ? index : headerRowIndex + index + 1) + 1,
      }

      columns.forEach((column, columnIndex) => {
        structuredRow[column] = cellText(row[columnIndex])
      })

      structuredRow._rowType = classifyStructuredRow(structuredRow, columns)
      return structuredRow
    })

    const probableType = detectProbableType(structuredRows, columns)
    const detectedSections = detectSections(structuredRows, columns)
    const sampleRows = structuredRows.slice(0, MAX_STRUCTURED_SAMPLE_ROWS)

    console.info("[cos] Spreadsheet structure", {
      fileName,
      sheetName,
      totalRows: nonEmptyRows.length,
      usefulColumns: columns.length,
      headerRow: headerRowIndex === null ? null : headerRowIndex + 1,
      probableType,
      ignoredEmptyRows,
      detectedSections: detectedSections.length,
    })

    rows.push({
      fileName,
      sheetName,
      rows: structuredRows,
      columns,
      headerRow: headerRowIndex === null ? null : headerRowIndex + 1,
      sourceType: probableType,
    })
    sheets.push({
      name: sheetName,
      rowCount: structuredRows.length,
      columns: columns.slice(0, 30),
      usefulColumns: columns.length,
      headerRow: headerRowIndex === null ? null : headerRowIndex + 1,
      ignoredEmptyRows,
      probableType,
      detectedSections,
      sampleRows,
    })
  }

  return { rows, sheets }
}

async function analyzeSpreadsheet(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  return workbookToRows(workbook, file.name)
}

function extractMoneyValues(line: string) {
  return Array.from(
    line.matchAll(/-?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|-?\s*(?:R\$\s*)?\d+,\d{2}/g)
  )
    .map((match) => parseBrazilianCurrency(match[0].replace(/\s+/g, "")))
    .filter((value): value is number => typeof value === "number")
}

function extractPercentValues(text: string) {
  return Array.from(text.matchAll(/-?\d{1,3}(?:,\d{1,2})?\s*%/g)).map((match) => match[0])
}

function detectFinancialColumns(text: string) {
  const normalized = normalizeLoose(text)
  const detected = new Set<string>()
  const monthAliases = [
    ["jan", "jan", "janeiro"],
    ["fev", "fev", "fevereiro"],
    ["mar", "mar", "marco", "março"],
    ["abr", "abr", "abril"],
    ["mai", "mai", "maio"],
    ["jun", "jun", "junho"],
    ["jul", "jul", "julho"],
    ["ago", "ago", "agosto"],
    ["set", "set", "setembro"],
    ["out", "out", "outubro"],
    ["nov", "nov", "novembro"],
    ["dez", "dez", "dezembro"],
  ]

  monthAliases.forEach(([label, ...aliases]) => {
    if (aliases.some((alias) => new RegExp(`\\b${alias}(?:[-/]?\\d{2,4})?\\b`, "i").test(normalized))) {
      detected.add(label)
    }
  })

  if (/\btotal\b/i.test(normalized)) detected.add("total")
  if (/\bcompetencia\b|\bcompetencia\b/i.test(normalized)) detected.add("competencia")
  if (/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(normalized)) detected.add("datas")

  return Array.from(detected)
}

function detectFinancialDocumentType(text: string) {
  const normalized = normalizeLoose(text)
  const monthCount = detectFinancialColumns(text).filter((column) => column.length === 3).length
  const moneyCount = extractMoneyValues(text).length
  const score = {
    dre: 0,
    cashFlow: 0,
    payable: 0,
    receivable: 0,
    granatum: 0,
    bankStatement: 0,
    financialReport: 0,
  }

  if (normalized.includes("granatum")) score.granatum += 4
  if (normalized.includes("dre") || normalized.includes("demonstrativo")) score.dre += 3
  if (normalized.includes("receita") && normalized.includes("despesa")) score.dre += 3
  if (normalized.includes("lucro") || normalized.includes("resultado operacional")) score.dre += 2
  if (monthCount >= 3) score.dre += 2
  if (normalized.includes("fluxo de caixa") || normalized.includes("saldo inicial") || normalized.includes("saldo final")) score.cashFlow += 4
  if (normalized.includes("contas a pagar") || normalized.includes("fornecedor")) score.payable += 4
  if (normalized.includes("contas a receber") || normalized.includes("cliente")) score.receivable += 4
  if (normalized.includes("extrato") || normalized.includes("agencia") || normalized.includes("conta corrente")) score.bankStatement += 4
  if (normalized.includes("financeiro") || moneyCount >= 5) score.financialReport += 2

  const entries = [
    ["DRE Gerencial", score.dre],
    ["Fluxo de Caixa", score.cashFlow],
    ["Contas a Pagar", score.payable],
    ["Contas a Receber", score.receivable],
    ["Relatorio Granatum", score.granatum],
    ["Extrato Bancario", score.bankStatement],
    ["Relatorio Financeiro", score.financialReport],
  ] as const

  const best = entries.reduce((current, next) => (next[1] > current[1] ? next : current), entries[0])
  const confidence = Math.min(96, Math.max(35, best[1] * 12 + Math.min(moneyCount, 12) * 2 + monthCount * 2))
  return {
    detectedType: best[1] > 0 ? best[0] : "Planilha Generica",
    confidence,
  }
}

function detectFinancialCategories(text: string) {
  const normalized = normalizeLoose(text)
  return FINANCIAL_CATEGORY_TERMS.filter((category) =>
    category.terms.some((term) => normalized.includes(normalizeLoose(term)))
  ).map((category) => category.label)
}

function detectFinancialClients(text: string) {
  const normalized = normalizeLoose(text)
  return FINANCIAL_CLIENT_TERMS.filter((client) => normalized.includes(normalizeLoose(client)))
}

function classifyFinancialLine(line: string) {
  const normalized = normalizeLoose(line)
  const category = FINANCIAL_CATEGORY_TERMS.find((item) =>
    item.terms.some((term) => normalized.includes(normalizeLoose(term)))
  )?.label

  if (
    normalized.includes("receita") ||
    normalized.includes("faturamento") ||
    FINANCIAL_CLIENT_TERMS.some((client) => normalized.includes(normalizeLoose(client)))
  ) {
    return { kind: "revenue" as const, category: category || "Receitas" }
  }

  if (
    normalized.includes("despesa") ||
    normalized.includes("custo") ||
    normalized.includes("imposto") ||
    normalized.includes("salario") ||
    normalized.includes("juros") ||
    normalized.includes("tarifa") ||
    normalized.includes("investimento") ||
    normalized.includes("distribuicao")
  ) {
    return { kind: "expense" as const, category: category || "Despesas" }
  }

  return { kind: "neutral" as const, category }
}

function buildFinancialOcrRows(text: string) {
  const revenue: CosFinancialOcrLine[] = []
  const expenses: CosFinancialOcrLine[] = []
  const entries: TabularRow[] = []
  const columns = detectFinancialColumns(text)
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  lines.forEach((line, index) => {
    const values = extractMoneyValues(line)
    if (values.length === 0) return

    const classification = classifyFinancialLine(line)
    const description = line.replace(/-?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|-?\s*(?:R\$\s*)?\d+,\d{2}/g, "").trim()
    const item: CosFinancialOcrLine = {
      description: description || `Linha ${index + 1}`,
      sourceLine: line,
      values,
      category: classification.category,
      columns,
    }

    if (classification.kind === "revenue") {
      revenue.push(item)
      entries.push({
        type: "receita",
        description: item.description,
        value: values[values.length - 1],
        category: item.category,
        source: "ocr_financeiro",
      })
    } else if (classification.kind === "expense") {
      expenses.push(item)
      entries.push({
        type: "despesa",
        description: item.description,
        value: values[values.length - 1],
        category: item.category,
        source: "ocr_financeiro",
      })
    }
  })

  return { revenue, expenses, entries }
}

function findLineValue(text: string, patterns: RegExp[]) {
  const lines = text.split("\n")
  for (const pattern of patterns) {
    const line = lines.find((item) => pattern.test(normalizeLoose(item)))
    if (!line) continue
    const values = extractMoneyValues(line)
    if (values.length > 0) return values[values.length - 1]
  }
  return undefined
}

async function extractImageOcrText(file: File) {
  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker("por+eng")
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await worker.recognize(buffer)
    return normalizeDocumentText(result.data.text ?? "")
  } finally {
    await worker.terminate()
  }
}

function analyzeFinancialOcrText(file: File, extractedText: string, sourceType: "financial_image" = "financial_image") {
  const normalizedText = normalizeDocumentText(extractedText)
  const documentType = detectFinancialDocumentType(normalizedText)
  const columns = detectFinancialColumns(normalizedText)
  const categories = detectFinancialCategories(normalizedText)
  const clients = detectFinancialClients(normalizedText)
  const rows = buildFinancialOcrRows(normalizedText)
  const moneyValues = extractMoneyValues(normalizedText)
  const percentages = extractPercentValues(normalizedText)
  const warnings: string[] = []

  if (!normalizedText) {
    warnings.push("OCR nao retornou texto legivel para este arquivo.")
  }
  if (columns.length === 0) {
    warnings.push("Nao identifiquei colunas de meses, datas ou totais com confianca.")
  }
  if (moneyValues.length === 0) {
    warnings.push("Nao identifiquei valores monetarios com confianca.")
  }

  const preview: CosFinancialOcrPreview = {
    sourceType,
    sourceFile: file.name,
    detectedType: documentType.detectedType,
    confidence: documentType.confidence,
    extractedColumns: columns,
    extractedClients: clients,
    extractedRevenue: rows.revenue.slice(0, 20),
    extractedExpenses: rows.expenses.slice(0, 20),
    extractedCategories: categories,
    extractedFinancialEntries: rows.entries.slice(0, 30),
    extractedWarnings: warnings,
    suggestedActions: FINANCIAL_OCR_ACTIONS,
    summary: {
      valuesDetected: moneyValues.length,
      percentagesDetected: percentages.length,
      revenueTotal: findLineValue(normalizedText, [/receita total/, /receita bruta/, /receita liquida/]),
      expenseTotal: findLineValue(normalizedText, [/total.*despesa/, /despesas totais/]),
      operationalResult: findLineValue(normalizedText, [/resultado operacional/, /lucro operacional/]),
    },
    textSample: normalizedText.slice(0, 1400),
  }

  console.info("[cos] Financial OCR analysis", {
    fileName: file.name,
    detectedType: preview.detectedType,
    confidence: preview.confidence,
    textLength: normalizedText.length,
    columns: preview.extractedColumns,
    clients: preview.extractedClients.length,
    revenueRows: preview.extractedRevenue.length,
    expenseRows: preview.extractedExpenses.length,
    categories: preview.extractedCategories.length,
    moneyValues: preview.summary.valuesDetected,
  })

  return preview
}

function supportedSpreadsheet(file: File) {
  const name = file.name.toLowerCase()
  return name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")
}

function imageFile(file: File) {
  return file.type.startsWith("image/")
}

function pdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function docxFile(file: File) {
  return (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  )
}

export async function analyzeCosFiles(files: File[]) {
  const allRows: WorkbookRows[] = []
  const filePreviews: CosFilePreview[] = []
  const contractExtractions: CosContractExtractionPreview[] = []
  const financialOcrAnalyses: CosFinancialOcrPreview[] = []
  const warnings: string[] = []

  for (const file of files) {
    if (supportedSpreadsheet(file)) {
      try {
        const result = await analyzeSpreadsheet(file)
        allRows.push(...result.rows)
        filePreviews.push({
          name: file.name,
          type: file.type || "planilha",
          size: file.size,
          sheets: result.sheets,
          notes: [],
        })
      } catch (error) {
        console.error("[cos] Falha ao analisar planilha", error)
        warnings.push(`Nao consegui ler a planilha ${file.name}.`)
        filePreviews.push({
          name: file.name,
          type: file.type || "planilha",
          size: file.size,
          sheets: [],
          notes: ["Falha na leitura da planilha."],
        })
      }
      continue
    }

    if (docxFile(file) || pdfFile(file)) {
      try {
        const extractedText = docxFile(file) ? await extractDocxText(file) : await extractPdfText(file)
        const contractExtraction = analyzeContractText(file, extractedText)
        const isContract = looksLikeContract(extractedText)
        const financialOcrCandidate =
          !isContract && extractedText.trim()
            ? analyzeFinancialOcrText(file, extractedText)
            : undefined
        const financialOcr =
          financialOcrCandidate && financialOcrCandidate.confidence >= 40 ? financialOcrCandidate : undefined

        if (isContract || contractExtraction.confidence >= 35) {
          contractExtractions.push(contractExtraction)
        }
        if (financialOcr) {
          financialOcrAnalyses.push(financialOcr)
        }

        console.info("[cos] Document analysis", {
          fileName: file.name,
          type: docxFile(file) ? "docx" : "pdf",
          textLength: extractedText.length,
          confidence: contractExtraction.confidence,
          equipmentItems: contractExtraction.extractedEquipment.length,
          financialItems: contractExtraction.extractedFinancialEntries.length,
          financialType: financialOcr?.detectedType,
        })

        filePreviews.push({
          name: file.name,
          type: file.type || (docxFile(file) ? "DOCX" : "PDF"),
          size: file.size,
          sheets: [],
          notes: isContract
            ? ["Contrato analisado. Nenhum dado foi gravado; revise os cards antes de cadastrar."]
            : financialOcr
              ? ["Documento financeiro textual analisado. Nenhum dado foi gravado; revise os cards antes de cadastrar."]
              : ["Documento lido, mas o COS nao encontrou sinais fortes de contrato ou relatorio financeiro."],
          contractExtraction: isContract || contractExtraction.confidence >= 35 ? contractExtraction : undefined,
          financialOcr,
        })
      } catch (error) {
        console.error("[cos] Falha ao analisar contrato", error)
        const message = error instanceof Error ? error.message : "Falha na leitura do documento."
        const pdfScanNotice = pdfFile(file)
          ? " Se este PDF for escaneado, envie a pagina como PNG/JPG para OCR financeiro; o motor local usado nesta etapa nao faz OCR direto de PDF."
          : ""
        warnings.push(`${file.name}: ${message}`)
        filePreviews.push({
          name: file.name,
          type: file.type || (docxFile(file) ? "DOCX" : "PDF"),
          size: file.size,
          sheets: [],
          notes: [`${message}${pdfScanNotice}`],
        })
      }
      continue
    }

    if (imageFile(file)) {
      try {
        const extractedText = await extractImageOcrText(file)
        const financialOcr = analyzeFinancialOcrText(file, extractedText)
        financialOcrAnalyses.push(financialOcr)
        filePreviews.push({
          name: file.name,
          type: file.type || "imagem",
          size: file.size,
          sheets: [],
          notes: ["OCR financeiro executado. Nenhum dado foi gravado; revise os cards antes de cadastrar."],
          financialOcr,
        })
      } catch (error) {
        console.error("[cos] Falha ao executar OCR financeiro", error)
        const message = error instanceof Error ? error.message : "Falha na leitura OCR da imagem."
        warnings.push(`${file.name}: ${message}`)
        filePreviews.push({
          name: file.name,
          type: file.type || "imagem",
          size: file.size,
          sheets: [],
          notes: [`Nao consegui executar OCR neste arquivo: ${message}`],
        })
      }
      continue
    }

    filePreviews.push({
      name: file.name,
      type: file.type || "arquivo",
      size: file.size,
      sheets: [],
      notes: ["Arquivo recebido para analise manual. Este tipo ainda nao possui leitor automatico no MVP."],
    })
  }

  const preview: CosFileAnalysisPreview = {
    kind: "file_analysis",
    files: filePreviews,
    financialEntries: buildFinancialPreview(allRows),
    clients: buildClientPreview(allRows),
    equipment: buildEquipmentPreview(allRows),
    contractExtractions,
    financialOcrAnalyses,
    warnings,
  }

  const sheetCount = filePreviews.reduce((total, file) => total + file.sheets.length, 0)
  const probableTypes = Array.from(
    new Set(
      filePreviews.flatMap((file) =>
        file.sheets.flatMap((sheet) => (sheet.probableType ? [sheet.probableType] : []))
      )
    )
  )
  const dreNotice = probableTypes.includes("DRE / Demonstrativo financeiro")
    ? " Tipo provavel detectado: DRE / Demonstrativo financeiro. A planilha foi apenas analisada; nao sera transformada em operacao automaticamente."
    : ""
  const answer = [
    `Analisei ${filePreviews.length} arquivo(s) e encontrei ${sheetCount} aba(s) tabulares.`,
    dreNotice,
    contractExtractions.length
      ? ` Analisei ${contractExtractions.length} contrato(s) e gerei cards de cliente, contrato, equipamentos, financeiro e documento.`
      : "",
    financialOcrAnalyses.length
      ? ` Analisei ${financialOcrAnalyses.length} imagem(ns) ou documento(s) financeiro(s) por OCR/texto e gerei preview financeiro estruturado.`
      : "",
    `Previa gerada: ${preview.financialEntries.length} possiveis lancamentos financeiros, ${preview.clients.length} possiveis clientes e ${preview.equipment.length} possiveis equipamentos.`,
    "Nenhum dado foi gravado. Revise a previa; a confirmacao de execucao fica bloqueada para a proxima etapa assistida.",
  ].join(" ")

  return {
    intent: "file_analysis" as const,
    answer,
    sources: ["uploaded_files"],
    preview,
  }
}
