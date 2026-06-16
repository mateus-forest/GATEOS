-- GATE OS - Checklist de limpeza futura apos poda operacional
-- Revisao humana obrigatoria antes de qualquer execucao.
-- Este arquivo NAO deve ser executado automaticamente.
-- Todas as linhas destrutivas permanecem comentadas de proposito.

-- ============================================================
-- MODULO JURIDICO
-- Revisar dependencias, backups, RLS, storage e relatorios antes.
-- ============================================================
-- drop table if exists public.legal_agreement_installments cascade;
-- drop table if exists public.legal_updates cascade;
-- drop table if exists public.legal_cases cascade;

-- ============================================================
-- MODULO SOCIOS
-- Revisar distribuicoes, historico financeiro e vinculos de DRE.
-- ============================================================
-- drop table if exists public.partner_entries cascade;
-- drop table if exists public.partners cascade;

-- ============================================================
-- MODULO PATRIMONIO
-- Revisar ativos, depreciação, documentos e baixas antes.
-- ============================================================
-- drop table if exists public.assets cascade;

-- ============================================================
-- MODULO RELATORIOS AVANCADOS / AGENDAMENTOS
-- Confirmar nomes reais no schema antes de qualquer limpeza.
-- ============================================================
-- drop table if exists public.report_schedules cascade;
-- drop table if exists public.report_exports cascade;
-- drop table if exists public.report_history cascade;

-- ============================================================
-- ANALISE / CONFIGURACOES AVANCADAS
-- Nenhuma tabela confirmada para remocao nesta revisao.
-- Adicionar aqui somente apos auditoria do schema real.
-- ============================================================
-- drop table if exists public.advanced_settings cascade;
-- drop table if exists public.analytics_snapshots cascade;

-- ============================================================
-- STORAGE
-- Revisar buckets manualmente no Supabase Storage.
-- Nao ha comando SQL destrutivo ativo neste arquivo.
-- ============================================================
-- Revisar bucket: gate-legal
-- Revisar bucket: gate-reports

-- Fim do checklist. Nenhuma instrucao destrutiva ativa.
