# GATE OS - Ajuste de UX pos-importacao DRE

Data: 2026-06-15

## Problema

A importacao da DRE salvava o snapshot, mostrava toast de sucesso e retornava a tela para `DRE operacional`.

Como a regra correta e nao contaminar a DRE operacional com snapshots, o usuario ficava com a impressao de que nada havia sido importado.

## Ajuste feito

- Apos confirmar importacao, a tela muda automaticamente para `Historico importado`.
- O snapshot recem-criado fica selecionado.
- A lista de snapshots e recarregada de `dre_imports`.
- As linhas do snapshot sao carregadas de `dre_import_rows`.
- O toast agora informa:
  `Importacao salva no Historico importado. A DRE operacional nao foi alterada.`
- O toast inclui CTA `Ver historico importado`.

## Logs de auditoria

Durante a importacao, o console mostra:

- `importId`
- nome da aba
- quantidade de linhas salvas
- quantidade de meses identificados
- quantidade de meses salvos
- quantidade de linhas ignoradas

## Estrutura Supabase

Se `dre_imports` ou `dre_import_rows` nao existirem, o sistema mostra:

`Estrutura de historico da DRE incompleta. Execute o SQL de suporte.`

Se as colunas opcionais `import_kind` ou `raw_data` ainda nao existirem, o sistema registra aviso no console e usa fallback seguro para a importacao mensal.

## Regra de negocio preservada

- Historico nao alimenta Dashboard.
- Historico nao alimenta Financeiro.
- Historico nao alimenta DRE operacional.
- Historico segue sendo somente consulta/exportacao.

## Arquivos alterados

- `components/dre-content.tsx`
- `lib/data/dre.ts`
- `GATE_OS_DRE_IMPORT_UX_FIX_REPORT.md`

## Como testar

- Importar DRE 2026.
- Confirmar que a tela troca para `Historico importado`.
- Confirmar que o snapshot recem-importado fica selecionado.
- Confirmar logs no console.
- Alternar manualmente para `DRE operacional`.
- Confirmar que a DRE operacional nao foi alterada pelo historico.
- Exportar o historico importado.
