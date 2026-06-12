# GATE OS - Auditoria DRE zerada e remocao de mock residual

Data: 2026-06-11

## Problema encontrado

A tela DRE continuava exibindo valores antigos mesmo apos o reset do banco porque `components/dre-content.tsx` usava uma constante local `baseRows` com linhas e valores historicos fixos. O componente tambem inicializava `closedMonths` localmente com `jan-26` e `fev-26`, por isso mostrava `2/12` meses fechados sem consultar `dre_monthly_closings`.

`lib/dre-store.ts` tambem mantinha categorias antigas e uma store local em memoria para lancamentos DRE, sem persistencia Supabase.

## Arquivos corrigidos

- `components/dre-content.tsx`
- `lib/data/dre.ts`
- `lib/dre-store.ts`

## Mocks removidos

- Linhas fixas de clientes/receitas/despesas antigas na DRE.
- Valores historicos hardcoded da DRE.
- Meses fechados locais iniciados como `jan-26` e `fev-26`.
- Store local `useDreLaunches`.
- Categorias DRE hardcoded antigas em `lib/dre-store.ts`.

## Fonte atual da DRE

A DRE agora usa somente dados reais do Supabase:

- `contracts`
- `financial_entries`
- `dre_categories`
- `dre_manual_adjustments`
- `dre_monthly_closings`

## Estado vazio aplicado

Quando nao houver contratos, lancamentos financeiros, categorias/ajustes ou fechamentos reais:

- Receita Total: `R$ 0,00`
- Despesas Operacionais: `R$ 0,00`
- Resultado Operacional: `R$ 0,00`
- Meses Fechados: `0/12`
- Fechamento mensal: todos os indicadores em `R$ 0,00`
- Tabela: `Sem dados financeiros para o período selecionado.`
- Ajustes manuais: `Nenhum ajuste manual registrado.`

## Importacao Excel

O botao de importacao agora informa:

`Importação Excel ainda não configurada.`

Nenhum dado importado localmente alimenta a DRE.

## Fechamento mensal

O fechamento nao e mais local/mockado. Ao confirmar, salva os valores reais atuais em `dre_monthly_closings`. Se o banco estiver zerado, o fechamento salva zeros reais apos confirmacao explicita no modal.

Reabertura de mes permanece como funcionalidade em preparacao, sem alterar estado local falso.

## Exportacoes

Excel e PDF usam o estado real atual da DRE. Se o banco estiver zerado, exportam relatorio zerado/sem dados, sem linhas historicas antigas.

## Como testar com banco zerado

1. Abrir `/dre`.
2. Conferir cards superiores em `R$ 0,00` e `0/12`.
3. Conferir fechamento mensal com todos os valores em `R$ 0,00`.
4. Conferir a mensagem `Sem dados financeiros para o período selecionado.`
5. Abrir `Ver ajustes manuais` e confirmar estado vazio.
6. Clicar `Importar Excel` e confirmar mensagem de funcionalidade nao configurada.
7. Exportar Excel/PDF e confirmar que nao ha valores antigos.
8. Executar `npm run lint`.
9. Executar `npm run build`.

## Validacao local

- `npm run lint`: passou.
- `npm run build`: passou.

Observacao: o build ainda emite avisos conhecidos de Recharts no prerender, sem falhar a compilacao.
