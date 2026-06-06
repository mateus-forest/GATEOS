"use client"

import type { UniversalReport } from "@/lib/reports/report-types"

const logoPath = "/brand/gate-logo-original.png"

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

export function exportReportPdf(report: UniversalReport) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900")

  if (!printWindow) {
    return false
  }

  printWindow.document.open()
  printWindow.document.write(renderReportHtml(report))
  printWindow.document.close()
  printWindow.focus()

  const print = () => {
    printWindow.print()
  }

  printWindow.addEventListener("load", () => window.setTimeout(print, 250), { once: true })
  window.setTimeout(print, 700)
  return true
}

function renderReportHtml(report: UniversalReport) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.filename ?? report.title)}</title>
  <style>${styles()}</style>
</head>
<body>
  <main class="report-page">
    ${renderHeader(report)}
    <section class="report-body">
      ${renderSummary(report)}
      ${renderKpis(report)}
      ${renderCharts(report)}
      ${renderTables(report)}
      ${renderHighlights(report)}
      ${renderNotes(report)}
    </section>
    <footer>GATE OS - Relatório gerado em ${escapeHtml(report.issuedAt ?? new Date().toLocaleDateString("pt-BR"))}</footer>
  </main>
</body>
</html>`
}

function renderHeader(report: UniversalReport) {
  const period = report.periodStart || report.periodEnd
    ? `${report.periodStart ?? "Início"} a ${report.periodEnd ?? "Atual"}`
    : "Período não informado"

  return `<header class="hero">
    <div>
      <img src="${logoPath}" alt="GATE Soluções Tecnológicas" class="logo" />
      <p class="eyebrow">Relatório</p>
      <h1>${escapeHtml(report.title)}</h1>
      <h2>${escapeHtml(report.subtitle ?? "Relatório GATE OS")}</h2>
      <div class="accent"></div>
      <p class="description">${escapeHtml(report.description ?? "Documento gerado pelo GATE OS.")}</p>
    </div>
    <aside class="metadata">
      ${meta("DATA DE EMISSÃO", report.issuedAt ?? new Date().toLocaleDateString("pt-BR"))}
      ${meta("PERÍODO ANALISADO", period)}
      ${meta("GERADO POR", report.generatedBy ?? "GATE OS")}
      ${meta("EMPRESA", report.company ?? "GATE Soluções Tecnológicas")}
      ${meta("VERSÃO DO RELATÓRIO", report.version ?? "1.0")}
    </aside>
  </header>`
}

function meta(label: string, value: string) {
  return `<div class="meta-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
}

function renderSummary(report: UniversalReport) {
  return `<section class="section">
    <div class="section-title"><span></span><h3>Resumo Executivo</h3><hr /></div>
    <div class="summary-card">${escapeHtml(report.executiveSummary ?? "Sem dados disponíveis para o período selecionado.")}</div>
  </section>`
}

function renderKpis(report: UniversalReport) {
  const kpis = report.kpis ?? []
  if (!kpis.length) {
    return `<section class="kpi-grid"><article class="kpi empty">Sem indicadores disponíveis.</article></section>`
  }

  return `<section class="kpi-grid">
    ${kpis.map((kpi) => `<article class="kpi ${kpi.tone ?? "neutral"}">
      <span>${escapeHtml(kpi.label)}</span>
      <strong>${escapeHtml(kpi.value)}</strong>
      ${kpi.variation ? `<small>${escapeHtml(kpi.variation)}</small>` : ""}
    </article>`).join("")}
  </section>`
}

function renderCharts(report: UniversalReport) {
  const charts = report.charts ?? []
  if (!charts.length) return ""

  return `<section class="chart-grid">${charts.map((chart) => {
    if (!chart.items.length) {
      return `<article class="panel"><h3>${escapeHtml(chart.title)}</h3><p class="empty-text">${escapeHtml(chart.emptyMessage ?? "Sem dados disponíveis.")}</p></article>`
    }

    const max = Math.max(...chart.items.map((item) => item.value), 1)
    return `<article class="panel"><h3>${escapeHtml(chart.title)}</h3><div class="bars">
      ${chart.items.map((item) => `<div class="bar-row">
        <span>${escapeHtml(item.label)}</span>
        <div><i style="width:${Math.max(2, (item.value / max) * 100)}%;background:${escapeHtml(item.color ?? "#0ea5e9")}"></i></div>
        <strong>${escapeHtml(item.value)}</strong>
      </div>`).join("")}
    </div></article>`
  }).join("")}</section>`
}

function renderTables(report: UniversalReport) {
  const tables = report.tables ?? []
  if (!tables.length) return ""

  return tables.map((table) => `<section class="panel break-safe">
    <h3>${escapeHtml(table.title)}</h3>
    ${table.rows.length ? `<table>
      <thead><tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
      <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? "-")}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>` : `<p class="empty-text">${escapeHtml(table.emptyMessage ?? "Sem dados disponíveis para o período selecionado.")}</p>`}
  </section>`).join("")
}

