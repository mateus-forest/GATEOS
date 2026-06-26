import { normalizeText, type CosAnswer, type CosSupabaseClient } from "@/lib/cos/cos-context"
import { READ_ONLY_CAPABILITY_SOURCES, type ReadOnlyCapability } from "@/lib/cos/read-only-capabilities"
import {
  getReadOnlyContext,
  resetReadOnlyContext,
  resolvePendingSelection,
  saveReadOnlyContext,
  setActiveClient,
  setActiveFocus,
  setPendingResolution,
  shouldResetReadOnlyContext,
} from "@/lib/cos/read-only-context"
import { detectReadOnlyBlockedIntent } from "@/lib/cos/read-only-guardrail"
import {
  composeAmbiguityResponse,
  composeReadOnlyResponse,
  defaultClientSuggestions,
  defaultContractSuggestions,
} from "@/lib/cos/read-only-response-composer"
import {
  clientRefFromRow,
  explainSystemReadOnly,
  searchClientsReadOnly,
  searchContractsReadOnly,
  searchDocumentsReadOnly,
  searchEquipmentReadOnly,
  searchFinancialReadOnly,
} from "@/lib/cos/read-only-tools"
import {
  bankDiagnosisReadOnly,
  closingDiagnosisReadOnly,
  contractDiagnosisReadOnly,
  dashboardDiagnosisReadOnly,
  dreDiagnosisReadOnly,
  equipmentDiagnosisReadOnly,
  financialDiagnosisReadOnly,
  operationalHealthReadOnly,
} from "@/lib/cos/read-only-diagnosis"

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function asAnswer(capability: ReadOnlyCapability, title: string, answer: string): CosAnswer {
  return {
    intent: "read_only_foundation",
    sources: READ_ONLY_CAPABILITY_SOURCES[capability],
    answer: `${title}\n\n${answer}`,
  }
}

function asComposedAnswer(
  capability: ReadOnlyCapability,
  input: Parameters<typeof composeReadOnlyResponse>[0]
): CosAnswer {
  return {
    intent: "read_only_foundation",
    sources: READ_ONLY_CAPABILITY_SOURCES[capability],
    answer: composeReadOnlyResponse(input),
  }
}

function detectContextualNavigation(message: string, hasActiveClient: boolean): ReadOnlyCapability | null {
  const text = normalizeText(message)
  const monthOnly = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ].some((month) => text.includes(month))

  if (!hasActiveClient) return null

  if (monthOnly && hasAny(text, ["agora", "ver", "mostre", "mostrar"])) return "financial_search"
  if (hasAny(text, ["agora contratos", "ver contratos", "contratos", "ativos", "vencidos", "vencendo"])) return "contract_search"
  if (hasAny(text, ["agora equipamentos", "ver equipamentos", "equipamentos", "estoque"])) return "equipment_search"
  if (hasAny(text, ["agora financeiro", "ver financeiro", "financeiro", "receitas", "despesas", "em aberto"])) return "financial_search"
  if (hasAny(text, ["agora documentos", "ver documentos", "documentos", "arquivos"])) return "document_search"
  if (hasAny(text, ["agora dre", "ver dre", "dre"])) return "dre_diagnosis"
  if (hasAny(text, ["agora dashboard", "ver dashboard", "dashboard"])) return "dashboard_diagnosis"

  return null
}

