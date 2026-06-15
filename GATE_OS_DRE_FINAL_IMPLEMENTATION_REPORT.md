# GATE OS - Implementacao final DRE operacional 2026 e historica 2022-2025

Data: 2026-06-15

## Correcao da leitura operacional 2026

### Causa do problema

A DRE operacional 2026 estava carregando a tabela `dre_operational_template_rows`, mas a transformacao da interface ainda tratava a estrutura como modelo importado/legado. O mapper nao preservava `row_index`, classificava grupos comparando chaves normalizadas com nomes que nao batiam e nao reconhecia `row_type` reais do banco como `header`, `detalhe`, `total/kpi`, `balance` e `result`.

Com isso, a tela podia perder a ordem oficial da DRE 2026 e classificar linhas operacionais de forma incorreta na montagem/renderizacao.

### Arquivos corrigidos

- `lib/data/dre.ts`
- `components/dre-content.tsx`

### Campos corrigidos

Para `2026`, a consulta operacional agora seleciona explicitamente somente os campos reais usados pela tela:

- `year`
- `row_index`
- `group_name`
- `account_name`
- `row_type`
- `active`

A interface converte:

- `row_index` -> ordem interna da linha
- `group_name` -> grupo/secao visual
- `account_name` -> nome da linha
- `row_type` -> classificacao visual da linha

A renderizacao nao exige quantidade fixa de linhas; qualquer linha ativa de `dre_operational_template_rows` para `year = 2026` entra na tabela em ordem de `row_index`, incluindo linhas finais de fechamento como `SALDO BANCO` e `DIFERENCA`.

### Tratamento de erro

O carregamento principal da DRE agora exibe erro real retornado pelas consultas em vez de deixar a tela parecer vazia silenciosamente. Nao foi criado fallback falso.

### Validacoes executadas nesta correcao

- `npm run lint`
- `npm run build`
- Consulta local com `NEXT_PUBLIC_SUPABASE_ANON_KEY` para `dre_operational_template_rows` em `2026` retornou `0` linhas e erro nulo neste ambiente, indicando que a validacao visual completa depende da policy/sessao autenticada do navegador.
- O caminho historico `2022`-`2025` nao foi alterado; ele continua lendo `dre_historical_values`.
- A exportacao permanece baseada em `activeRows`, portanto respeita a fonte ativa selecionada (`2026` operacional, `2022`-`2025` historica ou snapshot importado).

## Conexao da DRE 2026 com financeiro

### Causa real encontrada

O template operacional `dre_operational_template_rows` estava carregado e renderizava a estrutura visual de 2026, mas `dre_categories` estava vazia. Como `financial_entries` e `dre_manual_adjustments` usam `dre_category_id`, a DRE nao tinha categorias reais para ligar lancamentos financeiros, ajustes manuais e linhas do demonstrativo.

O modal financeiro ja possuia o campo `dre_category_id` e ja salvava esse valor em `financial_entries`, mas a lista vinha vazia porque dependia de `dre_categories`.

## Correcao da agregacao de lancamentos financeiros

### Causa exata

O lancamento real criado em `financial_entries` foi salvo corretamente com:

- `type = receita`
- `status = recebido`
- `value = 3500`
- `amount = null`
- `competence_date = 2026-06-15`
- `dre_category_id` preenchido

A leitura compartilhada por Financeiro e DRE usava `getEntryAmount`, que tentava ler `amount` antes de `value`. Como `Number(null)` retorna `0`, o helper aceitava o campo `amount` nulo como valor valido e nunca chegava em `value = 3500`.

Com isso, o registro aparecia na tabela de lancamentos, mas os cards financeiros, Receita Realizada, DRE 2026, linha `Estacio Itapipoca` e `RECEITA TOTAL` recebiam `0`.

### Arquivo corrigido

- `lib/data/recurring-revenue.ts`

### Campos reais usados

O agregador agora usa:

- `value` como valor principal
- `amount` como compatibilidade/fallback
- `valor` como fallback legado
- `competence_date` para competencia mensal
- `type` para receita/despesa
- `status` para realizado/pendente
- `dre_category_id` para ligar `financial_entries` a `dre_categories`

Campos nulos, indefinidos ou vazios passam a ser ignorados antes da conversao numerica.

### Impacto na DRE 2026 e Financeiro

Receitas com `type = receita`, `status = recebido`, `competence_date` no ano selecionado e `dre_category_id` preenchido passam a alimentar a linha da categoria DRE correspondente e os totais mensais.

Despesas realizadas entram no total financeiro somente quando tambem possuem status normalizado como realizado/pago, mantendo a mesma regra usada pela DRE.

### Validacoes executadas nesta correcao

- Consulta local ao Supabase com `.env.local` confirmou `1` registro em `financial_entries`.
- O registro real possui `value = 3500`, `amount = null`, `type = receita`, `status = recebido`, `competence_date = 2026-06-15` e `dre_category_id` preenchido.
- A agregacao local pelo mesmo criterio corrigido retorna `3500` para receita realizada em `jun-26`.
- O valor passa a entrar pela competencia (`competence_date`) e nao por `created_at`.
- A ligacao operacional continua usando `financial_entries.dre_category_id -> dre_categories.id -> dre_operational_template_rows.account_name/group_name`.
- O historico `2022`-`2025` nao foi alterado.
- `npm run lint`
- `npm run build`

