import {
  dateIsInMonth,
  formatCurrency,
  formatDate,
  getNumericValue,
  isActiveStatus,
  isPaidStatus,
  isReceivedStatus,
  monthLabel,
  normalizeText,
  parseRequestedPeriod,
  selectCosRows,
  type CosSupabaseClient,
} from "@/lib/cos/cos-context"
import {
  formatContractList,
  getContractsSummary,
  getDreSummary,
  getEquipmentSummary,
  getFinancialSummary,
} from "@/lib/cos/cos-tools"
import type { SupabaseRow } from "@/lib/supabase/types"

function rowName(row: SupabaseRow) {
  return String(row.name ?? row.legal_name ?? row.company_name ?? row.fantasy_name ?? row.description ?? "sem nome")
}

function rowDocument(row: SupabaseRow) {
  return String(row.document_number ?? row.document ?? row.cnpj ?? row.cpf ?? "")
}

function rowId(row: SupabaseRow) {
  return String(row.id ?? "sem id")
}

function contractNumber(row: SupabaseRow) {
  return String(row.contract_number ?? row.number ?? row.numero ?? row.id ?? "sem numero")
}

function contractClient(row: SupabaseRow) {
  return String(row.client_name ?? row.customer_name ?? row.client_id ?? "cliente nao identificado")
}

function contractEndDate(row: SupabaseRow) {
  return row.end_date ?? row.final_date ?? row.vigencia_fim ?? row.expires_at ?? row.due_date
}

function moneyFrom(row: SupabaseRow) {
  return getNumericValue(row, ["value", "amount", "valor", "monthly_value", "total_value", "original_value", "updated_value"])
}

function compact(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function extractEntityQuery(message: string, wordsToRemove: string[]) {
  const normalized = normalizeText(message)
  let query = normalized
  for (const word of wordsToRemove) {
    query = query.replace(new RegExp(`\\b${word}\\b`, "g"), " ")
  }
  query = query.replace(/\b(o|a|os|as|de|da|do|dos|das|por|pelo|pela|com|sobre|um|uma)\b/g, " ")
  return compact(query)
}

function scoreRow(row: SupabaseRow, query: string, fields: string[]) {
  if (!query) return 1
  const haystack = normalizeText(fields.map((field) => row[field]).join(" "))
  if (!haystack) return 0
  if (haystack === query) return 100
  if (haystack.includes(query)) return 50
  const tokens = query.split(" ").filter(Boolean)
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 5 : 0), 0)
}

