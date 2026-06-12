export type DreImportRow = {
  account: string
  groupName: string
  type: "receita" | "despesa"
  values: Record<number, number>
}

export type DreImportPreview = {
  fileName: string
  rows: DreImportRow[]
  ignoredRows: string[]
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

function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0

  const text = String(value ?? "")
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")

  if (!text || text === "-") return 0
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseCsv(text: string) {
  const delimiter = text.includes(";") ? ";" : ","
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")))
}

async function parseWorkbook(file: File) {
  const XLSX = await import("xlsx")
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })
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

export async function parseDreImportFile(file: File): Promise<DreImportPreview> {
  const extension = file.name.split(".").pop()?.toLowerCase()
  const matrix = extension === "csv"
    ? parseCsv(await file.text())
    : await parseWorkbook(file)

  const headerIndex = matrix.findIndex((row) =>
    row.some((cell) => normalizeText(cell).toLowerCase() === "conta")
  )
  if (headerIndex < 0) {
    throw new Error("Nao foi possivel identificar a coluna Conta na planilha.")
  }

  const header = matrix[headerIndex]
  const accountIndex = header.findIndex((cell) => normalizeText(cell).toLowerCase() === "conta")
  const monthColumns = header
    .map((cell, index) => {
      const label = normalizeText(cell).toLowerCase().split("-")[0]
      const month = monthLabels.get(label)
      return month ? { index, month } : null
    })
    .filter(Boolean) as Array<{ index: number; month: number }>

  if (!monthColumns.length) {
    throw new Error("Nao foi possivel identificar colunas mensais como jan-26, fev-26, mar-26.")
  }

  const rows: DreImportRow[] = []
  const ignoredRows: string[] = []
  let currentGroup = "Receitas"

  matrix.slice(headerIndex + 1).forEach((row) => {
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

    const values = monthColumns.reduce<Record<number, number>>((acc, column) => {
      const value = parseNumber(row[column.index])
      if (value !== 0) acc[column.month] = value
      return acc
    }, {})

    if (!Object.keys(values).length) {
      rows.push({
        account,
        groupName: currentGroup,
        type: typeForGroup(currentGroup),
        values: {},
      })
      return
    }

    rows.push({
      account,
      groupName: currentGroup,
      type: typeForGroup(currentGroup),
      values,
    })
  })

  return { fileName: file.name, rows, ignoredRows }
}