## Correcao do mapeamento de categorias nas linhas operacionais

### Causa exata

A DRE 2026 montava duas linhas internas para a mesma conta quando existia template operacional e categoria DRE:

- uma linha criada por `dre_operational_template_rows.account_name`, sem `categoryId` e com valores zerados;
- uma linha criada por `dre_categories.id`, com `categoryId` e com o valor vindo de `financial_entries`.

Os totais somavam a linha da categoria, por isso `RECEITA TOTAL` e `RECEITA LIQUIDA TOTAL` exibiam R$ 3.500,00. Mas a renderizacao final, baseada nas linhas oficiais do template, procurava a primeira linha pelo nome normalizado e encontrava a linha zerada do template antes da linha categorizada.

### Criterio de vinculo adotado

Cada linha operacional de detalhe agora tenta receber a categoria correspondente antes de ser criada:

- primeiro por `dre_categories.sort_order -> dre_operational_template_rows.row_index`;
- depois por `dre_categories.group_name + dre_categories.name -> dre_operational_template_rows.group_name + dre_operational_template_rows.account_name`.

Quando existe categoria correspondente, a linha operacional e criada usando o proprio `dre_categories.id` como chave interna e recebe `categoryId`. Assim o lancamento agregado por `financial_entries.dre_category_id` cai na mesma linha que sera renderizada pelo template.

O lookup final tambem passa a preferir, em caso de duplicidade de nome, a linha que possui valores reais.

### Validacoes executadas nesta correcao

- O lancamento real segue com `dre_category_id` preenchido e valor agregado de `3500` em `jun-26`.
- O mapeamento agora preserva `categoryId` na linha operacional renderizada.
- `RECEITA TOTAL` e `RECEITA LIQUIDA TOTAL` continuam usando os mesmos totais, sem mudanca de regra.
- O historico `2022`-`2025` nao foi alterado.
- `npm run lint`
- `npm run build`

### SQL criado

Foi criado o SQL idempotente:

- `supabase/gate-os-dre-2026-categories-from-template.sql`

Ele popula `dre_categories` a partir de `dre_operational_template_rows`, usando somente `year = 2026`, `active = true` e linhas de detalhe. O script ignora headers, totais, KPIs, percentuais e linhas de fechamento.

Com o seed operacional versionado de 74 linhas, o filtro gera `51` categorias elegiveis. No Supabase real, onde existem `76` linhas, a quantidade criada deve continuar seguindo o mesmo filtro; linhas `balance/result` de fechamento nao viram categoria.

### Como o modal usa dre_categories

O financeiro busca categorias com:

- `active = true`
- ordenacao por `sort_order`
- erro explicito caso `dre_categories` nao possa ser consultada

O label exibido no modal passou a ser:

- `group_name - name`

Exemplos:

- `RECEITAS - Fribal`
- `DESPESAS COM PESSOAL - Salarios`
- `DESPESAS OPERACIONAIS / GERAIS - Aluguel`

Ao salvar o lancamento, o modal continua gravando `dre_category_id` em `financial_entries`.

### Como a DRE 2026 calcula valores

A DRE 2026 cruza:

- `financial_entries.dre_category_id`
- `dre_categories.id`
- `dre_categories.name/group_name`
- `dre_operational_template_rows.account_name/group_name`

Os valores entram no mes de `competence_date`. Receitas entram somente quando o status normalizado e `recebido`; despesas entram somente quando o status normalizado e `pago`.

Linhas sem lancamento continuam aparecendo com valor zerado, sem criar fallback falso.

### Acoes na DRE 2026

Ja existe ajuste manual por linha da DRE quando a linha tem `categoryId`, gravando em `dre_manual_adjustments`.

Nao foi encontrada uma acao completa e segura para criar/editar/excluir lancamentos financeiros diretamente dentro da grade da DRE 2026. A implementacao minima recomendada para uma proxima etapa e abrir o modal financeiro pre-preenchido a partir da linha da DRE, reaproveitando `dre_category_id`, `competence_date`, status e conta bancaria, sem duplicar regras de financeiro dentro da DRE.

### Validacoes executadas nesta correcao

- Validacao local do SQL contra o seed versionado:
  - `74` linhas de template no arquivo.
  - `51` categorias elegiveis pelo filtro seguro.
- `npm run lint`
- `npm run build`
- Consulta local com `NEXT_PUBLIC_SUPABASE_ANON_KEY` ainda retorna `0` linhas para `dre_categories` e `financial_entries` neste ambiente, entao a validacao de dados reais depende da execucao manual do SQL no Supabase e de sessao autenticada/policies do projeto.
- O historico `2022`-`2025` nao foi alterado.

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
- Estrutura operacional: `year`, `row_index`, `group_name`, `account_name`, `row_type`, `active`

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
