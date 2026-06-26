import {
  formatCurrency,
  formatDate,
  getNumericValue,
  isActiveStatus,
  isPaidStatus,
  isReceivedStatus,
  normalizeText,
  selectCosRows,
  type CosSupabaseClient,
} from "@/lib/cos/cos-context"
import type { ReadOnlyOperationalContext } from "@/lib/cos/read-only-context"
import { resolveEntityCandidatesReadOnly } from "@/lib/cos/read-only-deep-search"
import type { SupabaseRow } from "@/lib/supabase/types"

type GraphEntityType = "client" | "contract" | "equipment" | "financial"

type GraphTarget = {
  type: GraphEntityType
  id: string
  name: string
}

type RelatedRecords = {
  clients: SupabaseRow[]
  contracts: SupabaseRow[]
  contractEquipment: SupabaseRow[]
  equipment: SupabaseRow[]
  financial: SupabaseRow[]
  documents: SupabaseRow[]
  legal: SupabaseRow[]
  maintenance: SupabaseRow[]
  dreCategories: SupabaseRow[]
}

function rowId(row: SupabaseRow) {
  return String(row.id ?? "")
}

function rowName(row: SupabaseRow) {
  return String(row.name ?? row.legal_name ?? row.company_name ?? row.fantasy_name ?? row.description ?? row.contract_number ?? row.number ?? row.id ?? "sem nome")
}

function contractNumber(row: SupabaseRow) {
  return String(row.contract_number ?? row.number ?? row.numero ?? row.id ?? "sem numero")
}

function rowValue(row: SupabaseRow) {
  return getNumericValue(row, ["value", "amount", "valor", "monthly_value", "total_value", "original_value", "updated_value"])
}

function isOpenFinancial(row: SupabaseRow) {
  return !isPaidStatus(row.status) && !isReceivedStatus(row.status)
}

async function safeSelectRows(supabase: CosSupabaseClient, table: string) {
  try {
    return await selectCosRows(supabase, table)
  } catch {
    return []
  }
}

async function loadGraphTables(supabase: CosSupabaseClient): Promise<RelatedRecords> {
  const [clients, contracts, contractEquipment, equipment, financial, documents, legal, maintenance, dreCategories] = await Promise.all([
    safeSelectRows(supabase, "clients"),
    safeSelectRows(supabase, "contracts"),
    safeSelectRows(supabase, "contract_equipment"),
    safeSelectRows(supabase, "equipment"),
    safeSelectRows(supabase, "financial_entries"),
    safeSelectRows(supabase, "documents"),
    safeSelectRows(supabase, "legal_cases"),
    safeSelectRows(supabase, "maintenance_orders"),
    safeSelectRows(supabase, "dre_categories"),
  ])

  return {
    clients,
    contracts,
    contractEquipment,
    equipment,
    financial,
    documents,
    legal,
    maintenance,
    dreCategories,
  }
}

function detectGraphTarget(context?: ReadOnlyOperationalContext): GraphTarget | null {
  if (context?.activeContract) return { type: "contract", id: context.activeContract.id, name: context.activeContract.name }
  if (context?.activeEquipment) return { type: "equipment", id: context.activeEquipment.id, name: context.activeEquipment.name }
  if (context?.activeClient) return { type: "client", id: context.activeClient.id, name: context.activeClient.name }
  return null
}

async function resolveTargetFromMessage(
  supabase: CosSupabaseClient,
  message: string,
  context?: ReadOnlyOperationalContext
): Promise<GraphTarget | null> {
  const text = normalizeText(message)
  const contextTarget = detectGraphTarget(context)
  if (contextTarget && (text.includes("este") || text.includes("esse") || text.includes("relacionado") || text.includes("timeline") || text.includes("impact") || text.includes("depende"))) {
    return contextTarget
  }

  const typeOrder: GraphEntityType[] = text.includes("equipamento")
    ? ["equipment", "contract", "client", "financial"]
    : text.includes("contrato")
      ? ["contract", "client", "financial", "equipment"]
      : text.includes("financeiro") || text.includes("receita") || text.includes("despesa")
        ? ["financial", "contract", "client", "equipment"]
        : ["client", "contract", "equipment", "financial"]

  for (const type of typeOrder) {
    const candidates = await resolveEntityCandidatesReadOnly(supabase, type, message, context, 1)
    if (candidates.length) return { type, id: candidates[0].id, name: candidates[0].name }
  }

  return contextTarget
}

