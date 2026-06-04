import { contractsByStatus, dashboardMetrics, equipamentosPorStatusChart, notifications, parcelas, receitaMensalChart, revenueData } from "@/lib/mock-data"
import { juridicoCases, getValorAtualizado } from "@/lib/juridico-data"
import { selectRows } from "@/lib/data/supabase-helpers"

export async function getDashboardFinancial() {
  return selectRows("v_dashboard_financial", [dashboardMetrics])
}

export async function getBankBalances() {
  return selectRows("v_bank_balances", [
    { account_name: "Banco Itaú CNPJ", balance: 23503.29 },
    { account_name: "Aplicação", balance: 18497.66 },
    { account_name: "Caixa", balance: 3250 },
  ])
}

export async function getContractsSummary() {
  return selectRows("v_contracts_summary", contractsByStatus)
}

export async function getOverdueInstallmentsSummary() {
  return selectRows("v_overdue_installments", parcelas.filter((item) => item.status === "overdue"))
}

export async function getAssetsSummary() {
  return selectRows("v_assets_summary", [])
}

export async function getEquipmentSummary() {
  return selectRows("v_equipment_summary", equipamentosPorStatusChart)
}

export async function getLegalSummary() {
  return selectRows("v_legal_summary", [{
    active_cases: juridicoCases.length,
    collection_value: juridicoCases.reduce((sum, item) => sum + getValorAtualizado(item), 0),
    due_agreements: 2,
    broken_agreements: 0,
  }])
}

export async function getProfitDistribution() {
  return selectRows("v_profit_distribution_current_month", [])
}

export async function getDashboardNotifications() {
  return selectRows("notifications", notifications)
}

export async function getRevenueData() {
  return selectRows("v_dashboard_financial", revenueData)
}
