import { selectRows, updateRows } from "@/lib/data/supabase-helpers"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getContracts() {
  const [summaryRows, contractRows] = await Promise.all([
    selectRows<SupabaseRow>("v_contracts_summary", []),
    selectRows<SupabaseRow>("contracts", []),
  ])
  const contractsById = new Map(contractRows.map((contract) => [String(contract.id ?? ""), contract]))

  return summaryRows.map((summary) => {
    const contract = contractsById.get(String(summary.id ?? ""))
    return {
      ...summary,
      client_id: summary.client_id ?? contract?.client_id,
      public_access_token: contract?.public_access_token,
      public_access_enabled: contract?.public_access_enabled,
      public_access_created_at: contract?.public_access_created_at,
    }
  })
}

export async function createContract(payload: SupabaseRow) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao esta configurado. O contrato nao foi salvo.")
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error("Nao foi possivel iniciar a conexao com o Supabase.")
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === undefined || value === "" ? null : value])
  ) satisfies SupabaseRow

  const { data, error } = await supabase.from("contracts").insert(cleanPayload).select("*").single()

  if (error) {
    console.error("[contracts] Falha ao inserir contrato no Supabase", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw new Error(
      [
        "Nao foi possivel salvar o contrato no Supabase.",
        error.message,
        error.details,
        error.hint,
        error.code ? `Codigo: ${error.code}` : "",
      ].filter(Boolean).join(" ")
    )
  }

  if (!data) {
    throw new Error("Supabase nao retornou o contrato criado.")
  }

  return data
}

export async function updateContract(id: string, payload: SupabaseRow) {
  return updateRows("contracts", payload, { id }, [{ ...payload, id }])
}

export async function prepareInstallmentsForContract(contractId: string) {
  return { contract_id: contractId, ready: true }
}
