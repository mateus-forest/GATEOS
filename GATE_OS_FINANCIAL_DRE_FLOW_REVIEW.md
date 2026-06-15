# GATE OS - Revisao do fluxo financeiro e DRE

Data: 2026-06-15

## Regra final: previsto x realizado

- Contratos ativos alimentam previsao, contas a receber, MRR e ARR.
- Contratos ativos nao entram mais como receita realizada da DRE operacional.
- Receita realizada vem de `financial_entries` com `type = receita` e `status = recebido`.
- Receita pendente continua em contas a receber, sem contaminar DRE realizada.
- Despesas continuam vindo de `financial_entries` do tipo `despesa`.

## Contratos e recebiveis

- Ao criar contrato com valor mensal, vencimento e vigencia, o sistema gera parcelas mensais em `installments`.
- As parcelas sao criadas com `status = aberta`, `original_value`, `updated_value`, `contract_id`, `client_id` e `due_date`.
- Essas parcelas passam a alimentar o Financeiro em `Contas a Receber`.

## Confirmar recebimento

- O Financeiro exibe CTA `Confirmar recebimento` para parcelas abertas de contrato.
- Ao confirmar, o sistema:
  - atualiza a parcela para `status = paga`;
  - grava `payment_date`;
  - grava `paid_value`;
  - cria `financial_entries` com `type = receita` e `status = recebido`;
  - vincula `client_id`, `contract_id` e `installment_id`.
- Depois da confirmacao, Financeiro, Dashboard e DRE usam o recebimento real.

## DRE operacional

- A DRE operacional usa:
  - clientes como linhas vivas de receita;
  - receitas recebidas em `financial_entries`;
  - despesas em `financial_entries`;
  - lancamentos de socios;
  - saldos de `bank_accounts`;
  - fechamentos em `dre_monthly_closings`;
  - ajustes manuais em `dre_manual_adjustments`.
- Importacoes de Excel nao criam mais ajustes operacionais automaticamente.

## Importacoes DRE

- A selecao de aba destaca abas que comecam com `DRE`.
- O usuario pode selecionar uma ou varias abas DRE, como `DRE 2024`, `DRE 2025` e `DRE 2026`.
- Outras abas aparecem separadas para evitar importacao acidental.
- Cada aba selecionada e salva como snapshot historico separado em `dre_imports` e `dre_import_rows`.
- O ano do snapshot e extraido do nome da aba quando possivel.
- O preview mostra aba, linha original, grupo, tipo da linha, mes e valor.

## Financeiro

- Lancamentos manuais recarregam a lista diretamente do Supabase apos salvar.
- Categorias DRE passam a ser exibidas por label amigavel; quando a categoria nao existe mais, aparece `Sem categoria`.
- Graficos e cards de receita realizada usam apenas entradas recebidas.
- A receber soma parcelas abertas e receitas pendentes.

## Dashboard

- `Receita Realizada Mensal` usa somente receitas recebidas no mes.
- `Receita prevista` fica separada no bloco financeiro operacional.
- `A receber` considera parcelas abertas de contrato.
- `MRR` e `ARR` continuam baseados em contratos ativos.

## Arquivos alterados

- `components/contratos-content.tsx`
- `components/dashboard-content.tsx`
- `components/dre-content.tsx`
- `components/financeiro-content.tsx`
- `lib/data/recurring-revenue.ts`
- `lib/dre-import-parser.ts`

## Pendencias reais

- A confirmacao de recebimento usa data informada em prompt simples; pode evoluir para modal com conta bancaria e categoria padrao.
- A alternancia de historico importado carrega o snapshot mais recente do ano selecionado; uma lista completa de snapshots por aba pode ser refinada depois.
- Relatorios ainda podem detalhar melhor previsto x realizado por tipo de fonte.

## Como testar

- Importar planilha com abas `DRE 2024`, `DRE 2025` e `DRE 2026` e confirmar que apenas abas DRE sao selecionadas.
- Confirmar preview com aba, linha, grupo, tipo, mes e valor.
- Criar contrato mensal e verificar parcelas abertas em `installments`.
- Abrir Financeiro e confirmar parcelas em `Contas a Receber`.
- Confirmar recebimento de uma parcela.
- Verificar `installments.status = paga` e `financial_entries.status = recebido`.
- Abrir DRE operacional e confirmar receita apenas apos recebimento.
- Abrir Dashboard e conferir receita realizada, receita prevista, MRR, ARR e a receber.
- Criar lancamento manual com categoria e confirmar persistencia/listagem.
- Executar `npm run lint` e `npm run build`.
