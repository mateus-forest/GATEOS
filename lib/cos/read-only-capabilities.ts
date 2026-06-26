export type ReadOnlyCapability =
  | "deep_search"
  | "relationship_graph"
  | "client_search"
  | "contract_search"
  | "equipment_search"
  | "financial_search"
  | "document_search"
  | "legal_search"
  | "partner_search"
  | "dashboard_explain"
  | "dre_explain"
  | "financial_explain"
  | "contract_diagnosis"
  | "equipment_diagnosis"
  | "financial_diagnosis"
  | "dashboard_diagnosis"
  | "bank_reconciliation_diagnosis"
  | "dre_diagnosis"
  | "monthly_closing_diagnosis"
  | "operational_health"
  | "system_explanation"

export const READ_ONLY_CAPABILITY_SOURCES: Record<ReadOnlyCapability, string[]> = {
  deep_search: ["clients", "contracts", "equipment", "financial_entries", "documents", "legal_cases", "partners", "partner_entries"],
  relationship_graph: [
    "clients",
    "contracts",
    "contract_equipment",
    "equipment",
    "financial_entries",
    "documents",
    "legal_cases",
    "maintenance_orders",
    "dre_categories",
  ],
  client_search: ["clients"],
  contract_search: ["contracts", "clients"],
  equipment_search: ["equipment", "contracts", "contract_equipment"],
  financial_search: ["financial_entries", "clients", "contracts", "dre_categories", "bank_accounts"],
  document_search: ["documents"],
  legal_search: ["legal_cases", "clients", "contracts"],
  partner_search: ["partners", "partner_entries", "partner_distribution_rules"],
  dashboard_explain: ["dashboard_views", "financial_entries", "contracts", "equipment"],
  dre_explain: ["financial_entries", "dre_categories", "dre_manual_adjustments"],
  financial_explain: ["financial_entries", "bank_accounts", "dre_categories"],
  contract_diagnosis: ["contracts", "installments", "financial_entries", "contract_equipment"],
  equipment_diagnosis: ["equipment", "contracts", "contract_equipment", "maintenance_orders"],
  financial_diagnosis: ["financial_entries", "dre_categories", "bank_accounts"],
  dashboard_diagnosis: ["dashboard_views", "financial_entries", "contracts", "equipment", "dre_categories"],
  bank_reconciliation_diagnosis: ["bank_accounts", "financial_entries"],
  dre_diagnosis: ["financial_entries", "dre_categories", "dre_manual_adjustments", "dashboard_views"],
  monthly_closing_diagnosis: ["financial_entries", "contracts", "installments", "equipment", "bank_accounts", "dre_categories"],
  operational_health: [
    "clients",
    "contracts",
    "equipment",
    "financial_entries",
    "bank_accounts",
    "dre_categories",
    "dashboard_views",
  ],
  system_explanation: [
    "GATE_OS_COS_MASTER_KNOWLEDGE_BASE.md",
    "GATE_OS_COS_OPERATIONAL_PLAYBOOK.md",
    "GATE_OS_COS_BUSINESS_MANUAL.md",
    "GATE_OS_COS_CAPABILITY_MAP.md",
  ],
}
