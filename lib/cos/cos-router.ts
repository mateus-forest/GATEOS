import {
  currentYearMonth,
  formatCurrency,
  monthLabel,
  normalizeText,
  parseRequestedPeriod,
  type CosAnswer,
  type CosIntent,
  type CosSupabaseClient,
} from "@/lib/cos/cos-context"
import {
  formatContractList,
  getClientsSummary,
  getContractsSummary,
  getDocumentsSummary,
  getDreSummary,
  getEquipmentSummary,
  getFinancialSummary,
  getMaintenanceSummary,
  getOverdueClientsSummary,
} from "@/lib/cos/cos-tools"

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

export function detectCosIntent(message: string): CosIntent {
  const text = normalizeText(message)

  if (hasAny(text, ["abrir chamado", "criar chamado", "novo chamado"])) return "open_ticket_guidance"
  if (hasAny(text, ["dre", "resultado operacional", "demonstrativo"])) return "dre_summary"
  if (hasAny(text, ["documento", "documentos", "arquivo", "arquivos"])) return "documents_summary"
  if (hasAny(text, ["chamado", "manutencao", "manutencoes"]) && hasAny(text, ["aberto", "abertos", "pendente", "pendentes"])) {
    return "open_maintenance"
  }
  if (hasAny(text, ["equipamento", "equipamentos"]) && hasAny(text, ["manutencao", "manutencoes"])) return "maintenance_equipment"
  if (hasAny(text, ["equipamento", "equipamentos"]) && hasAny(text, ["disponivel", "disponiveis", "livre", "livres"])) {
    return "available_equipment"
  }
  if (hasAny(text, ["contrato", "contratos"]) && hasAny(text, ["vencendo", "vence", "vencem", "proximos 30"])) {
    return "expiring_contracts"
  }
  if (hasAny(text, ["contrato", "contratos"]) && hasAny(text, ["vencido", "vencidos"])) return "expired_contracts"
  if (hasAny(text, ["contrato", "contratos"]) && hasAny(text, ["ativo", "ativos", "vigente", "vigentes"])) return "active_contracts"
  if (hasAny(text, ["cliente", "clientes"]) && hasAny(text, ["inadimplente", "inadimplentes", "atraso", "vencido"])) {
    return "overdue_clients"
  }
  if (hasAny(text, ["cliente", "clientes"]) && hasAny(text, ["ativo", "ativos", "cadastrado", "cadastrados"])) return "active_clients"
  if (hasAny(text, ["receita", "faturamento", "recebido"])) return "financial_revenue"
  if (hasAny(text, ["financeiro", "despesa", "despesas", "saldo", "resumo"])) return "financial_summary"

  return "overview"
}

