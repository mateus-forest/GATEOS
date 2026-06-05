-- Limpeza controlada de dados operacionais/teste do GATE OS.
-- Mantem estrutura, views, functions, triggers, policies, buckets e dados base.
-- Preserva: dre_categories, cost_centers, partners, bank_accounts, users.

begin;

truncate table
  legal_agreement_installments,
  legal_updates,
  legal_cases,
  maintenance_orders,
  documents,
  partner_entries,
  dre_monthly_closings,
  dre_manual_adjustments,
  financial_entries,
  installments,
  contract_equipment,
  contracts,
  equipment,
  assets,
  notifications,
  clients
restart identity cascade;

commit;
