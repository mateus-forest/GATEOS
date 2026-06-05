import { selectRows, updateRows } from "@/lib/data/supabase-helpers"
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getClients() {
  return selectRows("clients", [], { orderBy: "created_at", ascending: false })
}

export async function getClientById(id: string) {
  const rows = await selectRows("clients", [], { eq: { id } })
  return rows[0] ?? null
}

export async function createClient(payload: SupabaseRow) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao esta configurado. O cliente nao foi salvo.")
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) {
    throw new Error("Nao foi possivel iniciar a conexao com o Supabase.")
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === undefined || value === "" ? null : value])
  ) satisfies SupabaseRow

  const { data, error } = await supabase.from("clients").insert(cleanPayload).select("*").single()

  if (error) {
    console.error("[clients] Falha ao inserir cliente no Supabase", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    throw new Error(
      [
        "Nao foi possivel salvar o cliente no Supabase.",
        error.message,
        error.details,
        error.hint,
        error.code ? `Codigo: ${error.code}` : "",
      ].filter(Boolean).join(" ")
    )
  }

  if (!data) {
    throw new Error("Supabase nao retornou o cliente criado.")
  }

  return data
}

export async function updateClient(id: string, payload: SupabaseRow) {
  return updateRows("clients", payload, { id }, [{ ...payload, id }])
}
