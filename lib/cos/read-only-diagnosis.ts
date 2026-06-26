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
import { getDreSummary, getFinancialSummary } from "@/lib/cos/cos-tools"
import type { SupabaseRow } from "@/lib/supabase/types"

export type DiagnosisSeverity = "Baixa" | "Media" | "Alta" | "Critica"

type OperationalDiagnosis = {
  problem: string
  probableOrigin: string
  modules: string[]
  impact: string
  severity: DiagnosisSeverity
  nextStep: string
  evidence?: string[]
  timeline?: string[]
}

type DiagnosisReport = {
  title: string
  answer: string
  diagnoses: OperationalDiagnosis[]
}

const severityWeight: Record<DiagnosisSeverity, number> = {
  Baixa: 1,
  Media: 2,
  Alta: 3,
  Critica: 4,
}

function moneyFrom(row: SupabaseRow) {
  return getNumericValue(row, ["value", "amount", "valor", "monthly_value", "total_value", "original_value", "updated_value"])
}

function rowDate(row: SupabaseRow) {
  return row.competence_date ?? row.payment_date ?? row.due_date ?? row.created_at
}

function rowDescription(row: SupabaseRow) {
  return String(row.description ?? row.name ?? row.contract_number ?? row.number ?? row.id ?? "registro sem descricao")
}

function rowId(row: SupabaseRow) {
  return String(row.id ?? "")
}

function contractEndDate(row: SupabaseRow) {
  return row.end_date ?? row.final_date ?? row.vigencia_fim ?? row.expires_at ?? row.due_date
}

function contractStartDate(row: SupabaseRow) {
  return row.start_date ?? row.initial_date ?? row.vigencia_inicio ?? row.created_at
}

function contractClientId(row: SupabaseRow) {
  return String(row.client_id ?? row.customer_id ?? "")
}

function contractNumber(row: SupabaseRow) {
  return String(row.contract_number ?? row.number ?? row.numero ?? row.id ?? "sem numero")
}

function equipmentName(row: SupabaseRow) {
  return String(row.name ?? row.description ?? row.model ?? row.id ?? "equipamento sem nome")
}

function asNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

async function safeSelectRows(supabase: CosSupabaseClient, table: string) {
  try {
    return await selectCosRows(supabase, table)
  } catch {
    return []
  }
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  return [...groups.values()].filter((group) => group.length > 1)
}

function periodRows(rows: SupabaseRow[], message: string) {
  const period = parseRequestedPeriod(message)
  return {
    period,
    rows: rows.filter((row) => dateIsInMonth(rowDate(row), period.year, period.month)),
  }
}

function composeDiagnosisReport(title: string, diagnoses: OperationalDiagnosis[], successMessage: string, extraSections: string[] = []): DiagnosisReport {
  const ordered = [...diagnoses].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])
  const blocks = ordered.map((diagnosis, index) => {
    const lines = [
      `${index + 1}. Problema: ${diagnosis.problem}`,
      `Origem provavel: ${diagnosis.probableOrigin}`,
      `Modulos envolvidos: ${diagnosis.modules.join(", ")}`,
      `Impacto: ${diagnosis.impact}`,
      `Criticidade: ${diagnosis.severity}`,
      `Proximo passo recomendado: ${diagnosis.nextStep}`,
    ]

    if (diagnosis.evidence?.length) {
      lines.push(`Evidencias:\n${diagnosis.evidence.map((item) => `- ${item}`).join("\n")}`)
    }

    if (diagnosis.timeline?.length) {
      lines.push(`Timeline operacional:\n${diagnosis.timeline.map((item) => `- ${item}`).join("\n")}`)
    }

    return lines.join("\n")
  })

  const intro = ordered.length
    ? `Encontrei ${ordered.length} ponto(s) de atencao em modo read-only. Nenhuma correcao foi executada.`
    : successMessage

  return {
    title,
    answer: [intro, ...extraSections, ...blocks].filter(Boolean).join("\n\n"),
    diagnoses: ordered,
  }
}

