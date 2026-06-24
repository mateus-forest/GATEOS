import * as XLSX from "xlsx"
import { inflateRawSync } from "node:zlib"

type TabularRow = Record<string, unknown>
type CosConfidenceLevel = "alta" | "media" | "baixa"
type CosActionStatus = "preview" | "requires_review" | "next_step"
type CosDocumentType =
  | "contract"
  | "dre"
  | "financial_report"
  | "cash_flow"
  | "accounts_payable"
  | "accounts_receivable"
  | "bank_statement"
  | "commercial_proposal"
  | "corporate_document"
  | "invoice"
  | "operational_spreadsheet"
  | "image"
  | "print"
  | "other"

type CosGateEntityType =
  | "Cliente"
  | "Contrato"
  | "Equipamento"
  | "Financeiro"
  | "Documento"
  | "Fornecedor"
  | "Banco"
  | "DRE"
  | "Socio"

type CosLogicalSection = {
  name: string
  role: string
  confidence: number
  sourceSnippet?: string
  children?: CosLogicalSection[]
}

type CosBusinessEntity = CosEntityMetadata & {
  entityType: CosGateEntityType
  label: string
  gateModule: string
  relationship?: string
  values?: Record<string, unknown>
}

type CosOperationalMapping = {
  entityType: CosGateEntityType
  gateModule: string
  modulePath: string
  suggestedAction: string
  actionStatus: CosActionStatus
  reason: string
}

type CosOperationalIntelligence = {
  documentType: CosDocumentType
  documentTypeLabel: string
  classificationReason: string
  logicalStructure: CosLogicalSection[]
  businessEntities: CosBusinessEntity[]
  operationalMappings: CosOperationalMapping[]
  executiveSummary: string
  foundData: string[]
  missingData: string[]
  possibleProblems: string[]
  possibleDivergences: string[]
  nextActions: string[]
}

type CosEntityMetadata = {
  sourceFileName?: string
  sourcePage?: number
  sourceSnippet?: string
  confidence: number
  confidenceLevel: CosConfidenceLevel
  warnings: string[]
  missingFields: string[]
  suggestedAction?: string
  actionStatus: CosActionStatus
}

type CosExtractedParty = CosEntityMetadata & {
  role: "lessor" | "lessee" | "guarantor"
  legalName?: string
  tradeName?: string
  documentNumber?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  representative?: string
  representativeDocument?: string
  phone?: string
  email?: string
  primaryContact?: string
}

export type CosExtractedClient = {
  legalName?: string
  tradeName?: string
  documentNumber?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  representative?: string
  representativeDocument?: string
  guarantor?: string
  phone?: string
  email?: string
  primaryContact?: string
  confidence?: number
  confidenceLevel?: CosConfidenceLevel
  warnings?: string[]
  missingFields?: string[]
}

export type CosExtractedContract = {
  title?: string
  contractType?: string
  lessor?: string
  lessee?: string
  signatureDate?: string
  probableStartDate?: string
  endDate?: string
  termMonths?: number
  validity?: string
  calculatedEndDate?: string
  monthlyDueDay?: number
  monthlyValue?: number
  totalValue?: number
  depositValue?: number
  entryValue?: number
  installments?: number
  recurrence?: string
  adjustmentIndex?: string
  adjustmentRule?: string
  terminationFine?: string
  interest?: string
  noticePeriod?: string
  venue?: string
  suggestedStatus?: string
  intelligentNotes?: string[]
  confidence?: number
  confidenceLevel?: CosConfidenceLevel
  warnings?: string[]
  missingFields?: string[]
}

export type CosExtractedEquipment = {
  quantity?: number
  description: string
  configuration?: string
  unitValue?: number
  totalValue?: number
  suggestedCategory?: string
  suggestedStatus?: string
  suggestedClientLink?: string
  contractLink?: string
  sourceSnippet?: string
  confidence?: number
  confidenceLevel?: CosConfidenceLevel
  warnings?: string[]
  missingFields?: string[]
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
  extractedParties?: {
    lessor?: CosExtractedParty
    lessee?: CosExtractedParty
    guarantor?: CosExtractedParty
  }
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
  rowKind?: string
  confidence?: number
  warnings?: string[]
}

export type CosDreRow = CosEntityMetadata & {
  label: string
  rowKind: string
  category?: string
  values: Record<string, number | string | null>
  total?: number
  sourceSheet?: string
  sourceRow?: number
}