function renderHighlights(report: UniversalReport) {
  const highlights = report.highlights ?? []
  if (!highlights.length) return ""

  return `<section class="panel break-safe">
    <h3>Destaques do Período</h3>
    <div class="highlights">${highlights.map((highlight) => `<div class="highlight ${highlight.tone ?? "neutral"}">
      <strong>${escapeHtml(highlight.title)}</strong>
      ${highlight.description ? `<p>${escapeHtml(highlight.description)}</p>` : ""}
    </div>`).join("")}</div>
  </section>`
}

function renderNotes(report: UniversalReport) {
  const observations = report.observations ?? []
  const recommendations = report.recommendations ?? []

  if (!observations.length && !recommendations.length) return ""

  return `<section class="notes">
    <article class="panel">
      <h3>Observações</h3>
      ${observations.length ? `<ul>${observations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="empty-text">Sem observações adicionais.</p>`}
    </article>
    <article class="panel">
      <h3>Próximos Passos / Recomendações</h3>
      ${recommendations.length ? `<ul>${recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="empty-text">Sem recomendações adicionais.</p>`}
    </article>
  </section>`
}

function styles() {
  return `
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e8eef6; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .report-page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; box-shadow: 0 24px 80px rgba(15, 23, 42, .18); }
    .hero { display: grid; grid-template-columns: 1.35fr .85fr; gap: 34px; padding: 34px 40px 32px; color: #fff; background: radial-gradient(circle at 88% 10%, rgba(14, 165, 233, .28), transparent 32%), linear-gradient(135deg, #020617 0%, #071527 52%, #06101f 100%); border-bottom: 4px solid #0ea5e9; }
    .logo { width: 178px; height: auto; object-fit: contain; margin-bottom: 30px; }
    .eyebrow { margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd; }
    h1 { margin: 0; font-size: 36px; line-height: 1.04; text-transform: uppercase; }
    h2 { margin: 10px 0 0; color: #38bdf8; font-size: 22px; line-height: 1.2; }
    .accent { width: 76px; height: 3px; margin: 22px 0; background: #0ea5e9; border-radius: 999px; }
    .description { max-width: 430px; margin: 0; color: #dbeafe; line-height: 1.6; }
    .metadata { align-self: center; padding: 20px; border: 1px solid rgba(226, 232, 240, .36); border-radius: 14px; background: rgba(2, 6, 23, .38); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08); }
    .meta-item + .meta-item { margin-top: 16px; }
    .meta-item span { display: block; margin-bottom: 3px; color: #cbd5e1; font-size: 10px; text-transform: uppercase; }
    .meta-item strong { display: block; color: #fff; font-size: 13px; }
    .report-body { padding: 28px 40px 18px; }
    .section-title { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .section-title span { width: 8px; height: 8px; border-radius: 999px; background: #0ea5e9; }
    .section-title h3, .panel h3 { margin: 0; color: #0757c8; font-size: 15px; text-transform: uppercase; }
    .section-title hr { flex: 1; border: 0; border-top: 1px solid #bfdbfe; }
    .summary-card, .panel, .kpi { border: 1px solid #dbe3ef; border-radius: 10px; background: #fff; box-shadow: 0 12px 28px rgba(15, 23, 42, .06); }
    .summary-card { padding: 20px 22px; color: #334155; line-height: 1.6; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0 22px; }
    .kpi { min-height: 98px; padding: 16px; }
    .kpi span { color: #475569; font-size: 11px; text-transform: uppercase; }
    .kpi strong { display: block; margin-top: 12px; font-size: 22px; color: #0f172a; }
    .kpi small { color: #64748b; }
    .kpi.positive { border-top: 3px solid #10b981; }
    .kpi.attention { border-top: 3px solid #f59e0b; }
    .kpi.danger { border-top: 3px solid #ef4444; }
    .kpi.neutral, .kpi.empty { border-top: 3px solid #0ea5e9; }
    .chart-grid, .notes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 14px 0; }
    .panel { margin: 14px 0; padding: 18px; }
    .panel h3 { margin-bottom: 14px; }
    .bars { display: grid; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: 92px 1fr 44px; align-items: center; gap: 10px; font-size: 12px; }
    .bar-row div { height: 9px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
    .bar-row i { display: block; height: 100%; border-radius: 999px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { padding: 10px 12px; text-align: left; color: #fff; background: #06101f; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
    .highlights { display: grid; gap: 12px; }
    .highlight { padding-left: 12px; border-left: 4px solid #0ea5e9; }
    .highlight.positive { border-color: #10b981; }
    .highlight.attention { border-color: #f59e0b; }
    .highlight.danger { border-color: #ef4444; }
    .highlight p, li, .empty-text { color: #475569; line-height: 1.5; }
    footer { padding: 14px 40px 22px; color: #64748b; font-size: 10px; text-align: right; border-top: 3px solid #06101f; }
    .break-safe, .kpi, .panel, .summary-card { break-inside: avoid; page-break-inside: avoid; }
    @media print {
      body { background: #fff; }
      .report-page { width: auto; min-height: auto; margin: 0; box-shadow: none; }
    }
    @media (max-width: 900px) {
      .report-page { width: 100%; }
      .hero, .chart-grid, .notes { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `
}
