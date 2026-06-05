import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { SupabaseRow } from "@/lib/supabase/types"

type QueryOptions = {
  orderBy?: string
  ascending?: boolean
  limit?: number
  eq?: SupabaseRow
}

function warnFallback(context: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Supabase fallback] ${context}`, error ?? "")
  }
}

export async function selectRows<T>(
  table: string,
  fallback: T[],
  options: QueryOptions = {}
) {
  if (!isSupabaseConfigured()) {
    warnFallback(`${table}: env não configurado`)
    return fallback
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) return fallback

  let query = supabase.from(table).select("*")
  if (options.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    warnFallback(`${table}: falha na consulta`, error)
    return fallback
  }

  return (data ?? fallback) as T[]
}

export async function insertRow<T>(
  table: string,
  payload: SupabaseRow,
  fallback: T
) {
  if (!isSupabaseConfigured()) {
    warnFallback(`${table}: insert sem Supabase configurado`)
    return fallback
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) return fallback

  const { data, error } = await supabase.from(table).insert(payload).select("*").single()
  if (error) {
    warnFallback(`${table}: falha ao inserir`, error)
    return fallback
  }

  return (data ?? fallback) as T
}

export async function updateRows<T>(
  table: string,
  payload: SupabaseRow,
  match: SupabaseRow,
  fallback: T
) {
  if (!isSupabaseConfigured()) {
    warnFallback(`${table}: update sem Supabase configurado`)
    return fallback
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) return fallback

  let query = supabase.from(table).update(payload)
  Object.entries(match).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { data, error } = await query.select("*")
  if (error) {
    warnFallback(`${table}: falha ao atualizar`, error)
    return fallback
  }

  return (data ?? fallback) as T
}

export async function callRpc<T>(
  name: string,
  args: SupabaseRow,
  fallback: T
) {
  if (!isSupabaseConfigured()) {
    warnFallback(`${name}: RPC sem Supabase configurado`)
    return fallback
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) return fallback

  const { data, error } = await supabase.rpc(name, args)
  if (error) {
    warnFallback(`${name}: falha na RPC`, error)
    return fallback
  }

  return (data ?? fallback) as T
}
