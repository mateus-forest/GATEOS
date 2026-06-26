import type {
  StructuredClientInput,
  StructuredContractInput,
  StructuredDocumentInput,
  StructuredDreInput,
  StructuredEquipmentInput,
  StructuredFinancialInput,
  StructuredInputParseResult,
} from "@/lib/cos/structured-input-parser"

export type StructuredInputAction =
  | {
      kind: "create_client" | "create_financial_entry" | "attach_document"
      title: string
      description: string
      endpoint: string
      payload: Record<string, unknown>
      enabled: boolean
      blockedReason?: string
      requiresNoDocumentConfirmation?: boolean
      source: {
        type: string
        confidence: number
        detectedType: string
      }
    }
  | {
      kind: "prepare_contract" | "prepare_equipment"
      title: string
      description: string
      enabled: false
      blockedReason: string
      payload: Record<string, unknown>
      source: {
        type: string
        confidence: number
        detectedType: string
      }
    }

export type StructuredInputPreview = {
  kind: "structured_input"
  source: {
    type: "structured_text"
    confidence: number
    detectedType: string
  }
  sections: string[]
  client?: StructuredClientInput
  contract?: StructuredContractInput
  financial?: StructuredFinancialInput
  equipment: StructuredEquipmentInput[]
  document?: StructuredDocumentInput
  dre?: StructuredDreInput
  pending: string[]
  warnings: string[]
  actions: StructuredInputAction[]
}

function normalizeDocument(value?: string) {
  return String(value ?? "").replace(/\D/g, "")
}

function clientPayload(client: StructuredClientInput) {
  return {
    name: client.name ?? client.legal_name ?? "",
    legal_name: client.legal_name ?? client.name ?? "",
    document_number: normalizeDocument(client.document_number),
    address: client.address ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    zip_code: client.zip_code ?? "",
    representative: client.representative ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    status: client.status ?? "ativo",
  }
}

function financialPayload(financial: StructuredFinancialInput) {
  return {
    type: String(financial.type ?? "receita").toLowerCase(),
    description: financial.description ?? "",
    value: financial.value ?? "",
    competence_date: financial.competence_date ?? "",
    due_date: financial.due_date ?? financial.competence_date ?? "",
    status: financial.status ?? "pendente",
    category: financial.category ?? "",
    supplier_name: financial.client ?? "",
  }
}

function buildPending(parsed: StructuredInputParseResult) {
  const pending: string[] = []
  if (parsed.client && !parsed.client.document_number) pending.push("CNPJ/CPF ausente.")
  if (parsed.contract && !parsed.contract.monthly_value) pending.push("Valor mensal ausente.")
  if (parsed.financial && !parsed.financial.category) pending.push("Categoria DRE ausente.")
  if (parsed.financial) pending.push("Conta bancaria ausente para conciliacao.")
  if (parsed.contract) pending.push("Contrato ainda nao pode ser criado automaticamente nesta fase.")
  if (parsed.equipment.length) pending.push("Equipamentos ainda nao podem ser cadastrados automaticamente nesta fase.")
  if (parsed.financial?.installments) pending.push("Parcelas/recorrencia nao serao geradas automaticamente nesta fase.")
  return pending
}