function relatedForClient(target: GraphTarget, data: RelatedRecords) {
  const contracts = data.contracts.filter((row) => String(row.client_id ?? row.customer_id ?? "") === target.id)
  const contractIds = new Set(contracts.map(rowId))
  const contractEquipment = data.contractEquipment.filter((row) => contractIds.has(String(row.contract_id ?? "")))
  const equipmentIds = new Set(contractEquipment.map((row) => String(row.equipment_id ?? "")))
  const equipment = data.equipment.filter((row) => equipmentIds.has(rowId(row)))
  const financial = data.financial.filter((row) => String(row.client_id ?? row.customer_id ?? "") === target.id || contractIds.has(String(row.contract_id ?? "")))
  const documents = data.documents.filter((row) => String(row.client_id ?? row.customer_id ?? "") === target.id || contractIds.has(String(row.contract_id ?? "")))
  const legal = data.legal.filter((row) => String(row.client_id ?? row.customer_id ?? "") === target.id || contractIds.has(String(row.contract_id ?? "")))
  const maintenance = data.maintenance.filter((row) => equipmentIds.has(String(row.equipment_id ?? "")) || contractIds.has(String(row.contract_id ?? "")))
  return { contracts, contractEquipment, equipment, financial, documents, legal, maintenance }
}

function relatedForContract(target: GraphTarget, data: RelatedRecords) {
  const contract = data.contracts.find((row) => rowId(row) === target.id)
  const clientId = String(contract?.client_id ?? contract?.customer_id ?? "")
  const clients = data.clients.filter((row) => rowId(row) === clientId)
  const contractEquipment = data.contractEquipment.filter((row) => String(row.contract_id ?? "") === target.id)
  const equipmentIds = new Set(contractEquipment.map((row) => String(row.equipment_id ?? "")))
  const equipment = data.equipment.filter((row) => equipmentIds.has(rowId(row)))
  const financial = data.financial.filter((row) => String(row.contract_id ?? "") === target.id)
  const documents = data.documents.filter((row) => String(row.contract_id ?? "") === target.id)
  const legal = data.legal.filter((row) => String(row.contract_id ?? "") === target.id || (clientId && String(row.client_id ?? row.customer_id ?? "") === clientId))
  const maintenance = data.maintenance.filter((row) => equipmentIds.has(String(row.equipment_id ?? "")) || String(row.contract_id ?? "") === target.id)
  return { contract, clients, contractEquipment, equipment, financial, documents, legal, maintenance }
}

function relatedForEquipment(target: GraphTarget, data: RelatedRecords) {
  const equipment = data.equipment.find((row) => rowId(row) === target.id)
  const contractEquipment = data.contractEquipment.filter((row) => String(row.equipment_id ?? "") === target.id)
  const contractIds = new Set(contractEquipment.map((row) => String(row.contract_id ?? "")))
  const contracts = data.contracts.filter((row) => contractIds.has(rowId(row)))
  const clientIds = new Set(contracts.map((row) => String(row.client_id ?? row.customer_id ?? "")).filter(Boolean))
  const clients = data.clients.filter((row) => clientIds.has(rowId(row)))
  const financial = data.financial.filter((row) => contractIds.has(String(row.contract_id ?? "")))
  const documents = data.documents.filter((row) => String(row.equipment_id ?? "") === target.id || contractIds.has(String(row.contract_id ?? "")))
  const maintenance = data.maintenance.filter((row) => String(row.equipment_id ?? "") === target.id)
  return { equipment, contractEquipment, contracts, clients, financial, documents, maintenance }
}

function relatedForFinancial(target: GraphTarget, data: RelatedRecords) {
  const entry = data.financial.find((row) => rowId(row) === target.id)
  const contractId = String(entry?.contract_id ?? "")
  const clientId = String(entry?.client_id ?? entry?.customer_id ?? "")
  const contracts = data.contracts.filter((row) => rowId(row) === contractId)
  const clients = data.clients.filter((row) => rowId(row) === clientId || rowId(row) === String(contracts[0]?.client_id ?? contracts[0]?.customer_id ?? ""))
  const documents = data.documents.filter((row) => String(row.financial_entry_id ?? row.entry_id ?? "") === target.id || (contractId && String(row.contract_id ?? "") === contractId))
  const dreCategories = data.dreCategories.filter((row) => rowId(row) === String(entry?.dre_category_id ?? ""))
  return { entry, contracts, clients, documents, dreCategories }
}

