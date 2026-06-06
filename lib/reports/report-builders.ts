"use client"

import type { UniversalReport } from "@/lib/reports/report-types"
import { formatCurrency } from "@/lib/utils"

const today = () => new Date().toLocaleDateString("pt-BR")

const reportBase = (title: string, subtitle: string, description: string): UniversalReport => ({
  title,
  subtitle,
  description,
  issuedAt: today(),
  generatedBy: "GATE OS",
  company: "GATE Soluções Tecnológicas",
  version: "1.0",
  observations: ["Relatório gerado com os dados disponíveis no sistema no momento da emissão."],
  recommendations: ["Revise os indicadores e priorize os itens com maior impacto operacional ou financeiro."],
})

const valueOf = (item: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = item[key]
    if (value !== undefined && value !== null && value !== "") return String(value)
  }
  return "-"
}

const numberOf = (item: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = item[key]
    const parsed = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

const moneyOf = (item: Record<string, unknown>, keys: string[]) => formatCurrency(numberOf(item, keys))

export function buildGenericReport(input: {
  title: string
  subtitle?: string
  description?: string
  rows?: Array<Record<string, unknown>>
  periodStart?: string
  periodEnd?: string
}): UniversalReport {
  const rows = input.rows ?? []
  const columns = rows[0] ? Object.keys(rows[0]) : ["Status"]

  return {
    ...reportBase(
      input.title,
      input.subtitle ?? "Relatório operacional",
      input.description ?? "Documento gerado no padrão universal de relatórios do GATE OS."
    ),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    filename: `gate-os-relatorio-${slug(input.title)}-${dateSlug()}.pdf`,
    kpis: [
      { label: "Registros", value: String(rows.length), tone: rows.length ? "positive" : "neutral" },
      { label: "Fonte", value: "Supabase", tone: "neutral" },
    ],
    executiveSummary: rows.length
      ? `Foram encontrados ${rows.length} registros para este relatório.`
      : "Sem dados disponíveis para o período selecionado.",
    tables: [{
      title: "Detalhamento",
      columns,
      rows: rows.length ? rows.map((row) => columns.map((column) => String(row[column] ?? "-"))) : [],
      emptyMessage: "Sem dados disponíveis para o período selecionado.",
    }],
  }
}

export function buildDashboardReport(metrics: Array<{ indicador: string; valor: string | number }>): UniversalReport {
  return {
    ...reportBase("Dashboard", "Resumo executivo", "Visão consolidada dos principais indicadores do GATE OS."),
    filename: `gate-os-relatorio-dashboard-${dateSlug()}.pdf`,
    kpis: metrics.slice(0, 4).map((metric) => ({
      label: metric.indicador,
      value: String(metric.valor),
      tone: "neutral",
    })),
    executiveSummary: metrics.length
      ? "Resumo gerado a partir dos indicadores atualmente carregados no dashboard."
      : "Sem indicadores disponíveis no dashboard.",
    tables: [{
      title: "Indicadores consolidados",
      columns: ["Indicador", "Valor"],
      rows: metrics.map((metric) => [metric.indicador, metric.valor]),
      emptyMessage: "Sem indicadores disponíveis para exportar.",
    }],
  }
}

export function buildClientsReport(clients: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Clientes", "Carteira de clientes", clients, [
    ["Nome", ["name", "nome", "razao_social"]],
    ["Documento", ["document", "cnpj", "cpf"]],
    ["Status", ["status"]],
    ["Telefone", ["phone", "telefone"]],
    ["Cidade", ["city", "cidade"]],
  ])
}

export function buildContractsReport(contracts: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Contratos", "Contratos comerciais", contracts, [
    ["Contrato", ["contract_number", "number", "numero"]],
    ["Cliente", ["client_name", "cliente", "client"]],
    ["Status", ["status"]],
    ["Início", ["start_date", "inicio"]],
    ["Valor mensal", ["monthly_value", "valor_mensal"]],
  ], ["monthly_value", "total_value"])
}

export function buildInstallmentsReport(installments: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Parcelas", "Contas a receber", installments, [
    ["Cliente", ["client_name", "cliente", "client"]],
    ["Contrato", ["contract_number", "contrato"]],
    ["Vencimento", ["due_date", "vencimento"]],
    ["Status", ["status"]],
    ["Valor", ["amount", "valor"]],
  ], ["amount", "valor"])
}

