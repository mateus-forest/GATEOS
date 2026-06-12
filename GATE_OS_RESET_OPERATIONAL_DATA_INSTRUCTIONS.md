# GATE OS - Instrucoes para zerar dados operacionais

Data: 2026-06-11

## Arquivo criado

`supabase/gate-os-reset-operational-data.sql`

## O que o SQL limpa

O bloco principal usa `truncate ... restart identity cascade` somente nas tabelas operacionais:

- `documents`
- `legal_updates`
- `legal_agreement_installments`
- `legal_cases`
- `maintenance_orders`
- `partner_entries`
- `partners`
- `dre_manual_adjustments`
- `dre_monthly_closings`
- `financial_entries`
- `installments`
- `contract_equipment`
- `contracts`
- `assets`
- `equipment`
- `clients`
- `notifications`

## O que nao limpa

- Supabase Auth
- `public.users`
- tabelas, views, enums, policies e buckets
- `dre_categories`
- `cost_centers`
- `bank_accounts`

## Opcional

O arquivo inclui uma seção comentada para limpar `dre_categories`, `cost_centers` e `bank_accounts` somente se esses cadastros base forem dados de teste e puderem ser recriados.

## Storage

Arquivos dos buckets devem ser removidos manualmente pelo painel Supabase:

- `gate-documents`
- `gate-contracts`
- `gate-legal`

Apagar somente objetos/arquivos. Nao apagar buckets.

## Como executar

1. Abrir o projeto correto no Supabase.
2. Ir em SQL Editor.
3. Abrir `supabase/gate-os-reset-operational-data.sql`.
4. Revisar se o ambiente e o projeto estao corretos.
5. Executar apenas o bloco principal aprovado.
6. Executar a verificacao final de contadores.
7. Limpar os arquivos de Storage manualmente, se necessario.

## Checklist pos-limpeza

1. Login admin ainda funciona.
2. Dashboard abre zerado.
3. Financeiro zerado.
4. DRE zerado.
5. Clientes vazio.
6. Contratos vazio.
7. Equipamentos vazio.
8. Documentos vazio.
9. Juridico vazio.
10. Manutencoes vazio.
11. Socios vazio.
12. Relatorios sem dados falsos.

## Status

SQL nao executado automaticamente. Push nao realizado.
