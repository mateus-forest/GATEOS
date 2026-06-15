export type DreImportRow = {
  account: string
  groupName: string
  rowIndex: number
  rowType: "group" | "account" | "total" | "percent" | "result" | "balance" | "structural_blank"
  type: "receita" | "despesa" | "neutro"
  values: Record<number, number>
  total: number | null
  rawLabel: string
  rawData?: unknown
}

export type DreImportMode = "operational" | "history"

export type DreImportPreview = {
  fileName: string
  sheetName: string
  importMode: DreImportMode
  rows: DreImportRow[]
  ignoredRows: Array<{ rowIndex: number; reason: string }>
  monthNumbers: number[]
  totalRowsRead: number
  genericHistory: boolean
}

export type DreWorkbookSheet = {
  name: string
}

const monthLabels = new Map([
  ["jan", 1],
  ["janeiro", 1],
  ["fev", 2],
  ["fevereiro", 2],
  ["mar", 3],
  ["marco", 3],
  ["marco", 3],
  ["abr", 4],
  ["abril", 4],
  ["mai", 5],
  ["maio", 5],
  ["jun", 6],
  ["junho", 6],
  ["jul", 7],
  ["julho", 7],
  ["ago", 8],
  ["agosto", 8],
  ["set", 9],
  ["setembro", 9],
  ["out", 10],
  ["outubro", 10],
  ["nov", 11],
  ["novembro", 11],
  ["dez", 12],
  ["dezembro", 12],
])

const accountHeaderCandidates = new Set(["conta", "categoria", "descricao", "item"])

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

function normalizeKey(value: unknown) {
  return normalizeText(value).toLowerCase()
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0

  const text = String(value ?? "")
    .trim()
    .replace(/\*/g, "")
    .replace(/#DIV\/0!/gi, "")
    .replace(/[R$\s]/g, "")
    .replace(/%/g, "")
    .replace(/\./g, "")
    .replace(",", ".")

  if (!text || text === "-") return 0
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseExcelDateNumber(value: number) {
  if (value < 20000 || value > 60000) return null
  const epoch = new Date(Date.UTC(1899, 11, 30))
  epoch.setUTCDate(epoch.getUTCDate() + value)
  return epoch.getUTCMonth() + 1
}

function parseCsv(text: string) {
  const delimiter = text.includes(";") ? ";" : ","
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")))
}

function hasRowContent(row: unknown[]) {
  return row.some((cell) => normalizeText(cell) !== "")
}

function rawCellValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  return value ?? ""
}

function buildRawData(row: unknown[], rowIndex: number, header?: unknown[]) {
  return {
    rowIndex,
    cells: row.map((cell, columnIndex) => ({
      columnIndex,
      header: normalizeText(header?.[columnIndex] ?? (columnIndex === 0 ? "Conta" : `Coluna ${columnIndex + 1}`)),
      value: rawCellValue(cell),
    })),
  }
}

async function readWorkbook(file: File) {
  const XLSX = await import("xlsx")
  const buffer = await file.arrayBuffer()
  return XLSX.read(buffer, { type: "array", cellDates: true })
}

async function parseWorkbook(file: File, sheetName?: string) {
  const XLSX = await import("xlsx")
  const workbook = await readWorkbook(file)
  const selectedSheetName = sheetName && workbook.Sheets[sheetName] ? sheetName : workbook.SheetNames[0]
  const sheet = workbook.Sheets[selectedSheetName]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })
}

export async function getDreWorkbookSheets(file: File): Promise<DreWorkbookSheet[]> {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension === "csv") return [{ name: "CSV" }]

  const workbook = await readWorkbook(file)
  return workbook.SheetNames.map((name) => ({ name }))
}

