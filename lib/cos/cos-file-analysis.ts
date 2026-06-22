import * as XLSX from "xlsx"

type TabularRow = Record<string, unknown>

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
}

export type CosFileAnalysisPreview = {
  kind: "file_analysis"
  files: CosFilePreview[]
  financialEntries: TabularRow[]
  clients: TabularRow[]
  equipment: TabularRow[]
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

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
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

export async function analyzeCosFiles(files: File[]) {
  const allRows: WorkbookRows[] = []
  const filePreviews: CosFilePreview[] = []
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

    if (imageFile(file)) {
      filePreviews.push({
        name: file.name,
        type: file.type || "imagem",
        size: file.size,
        sheets: [],
        notes: [
          "Leitura automatica de imagem ainda depende da integracao OCR. Posso anexar o arquivo e voce pode complementar os dados manualmente.",
        ],
      })
      continue
    }

    if (pdfFile(file)) {
      filePreviews.push({
        name: file.name,
        type: file.type || "PDF",
        size: file.size,
        sheets: [],
        notes: [
          "PDF recebido. A extracao automatica de texto depende de integracao de parser/OCR nesta etapa do COS.",
        ],
      })
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