function topMatches(rows: SupabaseRow[], query: string, fields: string[], limit = 5) {
  return rows
    .map((row) => ({ row, score: scoreRow(row, query, fields) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.row)
}

function listLines(rows: string[]) {
  return rows.length ? rows.map((line) => `- ${line}`).join("\n") : "- nenhum registro encontrado"
}

export async function searchClientsReadOnly(supabase: CosSupabaseClient, message: string) {
  const rows = await selectCosRows(supabase, "clients")
  const query = extractEntityQuery(message, [
    "procure",
    "buscar",
    "busque",
    "cliente",
    "clientes",
    "quem",
    "e",
    "pelo",
    "cnpj",
    "cpf",
    "inadimplentes",
    "ativos",
  ])
  const normalized = normalizeText(message)
  const filtered = normalized.includes("inadimplente")
    ? rows.filter((row) => normalizeText(row.status).includes("inadimplente"))
    : normalized.includes("ativo") || normalized.includes("ativos")
      ? rows.filter((row) => isActiveStatus(row.status) || !row.status)
      : topMatches(rows, query, ["name", "legal_name", "company_name", "fantasy_name", "document_number", "document", "email", "phone"])

  const matches = filtered.slice(0, 5)
  return {
    title: "Busca de cliente",
    answer: matches.length
      ? `Encontrei ${filtered.length} cliente(s) compativeis em leitura read-only:\n${listLines(
          matches.map((row) => `${rowName(row)}${rowDocument(row) ? ` - ${rowDocument(row)}` : ""} (${String(row.status ?? "sem status")})`)
        )}`
      : `Nao encontrei cliente compativel com "${query || message}".`,
  }
}

export async function searchContractsReadOnly(supabase: CosSupabaseClient, message: string) {
  const summary = await getContractsSummary(supabase)
  const normalized = normalizeText(message)

  if (normalized.includes("vencendo") || normalized.includes("vence") || normalized.includes("vencem")) {
    return {
      title: "Contratos vencendo",
      answer: `Encontrei ${summary.expiring.length} contrato(s) vencendo nos proximos 30 dias. ${formatContractList(summary.expiring)}`,
    }
  }

  if (normalized.includes("vencido")) {
    return {
      title: "Contratos vencidos",
      answer: `Encontrei ${summary.expired.length} contrato(s) vencidos. ${formatContractList(summary.expired)}`,
    }
  }

  const rows = await selectCosRows(supabase, "contracts")
  const query = extractEntityQuery(message, ["contrato", "contratos", "ativo", "ativos", "encerrado", "encerrados", "da", "do"])
  const filtered = normalized.includes("ativo")
    ? summary.active
    : normalized.includes("encerrado")
      ? rows.filter((row) => normalizeText(row.status).includes("encerr"))
      : topMatches(rows, query, ["contract_number", "number", "client_name", "customer_name", "status", "type", "notes"])

  const matches = filtered.slice(0, 5)
  return {
    title: "Busca de contrato",
    answer: matches.length
      ? `Encontrei ${filtered.length} contrato(s) compativeis:\n${listLines(
          matches.map((row) => `${contractNumber(row)} - ${contractClient(row)} - ${String(row.status ?? "sem status")} - fim ${formatDate(contractEndDate(row))}`)
        )}`
      : `Nao encontrei contrato compativel com "${query || message}".`,
  }
}

export async function searchEquipmentReadOnly(supabase: CosSupabaseClient, message: string) {
  const rows = await selectCosRows(supabase, "equipment")
  const summary = await getEquipmentSummary(supabase)
  const normalized = normalizeText(message)
  const query = extractEntityQuery(message, [
    "quantos",
    "equipamentos",
    "equipamento",
    "temos",
    "disponiveis",
    "disponivel",
    "manutencao",
    "locados",
    "locado",
  ])

  if (normalized.includes("disponivel") || normalized.includes("disponiveis")) {
    return {
      title: "Equipamentos disponiveis",
      answer: `Existem ${summary.available} equipamento(s) disponiveis. ${
        summary.availableSample.length ? `Amostra: ${summary.availableSample.join(", ")}.` : "Nao encontrei itens com disponibilidade positiva."
      }`,
    }
  }

  if (normalized.includes("manutencao")) {
    return {
      title: "Equipamentos em manutencao",
      answer: `Existem ${summary.maintenance} equipamento(s) em manutencao. ${
        summary.maintenanceSample.length ? `Amostra: ${summary.maintenanceSample.join(", ")}.` : "Nao encontrei itens marcados em manutencao."
      }`,
    }
  }

  const matches = topMatches(rows, query, ["name", "category", "description", "brand", "model", "configuration", "status"], 6)
  return {
    title: "Busca de equipamento",
    answer: matches.length
      ? `Encontrei ${matches.length} equipamento(s) compativeis. Visao geral: ${summary.available} disponiveis, ${summary.rented} locados e ${summary.maintenance} em manutencao.\n${listLines(
          matches.map((row) => `${rowName(row)} - ${String(row.category ?? "sem categoria")} - ${String(row.status ?? "sem status")}`)
        )}`
      : `Nao encontrei equipamento compativel com "${query || message}". Visao geral: ${summary.available} disponiveis, ${summary.rented} locados e ${summary.maintenance} em manutencao.`,
  }
}

export async function searchFinancialReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const rows = await selectCosRows(supabase, "financial_entries")
  const monthRows = rows.filter((row) => dateIsInMonth(row.competence_date ?? row.payment_date ?? row.due_date, period.year, period.month))
  const normalized = normalizeText(message)
  const typeRows = normalized.includes("receita") || normalized.includes("faturamento")
    ? monthRows.filter((row) => normalizeText(row.type) === "receita")
    : normalized.includes("despesa")
      ? monthRows.filter((row) => normalizeText(row.type) === "despesa")
      : monthRows

  const total = typeRows.reduce((sum, row) => sum + moneyFrom(row), 0)
  const openRows = typeRows.filter((row) => !isPaidStatus(row.status) && !isReceivedStatus(row.status))
  const sample = typeRows.slice(0, 5).map((row) => `${String(row.description ?? "sem descricao")} - ${formatCurrency(moneyFrom(row))} - ${String(row.status ?? "sem status")}`)

  return {
    title: "Busca financeira",
    answer: `No periodo ${monthLabel(period.month)}/${period.year}, encontrei ${typeRows.length} lancamento(s) no criterio solicitado, totalizando ${formatCurrency(total)}. Existem ${openRows.length} lancamento(s) em aberto nesse recorte.\n${listLines(sample)}`,
  }
}

export async function explainSystemReadOnly(message: string) {
  const normalized = normalizeText(message)

  if (normalized.includes("contrato")) {
    return {
      title: "Explicacao operacional de contratos",
      answer:
        "Quando um contrato e criado no GATE OS, ele deve conectar cliente, datas, valor, parcelas, equipamentos quando for locacao, documentos e financeiro previsto. Na Etapa 1 eu apenas explico e valido esse impacto; nao crio nem altero contratos.",
    }
  }

  if (normalized.includes("dre")) {
    return {
      title: "Explicacao operacional da DRE",
      answer:
        "A DRE e alimentada principalmente por lancamentos financeiros classificados por categoria e competencia, alem de ajustes e estruturas operacionais da DRE. Se a DRE divergir, a correcao deve acontecer na origem: financeiro, categoria, competencia ou ajuste justificado.",
    }
  }

  if (normalized.includes("dashboard") || normalized.includes("indicador") || normalized.includes("card")) {
    return {
      title: "Explicacao operacional do Dashboard",
      answer:
        "O Dashboard e uma camada de leitura consolidada. Ele deve refletir dados de origem como financeiro, contratos, equipamentos, juridico e DRE. Se um indicador nao bater, o caminho correto e investigar a fonte, nao alterar o indicador diretamente.",
    }
  }

  if (normalized.includes("fech")) {
    return {
      title: "Explicacao operacional do fechamento",
      answer:
        "O fechamento mensal depende de financeiro, contratos, parcelas, estoque, banco, DRE, dashboard e socios consistentes. Na Etapa 1 eu posso listar pendencias e diagnosticar riscos, mas nao registro fechamento.",
    }
  }

  return {
    title: "Explicacao do sistema",
    answer:
      "O GATE OS conecta clientes, contratos, equipamentos, financeiro, DRE, documentos, juridico, socios e dashboard. A regra central da Etapa 1 e read-only: posso explicar dependencias e impactos, mas nao alterar dados.",
  }
}

export async function diagnoseBankReconciliationReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const [accounts, entries] = await Promise.all([
    selectCosRows(supabase, "bank_accounts"),
    selectCosRows(supabase, "financial_entries"),
  ])
  const monthEntries = entries.filter((row) => dateIsInMonth(row.payment_date ?? row.due_date ?? row.competence_date, period.year, period.month))
  const settled = monthEntries.filter((row) => isPaidStatus(row.status) || isReceivedStatus(row.status) || row.payment_date)
  const operational = settled.reduce((sum, row) => {
    const value = moneyFrom(row)
    return normalizeText(row.type) === "despesa" ? sum - value : sum + value
  }, 0)
  const bankBalance = accounts.reduce((sum, row) => sum + getNumericValue(row, ["current_balance", "balance", "saldo_atual"]), 0)
  const withoutAccount = settled.filter((row) => !row.bank_account_id)
  const withoutPaymentDate = monthEntries.filter((row) => (isPaidStatus(row.status) || isReceivedStatus(row.status)) && !row.payment_date)

  return {
    title: "Diagnostico banco x financeiro",
    answer: `Diagnostico read-only de ${monthLabel(period.month)}/${period.year}: saldo bancario cadastrado em contas soma ${formatCurrency(bankBalance)}. O movimento operacional liquidado no periodo soma ${formatCurrency(operational)}. A diferenca simples entre esses numeros e ${formatCurrency(bankBalance - operational)}. Encontrei ${withoutAccount.length} lancamento(s) liquidado(s) sem conta bancaria e ${withoutPaymentDate.length} lancamento(s) com status pago/recebido sem data de pagamento. Nesta etapa eu nao altero saldo nem baixo pagamentos.`,
  }
}

