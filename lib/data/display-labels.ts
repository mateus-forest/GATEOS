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
  return friendlyLabel(record, [
    "name",
    "legal_name",
    "company_name",
    "razao_social",
    "razaoSocial",
    "trade_name",
    "nome_fantasia",
    "nomeFantasia",
    "email",
  ], "Cliente sem nome")
}

export function dreCategoryLabel(record: DisplayRecord) {
  const name = friendlyLabel(record, ["name", "category_name", "description", "nome", "categoria", "descricao", "label"])
  const group = friendlyLabel(record, ["group_name", "groupName", "grupo"], "")
  return group ? `${group} - ${name}` : name
}

export function bankAccountLabel(record: DisplayRecord) {
  const name = friendlyLabel(record, ["name", "account_name", "nome", "description", "descricao"], "")
  const bank = friendlyLabel(record, ["bank_name", "bank", "banco"], "")
  const account = friendlyLabel(record, ["account_number", "numero_conta", "conta"], "")
  return [name, bank, account].filter(Boolean).join(" - ") || "Conta sem nome"
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
  return friendlyLabel(record, [
    "name",
    "partner_name",
    "full_name",
    "display_name",
    "legal_name",
    "shareholder_name",
    "nome",
    "socio",
  ])
}