export async function financialDiagnosisReadOnly(supabase: CosSupabaseClient, message: string) {
  const allEntries = await safeSelectRows(supabase, "financial_entries")
  const { period, rows } = periodRows(allEntries, message)
  const settledRows = rows.filter((row) => isPaidStatus(row.status) || isReceivedStatus(row.status) || row.payment_date)
  const withoutCategory = rows.filter((row) => !row.dre_category_id)
  const withoutBank = settledRows.filter((row) => !row.bank_account_id)
  const withoutClient = rows.filter((row) => normalizeText(row.type) === "receita" && !row.client_id && !row.customer_id)
  const withoutContract = rows.filter((row) => normalizeText(row.type) === "receita" && !row.contract_id)
  const duplicateGroups = groupBy(rows, (row) =>
    [
      normalizeText(row.type),
      normalizeText(row.description),
      moneyFrom(row).toFixed(2),
      String(row.competence_date ?? row.due_date ?? row.payment_date ?? ""),
      String(row.client_id ?? ""),
    ].join("|")
  )
  const suspiciousCompetence = rows.filter((row) => {
    const competence = String(row.competence_date ?? "")
    const due = String(row.due_date ?? "")
    if (!competence || !due) return false
    return !dateIsInMonth(due, period.year, period.month) && dateIsInMonth(competence, period.year, period.month)
  })

  const diagnoses: OperationalDiagnosis[] = []

  if (withoutCategory.length) {
    diagnoses.push({
      problem: `${withoutCategory.length} lancamento(s) sem categoria DRE em ${monthLabel(period.month)}/${period.year}.`,
      probableOrigin: "Lancamentos financeiros foram registrados sem classificacao gerencial.",
      modules: ["Financeiro", "DRE", "Fechamento"],
      impact: "A DRE pode ficar incompleta ou distorcida.",
      severity: "Alta",
      nextStep: "Listar os lancamentos sem categoria e classificar na origem em fase futura aprovada.",
      evidence: withoutCategory.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (withoutBank.length) {
    diagnoses.push({
      problem: `${withoutBank.length} lancamento(s) liquidado(s) sem conta bancaria.`,
      probableOrigin: "O status ou data de pagamento foi preenchido sem vincular a conta.",
      modules: ["Financeiro", "Banco", "Fechamento"],
      impact: "A conciliacao bancaria pode nao fechar.",
      severity: "Alta",
      nextStep: "Conferir conta bancaria dos lancamentos antes de qualquer fechamento.",
      evidence: withoutBank.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (withoutContract.length) {
    diagnoses.push({
      problem: `${withoutContract.length} receita(s) sem contrato vinculado.`,
      probableOrigin: "Receitas foram lancadas manualmente ou perderam o vinculo contratual.",
      modules: ["Financeiro", "Contratos", "DRE"],
      impact: "A receita contratual pode ficar sem rastreabilidade.",
      severity: "Alta",
      nextStep: "Comparar receitas com contratos ativos para localizar origem correta.",
      evidence: withoutContract.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (withoutClient.length) {
    diagnoses.push({
      problem: `${withoutClient.length} receita(s) sem cliente vinculado.`,
      probableOrigin: "Lancamentos de receita foram registrados sem entidade operacional.",
      modules: ["Financeiro", "Clientes", "DRE"],
      impact: "Cobranca, auditoria e relatorios por cliente podem ficar incompletos.",
      severity: "Media",
      nextStep: "Resolver o cliente correto antes de qualquer ajuste futuro.",
      evidence: withoutClient.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (duplicateGroups.length) {
    diagnoses.push({
      problem: `${duplicateGroups.length} grupo(s) de lancamentos possivelmente duplicados.`,
      probableOrigin: "Lancamentos com mesmo tipo, descricao, valor, data e cliente aparecem repetidos.",
      modules: ["Financeiro", "DRE", "Banco"],
      impact: "Receita ou despesa pode estar superestimada.",
      severity: "Alta",
      nextStep: "Revisar os grupos duplicados antes de fechar ou conciliar.",
      evidence: duplicateGroups.slice(0, 5).map((group) => `${rowDescription(group[0])} - ${formatCurrency(moneyFrom(group[0]))} (${group.length} ocorrencias)`),
    })
  }

  if (suspiciousCompetence.length) {
    diagnoses.push({
      problem: `${suspiciousCompetence.length} lancamento(s) com competencia diferente do vencimento.`,
      probableOrigin: "A competencia foi atribuida ao periodo analisado, mas o vencimento pertence a outro periodo.",
      modules: ["Financeiro", "DRE", "Fechamento"],
      impact: "O resultado mensal pode estar deslocado.",
      severity: "Media",
      nextStep: "Validar se a competencia representa a operacao correta.",
      evidence: suspiciousCompetence.slice(0, 5).map((row) => `${rowDescription(row)} - vencimento ${formatDate(row.due_date)}`),
    })
  }

  return composeDiagnosisReport(
    "Diagnostico financeiro operacional",
    diagnoses,
    `Nao encontrei inconsistencias financeiras relevantes em ${monthLabel(period.month)}/${period.year} com as regras read-only atuais.`
  )
}

export async function contractDiagnosisReadOnly(supabase: CosSupabaseClient, message: string) {
  const [contracts, entries, contractEquipment, documents] = await Promise.all([
    safeSelectRows(supabase, "contracts"),
    safeSelectRows(supabase, "financial_entries"),
    safeSelectRows(supabase, "contract_equipment"),
    safeSelectRows(supabase, "documents"),
  ])
  const today = new Date()
  const activeContracts = contracts.filter((row) => isActiveStatus(row.status))
  const activeWithoutFinancial = activeContracts.filter((contract) => !entries.some((entry) => String(entry.contract_id ?? "") === rowId(contract)))
  const expiredActive = activeContracts.filter((contract) => {
    const date = new Date(String(contractEndDate(contract) ?? ""))
    return !Number.isNaN(date.getTime()) && date < today
  })
  const rentalWithoutEquipment = activeContracts.filter((contract) => {
    const isRental = normalizeText(contract.type ?? contract.contract_type).includes("loc")
    return isRental && !contractEquipment.some((item) => String(item.contract_id ?? "") === rowId(contract))
  })
  const duplicateGroups = groupBy(contracts, (contract) =>
    [
      contractClientId(contract),
      normalizeText(contract.type ?? contract.contract_type),
      String(contractStartDate(contract) ?? ""),
      moneyFrom(contract).toFixed(2),
    ].join("|")
  )
  const contractsWithoutDocument = activeContracts.filter((contract) => {
    const id = rowId(contract)
    const hasLinkedDocument = documents.some((document) => String(document.contract_id ?? "") === id)
    const hasInlineDocument = Boolean(contract.document_url ?? contract.contract_url ?? contract.signed_url ?? contract.file_url)
    return !hasLinkedDocument && !hasInlineDocument
  })

  const diagnoses: OperationalDiagnosis[] = []

  if (activeWithoutFinancial.length) {
    diagnoses.push({
      problem: `${activeWithoutFinancial.length} contrato(s) ativo(s) sem financeiro vinculado.`,
      probableOrigin: "Contratos ativos nao possuem lancamentos financeiros associados.",
      modules: ["Contratos", "Financeiro", "DRE", "Dashboard"],
      impact: "Receita pode estar subestimada e o dashboard pode mostrar resultado incorreto.",
      severity: "Critica",
      nextStep: "Analisar os contratos sem financeiro e validar se deveriam gerar receita.",
      evidence: activeWithoutFinancial.slice(0, 5).map((row) => `${contractNumber(row)} - cliente ${contractClientId(row) || "nao identificado"}`),
      timeline: ["Contrato ativo identificado", "Financeiro vinculado ausente", "DRE pode nao receber a receita", "Dashboard pode refletir receita menor"],
    })
  }

  if (expiredActive.length) {
    diagnoses.push({
      problem: `${expiredActive.length} contrato(s) vencido(s) ainda ativo(s).`,
      probableOrigin: "A data final passou, mas o status operacional segue ativo.",
      modules: ["Contratos", "Financeiro", "Dashboard"],
      impact: "Pode haver receita recorrente indevida ou renovacao pendente.",
      severity: "Alta",
      nextStep: "Revisar status, renovacao ou encerramento em fluxo futuro controlado.",
      evidence: expiredActive.slice(0, 5).map((row) => `${contractNumber(row)} - fim ${formatDate(contractEndDate(row))}`),
    })
  }

  if (rentalWithoutEquipment.length) {
    diagnoses.push({
      problem: `${rentalWithoutEquipment.length} contrato(s) de locacao sem equipamento vinculado.`,
      probableOrigin: "O contrato foi marcado como locacao, mas nao ha vinculo em contract_equipment.",
      modules: ["Contratos", "Equipamentos", "Estoque"],
      impact: "A locacao fica operacionalmente incompleta e o estoque pode nao refletir a realidade.",
      severity: "Alta",
      nextStep: "Identificar os equipamentos esperados antes de qualquer execucao futura.",
      evidence: rentalWithoutEquipment.slice(0, 5).map((row) => `${contractNumber(row)} - ${String(row.status ?? "sem status")}`),
    })
  }

  if (duplicateGroups.length) {
    diagnoses.push({
      problem: `${duplicateGroups.length} grupo(s) de contratos possivelmente duplicados.`,
      probableOrigin: "Contratos com mesmo cliente, tipo, inicio e valor aparecem repetidos.",
      modules: ["Contratos", "Financeiro", "Clientes"],
      impact: "Pode haver duplicidade de receita, parcelas ou controle operacional.",
      severity: "Alta",
      nextStep: "Comparar os contratos candidatos antes de criar ou renovar qualquer contrato.",
      evidence: duplicateGroups.slice(0, 5).map((group) => `${contractNumber(group[0])} (${group.length} ocorrencias semelhantes)`),
    })
  }

  if (contractsWithoutDocument.length) {
    diagnoses.push({
      problem: `${contractsWithoutDocument.length} contrato(s) ativo(s) sem documento vinculado.`,
      probableOrigin: "Nao encontrei anexo/documento contratual relacionado.",
      modules: ["Contratos", "Documentos", "Juridico"],
      impact: "Reduz seguranca operacional e rastreabilidade juridica.",
      severity: "Media",
      nextStep: "Localizar documento assinado ou confirmar pendencia documental.",
      evidence: contractsWithoutDocument.slice(0, 5).map((row) => `${contractNumber(row)} - cliente ${contractClientId(row) || "nao identificado"}`),
    })
  }

  return composeDiagnosisReport("Diagnostico operacional de contratos", diagnoses, "Nao encontrei inconsistencias relevantes em contratos com as regras read-only atuais.")
}

export async function equipmentDiagnosisReadOnly(supabase: CosSupabaseClient) {
  const [equipment, contractEquipment, contracts, maintenance] = await Promise.all([
    safeSelectRows(supabase, "equipment"),
    safeSelectRows(supabase, "contract_equipment"),
    safeSelectRows(supabase, "contracts"),
    safeSelectRows(supabase, "maintenance_orders"),
  ])
  const activeContractIds = new Set(contracts.filter((row) => isActiveStatus(row.status)).map(rowId))
  const activeLinkedQuantity = new Map<string, number>()
  for (const item of contractEquipment) {
    if (!activeContractIds.has(String(item.contract_id ?? ""))) continue
    const equipmentId = String(item.equipment_id ?? "")
    activeLinkedQuantity.set(equipmentId, (activeLinkedQuantity.get(equipmentId) ?? 0) + asNumber(item.quantity ?? item.qty ?? 1))
  }

  const negativeStock = equipment.filter((row) => {
    const available = getNumericValue(row, ["quantity_available", "available_quantity", "available", "disponivel"])
    const total = getNumericValue(row, ["quantity", "total_quantity", "stock_quantity", "total"])
    const rented = getNumericValue(row, ["quantity_rented", "rented_quantity", "locado"])
    return available < 0 || (total > 0 && rented > total)
  })
  const rentedWithoutContract = equipment.filter((row) => {
    const rented = getNumericValue(row, ["quantity_rented", "rented_quantity", "locado"])
    const linked = activeLinkedQuantity.get(rowId(row)) ?? 0
    return rented > linked
  })
  const excessiveMaintenance = equipment.filter((row) => {
    const total = getNumericValue(row, ["quantity", "total_quantity", "stock_quantity", "total"])
    const maintenanceQuantity = getNumericValue(row, ["quantity_maintenance", "maintenance_quantity", "manutencao"])
    return maintenanceQuantity > 0 && (total === 0 || maintenanceQuantity / total >= 0.5)
  })
  const duplicateGroups = groupBy(equipment, (row) =>
    [normalizeText(row.name), normalizeText(row.serial_number ?? row.serial), normalizeText(row.model), normalizeText(row.configuration)].join("|")
  )
  const openMaintenance = maintenance.filter((row) => !["concluido", "cancelado", "fechado", "completed", "closed"].includes(normalizeText(row.status)))

  const diagnoses: OperationalDiagnosis[] = []

  if (negativeStock.length) {
    diagnoses.push({
      problem: `${negativeStock.length} equipamento(s) com estoque negativo ou locado acima do total.`,
      probableOrigin: "Quantidade locada/disponivel nao fecha com a quantidade total cadastrada.",
      modules: ["Equipamentos", "Estoque", "Contratos"],
      impact: "A empresa pode prometer equipamento inexistente ou manter locacao inconsistente.",
      severity: "Critica",
      nextStep: "Comparar contratos ativos e vinculos de equipamento antes de novas locacoes.",
      evidence: negativeStock.slice(0, 5).map((row) => equipmentName(row)),
    })
  }

  if (rentedWithoutContract.length) {
    diagnoses.push({
      problem: `${rentedWithoutContract.length} equipamento(s) com locacao maior que vinculos de contratos ativos.`,
      probableOrigin: "Quantidade locada salva nao bate com contract_equipment em contratos ativos.",
      modules: ["Equipamentos", "Contratos", "Estoque"],
      impact: "Disponibilidade pode estar subestimada ou contrato pode estar sem vinculo.",
      severity: "Alta",
      nextStep: "Investigar contratos ativos e vinculos de equipamento.",
      evidence: rentedWithoutContract.slice(0, 5).map((row) => equipmentName(row)),
    })
  }

  if (excessiveMaintenance.length) {
    diagnoses.push({
      problem: `${excessiveMaintenance.length} equipamento(s) com manutencao relevante frente ao total.`,
      probableOrigin: "Quantidade em manutencao representa parte alta do estoque cadastrado.",
      modules: ["Equipamentos", "Manutencoes", "Estoque"],
      impact: "Disponibilidade operacional pode estar reduzida.",
      severity: "Media",
      nextStep: "Analisar manutencoes abertas e impacto em contratos.",
      evidence: excessiveMaintenance.slice(0, 5).map((row) => equipmentName(row)),
    })
  }

  if (duplicateGroups.length) {
    diagnoses.push({
      problem: `${duplicateGroups.length} grupo(s) de equipamentos possivelmente duplicados.`,
      probableOrigin: "Equipamentos com nome, serial/modelo/configuracao semelhantes aparecem repetidos.",
      modules: ["Equipamentos", "Estoque", "Patrimonio"],
      impact: "Disponibilidade e patrimonio podem ficar distorcidos.",
      severity: "Alta",
      nextStep: "Revisar duplicidades antes de cadastrar ou vincular novos equipamentos.",
      evidence: duplicateGroups.slice(0, 5).map((group) => `${equipmentName(group[0])} (${group.length} ocorrencias)`),
    })
  }

  if (openMaintenance.length) {
    diagnoses.push({
      problem: `${openMaintenance.length} manutencao(oes) aberta(s) detectada(s).`,
      probableOrigin: "Existem ordens/chamados de manutencao sem encerramento.",
      modules: ["Manutencoes", "Equipamentos", "Contratos"],
      impact: "Pode afetar disponibilidade e atendimento.",
      severity: "Media",
      nextStep: "Verificar equipamentos afetados e prioridade das manutencoes.",
      evidence: openMaintenance.slice(0, 5).map((row) => rowDescription(row)),
    })
  }

  return composeDiagnosisReport("Diagnostico operacional de equipamentos e estoque", diagnoses, "Nao encontrei inconsistencias relevantes em equipamentos/estoque com as regras read-only atuais.")
}

export async function bankDiagnosisReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const [accounts, entries] = await Promise.all([safeSelectRows(supabase, "bank_accounts"), safeSelectRows(supabase, "financial_entries")])
  const monthEntries = entries.filter((row) => dateIsInMonth(row.payment_date ?? row.due_date ?? row.competence_date, period.year, period.month))
  const settled = monthEntries.filter((row) => isPaidStatus(row.status) || isReceivedStatus(row.status) || row.payment_date)
  const operational = settled.reduce((sum, row) => {
    const value = moneyFrom(row)
    return normalizeText(row.type) === "despesa" ? sum - value : sum + value
  }, 0)
  const bankBalance = accounts.reduce((sum, row) => sum + getNumericValue(row, ["current_balance", "balance", "saldo_atual"]), 0)
  const difference = bankBalance - operational
  const withoutAccount = settled.filter((row) => !row.bank_account_id)
  const withoutPaymentDate = monthEntries.filter((row) => (isPaidStatus(row.status) || isReceivedStatus(row.status)) && !row.payment_date)
  const candidates = settled
    .filter((row) => Math.abs(Math.abs(moneyFrom(row)) - Math.abs(difference)) < 0.01 || !row.bank_account_id || !row.payment_date)
    .slice(0, 5)

  const diagnoses: OperationalDiagnosis[] = []

  if (Math.abs(difference) > 0.01) {
    diagnoses.push({
      problem: `Diferenca de ${formatCurrency(difference)} entre saldo bancario cadastrado e movimento financeiro liquidado em ${monthLabel(period.month)}/${period.year}.`,
      probableOrigin: "Lancamentos sem conta, pagamentos sem data, periodo divergente ou saldo bancario defasado.",
      modules: ["Banco", "Financeiro", "Fechamento"],
      impact: "Fechamento e conciliacao bancaria ficam inseguros.",
      severity: "Critica",
      nextStep: "Revisar candidatos da diferenca e lancamentos sem conta/data.",
      evidence: candidates.map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
      timeline: ["Lancamento financeiro liquidado", "Conta bancaria deveria ser vinculada", "Saldo operacional e comparado ao saldo bancario", "Diferenca bloqueia fechamento se nao explicada"],
    })
  }

  if (withoutAccount.length) {
    diagnoses.push({
      problem: `${withoutAccount.length} lancamento(s) liquidado(s) sem conta bancaria.`,
      probableOrigin: "Pagamento/recebimento foi marcado sem conta.",
      modules: ["Financeiro", "Banco"],
      impact: "O saldo por conta pode ficar incompleto.",
      severity: "Alta",
      nextStep: "Vincular conta correta em etapa futura governada.",
      evidence: withoutAccount.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (withoutPaymentDate.length) {
    diagnoses.push({
      problem: `${withoutPaymentDate.length} lancamento(s) pago(s)/recebido(s) sem data.`,
      probableOrigin: "Status financeiro indica liquidacao, mas a data operacional nao foi registrada.",
      modules: ["Financeiro", "Banco"],
      impact: "O lancamento pode entrar no periodo errado de conciliacao.",
      severity: "Alta",
      nextStep: "Validar data de pagamento/recebimento em etapa futura governada.",
      evidence: withoutPaymentDate.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  return composeDiagnosisReport(
    "Diagnostico banco x financeiro",
    diagnoses,
    `Nao encontrei diferenca material entre banco e financeiro em ${monthLabel(period.month)}/${period.year} com as regras read-only atuais.`,
    [`Saldo bancario cadastrado: ${formatCurrency(bankBalance)}.\nMovimento operacional liquidado: ${formatCurrency(operational)}.`]
  )
}

export async function dreDiagnosisReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const [dre, financial, entries, adjustments, categories] = await Promise.all([
    getDreSummary(supabase, period.year, period.month),
    getFinancialSummary(supabase, period.year, period.month),
    safeSelectRows(supabase, "financial_entries"),
    safeSelectRows(supabase, "dre_manual_adjustments"),
    safeSelectRows(supabase, "dre_categories"),
  ])
  const monthEntries = entries.filter((row) => dateIsInMonth(row.competence_date ?? row.payment_date ?? row.due_date, period.year, period.month))
  const withoutCategory = monthEntries.filter((row) => !row.dre_category_id)
  const periodAdjustments = adjustments.filter((row) => {
    const year = Number(row.year ?? row.ano)
    const month = Number(row.month ?? row.mes)
    return year === period.year && month === period.month
  })
  const movedCategoryIds = new Set(monthEntries.map((row) => String(row.dre_category_id ?? "")).filter(Boolean))
  const emptyCategories = categories.filter((row) => row.id && !movedCategoryIds.has(String(row.id)) && !normalizeText(row.status).includes("inativ")).slice(0, 10)
  const resultDifference = dre.result - financial.result
  const diagnoses: OperationalDiagnosis[] = []

  if (Math.abs(resultDifference) > 0.01) {
    diagnoses.push({
      problem: `Diferenca de resultado de ${formatCurrency(resultDifference)} entre DRE e financeiro em ${monthLabel(period.month)}/${period.year}.`,
      probableOrigin: "Categorias, competencias, ajustes manuais ou filtros de origem podem estar divergentes.",
      modules: ["DRE", "Financeiro", "Dashboard"],
      impact: "Resultado operacional pode estar incorreto.",
      severity: "Critica",
      nextStep: "Comparar lancamentos por categoria e revisar ajustes manuais.",
      evidence: [
        `DRE (${dre.source}): resultado ${formatCurrency(dre.result)}`,
        `Financeiro: resultado ${formatCurrency(financial.result)}`,
      ],
      timeline: ["Financeiro registra receitas/despesas", "Categoria e competencia alimentam DRE", "DRE consolida resultado", "Dashboard deve refletir esse resultado"],
    })
  }

  if (withoutCategory.length) {
    diagnoses.push({
      problem: `${withoutCategory.length} lancamento(s) sem categoria DRE.`,
      probableOrigin: "Lancamentos financeiros relevantes nao foram classificados.",
      modules: ["Financeiro", "DRE", "Fechamento"],
      impact: "Receitas/despesas podem ficar fora da leitura gerencial.",
      severity: "Alta",
      nextStep: "Classificar lancamentos na origem em fase futura aprovada.",
      evidence: withoutCategory.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (periodAdjustments.length) {
    diagnoses.push({
      problem: `${periodAdjustments.length} ajuste(s) manual(is) de DRE no periodo.`,
      probableOrigin: "A DRE possui ajuste fora do fluxo financeiro direto.",
      modules: ["DRE", "Financeiro", "Fechamento"],
      impact: "Ajuste pode explicar diferenca ou mascarar problema de origem.",
      severity: "Alta",
      nextStep: "Validar motivo, responsavel e evidencia de cada ajuste.",
      evidence: periodAdjustments.slice(0, 5).map((row) => `${rowDescription(row)} - ${formatCurrency(moneyFrom(row))}`),
    })
  }

  if (emptyCategories.length) {
    diagnoses.push({
      problem: `${emptyCategories.length} categoria(s) DRE sem movimento no periodo.`,
      probableOrigin: "Categorias ativas nao receberam lancamentos em competencia analisada.",
      modules: ["DRE", "Financeiro"],
      impact: "Pode ser normal, mas ajuda a localizar classificacoes ausentes.",
      severity: "Baixa",
      nextStep: "Conferir se categorias esperadas deveriam ter movimento.",
      evidence: emptyCategories.slice(0, 5).map((row) => String(row.name ?? row.description ?? row.id)),
    })
  }

  return composeDiagnosisReport(
    "Diagnostico DRE x financeiro",
    diagnoses,
    `Nao encontrei divergencias relevantes entre DRE e financeiro em ${monthLabel(period.month)}/${period.year} com as regras read-only atuais.`
  )
}

export async function dashboardDiagnosisReadOnly(supabase: CosSupabaseClient, message: string) {
  const dreReport = await dreDiagnosisReadOnly(supabase, message)
  const diagnoses = dreReport.diagnoses.map((diagnosis) => ({
    ...diagnosis,
    modules: Array.from(new Set([...diagnosis.modules, "Dashboard"])),
    impact: `${diagnosis.impact} O Dashboard pode propagar essa leitura se usar a mesma fonte.`,
  }))

  if (!diagnoses.length) {
    diagnoses.push({
      problem: "Nao encontrei divergencia confirmada de Dashboard nas fontes read-only atuais.",
      probableOrigin: "A origem do indicador precisa ser identificada por card/view especifico para uma conclusao mais precisa.",
      modules: ["Dashboard", "DRE", "Financeiro"],
      impact: "Sem o indicador especifico, a analise fica limitada a consistencia DRE x Financeiro.",
      severity: "Baixa",
      nextStep: "Informar qual card/indicador do dashboard deve ser rastreado.",
    })
  }

  return composeDiagnosisReport("Diagnostico Dashboard x fontes", diagnoses, "Dashboard sem divergencias detectadas nas fontes read-only atuais.")
}

export async function closingDiagnosisReadOnly(supabase: CosSupabaseClient, message: string) {
  const period = parseRequestedPeriod(message)
  const [financial, contracts, equipment, bank, dre, dashboard] = await Promise.all([
    financialDiagnosisReadOnly(supabase, message),
    contractDiagnosisReadOnly(supabase, message),
    equipmentDiagnosisReadOnly(supabase),
    bankDiagnosisReadOnly(supabase, message),
    dreDiagnosisReadOnly(supabase, message),
    dashboardDiagnosisReadOnly(supabase, message),
  ])
  const diagnoses = [...financial.diagnoses, ...contracts.diagnoses, ...equipment.diagnoses, ...bank.diagnoses, ...dre.diagnoses, ...dashboard.diagnoses]
  const critical = diagnoses.filter((diagnosis) => diagnosis.severity === "Critica")
  const high = diagnoses.filter((diagnosis) => diagnosis.severity === "Alta")
  const status = critical.length
    ? `Nao recomendo fechar ${monthLabel(period.month)}/${period.year}. Existem ${critical.length} divergencia(s) critica(s).`
    : high.length
      ? `Fechamento de ${monthLabel(period.month)}/${period.year} exige revisao: encontrei ${high.length} ponto(s) de alta criticidade.`
      : `Fechamento de ${monthLabel(period.month)}/${period.year} nao apresentou bloqueio critico nas regras read-only atuais.`

  return composeDiagnosisReport(
    "Diagnostico consolidado de fechamento",
    diagnoses,
    status,
    [`Status do fechamento: ${status}\nNada foi fechado ou alterado. Este resultado e apenas diagnostico read-only.`]
  )
}

export async function operationalHealthReadOnly(supabase: CosSupabaseClient, message: string) {
  const [clients, contracts, equipment, financialEntries, financial, contract, stock, bank, dre] = await Promise.all([
    safeSelectRows(supabase, "clients"),
    safeSelectRows(supabase, "contracts"),
    safeSelectRows(supabase, "equipment"),
    safeSelectRows(supabase, "financial_entries"),
    financialDiagnosisReadOnly(supabase, message),
    contractDiagnosisReadOnly(supabase, message),
    equipmentDiagnosisReadOnly(supabase),
    bankDiagnosisReadOnly(supabase, message),
    dreDiagnosisReadOnly(supabase, message),
  ])
  const diagnoses = [...financial.diagnoses, ...contract.diagnoses, ...stock.diagnoses, ...bank.diagnoses, ...dre.diagnoses]
  const moduleHealth = [
    clients.length ? `Clientes: Health Score ainda nao disponivel para este modulo nesta sprint.` : "Clientes: sem base suficiente para calcular.",
    contracts.length
      ? `Contratos: ${Math.max(0, Math.round(100 - (contract.diagnoses.length / Math.max(contracts.length, 1)) * 100))}% com base em inconsistencias detectadas.`
      : "Contratos: sem contratos para calcular.",
    financialEntries.length
      ? `Financeiro: ${Math.max(0, Math.round(100 - (financial.diagnoses.length / Math.max(financialEntries.length, 1)) * 100))}% com base em inconsistencias detectadas.`
      : "Financeiro: sem lancamentos para calcular.",
    equipment.length
      ? `Estoque: ${Math.max(0, Math.round(100 - (stock.diagnoses.length / Math.max(equipment.length, 1)) * 100))}% com base em inconsistencias detectadas.`
      : "Estoque: sem equipamentos para calcular.",
    "Banco: Health Score ainda nao disponivel para este modulo; use o diagnostico de conciliacao.",
    "DRE: Health Score ainda nao disponivel para este modulo; use DRE x Financeiro.",
    diagnoses.some((diagnosis) => diagnosis.severity === "Critica") ? "Fechamento: Pendente por divergencias criticas." : "Fechamento: sem bloqueio critico detectado nesta leitura.",
  ]

  return composeDiagnosisReport(
    "Saude operacional read-only",
    diagnoses,
    "Nao encontrei problemas operacionais relevantes nas regras read-only atuais.",
    [`Health Score inicial:\n${moduleHealth.map((item) => `- ${item}`).join("\n")}`]
  )
}
