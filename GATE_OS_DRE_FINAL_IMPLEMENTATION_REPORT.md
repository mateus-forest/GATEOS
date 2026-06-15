# GATE OS - Implementacao final DRE operacional 2026 e historica 2022-2025

Data: 2026-06-15

## Correcao da leitura historica na interface

### Causa do problema

A leitura de `dre_historical_values` ainda usava uma consulta simples do Supabase. Para anos com mais de 1.000 registros, a resposta podia ficar truncada pelo limite padrao de pagina do PostgREST. Alem disso, a tela nao usava `row_type` para classificar as linhas historicas e dependia de linhas estruturais que nao existem no historico long.

### Arquivos corrigidos

- `lib/data/dre.ts`
- `components/dre-content.tsx`

### Como a DRE historica agora e lida

Para `2022`, `2023`, `2024` e `2025`, a tela consulta somente `dre_historical_values`, filtrando por `year`, ordenando por `line_order` e `month`, e paginando ate carregar todos os registros do ano.

A montagem da tabela agrupa as linhas por ordem/secao/nome, preenche sempre 12 meses com `0`, aplica os valores encontrados por `month`, respeita `row_type` para totais/percentuais/secoes e reconstrui visualmente os headers a partir de `section`.

`2026` continua usando a DRE operacional do sistema.

### Validacoes executadas nesta correcao

- Validacao local da estrutura historica a partir do seed aplicado:
  - `2022`: `440` registros, `88` linhas, `12` meses.
  - `2023`: `1056` registros, `88` linhas, `12` meses.
  - `2024`: `1056` registros, `88` linhas, `12` meses.
  - `2025`: `1056` registros, `88` linhas, `12` meses.
- `npm run lint`
- `npm run build`
- Dev server iniciado em `http://localhost:3000`; `/dre` redirecionou para `/login?next=%2Fdre`, confirmando que a validacao visual final exige sessao autenticada no Supabase.

## O que foi alterado

- A tela DRE agora separa anos operacionais e historicos pelo filtro de ano.
- `2026` permanece como DRE operacional viva.
- `2022`, `2023`, `2024` e `2025` passam a usar dados estruturados de `dre_historical_values`.
- Snapshots antigos em `dre_imports/dre_import_rows` deixam de ser motor da DRE por ano.
- Exportacao Excel/PDF respeita a fonte ativa da tela.

## Tabelas usadas

DRE operacional 2026:

- `dre_operational_template_rows`
- `financial_entries`
- `partner_entries`
- `bank_accounts`
- `dre_manual_adjustments`
- `dre_monthly_closings`

DRE historica 2022-2025:

- `dre_historical_values`

Snapshots auxiliares, apenas consulta/importacao legado:

- `dre_imports`
- `dre_import_rows`

## Como 2026 funciona

Quando o ano selecionado e `2026`, a tela carrega a estrutura de `dre_operational_template_rows` e renderiza as linhas oficiais da DRE 2026. Os valores sao preenchidos somente por dados reais do sistema. Receita prevista de contratos nao entra como receita realizada da DRE.

Se nao houver dados reais, a estrutura permanece visivel com valores zerados.

## Como 2022-2025 funciona

Quando o ano selecionado e `2022`, `2023`, `2024` ou `2025`, a tela consulta `dre_historical_values`.

O historico e somente leitura:

- nao cria `financial_entries`
- nao altera contratos
- nao altera Dashboard
- nao alimenta a DRE operacional 2026
- nao recalcula valores historicos

## Arquivos SQL criados

- `supabase/gate-os-dre-2026-operational-template-seed.sql`
- `supabase/gate-os-dre-historical-values-2022-2025-seed.sql`

Os arquivos foram atualizados com cargas idempotentes geradas a partir dos CSVs aprovados. Nao foram executados automaticamente no Supabase.

## Dados de carga gerados

DRE operacional 2026:

- Fonte: `gate_dre_2026_operational_template_extracted.csv`
- Registros no SQL: `74`
- Chave de upsert: `year + row_index`
- Estrutura preservada: `source_sheet`, `order_index`, `section`, `row_type`, `line_name`

DRE historica 2022-2025:

- Fonte principal: `gate_dre_historical_2022_2025_long_for_database.csv`
- Registros no SQL: `3.608`
- Anos: `2022`, `2023`, `2024`, `2025`
- Intervalo: `2022-08` ate `2025-12`
- Chave de upsert: `source_sheet + line_order + competency`
- Campos preservados: `excel_row`, `section`, `line_name`, `row_type`, `year`, `month`, `competency`, `value`, `excel_col`, `formula`

Arquivo wide usado apenas como validacao visual/estrutural:

- `gate_dre_historical_2022_2025_wide_extracted.csv`
- `91` linhas originais
- `41` competencias
- Sem divergencia de valores contra o CSV long nos `3.608` registros existentes.

## Arquivos alterados

- `components/dre-content.tsx`
- `lib/data/dre.ts`
- `supabase/gate-os-dre-2026-operational-template-seed.sql`
- `supabase/gate-os-dre-historical-values-2022-2025-seed.sql`
- `GATE_OS_DRE_FINAL_IMPLEMENTATION_REPORT.md`

## Validacoes executadas

- Auditoria dos CSVs:
  - DRE 2026 com `74` linhas.
  - Historico com `3.608` registros.
  - `0` divergencias long x wide.
  - `0` duplicidades na chave `source_sheet + excel_row + line_name + period`.
- Validacao dos SQLs gerados:
  - `74` tuplas de carga operacional.
  - `3.608` tuplas de carga historica.
- `npm run lint`
- `npm run build`

## Riscos conhecidos

- Os SQLs de carga ainda precisam ser aplicados manualmente no Supabase SQL Editor ou via processo aprovado.
- Se ja houver registros historicos duplicados fora da chave `source_sheet + line_order + competency`, o indice unico pode exigir limpeza manual antes da carga.
- As 3 linhas de header do CSV wide nao entram nos `3.608` registros long; a tela historica deve reconstruir a visualizacao por secao/ordem.

## Proximos passos

- Aplicar os SQLs de carga no Supabase.
- Validar `select count(*)` em `dre_operational_template_rows` para `year = 2026 and active = true`.
- Validar `select count(*)` em `dre_historical_values`.
- Validar contagens por ano e totais historicos.
- Confirmar em `/dre` que 2026 mostra a DRE operacional e 2022-2025 mostram somente historico.
