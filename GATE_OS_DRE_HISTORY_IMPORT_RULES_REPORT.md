# GATE OS - Regras de importacao DRE historica e operacional

Data: 2026-06-15

## Regra final

- `DRE 2026` e a referencia atual da DRE operacional viva.
- `DRE 2024`, `DRE 2025` e abas antigas ficam como historico arquivado.
- Historico importado nao alimenta Dashboard, Financeiro, contratos, clientes, receitas, despesas ou DRE operacional.
- A DRE operacional continua sendo calculada por contratos, financeiro, socios, banco, fechamentos e ajustes manuais reais.

## Como importar 2026

No modal de importacao, selecionar:

- Modo: `DRE operacional atual`
- Aba: `DRE 2026`

Esse modo exige meses reconhecidos e estrutura mensal de DRE. O snapshot e salvo para consulta/referencia visual, mas nao congela nem substitui a DRE operacional.

## Como importar 2024/2025

No modal de importacao, selecionar:

- Modo: `Historico`
- Abas antigas, como `DRE 2024`, `DRE 2025` ou abas com anos anteriores.

O modo historico aceita estrutura mais flexivel. Se meses forem encontrados, preserva a matriz mensal. Se meses nao forem encontrados, tenta arquivar as linhas como tabela historica generica.

## Onde o historico fica salvo

- `dre_imports`: cabecalho do arquivo/aba/ano/tipo.
- `dre_import_rows`: linhas importadas do snapshot.

Nenhum dado historico cria:

- `financial_entries`
- `contracts`
- `clients`
- `dre_manual_adjustments`
- dados de Dashboard ou Financeiro

## Como visualizar historico

Na tela DRE:

1. Selecionar o ano.
2. Alterar a visao para `Historico importado`.
3. Escolher o snapshot/aba importada no seletor.

A tela exibe aviso: `Visualizacao historica`, indicando que os dados nao alimentam a operacao.

## Como exportar historico

Com a visao `Historico importado` selecionada:

- `Exportar Excel` exporta o snapshot historico ativo.
- `Exportar PDF` exporta o snapshot historico ativo.

Com a visao `DRE operacional` selecionada, as exportacoes usam a DRE calculada pelo sistema.

## Como evitar contaminacao da operacao

- Importacao historica salva apenas snapshots.
- Importacao operacional de 2026 tambem salva snapshot/reference, sem criar ajustes automaticos.
- A DRE operacional nao soma `dre_import_rows`.
- Dashboard e Financeiro continuam lendo fontes operacionais reais.
- Limpeza de historico apaga snapshots, sem apagar contratos, clientes, financeiro ou ajustes manuais.

## SQL necessario

Criado arquivo sugerido:

`supabase/gate-os-dre-history-import-support.sql`

Ele adiciona:

- `dre_imports.import_kind`
- `dre_import_rows.raw_data`

Nao foi executado automaticamente. Sem esse SQL, a importacao mensal continua funcionando; historicos genericos sem meses podem perder a preservacao completa da linha original.

## Arquivos alterados

- `components/dre-content.tsx`
- `lib/data/dre.ts`
- `lib/dre-import-parser.ts`
- `supabase/gate-os-dre-history-import-support.sql`
- `GATE_OS_DRE_HISTORY_IMPORT_RULES_REPORT.md`

## Pendencias reais

- Executar manualmente o SQL sugerido para preservar historicos genericos com `raw_data`.
- Uma melhoria futura pode adicionar filtros globais para listar todos os snapshots de todos os anos em uma tela dedicada de arquivos historicos.

## Como testar

- Importar `DRE 2026` como `DRE operacional atual`.
- Confirmar que a DRE operacional continua calculada pelo sistema.
- Importar `DRE 2024` como `Historico`.
- Importar `DRE 2025` como `Historico`.
- Confirmar que Dashboard e Financeiro nao mudam por importacao historica.
- Abrir `Historico importado` e alternar ano/aba.
- Exportar PDF/Excel do historico.
- Limpar historico selecionado.
- Limpar todos os historicos.
- Confirmar que DRE operacional permanece intacta.
