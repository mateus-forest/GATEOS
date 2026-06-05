import { selectRows } from "@/lib/data/supabase-helpers"

export async function getDashboardFinancial() {
  return selectRows("v_dashboard_financial", [])
}

export async function getBankBalances() {
  return selectRows("v_bank_balances", [])
}

export async function getContractsSummary() {
  return selectRows("v_contracts_summary", [])
}

export async function getOverdueInstallmentsSummary() {
  return selectRows("v_overdue_installments", [])
}

export async function getAssetsSummary() {
  return selectRows("v_assets_summary", [])
}

export async function getEquipmentSummary() {
  return selectRows("v_equipment_summary", [])
}

export async function getLegalSummary() {
  return selectRows("v_legal_summary", [])
}

export async function getProfitDistribution() {
  return selectRows("v_profit_distribution_current_month", [])
}

export async function getDashboardNotifications() {
  return selectRows("notifications", [])
}

export async function getRevenueData() {
  return selectRows("v_dashboard_financial", [])
}
