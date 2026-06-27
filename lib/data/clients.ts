import { deleteRows, insertRow, selectRowsStrict, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getClients() {
  return selectRowsStrict("clients", { orderBy: "created_at", ascending: false })
}

export async function getClientById(id: string) {
  const rows = await selectRowsStrict("clients", { eq: { id } })
  return rows[0] ?? null
}

export async function createClient(payload: SupabaseRow) {
  return insertRow("clients", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateClient(id: string, payload: SupabaseRow) {
  return updateRows("clients", payload, { id }, [{ ...payload, id }])
}

export async function getClientRelationCounts(id: string) {
  const [contracts, financialEntries, documents, legalCases] = await Promise.all([
    selectRowsStrict("contracts", { eq: { client_id: id } }),
    selectRowsStrict("financial_entries", { eq: { client_id: id } }),
    selectRowsStrict("documents", { eq: { client_id: id } }),
    selectRowsStrict("legal_cases", { eq: { client_id: id } }),
  ])

  return {
    contracts: contracts.length,
    financialEntries: financialEntries.length,
    documents: documents.length,
    legalCases: legalCases.length,
    total: contracts.length + financialEntries.length + documents.length + legalCases.length,
  }
}

export function getClientDeleteBlockMessage(counts: Awaited<ReturnType<typeof getClientRelationCounts>>) {
  const links = [
    counts.contracts > 0 ? `${counts.contracts} contrato(s)` : null,
    counts.financialEntries > 0 ? `${counts.financialEntries} lancamento(s)` : null,
    counts.documents > 0 ? `${counts.documents} documento(s)` : null,
    counts.legalCases > 0 ? `${counts.legalCases} caso(s) juridico(s)` : null,
  ].filter(Boolean)

  return `Cliente nao pode ser excluido porque possui vinculos: ${links.join(", ")}.`
}

export async function deleteClient(id: string) {
  const counts = await getClientRelationCounts(id)
  if (counts.total > 0) {
    throw new Error(getClientDeleteBlockMessage(counts))
  }

  const rows = await deleteRows("clients", { id }, [])
  const deletedClient = rows[0]

  if (!deletedClient) {
    throw new Error("Cliente nao foi excluido. Verifique se o registro existe e se a policy de delete de clientes permite esta acao.")
  }

  return deletedClient
}

export async function inactivateClient(id: string) {
  const rows = await updateClient(id, { status: "inativo" })
  const updatedClient = rows[0]

  if (!updatedClient) {
    throw new Error("Cliente nao foi inativado. Verifique se o registro existe e se a policy de update de clientes permite esta acao.")
  }

  return updatedClient
}
