-- GATE OS - DRE historica estruturada 2022-2025
-- Data: 2026-06-15
--
-- NAO executar automaticamente.
-- Revisar no Supabase SQL Editor antes de aplicar.
--
-- Fonte esperada:
-- gate_dre_historical_2022_2025_long_for_database.csv
--
-- Objetivo:
-- - Criar tabela somente leitura operacional para consulta/exportacao historica.
-- - Popular a tabela com os 3.608 registros normalizados do CSV extraido.
-- - Nao alimentar Dashboard, Financeiro, contratos ou DRE operacional 2026.

create table if not exists public.dre_historical_values (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  competency text not null,
  section text,
  line_name text not null,
  line_order integer not null,
  value numeric default 0,
  source_sheet text,
  created_at timestamptz default now()
);

create index if not exists idx_dre_historical_values_year_month
  on public.dre_historical_values (year, month);

create index if not exists idx_dre_historical_values_year_order
  on public.dre_historical_values (year, line_order);

alter table public.dre_historical_values enable row level security;

drop policy if exists gate_authenticated_dre_historical_select on public.dre_historical_values;
create policy gate_authenticated_dre_historical_select on public.dre_historical_values
  for select to authenticated
  using (auth.uid() is not null);

-- Opcional para carga inicial pelo SQL Editor/CSV import do Supabase:
-- 1. Importe gate_dre_historical_2022_2025_long_for_database.csv na tabela public.dre_historical_values.
-- 2. Mapeie as colunas do CSV para:
--    year, month, competency, section, line_name, line_order, value, source_sheet.
-- 3. Nao incluir id/created_at se o CSV nao possuir esses campos.

-- Verificacao esperada apos carga completa:
-- select count(*) from public.dre_historical_values;
-- select year, count(*) from public.dre_historical_values group by year order by year;
