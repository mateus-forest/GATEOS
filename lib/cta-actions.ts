"use client"

import { toast } from "sonner"
import type { UniversalReport } from "@/lib/reports/report-types"
import { exportReportPdf } from "@/lib/reports/pdf-export"

type CsvValue = string | number | boolean | null | undefined
type CsvRow = Record<string, CsvValue>

function escapeCsvValue(value: CsvValue) {
  const text = value == null ? "" : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function exportCsv(filename: string, rows: CsvRow[]) {
  if (!rows.length) {
    toast.error("Não há dados disponíveis para exportar.")
    return false
  }

  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key))
    return set
  }, new Set<string>()))

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ].join("\n")

  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toast.success("Arquivo CSV gerado e download iniciado.")
  return true
}

export function exportPdfReport(report: UniversalReport) {
  const downloaded = exportReportPdf(report)

  if (!downloaded) {
    toast.error("Não foi possível gerar o PDF deste relatório.")
    return false
  }

  toast.success("PDF gerado e download iniciado.")
  return true
}

export function exportExcelTable({
  filename,
  title,
  metadata = [],
  columns,
  rows,
}: {
  filename: string
  title: string
  metadata?: Array<[string, string]>
  columns: string[]
  rows: Array<Array<string | number>>
}) {
  if (!rows.length) {
    toast.error("Não há dados disponíveis para exportar.")
    return false
  }

  const escape = (value: unknown) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body>
    <table>
      <tr><th colspan="${columns.length}" style="font-size:18px;text-align:left">${escape(title)}</th></tr>
      ${metadata.map(([label, value]) => `<tr><td><strong>${escape(label)}</strong></td><td>${escape(value)}</td></tr>`).join("")}
      <tr>${columns.map((column) => `<th style="background:#06101f;color:#fff">${escape(column)}</th>`).join("")}</tr>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}
    </table>
  </body></html>`

  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toast.success("Planilha organizada gerada e download iniciado.")
  return true
}
