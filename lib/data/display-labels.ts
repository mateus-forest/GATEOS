export type DisplayRecord = Record<string, unknown>

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

export function friendlyLabel(record: DisplayRecord, keys: string[], fallback = "Registro sem nome") {
  for (const key of keys) {
    const value = record[key]
    const label = String(value ?? "").trim()
    if (label && !isUuidLike(label)) return label
  }
  return fallback
}

export function clientLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "legal_name", "company_name", "email"], "Cliente sem nome")
}

export function dreCategoryLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "description", "nome", "descricao", "label"])
}

export function bankAccountLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "bank_name", "account_name", "nome", "description", "descricao"])
}

export function contractLabel(record: DisplayRecord) {
  const number = friendlyLabel(record, ["contract_number", "number", "numero"], "")
  const client = friendlyLabel(record, ["client_name", "clientName", "client", "cliente"], "")
  if (number && client) return `${number} - ${client}`
  return number || client || "Registro sem nome"
}

export function equipmentLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "category"], "Equipamento sem nome")
}

export function partnerLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "partner_name", "nome", "socio"])
}
