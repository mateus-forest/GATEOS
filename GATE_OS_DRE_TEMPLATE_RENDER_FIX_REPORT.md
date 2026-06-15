# GATE OS - Renderizacao do template operacional da DRE

Data: 2026-06-15

## Causa da nao exibicao

O template salvo em `dre_operational_template_rows` estava sendo usado principalmente como referencia de ordenacao para linhas ja existentes. Com banco operacional zerado, nao havia clientes/categorias/lancamentos suficientes para gerar as linhas, entao a DRE operacional nao renderizava a estrutura de 74 linhas salva no Supabase.

## Funcao corrigida

- `components/dre-content.tsx`: `buildRows` agora renderiza a estrutura completa do template quando existem linhas em `dre_operational_template_rows`.
- `lib/data/dre.ts`: a leitura ja busca `dre_operational_template_rows` por `year`, `active = true` e `row_index`.

## Como o template e carregado

A tela consulta:

- `year = ano selecionado`
- `active = true`
- ordenacao por `row_index asc`

Campos usados:

- `id`
- `year`
- `row_index`
- `group_name`
- `account_name`
- `row_type`
- `source_sheet`
- `active`

Logs temporarios adicionados no console:

- `[DRE Template] linhas carregadas`
- `[DRE Template] ano selecionado`
- `[DRE Template] primeira linha`

## Como os valores reais sao mesclados

O template define somente a estrutura visual. Os valores continuam vindo de:

- `financial_entries`
- `partner_entries`
- `bank_accounts`
- `dre_manual_adjustments`
- `dre_monthly_closings`
- clientes/recebimentos quando existem lancamentos financeiros reais

Para cada linha do template, o sistema tenta casar `account_name` com linhas operacionais calculadas. Se nao houver correspondencia real, a linha aparece com valores zerados.

## Arquivos alterados

- `components/dre-content.tsx`
- `GATE_OS_DRE_TEMPLATE_RENDER_FIX_REPORT.md`

## Como testar

- Confirmar que `dre_operational_template_rows` possui linhas para `year = 2026`.
- Abrir `/dre` em `DRE operacional`.
- Confirmar que as linhas estruturais do template aparecem.
- Confirmar que valores ficam zerados quando nao ha dados reais.
- Criar lancamento financeiro com categoria correspondente e conferir preenchimento da linha.
- Confirmar recebimento de contrato/cliente e conferir linha correspondente.
- Alternar para `Historico importado` e confirmar que nao mistura snapshots com operacional.
- Voltar para `DRE operacional` e confirmar que o template permanece.
