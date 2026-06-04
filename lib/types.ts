// ==================== TIPOS DO SISTEMA GATE OS ====================

export type UserRole = 'admin' | 'gestor' | 'operador' | 'visualizador'

export interface User {
  id: string
  nome: string
  email: string
  avatar?: string
  cargo: string
  role: UserRole
  ativo: boolean
}

export interface Socio {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  participacao: number
  dataEntrada: string
  ativo: boolean
}

export interface Cliente {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  inscricaoEstadual?: string
  email: string
  telefone: string
  endereco: Endereco
  contato: Contato
  dataCadastro: string
  ativo: boolean
  segmento: string
}

export interface Endereco {
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export interface Contato {
  nome: string
  cargo: string
  email: string
  telefone: string
}

export type TipoContrato = 'locacao' | 'venda' | 'manutencao' | 'suporte'
export type StatusContrato = 'ativo' | 'suspenso' | 'encerrado' | 'pendente'

export interface Contrato {
  id: string
  numero: string
  clienteId: string
  cliente?: Cliente
  tipo: TipoContrato
  status: StatusContrato
  dataInicio: string
  dataFim?: string
  valorMensal: number
  valorTotal: number
  descricao: string
  equipamentos: EquipamentoContrato[]
  parcelas: Parcela[]
  documentos: Documento[]
  observacoes?: string
  dataCriacao: string
  dataAtualizacao: string
}

export interface EquipamentoContrato {
  equipamentoId: string
  equipamento?: Equipamento
  quantidade: number
  valorUnitario: number
}

export type StatusParcela = 'pendente' | 'pago' | 'atrasado' | 'cancelado'

export interface Parcela {
  id: string
  contratoId: string
  contrato?: Contrato
  numero: number
  valor: number
  dataVencimento: string
  dataPagamento?: string
  status: StatusParcela
  formaPagamento?: string
  comprovante?: string
  observacoes?: string
}

export type CategoriaPatrimonio = 'imovel' | 'veiculo' | 'equipamento' | 'mobiliario' | 'software' | 'outro'
export type StatusPatrimonio = 'ativo' | 'em_manutencao' | 'inativo' | 'vendido' | 'descartado'

export interface Patrimonio {
  id: string
  codigo: string
  nome: string
  descricao: string
  categoria: CategoriaPatrimonio
  status: StatusPatrimonio
  valorAquisicao: number
  dataAquisicao: string
  valorAtual: number
  depreciacao: number
  localizacao: string
  responsavel: string
  notaFiscal?: string
  garantiaAte?: string
  observacoes?: string
}

export type CategoriaEquipamento = 'servidor' | 'computador' | 'impressora' | 'rede' | 'telefonia' | 'seguranca' | 'outro'
export type StatusEquipamento = 'disponivel' | 'locado' | 'em_manutencao' | 'reservado' | 'inativo'

export interface Equipamento {
  id: string
  codigo: string
  nome: string
  descricao: string
  categoria: CategoriaEquipamento
  status: StatusEquipamento
  marca: string
  modelo: string
  numeroSerie: string
  valorCompra: number
  valorLocacao: number
  dataCompra: string
  garantiaAte?: string
  patrimonioId?: string
  patrimonio?: Patrimonio
  clienteAtual?: string
  contratoAtual?: string
  ultimaManutencao?: string
  proximaManutencao?: string
  observacoes?: string
}

export type TipoManutencao = 'preventiva' | 'corretiva' | 'emergencial' | 'upgrade'
export type StatusManutencao = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'
export type PrioridadeManutencao = 'baixa' | 'media' | 'alta' | 'critica'

export interface Manutencao {
  id: string
  equipamentoId: string
  equipamento?: Equipamento
  tipo: TipoManutencao
  status: StatusManutencao
  prioridade: PrioridadeManutencao
  descricao: string
  dataAgendada: string
  dataInicio?: string
  dataConclusao?: string
  tecnico: string
  custo: number
  pecas?: PecaManutencao[]
  observacoes?: string
}

export interface PecaManutencao {
  nome: string
  quantidade: number
  valorUnitario: number
}

export type TipoLancamento = 'receita' | 'despesa'
export type CategoriaLancamento = 
  | 'locacao' 
  | 'venda' 
  | 'servico' 
  | 'manutencao'
  | 'salario'
  | 'imposto'
  | 'aluguel'
  | 'energia'
  | 'agua'
  | 'internet'
  | 'telefone'
  | 'marketing'
  | 'equipamento'
  | 'software'
  | 'outros'

export type StatusLancamento = 'pendente' | 'confirmado' | 'cancelado'

export interface Lancamento {
  id: string
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: number
  dataLancamento: string
  dataCompetencia: string
  status: StatusLancamento
  contratoId?: string
  contrato?: Contrato
  clienteId?: string
  cliente?: Cliente
  parcelaId?: string
  parcela?: Parcela
  documentoFiscal?: string
  formaPagamento?: string
  contaBancaria?: string
  centroCusto?: string
  observacoes?: string
}

export type TipoDocumento = 'contrato' | 'nota_fiscal' | 'comprovante' | 'laudo' | 'manual' | 'certificado' | 'outro'

export interface Documento {
  id: string
  nome: string
  tipo: TipoDocumento
  arquivo: string
  tamanho: number
  dataUpload: string
  uploadPor: string
  entidadeId: string
  entidadeTipo: 'contrato' | 'cliente' | 'equipamento' | 'patrimonio' | 'manutencao'
  observacoes?: string
}

export interface DRELinha {
  id: string
  codigo: string
  descricao: string
  tipo: 'grupo' | 'conta'
  ordem: number
  nivel: number
  valores: { [mes: string]: number }
  acumulado: number
}

export interface DRE {
  periodo: string
  ano: number
  linhas: DRELinha[]
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  custos: number
  lucroBruto: number
  despesasOperacionais: number
  resultadoOperacional: number
  resultadoFinanceiro: number
  lucroAntes: number
  impostos: number
  lucroLiquido: number
}

export interface ConfiguracaoSistema {
  nomeEmpresa: string
  cnpj: string
  logo: string
  corPrimaria: string
  corSecundaria: string
  emailNotificacoes: string
  diasAlertaVencimento: number
  backupAutomatico: boolean
  frequenciaBackup: 'diario' | 'semanal' | 'mensal'
}

export interface Notificacao {
  id: string
  tipo: 'alerta' | 'info' | 'sucesso' | 'erro'
  titulo: string
  mensagem: string
  lida: boolean
  data: string
  link?: string
}

export interface DashboardMetrics {
  receitaMensal: number
  receitaMensalVariacao: number
  despesaMensal: number
  despesaMensalVariacao: number
  lucroMensal: number
  lucroMensalVariacao: number
  contratosAtivos: number
  contratosAtivosVariacao: number
  equipamentosLocados: number
  equipamentosLocadosVariacao: number
  clientesAtivos: number
  clientesAtivosVariacao: number
  parcelasVencidas: number
  parcelasVencer30Dias: number
  manutencoesPendentes: number
  taxaInadimplencia: number
}

export interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}
