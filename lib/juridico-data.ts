export type JuridicoStatus =
  | "Em análise"
  | "Notificação extrajudicial"
  | "Em negociação"
  | "Acordo firmado"
  | "Ação judicial"
  | "Em execução"
  | "Encerrado"
  | "Perdido"

export type JuridicoRisco = "Baixo" | "Médio" | "Alto" | "Crítico"

export const juridicoStatuses: JuridicoStatus[] = [
  "Em análise",
  "Notificação extrajudicial",
  "Em negociação",
  "Acordo firmado",
  "Ação judicial",
  "Em execução",
  "Encerrado",
  "Perdido",
]

export const juridicoEtapas = [
  "Cobrança interna",
  "Notificação enviada",
  "Proposta de acordo",
  "Aguardando pagamento",
  "Processo protocolado",
  "Audiência",
  "Sentença",
  "Execução",
  "Baixa/encerramento",
]

export const juridicoRiscos: JuridicoRisco[] = ["Baixo", "Médio", "Alto", "Crítico"]
export const juridicoResponsaveis = ["Carlos Silva", "Renan Linhares", "Mateus Forest", "Dra. Amanda Rocha"]
export const juridicoFormasPagamento = ["PIX", "TED", "Boleto", "Cartão", "Dinheiro", "Transferência", "Outro"]
export const juridicoDocumentTypes = ["Contrato", "Termo de acordo", "Notificação extrajudicial", "Petição", "Sentença", "Boleto", "Recibo", "Comprovante", "Outros"]

export type JuridicoCaso = {
  id: string
  cliente: string
  contrato: string
  parcelas: string
  processo: string
  responsavel: string
  advogado: string
  status: JuridicoStatus
  etapa: string
  risco: JuridicoRisco
  valorOriginal: number
  mensalidade: number
  parcelasVencidas: number
  multa: number
  juros: number
  desconto: number
  custas: number
  honorarios: number
  valorNegociado: number
  valorPago: number
  dataEntrada: string
  ultimaAtualizacao: string
  proximoPrazo: string
  prazoPagamento: string
  encerramentoPrevisto: string
  parcelado: boolean
  acordoStatus: string
  entrada: number
  quantidadeParcelas: number
  primeiroVencimento: string
  formaPagamento: string
  resumo: string
  ultimoAndamento: string
  resultadoEsperado: string
  resultadoAcao: string
  observacoes: string
}

export function getValorAtualizado(caso: Pick<JuridicoCaso, "valorOriginal" | "multa" | "juros" | "custas" | "honorarios" | "desconto">) {
  return caso.valorOriginal + caso.multa + caso.juros + caso.custas + caso.honorarios - caso.desconto
}

export function getDiasAtraso(date: string) {
  const due = new Date(`${date}T00:00:00`).getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((today.getTime() - due) / 86400000))
}
