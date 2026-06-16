# GATE OS - Correcao dos riscos altos antimock

Data: 2026-06-15

## Escopo corrigido

Foram corrigidos somente os riscos altos autorizados na auditoria antimock:

- Juridico hardcoded.
- Relatorios recentes/agendados hardcoded.
- Conexoes bancarias hardcoded.
- Fallback vazio em leituras Supabase de modulos operacionais.

Nao houve alteracao de carga historica, DRE historica 2022-2025, layout geral, RLS, Auth ou service role no frontend.

## O que foi removido

### Juridico

Removido de `lib/juridico-data.ts`:

- `juridicoCases`
- `isContratoEmJuridico`
- `getJuridicoByContrato`

Impacto:

- Contratos nao usam mais casos juridicos fixos.
- Nenhum contrato e marcado como juridico sem registro real em `legal_cases`.

### Relatorios

Removido de `components/relatorios-content.tsx`:

- `relatoriosRecentes`
- `agendados`
- downloads/impressao baseados nesses registros falsos.

Estados vazios adicionados:

- "Nenhum relatório gerado ainda."
- "Nenhum agendamento configurado."

### Financeiro

Removido de `components/financeiro-content.tsx`:

- `bankConnections` hardcoded com Banco Itau, Aplicacao e Caixa.

A secao bancaria agora usa somente `bank_accounts`.

Estado vazio adicionado:

- "Nenhuma conta bancaria cadastrada."

## O que virou leitura real

### Contratos -> Juridico

`components/contratos-content.tsx` agora carrega:

- `getContracts()`
- `getClients()`
- `getLegalCases()`

O indicador "Em Juridico" e a opcao "Ver caso juridico" aparecem somente quando existe `legal_cases.contract_id` correspondente ao contrato e o caso nao esta encerrado/perdido.

### Financeiro -> Contas bancarias

`components/financeiro-content.tsx` reaproveita `getFinancialSelectOptions()` e exibe contas reais de `bank_accounts`, usando:

- nome amigavel via `bankAccountLabel`
- saldo por `current_balance` ou `opening_balance`
- status por `open_finance_connected` e `is_active`
- ultima sincronizacao por `last_sync_at`

Se nao houver conta cadastrada, nenhum banco ficticio aparece.

## Helpers estritos

Foi criado em `lib/data/supabase-helpers.ts`:

- `selectRowsStrict`

Esse helper:

- falha se Supabase nao estiver configurado;
- falha se o client nao iniciar;
- falha se a query retornar erro de schema, RLS ou rede;
- retorna `[]` somente quando a consulta foi bem sucedida e nao havia linhas.

Modulos atualizados para leitura estrita:

- `lib/data/clients.ts`
- `lib/data/contracts.ts`
- `lib/data/equipment.ts`
- `lib/data/financial.ts`
- `lib/data/dre.ts`
- `lib/data/maintenance.ts`
- `lib/data/assets.ts`
- `lib/data/partners.ts`
- `lib/data/legal.ts`
- `lib/data/documents.ts`
- `lib/data/installments.ts`
- `lib/data/dashboard.ts`
- `lib/data/notifications.ts`

## Validacoes executadas

- `rg "juridicoCases|isContratoEmJuridico|getJuridicoByContrato|relatoriosRecentes|bankConnections" app components lib -n`
  - Nenhuma dependencia produtiva restante encontrada.
- `rg "selectRows\\(" lib\\data -n`
  - Nenhuma chamada restante em `lib/data`.
- `npm run lint`
  - Passou.
- `npm run build`
  - Passou.

Observacao:

- O build manteve o aviso conhecido de dimensoes do Recharts durante prerender estatico. Nao bloqueia o build e nao foi alterado nesta rodada.

## Riscos restantes

### Medio

- `lib/mock-data.ts` ainda existe como arquivo legado de tipos e valores vazios. Nao foi removido porque isso exigiria migrar tipos usados por telas.
- `MockCreateDialog` ainda possui nome legado e `onSave` opcional. Os usos atuais persistem via `onSave`, mas a API do componente ainda permite uso incorreto futuro.
- `juridicoResponsaveis` segue como lista estatica de filtro/formulario. Nao e caso juridico operacional, mas pode ser migrado futuramente para usuarios/responsaveis reais.

### Baixo

- Listas de opcoes estaticas permanecem para formularios e navegacao.
- Arquivos SQL de seed/carga permanecem versionados como artefatos de implantacao.

## Conclusao

Os riscos altos de divergencia real apontados pela auditoria antimock foram removidos ou convertidos para leitura real de Supabase. A interface deixou de exibir casos juridicos, relatorios historicos/agendados e conexoes bancarias que nao existam no banco.
