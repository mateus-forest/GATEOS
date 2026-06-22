# GATE OS - Refinamento do parser de planilhas do COS

Data: 2026-06-21

## Objetivo

Melhorar a leitura deterministica de Excel/CSV no COS antes de qualquer integracao com OpenAI.

## O que foi alterado

- O parser deixou de depender de `sheet_to_json` com cabecalhos automaticos do `xlsx`, que gerava colunas como `__EMPTY`.
- A leitura agora usa matriz bruta por aba (`header: 1`) para analisar a estrutura antes de montar objetos.
- Foram adicionadas heuristicas para:
  - ignorar linhas vazias;
  - ignorar colunas completamente vazias;
  - detectar linha provavel de cabecalho;
  - renomear colunas vazias como `Coluna N`;
  - detectar colunas de meses, totais e valores;
  - classificar linhas como `section`, `title`, `detail` ou `row`;
  - detectar secoes/categorias;
  - identificar planilhas com cara de DRE / demonstrativo financeiro;
  - preservar a ordem original das linhas por `_rowNumber`.

## Preview melhorado

O COS agora mostra, por aba:

- nome da aba;
- tipo provavel;
- linhas analisadas;
- colunas uteis;
- linha provavel de cabecalho;
- linhas vazias ignoradas;
- colunas detectadas;
- secoes detectadas;
- amostra estruturada das primeiras 20 linhas uteis.

## Regras preservadas

- Nenhum dado e gravado no Supabase.
- O botao `Confirmar execucao` permanece desabilitado.
- DRE operacional nao foi alterada.
- Financeiro, Dashboard, Clientes, Contratos e Equipamentos nao foram alterados.
- Nenhum dado historico foi misturado com operacao.
- Nao houve integracao OpenAI.
- Nao houve migration ou alteracao de banco.

## Logs

O servidor registra no console a estrutura detectada por aba com:

- arquivo;
- aba;
- total de linhas;
- colunas uteis;
- linha de cabecalho;
- tipo provavel;
- linhas vazias ignoradas;
- quantidade de secoes detectadas.

## Validacoes

- `npm run lint`
- `npm run build`

## Proximos passos

- Testar com a planilha DRE GATE real.
- Ajustar sinonimos de colunas conforme novos formatos aparecerem.
- Integrar OCR/PDF parser apenas em etapa futura.
- Integrar OpenAI somente depois que o parser deterministico estiver validado.
