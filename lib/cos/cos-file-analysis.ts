import * as XLSX from "xlsx"

type TabularRow = Record<string, unknown>

export type CosFileSheetPreview = {
  name: string
  rowCount: number
  columns: string[]
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
}

const MAX_PREVIEW_ROWS = 50

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
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
    const sheetRows = XLSX.utils.sheet_to_json<TabularRow>(worksheet, { defval: "" })
    const columns = Array.from(new Set(sheetRows.flatMap((row) => Object.keys(row)))).slice(0, 30)

    rows.push({ fileName, sheetName, rows: sheetRows })
    sheets.push({
      name: sheetName,
      rowCount: sheetRows.length,
      columns,
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
  const answer = [
    `Analisei ${filePreviews.length} arquivo(s) e encontrei ${sheetCount} aba(s) tabulares.`,
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