export type CosDiagnostic = CosEntityMetadata & {
  type: string
  title: string
  description: string
  severity: "info" | "warning" | "critical"
  suggestedActions: string[]
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
  extractedDreRows: CosDreRow[]
  diagnostics: CosDiagnostic[]
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

export type CosNormalizedExtraction = {
  sourceType:
    | "contract"
    | "dre"
    | "granatum"
    | "bank_statement"
    | "financial_report"
    | "image"
    | "spreadsheet"
    | "document"
  confidence: number
  confidenceLevel: CosConfidenceLevel
  documentType: CosDocumentType
  operationalIntelligence: CosOperationalIntelligence
  sourceFile: {
    name: string
    type: string
    size: number
  }
  extractedParties: {
    lessor?: CosExtractedParty
    lessee?: CosExtractedParty
    guarantor?: CosExtractedParty
  }
  extractedClient?: CosExtractedClient
  extractedContract?: CosExtractedContract
  extractedEquipment: Array<CosExtractedEquipment | TabularRow>
  extractedFinancialEntries: TabularRow[]
  extractedCategories: string[]
  extractedBankBalances: TabularRow[]
  extractedDreRows: CosDreRow[]
  diagnostics: CosDiagnostic[]
  warnings: string[]
  suggestedActions: string[]
}

export type CosFileAnalysisPreview = {
  kind: "file_analysis"
  files: CosFilePreview[]
  financialEntries: TabularRow[]
  clients: TabularRow[]
  equipment: TabularRow[]
  contractExtractions: CosContractExtractionPreview[]
  financialOcrAnalyses: CosFinancialOcrPreview[]
  normalizedExtractions: CosNormalizedExtraction[]
  diagnostics: CosDiagnostic[]
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

const EQUIPMENT_TERMS = [
  "computador",
  "desktop",
  "notebook",
  "monitor",
  "pc gamer",
  "processador",
  "ryzen",
  "intel",
  "rtx",
  "gtx",
  "ssd",
  "memoria",
  "ram",
  "teclado",
  "mouse",
  "headset",
  "servidor",
]

const LEGAL_EQUIPMENT_EXCLUSION_TERMS = [
  "devolucao",
  "devolver",
  "obrigacao",
  "manutencao preventiva",
  "manutencao corretiva",
  "responsabilidade",
  "multa",
  "rescis",
  "foro",
  "clausula",
  "testemunha",
  "assinatura",
  "inadimplemento",
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

function confidenceLevel(confidence: number): CosConfidenceLevel {
  if (confidence >= 75) return "alta"
  if (confidence >= 50) return "media"
  return "baixa"
}

function metadata(args: {
  fileName?: string
  snippet?: string
  confidence: number
  warnings?: string[]
  missingFields?: string[]
  suggestedAction?: string
  actionStatus?: CosActionStatus
}): CosEntityMetadata {
  return {
    sourceFileName: args.fileName,
    sourceSnippet: args.snippet?.slice(0, 500),
    confidence: args.confidence,
    confidenceLevel: confidenceLevel(args.confidence),
    warnings: args.warnings ?? [],
    missingFields: args.missingFields ?? [],
    suggestedAction: args.suggestedAction,
    actionStatus: args.actionStatus ?? "preview",
  }
}

function uniqueText(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
}

function documentTypeLabel(documentType: CosDocumentType) {
  const labels: Record<CosDocumentType, string> = {
    contract: "Contrato",
    dre: "DRE",
    financial_report: "Relatorio financeiro",
    cash_flow: "Fluxo de caixa",
    accounts_payable: "Contas a pagar",
    accounts_receivable: "Contas a receber",
    bank_statement: "Extrato bancario",
    commercial_proposal: "Proposta comercial",
    corporate_document: "Documento societario",
    invoice: "Nota fiscal",
    operational_spreadsheet: "Planilha operacional",
    image: "Imagem",
    print: "Print",
    other: "Outro",
  }
  return labels[documentType]
}

function gateModuleForEntity(entityType: CosGateEntityType) {
  const modules: Record<CosGateEntityType, { module: string; path: string }> = {
    Cliente: { module: "Clientes", path: "/clientes" },
    Contrato: { module: "Contratos", path: "/contratos" },
    Equipamento: { module: "Equipamentos", path: "/equipamentos" },
    Financeiro: { module: "Financeiro", path: "/financeiro" },
    Documento: { module: "Documentos", path: "/documentos" },
    Fornecedor: { module: "Financeiro", path: "/financeiro" },
    Banco: { module: "Financeiro", path: "/financeiro" },
    DRE: { module: "DRE", path: "/dre" },
    Socio: { module: "Socios", path: "/socios" },
  }
  return modules[entityType]
}

function classifyDocumentText(text: string, fallback: CosDocumentType = "other") {
  const normalized = normalizeLoose(text)
  const scores: Array<{ type: CosDocumentType; score: number; reason: string }> = [
    { type: "contract", score: CONTRACT_TERMS.filter((term) => normalized.includes(term)).length * 10, reason: "termos de contrato e clausulas" },
    { type: "dre", score: (normalized.includes("dre") ? 25 : 0) + (normalized.includes("receita") && normalized.includes("despesa") ? 25 : 0) + (normalized.includes("resultado operacional") ? 15 : 0), reason: "receitas, despesas e resultado" },
    { type: "cash_flow", score: (normalized.includes("fluxo de caixa") ? 35 : 0) + (normalized.includes("saldo inicial") ? 15 : 0) + (normalized.includes("saldo final") ? 15 : 0), reason: "fluxo e saldos" },
    { type: "accounts_payable", score: (normalized.includes("contas a pagar") ? 40 : 0) + (normalized.includes("fornecedor") ? 10 : 0), reason: "contas a pagar e fornecedores" },
    { type: "accounts_receivable", score: (normalized.includes("contas a receber") ? 40 : 0) + (normalized.includes("cliente") ? 10 : 0), reason: "contas a receber e clientes" },
    { type: "bank_statement", score: (normalized.includes("extrato") ? 25 : 0) + (normalized.includes("banco") ? 12 : 0) + (normalized.includes("agencia") || normalized.includes("conta corrente") ? 12 : 0), reason: "banco, conta e saldos" },
    { type: "commercial_proposal", score: (normalized.includes("proposta comercial") ? 40 : 0) + (normalized.includes("validade da proposta") ? 10 : 0), reason: "proposta comercial" },
    { type: "corporate_document", score: (normalized.includes("contrato social") ? 40 : 0) + (normalized.includes("socio") ? 15 : 0), reason: "socios e documento societario" },
    { type: "invoice", score: (normalized.includes("nota fiscal") ? 40 : 0) + (normalized.includes("chave de acesso") ? 15 : 0), reason: "nota fiscal" },
    { type: "financial_report", score: normalized.includes("granatum") || normalized.includes("relatorio financeiro") ? 35 : 0, reason: "relatorio financeiro ou Granatum" },
  ]
  const best = scores.sort((a, b) => b.score - a.score)[0]
  if (!best || best.score <= 0) return { documentType: fallback, confidence: 45, reason: "classificacao por tipo do arquivo" }
  return { documentType: best.type, confidence: Math.min(96, 45 + best.score), reason: best.reason }
}

function makeSection(name: string, role: string, snippet?: string, children?: CosLogicalSection[]): CosLogicalSection {
  return {
    name,
    role,
    confidence: snippet ? Math.min(94, 55 + Math.min(snippet.length, 400) / 10) : 35,
    sourceSnippet: snippet?.slice(0, 500),
    children,
  }
}

function makeBusinessEntity(args: {
  entityType: CosGateEntityType
  label: string
  relationship?: string
  values?: Record<string, unknown>
  fileName?: string
  snippet?: string
  confidence: number
  warnings?: string[]
  missingFields?: string[]
  suggestedAction?: string
  actionStatus?: CosActionStatus
}): CosBusinessEntity {
  const gate = gateModuleForEntity(args.entityType)
  return {
    entityType: args.entityType,
    label: args.label,
    gateModule: gate.module,
    relationship: args.relationship,
    values: args.values,
    ...metadata({
      fileName: args.fileName,
      snippet: args.snippet,
      confidence: args.confidence,
      warnings: args.warnings,
      missingFields: args.missingFields,
      suggestedAction: args.suggestedAction,
      actionStatus: args.actionStatus ?? "preview",
    }),
  }
}

function buildOperationalMappings(entities: CosBusinessEntity[]) {
  const seen = new Set<string>()
  const mappings: CosOperationalMapping[] = []

  for (const entity of entities) {
    const key = `${entity.entityType}:${entity.gateModule}`
    if (seen.has(key)) continue
    seen.add(key)
    const gate = gateModuleForEntity(entity.entityType)
    const suggestedAction =
      entity.entityType === "Cliente"
        ? "Cadastrar cliente"
        : entity.entityType === "Contrato"
          ? "Cadastrar contrato"
          : entity.entityType === "Equipamento"
            ? "Cadastrar equipamentos"
            : entity.entityType === "Financeiro"
              ? "Criar lancamento financeiro"
              : entity.entityType === "Documento"
                ? "Anexar documento"
                : entity.entityType === "DRE"
                  ? "Salvar como analise"
                  : "Ver detalhes"

    mappings.push({
      entityType: entity.entityType,
      gateModule: gate.module,
      modulePath: gate.path,
      suggestedAction,
      actionStatus: ["Cliente", "Financeiro", "Documento"].includes(entity.entityType) ? "requires_review" : "next_step",
      reason: `${entity.label} deve ser tratado no modulo ${gate.module}.`,
    })
  }

  return mappings
}

function buildOperationalIntelligence(args: {
  documentType: CosDocumentType
  classificationReason: string
  logicalStructure: CosLogicalSection[]
  businessEntities: CosBusinessEntity[]
  foundData: string[]
  missingData: string[]
  possibleProblems: string[]
  possibleDivergences: string[]
  nextActions: string[]
  executiveSummary: string
}) {
  return {
    documentType: args.documentType,
    documentTypeLabel: documentTypeLabel(args.documentType),
    classificationReason: args.classificationReason,
    logicalStructure: args.logicalStructure,
    businessEntities: args.businessEntities,
    operationalMappings: buildOperationalMappings(args.businessEntities),
    executiveSummary: args.executiveSummary,
    foundData: args.foundData,
    missingData: args.missingData,
    possibleProblems: args.possibleProblems,
    possibleDivergences: args.possibleDivergences,
    nextActions: args.nextActions,
  }
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

function uniqueColumns(columns: unknown[]) {
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

function currencyAfterPatterns(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return parseBrazilianCurrency(match[1])
  }
  return undefined
}

function moneyValuesFromText(text: string) {
  return Array.from(text.matchAll(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/g))
    .map((match) => parseBrazilianCurrency(match[0]))
    .filter((value): value is number => typeof value === "number")
}

function reliableContractMoney(value: number | undefined, sourceBlock: string) {
  if (typeof value !== "number") return undefined
  const largerValues = moneyValuesFromText(sourceBlock).filter((item) => item >= 100)
  if (value < 100 && largerValues.length > 0) return undefined
  return value
}

function extractMonthlyContractValue(text: string) {
  return reliableContractMoney(
    currencyAfterPatterns(text, [
      /pre[cç]o\s+da\s+loca[cç][aã]o\s+ser[aá]\s+de\s*(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /valor\s+mensal\s+(?:da\s+loca[cç][aã]o\s+)?(?:ser[aá]\s+de|de)?\s*(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /mensalidade\s+(?:ser[aá]\s+de|de)?\s*(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /aluguel\s+mensal\s+(?:ser[aá]\s+de|de)?\s*(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
    ]) ?? currencyNear(text, ["preco", "preço", "valor mensal", "mensalidade", "aluguel"]),
    text
  )
}

function extractContractDepositValue(text: string) {
  return reliableContractMoney(
    currencyAfterPatterns(text, [
      /cau[cç][aã]o[\s\S]{0,120}?valor\s+de\s*(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /como\s+cau[cç][aã]o[\s\S]{0,160}?(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /garantia[\s\S]{0,120}?(R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/i,
    ]) ?? extractDepositValueAccurate(text),
    text
  )
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/[.;,]+$/, "")
  }
  return undefined
}

function allDocumentNumbers(segment: string) {
  return uniqueText([
    ...Array.from(segment.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)).map((match) => match[0]),
    ...Array.from(segment.matchAll(/\d{3}\.\d{3}\.\d{3}-\d{2}/g)).map((match) => match[0]),
  ])
}

function cleanExtractedName(value?: string) {
  return value
    ?.replace(/\s+/g, " ")
    .replace(/^(?:LOCADORA|LOCATARIA|LOCATÁRIA|FIADOR|GARANTIDOR|RAZAO SOCIAL|RAZÃO SOCIAL|NOME|CLIENTE)\s*[:\-]?\s*/i, "")
    .replace(/\s*(?:CNPJ|CPF|RG|ENDERECO|ENDEREÇO)\s*[:\-].*$/i, "")
    .replace(/[;,]+$/, "")
    .trim()
}

function labeledValue(segment: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n;]+)`, "i")
    const match = segment.match(pattern)
    const value = cleanExtractedName(match?.[1])
    if (value) return value
  }
  return undefined
}

function extractCompanyLoose(block: string) {
  const cnpjIndex = block.search(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
  const candidates = [cnpjIndex >= 0 ? block.slice(Math.max(0, cnpjIndex - 360), cnpjIndex + 40) : "", block]

  for (const candidate of candidates) {
    const labeled = labeledValue(candidate, ["razao social", "razão social", "empresa", "locadora", "locataria", "locatária", "contratante"])
    if (labeled && /\b(LTDA|S\.A\.|SA|S\/A|EIRELI|ME|EPP)\b/i.test(labeled)) return labeled

    const matches = Array.from(
      candidate.matchAll(/([A-ZÀ-ÿ0-9][A-ZÀ-ÿa-z0-9\s.,&'()/-]{8,}?(?:LTDA|S\.A\.|SA|S\/A|EIRELI|ME|EPP))/g)
    )
    const best = matches
      .map((match) => match[1].replace(/\s+/g, " ").replace(/^[^A-Z0-9]+/, "").trim())
      .filter((value) => !/locadora|locataria|contrato|clausula/i.test(value))
      .sort((a, b) => b.length - a.length)[0]
    if (best) return best
  }

  return undefined
}

function extractPersonLoose(segment: string, labels: string[]) {
  const labeled = labeledValue(segment, labels)
  if (labeled) return labeled
  return firstMatch(segment, [
    /(?:FIADOR|GARANTIDOR)\s*[:\-]\s*([^,\n;]+)/i,
    /nome\s*[:\-]\s*([^,\n;]+)/i,
  ])
}

function extractRepresentativeDocument(segment: string) {
  return firstMatch(segment, [
    /(?:CPF|RG)(?:\s*[:\-])?\s*([\d.\-\/]{7,18})/i,
    /portador(?:a)?[\s\S]{0,80}?(?:CPF|RG)[^\d]*([\d.\-\/]{7,18})/i,
  ])
}

function extractContactInfo(segment: string) {
  return {
    phone: firstMatch(segment, [/(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/]),
    email: firstMatch(segment, [/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i]),
    primaryContact: firstMatch(segment, [/contato(?:\s+principal)?(?:\s*[:\-])?\s*([^,\n.]+)/i]),
  }
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

function extractPartyBlock(text: string, role: "lessor" | "lessee" | "guarantor") {
  if (role === "lessor") {
    return extractLabeledBlock(text, /LOCADORA\s*:|LOCADORA|CONTRATADA|VENDEDORA/i, [/LOCAT.RIA\s*:|LOCAT.RIA|LOCATARIA|CONTRATANTE|COMPRADORA|FIADOR|CLAUSULA|CL.USULA/i], 1800)
  }
  if (role === "lessee") {
    return extractLabeledBlock(text, /LOCAT.RIA\s*:|LOCAT.RIA|LOCATARIA|CONTRATANTE|COMPRADORA/i, [/FIADOR\s*:|FIADOR|GARANTIDOR|LOCADORA|CLAUSULA|CL.USULA/i], 2200)
  }
  return extractLabeledBlock(text, /FIADOR\s*:|FIADOR|GARANTIDOR/i, [/CLAUSULA\s*1|CL.USULA\s*1|CLAUSULA|CL.USULA|ASSINATURA|TESTEMUNHA/i], 1600)
}

function buildExtractedParty(fileName: string, text: string, role: "lessor" | "lessee" | "guarantor"): CosExtractedParty | undefined {
  const block = extractPartyBlock(text, role)
  const fallbackLabel = role === "lessor" ? "locadora" : role === "lessee" ? "locat[ÃƒÂ¡a]ria" : "fiador"
  const fallback = extractParty(text, fallbackLabel)
  const segment = block || fallback.segment
  if (!segment) return undefined

  const address = role === "lessee" ? extractAddressFromLocatariaBlock(segment) : extractAddress(segment)
  const contacts = extractContactInfo(segment)
  const legalName =
    role === "guarantor"
      ? cleanExtractedName(extractPersonLoose(segment, ["fiador", "garantidor", "nome"])) ?? extractGuarantor(segment)
      : extractCompanyLoose(segment) ?? fallback.company
  const documentNumber = allDocumentNumbers(segment)[0] ?? fallback.cnpj
  const representative = extractRepresentative(segment)
  const missingFields = [
    !legalName ? "razao_social_nome" : "",
    role !== "lessor" && !documentNumber ? "cnpj_cpf" : "",
  ].filter(Boolean)
  const warnings = missingFields.length > 0 ? [`Dados incompletos para ${role === "lessor" ? "locadora" : role === "lessee" ? "locataria" : "fiador"}.`] : []
  const confidence = Math.min(95, 35 + (legalName ? 28 : 0) + (documentNumber ? 24 : 0) + (address.address ? 8 : 0))

  return {
    role,
    legalName,
    documentNumber,
    address: address.address,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    representative,
    representativeDocument: extractRepresentativeDocument(segment),
    phone: contacts.phone,
    email: contacts.email,
    primaryContact: contacts.primaryContact,
    ...metadata({
      fileName,
      snippet: segment,
      confidence,
      warnings,
      missingFields,
      suggestedAction: role === "lessee" ? "Cadastrar cliente" : undefined,
      actionStatus: role === "lessee" ? "requires_review" : "preview",
    }),
  }
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

function extractContractClauseBlock(text: string, clauseNumber: number, maxLength = 2400) {
  const start = new RegExp(`CLAUSULA\\s*${clauseNumber}|CL.USULA\\s*${clauseNumber}`, "i")
  const end = new RegExp(`CLAUSULA\\s*${clauseNumber + 1}|CL.USULA\\s*${clauseNumber + 1}`, "i")
  return extractLabeledBlock(text, start, [end], maxLength)
}

function extractContractObjectBlock(text: string) {
  const clauseOne = extractContractClauseBlock(text, 1, 3600)
  if (clauseOne && /equipamento|monitor|ryzen|rtx|ssd|ram/i.test(clauseOne)) return clauseOne

  const blocks = [
    extractLabeledBlock(text, /DO OBJETO|OBJETO|DESCRICAO DOS BENS|DESCRI..O DOS BENS/i, [/DO PRAZO|CLAUSULA\s*2|CL.USULA\s*2|OBRIGACOES|OBRIGA..ES/i], 3200),
    extractLabeledBlock(text, /TABELA DE EQUIPAMENTOS|EQUIPAMENTOS LOCADOS|BENS LOCADOS|ANEXO.*EQUIPAMENTOS/i, [/TOTAL GERAL|CONDI..ES|DO PRAZO|CLAUSULA|CL.USULA/i], 3600),
    extractLabeledBlock(text, /PROPOSTA COMERCIAL/i, [/CONDI..ES|VALIDADE|ASSINATURA|CLAUSULA|CL.USULA/i], 3000),
  ].filter((block) => block.trim().length > 80)

  return blocks.join("\n")
}

function extractEquipmentFromContract(text: string) {
  const equipment: CosExtractedEquipment[] = []
  const objectBlock = extractContractObjectBlock(text)
  if (!objectBlock) return equipment

  const lines = objectBlock
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const normalized = normalizeLoose(line)
    const hasEquipmentSignal = EQUIPMENT_TERMS.some((term) => normalized.includes(normalizeLoose(term)))
    const tableMatch = line.match(/^\s*(\d{1,3})\s*(?:x|un|und|unid\.?|unidade|unidades|qtde|qtd)?\s*(?:\||-|–|—|:)\s*(.+)$/i)
    const quantityMatch = tableMatch ?? line.match(/(?:^|\s)(\d{1,3})\s*(?:x|un|und|unid\.?|unidade|unidades|qtde|qtd)?(?:\s+|$)/i)
    if (!hasEquipmentSignal || !quantityMatch) continue
    if (LEGAL_EQUIPMENT_EXCLUSION_TERMS.some((term) => normalized.includes(normalizeLoose(term)))) continue

    const quantity = Number(quantityMatch[1])
    const rawDescription = tableMatch?.[2] ?? line.replace(/^\d{1,3}\s*(?:x|un|und|unid\.?|unidade|unidades|qtde|qtd)?\s*/i, "")
    const moneyMatches = Array.from(line.matchAll(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}(?:\.\d{3})*,\d{2}/g)).map((match) =>
      parseBrazilianCurrency(match[0])
    )
    const unitValue = moneyMatches[0]
    const totalValue = moneyMatches[moneyMatches.length - 1]

    equipment.push({
      quantity,
      description: rawDescription.replace(/\s+/g, " ").replace(/[|;]+$/, "").trim(),
      configuration: firstMatch(line, [/(?:configura..o|config\.?)(?:\s*[:\-])?\s*([^|;\n]+)/i]),
      unitValue,
      totalValue,
      suggestedCategory: normalized.includes("monitor") ? "Monitor" : "Computador",
      suggestedStatus: "locado",
      suggestedClientLink: "Vincular a locataria extraida",
      contractLink: "Vincular ao contrato extraido",
      sourceSnippet: line,
      confidence: Math.min(92, 45 + (quantity ? 20 : 0) + (hasEquipmentSignal ? 20 : 0) + (moneyMatches.length > 0 ? 7 : 0)),
      confidenceLevel: confidenceLevel(Math.min(92, 45 + (quantity ? 20 : 0) + (hasEquipmentSignal ? 20 : 0) + (moneyMatches.length > 0 ? 7 : 0))),
      warnings: [],
      missingFields: [!quantity ? "quantidade" : "", !line ? "descricao" : ""].filter(Boolean),
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

function detectContractType(normalized: string) {
  if (normalized.includes("comodato")) return "Comodato"
  if (normalized.includes("manutencao")) return "Manutencao"
  if (normalized.includes("prestacao de servico") || normalized.includes("prestacao de servicos")) return "Prestacao de servico"
  if (normalized.includes("venda")) return "Venda"
  if (normalized.includes("locacao")) return "Locacao de equipamentos"
  if (normalized.includes("recorrente")) return "Contrato recorrente"
  if (normalized.includes("avulso")) return "Contrato avulso"
  return "Outro"
}

function analyzeContractTextV2(file: File, text: string): CosContractExtractionPreview {
  const normalized = normalizeLoose(text)
  const termBlock = extractContractClauseBlock(text, 2, 1800) || text
  const priceBlock = extractContractClauseBlock(text, 3, 2200) || text
  const lessorParty = buildExtractedParty(file.name, text, "lessor")
  const lesseeParty = buildExtractedParty(file.name, text, "lessee")
  const guarantorParty = buildExtractedParty(file.name, text, "guarantor")
  const locataria = extractLocatariaAccurate(text)
  const locadora = extractParty(text, "locadora")
  const locatariaAddress = extractAddressFromLocatariaBlock(locataria.segment || text)
  const signatureDate = parseDate(firstMatch(text, [/assinad[oa][\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i, /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/]))
  const probableStartDate =
    parseDate(firstMatch(text, [/inicio[\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i, /vigencia[\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i])) ??
    signatureDate
  const explicitEndDate = parseDate(firstMatch(text, [/termino[\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i, /data\s+final[\s\S]{0,120}?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i]))
  const termMonths = extractTermMonthsAccurate(termBlock)
  const calculatedEndDate = explicitEndDate ?? addMonths(probableStartDate, termMonths)
  const monthlyDueDay = Number(firstMatch(priceBlock, [/vencimento[\s\S]{0,120}?dia\s*(\d{1,2})/i, /todo\s+dia\s*(\d{1,2})/i, /dia\s*(\d{1,2})\s+de\s+cada\s+mes/i])) || undefined
  const monthlyValue = extractMonthlyContractValue(priceBlock)
  const depositValue = extractContractDepositValue(priceBlock)
  const totalValue = currencyNear(priceBlock, ["valor total", "total do contrato", "valor global"])
  const entryValue = currencyNear(priceBlock, ["entrada", "sinal"])
  const adjustmentIndex = firstMatch(text, [/(IGP-M|IPCA|INPC|IPC|SELIC)/i])
  const adjustmentRule = firstMatch(text, [/reajust[ea][\s\S]{0,160}?([^.\n]+)/i])
  const terminationFine = firstMatch(text, [/multa[\s\S]{0,180}?((?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}%|[0-9]+\s*%)/i])
  const interest = firstMatch(text, [/juros[\s\S]{0,120}?(\d{1,2}(?:,\d{1,2})?\s*%[^.\n]*)/i])
  const noticePeriod = firstMatch(text, [/aviso\s+previo[\s\S]{0,120}?(\d{1,3}\s*dias?)/i])
  const venue = firstMatch(text, [/foro[\s\S]{0,160}?comarca\s+de\s+([^,\n.]+)/i, /foro\s+de\s+([^,\n.]+)/i])
  const extractedEquipment = extractEquipmentFromContract(text)
  const lesseeName = lesseeParty?.legalName ?? locataria.company
  const lesseeDocument = lesseeParty?.documentNumber ?? locataria.cnpj
  const contractType = detectContractType(normalized)
  const contractMissingFields = [
    !lesseeName ? "cliente" : "",
    !monthlyValue ? "valor" : "",
    !termMonths && !calculatedEndDate ? "prazo_ou_datas" : "",
    !contractType ? "tipo" : "",
  ].filter(Boolean)
  const contractConfidenceScore = Math.min(
    96,
    35 +
      (lesseeName ? 16 : 0) +
      (monthlyValue ? 18 : 0) +
      (termMonths || calculatedEndDate ? 16 : 0) +
      (contractType !== "Outro" ? 12 : 0) +
      (lessorParty?.legalName ? 8 : 0)
  )
  const warnings = [
    !lesseeName ? "Nao identifiquei a razao social da locataria com alta confianca." : "",
    !lesseeDocument ? "Nao identifiquei CNPJ/CPF da locataria com alta confianca." : "",
    !monthlyValue ? "Nao identifiquei valor mensal com alta confianca." : "",
    !termMonths && !calculatedEndDate ? "Nao identifiquei prazo ou data final com alta confianca." : "",
    extractedEquipment.length === 0 ? "Nao identifiquei equipamentos estruturados em bloco proprio do contrato." : "",
  ].filter(Boolean)

  const extractedContract: CosExtractedContract = {
    title: firstMatch(text, [/^\s*([^\n]{0,90}contrato[^\n]{0,90})/i]),
    contractType,
    lessor: lessorParty?.legalName ?? locadora.company,
    lessee: lesseeName,
    signatureDate,
    probableStartDate,
    endDate: explicitEndDate,
    termMonths,
    validity: termMonths ? `${termMonths} meses` : calculatedEndDate ? `Ate ${calculatedEndDate}` : undefined,
    calculatedEndDate,
    monthlyDueDay,
    monthlyValue,
    totalValue,
    depositValue,
    entryValue,
    installments: termMonths,
    recurrence: monthlyValue ? "mensal" : undefined,
    adjustmentIndex,
    adjustmentRule,
    terminationFine,
    interest,
    noticePeriod,
    venue,
    suggestedStatus: "ativo",
    intelligentNotes: [
      !lessorParty?.legalName ? "Locadora precisa de revisao manual." : "",
      !lesseeDocument ? "Cliente sem documento confiavel; confirme antes de cadastrar." : "",
      extractedEquipment.length === 0 ? "Equipamentos nao foram capturados em bloco proprio." : "",
    ].filter(Boolean),
    confidence: contractConfidenceScore,
    confidenceLevel: confidenceLevel(contractConfidenceScore),
    warnings: contractMissingFields.length ? ["Campos criticos do contrato precisam de revisao."] : [],
    missingFields: contractMissingFields,
  }

  const extractedFinancialEntries: CosExtractedFinancialEntry[] = []
  if (monthlyValue) {
    extractedFinancialEntries.push({
      type: "receita",
      description: `Receita recorrente mensal${lesseeName ? ` - ${lesseeName}` : ""}`,
      value: monthlyValue,
      dueDay: monthlyDueDay,
      installments: termMonths,
      firstCompetence: probableStartDate,
      lastCompetence: calculatedEndDate,
      source: file.name,
    })
  }
  if (depositValue) {
    extractedFinancialEntries.push({
      type: "receita",
      description: `Caucao contratual${lesseeName ? ` - ${lesseeName}` : ""}`,
      value: depositValue,
      dueDay: monthlyDueDay,
      installments: 1,
      firstCompetence: probableStartDate,
      source: file.name,
    })
  }

  const previewWithoutConfidence = {
    sourceFile: file.name,
    extractedParties: {
      lessor: lessorParty,
      lessee: lesseeParty,
      guarantor: guarantorParty,
    },
    extractedClient: {
      legalName: lesseeName,
      documentNumber: lesseeDocument,
      address: lesseeParty?.address ?? locatariaAddress.address,
      city: lesseeParty?.city ?? locatariaAddress.city,
      state: lesseeParty?.state ?? locatariaAddress.state,
      postalCode: lesseeParty?.postalCode ?? locatariaAddress.postalCode,
      representative: lesseeParty?.representative ?? extractRepresentative(text),
      representativeDocument: lesseeParty?.representativeDocument,
      guarantor: guarantorParty?.legalName ?? extractGuarantor(text),
      phone: lesseeParty?.phone,
      email: lesseeParty?.email,
      primaryContact: lesseeParty?.primaryContact,
      confidence: lesseeParty?.confidence,
      confidenceLevel: lesseeParty?.confidenceLevel,
      warnings: lesseeParty?.warnings,
      missingFields: lesseeParty?.missingFields,
    },
    extractedContract,
    extractedEquipment,
    extractedFinancialEntries,
    extractedDocument: {
      fileName: file.name,
      type: file.type || "contrato",
      suggestedNotes: "Contrato analisado pelo COS. Anexar ao cliente e ao contrato apos revisao humana.",
    },
    warnings,
    textSample: text.slice(0, 1200),
  }

  console.info("[cos] Operational contract extraction", {
    fileName: file.name,
    lessor: lessorParty?.legalName,
    lessee: lesseeName,
    cnpjCpf: lesseeDocument,
    contractType,
    termMonths,
    calculatedEndDate,
    monthlyValue,
    depositValue,
    equipmentItems: extractedEquipment.length,
    confidence: contractConfidence(previewWithoutConfidence),
    warnings: warnings.length,
  })

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

function normalizedRowText(row: TabularRow) {
  return normalizeLoose(Object.values(row).map(cellText).join(" "))
}

function normalizeFinancialCell(value: unknown): number | string | null {
  const text = cellText(value)
  if (!text || text === "-") return null
  if (/^#DIV\/0!?$/i.test(text)) return "#DIV/0!"
  if (/%$/.test(text)) return text
  const normalized = text.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : text
}

function classifyDreRow(label: string) {
  const normalized = normalizeLoose(label)
  if (normalized.includes("receita")) return { rowKind: "receita", category: "Receitas" }
  if (normalized.includes("imposto")) return { rowKind: "impostos", category: "Impostos" }
  if (normalized.includes("pessoal") || normalized.includes("salario")) return { rowKind: "despesas_com_pessoal", category: "Despesas com pessoal" }
  if (normalized.includes("financeira") || normalized.includes("juros") || normalized.includes("tarifa")) return { rowKind: "despesas_financeiras", category: "Despesas financeiras" }
  if (normalized.includes("nao operacional")) return { rowKind: "despesas_nao_operacionais", category: "Despesas nao operacionais" }
  if (normalized.includes("despesa") || normalized.includes("custo")) return { rowKind: "despesas_operacionais", category: "Despesas operacionais" }
  if (normalized.includes("investimento")) return { rowKind: "investimentos", category: "Investimentos" }
  if (normalized.includes("distribuicao") || normalized.includes("lucro")) return { rowKind: "distribuicao_lucros", category: "Distribuicao de lucros" }
  if (normalized.includes("aporte")) return { rowKind: "aportes", category: "Aportes" }
  if (normalized.includes("saldo anterior")) return { rowKind: "saldo_anterior", category: "Saldo anterior" }
  if (normalized.includes("saldo banco")) return { rowKind: "saldo_banco", category: "Saldo banco" }
  if (normalized.includes("diferenca")) return { rowKind: "diferenca", category: "Diferencas" }
  if (normalized.includes("resultado operacional")) return { rowKind: "resultado_operacional", category: "Resultado operacional" }
  return { rowKind: "linha_financeira", category: undefined }
}

function buildDreRows(rows: WorkbookRows[]) {
  const dreRows: CosDreRow[] = []
  const bankBalances: TabularRow[] = []

  for (const sheet of rows) {
    const probableFinancial = Boolean(sheet.sourceType) || sheet.columns.some(isMonthLike)
    if (!probableFinancial) continue

    for (const row of sheet.rows) {
      if (dreRows.length >= 120) break
      const label =
        textValue(row, ["descricao", "description", "categoria", "category", "cliente", "fornecedor"]) ||
        cellText(row[sheet.columns[0]])
      if (!label || label.length > 120) continue

      const values: Record<string, number | string | null> = {}
      let numericCount = 0
      for (const column of sheet.columns) {
        const normalizedValue = normalizeFinancialCell(row[column])
        if (typeof normalizedValue === "number") numericCount += 1
        if (isMonthLike(column) || isTotalLike(column) || isValueLike(column) || normalizedValue !== null) {
          values[column] = normalizedValue
        }
      }
      if (numericCount === 0) continue

      const classification = classifyDreRow(label)
      const numericValues = Object.values(values).filter((value): value is number => typeof value === "number")
      const total = numericValues.length ? numericValues[numericValues.length - 1] : undefined
      const sourceRow = Number(row._rowNumber)
      const dreRow: CosDreRow = {
        label,
        rowKind: classification.rowKind,
        category: classification.category,
        values,
        total,
        sourceSheet: sheet.sheetName,
        sourceRow: Number.isFinite(sourceRow) ? sourceRow : undefined,
        ...metadata({
          fileName: sheet.fileName,
          snippet: Object.values(row).map(cellText).filter(Boolean).join(" | "),
          confidence: Math.min(92, 45 + Math.min(numericCount, 8) * 5 + (classification.category ? 10 : 0)),
          warnings: Object.values(values).includes("#DIV/0!") ? ["Linha contem erro #DIV/0!."] : [],
          missingFields: [],
          suggestedAction: "Ver detalhes",
          actionStatus: "preview",
        }),
      }
      dreRows.push(dreRow)
      if (classification.rowKind === "saldo_banco" || classification.rowKind === "saldo_anterior") {
        bankBalances.push({ label, total, source: `${sheet.fileName} / ${sheet.sheetName}` })
      }
    }
  }

  return { dreRows, bankBalances }
}

function buildDiagnostics(args: {
  dreRows: CosDreRow[]
  financialEntries: TabularRow[]
  bankBalances: TabularRow[]
  sourceFileName?: string
}) {
  const diagnostics: CosDiagnostic[] = []
  const revenueTotal = args.dreRows
    .filter((row) => row.rowKind === "receita")
    .reduce((total, row) => total + (typeof row.total === "number" ? row.total : 0), 0)
  const expenseTotal = args.dreRows
    .filter((row) => row.rowKind.includes("despesa") || row.rowKind === "impostos" || row.rowKind === "investimentos")
    .reduce((total, row) => total + Math.abs(typeof row.total === "number" ? row.total : 0), 0)
  const previewRevenue = args.financialEntries
    .filter((entry) => normalizeLoose(entry.type).includes("receita"))
    .reduce((total, entry) => total + (typeof entry.value === "number" ? entry.value : 0), 0)

  if (revenueTotal && previewRevenue && Math.abs(revenueTotal - previewRevenue) > 1) {
    diagnostics.push({
      type: "dre_vs_financial_preview",
      title: "Divergencia entre DRE e lancamentos extraidos",
      description: `Identifiquei receita total na DRE de ${revenueTotal.toFixed(2)}, enquanto os lancamentos financeiros extraidos somam ${previewRevenue.toFixed(2)}.`,
      severity: "warning",
      suggestedActions: ["Ver detalhes", "Gerar ajuste sugerido", "Ignorar"],
      ...metadata({
        fileName: args.sourceFileName,
        confidence: 78,
        warnings: [],
        missingFields: ["financeiro_do_sistema_real"],
        suggestedAction: "Ver detalhes",
        actionStatus: "preview",
      }),
    })
  }

  if (args.bankBalances.length > 0 && args.dreRows.some((row) => row.rowKind === "diferenca")) {
    diagnostics.push({
      type: "bank_balance_difference",
      title: "Possivel diferenca entre saldo banco e saldo operacional",
      description: "O arquivo contem linhas de saldo bancario e diferenca. Nesta etapa o COS apenas sinaliza para conferencia.",
      severity: "warning",
      suggestedActions: ["Ver detalhes", "Gerar ajuste sugerido", "Ignorar"],
      ...metadata({
        fileName: args.sourceFileName,
        confidence: 72,
        warnings: [],
        missingFields: ["saldo_operacional_do_sistema"],
        suggestedAction: "Ver detalhes",
        actionStatus: "preview",
      }),
    })
  }

  if (revenueTotal || expenseTotal) {
    diagnostics.push({
      type: "financial_structure_detected",
      title: "Estrutura financeira detectada",
      description: `Identifiquei receitas, despesas, totais ou subtotais para analise operacional. Receita lida: ${revenueTotal.toFixed(2)}; despesas lidas: ${expenseTotal.toFixed(2)}.`,
      severity: "info",
      suggestedActions: ["Salvar como analise", "Criar categorias DRE", "Criar lancamentos sugeridos"],
      ...metadata({
        fileName: args.sourceFileName,
        confidence: 80,
        warnings: [],
        missingFields: [],
        suggestedAction: "Salvar como analise",
        actionStatus: "next_step",
      }),
    })
  }

  return diagnostics
}

function normalizedSourceTypeFromLabel(label?: string): CosNormalizedExtraction["sourceType"] {
  const normalized = normalizeLoose(label)
  if (normalized.includes("granatum")) return "granatum"
  if (normalized.includes("extrato")) return "bank_statement"
  if (normalized.includes("dre") || normalized.includes("demonstrativo")) return "dre"
  if (normalized.includes("fluxo") || normalized.includes("financeiro") || normalized.includes("contas")) return "financial_report"
  return "spreadsheet"
}

function contractLogicalStructure(text: string): CosLogicalSection[] {
  const objectBlock = extractContractObjectBlock(text)
  return [
    makeSection("Partes", "Identifica locadora, locataria e fiador", undefined, [
      makeSection("Locadora", "Empresa que cede ou presta a locacao", extractPartyBlock(text, "lessor")),
      makeSection("Locataria", "Cliente que contrata a locacao ou servico", extractPartyBlock(text, "lessee")),
      makeSection("Fiador", "Garantidor da operacao, quando existir", extractPartyBlock(text, "guarantor")),
    ]),
    makeSection("Objeto", "Define o que esta sendo contratado", objectBlock),
    makeSection("Prazo", "Define inicio, final e vigencia", extractLabeledBlock(text, /PRAZO|VIGENCIA/i, [/PRECO|VALOR|PAGAMENTO|MULTA|FORO|CLAUSULA|CL.USULA/i], 1400)),
    makeSection("Preco", "Define valor, vencimento, recorrencia e caucao", extractLabeledBlock(text, /PRECO|VALOR|PAGAMENTO|ALUGUEL|CAUCAO|CAU..O/i, [/MULTA|RESCISAO|FORO|ASSINATURA|CLAUSULA|CL.USULA/i], 1600)),
    makeSection("Garantias", "Define caucao, fiador ou garantias", extractLabeledBlock(text, /GARANTIA|CAUCAO|CAU..O|FIADOR/i, [/MULTA|FORO|ASSINATURA|CLAUSULA|CL.USULA/i], 1200)),
    makeSection("Multas", "Define multa, juros e aviso previo", extractLabeledBlock(text, /MULTA|JUROS|AVISO/i, [/FORO|ASSINATURA|CLAUSULA|CL.USULA/i], 1200)),
    makeSection("Foro", "Define comarca e jurisdicao", extractLabeledBlock(text, /FORO/i, [/ASSINATURA|TESTEMUNHA|CLAUSULA|CL.USULA/i], 900)),
    makeSection("Assinaturas", "Confirma fechamento formal do documento", extractLabeledBlock(text, /ASSINATURA|TESTEMUNHA/i, [/$^/], 900)),
  ]
}

function contractBusinessEntities(file: File, extraction: CosContractExtractionPreview) {
  const entities: CosBusinessEntity[] = []
  const client = extraction.extractedClient
  const contract = extraction.extractedContract

  if (client?.legalName || client?.documentNumber) {
    entities.push(
      makeBusinessEntity({
        entityType: "Cliente",
        label: client.legalName || client.documentNumber || "Cliente identificado",
        relationship: "Locataria do contrato",
        values: client,
        fileName: file.name,
        confidence: client.confidence ?? (client.legalName && client.documentNumber ? 82 : 48),
        warnings: client.warnings,
        missingFields: client.missingFields,
        suggestedAction: "Cadastrar cliente",
        actionStatus: "requires_review",
      })
    )
  }

  if (contract) {
    entities.push(
      makeBusinessEntity({
        entityType: "Contrato",
        label: contract.title || contract.contractType || "Contrato identificado",
        relationship: client?.legalName ? `Contrato vinculado ao cliente ${client.legalName}` : "Contrato sem cliente confirmado",
        values: contract,
        fileName: file.name,
        confidence: contract.confidence ?? extraction.confidence,
        warnings: contract.warnings,
        missingFields: contract.missingFields,
        suggestedAction: "Cadastrar contrato",
        actionStatus: "next_step",
      })
    )
  }

  extraction.extractedEquipment.slice(0, 12).forEach((item) => {
    entities.push(
      makeBusinessEntity({
        entityType: "Equipamento",
        label: item.description,
        relationship: client?.legalName ? `Equipamento locado para ${client.legalName}` : "Equipamento vinculado ao contrato",
        values: item,
        fileName: file.name,
        snippet: item.sourceSnippet,
        confidence: item.confidence ?? 60,
        warnings: item.warnings,
        missingFields: item.missingFields,
        suggestedAction: "Cadastrar equipamentos",
        actionStatus: "next_step",
      })
    )
  })

  extraction.extractedFinancialEntries.forEach((entry) => {
    entities.push(
      makeBusinessEntity({
        entityType: "Financeiro",
        label: entry.description,
        relationship: client?.legalName ? `Receita vinculada ao cliente ${client.legalName}` : "Receita vinculada ao contrato",
        values: entry,
        fileName: file.name,
        confidence: entry.value && (entry.firstCompetence || entry.dueDay) ? 78 : 52,
        missingFields: [!entry.value ? "valor" : "", !entry.firstCompetence && !entry.dueDay ? "competencia_ou_vencimento" : ""].filter(Boolean),
        suggestedAction: "Criar lancamento financeiro",
        actionStatus: "requires_review",
      })
    )
  })

  entities.push(
    makeBusinessEntity({
      entityType: "Documento",
      label: extraction.extractedDocument.fileName,
      relationship: "Documento suporte do cliente e do contrato",
      values: extraction.extractedDocument,
      fileName: file.name,
      confidence: extraction.confidence,
      missingFields: [],
      suggestedAction: "Anexar documento",
      actionStatus: "requires_review",
    })
  )

  return entities
}

function contractOperationalIntelligence(file: File, extraction: CosContractExtractionPreview, text: string): CosOperationalIntelligence {
  const classification = classifyDocumentText(text, "contract")
  const entities = contractBusinessEntities(file, extraction)
  const contract = extraction.extractedContract
  const client = extraction.extractedClient
  const foundData = [
    contract?.contractType ? `Tipo: ${contract.contractType}` : "",
    client?.legalName ? `Cliente/locataria: ${client.legalName}` : "",
    contract?.monthlyValue ? `Receita mensal: ${contract.monthlyValue}` : "",
    contract?.termMonths ? `Prazo: ${contract.termMonths} meses` : "",
    extraction.extractedEquipment.length ? `${extraction.extractedEquipment.length} equipamento(s) identificado(s)` : "",
  ].filter(Boolean)
  const missingData = uniqueText([
    ...(client?.missingFields ?? []),
    ...(contract?.missingFields ?? []),
    extraction.extractedEquipment.length === 0 ? "equipamentos_estruturados" : undefined,
  ])
  const possibleProblems = [
    !client?.documentNumber ? "Cliente sem CNPJ/CPF confiavel." : "",
    !contract?.termMonths && !contract?.endDate && !contract?.calculatedEndDate ? "Contrato sem prazo ou data final confiavel." : "",
    extraction.extractedEquipment.some((item) => !item.quantity) ? "Existe equipamento sem quantidade." : "",
  ].filter(Boolean)
  const possibleDivergences = [
    extraction.extractedParties?.lessor?.documentNumber && client?.documentNumber && extraction.extractedParties.lessor.documentNumber === client.documentNumber
      ? "Locadora e locataria parecem compartilhar o mesmo documento. Revisar papeis das partes."
      : "",
    contract?.monthlyValue && extraction.extractedFinancialEntries.length === 0 ? "Valor mensal detectado sem receita sugerida correspondente." : "",
    extraction.extractedEquipment.length === 0 ? "Contrato detectado sem equipamentos estruturados." : "",
  ].filter(Boolean)

  return buildOperationalIntelligence({
    documentType: classification.documentType,
    classificationReason: classification.reason,
    logicalStructure: contractLogicalStructure(text),
    businessEntities: entities,
    foundData,
    missingData,
    possibleProblems,
    possibleDivergences,
    nextActions: ["Revisar partes", "Cadastrar cliente", "Anexar documento", "Preparar contrato/equipamentos para etapa futura"],
    executiveSummary:
      contract?.monthlyValue && contract?.termMonths
        ? `Identifiquei ${contract.contractType ?? "contrato"} com vigencia de ${contract.termMonths} meses e receita mensal de ${contract.monthlyValue}.`
        : `Identifiquei ${contract?.contractType ?? "contrato"} e separei as entidades operacionais para revisao.`,
  })
}

function financialLogicalStructure(dreRows: CosDreRow[], bankBalances: TabularRow[], detectedType?: string): CosLogicalSection[] {
  const rowsByKind = (kind: string) => dreRows.filter((row) => row.rowKind.includes(kind))
  return [
    makeSection("Classificacao financeira", detectedType || "Documento financeiro"),
    makeSection("Receitas", "Clientes, contratos ou entradas operacionais", rowsByKind("receita").map((row) => row.sourceSnippet).join("\n")),
    makeSection("Custos e despesas", "Custos, impostos, pessoal, operacionais e financeiros", dreRows.filter((row) => row.rowKind.includes("despesa") || row.rowKind === "impostos").map((row) => row.sourceSnippet).join("\n")),
    makeSection("Resultado", "Resultado operacional, lucro e diferencas", dreRows.filter((row) => row.rowKind.includes("resultado") || row.rowKind.includes("lucro") || row.rowKind === "diferenca").map((row) => row.sourceSnippet).join("\n")),
    makeSection("Saldos", "Saldo anterior, banco e fechamento", bankBalances.map((row) => Object.values(row).join(" | ")).join("\n")),
  ]
}

function possibleClientRevenueRows(dreRows: CosDreRow[]) {
  return dreRows.filter((row) => {
    const normalized = normalizeLoose(row.label)
    return row.rowKind === "receita" && !normalized.includes("total") && !normalized.includes("receita bruta") && !normalized.includes("receita liquida")
  })
}

function financialBusinessEntities(args: {
  fileName: string
  dreRows: CosDreRow[]
  financialEntries: TabularRow[]
  categories: string[]
  bankBalances: TabularRow[]
}) {
  const entities: CosBusinessEntity[] = []

  possibleClientRevenueRows(args.dreRows).slice(0, 20).forEach((row) => {
    entities.push(
      makeBusinessEntity({
        entityType: "Cliente",
        label: row.label,
        relationship: "Cliente com receita identificada na DRE/relatorio",
        values: { value: row.total, category: row.category, sourceRow: row.sourceRow },
        fileName: args.fileName,
        snippet: row.sourceSnippet,
        confidence: row.confidence - (row.total ? 0 : 20),
        missingFields: [!row.total ? "valor" : "", "contrato_correspondente"].filter(Boolean),
        suggestedAction: "Ver detalhes",
        actionStatus: "preview",
      })
    )
  })

  args.financialEntries.slice(0, 30).forEach((entry) => {
    const missingFields = [
      !entry.value ? "valor" : "",
      !entry.description ? "descricao" : "",
      !entry.competence_date && !entry.due_date ? "competencia_ou_vencimento" : "",
    ].filter(Boolean)
    entities.push(
      makeBusinessEntity({
        entityType: "Financeiro",
        label: String(entry.description ?? "Lancamento financeiro sugerido"),
        relationship: "Receita ou despesa extraida para conferencia",
        values: entry,
        fileName: args.fileName,
        confidence: Math.max(35, 82 - missingFields.length * 14),
        missingFields,
        suggestedAction: "Criar lancamento financeiro",
        actionStatus: "requires_review",
      })
    )
  })

  args.categories.forEach((category) => {
    entities.push(
      makeBusinessEntity({
        entityType: "DRE",
        label: category,
        relationship: "Categoria gerencial detectada",
        values: { category },
        fileName: args.fileName,
        confidence: 76,
        suggestedAction: "Criar categorias DRE",
        actionStatus: "next_step",
      })
    )
  })

  args.bankBalances.forEach((balance) => {
    entities.push(
      makeBusinessEntity({
        entityType: "Banco",
        label: String(balance.label ?? "Saldo bancario"),
        relationship: "Saldo usado para conciliacao operacional",
        values: balance,
        fileName: args.fileName,
        confidence: 72,
        suggestedAction: "Ver detalhes",
        actionStatus: "preview",
      })
    )
  })

  if (args.dreRows.length > 0) {
    entities.push(
      makeBusinessEntity({
        entityType: "DRE",
        label: "Analise DRE / gerencial",
        relationship: "Documento financeiro estruturado para auditoria operacional",
        values: { rows: args.dreRows.length },
        fileName: args.fileName,
        confidence: 80,
        suggestedAction: "Salvar como analise",
        actionStatus: "next_step",
      })
    )
  }

  return entities
}

function financialOperationalIntelligence(args: {
  fileName: string
  detectedType?: string
  documentType: CosDocumentType
  classificationReason: string
  dreRows: CosDreRow[]
  financialEntries: TabularRow[]
  categories: string[]
  bankBalances: TabularRow[]
  diagnostics: CosDiagnostic[]
}) {
  const entities = financialBusinessEntities(args)
  const revenueRows = args.dreRows.filter((row) => row.rowKind === "receita")
  const expenseRows = args.dreRows.filter((row) => row.rowKind.includes("despesa") || row.rowKind === "impostos")
  const foundData = [
    args.detectedType ? `Tipo: ${args.detectedType}` : "",
    revenueRows.length ? `${revenueRows.length} linha(s) de receita` : "",
    expenseRows.length ? `${expenseRows.length} linha(s) de custos/despesas` : "",
    args.categories.length ? `${args.categories.length} categoria(s)` : "",
    args.bankBalances.length ? `${args.bankBalances.length} saldo(s) bancario(s)` : "",
  ].filter(Boolean)
  const missingData = uniqueText([
    args.financialEntries.some((entry) => !entry.competence_date && !entry.due_date) ? "competencia_ou_vencimento_em_lancamentos" : undefined,
    possibleClientRevenueRows(args.dreRows).length ? "contratos_correspondentes_as_receitas" : undefined,
    args.bankBalances.length ? "saldo_operacional_do_sistema_para_conciliacao" : undefined,
  ])
  const possibleProblems = [
    args.dreRows.some((row) => row.warnings.length > 0) ? "Existem linhas com erro ou valor nao normalizado." : "",
    args.financialEntries.some((entry) => !entry.value) ? "Existem lancamentos sugeridos sem valor confiavel." : "",
  ].filter(Boolean)

  return buildOperationalIntelligence({
    documentType: args.documentType,
    classificationReason: args.classificationReason,
    logicalStructure: financialLogicalStructure(args.dreRows, args.bankBalances, args.detectedType),
    businessEntities: entities,
    foundData,
    missingData,
    possibleProblems,
    possibleDivergences: args.diagnostics.map((diagnostic) => diagnostic.description),
    nextActions: ["Ver detalhes", "Salvar como analise", "Criar categorias DRE", "Criar lancamentos sugeridos"],
    executiveSummary:
      revenueRows.length || expenseRows.length
        ? `Identifiquei estrutura financeira operacional com ${revenueRows.length} linha(s) de receita e ${expenseRows.length} linha(s) de custos/despesas.`
        : "Identifiquei documento financeiro para leitura operacional e conferencia manual.",
  })
}

function normalizeContractExtraction(file: File, extraction: CosContractExtractionPreview, fullText = extraction.textSample): CosNormalizedExtraction {
  const intelligence = contractOperationalIntelligence(file, extraction, fullText)
  return {
    sourceType: "contract",
    confidence: extraction.confidence,
    confidenceLevel: confidenceLevel(extraction.confidence),
    documentType: intelligence.documentType,
    operationalIntelligence: intelligence,
    sourceFile: { name: file.name, type: file.type || "contrato", size: file.size },
    extractedParties: extraction.extractedParties ?? {},
    extractedClient: extraction.extractedClient,
    extractedContract: extraction.extractedContract,
    extractedEquipment: extraction.extractedEquipment,
    extractedFinancialEntries: extraction.extractedFinancialEntries,
    extractedCategories: [],
    extractedBankBalances: [],
    extractedDreRows: [],
    diagnostics: [],
    warnings: extraction.warnings,
    suggestedActions: [
      "Cadastrar cliente",
      "Cadastrar contrato",
      "Cadastrar equipamentos",
      "Criar lancamento financeiro",
      "Anexar documento ao cliente",
      "Anexar documento ao contrato",
    ],
  }
}

function normalizeFinancialOcrExtraction(file: File, preview: CosFinancialOcrPreview): CosNormalizedExtraction {
  const sourceType = normalizedSourceTypeFromLabel(preview.detectedType) === "spreadsheet" ? "image" : normalizedSourceTypeFromLabel(preview.detectedType)
  const documentType = sourceType === "bank_statement" ? "bank_statement" : sourceType === "dre" ? "dre" : sourceType === "granatum" ? "financial_report" : "print"
  const intelligence = financialOperationalIntelligence({
    fileName: file.name,
    detectedType: preview.detectedType,
    documentType,
    classificationReason: preview.detectedType,
    dreRows: preview.extractedDreRows,
    financialEntries: preview.extractedFinancialEntries,
    categories: preview.extractedCategories,
    bankBalances: [],
    diagnostics: preview.diagnostics,
  })
  return {
    sourceType,
    confidence: preview.confidence,
    confidenceLevel: confidenceLevel(preview.confidence),
    documentType,
    operationalIntelligence: intelligence,
    sourceFile: { name: file.name, type: file.type || "imagem/documento financeiro", size: file.size },
    extractedParties: {},
    extractedEquipment: [],
    extractedFinancialEntries: preview.extractedFinancialEntries,
    extractedCategories: preview.extractedCategories,
    extractedBankBalances: [],
    extractedDreRows: preview.extractedDreRows,
    diagnostics: preview.diagnostics,
    warnings: preview.extractedWarnings,
    suggestedActions: ["Salvar como analise", "Criar categorias DRE", "Criar lancamentos sugeridos", "Anexar documento"],
  }
}

function normalizeSpreadsheetExtraction(file: File, workbookRows: WorkbookRows[], financialEntries: TabularRow[], clients: TabularRow[], equipment: TabularRow[]) {
  const { dreRows, bankBalances } = buildDreRows(workbookRows)
  const diagnostics = buildDiagnostics({
    dreRows,
    financialEntries,
    bankBalances,
    sourceFileName: file.name,
  })
  const probableType = workbookRows.map((row) => row.sourceType).find(Boolean)
  const confidence = Math.min(94, 45 + (dreRows.length ? 20 : 0) + (financialEntries.length ? 12 : 0) + (clients.length ? 8 : 0) + (bankBalances.length ? 8 : 0))
  const sourceType = normalizedSourceTypeFromLabel(probableType)
  const documentType: CosDocumentType = sourceType === "dre" ? "dre" : sourceType === "bank_statement" ? "bank_statement" : sourceType === "financial_report" ? "financial_report" : "operational_spreadsheet"
  const intelligence = financialOperationalIntelligence({
    fileName: file.name,
    detectedType: probableType,
    documentType,
    classificationReason: probableType || "estrutura tabular operacional",
    dreRows,
    financialEntries,
    categories: uniqueText(dreRows.map((row) => row.category)),
    bankBalances,
    diagnostics,
  })

  return {
    sourceType,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    documentType,
    operationalIntelligence: intelligence,
    sourceFile: { name: file.name, type: file.type || "planilha", size: file.size },
    extractedParties: {},
    extractedEquipment: equipment,
    extractedFinancialEntries: financialEntries,
    extractedCategories: uniqueText(dreRows.map((row) => row.category)),
    extractedBankBalances: bankBalances,
    extractedDreRows: dreRows,
    diagnostics,
    warnings: diagnostics.filter((diagnostic) => diagnostic.severity !== "info").map((diagnostic) => diagnostic.description),
    suggestedActions: ["Salvar como analise", "Criar categorias DRE", "Criar lancamentos sugeridos"],
  } satisfies CosNormalizedExtraction
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
  const dreRows: CosDreRow[] = []
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
      rowKind: classifyDreRow(description || line).rowKind,
      confidence: Math.min(90, 48 + Math.min(values.length, 6) * 5 + (classification.category ? 12 : 0)),
      warnings: /#DIV\/0!/i.test(line) ? ["Linha contem erro #DIV/0!."] : [],
    }
    const rowClassification = classifyDreRow(item.description)
    dreRows.push({
      label: item.description,
      rowKind: rowClassification.rowKind,
      category: rowClassification.category ?? item.category,
      values: Object.fromEntries(values.map((value, valueIndex) => [columns[valueIndex] ?? `valor_${valueIndex + 1}`, value])),
      total: values[values.length - 1],
      ...metadata({
        snippet: line,
        confidence: item.confidence ?? 55,
        warnings: item.warnings,
        missingFields: [],
        suggestedAction: "Ver detalhes",
        actionStatus: "preview",
      }),
    })

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

  return { revenue, expenses, entries, dreRows }
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
    extractedDreRows: rows.dreRows.slice(0, 60).map((row) => ({
      ...row,
      sourceFileName: file.name,
    })),
    diagnostics: buildDiagnostics({
      dreRows: rows.dreRows,
      financialEntries: rows.entries,
      bankBalances: [],
      sourceFileName: file.name,
    }),
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

export function analyzeCosContractTextForValidation(fileName: string, text: string) {
  return analyzeContractTextV2({ name: fileName, type: "text/plain", size: text.length } as File, normalizeDocumentText(text))
}

export async function analyzeCosFiles(files: File[]) {
  const allRows: WorkbookRows[] = []
  const filePreviews: CosFilePreview[] = []
  const contractExtractions: CosContractExtractionPreview[] = []
  const financialOcrAnalyses: CosFinancialOcrPreview[] = []
  const normalizedExtractions: CosNormalizedExtraction[] = []
  const warnings: string[] = []

  for (const file of files) {
    if (supportedSpreadsheet(file)) {
      try {
        const result = await analyzeSpreadsheet(file)
        const fileFinancialEntries = buildFinancialPreview(result.rows)
        const fileClients = buildClientPreview(result.rows)
        const fileEquipment = buildEquipmentPreview(result.rows)
        allRows.push(...result.rows)
        normalizedExtractions.push(normalizeSpreadsheetExtraction(file, result.rows, fileFinancialEntries, fileClients, fileEquipment))
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
        const contractExtraction = analyzeContractTextV2(file, extractedText)
        const isContract = looksLikeContract(extractedText)
        const financialOcrCandidate =
          !isContract && extractedText.trim()
            ? analyzeFinancialOcrText(file, extractedText)
            : undefined
        const financialOcr =
          financialOcrCandidate && financialOcrCandidate.confidence >= 40 ? financialOcrCandidate : undefined

        if (isContract || contractExtraction.confidence >= 35) {
          contractExtractions.push(contractExtraction)
          normalizedExtractions.push(normalizeContractExtraction(file, contractExtraction, extractedText))
        }
        if (financialOcr) {
          financialOcrAnalyses.push(financialOcr)
          normalizedExtractions.push(normalizeFinancialOcrExtraction(file, financialOcr))
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
        normalizedExtractions.push(normalizeFinancialOcrExtraction(file, financialOcr))
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
    normalizedExtractions,
    diagnostics: normalizedExtractions.flatMap((extraction) => extraction.diagnostics),
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
