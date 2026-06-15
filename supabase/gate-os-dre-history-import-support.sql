-- GATE OS - suporte para importacao historica da DRE
-- Data: 2026-06-15
--
-- NAO executar automaticamente.
-- Revisar no Supabase SQL Editor antes de aplicar.
--
-- Objetivo:
-- - Marcar snapshots importados como historico ou operacional.
-- - Preservar linhas genericas de planilhas antigas quando nao houver estrutura mensal perfeita.

alter table public.dre_imports
add column if not exists import_kind text default 'historico';

alter table public.dre_import_rows
add column if not exists raw_data jsonb;

comment on column public.dre_imports.import_kind is
  'Tipo da importacao: historico ou operacional. Historico nao alimenta a DRE operacional.';

comment on column public.dre_import_rows.raw_data is
  'Linha original da planilha em JSON para preservar historicos com estrutura flexivel.';
