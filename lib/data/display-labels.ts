export type DisplayRecord = Record<string, unknown>

export function friendlyLabel(record: DisplayRecord, keys: string[], fallback = "Registro sem nome") {
  for (const key of keys) {
    const value = record[key]
    if (value !== null && value !== undefined && String(value).trim() !== "") return String(value)
  }
  return fallback
}

export function clientLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "legal_name", "company_name", "trade_name", "fantasy_name", "nome", "razao_social"])
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
  return friendlyLabel(record, ["name", "nome", "description", "descricao"])
}

export function partnerLabel(record: DisplayRecord) {
  return friendlyLabel(record, ["name", "partner_name", "nome", "socio"])
}
