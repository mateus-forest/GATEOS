# GATE OS - Correcao de cadastro de contrato

Data: 2026-06-15

## Onde o contract_number era gerado

O numero era gerado em `components/contratos-content.tsx` pelo modal `Novo Contrato`, usando cliente e data:

`GATE-[CLIENTE]-[YYYYMMDD]`

Esse formato podia colidir quando mais de um contrato era criado para o mesmo cliente no mesmo dia.

## Nova regra de geracao

O frontend agora gera o formato inicial:

`GATE-[CLIENTE_SLUG]-[YYYYMMDD]-001`

Exemplo:

- `GATE-MIUGUI-20260615-001`
- `GATE-MIUGUI-20260615-002`

O helper `createContract` em `lib/data/contracts.ts` consulta os contratos existentes antes do insert e sobe o sequencial automaticamente.

## Tratamento de colisao

- A constraint `contracts_contract_number_key` foi preservada.
- Antes do insert, o sistema calcula o proximo sequencial disponivel.
- Se ainda assim o Supabase retornar duplicidade (`23505`), o helper tenta uma nova geracao uma vez.
- Se falhar novamente, a UI mostra mensagem amigavel e mantém o erro técnico no console.

Mensagem amigavel:

`Ja existe um contrato com esse numero. Gere novamente ou tente salvar outra vez.`

## Selects corrigidos

- Cliente:
  - `value = clients.id`
  - label usa `name`, `legal_name`, `company_name`, `email`
  - fallback: `Cliente sem nome`
- Equipamento:
  - `value = equipment.id`
  - label usa `name`, `category`
  - fallback: `Equipamento sem nome`
- Labels agora ignoram valores com formato UUID para evitar exibicao tecnica ao usuario final.

## Fluxo contrato/equipamento/estoque/parcelas

Ao salvar contrato:

1. Cria `contracts` com `contract_number` unico.
2. Gera parcelas mensais em `installments` com `status = aberta`.
3. Cria vinculos em `contract_equipment`.
4. Recalcula estoque do equipamento usando `quantity_total`, `quantity_available` e `quantity_rented`.
5. Recarrega contratos/equipamentos do Supabase.

Se falhar antes de concluir parcelas, vinculos e estoque, o sistema tenta rollback logico apagando o contrato criado. Se o rollback falhar por constraint/policy, o erro fica registrado no console.

## Arquivos alterados

- `components/contratos-content.tsx`
- `lib/data/contracts.ts`
- `lib/data/display-labels.ts`
- `app/contratos/[id]/page.tsx`
- `GATE_OS_CONTRACT_CREATION_FIX_REPORT.md`

## Pendencias reais

- O rollback completo ideal deveria ser uma RPC/transacao no Supabase para contrato, equipamentos, estoque e parcelas.
- A confirmacao visual de numero regenerado automaticamente pode evoluir para mostrar o numero final no modal antes do fechamento.

## Como testar

- Criar cliente com nome simples.
- Criar equipamento com estoque disponivel.
- Abrir `Novo Contrato` e confirmar que Cliente e Equipamento exibem nomes, nao UUID.
- Criar 5 contratos seguidos para o mesmo cliente no mesmo dia.
- Confirmar sequenciais diferentes em `contract_number`.
- Confirmar reducao de estoque e aumento de locados.
- Confirmar parcelas geradas em `installments`.
- Confirmar listagem com nome de cliente amigavel.
- Confirmar Financeiro exibindo parcelas em contas a receber.
- Confirmar DRE sem receita realizada ate confirmar recebimento.
- Executar `npm run lint` e `npm run build`.
