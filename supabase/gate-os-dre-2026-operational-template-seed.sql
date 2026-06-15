-- GATE OS - Template operacional DRE 2026
-- Data: 2026-06-15
-- Fonte: gate_dre_2026_operational_template_extracted.csv
-- Carga idempotente: 74 linhas esperadas.

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

create unique index if not exists ux_dre_operational_template_year_row
  on public.dre_operational_template_rows (year, row_index);

create index if not exists idx_dre_operational_template_rows_year_index
  on public.dre_operational_template_rows (year, row_index);

insert into public.dre_operational_template_rows (year, row_index, group_name, account_name, row_type, source_sheet, active)
values
  (2026, 1, null, 'DRE GERENCIAL - GAMER TECH', 'detalhe', 'DRE 2026', true),
  (2026, 2, 'RECEITAS', 'RECEITAS 2026', 'header', 'DRE 2026', true),
  (2026, 3, 'RECEITAS', 'Fribal', 'detalhe', 'DRE 2026', true),
  (2026, 4, 'RECEITAS', 'Estácio Itapipoca', 'detalhe', 'DRE 2026', true),
  (2026, 5, 'RECEITAS', 'Fortaleza Iguatemi', 'detalhe', 'DRE 2026', true),
  (2026, 6, 'RECEITAS', 'Rio de Janeiro', 'detalhe', 'DRE 2026', true),
  (2026, 7, 'RECEITAS', 'Intech', 'detalhe', 'DRE 2026', true),
  (2026, 8, 'RECEITAS', 'Paulínia nova', 'detalhe', 'DRE 2026', true),
  (2026, 9, 'RECEITAS', 'Curitiba', 'detalhe', 'DRE 2026', true),
  (2026, 10, 'RECEITAS', 'SG Itapipoca', 'detalhe', 'DRE 2026', true),
  (2026, 11, 'RECEITAS', 'SG Atibaia', 'detalhe', 'DRE 2026', true),
  (2026, 12, 'RECEITAS', 'Venda de produto', 'detalhe', 'DRE 2026', true),
  (2026, 13, 'RECEITAS', 'Rendimento aplicação', 'detalhe', 'DRE 2026', true),
  (2026, 14, 'RECEITAS', 'RECEITA TOTAL', 'total/kpi', 'DRE 2026', true),
  (2026, 15, 'RECEITAS', 'CUSTO DO PRODUTO VENDIDO (CPV)', 'detalhe', 'DRE 2026', true),
  (2026, 16, 'RECEITAS', 'RECEITA LIQUIDA TOTAL', 'total/kpi', 'DRE 2026', true),
  (2026, 17, 'DESPESAS COM PESSOAL', 'Salarios', 'detalhe', 'DRE 2026', true),
  (2026, 18, 'DESPESAS COM PESSOAL', 'Ferias', 'detalhe', 'DRE 2026', true),
  (2026, 19, 'DESPESAS COM PESSOAL', 'Fgts', 'detalhe', 'DRE 2026', true),
  (2026, 20, 'DESPESAS COM PESSOAL', 'Inss', 'detalhe', 'DRE 2026', true),
  (2026, 21, 'DESPESAS COM PESSOAL', 'Freelancer', 'detalhe', 'DRE 2026', true),
  (2026, 22, 'DESPESAS COM PESSOAL', 'Alimentação', 'detalhe', 'DRE 2026', true),
  (2026, 23, 'DESPESAS COM PESSOAL', 'Ajuda de Custo', 'detalhe', 'DRE 2026', true),
  (2026, 24, 'DESPESAS COM PESSOAL', 'Vale transporte', 'detalhe', 'DRE 2026', true),
  (2026, 25, 'DESPESAS COM PESSOAL', 'Rescisão', 'detalhe', 'DRE 2026', true),
  (2026, 26, 'DESPESAS COM PESSOAL', '13 Salario', 'detalhe', 'DRE 2026', true),
  (2026, 27, 'DESPESAS COM PESSOAL', 'Outros Custos com Sócios', 'detalhe', 'DRE 2026', true),
  (2026, 28, 'DESPESAS COM PESSOAL', 'Premiações e Comissões', 'detalhe', 'DRE 2026', true),
  (2026, 29, 'DESPESAS COM PESSOAL', 'TOTAL DESPESAS COM PESSOAL', 'total/kpi', 'DRE 2026', true),
  (2026, 30, 'DESPESAS COM PESSOAL', '% Despesas s/Receita', 'percentual/kpi', 'DRE 2026', true),
  (2026, 31, 'DESPESAS OPERACIONAIS / GERAIS', 'DESPESAS OPERACIONAIS', 'header', 'DRE 2026', true),
  (2026, 32, 'DESPESAS OPERACIONAIS / GERAIS', 'Aluguel', 'detalhe', 'DRE 2026', true),
  (2026, 33, 'DESPESAS OPERACIONAIS / GERAIS', 'Condominio', 'detalhe', 'DRE 2026', true),
  (2026, 34, 'DESPESAS OPERACIONAIS / GERAIS', 'Contabilidade', 'detalhe', 'DRE 2026', true),
  (2026, 35, 'DESPESAS OPERACIONAIS / GERAIS', 'Energia Eletrica', 'detalhe', 'DRE 2026', true),
  (2026, 36, 'DESPESAS OPERACIONAIS / GERAIS', 'Serv. de Terceiros', 'detalhe', 'DRE 2026', true),
  (2026, 37, 'DESPESAS OPERACIONAIS / GERAIS', 'Sistema', 'detalhe', 'DRE 2026', true),
  (2026, 38, 'DESPESAS OPERACIONAIS / GERAIS', 'Mat. Limpeza e Higiene', 'detalhe', 'DRE 2026', true),
  (2026, 39, 'DESPESAS OPERACIONAIS / GERAIS', 'Mat. Escritorio/grafico', 'detalhe', 'DRE 2026', true),
  (2026, 40, 'DESPESAS OPERACIONAIS / GERAIS', 'Taxas - outras', 'detalhe', 'DRE 2026', true),
  (2026, 41, 'DESPESAS OPERACIONAIS / GERAIS', 'Propagandas e Marketing', 'detalhe', 'DRE 2026', true),
  (2026, 42, 'DESPESAS OPERACIONAIS / GERAIS', 'Material de Manutenção e Reparos', 'detalhe', 'DRE 2026', true),
  (2026, 43, 'DESPESAS OPERACIONAIS / GERAIS', 'Internet/ip', 'detalhe', 'DRE 2026', true),
  (2026, 44, 'DESPESAS OPERACIONAIS / GERAIS', 'Materiais Diversos (embalagens)', 'detalhe', 'DRE 2026', true),
  (2026, 45, 'DESPESAS OPERACIONAIS / GERAIS', 'Prestação de serviços', 'detalhe', 'DRE 2026', true),
  (2026, 46, 'DESPESAS OPERACIONAIS / GERAIS', 'Viagens', 'detalhe', 'DRE 2026', true),
  (2026, 47, 'DESPESAS OPERACIONAIS / GERAIS', 'Imposto', 'detalhe', 'DRE 2026', true),
  (2026, 48, 'DESPESAS OPERACIONAIS / GERAIS', 'Simples Nacional', 'detalhe', 'DRE 2026', true),
  (2026, 49, 'DESPESAS OPERACIONAIS / GERAIS', 'TOTAL DESPESAS GERAIS', 'total/kpi', 'DRE 2026', true),
  (2026, 50, 'DESPESAS OPERACIONAIS / GERAIS', '% Despesas s/Receita', 'percentual/kpi', 'DRE 2026', true),
  (2026, 51, 'DESPESAS FINANCEIRAS', 'Tarifa Bancaria', 'detalhe', 'DRE 2026', true),
  (2026, 52, 'DESPESAS FINANCEIRAS', 'Juros e Emprestimos', 'detalhe', 'DRE 2026', true),
  (2026, 53, 'DESPESAS FINANCEIRAS', 'Total de despesas financeiras', 'total/kpi', 'DRE 2026', true),
  (2026, 54, 'DESPESAS FINANCEIRAS', '% Despesas s/Receita', 'percentual/kpi', 'DRE 2026', true),
  (2026, 55, 'RESULTADO OPERACIONAL', 'Total de Despesas Operacionais', 'total/kpi', 'DRE 2026', true),
  (2026, 56, 'RESULTADO OPERACIONAL', '% Despesas s/Receita', 'percentual/kpi', 'DRE 2026', true),
  (2026, 57, 'RESULTADO OPERACIONAL', 'LUCRO OPERACIONAL', 'total/kpi', 'DRE 2026', true),
  (2026, 58, 'RESULTADO OPERACIONAL', 'Lucro operaciona/ %', 'percentual/kpi', 'DRE 2026', true),
  (2026, 59, 'DESPESAS NÃO OPERACIONAIS', 'OUTRAS DESPESAS NÃO OPERACIONAIS', 'header', 'DRE 2026', true),
  (2026, 60, 'DESPESAS NÃO OPERACIONAIS', 'Investimento Imobilizado Gamer Tech', 'detalhe', 'DRE 2026', true),
  (2026, 61, 'DESPESAS NÃO OPERACIONAIS', 'Outros Custos Investimentos (Fretes, Outros)', 'detalhe', 'DRE 2026', true),
  (2026, 62, 'DESPESAS NÃO OPERACIONAIS', 'Participação Resultado', 'detalhe', 'DRE 2026', true),
  (2026, 63, 'DESPESAS NÃO OPERACIONAIS', 'Distribuição Lucros  - Sócios', 'detalhe', 'DRE 2026', true),
  (2026, 64, 'DESPESAS NÃO OPERACIONAIS', 'Devolução de Emprestimos', 'detalhe', 'DRE 2026', true),
  (2026, 65, 'DESPESAS NÃO OPERACIONAIS', 'Total de despesas não operacionais', 'total/kpi', 'DRE 2026', true),
  (2026, 66, 'DESPESAS NÃO OPERACIONAIS', 'RESULTADO OPERACIONAL', 'total/kpi', 'DRE 2026', true),
  (2026, 67, 'APORTES E SALDOS', 'Aporte Carlos Forest', 'detalhe', 'DRE 2026', true),
  (2026, 68, 'APORTES E SALDOS', 'Aporte Renan Linhares', 'detalhe', 'DRE 2026', true),
  (2026, 69, 'APORTES E SALDOS', 'TOTAL APORTES TERCEIROS', 'total/kpi', 'DRE 2026', true),
  (2026, 70, 'APORTES E SALDOS', 'Participação Resultado', 'detalhe', 'DRE 2026', true),
  (2026, 71, 'APORTES E SALDOS', 'SALDO ANTERIOR', 'total/kpi', 'DRE 2026', true),
  (2026, 72, 'APORTES E SALDOS', 'SALDO OPERAÇÃO - (RO+SALDO ANT)', 'total/kpi', 'DRE 2026', true),
  (2026, 73, 'APORTES E SALDOS', 'SALDO BANCO', 'total/kpi', 'DRE 2026', true),
  (2026, 74, 'APORTES E SALDOS', 'DIFERENÇA', 'total/kpi', 'DRE 2026', true)
on conflict (year, row_index) do update set
  group_name = excluded.group_name,
  account_name = excluded.account_name,
  row_type = excluded.row_type,
  source_sheet = excluded.source_sheet,
  active = excluded.active;

select count(*) as dre_2026_template_rows
from public.dre_operational_template_rows
where year = 2026 and active = true;
