export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SupabaseRow = Record<string, Json>

export type Database = {
  public: {
    Tables: Record<string, {
      Row: SupabaseRow
      Insert: SupabaseRow
      Update: SupabaseRow
    }>
    Views: Record<string, {
      Row: SupabaseRow
    }>
    Functions: Record<string, {
      Args: Record<string, Json>
      Returns: Json
    }>
  }
}

// Próxima etapa: substituir este placeholder por tipos gerados via Supabase CLI.
