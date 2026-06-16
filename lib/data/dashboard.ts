import { selectRowsStrict } from "@/lib/data/supabase-helpers"

export async function getDashboardFinancial() {
  return selectRowsStrict("v_dashboard_financial")
}

export async function getBankBalances() {
  return selectRowsStrict("v_bank_balances")
}

export async function getContractsSummary() {
  return selectRowsStrict("v_contracts_summary")
}

export async function getOverdueInstallmentsSummary() {
  return selectRowsStrict("v_overdue_installments")
}

export async function getAssetsSummary() {
  return selectRowsStrict("v_assets_summary")
}

export async function getEquipmentSummary() {
  return selectRowsStrict("v_equipment_summary")
}

export async function getLegalSummary() {
  return selectRowsStrict("v_legal_summary")
}

export async function getProfitDistribution() {
  return selectRowsStrict("v_profit_distribution_current_month")
}

export async function getDashboardNotifications() {
  return selectRowsStrict("notifications")
}

export async function getRevenueData() {
  return selectRowsStrict("v_dashboard_financial")
}
