# GATE OS - Correcao DRE operacional e historico multi-ano

Data: 2026-06-15

## Causa do template nao aparecer corretamente

O template operacional de 2026 estava salvo em `dre_operational_template_rows`, mas a tela ainda dependia de linhas calculadas a partir de dados operacionais para montar a tabela. Com banco zerado ou sem correspondencia real, a estrutura nao aparecia como espelho do modelo salvo.

## DRE operacional 2026

A DRE operacional agora usa `dre_operational_template_rows` como estrutura quando houver template ativo para o ano selecionado:

- `year = selectedYear`
- `active = true`
- ordenado por `row_index`

Cada linha usa `account_name`, `group_name` e `row_type` do template. Os valores continuam vindo apenas do sistema real e ficam zerados quando nao ha correspondencia.

## Valores reais

Fontes permitidas na DRE operacional:

- `financial_entries`
- `partner_entries`
- `bank_accounts`
- `dre_manual_adjustments`
- `dre_monthly_closings`
- clientes/recebimentos vinculados a lancamentos reais

A DRE operacional nao usa valores de `dre_import_rows`, `dre_imports` ou historicos importados.

## Historico multi-ano

O parser passou a salvar `raw_data` como estrutura de celulas:

```json
{
  "rowIndex": 12,
  "cells": [
    { "columnIndex": 0, "header": "Conta", "value": "Fribal" },
    { "columnIndex": 1, "header": "ago-22", "value": "..." }
  ]
}
```

Quando o snapshot historico possui `raw_data`, a tela renderiza uma tabela dinamica com todas as colunas originais da planilha. Isso preserva abas como `DRE GAMER TECH 2 -23-24-25`, sem limitar a jan-dez ou remapear meses para um unico ano.

## Uso de raw_data

Para historicos multi-ano, `raw_data` e obrigatorio. Se a coluna nao existir, o sistema mostra:

`Para importar historico com multiplos anos, execute o SQL de suporte com raw_data.`

## Separacao operacional x historico

- DRE operacional usa template + dados reais.
- Historico importado usa snapshot/`raw_data`.
- Historico nao alimenta Dashboard, Financeiro ou DRE operacional.
- A exportacao Excel/PDF do historico flexivel usa as colunas originais do snapshot.

## Arquivos alterados

- `components/dre-content.tsx`
- `lib/dre-import-parser.ts`
- `lib/data/dre.ts`
- `GATE_OS_DRE_OPERATIONAL_AND_HISTORY_FIX_REPORT.md`

## SQL necessario

Para historicos multi-ano, confirmar que o SQL de suporte ja foi aplicado:

`supabase/gate-os-dre-history-import-support.sql`

Ele deve adicionar `dre_import_rows.raw_data`.

## Como testar

- Abrir `/dre` com 74 linhas em `dre_operational_template_rows`.
- Confirmar que a DRE operacional mostra a estrutura completa de 2026.
- Confirmar valores zerados quando nao ha dados reais.
- Criar lancamento financeiro com categoria/cliente correspondente e conferir preenchimento da linha.
- Importar `DRE GAMER TECH 2 -23-24-25` como historico.
- Confirmar que colunas como `ago-22`, `set-22`, `jan-23`, `jan-24` e `jan-25` aparecem.
- Confirmar que o historico nao altera Dashboard, Financeiro ou DRE operacional.
- Exportar Excel/PDF do historico e conferir colunas originais.