export function buildFinancialEntriesReport(entries: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Lançamentos", "Movimentações financeiras", entries, [
    ["Data", ["date", "entry_date", "data"]],
    ["Descrição", ["description", "descricao"]],
    ["Tipo", ["type", "tipo"]],
    ["Categoria", ["category", "category_name", "categoria"]],
    ["Valor", ["amount", "valor"]],
  ], ["amount", "valor"])
}

export function buildDreReport(rows: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("DRE", "Demonstrativo de resultado", rows, [
    ["Conta", ["name", "categoria", "account", "label"]],
    ["Jan", ["jan", "jan_26"]],
    ["Fev", ["fev", "feb", "fev_26"]],
    ["Mar", ["mar", "mar_26"]],
    ["Total", ["total"]],
  ])
}

export function buildAssetsReport(assets: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Patrimônio", "Ativos patrimoniais", assets, [
    ["Ativo", ["name", "nome"]],
    ["Categoria", ["category", "categoria"]],
    ["Status", ["status"]],
    ["Valor", ["value", "valor"]],
    ["Localização", ["location", "localizacao"]],
  ], ["value", "valor"])
}

export function buildEquipmentReport(equipment: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Equipamentos", "Inventário operacional", equipment, [
    ["Equipamento", ["name", "nome", "model", "modelo"]],
    ["Série", ["serial_number", "serie", "serial"]],
    ["Status", ["status"]],
    ["Cliente", ["client_name", "cliente"]],
    ["Localização", ["location", "localizacao"]],
  ])
}

export function buildMaintenanceReport(orders: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Manutenções", "Ordens de manutenção", orders, [
    ["Protocolo", ["protocol", "number", "id"]],
    ["Equipamento", ["equipment_name", "equipamento"]],
    ["Status", ["status"]],
    ["Prioridade", ["priority", "prioridade"]],
    ["Abertura", ["created_at", "opened_at", "data"]],
  ])
}

export function buildLegalReport(cases: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Jurídico", "Casos e cobranças", cases, [
    ["Caso", ["title", "titulo", "case_number"]],
    ["Cliente", ["client_name", "cliente"]],
    ["Status", ["status"]],
    ["Tipo", ["type", "tipo"]],
    ["Valor", ["amount", "valor"]],
  ], ["amount", "valor"])
}

export function buildPartnersReport(entries: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Sócios", "Lançamentos de sócios", entries, [
    ["Sócio", ["partner", "partner_name", "socio"]],
    ["Tipo", ["type", "tipo"]],
    ["Descrição", ["description", "descricao"]],
    ["Data", ["date", "entry_date", "data"]],
    ["Valor", ["amount", "valor"]],
  ], ["amount", "valor"])
}

export function buildDocumentsReport(documents: Array<Record<string, unknown>>): UniversalReport {
  return buildEntityReport("Documentos", "Controle documental", documents, [
    ["Documento", ["name", "nome", "title"]],
    ["Categoria", ["category", "categoria"]],
    ["Cliente", ["client_name", "cliente"]],
    ["Data", ["created_at", "dataUpload", "data"]],
    ["Status", ["status"]],
  ])
}

function buildEntityReport(
  title: string,
  subtitle: string,
  rows: Array<Record<string, unknown>>,
  columns: Array<[string, string[]]>,
  moneyKeys: string[] = []
): UniversalReport {
  const total = moneyKeys.length ? rows.reduce((sum, row) => sum + numberOf(row, moneyKeys), 0) : 0

  return {
    ...reportBase(title, subtitle, `Relatório de ${title.toLowerCase()} gerado no padrão universal do GATE OS.`),
    filename: `gate-os-relatorio-${slug(title)}-${dateSlug()}.pdf`,
    kpis: [
      { label: "Registros", value: String(rows.length), tone: rows.length ? "positive" : "neutral" },
      ...(moneyKeys.length ? [{ label: "Valor total", value: formatCurrency(total), tone: "neutral" as const }] : []),
    ],
    executiveSummary: rows.length
      ? `${rows.length} registros encontrados para ${title.toLowerCase()}.`
      : "Sem dados disponíveis para o período selecionado.",
    tables: [{
      title: "Detalhamento",
      columns: columns.map(([label]) => label),
      rows: rows.map((row) => columns.map(([label, keys]) => label.toLowerCase().includes("valor") ? moneyOf(row, keys) : valueOf(row, keys))),
      emptyMessage: `Nenhum registro de ${title.toLowerCase()} encontrado.`,
    }],
  }
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function dateSlug() {
  return new Date().toISOString().slice(0, 10)
}
