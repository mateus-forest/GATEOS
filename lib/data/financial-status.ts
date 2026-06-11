export const financialStatusValues = [
  "pago",
  "a_pagar",
  "recebido",
  "a_receber",
  "parcial",
  "cancelado",
] as const

export type FinancialStatus = (typeof financialStatusValues)[number]

export const financialStatusLabels: Record<FinancialStatus, string> = {
  pago: "Pago",
  a_pagar: "A pagar",
  recebido: "Recebido",
  a_receber: "A receber",
  parcial: "Parcial",
  cancelado: "Cancelado",
}

export function normalizeFinancialStatus(value: unknown): FinancialStatus {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")

  const map: Record<string, FinancialStatus> = {
    pago: "pago",
    paid: "pago",
    recebido: "recebido",
    received: "recebido",
    completed: "recebido",
    concluido: "recebido",
    a_receber: "a_receber",
    receber: "a_receber",
    pending: "a_receber",
    pendente: "a_receber",
    a_pagar: "a_pagar",
    pagar: "a_pagar",
    parcial: "parcial",
    cancelado: "cancelado",
    cancelled: "cancelado",
    canceled: "cancelado",
    vencido: "a_receber",
    overdue: "a_receber",
  }

  return map[status] ?? "a_receber"
}

export function getFinancialStatusLabel(value: unknown) {
  return financialStatusLabels[normalizeFinancialStatus(value)]
}

export function getFinancialStatusForEntry(type: string, hasPaymentDate: boolean): FinancialStatus {
  const normalizedType = type.trim().toLowerCase()
  const isExpense = ["despesa", "expense", "saida"].includes(normalizedType)

  if (isExpense) return hasPaymentDate ? "pago" : "a_pagar"
  return hasPaymentDate ? "recebido" : "a_receber"
}

export function isFinancialStatusReceived(value: unknown) {
  const status = normalizeFinancialStatus(value)
  return status === "recebido" || status === "pago"
}

export function isFinancialStatusPending(value: unknown) {
  const status = normalizeFinancialStatus(value)
  return status === "a_receber" || status === "a_pagar" || status === "parcial"
}
