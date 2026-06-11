"use client"

import type { UniversalReport } from "@/lib/reports/report-types"

function safePdfText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[()\\]/g, "\\$&")
}

function splitLine(text: string, max = 92) {
  const words = safePdfText(text).split(/\s+/)
  const lines: string[] = []
  let current = ""
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > max) {
      if (current) lines.push(current)
      current = word
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

export function exportReportPdf(report: UniversalReport) {
  const lines: string[] = []
  lines.push("GATE OS")
  lines.push(report.title)
  if (report.subtitle) lines.push(report.subtitle)
  lines.push(`Emitido em: ${report.issuedAt ?? new Date().toLocaleDateString("pt-BR")}`)
  lines.push("")
  lines.push("Resumo Executivo")
  splitLine(report.executiveSummary ?? report.description ?? "Sem dados disponiveis.").forEach((line) => lines.push(line))
  lines.push("")

  if (report.kpis?.length) {
    lines.push("Indicadores")
    report.kpis.forEach((kpi) => lines.push(`${kpi.label}: ${kpi.value}`))
    lines.push("")
  }

  report.tables?.forEach((table) => {
    lines.push(table.title)
    if (table.rows.length) {
      lines.push(table.columns.join(" | "))
      table.rows.slice(0, 120).forEach((row) => {
        splitLine(row.map((cell) => String(cell ?? "-")).join(" | ")).forEach((line) => lines.push(line))
      })
    } else {
      lines.push(table.emptyMessage ?? "Sem dados disponiveis.")
    }
    lines.push("")
  })

  if (report.observations?.length) {
    lines.push("Observacoes")
    report.observations.forEach((item) => splitLine(item).forEach((line) => lines.push(line)))
    lines.push("")
  }

  const pageHeight = 792
  const margin = 48
  const lineHeight = 14
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight)
  const pages: string[][] = []
  for (let index = 0; index < lines.length; index += maxLinesPerPage) {
    pages.push(lines.slice(index, index + maxLinesPerPage))
  }

  const objects: string[] = []
  const addObject = (content: string) => {
    objects.push(content)
    return objects.length
  }

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const pageIds: number[] = []
  pages.forEach((pageLines) => {
    const stream = [
      "BT",
      "/F1 10 Tf",
      `1 0 0 1 ${margin} ${pageHeight - margin} Tm`,
      ...pageLines.flatMap((line, index) => [
        index === 0 ? "" : `0 -${lineHeight} Td`,
        `(${safePdfText(line)}) Tj`,
      ]).filter(Boolean),
      "ET",
    ].join("\n")
    const streamId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    const pageId = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`)
    pageIds.push(pageId)
  })

  const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`)
  pageIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`)
  })
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = report.filename?.replace(/\.(html?|pdf)$/i, ".pdf") ?? "gate-os-relatorio.pdf"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return true
}
