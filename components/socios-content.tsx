"use client"

import { useMemo, useState } from "react"
import { Download, Eye, HandCoins, MoreHorizontal, Plus, TrendingUp, Users } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { exportCsv, featureInPreparation } from "@/lib/cta-actions"
import { formatCurrency } from "@/lib/utils"

const colors = ["#22B8CF", "#22C55E", "#F59E0B"]

type Partner = {
  id: string
  name: string
  role: string
  share: number
  received: number
  distributions: number
  contributions: number
  returns: number
}

type PartnerEntry = {
  id: string
  partner: string
  type: "Distribuicao" | "Aporte" | "Devolucao" | "Pro-labore"
  month: string
  amount: number
  status: "Pago" | "Previsto"
}

const partners: Partner[] = [
  { id: "1", name: "Carlos", role: "Socio administrador", share: 40, received: 54000, distributions: 42000, contributions: 0, returns: 12000 },
  { id: "2", name: "Renan", role: "Socio operacional", share: 35, received: 46200, distributions: 36200, contributions: 0, returns: 10000 },
  { id: "3", name: "Mateus", role: "Socio comercial", share: 25, received: 32500, distributions: 26000, contributions: 3500, returns: 3000 },
]

const initialEntries: PartnerEntry[] = [
  { id: "1", partner: "Carlos", type: "Distribuicao", month: "jan-26", amount: 10000, status: "Pago" },
  { id: "2", partner: "Renan", type: "Distribuicao", month: "jan-26", amount: 10000, status: "Pago" },
  { id: "3", partner: "Mateus", type: "Aporte", month: "fev-26", amount: 3500, status: "Pago" },
  { id: "4", partner: "Carlos", type: "Devolucao", month: "mai-26", amount: 5555.56, status: "Pago" },
  { id: "5", partner: "Renan", type: "Distribuicao", month: "mai-26", amount: 32000, status: "Previsto" },
]

export function SociosContent() {
  const [entries, setEntries] = useState<PartnerEntry[]>(initialEntries)
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<Partner | null>(null)
  const [form, setForm] = useState({ partner: "Carlos", type: "Distribuicao", month: "jun-26", amount: "" })

  const totals = useMemo(() => {
    const received = partners.reduce((total, partner) => total + partner.received, 0)
    const distributions = partners.reduce((total, partner) => total + partner.distributions, 0)
    const contributions = partners.reduce((total, partner) => total + partner.contributions, 0)
    const returns = partners.reduce((total, partner) => total + partner.returns, 0)
    return { received, distributions, contributions, returns, net: received + returns - contributions }
  }, [])

  const chartData = partners.map((partner) => ({ name: partner.name, value: partner.share }))

  const handleSave = () => {
    const amount = Number(form.amount.replace(",", "."))
    if (!amount) {
      toast.error("Informe um valor valido")
      return
    }

    setEntries((current) => [
      {
        id: String(current.length + 1),
        partner: form.partner,
        type: form.type as PartnerEntry["type"],
        month: form.month,
        amount,
        status: "Previsto",
      },
      ...current,
    ])
    toast.success("Lancamento de socio salvo com sucesso")
    setOpen(false)
    setForm({ partner: "Carlos", type: "Distribuicao", month: "jun-26", amount: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Socios</h1>
          <p className="text-muted-foreground">Participacoes, aportes, distribuicoes e saldo liquido.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportCsv("gate-socios.csv", entries.map((entry) => ({
            id: entry.id,
            socio: entry.partner,
            tipo: entry.type,
            mes: entry.month,
            status: entry.status,
            valor: entry.amount,
          })))}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo lancamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <Users className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Socios</p>
            <p className="text-2xl font-bold">{partners.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <HandCoins className="mb-3 h-5 w-5 text-emerald-600" />
            <p className="text-sm text-muted-foreground">Total recebido</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.received)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <TrendingUp className="mb-3 h-5 w-5 text-blue-600" />
            <p className="text-sm text-muted-foreground">Distribuicoes</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.distributions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Aportes</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.contributions)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Devolucoes: {formatCurrency(totals.returns)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Saldo liquido</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.net)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Participacao societaria</CardTitle>
            <CardDescription>Divisao percentual atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {partners.map((partner, index) => (
                <div key={partner.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                    {partner.name}
                  </span>
                  <strong>{partner.share}%</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quadro de socios</CardTitle>
            <CardDescription>Indicadores individuais mockados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partners.map((partner, index) => (
                <div key={partner.id} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="text-white" style={{ backgroundColor: colors[index] }}>
                        {partner.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">{partner.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Participacao</p>
                      <p className="font-bold">{partner.share}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recebido</p>
                      <p className="font-bold">{formatCurrency(partner.received)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Aportes</p>
                      <p className="font-bold">{formatCurrency(partner.contributions)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(partner.received + partner.returns - partner.contributions)}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetails(partner)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => featureInPreparation("Edicao de socio depende do formulario real de cadastro societario.")}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportCsv("gate-socio-historico.csv", entries.filter((entry) => entry.partner === partner.name).map((entry) => ({
                        id: entry.id,
                        socio: entry.partner,
                        tipo: entry.type,
                        mes: entry.month,
                        status: entry.status,
                        valor: entry.amount,
                      })))}>Exportar historico</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentacoes dos socios</CardTitle>
          <CardDescription>Distribuicoes, aportes e devolucoes.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.partner}</TableCell>
                  <TableCell>{entry.type}</TableCell>
                  <TableCell>{entry.month}</TableCell>
                  <TableCell>
                    <Badge className={entry.status === "Pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(entry.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lancamento de socio</DialogTitle>
            <DialogDescription>Registro mockado salvo apenas no estado da tela.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {[
              ["partner", "Socio"],
              ["type", "Tipo"],
              ["month", "Mes"],
              ["amount", "Valor"],
            ].map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!details} onOpenChange={(nextOpen) => !nextOpen && setDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{details?.name}</DialogTitle>
            <DialogDescription>{details?.role}</DialogDescription>
          </DialogHeader>
          {details && (
            <div className="grid gap-3">
              <div className="flex justify-between rounded-lg border p-3">
                <span>Participacao nos lucros</span>
                <strong>{details.share}%</strong>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span>Distribuicoes</span>
                <strong>{formatCurrency(details.distributions)}</strong>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span>Aportes</span>
                <strong>{formatCurrency(details.contributions)}</strong>
              </div>
              <div className="flex justify-between rounded-lg border p-3">
                <span>Saldo liquido</span>
                <strong>{formatCurrency(details.received + details.returns - details.contributions)}</strong>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
