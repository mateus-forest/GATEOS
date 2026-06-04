import { InternalLayout } from "@/components/internal-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { contracts } from "@/lib/mock-data"
import { getJuridicoByContrato, getValorAtualizado } from "@/lib/juridico-data"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function ContratoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contract = contracts.find((item) => item.id === id) ?? contracts[0]
  const juridico = getJuridicoByContrato(contract.number)

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{contract.number}</h1>
            <p className="text-muted-foreground">Detalhes mockados do contrato</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Renegociar</Button>
            <Button>Gerar recibo</Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{contract.clientName}</CardTitle>
            <CardDescription>{contract.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor mensal</p>
              <p className="font-medium">{formatCurrency(contract.monthlyValue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="font-medium">{formatDate(contract.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fim</p>
              <p className="font-medium">{formatDate(contract.endDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{contract.status}</Badge>
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
                  <Badge className="bg-red-100 text-red-700">{juridico.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Etapa</p>
                  <p className="font-medium">{juridico.etapa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor atualizado</p>
                  <p className="font-medium">{formatCurrency(getValorAtualizado(juridico))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximo prazo</p>
                  <p className="font-medium">{juridico.proximoPrazo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{juridico.ultimaAtualizacao}</p>
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
