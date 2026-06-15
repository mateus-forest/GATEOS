-- GATE OS - suporte para importacao integral da DRE
-- Data: 2026-06-14
--
-- NAO executar automaticamente.
-- Execute no Supabase SQL Editor somente apos revisao/aprovacao.
-- Objetivo: persistir a planilha DRE importada como snapshot visual fiel,
-- preservando linhas, grupos, totais, percentuais e valores mensais.

create table if not exists public.dre_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  sheet_name text not null,
  year integer not null,
  imported_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.dre_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.dre_imports(id) on delete cascade,
  row_index integer not null,
  group_name text,
  account_name text,
  row_type text,
  jan numeric,
  fev numeric,
  mar numeric,
  abr numeric,
  mai numeric,
  jun numeric,
  jul numeric,
  ago numeric,
  set numeric,
  out numeric,
  nov numeric,
  dez numeric,
  total numeric,
  raw_label text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dre_imports_year_created_at
  on public.dre_imports (year, created_at desc);

create index if not exists idx_dre_import_rows_import_id_row_index
  on public.dre_import_rows (import_id, row_index);

alter table public.dre_imports enable row level security;
alter table public.dre_import_rows enable row level security;

drop policy if exists gate_authenticated_dre_imports_select on public.dre_imports;
create policy gate_authenticated_dre_imports_select on public.dre_imports
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_imports_insert on public.dre_imports;
create policy gate_authenticated_dre_imports_insert on public.dre_imports
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_imports_delete on public.dre_imports;
create policy gate_authenticated_dre_imports_delete on public.dre_imports
  for delete to authenticated
  using (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_import_rows_select on public.dre_import_rows;
create policy gate_authenticated_dre_import_rows_select on public.dre_import_rows
  for select to authenticated
  using (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_import_rows_insert on public.dre_import_rows;
create policy gate_authenticated_dre_import_rows_insert on public.dre_import_rows
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists gate_authenticated_dre_import_rows_delete on public.dre_import_rows;
create policy gate_authenticated_dre_import_rows_delete on public.dre_import_rows
  for delete to authenticated
  using (auth.uid() is not null);
