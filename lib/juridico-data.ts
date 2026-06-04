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
  const today = new Date("2026-06-04T00:00:00").getTime()
  return Math.max(0, Math.floor((today - due) / 86400000))
}

export const juridicoCases: JuridicoCaso[] = [
  {
    id: "jur-1",
    cliente: "SG Itapipoca",
    contrato: "CT-2024-008",
    parcelas: "7, 8 e 9",
    processo: "0001842-22.2026.8.06.0101",
    responsavel: "Carlos Silva",
    advogado: "Dra. Amanda Rocha",
    status: "Em negociação",
    etapa: "Proposta de acordo",
    risco: "Médio",
    valorOriginal: 8900,
    mensalidade: 2966.67,
    parcelasVencidas: 3,
    multa: 890,
    juros: 312,
    desconto: 0,
    custas: 0,
    honorarios: 0,
    valorNegociado: 10102,
    valorPago: 0,
    dataEntrada: "2026-05-08",
    ultimaAtualizacao: "2026-06-01",
    proximoPrazo: "2026-06-10",
    prazoPagamento: "2026-06-15",
    encerramentoPrevisto: "2026-08-15",
    parcelado: true,
    acordoStatus: "Em negociação",
    entrada: 1500,
    quantidadeParcelas: 4,
    primeiroVencimento: "2026-06-20",
    formaPagamento: "Boleto",
    resumo: "Cliente com três mensalidades vencidas e proposta de acordo em análise.",
    ultimoAndamento: "Proposta enviada para validação do cliente.",
    resultadoEsperado: "Recebimento integral em acordo parcelado.",
    resultadoAcao: "Ainda sem ação judicial.",
    observacoes: "Priorizar acordo extrajudicial.",
  },
  {
    id: "jur-2",
    cliente: "Fribal",
    contrato: "CT-2024-001",
    parcelas: "11 e 12",
    processo: "",
    responsavel: "Renan Linhares",
    advogado: "Escritório Linhares & Rocha",
    status: "Notificação extrajudicial",
    etapa: "Notificação enviada",
    risco: "Alto",
    valorOriginal: 7200,
    mensalidade: 3600,
    parcelasVencidas: 2,
    multa: 720,
    juros: 280,
    desconto: 300,
    custas: 0,
    honorarios: 450,
    valorNegociado: 8350,
    valorPago: 1200,
    dataEntrada: "2026-05-20",
    ultimaAtualizacao: "2026-06-03",
    proximoPrazo: "2026-06-12",
    prazoPagamento: "2026-06-18",
    encerramentoPrevisto: "2026-07-30",
    parcelado: true,
    acordoStatus: "Aceito",
    entrada: 1200,
    quantidadeParcelas: 3,
    primeiroVencimento: "2026-06-18",
    formaPagamento: "PIX",
    resumo: "Notificação enviada com aceite preliminar de acordo.",
    ultimoAndamento: "Cliente confirmou recebimento da notificação.",
    resultadoEsperado: "Regularização em três parcelas.",
    resultadoAcao: "Sem protocolo judicial.",
    observacoes: "Acompanhar primeiro vencimento.",
  },
  {
    id: "jur-3",
    cliente: "Fortaleza Iguatemi",
    contrato: "CT-2024-003",
    parcelas: "4",
    processo: "0009123-41.2026.8.06.0001",
    responsavel: "Mateus Forest",
    advogado: "Dra. Amanda Rocha",
    status: "Ação judicial",
    etapa: "Processo protocolado",
    risco: "Crítico",
    valorOriginal: 12500,
    mensalidade: 12500,
    parcelasVencidas: 1,
    multa: 1250,
    juros: 620,
    desconto: 0,
    custas: 890,
    honorarios: 1800,
    valorNegociado: 17060,
    valorPago: 0,
    dataEntrada: "2026-04-12",
    ultimaAtualizacao: "2026-06-02",
    proximoPrazo: "2026-06-24",
    prazoPagamento: "2026-06-30",
    encerramentoPrevisto: "2026-11-30",
    parcelado: false,
    acordoStatus: "Em negociação",
    entrada: 0,
    quantidadeParcelas: 1,
    primeiroVencimento: "2026-06-30",
    formaPagamento: "TED",
    resumo: "Processo protocolado por inadimplência crítica.",
    ultimoAndamento: "Petição inicial protocolada.",
    resultadoEsperado: "Acordo em audiência.",
    resultadoAcao: "Aguardando despacho.",
    observacoes: "Caso prioritário.",
  },
]

export function isContratoEmJuridico(contractNumber: string) {
  return juridicoCases.some((caso) => caso.contrato === contractNumber && caso.status !== "Encerrado" && caso.status !== "Perdido")
}

export function getJuridicoByContrato(contractNumber: string) {
  return juridicoCases.find((caso) => caso.contrato === contractNumber)
}