function listSample(rows: SupabaseRow[], formatter: (row: SupabaseRow) => string, limit = 5) {
  if (!rows.length) return "- nenhum registro encontrado"
  return rows.slice(0, limit).map((row) => `- ${formatter(row)}`).join("\n")
}

function dependencyGraphFor(type: GraphEntityType) {
  if (type === "contract") {
    return [
      "Contrato -> Cliente: define a entidade operacional responsavel.",
      "Contrato -> Equipamentos/Estoque: locacao consome disponibilidade.",
      "Contrato -> Financeiro: gera parcelas ou receitas previstas.",
      "Contrato -> DRE/Dashboard: receita classificada alimenta indicadores.",
      "Contrato -> Documentos/Juridico: sustenta auditoria, cobranca e risco.",
    ]
  }

  if (type === "equipment") {
    return [
      "Equipamento -> Estoque: define disponibilidade real.",
      "Equipamento -> Contratos: pode estar locado ou disponivel.",
      "Equipamento -> Manutencoes: pode reduzir disponibilidade.",
      "Equipamento -> Patrimonio: pode representar ativo da empresa.",
      "Equipamento -> Financeiro: gera receita quando vinculado a locacao.",
    ]
  }

  if (type === "financial") {
    return [
      "Financeiro -> Cliente/Contrato: preserva rastreabilidade da origem.",
      "Financeiro -> Banco: pagamentos/recebimentos entram na conciliacao.",
      "Financeiro -> DRE: categoria e competencia formam resultado.",
      "Financeiro -> Dashboard: alimenta indicadores gerenciais.",
      "Financeiro -> Fechamento: pendencias bloqueiam conclusao segura.",
    ]
  }

  return [
    "Cliente -> Contratos: concentra relacoes comerciais.",
    "Cliente -> Equipamentos: recebe locacoes por meio dos contratos.",
    "Cliente -> Financeiro: gera receitas, pendencias e inadimplencia.",
    "Cliente -> Documentos/Juridico: sustenta auditoria e cobranca.",
    "Cliente -> DRE/Dashboard: impacta receita e indicadores consolidados.",
  ]
}

function graphStatus(missingLinks: string[]) {
  if (!missingLinks.length) return "Fluxo completo nas relacoes verificadas."
  if (missingLinks.some((item) => normalizeText(item).includes("sem financeiro") || normalizeText(item).includes("sem cliente"))) {
    return "Fluxo inconsistente: ha vinculos essenciais ausentes."
  }
  return "Fluxo incompleto: existem relacoes recomendadas ausentes."
}

function timelineFromRelated(type: GraphEntityType, related: ReturnType<typeof relatedForClient> | ReturnType<typeof relatedForContract> | ReturnType<typeof relatedForEquipment> | ReturnType<typeof relatedForFinancial>) {
  const events: string[] = []
  const contracts = "contracts" in related ? related.contracts : related.contract ? [related.contract].filter(Boolean) : []
  const equipment = "equipment" in related ? (Array.isArray(related.equipment) ? related.equipment : [related.equipment].filter(Boolean)) : []
  const financial = "financial" in related ? related.financial : related.entry ? [related.entry].filter(Boolean) : []
  const documents = "documents" in related ? related.documents : []
  const maintenance = "maintenance" in related ? related.maintenance : []

  if (type === "client") events.push("Cliente localizado como entidade principal.")
  if (type === "contract") events.push("Contrato localizado como entidade principal.")
  if (type === "equipment") events.push("Equipamento localizado como entidade principal.")
  if (type === "financial") events.push("Lancamento financeiro localizado como entidade principal.")

  if (contracts.length) {
    events.push(`${contracts.length} contrato(s) relacionado(s) encontrado(s).`)
  } else {
    events.push("Contrato relacionado ausente ou nao encontrado.")
  }

  if (equipment.length) {
    events.push(`${equipment.length} equipamento(s) relacionado(s) encontrado(s).`)
  } else if (type !== "financial") {
    events.push("Equipamento relacionado ausente ou nao aplicavel.")
  }

  if (financial.length) {
    const received = financial.filter((row) => isPaidStatus(row.status) || isReceivedStatus(row.status)).length
    events.push(`${financial.length} lancamento(s) financeiro(s) relacionado(s), ${received} liquidado(s).`)
  } else {
    events.push("Financeiro relacionado ausente.")
  }

  if (documents.length) {
    events.push(`${documents.length} documento(s) relacionado(s) encontrado(s).`)
  } else {
    events.push("Documento relacionado ausente.")
  }

  if (maintenance.length) {
    events.push(`${maintenance.length} manutencao(oes) relacionada(s) encontrada(s).`)
  }

  events.push("DRE e Dashboard dependem dos lancamentos financeiros classificados por competencia.")
  events.push("Situacao atual calculada somente por leitura; nenhuma relacao foi criada ou corrigida.")
  return events
}