export async function answerCosQuestion(supabase: CosSupabaseClient, message: string): Promise<CosAnswer> {
  const intent = detectCosIntent(message)
  const period = parseRequestedPeriod(message)
  const current = currentYearMonth()

  switch (intent) {
    case "active_clients": {
      const summary = await getClientsSummary(supabase)
      return {
        intent,
        sources: ["clients"],
        answer: `Temos ${summary.active} clientes ativos de ${summary.total} clientes cadastrados. ${
          summary.sample.length ? `Alguns deles: ${summary.sample.join(", ")}.` : "Nenhum cliente ativo foi encontrado."
        }`,
      }
    }
    case "overdue_clients": {
      const summary = await getOverdueClientsSummary(supabase)
      return {
        intent,
        sources: ["installments"],
        answer: `Encontrei ${summary.overdueClients} clientes com parcelas em atraso, somando ${summary.overdueInstallments} parcelas e ${formatCurrency(summary.totalValue)} em aberto.`,
      }
    }
    case "active_contracts": {
      const summary = await getContractsSummary(supabase)
      return {
        intent,
        sources: ["contracts"],
        answer: `Temos ${summary.active.length} contratos ativos de ${summary.total} contratos cadastrados.`,
      }
    }
    case "expiring_contracts": {
      const summary = await getContractsSummary(supabase)
      return {
        intent,
        sources: ["contracts"],
        answer: `Encontrei ${summary.expiring.length} contratos vencendo nos próximos 30 dias. ${formatContractList(summary.expiring)}`,
      }
    }
    case "expired_contracts": {
      const summary = await getContractsSummary(supabase)
      return {
        intent,
        sources: ["contracts"],
        answer: `Encontrei ${summary.expired.length} contratos vencidos. ${formatContractList(summary.expired)}`,
      }
    }
    case "available_equipment": {
      const summary = await getEquipmentSummary(supabase)
      return {
        intent,
        sources: ["equipment"],
        answer: `Hoje existem ${summary.available} equipamentos disponíveis. ${
          summary.availableSample.length ? `Principais itens com disponibilidade: ${summary.availableSample.join(", ")}.` : "Não encontrei itens com disponibilidade positiva."
        }`,
      }
    }
    case "maintenance_equipment": {
      const summary = await getEquipmentSummary(supabase)
      return {
        intent,
        sources: ["equipment"],
        answer: `Existem ${summary.maintenance} equipamentos marcados em manutenção. ${
          summary.maintenanceSample.length ? `Itens: ${summary.maintenanceSample.join(", ")}.` : "Não encontrei equipamentos em manutenção."
        }`,
      }
    }
    case "financial_revenue": {
      const financial = await getFinancialSummary(supabase, period.year, period.month)
      return {
        intent,
        sources: ["financial_entries"],
        answer: `A receita realizada de ${financial.label} é ${formatCurrency(financial.revenue)}, calculada por lançamentos financeiros de receita com status recebido e competência no mês.`,
      }
    }
    case "financial_summary": {
      const financial = await getFinancialSummary(supabase, period.year, period.month)
      return {
        intent,
        sources: ["financial_entries"],
        answer: `Resumo financeiro de ${financial.label}: receita realizada de ${formatCurrency(financial.revenue)}, despesas pagas de ${formatCurrency(financial.expenses)} e resultado de ${formatCurrency(financial.result)}. Há ${financial.entries} lançamentos na competência.`,
      }
    }
    case "dre_summary": {
      const dre = await getDreSummary(supabase, period.year || current.year, period.month || current.month)
      return {
        intent,
        sources: [dre.source],
        answer: `Resumo da DRE de ${dre.label}: receita de ${formatCurrency(dre.revenue)}, despesas de ${formatCurrency(dre.expenses)} e resultado operacional de ${formatCurrency(dre.result)}. Fonte consultada: ${dre.source}.`,
      }
    }
    case "documents_summary": {
      const summary = await getDocumentsSummary(supabase)
      return {
        intent,
        sources: ["documents"],
        answer: `Existem ${summary.total} documentos cadastrados. ${
          summary.recent.length ? `Mais recentes: ${summary.recent.join(", ")}.` : "Nenhum documento foi encontrado."
        }`,
      }
    }
    case "open_maintenance": {
      const summary = await getMaintenanceSummary(supabase)
      return {
        intent,
        sources: ["maintenance_orders"],
        answer: `Encontrei ${summary.open.length} chamados/manutenções em aberto. ${
          summary.openSample.length
            ? `Principais: ${summary.openSample.map((item) => `${item.ticket} - ${item.problem} (${item.priority}, ${item.date})`).join("; ")}.`
            : "Não há chamados abertos no momento."
        }`,
      }
    }
    case "open_ticket_guidance":
      return {
        intent,
        sources: [],
        answer: "Para abrir um chamado, acesse o módulo Manutenções e use a ação de abertura de ordem. Pelo link público do cliente, o chamado também pode ser aberto sem login quando houver contrato/link válido.",
      }
    case "overview":
    default: {
      const [clients, contracts, equipment, financial, maintenance, documents] = await Promise.all([
        getClientsSummary(supabase),
        getContractsSummary(supabase),
        getEquipmentSummary(supabase),
        getFinancialSummary(supabase, current.year, current.month),
        getMaintenanceSummary(supabase),
        getDocumentsSummary(supabase),
      ])
      return {
        intent: "overview",
        sources: ["clients", "contracts", "equipment", "financial_entries", "maintenance_orders", "documents"],
        answer: `Resumo do sistema: ${clients.active} clientes ativos, ${contracts.active.length} contratos ativos, ${equipment.available} equipamentos disponíveis, ${maintenance.open.length} chamados abertos e ${documents.total} documentos cadastrados. No financeiro de ${monthLabel(current.month)}/${current.year}, a receita realizada é ${formatCurrency(financial.revenue)} e o resultado é ${formatCurrency(financial.result)}.`,
      }
    }
  }
}
