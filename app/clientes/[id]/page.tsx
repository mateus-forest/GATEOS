import { InternalLayout } from "@/components/internal-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"

type Row = Record<string, unknown>

function text(row: Row | null, keys: string[], fallback = "-") {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (value !== null && value !== undefined && String(value).trim() !== "") return String(value)
  }
  return fallback
}

function num(row: Row | null, keys: string[]) {
  if (!row) return 0
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "number") return value
    if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value)
  }
  return 0
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: client } = supabase
    ? await supabase.from("clients").select("*").eq("id", id).maybeSingle()
    : { data: null }

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{text(client, ["name", "company_name", "legal_name"], "Cliente nao encontrado")}</h1>
            <p className="text-muted-foreground">Detalhes do cliente</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/clientes"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Voltar para clientes
            </Link>
            <Link
              href="/contratos"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Novo contrato
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>{text(client, ["company_name", "legal_name", "fantasy_name"])}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Documento</p>
              <p className="font-medium">{text(client, ["document", "document_number"])}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita mensal</p>
              <p className="font-medium">{formatCurrency(num(client, ["monthly_revenue", "revenue_month"]))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{text(client, ["status"])}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  )
}
