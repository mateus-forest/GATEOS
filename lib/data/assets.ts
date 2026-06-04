import { assets } from "@/lib/mock-data"
import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getAssets() {
  return selectRows("assets", assets)
}

export async function getAssetsSummary() {
  return selectRows("v_assets_summary", [])
}

export async function createAsset(payload: SupabaseRow) {
  return insertRow("assets", payload, { ...payload, id: crypto.randomUUID() })
}

export async function updateAsset(id: string, payload: SupabaseRow) {
  return updateRows("assets", payload, { id }, [{ ...payload, id }])
}
