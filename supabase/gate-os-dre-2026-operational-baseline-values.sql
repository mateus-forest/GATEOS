-- GATE OS - Valores-base operacionais da DRE 2026
-- Data: 2026-06-15
-- Fonte: prints enviados da planilha DRE GERENCIAL - GAMER TECH.
-- Carga idempotente: valores por year + row_index + month.

create table if not exists public.dre_operational_baseline_values (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  row_index integer not null,
  month integer not null check (month between 1 and 12),
  value numeric not null default 0,
  source_label text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists ux_dre_operational_baseline_year_row_month
  on public.dre_operational_baseline_values (year, row_index, month);

create index if not exists idx_dre_operational_baseline_year_row
  on public.dre_operational_baseline_values (year, row_index);

alter table public.dre_operational_baseline_values enable row level security;

drop policy if exists gate_authenticated_dre_baseline_select on public.dre_operational_baseline_values;
create policy gate_authenticated_dre_baseline_select on public.dre_operational_baseline_values
  for select to authenticated using (true);

drop policy if exists gate_authenticated_dre_baseline_insert on public.dre_operational_baseline_values;
create policy gate_authenticated_dre_baseline_insert on public.dre_operational_baseline_values
  for insert to authenticated with check (true);

drop policy if exists gate_authenticated_dre_baseline_update on public.dre_operational_baseline_values;
create policy gate_authenticated_dre_baseline_update on public.dre_operational_baseline_values
  for update to authenticated using (true) with check (true);

insert into public.dre_operational_baseline_values (year, row_index, month, value, source_label)
values
  (2026, 3, 1, 8903.88, 'Fribal'),
  (2026, 3, 2, 8903.88, 'Fribal'),
  (2026, 3, 3, 8903.88, 'Fribal'),
  (2026, 3, 4, 8903.88, 'Fribal'),
  (2026, 3, 5, 8903.88, 'Fribal'),
  (2026, 4, 2, 1900.00, 'Estácio Itapipoca'),
  (2026, 4, 5, 1500.00, 'Estácio Itapipoca'),
  (2026, 5, 1, 3599.00, 'Fortaleza Iguatemi'),
  (2026, 5, 2, 3599.00, 'Fortaleza Iguatemi'),
  (2026, 5, 3, 3599.00, 'Fortaleza Iguatemi'),
  (2026, 5, 4, 3599.00, 'Fortaleza Iguatemi'),
  (2026, 6, 1, 4158.14, 'Rio de Janeiro'),
  (2026, 6, 2, 4158.14, 'Rio de Janeiro'),
  (2026, 6, 3, 4158.14, 'Rio de Janeiro'),
  (2026, 6, 4, 4158.14, 'Rio de Janeiro'),
  (2026, 6, 5, 2000.00, 'Rio de Janeiro'),
  (2026, 7, 1, 1913.65, 'Intech'),
  (2026, 7, 2, 1913.65, 'Intech'),
  (2026, 7, 3, 1913.65, 'Intech'),
  (2026, 7, 5, 1913.65, 'Intech'),
  (2026, 8, 1, 2421.67, 'Paulínia nova'),
  (2026, 8, 2, 2421.67, 'Paulínia nova'),
  (2026, 8, 3, 2887.85, 'Paulínia nova'),
  (2026, 8, 4, 2619.79, 'Paulínia nova'),
  (2026, 8, 5, 2850.00, 'Paulínia nova'),
  (2026, 9, 1, 5772.28, 'Curitiba'),
  (2026, 9, 2, 5772.28, 'Curitiba'),
  (2026, 9, 3, 5772.28, 'Curitiba'),
  (2026, 9, 4, 5772.28, 'Curitiba'),
  (2026, 9, 5, 5772.28, 'Curitiba'),
  (2026, 10, 1, 3900.00, 'SG Itapipoca'),
  (2026, 10, 2, 3850.00, 'SG Itapipoca'),
  (2026, 10, 4, 4141.01, 'SG Itapipoca'),
  (2026, 10, 5, 4177.98, 'SG Itapipoca'),
  (2026, 11, 1, 3506.16, 'SG Atibaia'),
  (2026, 11, 2, 3506.16, 'SG Atibaia'),
  (2026, 11, 3, 3506.16, 'SG Atibaia'),
  (2026, 11, 4, 3506.16, 'SG Atibaia'),
  (2026, 11, 5, 3506.16, 'SG Atibaia'),
  (2026, 12, 1, 3250.00, 'Venda de produto'),
  (2026, 12, 2, 5883.77, 'Venda de produto'),
  (2026, 12, 3, 2547.00, 'Venda de produto'),
  (2026, 12, 5, 38990.00, 'Venda de produto'),
  (2026, 13, 1, 0.43, 'Rendimento aplicação'),
  (2026, 13, 2, 1.47, 'Rendimento aplicação'),
  (2026, 17, 1, 6100.00, 'Salarios'),
  (2026, 17, 2, 4000.00, 'Salarios'),
  (2026, 17, 3, 4000.00, 'Salarios'),
  (2026, 17, 4, 4000.00, 'Salarios'),
  (2026, 17, 5, 4000.00, 'Salarios'),
  (2026, 28, 3, 2300.00, 'Premiações e Comissões'),
  (2026, 28, 5, 2959.20, 'Premiações e Comissões'),
  (2026, 32, 3, 579.00, 'Aluguel'),
  (2026, 33, 4, 388.44, 'Condominio'),
  (2026, 34, 1, 706.00, 'Contabilidade'),
  (2026, 34, 2, 706.00, 'Contabilidade'),
  (2026, 34, 3, 706.00, 'Contabilidade'),
  (2026, 34, 4, 706.00, 'Contabilidade'),
  (2026, 34, 5, 706.00, 'Contabilidade'),
  (2026, 37, 1, 626.07, 'Sistema'),
  (2026, 37, 2, 1337.23, 'Sistema'),
  (2026, 37, 3, 1831.62, 'Sistema'),
  (2026, 37, 4, 1079.07, 'Sistema'),
  (2026, 37, 5, 1187.07, 'Sistema'),
  (2026, 40, 1, 200.00, 'Taxas - outras'),
  (2026, 40, 2, 200.00, 'Taxas - outras'),
  (2026, 40, 3, 200.00, 'Taxas - outras'),
  (2026, 40, 4, 200.00, 'Taxas - outras'),
  (2026, 40, 5, 200.00, 'Taxas - outras'),
  (2026, 42, 2, 695.25, 'Material de Manutenção e Reparos'),
  (2026, 42, 3, 577.25, 'Material de Manutenção e Reparos'),
  (2026, 42, 4, 367.25, 'Material de Manutenção e Reparos'),
  (2026, 45, 1, 1621.00, 'Prestação de serviços'),
  (2026, 45, 2, 1518.00, 'Prestação de serviços'),
  (2026, 45, 4, 3036.00, 'Prestação de serviços'),
  (2026, 45, 5, 1518.00, 'Prestação de serviços'),
  (2026, 46, 1, 289.64, 'Viagens'),
  (2026, 46, 2, 289.64, 'Viagens'),
  (2026, 47, 1, 10.99, 'Imposto'),
  (2026, 47, 2, 10.99, 'Imposto'),
  (2026, 47, 3, 683.88, 'Imposto'),
  (2026, 51, 1, 381.79, 'Tarifa Bancaria'),
  (2026, 51, 2, 990.67, 'Tarifa Bancaria'),
  (2026, 51, 3, 1324.47, 'Tarifa Bancaria'),
  (2026, 51, 4, 510.00, 'Tarifa Bancaria'),
  (2026, 51, 5, 365.00, 'Tarifa Bancaria'),
  (2026, 52, 1, 2226.79, 'Juros e Emprestimos'),
  (2026, 52, 2, 2226.79, 'Juros e Emprestimos'),
  (2026, 52, 3, 2226.79, 'Juros e Emprestimos'),
  (2026, 52, 4, 2226.79, 'Juros e Emprestimos'),
  (2026, 52, 5, 2226.79, 'Juros e Emprestimos'),
  (2026, 60, 1, 10030.53, 'Investimento Imobilizado Gamer Tech'),
  (2026, 60, 2, 6584.32, 'Investimento Imobilizado Gamer Tech'),
  (2026, 60, 3, 5599.08, 'Investimento Imobilizado Gamer Tech'),
  (2026, 60, 4, 1872.45, 'Investimento Imobilizado Gamer Tech'),
  (2026, 60, 5, 1849.47, 'Investimento Imobilizado Gamer Tech'),
  (2026, 61, 3, 97.00, 'Outros Custos Investimentos (Fretes, Outros)'),
  (2026, 62, 1, 1755.87, 'Participação Resultado'),
  (2026, 62, 2, 2021.03, 'Participação Resultado'),
  (2026, 62, 3, 2394.84, 'Participação Resultado'),
  (2026, 62, 4, 1508.72, 'Participação Resultado'),
  (2026, 62, 5, 1614.94, 'Participação Resultado'),
  (2026, 62, 6, 4516.15, 'Participação Resultado'),
  (2026, 63, 1, 10000.00, 'Distribuição Lucros  - Sócios'),
  (2026, 63, 2, 10000.00, 'Distribuição Lucros  - Sócios'),
  (2026, 63, 3, 11428.57, 'Distribuição Lucros  - Sócios'),
  (2026, 63, 4, 11428.57, 'Distribuição Lucros  - Sócios'),
  (2026, 63, 5, 32000.00, 'Distribuição Lucros  - Sócios'),
  (2026, 64, 1, 5555.56, 'Devolução de Emprestimos'),
  (2026, 64, 2, 5555.56, 'Devolução de Emprestimos'),
  (2026, 64, 3, 5555.56, 'Devolução de Emprestimos'),
  (2026, 64, 4, 5555.56, 'Devolução de Emprestimos'),
  (2026, 64, 5, 5555.56, 'Devolução de Emprestimos'),
  (2026, 71, 1, 11590.96, 'SALDO ANTERIOR'),
  (2026, 71, 2, 9511.93, 'SALDO ANTERIOR'),
  (2026, 71, 3, 15287.46, 'SALDO ANTERIOR'),
  (2026, 71, 4, 9070.44, 'SALDO ANTERIOR'),
  (2026, 71, 5, 8891.21, 'SALDO ANTERIOR'),
  (2026, 71, 6, 23503.29, 'SALDO ANTERIOR'),
  (2026, 73, 1, 9511.93, 'SALDO BANCO'),
  (2026, 73, 2, 15287.46, 'SALDO BANCO'),
  (2026, 73, 3, 9070.44, 'SALDO BANCO'),
  (2026, 73, 4, 8891.21, 'SALDO BANCO'),
  (2026, 73, 5, 23503.29, 'SALDO BANCO')
on conflict (year, row_index, month) do update set
  value = excluded.value,
  source_label = excluded.source_label,
  updated_at = now();

select
  year,
  count(*) as baseline_cells,
  sum(value) as baseline_value_sum
from public.dre_operational_baseline_values
where year = 2026
group by year;
