"use client"

export type ReportTone = "positive" | "attention" | "neutral" | "danger"

export type ReportKpi = {
  label: string
  value: string
  variation?: string
  tone?: ReportTone
}

export type ReportTable = {
  title: string
  columns: string[]
  rows: Array<Array<string | number | null | undefined>>
  emptyMessage?: string
}

export type ReportHighlight = {
  title: string
  description?: string
  tone?: ReportTone
}

export type ReportChartItem = {
  label: string
  value: number
  color?: string
}

export type UniversalReport = {
  title: string
  subtitle?: string
  description?: string
  periodStart?: string
  periodEnd?: string
  issuedAt?: string
  generatedBy?: string
  company?: string
  version?: string
  filename?: string
  kpis?: ReportKpi[]
  executiveSummary?: string
  charts?: Array<{
    title: string
    type?: "bars" | "distribution"
    items: ReportChartItem[]
    emptyMessage?: string
  }>
  tables?: ReportTable[]
  highlights?: ReportHighlight[]
  observations?: string[]
  recommendations?: string[]
}
