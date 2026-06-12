export type DreImportRow = {
  account: string
  groupName: string
  type: "receita" | "despesa"
  values: Record<number, number>
}

export type DreImportPreview = {
  fileName: string
  sheetName: string
  rows: DreImportRow[]
  ignoredRows: string[]
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
  ["março", 3],
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

const accountHeaderCandidates = new Set([
  "conta",
  "categoria",
  "descricao",
  "item",
])

const ignoredExactRows = new Set([
  "RECEITAS 2026",
  "RECEITA TOTAL",
  "CUSTO DO PRODUTO VENDIDO (CPV)",
  "RECEITA LIQUIDA TOTAL",
  "RECEITA LÍQUIDA TOTAL",
  "TOTAL DESPESAS COM PESSOAL",
  "TOTAL DESPESAS GERAIS",
  "TOTAL DE DESPESAS FINANCEIRAS",
  "TOTAL DE DESPESAS OPERACIONAIS",
  "LUCRO OPERACIONAL",
  "LUCRO OPERACIONAL %",
  "OUTRAS DESPESAS NAO OPERACIONAIS",
  "OUTRAS DESPESAS NÃO OPERACIONAIS",
  "TOTAL DE DESPESAS NAO OPERACIONAIS",
  "TOTAL DE DESPESAS NÃO OPERACIONAIS",
  "RESULTADO OPERACIONAL",
  "TOTAL APORTES TERCEIROS",
  "SALDO OPERACAO -(RO+SALDO ANT)",
  "SALDO OPERAÇÃO -(RO+SALDO ANT)",
  "DIFERENCA",
  "DIFERENÇA",
])

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
  if (normalized === "RECEITAS 2026") return "Receitas"
  if (normalized === "DESPESAS COM PESSOAL") return "Despesas com pessoal"
  if (normalized === "DESPESAS OPERACIONAIS") return "Despesas operacionais"
  if (normalized === "OUTRAS DESPESAS NAO OPERACIONAIS") return "Outras despesas nao operacionais"
  if (normalized === "TOTAL APORTES TERCEIROS") return "Aportes"
  return currentGroup
}

function typeForGroup(groupName: string) {
  const normalized = normalizeText(groupName).toLowerCase()
  return normalized.includes("receita") || normalized.includes("aporte") ? "receita" : "despesa"
}

function isIgnoredRow(account: string) {
  const normalized = normalizeText(account).toUpperCase()
  if (!normalized) return true
  if (normalized.includes("%")) return true
  if (ignoredExactRows.has(normalized)) return true
  if (normalized.startsWith("TOTAL ")) return true
  return false
}

export async function parseDreImportFile(file: File, sheetName?: string): Promise<DreImportPreview> {
  const extension = file.name.split(".").pop()?.toLowerCase()
  const matrix = extension === "csv"
    ? parseCsv(await file.text())
    : await parseWorkbook(file, sheetName)

  const header = detectHeader(matrix)
  if (!header) {
    throw new Error(sheetName
      ? "Essa aba nao parece ser uma DRE mensal. Escolha a aba correta."
      : "Nao foi possivel identificar os meses da DRE na planilha. Confirme se ha colunas jan-26, fev-26..."
    )
  }

  const headerRow = matrix[header.index]
  const accountIndex = detectAccountColumn(headerRow, header.monthColumns)
  const rows: DreImportRow[] = []
  const ignoredRows: string[] = []
  let currentGroup = "Receitas"

  matrix.slice(header.index + 1).forEach((row) => {
    const account = normalizeText(row[accountIndex])
    if (!account) return

    const nextGroup = detectGroup(account, currentGroup)
    if (nextGroup !== currentGroup) {
      currentGroup = nextGroup
      ignoredRows.push(account)
      return
    }

    if (isIgnoredRow(account)) {
      ignoredRows.push(account)
      return
    }

    const values = header.monthColumns.reduce<Record<number, number>>((acc, column) => {
      const value = parseNumber(row[column.index])
      if (value !== 0) acc[column.month] = value
      return acc
    }, {})

    if (!Object.keys(values).length) {
      ignoredRows.push(account)
      return
    }

    rows.push({
      account,
      groupName: currentGroup,
      type: typeForGroup(currentGroup),
      values,
    })
  })

  if (!rows.length) {
    throw new Error("Nenhuma linha com valor financeiro foi encontrada para importar.")
  }

  return { fileName: file.name, sheetName: sheetName ?? (extension === "csv" ? "CSV" : "Primeira aba"), rows, ignoredRows }
}