function missingLinksForClient(related: ReturnType<typeof relatedForClient>) {
  const missing = []
  const activeContracts = related.contracts.filter((row) => isActiveStatus(row.status))
  const financialContractIds = new Set(related.financial.map((row) => String(row.contract_id ?? "")).filter(Boolean))
  const equipmentContractIds = new Set(related.contractEquipment.map((row) => String(row.contract_id ?? "")).filter(Boolean))
  for (const contract of activeContracts) {
    const contractId = rowId(contract)
    if (!financialContractIds.has(contractId)) missing.push(`Contrato ${contractNumber(contract)} ativo sem financeiro vinculado.`)
    if (normalizeText(contract.type ?? contract.contract_type).includes("loc") && !equipmentContractIds.has(contractId)) {
      missing.push(`Contrato ${contractNumber(contract)} de locacao sem equipamento vinculado.`)
    }
  }
  if (!related.documents.length) missing.push("Cliente sem documentos vinculados encontrados.")
  return missing
}

function missingLinksForContract(related: ReturnType<typeof relatedForContract>) {
  const missing = []
  if (!related.clients.length) missing.push("Contrato sem cliente resolvido.")
  if (!related.financial.length) missing.push("Contrato sem financeiro vinculado.")
  if (normalizeText(related.contract?.type ?? related.contract?.contract_type).includes("loc") && !related.equipment.length) {
    missing.push("Contrato de locacao sem equipamento vinculado.")
  }
  if (!related.documents.length) missing.push("Contrato sem documento vinculado.")
  return missing
}

function missingLinksForEquipment(related: ReturnType<typeof relatedForEquipment>) {
  const missing = []
  const rented = getNumericValue(related.equipment ?? {}, ["quantity_rented", "rented_quantity", "locado"])
  if (rented > 0 && !related.contracts.some((row) => isActiveStatus(row.status))) missing.push("Equipamento marcado como locado sem contrato ativo relacionado.")
  if (!related.contracts.length) missing.push("Equipamento sem contrato relacionado.")
  return missing
}

function missingLinksForFinancial(related: ReturnType<typeof relatedForFinancial>) {
  const missing = []
  if (!related.clients.length) missing.push("Lancamento financeiro sem cliente resolvido.")
  if (normalizeText(related.entry?.type).includes("receita") && !related.contracts.length) missing.push("Receita sem contrato de origem.")
  if (!related.dreCategories.length) missing.push("Lancamento financeiro sem categoria DRE resolvida.")
  if (!related.documents.length && (isPaidStatus(related.entry?.status) || isReceivedStatus(related.entry?.status))) missing.push("Lancamento liquidado sem comprovante/documento relacionado.")
  return missing
}

export async function missingLinksReadOnly(supabase: CosSupabaseClient) {
  const data = await loadGraphTables(supabase)
  const missing = [
    ...data.contracts.filter((row) => !row.client_id && !row.customer_id).map((row) => `Contrato ${contractNumber(row)} sem cliente.`),
    ...data.contracts
      .filter((row) => isActiveStatus(row.status) && !data.financial.some((entry) => String(entry.contract_id ?? "") === rowId(row)))
      .map((row) => `Contrato ${contractNumber(row)} ativo sem financeiro.`),
    ...data.contracts
      .filter((row) => normalizeText(row.type ?? row.contract_type).includes("loc") && !data.contractEquipment.some((item) => String(item.contract_id ?? "") === rowId(row)))
      .map((row) => `Contrato ${contractNumber(row)} de locacao sem equipamento.`),
    ...data.financial.filter((row) => !row.client_id && !row.customer_id).map((row) => `Financeiro ${rowName(row)} sem cliente.`),
    ...data.financial.filter((row) => normalizeText(row.type).includes("receita") && !row.contract_id).map((row) => `Receita ${rowName(row)} sem contrato.`),
    ...data.financial.filter((row) => !row.dre_category_id).map((row) => `Financeiro ${rowName(row)} sem categoria DRE.`),
    ...data.documents
      .filter((row) => !row.client_id && !row.contract_id && !row.financial_entry_id && !row.equipment_id && !row.legal_case_id)
      .map((row) => `Documento ${rowName(row)} sem vinculo operacional.`),
  ]

  return {
    title: "Relacionamentos quebrados",
    answer: missing.length
      ? [
          `Encontrei ${missing.length} relacionamento(s) ausente(s) em modo read-only.`,
          "",
          "Vinculos ausentes:",
          ...missing.slice(0, 25).map((item) => `- ${item}`),
          "",
          "Nada foi corrigido. O proximo passo seguro e analisar a origem de cada vinculo antes de qualquer acao futura.",
        ].join("\n")
      : "Nao encontrei relacionamentos quebrados nas regras read-only atuais.",
  }
}

