"use client"

import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/types"

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
