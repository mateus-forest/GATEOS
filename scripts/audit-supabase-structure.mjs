import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=")
      return [line.slice(0, index), line.slice(index + 1)]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const tables = [
  "users",
  "clients",
  "contracts",
  "contract_equipment",
  "installments",
  "financial_entries",
  "dre_categories",
  "cost_centers",
  "bank_accounts",
  "equipment",
  "assets",
  "maintenance_orders",
  "legal_cases",
  "legal_updates",
  "legal_agreement_installments",
  "documents",
  "partners",
  "partner_entries",
  "dre_monthly_closings",
  "dre_manual_adjustments",
  "notifications",
]

const views = [
  "v_dashboard_financial",
  "v_bank_balances",
  "v_dre_monthly",
  "v_contracts_summary",
  "v_overdue_installments",
  "v_assets_summary",
  "v_equipment_summary",
  "v_legal_summary",
  "v_profit_distribution_current_month",
]

const buckets = ["gate-documents", "gate-contracts", "gate-legal"]

async function probeRelation(name) {
  const { data, error } = await supabase.from(name).select("*").limit(1)
  return {
    name,
    ok: !error,
    code: error?.code ?? null,
    message: error?.message ?? null,
    columns: data?.[0] ? Object.keys(data[0]) : [],
  }
}

async function main() {
  const [tableResults, viewResults] = await Promise.all([
    Promise.all(tables.map(probeRelation)),
    Promise.all(views.map(probeRelation)),
  ])
  const { data: bucketRows, error: bucketError } = await supabase.storage.listBuckets()

  console.log(JSON.stringify({
    auditedAt: new Date().toISOString(),
    tables: tableResults,
    views: viewResults,
    buckets: {
      ok: !bucketError,
      code: bucketError?.name ?? null,
      message: bucketError?.message ?? null,
      found: bucketRows?.map((bucket) => bucket.name).filter((name) => buckets.includes(name)) ?? [],
      expected: buckets,
    },
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
