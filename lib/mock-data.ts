import type {
  ChartData,
  Cliente,
  Contrato,
  DashboardMetrics,
  Documento,
  Equipamento,
  Lancamento,
  Manutencao,
  Notificacao,
  Parcela,
  Patrimonio,
  Socio,
  User,
} from "./types"

export type ClientView = Cliente & {
  name: string
  companyName: string
  document: string
  phone: string
  segment: string
  type: string
  address: string
  status: string
  contractsCount: number
  monthlyRevenue: number
}

export type ContractView = Omit<Contrato, "status" | "tipo"> & {
  number: string
  client: string
  clientName: string
  type: string
  status: string
  startDate: string
  endDate: string
  monthlyValue: number
  totalValue: number
  description: string
}

export type EquipmentView = Omit<Equipamento, "status"> & {
  name: string
  code: string
  description: string
  type: string
  brand: string
  model: string
  serialNumber: string
  clientName: string
  location: string
  contractNumber: string
  value: number
  rentalValue: number
  purchaseDate: string
  warrantyUntil?: string
  status: string
}

export type InstallmentView = Omit<Parcela, "status"> & {
  number: number
  totalParcelas: number
  contractNumber: string
  clientName: string
  amount: number
  dueDate: string
  paymentDate?: string
  status: string
}

export type MaintenanceView = Omit<Manutencao, "status" | "tipo"> & {
  equipment: string
  equipmentName: string
  clientName: string
  ticketNumber: string
  type: string
  status: string
  priority: string
  description: string
  scheduledDate: string
  startDate?: string
  completedDate?: string
  technician: string
  cost: number
}

export type PartnerView = Socio & {
  name: string
  document: string
  phone: string
  share: number
  entryDate: string
  status: string
  capitalValue: number
  monthlyDistribution: number
}

export type AssetView = Omit<Patrimonio, "status"> & {
  name: string
  code: string
  description: string
  acquisitionValue: number
  currentValue: number
  acquisitionDate: string
  location: string
  responsible: string
  status: string
}

export type TransactionView = Omit<Lancamento, "status" | "tipo" | "categoria" | "descricao"> & {
  type: string
  category: string
  description: string
  amount: number
  date: string
  status: string
}

export const currentUser: User & { name: string } = {
  id: "current-user",
  nome: "Usuario GATE OS",
  name: "Usuario GATE OS",
  email: "usuario@gateos.local",
  cargo: "Operador",
  role: "admin",
  ativo: true,
}

export const socios: Socio[] = []
export const clientes: Cliente[] = []
export const equipamentos: Equipamento[] = []
export const contratos: Contrato[] = []
export const parcelas: InstallmentView[] = []
export const patrimonios: Patrimonio[] = []
export const manutencoes: Manutencao[] = []
export const lancamentos: Lancamento[] = []
export const documentos: Documento[] = []

export const dashboardMetrics: DashboardMetrics = {
  receitaMensal: 0,
  receitaMensalVariacao: 0,
  despesaMensal: 0,
  despesaMensalVariacao: 0,
  lucroMensal: 0,
  lucroMensalVariacao: 0,
  contratosAtivos: 0,
  contratosAtivosVariacao: 0,
  equipamentosLocados: 0,
  equipamentosLocadosVariacao: 0,
  clientesAtivos: 0,
  clientesAtivosVariacao: 0,
  parcelasVencidas: 0,
  parcelasVencer30Dias: 0,
  manutencoesPendentes: 0,
  taxaInadimplencia: 0,
}

export const notificacoes: Notificacao[] = []
export const notifications: Array<Notificacao & {
  title: string
  message: string
  read: boolean
  time: string
}> = []

export const receitaMensalChart: ChartData[] = []
export const receitaPorCategoriaChart: ChartData[] = []
export const equipamentosPorStatusChart: ChartData[] = []
export const inadimplenciaChart: ChartData[] = []
export const revenueData: Array<{ month: string; revenue: number; target: number }> = []
export const contractsByStatus: ChartData[] = []
export const recentActivities: Array<{
  id: string
  type: "payment" | "contract" | "maintenance" | "client"
  title: string
  description: string
  time: string
  status: "success" | "warning" | "info" | "error"
}> = []
export const upcomingPayments: Array<{
  id: string
  client: string
  amount: number
  dueDate: string
  status: "pending" | "overdue"
}> = []

export const clients: ClientView[] = []
export const contracts: ContractView[] = []
export const equipments: EquipmentView[] = []
export const maintenances: MaintenanceView[] = []
export const partners: PartnerView[] = []
export const assets: AssetView[] = []
export const transactions: TransactionView[] = []
export const cashFlowData: Array<{ date: string; balance: number }> = []

export const dreData = {
  receitas: [] as ChartData[],
  custos: [] as ChartData[],
  despesas: [] as ChartData[],
}

export const dreCategories: ChartData[] = []
