-- GATE OS - Categorias base da DRE gerencial
-- Data: 2026-06-12
--
-- NAO executar automaticamente.
-- Execute manualmente no Supabase SQL Editor para criar a estrutura base da DRE.
-- Este script nao insere valores financeiros.

with base_categories(name, group_name, type, sort_order) as (
  values
    ('Venda de produto', 'Receitas', 'receita', 10),
    ('Rendimento aplicacao', 'Receitas', 'receita', 20),
    ('Outras receitas', 'Receitas', 'receita', 30),
    ('CPV', 'Custo do Produto Vendido', 'despesa', 100),
    ('Salarios', 'Despesas com pessoal', 'despesa', 200),
    ('Ferias', 'Despesas com pessoal', 'despesa', 210),
    ('FGTS', 'Despesas com pessoal', 'despesa', 220),
    ('INSS', 'Despesas com pessoal', 'despesa', 230),
    ('Freelancer', 'Despesas com pessoal', 'despesa', 240),
    ('Alimentacao', 'Despesas com pessoal', 'despesa', 250),
    ('Ajuda de Custo', 'Despesas com pessoal', 'despesa', 260),
    ('Vale transporte', 'Despesas com pessoal', 'despesa', 270),
    ('Rescisao', 'Despesas com pessoal', 'despesa', 280),
    ('13 Salario', 'Despesas com pessoal', 'despesa', 290),
    ('Outros Custos com Socios', 'Despesas com pessoal', 'despesa', 300),
    ('Premiacoes e Comissoes', 'Despesas com pessoal', 'despesa', 310),
    ('Aluguel', 'Despesas operacionais', 'despesa', 400),
    ('Condominio', 'Despesas operacionais', 'despesa', 410),
    ('Contabilidade', 'Despesas operacionais', 'despesa', 420),
    ('Energia Eletrica', 'Despesas operacionais', 'despesa', 430),
    ('Servicos de Terceiros', 'Despesas operacionais', 'despesa', 440),
    ('Sistema', 'Despesas operacionais', 'despesa', 450),
    ('Material Limpeza e Higiene', 'Despesas operacionais', 'despesa', 460),
    ('Material Escritorio/Grafico', 'Despesas operacionais', 'despesa', 470),
    ('Taxas - outras', 'Despesas operacionais', 'despesa', 480),
    ('Propagandas e Marketing', 'Despesas operacionais', 'despesa', 490),
    ('Material de Manutencao e Reparos', 'Despesas operacionais', 'despesa', 500),
    ('Internet/IP', 'Despesas operacionais', 'despesa', 510),
    ('Materiais Diversos', 'Despesas operacionais', 'despesa', 520),
    ('Prestacao de servicos', 'Despesas operacionais', 'despesa', 530),
    ('Viagens', 'Despesas operacionais', 'despesa', 540),
    ('Imposto', 'Despesas operacionais', 'despesa', 550),
    ('Simples Nacional', 'Despesas operacionais', 'despesa', 560),
    ('Tarifa Bancaria', 'Despesas financeiras', 'despesa', 600),
    ('Juros e Emprestimos', 'Despesas financeiras', 'despesa', 610),
    ('Investimento Imobilizado Gamer Tech', 'Outras despesas nao operacionais', 'despesa', 700),
    ('Outros Custos Investimentos', 'Outras despesas nao operacionais', 'despesa', 710),
    ('Participacao Resultado', 'Outras despesas nao operacionais', 'despesa', 720),
    ('Distribuicao Lucros - Socios', 'Outras despesas nao operacionais', 'despesa', 730),
    ('Devolucao de Emprestimos', 'Outras despesas nao operacionais', 'despesa', 740),
    ('Aporte Carlos Forest', 'Aportes', 'receita', 800),
    ('Aporte Renan Linhares', 'Aportes', 'receita', 810),
    ('Saldo anterior', 'Fechamento', 'receita', 900),
    ('Saldo banco', 'Fechamento', 'receita', 910)
)
insert into public.dre_categories (name, group_name, type, sort_order, active)
select
  base.name,
  base.group_name,
  base.type,
  base.sort_order,
  true
from base_categories base
where not exists (
  select 1
  from public.dre_categories existing
  where lower(existing.name) = lower(base.name)
);

select name, group_name, type, sort_order, active
from public.dre_categories
order by sort_order, name;
