import { normalizeText, type CosAnswer, type CosSupabaseClient } from "@/lib/cos/cos-context"
import { READ_ONLY_CAPABILITY_SOURCES, type ReadOnlyCapability } from "@/lib/cos/read-only-capabilities"
import { detectReadOnlyBlockedIntent } from "@/lib/cos/read-only-guardrail"
import {
  diagnoseBankReconciliationReadOnly,
  diagnoseClosingReadOnly,
  diagnoseDreReadOnly,
  explainSystemReadOnly,
  searchClientsReadOnly,
  searchContractsReadOnly,
  searchEquipmentReadOnly,
  searchFinancialReadOnly,
} from "@/lib/cos/read-only-tools"

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

function detectReadOnlyCapability(message: string): ReadOnlyCapability | null {
  const text = normalizeText(message)

  if (hasAny(text, ["banco nao bate", "saldo nao bate", "conciliar banco", "banco x financeiro", "diferenca de saldo"])) {
    return "bank_reconciliation_diagnosis"
  }

  if (hasAny(text, ["o que falta para fechar", "checklist de fechamento", "validar fechamento", "pendencias para fechar"])) {
    return "monthly_closing_diagnosis"
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

  return null
}

export async function answerReadOnlyFoundationQuestion(
  supabase: CosSupabaseClient,
  message: string
): Promise<CosAnswer | null> {
  const blocked = detectReadOnlyBlockedIntent(message)
  if (blocked) {
    if (blocked.intent === "close_month") {
      const closing = await diagnoseClosingReadOnly(supabase, message)
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

  const capability = detectReadOnlyCapability(message)
  if (!capability) return null

  switch (capability) {
    case "client_search": {
      const result = await searchClientsReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "contract_search": {
      const result = await searchContractsReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "equipment_search": {
      const result = await searchEquipmentReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "financial_search": {
      const result = await searchFinancialReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "bank_reconciliation_diagnosis": {
      const result = await diagnoseBankReconciliationReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "dre_diagnosis": {
      const result = await diagnoseDreReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "monthly_closing_diagnosis": {
      const result = await diagnoseClosingReadOnly(supabase, message)
      return asAnswer(capability, result.title, result.answer)
    }
    case "system_explanation": {
      const result = await explainSystemReadOnly(message)
      return asAnswer(capability, result.title, result.answer)
    }
    default:
      return null
  }
}

