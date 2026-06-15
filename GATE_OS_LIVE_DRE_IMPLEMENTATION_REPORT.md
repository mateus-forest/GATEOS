# GATE OS - DRE operacional viva

Data: 2026-06-14

## Objetivo

Transformar a DRE em uma visao operacional calculada pelo GATE OS, mantendo importacoes de planilha como historico/base inicial e nao como fonte principal permanente.

## Fontes usadas

- `clients`: cria linhas vivas de receita por cliente.
- `contracts`: alimenta receita prevista por `monthly_value` nos meses de vigencia.
- `financial_entries`: alimenta receitas realizadas e despesas por `competence_date` e `dre_category_id`.
- `partner_entries`: alimenta distribuicoes, participacoes, aportes, devolucoes e fixo mensal.
- `bank_accounts`: alimenta saldo banco por `current_balance`.
- `dre_manual_adjustments`: complementa a DRE operacional.
- `dre_monthly_closings`: alimenta saldo anterior e fechamento mensal.
- `dre_imports` e `dre_import_rows`: guardam historico fiel da planilha importada.

## Regras de calculo

- A visao padrao agora e `DRE operacional`.
- `Historico importado` fica disponivel em seletor separado quando existir snapshot salvo.
- Clientes aparecem em Receitas mesmo sem contrato ou lancamento.
- Contratos ativos entram como receita prevista no periodo entre `start_date` e `end_date`.
- Receitas de `financial_entries` entram como receita realizada.
- Para evitar duplicidade, quando uma receita realizada estiver vinculada ao mesmo `contract_id` e mes, ela substitui a receita prevista daquele contrato naquele mes.
- Despesas de `financial_entries` entram na categoria DRE vinculada; sem categoria, caem em `Outras despesas`.

## Socios

- `distribuicao_lucro` -> Distribuicao Lucros - Socios.
- `participacao_resultado` -> Participacao Resultado.
- `aporte` -> Aportes de Socios.
- `devolucao` -> Devolucao de Emprestimos.
- `fixo_mensal` -> Outros Custos com Socios.

## Banco

- `bank_accounts.current_balance` alimenta `SALDO BANCO`.
- Se nao houver conta bancaria, saldo banco fica R$ 0,00.
- `dre_monthly_closings` alimenta saldo anterior quando existir fechamento previo.

## Importacao

- Importar Excel continua salvando snapshot fiel em `dre_imports` e `dre_import_rows`.
- A importacao tambem cria categorias DRE e ajustes manuais apenas para linhas operacionais de conta, ignorando totais, percentuais e resultados como ajuste operacional.
- Apos importar, a visao permanece em `DRE operacional`.
- O usuario pode alternar para `Historico importado` para consultar/exportar a planilha preservada.

## Exportacao

- Exportar Excel/PDF usa a visao selecionada.
- Se a visao for `DRE operacional`, exporta a DRE calculada pelo sistema.
- Se a visao for `Historico importado`, exporta o snapshot da planilha.

## Limpeza

- `Limpar importacao` apaga snapshots de `dre_imports/dre_import_rows` e ajustes de importacao, sem tocar em clientes, contratos, financeiro ou categorias.
- `Zerar DRE manual` apaga apenas `dre_manual_adjustments` e preserva importacoes historicas.

## Pendencias reais

- Executar manualmente `supabase/gate-os-dre-imported-snapshots.sql` no Supabase, se ainda nao foi aplicado.
- Reabertura de mes permanece como integracao futura ate existir fluxo real aprovado.
- Separacao visual completa entre receita prevista e realizada pode ser refinada em uma etapa futura; a regra atual substitui previsto por realizado quando o lancamento esta vinculado ao contrato.

## Como testar

- Banco zerado: abrir DRE e confirmar estado vazio/zerado.
- Criar cliente: confirmar linha zerada em Receitas.
- Criar contrato ativo: confirmar `monthly_value` nos meses de vigencia.
- Criar receita realizada vinculada ao contrato: confirmar que substitui o previsto no mesmo mes.
- Criar despesa com categoria DRE: confirmar linha correspondente.
- Criar lancamento de socio: confirmar linha correspondente.
- Cadastrar conta bancaria: confirmar saldo banco.
- Importar planilha: confirmar que a DRE operacional continua padrao e o historico fica no seletor.
- Exportar DRE operacional e historico importado.
- Executar `npm run lint` e `npm run build`.
