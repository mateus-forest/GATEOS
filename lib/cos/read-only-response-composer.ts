import type { ReadOnlyEntityRef, ReadOnlyOperationalContext } from "@/lib/cos/read-only-context"

export function composeReadOnlyResponse(input: {
  title: string
  summary: string
  details?: string[]
  warnings?: string[]
  suggestions?: string[]
  context?: ReadOnlyOperationalContext
}) {
  const sections = [input.title, "", input.summary]

  if (input.details?.length) {
    sections.push("", "Dados encontrados:", ...input.details.map((item) => `- ${item}`))
  }

  if (input.warnings?.length) {
    sections.push("", "Alertas:", ...input.warnings.map((item) => `- ${item}`))
  }

  if (input.context?.activeClient || input.context?.activeContract || input.context?.activeEquipment || input.context?.activePeriod) {
    const contextItems = [
      input.context.activeClient ? `Cliente ativo: ${input.context.activeClient.name}` : null,
      input.context.activeContract ? `Contrato ativo: ${input.context.activeContract.name}` : null,
      input.context.activeEquipment ? `Equipamento ativo: ${input.context.activeEquipment.name}` : null,
      input.context.activePeriod ? `Periodo ativo: ${input.context.activePeriod.label}` : null,
    ].filter(Boolean)
    if (contextItems.length) sections.push("", "Contexto atual:", ...contextItems.map((item) => `- ${item}`))
  }

  if (input.suggestions?.length) {
    sections.push("", "Posso ajudar com:", ...input.suggestions.map((item) => `- ${item}`))
  }

  return sections.join("\n")
}

export function composeAmbiguityResponse(prompt: string, options: ReadOnlyEntityRef[]) {
  return [
    prompt,
    "",
    "Opcoes encontradas:",
    ...options.map((option, index) => `- ${index + 1}. ${option.name}${option.description ? ` - ${option.description}` : ""}`),
    "",
    "Responda com o numero ou nome da opcao para eu continuar a analise.",
  ].join("\n")
}

export function defaultClientSuggestions() {
  return ["ver contratos", "ver equipamentos", "ver financeiro", "ver documentos", "ver DRE", "ver dashboard", "ver diagnostico"]
}

export function defaultContractSuggestions() {
  return ["ver equipamentos vinculados", "ver parcelas", "ver financeiro", "ver documentos", "ver vencimentos"]
}

