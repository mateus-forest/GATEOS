"use client"

import { useSyncExternalStore } from "react"

export const dreCategories = [
  "Fribal",
  "Estácio Itapipoca",
  "Fortaleza Iguatemi",
  "Rio de Janeiro",
  "Intech",
  "Paulínia Nova",
  "Curitiba",
  "SG Itapipoca",
  "SG Atibaia",
  "Venda de produto",
  "Rendimento aplicação",
  "Outras receitas",
  "CPV",
  "Compra de equipamentos",
  "Fretes",
  "Manutenção vinculada à venda",
  "Salários",
  "Férias",
  "FGTS",
  "INSS",
  "Freelancer",
  "Alimentação",
  "Ajuda de custo",
  "Vale transporte",
  "Rescisão",
  "13º salário",
  "Outros custos com sócios",
  "Premiações e comissões",
  "Aluguel",
  "Condomínio",
  "Contabilidade",
  "Energia elétrica",
  "Serviços de terceiros",
  "Sistema",
  "Material limpeza e higiene",
  "Material escritório/gráfico",
  "Taxas",
  "Propagandas e marketing",
  "Material de manutenção e reparos",
  "Internet/IP",
  "Materiais diversos",
  "Prestação de serviços",
  "Viagens",
  "Impostos",
  "Simples Nacional",
  "Tarifa bancária",
  "Juros e empréstimos",
  "Investimento imobilizado Gamer Tech",
  "Outros custos investimentos",
  "Participação resultado",
  "Distribuição lucros sócios",
  "Devolução de empréstimos",
  "Aporte Carlos Forest",
  "Aporte Renan Linhares",
  "Aporte Mateus",
  "Total aportes terceiros",
] as const

export const costCenters = [
  "Locação de equipamentos",
  "Venda de produtos",
  "Serviços",
  "Administrativo",
  "Comercial",
  "Operacional",
  "Financeiro",
  "Manutenção",
  "Sócios",
  "Investimentos",
  "Impostos",
  "Banco",
  "Outros",
] as const

export const launchTypes = [
  "Receita",
  "Despesa",
  "Transferência",
  "Aporte",
  "Distribuição de lucro",
  "Devolução de empréstimo",
  "Investimento",
] as const

export const launchStatuses = [
  "Pago",
  "A pagar",
  "Recebido",
  "A receber",
  "Parcial",
  "Cancelado",
] as const

export const bankAccounts = ["Banco Itaú CNPJ", "Aplicação", "Caixa"] as const
export const paymentMethods = ["PIX", "TED", "Boleto", "Cartão", "Dinheiro", "Transferência", "Outro"] as const
export const recurrenceOptions = ["Não se repete", "Mensal", "Anual", "Personalizada"] as const
export const attachmentTypes = ["Boleto", "Recibo", "Nota fiscal", "Comprovante", "Contrato", "Outro"] as const

export type DreLaunchType = (typeof launchTypes)[number]
export type DreLaunchStatus = (typeof launchStatuses)[number]

export type DreLaunch = {
  id: string
  type: DreLaunchType
  status: DreLaunchStatus
  description: string
  amount: number
  competenceDate: string
  dueDate: string
  paymentDate: string
  bankAccount: string
  dreCategory: string
  costCenter: string
  party: string
  paymentMethod: string
  recurrence: string
  tags: string
  attachment: string
}

type Listener = () => void

let launches: DreLaunch[] = []
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return launches
}

function getServerSnapshot() {
  return []
}

export function addDreLaunch(launch: Omit<DreLaunch, "id">) {
  launches = [{ ...launch, id: crypto.randomUUID() }, ...launches]
  emit()
}

export function useDreLaunches() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function getDreRowLabel(category: string, type?: DreLaunchType) {
  if (type === "Distribuição de lucro") return "Distribuicao Lucros - Socios"
  if (type === "Investimento" && category === "Investimento imobilizado Gamer Tech") return "Investimento Imobilizado Gamer Tech"
  if (type === "Devolução de empréstimo") return "Devolucao de Emprestimos"

  const map: Record<string, string> = {
    "Estácio Itapipoca": "Estacio Itapipoca",
    "Paulínia Nova": "Paulinia Nova",
    "Rendimento aplicação": "Rendimento aplicacao",
    "Outras receitas": "Outras receitas",
    "Manutenção vinculada à venda": "Manutencao vinculada a venda",
    "Salários": "Salarios",
    "Férias": "Ferias",
    "FGTS": "Fgts",
    "INSS": "Inss",
    "Alimentação": "Alimentacao",
    "Ajuda de custo": "Ajuda de Custo",
    "13º salário": "13 Salario",
    "Outros custos com sócios": "Outros Custos com Socios",
    "Premiações e comissões": "Premiacoes e Comissoes",
    "Condomínio": "Condominio",
    "Energia elétrica": "Energia Eletrica",
    "Serviços de terceiros": "Serv. de Terceiros",
    "Material limpeza e higiene": "Mat. Limpeza e Higiene",
    "Material escritório/gráfico": "Mat. Escritorio/grafico",
    "Taxas": "Taxas - outras",
    "Material de manutenção e reparos": "Material de Manutencao e Reparos",
    "Internet/IP": "Internet/ip",
    "Materiais diversos": "Materiais Diversos (embalagens)",
    "Prestação de serviços": "Prestacao de servicos",
    "Impostos": "Imposto",
    "Tarifa bancária": "Tarifa Bancaria",
    "Juros e empréstimos": "Juros e Emprestimos",
    "Investimento imobilizado Gamer Tech": "Investimento Imobilizado Gamer Tech",
    "Outros custos investimentos": "Outros Custos Investimentos (Fretes, Outros)",
    "Participação resultado": "Participacao Resultado",
    "Distribuição lucros sócios": "Distribuicao Lucros - Socios",
    "Devolução de empréstimos": "Devolucao de Emprestimos",
    "Total aportes terceiros": "TOTAL APORTES TERCEIROS",
  }

  return map[category] ?? category
}

export function getDreSignedAmount(launch: Pick<DreLaunch, "amount" | "type">) {
  if (launch.type === "Receita" || launch.type === "Aporte") return launch.amount
  if (launch.type === "Transferência") return 0
  return -Math.abs(launch.amount)
}

export function getMonthIndexFromCompetence(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return -1
  return parsed.getMonth()
}