function detectMonth(cell: unknown) {
  if (cell instanceof Date && !Number.isNaN(cell.getTime())) return cell.getMonth() + 1
  if (typeof cell === "number") return parseExcelDateNumber(cell)

  const normalized = normalizeKey(cell)
  if (!normalized || normalized === "total") return null

  const numericMonthYear = normalized.match(/^(\d{1,2})[/-](\d{2,4})$/)
  if (numericMonthYear) {
    const month = Number(numericMonthYear[1])
    return month >= 1 && month <= 12 ? month : null
  }

  const yearMonth = normalized.match(/^(\d{4})[-/](\d{1,2})$/)
  if (yearMonth) {
    const month = Number(yearMonth[2])
    return month >= 1 && month <= 12 ? month : null
  }

  const token = normalized
    .replace(/[._]/g, "-")
    .split(/[-/ ]/)
    .find(Boolean)

  if (!token) return null
  return monthLabels.get(token) ?? null
}

function detectHeader(matrix: unknown[][]) {
  const candidates = matrix
    .slice(0, 20)
    .map((row, index) => {
      const monthColumns = row
        .map((cell, cellIndex) => {
          const month = detectMonth(cell)
          return month ? { index: cellIndex, month } : null
        })
        .filter(Boolean) as Array<{ index: number; month: number }>

      return { index, monthColumns }
    })
    .filter((candidate) => candidate.monthColumns.length >= 3)
    .sort((a, b) => b.monthColumns.length - a.monthColumns.length)

  return candidates[0] ?? null
}

function detectAccountColumn(header: unknown[], monthColumns: Array<{ index: number; month: number }>) {
  const firstMonthIndex = Math.min(...monthColumns.map((column) => column.index))
  const explicitAccountIndex = header.findIndex((cell) => accountHeaderCandidates.has(normalizeKey(cell)))
  if (explicitAccountIndex >= 0 && explicitAccountIndex < firstMonthIndex) return explicitAccountIndex
  if (firstMonthIndex > 0) return firstMonthIndex - 1

  const firstTextColumn = header.findIndex((cell, index) => {
    if (monthColumns.some((column) => column.index === index)) return false
    const normalized = normalizeKey(cell)
    return Boolean(normalized) && normalized !== "total"
  })

  return firstTextColumn >= 0 ? firstTextColumn : 0
}

function detectGroup(account: string, currentGroup: string) {
  const normalized = normalizeText(account).toUpperCase()
  if (normalized.startsWith("RECEITAS")) return "Receitas"
  if (normalized.includes("DESPESAS COM PESSOAL")) return "Despesas com pessoal"
  if (normalized === "DESPESAS OPERACIONAIS") return "Despesas operacionais"
  if (normalized.includes("OUTRAS DESPESAS NAO OPERACIONAIS")) return "Outras despesas nao operacionais"
  if (normalized.includes("APORTES")) return "Aportes"
  if (normalized.includes("SALDO") || normalized.includes("DIFEREN")) return "Fechamento"
  return currentGroup
}

function typeForGroup(groupName: string) {
  const normalized = normalizeText(groupName).toLowerCase()
  if (normalized.includes("receita") || normalized.includes("aporte")) return "receita"
  if (normalized.includes("despesa") || normalized.includes("custo")) return "despesa"
  return "neutro"
}

function rowTypeForLabel(account: string, hasValues: boolean): DreImportRow["rowType"] {
  const normalized = normalizeText(account).toUpperCase()
  if (normalized.includes("%")) return "percent"
  if (normalized.includes("SALDO")) return "balance"
  if (normalized.startsWith("TOTAL ") || normalized.includes("RECEITA TOTAL")) return "total"
  if (normalized.includes("RESULTADO") || normalized.includes("LUCRO") || normalized.includes("DIFEREN")) return "result"
  if (!hasValues || normalized.startsWith("RECEITAS") || normalized.includes("DESPESAS OPERACIONAIS") || normalized.includes("DESPESAS COM PESSOAL")) {
    return "group"
  }
  return "account"
}

