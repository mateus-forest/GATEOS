import { MONTH_NAMES, monthLabel, normalizeText } from "@/lib/cos/cos-context"
import type { ReadOnlyEntityRef, ReadOnlyOperationalContext } from "@/lib/cos/read-only-context"

export type ReadOnlyPeriod = {
  year: number
  month: number
  label: string
}

export type ReadOnlyPeriodResolution =
  | {
      kind: "none"
    }
  | {
      kind: "resolved"
      period: ReadOnlyPeriod
    }
  | {
      kind: "range"
      label: string
    }
  | {
      kind: "ambiguous"
      prompt: string
      options: ReadOnlyEntityRef[]
    }

const SHORT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function currentDate() {
  return new Date()
}

function periodRef(year: number, month: number): ReadOnlyEntityRef {
  const label = `${monthLabel(month)}/${year}`
  return {
    type: "period",
    id: `${year}-${String(month).padStart(2, "0")}`,
    name: label,
    description: `Periodo ${label}`,
  }
}

export function parsePeriodRef(ref: ReadOnlyEntityRef): ReadOnlyPeriod | null {
  if (ref.type !== "period") return null
  const match = ref.id.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  return {
    year,
    month,
    label: `${monthLabel(month)}/${year}`,
  }
}

export function resolveReadOnlyPeriod(message: string, context?: ReadOnlyOperationalContext): ReadOnlyPeriodResolution {
  const text = normalizeText(message)
  const now = currentDate()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const yearMatch = text.match(/\b(20\d{2})\b/)
  const explicitYear = yearMatch ? Number(yearMatch[1]) : null
  const monthIndex = MONTH_NAMES.findIndex((name) => text.includes(name))
  const shortIndex = SHORT_MONTHS.findIndex((name) => new RegExp(`\\b${name}\\b`).test(text))
  const month = monthIndex >= 0 ? monthIndex + 1 : shortIndex >= 0 ? shortIndex + 1 : null

  if (text.includes("ultimos 30 dias") || text.includes("ultimos trinta dias")) {
    return { kind: "range", label: "ultimos 30 dias" }
  }

  if (text.includes("ultimos 90 dias") || text.includes("ultimos noventa dias")) {
    return { kind: "range", label: "ultimos 90 dias" }
  }

  if (text.includes("mes passado")) {
    const date = new Date(currentYear, currentMonth - 2, 1)
    const resolvedMonth = date.getMonth() + 1
    const resolvedYear = date.getFullYear()
    return { kind: "resolved", period: { year: resolvedYear, month: resolvedMonth, label: `${monthLabel(resolvedMonth)}/${resolvedYear}` } }
  }

  if (text.includes("este mes") || text.includes("mes atual")) {
    return { kind: "resolved", period: { year: currentYear, month: currentMonth, label: `${monthLabel(currentMonth)}/${currentYear}` } }
  }

  if (text.includes("trimestre atual")) {
    const quarter = Math.floor((currentMonth - 1) / 3) + 1
    return { kind: "range", label: `${quarter} trimestre/${currentYear}` }
  }

  const quarterMatch = text.match(/\b(primeiro|segundo|terceiro|quarto)\s+trimestre\b/)
  if (quarterMatch) {
    const quarterName = quarterMatch[1]
    const year = explicitYear ?? currentYear
    return { kind: "range", label: `${quarterName} trimestre/${year}` }
  }

  if ((text.includes("este ano") || text.includes("ano atual")) && !month) {
    return { kind: "range", label: `${currentYear}` }
  }

  if (explicitYear && !month && /\b20\d{2}\b/.test(text)) {
    return { kind: "range", label: String(explicitYear) }
  }

  if (!month) {
    return context?.activePeriod ? { kind: "resolved", period: context.activePeriod } : { kind: "none" }
  }

  if (explicitYear) {
    return {
      kind: "resolved",
      period: {
        year: explicitYear,
        month,
        label: `${monthLabel(month)}/${explicitYear}`,
      },
    }
  }

  if (context?.activePeriod && context.activePeriod.month === month) {
    return { kind: "resolved", period: context.activePeriod }
  }

  return {
    kind: "ambiguous",
    prompt: `Voce quis dizer ${monthLabel(month)} de qual ano?`,
    options: [periodRef(currentYear, month), periodRef(currentYear - 1, month), periodRef(currentYear + 1, month)],
  }
}