export async function diagnoseDreReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const [dre, financial, entries] = await Promise.all([
    getDreSummary(supabase, period.year, period.month),
    getFinancialSummary(supabase, period.year, period.month),
    selectCosRows(supabase, "financial_entries"),
  ])
  const monthEntries = entries.filter((row) => dateIsInMonth(row.competence_date ?? row.payment_date ?? row.due_date, period.year, period.month))
  const withoutCategory = monthEntries.filter((row) => !row.dre_category_id)

  return {
    title: "Diagnostico DRE x financeiro",
    answer: `Comparacao read-only de ${dre.label}: DRE/fonte ${dre.source} mostra receita ${formatCurrency(dre.revenue)}, despesas ${formatCurrency(dre.expenses)} e resultado ${formatCurrency(dre.result)}. O financeiro calculado no periodo mostra receita ${formatCurrency(financial.revenue)}, despesas ${formatCurrency(financial.expenses)} e resultado ${formatCurrency(financial.result)}. Diferenca de resultado: ${formatCurrency(dre.result - financial.result)}. Encontrei ${withoutCategory.length} lancamento(s) sem categoria DRE no periodo. Nesta etapa eu nao ajusto DRE.`,
  }
}

export async function diagnoseClosingReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const [contracts, equipment, financial, entries] = await Promise.all([
    getContractsSummary(supabase),
    getEquipmentSummary(supabase),
    getFinancialSummary(supabase, period.year, period.month),
    selectCosRows(supabase, "financial_entries"),
  ])
  const monthEntries = entries.filter((row) => dateIsInMonth(row.competence_date ?? row.payment_date ?? row.due_date, period.year, period.month))
  const withoutCategory = monthEntries.filter((row) => !row.dre_category_id).length
  const withoutBank = monthEntries.filter((row) => (isPaidStatus(row.status) || isReceivedStatus(row.status) || row.payment_date) && !row.bank_account_id).length

  return {
    title: "Checklist read-only de fechamento",
    answer: `Nao vou fechar ${monthLabel(period.month)}/${period.year} nesta etapa. Checklist read-only: financeiro do periodo tem ${financial.entries} lancamento(s), receita ${formatCurrency(financial.revenue)}, despesas ${formatCurrency(financial.expenses)} e resultado ${formatCurrency(financial.result)}. Pendencias detectadas: ${withoutCategory} lancamento(s) sem categoria DRE, ${withoutBank} lancamento(s) liquidado(s) sem conta bancaria, ${contracts.expired.length} contrato(s) vencido(s) e ${equipment.available} equipamento(s) disponivel(is). Proximo passo seguro: revisar pendencias criticas antes de qualquer fechamento futuro.`,
  }
}