function buildActions(parsed: StructuredInputParseResult, source: StructuredInputPreview["source"]) {
  const actions: StructuredInputAction[] = []

  if (parsed.client) {
    const payload = clientPayload(parsed.client)
    const enabled = Boolean(payload.name || payload.legal_name)
    actions.push({
      kind: "create_client",
      title: "Cadastrar cliente",
      description: "Revise os dados estruturados antes de criar o cliente.",
      endpoint: "/api/cos/actions/create-client",
      payload,
      enabled,
      blockedReason: enabled ? undefined : "Nome ou razao social do cliente ausente.",
      requiresNoDocumentConfirmation: !payload.document_number,
      source,
    })
  }

  if (parsed.financial) {
    const payload = financialPayload(parsed.financial)
    const enabled = Boolean(payload.type && payload.description && payload.value && (payload.competence_date || payload.due_date))
    actions.push({
      kind: "create_financial_entry",
      title: "Criar lancamento financeiro",
      description: "Revise o lancamento individual antes de gravar no financeiro.",
      endpoint: "/api/cos/actions/create-financial-entry",
      payload,
      enabled,
      blockedReason: enabled ? undefined : "Tipo, descricao, valor e competencia/vencimento sao obrigatorios.",
      source,
    })
  }

  if (parsed.document) {
    actions.push({
      kind: "attach_document",
      title: "Anexar documento",
      description: "Anexo exige arquivo original enviado no modal.",
      endpoint: "/api/cos/actions/attach-document",
      payload: {
        detectedType: parsed.document.type ?? "documento_operacional",
        notes: parsed.document.notes ?? parsed.document.name ?? "",
      },
      enabled: false,
      blockedReason: "Nenhum arquivo foi enviado junto com esta entrada estruturada.",
      source,
    })
  }

  if (parsed.contract) {
    actions.push({
      kind: "prepare_contract",
      title: "Preparar contrato",
      description: "Preview de contrato preparado. Gravacao real permanece bloqueada nesta fase.",
      payload: parsed.contract,
      enabled: false,
      blockedReason: "Criar contrato real ainda nao possui endpoint seguro liberado para o COS.",
      source,
    })
  }

  if (parsed.equipment.length) {
    actions.push({
      kind: "prepare_equipment",
      title: "Preparar equipamentos",
      description: "Preview de equipamentos preparado. Cadastro real permanece bloqueado nesta fase.",
      payload: { equipment: parsed.equipment },
      enabled: false,
      blockedReason: "Cadastrar equipamentos reais ainda nao possui endpoint seguro liberado para o COS.",
      source,
    })
  }

  return actions
}

export function buildStructuredInputPreview(parsed: StructuredInputParseResult): StructuredInputPreview {
  const source = {
    type: "structured_text" as const,
    confidence: 90,
    detectedType: "Entrada estruturada operacional",
  }
  const pending = buildPending(parsed)

  return {
    kind: "structured_input",
    source,
    sections: parsed.sections,
    client: parsed.client,
    contract: parsed.contract,
    financial: parsed.financial,
    equipment: parsed.equipment,
    document: parsed.document,
    dre: parsed.dre,
    pending,
    warnings: pending,
    actions: buildActions(parsed, source),
  }
}

function linesForObject(title: string, value?: Record<string, unknown>) {
  if (!value || !Object.keys(value).length) return []
  return [
    `${title}:`,
    ...Object.entries(value)
      .filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== "")
      .map(([key, fieldValue]) => `- ${key}: ${fieldValue}`),
  ]
}

export function composeStructuredInputAnswer(preview: StructuredInputPreview) {
  const sections = [
    "Entrada estruturada operacional identificada.",
    "",
    "Separei as entidades abaixo. Nenhum dado foi gravado.",
    "",
    ...linesForObject("Cliente identificado", preview.client as Record<string, unknown> | undefined),
    ...linesForObject("Contrato identificado", preview.contract as Record<string, unknown> | undefined),
    ...linesForObject("Financeiro identificado", preview.financial as Record<string, unknown> | undefined),
  ]

  if (preview.equipment.length) {
    sections.push("Equipamentos identificados:", ...preview.equipment.map((item) => `- ${item.quantity ? `${item.quantity}x ` : ""}${item.description}`))
  }

  if (preview.pending.length) {
    sections.push("", "Pendencias:", ...preview.pending.map((item) => `- ${item}`))
  }

  if (preview.actions.length) {
    sections.push("", "CTAs disponiveis:", ...preview.actions.map((action) => `- ${action.title}${action.enabled ? "" : ` (bloqueado: ${action.blockedReason})`}`))
  }

  return sections.join("\n")
}