export async function parseDreImportFile(file: File, sheetName?: string, options: { mode?: DreImportMode } = {}): Promise<DreImportPreview> {
  const importMode = options.mode ?? "operational"
  const extension = file.name.split(".").pop()?.toLowerCase()
  const matrix = extension === "csv"
    ? parseCsv(await file.text())
    : await parseWorkbook(file, sheetName)

  const header = detectHeader(matrix)
  if (!header) {
    if (importMode === "history") {
      const rows = matrix
        .map((row, index) => ({ row, rowIndex: index + 1 }))
        .filter(({ row }) => hasRowContent(row))
        .map(({ row, rowIndex }) => {
          const firstText = row.map((cell) => normalizeText(cell)).find(Boolean) ?? "Linha sem descricao"
          return {
            account: firstText,
            groupName: "Historico importado",
            rowIndex,
            rowType: "account" as const,
            type: "neutro" as const,
            values: {},
            total: null,
            rawLabel: firstText,
            rawData: buildRawData(row, rowIndex),
          }
        })

      if (!rows.length) {
        throw new Error("Nenhuma linha com conteudo foi encontrada para arquivar como historico.")
      }

      return {
        fileName: file.name,
        sheetName: sheetName ?? (extension === "csv" ? "CSV" : "Primeira aba"),
        importMode,
        rows,
        ignoredRows: [],
        monthNumbers: [],
        totalRowsRead: matrix.length,
        genericHistory: true,
      }
    }

    throw new Error(sheetName
      ? "Essa aba nao parece ser uma DRE mensal. Escolha a aba correta."
      : "Nao foi possivel identificar os meses da DRE na planilha. Confirme se ha colunas jan-26, fev-26..."
    )
  }

  const headerRow = matrix[header.index]
  const accountIndex = detectAccountColumn(headerRow, header.monthColumns)
  const totalColumnIndex = headerRow.findIndex((cell) => normalizeKey(cell) === "total")
  const rows: DreImportRow[] = []
  const ignoredRows: Array<{ rowIndex: number; reason: string }> = []
  let currentGroup = "Receitas"

  const dataRows = matrix.slice(header.index + 1)
  dataRows.forEach((row, offset) => {
    const rowIndex = header.index + offset + 2
    const account = normalizeText(row[accountIndex])
    const values = header.monthColumns.reduce<Record<number, number>>((acc, column) => {
      const value = parseNumber(row[column.index])
      if (value !== 0) acc[column.month] = value
      return acc
    }, {})
    const total = totalColumnIndex >= 0 ? parseNumber(row[totalColumnIndex]) : null
    const hasValues = Object.keys(values).length > 0 || Boolean(total)

    if (!account && !hasValues) {
      const hasPreviousImportedRow = rows.length > 0
      const hasNextContent = dataRows.slice(offset + 1).some((nextRow) => {
        const nextAccount = normalizeText(nextRow[accountIndex])
        const nextValues = header.monthColumns.some((column) => parseNumber(nextRow[column.index]) !== 0)
        const nextTotal = totalColumnIndex >= 0 ? parseNumber(nextRow[totalColumnIndex]) : 0
        return Boolean(nextAccount) || nextValues || nextTotal !== 0
      })

      if (hasPreviousImportedRow && hasNextContent) {
        rows.push({
          account: "",
          groupName: currentGroup,
          rowIndex,
          rowType: "structural_blank",
          type: "neutro",
          values: {},
          total: null,
          rawLabel: "",
          rawData: buildRawData(row, rowIndex, headerRow),
        })
        return
      }

      ignoredRows.push({ rowIndex, reason: "Linha vazia fora da estrutura da DRE" })
      return
    }

    const nextGroup = detectGroup(account, currentGroup)
    if (nextGroup !== currentGroup) currentGroup = nextGroup

    rows.push({
      account: account || "Linha sem descricao",
      groupName: currentGroup,
      rowIndex,
      rowType: rowTypeForLabel(account, hasValues),
      type: typeForGroup(currentGroup),
      values,
      total,
      rawLabel: account,
      rawData: buildRawData(row, rowIndex, headerRow),
    })
  })

  if (!rows.length) {
    throw new Error("Nenhuma linha com valor financeiro foi encontrada para importar.")
  }

  return {
    fileName: file.name,
    sheetName: sheetName ?? (extension === "csv" ? "CSV" : "Primeira aba"),
    importMode,
    rows,
    ignoredRows,
    monthNumbers: header.monthColumns.map((column) => column.month),
    totalRowsRead: Math.max(0, matrix.length - header.index - 1),
    genericHistory: false,
  }
}
