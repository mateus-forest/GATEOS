"use client"

import { toast } from "sonner"

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

export function featureInPreparation(detail: string) {
  toast.info(`${detail} Não foi executada nenhuma ação real.`)
}
