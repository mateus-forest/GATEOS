import { InternalLayout } from "@/components/internal-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { clientLabel } from "@/lib/data/display-labels"
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

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
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

export default async function ContratoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: contract } = supabase
    ? await supabase.from("v_contracts_summary").select("*").eq("id", id).maybeSingle()
    : { data: null }
  const { data: juridico } = supabase
    ? await supabase.from("legal_cases").select("*").eq("contract_id", id).maybeSingle()
    : { data: null }
  const clientId = text(contract, ["client_id"], "")
  const rawClientName = text(contract, ["client_name", "clientName"], "")
  const { data: client } = supabase && clientId
    ? await supabase.from("clients").select("*").eq("id", clientId).maybeSingle()
    : { data: null }
  const displayClientName = rawClientName && !isUuidLike(rawClientName)
    ? rawClientName
    : client ? clientLabel(client) : "Cliente nao encontrado"

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{text(contract, ["contract_number", "number"], "Contrato nao encontrado")}</h1>
            <p className="text-muted-foreground">Detalhes do contrato</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/contratos"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Voltar para contratos
            </Link>
            <Link
              href="/juridico"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Abrir juridico
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{displayClientName}</CardTitle>
            <CardDescription>{text(contract, ["description", "notes"], "Contrato carregado do Supabase")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor mensal</p>
              <p className="font-medium">{formatCurrency(num(contract, ["monthly_value", "monthlyValue"]))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="font-medium">{formatDate(text(contract, ["start_date", "startDate"], ""))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fim</p>
              <p className="font-medium">{formatDate(text(contract, ["end_date", "endDate"], ""))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{text(contract, ["status"])}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jurídico</CardTitle>
            <CardDescription>Status jurídico vinculado ao contrato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {juridico ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Status do caso</p>
                  <Badge className="bg-red-100 text-red-700">{text(juridico, ["status"])}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etapa</p>
                  <p className="font-medium">{text(juridico, ["stage", "etapa"])}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor atualizado</p>
                  <p className="font-medium">{formatCurrency(num(juridico, ["updated_amount", "amount", "valor_atualizado"]))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximo prazo</p>
                  <p className="font-medium">{text(juridico, ["next_deadline", "proximo_prazo"])}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{text(juridico, ["updated_at", "ultima_atualizacao"])}</p>
                </div>
              </>
            ) : (
              <div className="md:col-span-4">
                <p className="text-sm text-muted-foreground">Nenhum caso jurídico vinculado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  )
}