function detectReadOnlyCapability(message: string): ReadOnlyCapability | null {
  const text = normalizeText(message)

  if (hasAny(text, ["banco nao bate", "saldo nao bate", "conciliar banco", "banco x financeiro", "diferenca de saldo"])) {
    return "bank_reconciliation_diagnosis"
  }

  if (
    hasAny(text, [
      "maiores problemas",
      "problemas operacionais",
      "onde devo comecar",
      "onde devo começar",
      "saude operacional",
      "saúde operacional",
      "health score",
      "diagnostico geral",
      "diagnóstico geral",
    ])
  ) {
    return "operational_health"
  }

  if (hasAny(text, ["o que falta para fechar", "checklist de fechamento", "validar fechamento", "pendencias para fechar", "posso fechar", "impede fechar"])) {
    return "monthly_closing_diagnosis"
  }

  if (
    hasAny(text, ["financeiro esta consistente", "financeiro está consistente", "financeiro consistente", "lancamento duplicado", "lancamentos duplicados", "sem categoria", "sem conta bancaria", "sem conta bancária", "competencia incorreta", "competência incorreta"]) ||
    (hasAny(text, ["financeiro"]) && hasAny(text, ["diagnostico", "diagnóstico", "inconsistente", "problema", "pendencia", "pendência"]))
  ) {
    return "financial_diagnosis"
  }

  if (
    hasAny(text, ["contrato nao gera receita", "contrato não gera receita", "contratos inconsistentes", "contrato sem financeiro", "contrato sem equipamento", "contratos sem financeiro", "contratos sem equipamento", "contrato duplicado", "contratos duplicados"]) ||
    (hasAny(text, ["contrato", "contratos"]) && hasAny(text, ["diagnostico", "diagnóstico", "inconsistente", "problema", "pendencia", "pendência"]))
  ) {
    return "contract_diagnosis"
  }

  if (
    hasAny(text, ["estoque negativo", "equipamento locado sem contrato", "equipamentos locados sem contrato", "equipamento duplicado", "equipamentos duplicados"]) ||
    (hasAny(text, ["estoque", "equipamento", "equipamentos"]) && hasAny(text, ["diagnostico", "diagnóstico", "inconsistente", "problema", "pendencia", "pendência"]))
  ) {
    return "equipment_diagnosis"
  }

  if (hasAny(text, ["dashboard esta consistente", "dashboard está consistente", "dashboard consistente", "dashboard nao bate", "dashboard não bate", "indicador divergente"])) {
    return "dashboard_diagnosis"
  }

  if (
    hasAny(text, ["dre", "lucro", "resultado operacional"]) &&
    hasAny(text, ["explique", "explicar", "porque", "por que", "bate", "comparar", "diagnostico", "caiu", "diverg"])
  ) {
    return "dre_diagnosis"
  }

  if (hasAny(text, ["dashboard", "indicador", "card"]) || hasAny(text, ["o que alimenta", "impacta onde", "vem de qual", "acontece quando", "fecha o mes"])) {
    return "system_explanation"
  }

  if (hasAny(text, ["documento", "documentos", "arquivo", "arquivos", "comprovante"])) {
    return "document_search"
  }

  if (hasAny(text, ["cliente", "clientes", "cnpj", "cpf", "procure", "busque", "buscar", "quem e"])) {
    return "client_search"
  }

  if (hasAny(text, ["contrato", "contratos"])) {
    return "contract_search"
  }

  if (hasAny(text, ["equipamento", "equipamentos", "nobreak", "nobreaks", "servidor", "servidores", "monitor", "monitores", "estoque"])) {
    return "equipment_search"
  }

  if (hasAny(text, ["financeiro", "receita", "receitas", "faturamento", "despesa", "despesas", "contas vencidas", "em aberto", "lancamentos"])) {
    return "financial_search"
  }

  const bareEntitySearch = /^[a-z0-9\s.\/-]{3,80}$/.test(text) && text.split(/\s+/).filter(Boolean).length <= 5
  if (bareEntitySearch) return "client_search"

  return null
}

