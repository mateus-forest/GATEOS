export const COS_READ_ONLY_BLOCK_MESSAGE =
  "Nesta etapa eu ainda nao posso executar alteracoes. Posso consultar dados reais, validar riscos e preparar um diagnostico ou preview conceitual."

export function insufficientDataMessage(field: string) {
  return `Nao encontrei dados suficientes para responder com seguranca. Preciso de pelo menos: ${field}.`
}

export function ambiguityMessage(count: number) {
  return `Encontrei ${count} registros possiveis. Escolha qual deles devo usar para continuar a analise.`
}

export function readOnlyDisclaimer(action: string) {
  return `${COS_READ_ONLY_BLOCK_MESSAGE} A intencao detectada foi: ${action}.`
}

