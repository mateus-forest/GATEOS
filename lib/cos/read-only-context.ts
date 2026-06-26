import { normalizeText } from "@/lib/cos/cos-context"

export type ReadOnlyEntityRef = {
  type: "client" | "contract" | "equipment" | "financial" | "document" | "legal" | "partner"
  id: string
  name: string
  description?: string
}

export type ReadOnlyPendingResolution = {
  type: ReadOnlyEntityRef["type"]
  prompt: string
  options: ReadOnlyEntityRef[]
}

export type ReadOnlyOperationalContext = {
  userId: string
  activeClient?: ReadOnlyEntityRef
  activeContract?: ReadOnlyEntityRef
  activeEquipment?: ReadOnlyEntityRef
  activePeriod?: {
    year: number
    month: number
    label: string
  }
  activeFocus?: "client" | "contracts" | "equipment" | "financial" | "documents" | "dre" | "dashboard" | "closing"
  pendingResolution?: ReadOnlyPendingResolution
  updatedAt: number
}

const CONTEXT_TTL_MS = 1000 * 60 * 45
const contextMemory = new Map<string, ReadOnlyOperationalContext>()

function freshContext(userId: string): ReadOnlyOperationalContext {
  return {
    userId,
    updatedAt: Date.now(),
  }
}

export function getReadOnlyContext(userId: string) {
  const existing = contextMemory.get(userId)
  if (!existing || Date.now() - existing.updatedAt > CONTEXT_TTL_MS) {
    const next = freshContext(userId)
    contextMemory.set(userId, next)
    return next
  }
  return existing
}

export function saveReadOnlyContext(context: ReadOnlyOperationalContext) {
  context.updatedAt = Date.now()
  contextMemory.set(context.userId, context)
  return context
}

export function resetReadOnlyContext(userId: string) {
  const next = freshContext(userId)
  contextMemory.set(userId, next)
  return next
}

export function shouldResetReadOnlyContext(message: string) {
  const text = normalizeText(message)
  return [
    "limpar contexto",
    "limpe o contexto",
    "comecar nova analise",
    "começar nova analise",
    "nova consulta",
    "esquece",
    "resetar contexto",
  ].some((term) => text.includes(normalizeText(term)))
}

export function setActiveClient(context: ReadOnlyOperationalContext, client: ReadOnlyEntityRef) {
  context.activeClient = client
  context.activeFocus = "client"
  context.pendingResolution = undefined
  return saveReadOnlyContext(context)
}

export function setPendingResolution(context: ReadOnlyOperationalContext, pending: ReadOnlyPendingResolution) {
  context.pendingResolution = pending
  return saveReadOnlyContext(context)
}

export function setActiveFocus(context: ReadOnlyOperationalContext, focus: NonNullable<ReadOnlyOperationalContext["activeFocus"]>) {
  context.activeFocus = focus
  return saveReadOnlyContext(context)
}

export function resolvePendingSelection(context: ReadOnlyOperationalContext, message: string) {
  const pending = context.pendingResolution
  if (!pending) return null

  const text = normalizeText(message)
  const numberMatch = text.match(/\b(?:opcao|opcao numero|numero)?\s*(\d{1,2})\b/)
  if (numberMatch) {
    const index = Number(numberMatch[1]) - 1
    return pending.options[index] ?? null
  }

  return (
    pending.options.find((option) => {
      const optionText = normalizeText(`${option.name} ${option.description ?? ""}`)
      return optionText.includes(text) || text.includes(normalizeText(option.name))
    }) ?? null
  )
}

export function contextLabel(context: ReadOnlyOperationalContext) {
  const parts = []
  if (context.activeClient) parts.push(`Cliente ativo: ${context.activeClient.name}`)
  if (context.activeContract) parts.push(`Contrato ativo: ${context.activeContract.name}`)
  if (context.activeEquipment) parts.push(`Equipamento ativo: ${context.activeEquipment.name}`)
  if (context.activePeriod) parts.push(`Periodo ativo: ${context.activePeriod.label}`)
  return parts.join(" | ")
}