export async function answerReadOnlyFoundationQuestion(
  supabase: CosSupabaseClient,
  message: string,
  userId = "anonymous"
): Promise<CosAnswer | null> {
  const context = getReadOnlyContext(userId)

  if (shouldResetReadOnlyContext(message)) {
    resetReadOnlyContext(userId)
    return {
      intent: "read_only_foundation",
      sources: [],
      answer: "Contexto operacional limpo. Podemos iniciar uma nova consulta read-only.",
    }
  }

  if (context.pendingResolution) {
    const selected = resolvePendingSelection(context, message)
    if (!selected) {
      return {
        intent: "read_only_foundation",
        sources: [],
        answer: composeAmbiguityResponse(context.pendingResolution.prompt, context.pendingResolution.options),
      }
    }

    if (selected.type === "client") {
      setActiveClient(context, selected)
      return asComposedAnswer("client_search", {
        title: "Cliente selecionado",
        summary: `Contexto atualizado para ${selected.name}.`,
        details: selected.description ? [selected.description] : undefined,
        suggestions: defaultClientSuggestions(),
        context,
      })
    }
  }

  const blocked = detectReadOnlyBlockedIntent(message)
  if (blocked) {
    if (blocked.intent === "close_month") {
      const closing = await closingDiagnosisReadOnly(supabase, message)
      return asAnswer(
        "monthly_closing_diagnosis",
        "Bloqueio read-only de fechamento",
        `${blocked.answer}\n\n${closing.answer}`
      )
    }

    return {
      intent: "read_only_write_blocked",
      sources: [],
      answer: blocked.answer,
    }
  }

  const capability = detectContextualNavigation(message, Boolean(context.activeClient)) ?? detectReadOnlyCapability(message)
  if (!capability) return null

  switch (capability) {
    case "client_search": {
      const result = await searchClientsReadOnly(supabase, message)
      if (result.matches?.length === 1) {
        setActiveClient(context, clientRefFromRow(result.matches[0]))
      } else if (result.matches && result.matches.length > 1 && result.query) {
        const options = result.matches.map(clientRefFromRow)
        setPendingResolution(context, {
          type: "client",
          prompt: `Encontrei ${options.length} clientes compativeis. Qual deles voce deseja analisar?`,
          options,
        })
        return {
          intent: "read_only_foundation",
          sources: READ_ONLY_CAPABILITY_SOURCES.client_search,
          answer: composeAmbiguityResponse(`Encontrei ${options.length} clientes compativeis. Qual deles voce deseja analisar?`, options),
        }
      }

      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: context.activeClient ? defaultClientSuggestions() : ["buscar por CNPJ", "buscar contratos", "ver clientes inadimplentes"],
        context,
      })
    }
    case "contract_search": {
      setActiveFocus(context, "contracts")
      const result = await searchContractsReadOnly(supabase, message, context)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: defaultContractSuggestions(),
        context,
      })
    }
    case "equipment_search": {
      setActiveFocus(context, "equipment")
      const result = await searchEquipmentReadOnly(supabase, message, context)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["ver contratos", "ver financeiro", "diagnosticar estoque", "ver manutencoes"],
        context,
      })
    }
    case "financial_search": {
      setActiveFocus(context, "financial")
      const result = await searchFinancialReadOnly(supabase, message, context)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["comparar com DRE", "comparar banco", "ver em aberto", "ver contratos"],
        context,
      })
    }
    case "document_search": {
      setActiveFocus(context, "documents")
      const result = await searchDocumentsReadOnly(supabase, message, context)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["ver contratos", "ver financeiro", "ver pendencias documentais"],
        context,
      })
    }
    case "bank_reconciliation_diagnosis": {
      const result = await bankDiagnosisReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "dre_diagnosis": {
      setActiveFocus(context, "dre")
      const result = await dreDiagnosisReadOnly(supabase, message)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["comparar com financeiro", "comparar dashboard", "preparar checklist de fechamento"],
        context,
      })
    }
    case "financial_diagnosis": {
      setActiveFocus(context, "financial")
      const result = await financialDiagnosisReadOnly(supabase, message)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["comparar banco", "comparar DRE", "ver lancamentos sem categoria", "ver contratos"],
        context,
      })
    }
    case "contract_diagnosis": {
      setActiveFocus(context, "contracts")
      const result = await contractDiagnosisReadOnly(supabase, message)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["ver contratos ativos", "ver financeiro", "ver equipamentos", "ver documentos"],
        context,
      })
    }
    case "equipment_diagnosis": {
      setActiveFocus(context, "equipment")
      const result = await equipmentDiagnosisReadOnly(supabase)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["ver disponibilidade", "ver contratos", "ver manutencoes", "validar fechamento"],
        context,
      })
    }
    case "dashboard_diagnosis": {
      setActiveFocus(context, "dashboard")
      const result = await dashboardDiagnosisReadOnly(supabase, message)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["comparar com DRE", "comparar com financeiro", "ver indicador especifico", "validar fechamento"],
        context,
      })
    }
    case "monthly_closing_diagnosis": {
      const result = await closingDiagnosisReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "operational_health": {
      const result = await operationalHealthReadOnly(supabase, message)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["investigar contratos", "investigar financeiro", "investigar banco", "investigar estoque"],
        context,
      })
    }
    case "system_explanation": {
      if (normalizeText(message).includes("dashboard")) setActiveFocus(context, "dashboard")
      const result = await explainSystemReadOnly(message)
      saveReadOnlyContext(context)
      return asComposedAnswer(capability, {
        title: result.title,
        summary: result.answer,
        suggestions: ["ver financeiro", "ver DRE", "ver contratos", "ver diagnostico"],
        context,
      })
    }
    default:
      return null
  }
}
