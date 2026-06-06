import { InternalLayout } from "@/components/internal-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { clients } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = clients.find((item) => item.id === id) ?? clients[0]

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">Detalhes do cliente</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Editar</Button>
            <Button>Salvar</Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>{client.companyName}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Documento</p>
              <p className="font-medium">{client.document}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita mensal</p>
              <p className="font-medium">{formatCurrency(client.monthlyRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{client.status === "active" ? "Ativo" : "Inativo"}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  )
}
