import { normalizeText } from "@/lib/cos/cos-context"
import { readOnlyDisclaimer } from "@/lib/cos/read-only-responses"

export type ReadOnlyBlockedIntent = {
  blocked: true
  intent:
    | "create"
    | "update"
    | "delete"
    | "attach"
    | "close_month"
    | "dre_adjustment"
    | "payment_write"
    | "mass_execution"
  label: string
  answer: string
}

const WRITE_PATTERNS: Array<{ intent: ReadOnlyBlockedIntent["intent"]; label: string; terms: string[] }> = [
  {
    intent: "mass_execution",
    label: "execucao em massa",
    terms: ["executar tudo", "confirmar tudo", "lancar tudo", "criar todos", "cadastrar todos"],
  },
  {
    intent: "dre_adjustment",
    label: "ajuste de DRE",
    terms: ["corrija a dre", "corrigir dre", "ajuste dre", "ajustar dre", "alterar dre"],
  },
  {
    intent: "close_month",
    label: "fechamento mensal",
    terms: ["feche ", "fechar ", "registrar fechamento", "fechamento de", "fechamento mensal"],
  },
  {
    intent: "attach",
    label: "anexacao de documento",
    terms: ["anexe", "anexar", "vincule documento", "subir arquivo", "upload"],
  },
  {
    intent: "payment_write",
    label: "baixa ou alteracao financeira",
    terms: ["baixe", "baixar pagamento", "marcar como pago", "marcar como recebido", "dar baixa"],
  },
  {
    intent: "delete",
    label: "exclusao",
    terms: ["exclua", "excluir", "delete", "apague", "apagar", "remova", "remover"],
  },
  {
    intent: "update",
    label: "edicao",
    terms: ["edite", "editar", "altere", "alterar", "atualize", "atualizar", "corrija", "corrigir", "mude", "mudar"],
  },
  {
    intent: "create",
    label: "criacao ou cadastro",
    terms: ["cadastre", "cadastrar", "crie", "criar", "novo contrato", "novo cliente", "novo equipamento", "lancar", "registre", "registrar"],
  },
]

export function detectReadOnlyBlockedIntent(message: string): ReadOnlyBlockedIntent | null {
  const text = normalizeText(message)
  const match = WRITE_PATTERNS.find((pattern) => pattern.terms.some((term) => text.includes(term)))
  if (!match) return null

  return {
    blocked: true,
    intent: match.intent,
    label: match.label,
    answer: readOnlyDisclaimer(match.label),
  }
}

