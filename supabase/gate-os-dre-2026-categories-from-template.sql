-- GATE OS - Categorias DRE 2026 a partir do template operacional
-- Data: 2026-06-15
--
-- Execute manualmente no Supabase SQL Editor.
-- Script idempotente: nao duplica categorias com mesmo name + group_name.
-- Nao insere valores financeiros e nao altera historico 2022-2025.

with eligible_template_rows as (
  select
    trim(account_name) as name,
    trim(group_name) as group_name,
    row_index as sort_order
  from public.dre_operational_template_rows
  where year = 2026
    and active is true
    and lower(coalesce(row_type, '')) in ('detalhe', 'account')
    and coalesce(trim(account_name), '') <> ''
    and coalesce(trim(group_name), '') <> ''
    and lower(coalesce(group_name, '')) not like '%fechamento%'
    and lower(coalesce(account_name, '')) not like '%receita total%'
    and lower(coalesce(account_name, '')) not like '%receita liquida%'
    and lower(coalesce(account_name, '')) not like '%total%'
    and position('%' in coalesce(account_name, '')) = 0
    and lower(coalesce(account_name, '')) not like '%lucro operacional%'
    and lower(coalesce(account_name, '')) not like '%resultado operacional%'
    and lower(coalesce(account_name, '')) not like '%saldo%'
    and lower(coalesce(account_name, '')) not like '%diferenca%'
),
normalized_categories as (
  select distinct on (lower(name), lower(group_name))
    name,
    group_name,
    case
      when lower(name) like '%cpv%' then 'despesa'
      when lower(name) like '%custo do produto%' then 'despesa'
      when lower(group_name) like '%receita%' then 'receita'
      when lower(group_name) like '%aporte%' then 'receita'
      else 'despesa'
    end as type,
    sort_order
  from eligible_template_rows
  order by lower(name), lower(group_name), sort_order
)
insert into public.dre_categories (name, group_name, type, sort_order, active)
select
  category.name,
  category.group_name,
  category.type,
  category.sort_order,
  true
from normalized_categories category
where not exists (
  select 1
  from public.dre_categories existing
  where lower(existing.name) = lower(category.name)
    and lower(coalesce(existing.group_name, '')) = lower(category.group_name)
);

select
  count(*) as active_dre_categories
from public.dre_categories
where active is true;

select
  name,
  group_name,
  type,
  sort_order,
  active
from public.dre_categories
where active is true
order by sort_order, group_name, name;
