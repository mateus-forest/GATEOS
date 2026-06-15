-- GATE OS - Template operacional DRE 2026
-- Data: 2026-06-15
--
-- NAO executar automaticamente.
-- Revisar no Supabase SQL Editor antes de aplicar.
--
-- Fonte esperada:
-- gate_dre_2026_operational_template_extracted.csv
--
-- Objetivo:
-- - Garantir a tabela de template operacional.
-- - Permitir carga das 74 linhas oficiais da DRE 2026.
-- - Usar somente a estrutura; valores da operacao continuam vindo do sistema.

create table if not exists public.dre_operational_template_rows (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  row_index integer not null,
  group_name text,
  account_name text not null,
  row_type text,
  source_sheet text,
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_dre_operational_template_rows_year_index
  on public.dre_operational_template_rows (year, row_index);

alter table public.dre_operational_template_rows enable row level security;

drop policy if exists gate_authenticated_dre_template_select on public.dre_operational_template_rows;
create policy gate_authenticated_dre_template_select on public.dre_operational_template_rows
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_template_insert on public.dre_operational_template_rows;
create policy gate_authenticated_dre_template_insert on public.dre_operational_template_rows
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_template_update on public.dre_operational_template_rows;
create policy gate_authenticated_dre_template_update on public.dre_operational_template_rows
  for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_template_delete on public.dre_operational_template_rows;
create policy gate_authenticated_dre_template_delete on public.dre_operational_template_rows
  for delete to authenticated
  using (auth.uid() is not null);

-- Opcional para recarga controlada da estrutura 2026:
-- 1. Inative ou remova somente linhas do template 2026, se aprovado:
--    update public.dre_operational_template_rows
--    set active = false
--    where year = 2026;
-- 2. Importe gate_dre_2026_operational_template_extracted.csv.
-- 3. Mapeie para:
--    year, row_index, group_name, account_name, row_type, source_sheet, active.

-- Verificacao esperada:
-- select count(*) from public.dre_operational_template_rows where year = 2026 and active = true;
