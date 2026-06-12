-- GATE OS - Reset seguro de dados operacionais
-- Data: 2026-06-11
--
-- OBJETIVO
-- Limpar dados operacionais/transacionais/cadastrais de teste para homologacao real.
--
-- IMPORTANTE
-- NAO apaga estrutura, tabelas, views, buckets, enums, policies, Auth nem public.users.
-- NAO execute sem revisar o ambiente/projeto Supabase selecionado.
-- Execute manualmente no Supabase SQL Editor quando aprovado.

begin;

-- =========================================================
-- A. RESET OPERACIONAL PRINCIPAL
-- =========================================================
-- Tabelas incluidas:
-- documents, legal_updates, legal_agreement_installments, legal_cases,
-- maintenance_orders, partner_entries, partners, dre_manual_adjustments,
-- dre_monthly_closings, financial_entries, installments, contract_equipment,
-- contracts, assets, equipment, clients, notifications.
--
-- RESTART IDENTITY reinicia sequencias quando existirem.
-- CASCADE respeita dependencias por foreign key entre essas tabelas.

truncate table
  public.documents,
  public.legal_updates,
  public.legal_agreement_installments,
  public.legal_cases,
  public.maintenance_orders,
  public.partner_entries,
  public.partners,
  public.dre_manual_adjustments,
  public.dre_monthly_closings,
  public.financial_entries,
  public.installments,
  public.contract_equipment,
  public.contracts,
  public.assets,
  public.equipment,
  public.clients,
  public.notifications
restart identity cascade;

commit;

-- =========================================================
-- B. VERIFICACAO FINAL
-- =========================================================
-- Todos os contadores abaixo devem retornar 0 apos o reset.

select 'clients' as table_name, count(*) from public.clients
union all
select 'contracts', count(*) from public.contracts
union all
select 'contract_equipment', count(*) from public.contract_equipment
union all
select 'equipment', count(*) from public.equipment
union all
select 'assets', count(*) from public.assets
union all
select 'installments', count(*) from public.installments
union all
select 'financial_entries', count(*) from public.financial_entries
union all
select 'dre_manual_adjustments', count(*) from public.dre_manual_adjustments
union all
select 'dre_monthly_closings', count(*) from public.dre_monthly_closings
union all
select 'maintenance_orders', count(*) from public.maintenance_orders
union all
select 'legal_cases', count(*) from public.legal_cases
union all
select 'legal_updates', count(*) from public.legal_updates
union all
select 'legal_agreement_installments', count(*) from public.legal_agreement_installments
union all
select 'documents', count(*) from public.documents
union all
select 'partners', count(*) from public.partners
union all
select 'partner_entries', count(*) from public.partner_entries
union all
select 'notifications', count(*) from public.notifications;

-- =========================================================
-- C. OPCIONAL - LIMPAR CADASTROS BASE DE TESTE
-- =========================================================
-- NAO executar automaticamente.
-- Use apenas se dre_categories, cost_centers ou bank_accounts tambem forem dados
-- de teste e puderem ser recriados depois.
--
-- begin;
--
-- truncate table
--   public.dre_categories,
--   public.cost_centers,
--   public.bank_accounts
-- restart identity cascade;
--
-- commit;
--
-- select 'dre_categories' as table_name, count(*) from public.dre_categories
-- union all
-- select 'cost_centers', count(*) from public.cost_centers
-- union all
-- select 'bank_accounts', count(*) from public.bank_accounts;

-- =========================================================
-- D. STORAGE - LIMPEZA MANUAL DOS BUCKETS
-- =========================================================
-- Nao apagar Storage por SQL neste reset.
-- Limpar manualmente no painel Supabase:
--
-- 1. Storage > gate-documents > selecionar arquivos/pastas > Delete.
-- 2. Storage > gate-contracts > selecionar arquivos/pastas > Delete.
-- 3. Storage > gate-legal > selecionar arquivos/pastas > Delete.
--
-- Nao apagar os buckets. Apagar somente objetos/arquivos de teste.

-- =========================================================
-- E. CHECKLIST POS-LIMPEZA
-- =========================================================
-- 1. Login admin ainda funciona.
-- 2. Dashboard abre zerado.
-- 3. Financeiro zerado.
-- 4. DRE zerado.
-- 5. Clientes vazio.
-- 6. Contratos vazio.
-- 7. Equipamentos vazio.
-- 8. Documentos vazio.
-- 9. Juridico vazio.
-- 10. Manutencoes vazio.
-- 11. Socios vazio.
-- 12. Relatorios sem dados falsos.