export async function relationshipGraphReadOnly(
  supabase: CosSupabaseClient,
  message: string,
  context?: ReadOnlyOperationalContext
) {
  if (normalizeText(message).includes("quebrad") || normalizeText(message).includes("sem vinculo") || normalizeText(message).includes("sem vinculo")) {
    return missingLinksReadOnly(supabase)
  }

  const target = await resolveTargetFromMessage(supabase, message, context)
  if (!target) {
    return {
      title: "Grafo operacional",
      answer: "Nao encontrei entidade suficiente para montar o grafo. Informe cliente, contrato, equipamento, financeiro ou use uma entidade ativa no contexto.",
    }
  }

  const data = await loadGraphTables(supabase)
  const text = normalizeText(message)
  const wantsImpact = text.includes("impact") || text.includes("depende") || text.includes("afeta") || text.includes("acontece se")
  const wantsTimeline = text.includes("timeline") || text.includes("linha do tempo") || text.includes("historia") || text.includes("historia")

  if (target.type === "client") {
    const client = data.clients.find((row) => rowId(row) === target.id)
    const related = relatedForClient(target, data)
    const missing = missingLinksForClient(related)
    const activeContracts = related.contracts.filter((row) => isActiveStatus(row.status))
    const recurringRevenue = activeContracts.reduce((sum, row) => sum + rowValue(row), 0)
    const openFinancial = related.financial.filter(isOpenFinancial)
    const lines = [
      `Entidade: Cliente - ${client ? rowName(client) : target.name}`,
      `Status: ${String(client?.status ?? "sem status")}`,
      `Cidade: ${String(client?.city ?? client?.state ?? "nao informada")}`,
      "",
      "Registros relacionados:",
      `- Contratos: ${related.contracts.length} (${activeContracts.length} ativos)`,
      `- Equipamentos vinculados: ${related.equipment.length}`,
      `- Financeiro: ${related.financial.length} lancamento(s), ${openFinancial.length} em aberto`,
      `- Receita recorrente estimada por contratos ativos: ${formatCurrency(recurringRevenue)}`,
      `- Documentos: ${related.documents.length}`,
      `- Juridico: ${related.legal.length}`,
      `- Manutencoes relacionadas: ${related.maintenance.length}`,
      "",
      "Contratos principais:",
      listSample(related.contracts, (row) => `${contractNumber(row)} - ${String(row.status ?? "sem status")} - ${formatDate(row.end_date ?? row.final_date)}`),
      "",
      "Pendencias de vinculo:",
      missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- nenhuma pendencia critica de vinculo encontrada",
      "",
      `Timeline Health: ${graphStatus(missing)}`,
    ]
    if (wantsTimeline || !wantsImpact) lines.push("", "Timeline operacional:", ...timelineFromRelated("client", related).map((item) => `- ${item}`))
    if (wantsImpact) lines.push("", "Dependency Graph:", ...dependencyGraphFor("client").map((item) => `- ${item}`))
    return { title: "Entity Explorer - Cliente", answer: lines.join("\n") }
  }

  if (target.type === "contract") {
    const related = relatedForContract(target, data)
    const missing = missingLinksForContract(related)
    const openFinancial = related.financial.filter(isOpenFinancial)
    const lines = [
      `Entidade: Contrato - ${related.contract ? contractNumber(related.contract) : target.name}`,
      `Status: ${String(related.contract?.status ?? "sem status")}`,
      `Cliente: ${related.clients[0] ? rowName(related.clients[0]) : "nao resolvido"}`,
      "",
      "Registros relacionados:",
      `- Equipamentos: ${related.equipment.length}`,
      `- Financeiro: ${related.financial.length} lancamento(s), ${openFinancial.length} em aberto`,
      `- Documentos: ${related.documents.length}`,
      `- Juridico: ${related.legal.length}`,
      `- Manutencoes: ${related.maintenance.length}`,
      "",
      "Equipamentos vinculados:",
      listSample(related.equipment, (row) => `${rowName(row)} - ${String(row.status ?? "sem status")}`),
      "",
      "Financeiro relacionado:",
      listSample(related.financial, (row) => `${rowName(row)} - ${formatCurrency(rowValue(row))} - ${String(row.status ?? "sem status")}`),
      "",
      "Pendencias de vinculo:",
      missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- nenhuma pendencia critica de vinculo encontrada",
      "",
      `Timeline Health: ${graphStatus(missing)}`,
    ]
    if (wantsTimeline || !wantsImpact) lines.push("", "Timeline operacional:", ...timelineFromRelated("contract", related).map((item) => `- ${item}`))
    if (wantsImpact) lines.push("", "Dependency Graph:", ...dependencyGraphFor("contract").map((item) => `- ${item}`))
    return { title: "Entity Explorer - Contrato", answer: lines.join("\n") }
  }

  if (target.type === "equipment") {
    const related = relatedForEquipment(target, data)
    const missing = missingLinksForEquipment(related)
    const lines = [
      `Entidade: Equipamento - ${related.equipment ? rowName(related.equipment) : target.name}`,
      `Status: ${String(related.equipment?.status ?? "sem status")}`,
      "",
      "Registros relacionados:",
      `- Contratos: ${related.contracts.length}`,
      `- Clientes: ${related.clients.length}`,
      `- Financeiro por contratos: ${related.financial.length}`,
      `- Documentos: ${related.documents.length}`,
      `- Manutencoes: ${related.maintenance.length}`,
      "",
      "Quem utiliza:",
      listSample(related.clients, (row) => rowName(row)),
      "",
      "Contratos vinculados:",
      listSample(related.contracts, (row) => `${contractNumber(row)} - ${String(row.status ?? "sem status")}`),
      "",
      "Pendencias de vinculo:",
      missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- nenhuma pendencia critica de vinculo encontrada",
      "",
      `Timeline Health: ${graphStatus(missing)}`,
    ]
    if (wantsTimeline || !wantsImpact) lines.push("", "Timeline operacional:", ...timelineFromRelated("equipment", related).map((item) => `- ${item}`))
    if (wantsImpact) lines.push("", "Dependency Graph:", ...dependencyGraphFor("equipment").map((item) => `- ${item}`))
    return { title: "Entity Explorer - Equipamento", answer: lines.join("\n") }
  }

  const related = relatedForFinancial(target, data)
  const missing = missingLinksForFinancial(related)
  const lines = [
    `Entidade: Financeiro - ${related.entry ? rowName(related.entry) : target.name}`,
    `Valor: ${related.entry ? formatCurrency(rowValue(related.entry)) : "nao informado"}`,
    `Status: ${String(related.entry?.status ?? "sem status")}`,
    "",
    "Origem e impactos:",
    `- Cliente: ${related.clients[0] ? rowName(related.clients[0]) : "nao resolvido"}`,
    `- Contrato: ${related.contracts[0] ? contractNumber(related.contracts[0]) : "nao resolvido"}`,
    `- Categoria DRE: ${related.dreCategories[0] ? rowName(related.dreCategories[0]) : "nao resolvida"}`,
    `- Documentos: ${related.documents.length}`,
    "",
    "Pendencias de vinculo:",
    missing.length ? missing.map((item) => `- ${item}`).join("\n") : "- nenhuma pendencia critica de vinculo encontrada",
    "",
    `Timeline Health: ${graphStatus(missing)}`,
  ]
  if (wantsTimeline || !wantsImpact) lines.push("", "Timeline operacional:", ...timelineFromRelated("financial", related).map((item) => `- ${item}`))
  if (wantsImpact) lines.push("", "Dependency Graph:", ...dependencyGraphFor("financial").map((item) => `- ${item}`))
  return { title: "Entity Explorer - Financeiro", answer: lines.join("\n") }
}
