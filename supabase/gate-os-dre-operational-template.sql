-- GATE OS - template operacional da DRE
-- Data: 2026-06-15
--
-- NAO executar automaticamente.
-- Revisar no Supabase SQL Editor antes de aplicar.
--
-- Objetivo:
-- - Usar a DRE 2026 como referencia de estrutura visual.
-- - Preservar ordem, grupos e nomes de linhas sem importar valores para a operacao.
-- - A DRE operacional continua calculada por dados reais do sistema.

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

drop policy if exists gate_authenticated_dre_template_delete on public.dre_operational_template_rows;
create policy gate_authenticated_dre_template_delete on public.dre_operational_template_rows
  for delete to authenticated
  using (auth.uid() is not null);
