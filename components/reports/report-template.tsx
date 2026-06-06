"use client"

import type { UniversalReport } from "@/lib/reports/report-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ReportTemplate({ report }: { report: UniversalReport }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <ReportHeader report={report} />
      <div className="space-y-4 p-4 md:p-6">
        <ReportSection title="Resumo Executivo">
          <p className="text-sm leading-6 text-muted-foreground">
            {report.executiveSummary ?? "Sem dados disponíveis para o período selecionado."}
          </p>
        </ReportSection>
        <ReportKpiGrid report={report} />
        {report.tables?.map((table) => <ReportTable key={table.title} table={table} />)}
        <ReportHighlights report={report} />
        <ReportFooter report={report} />
      </div>
    </div>
  )
}

export function ReportHeader({ report }: { report: UniversalReport }) {
  return (
    <div className="grid gap-6 bg-slate-950 p-6 text-white md:grid-cols-[1.3fr_.7fr]">
      <div>
        <img src="/brand/gate-logo-original.png" alt="GATE Soluções Tecnológicas" className="mb-8 h-auto w-40 object-contain" />
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Relatório</p>
        <h2 className="mt-2 text-3xl font-bold uppercase">{report.title}</h2>
        {report.subtitle ? <p className="mt-2 text-xl font-semibold text-sky-400">{report.subtitle}</p> : null}
        {report.description ? <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200">{report.description}</p> : null}
      </div>
      <ReportMetadataCard report={report} />
    </div>
  )
}

export function ReportMetadataCard({ report }: { report: UniversalReport }) {
  const rows = [
    ["Data de emissão", report.issuedAt ?? new Date().toLocaleDateString("pt-BR")],
    ["Período analisado", report.periodStart || report.periodEnd ? `${report.periodStart ?? "Início"} a ${report.periodEnd ?? "Atual"}` : "Período não informado"],
    ["Gerado por", report.generatedBy ?? "GATE OS"],
    ["Empresa", report.company ?? "GATE Soluções Tecnológicas"],
    ["Versão", report.version ?? "1.0"],
  ]

  return (
    <div className="rounded-lg border border-white/25 bg-white/5 p-4">
      {rows.map(([label, value]) => (
        <div key={label} className="mb-3 last:mb-0">
          <p className="text-[11px] uppercase text-slate-300">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      ))}
    </div>
  )
}

export function ReportKpiGrid({ report }: { report: UniversalReport }) {
  const kpis = report.kpis ?? []

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {kpis.length ? kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-xl font-bold">{kpi.value}</p>
            {kpi.variation ? <Badge variant="secondary" className="mt-2">{kpi.variation}</Badge> : null}
          </CardContent>
        </Card>
      )) : (
        <Card className="md:col-span-4">
          <CardContent className="p-4 text-sm text-muted-foreground">Sem indicadores disponíveis.</CardContent>
        </Card>
      )}
    </div>
  )
}

export function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base uppercase text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ReportTable({ table }: { table: NonNullable<UniversalReport["tables"]>[number] }) {
  return (
    <ReportSection title={table.title}>
      {table.rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-950 text-white">
                {table.columns.map((column) => <th key={column} className="px-3 py-2 text-left">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index} className="border-b">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell ?? "-"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{table.emptyMessage ?? "Sem dados disponíveis para o período selecionado."}</p>
      )}
    </ReportSection>
  )
}

export function ReportHighlights({ report }: { report: UniversalReport }) {
  const highlights = report.highlights ?? []
  if (!highlights.length) return null

  return (
    <ReportSection title="Destaques do Período">
      <div className="space-y-3">
        {highlights.map((highlight) => (
          <div key={highlight.title} className="border-l-4 border-primary pl-3">
            <p className="font-semibold">{highlight.title}</p>
            {highlight.description ? <p className="text-sm text-muted-foreground">{highlight.description}</p> : null}
          </div>
        ))}
      </div>
    </ReportSection>
  )
}

export function ReportFooter({ report }: { report: UniversalReport }) {
  return (
    <p className="border-t pt-4 text-right text-xs text-muted-foreground">
      GATE OS - Relatório gerado em {report.issuedAt ?? new Date().toLocaleDateString("pt-BR")}
    </p>
  )
}
