# GATE OS - Separacao entre DRE operacional e historicos importados

Data: 2026-06-15

## Causa da mistura

A tela ja salvava snapshots em `dre_imports` e `dre_import_rows`, mas ainda havia fluxo generico para limpar/listar importacoes como um bloco. Isso deixava confusa a separacao entre snapshot historico e referencia operacional, especialmente quando DRE 2026 e planilhas antigas eram importadas no mesmo ambiente.

## Snapshots historicos isolados

- A leitura de historico selecionado usa somente `dre_import_rows.import_id = selectedImportId`.
- O seletor mostra `sheet_name`, `file_name`, `year` e `import_kind`.
- Cada importacao historica fica isolada por `dre_imports.id`.
- `Limpar historico` remove somente o snapshot selecionado.
- `Limpar todos` remove apenas snapshots historicos, preservando referencias operacionais importadas.

## DRE operacional separada

A DRE operacional continua calculada apenas por fontes reais do sistema:

- `clients`
- `financial_entries`
- `partner_entries`
- `bank_accounts`
- `dre_manual_adjustments`
- `dre_monthly_closings`
- `dre_categories`

Ela nao soma `dre_import_rows`, nao usa snapshots historicos e nao alimenta Dashboard ou Financeiro com historico importado.

## DRE 2026 como modelo

Ao importar `DRE 2026` no modo `DRE operacional atual`, o sistema salva a estrutura visual em `dre_operational_template_rows`:

- ordem das linhas
- grupos
- nome da conta
- tipo da linha
- aba de origem

Esse template serve para montar/ordenar a estrutura operacional. Os valores continuam vindo do sistema e ficam zerados quando nao ha dados reais.

O modo operacional nao troca a tela para `Historico importado` e nao cria snapshot historico obrigatorio em `dre_imports/dre_import_rows`.

## Historicos 2024/2025 arquivados

Planilhas antigas, como `DRE 2024`, `DRE 2025` e `DRE GAMER TECH 2 -23-24-25`, permanecem como snapshots de consulta/exportacao. Elas nao criam receitas, contratos, clientes, lancamentos financeiros ou ajustes operacionais.

## Arquivos alterados

- `components/dre-content.tsx`
- `lib/data/dre.ts`
- `supabase/gate-os-dre-operational-template.sql`
- `GATE_OS_DRE_HISTORY_SEPARATION_FIX_REPORT.md`

## SQL necessario

Criado arquivo sugerido:

`supabase/gate-os-dre-operational-template.sql`

Nao foi executado automaticamente. Sem esse SQL, a DRE operacional continua calculada corretamente por dados reais, mas nao consegue persistir a DRE 2026 como template visual de ordenacao.

## Como testar

- Limpar todos os historicos.
- Confirmar que a DRE operacional permanece calculada pelo sistema.
- Importar `DRE 2026` como `DRE operacional atual`.
- Confirmar que a tela permanece em `DRE operacional`.
- Confirmar que `dre_operational_template_rows` recebeu linhas.
- Confirmar que a DRE operacional nao usa valores importados.
- Importar `DRE 22-23-24-25` como `Historico`.
- Alternar entre os snapshots e confirmar que os valores nao se misturam.
- Exportar historico e operacional separadamente.
- Confirmar que Dashboard e Financeiro nao mudam por causa do historico.
