# GATE OS - COS acoes isoladas seguras

Data: 2026-06-22

## Objetivo

Ativar a primeira camada segura de acoes do COS com revisao final e confirmacao explicita antes de qualquer gravacao.

## Acoes ativadas

- Cadastrar cliente.
- Criar lancamento financeiro individual.
- Anexar documento.

Permanecem bloqueados:

- cadastrar contrato;
- cadastrar equipamentos;
- criar parcelas recorrentes;
- criar em massa;
- editar registros;
- excluir registros;
- confirmar tudo.

## Fluxo implementado

1. Usuario envia arquivo ao COS.
2. COS extrai dados e mostra preview.
3. Usuario clica em um CTA isolado permitido.
4. Sistema abre modal de revisao final.
5. Usuario revisa os campos que serao gravados.
6. Usuario confirma explicitamente.
7. O endpoint da entidade correspondente grava no Supabase.
8. Sistema tenta registrar log em `cos_action_logs`.
9. Interface mostra sucesso ou erro real.

## Endpoints criados

- `POST /api/cos/actions/create-client`
- `POST /api/cos/actions/create-financial-entry`
- `POST /api/cos/actions/attach-document`

Cada endpoint:

- valida usuario autenticado;
- valida campos obrigatorios;
- grava somente uma entidade;
- retorna erro real;
- nao executa update, upsert, delete, truncate ou drop.

## Validacoes por acao

### Cadastrar cliente

- exige nome ou razao social;
- verifica duplicidade por CNPJ/CPF quando ha documento;
- exige confirmacao adicional quando nao ha CNPJ/CPF;
- nao atualiza cliente existente.

### Criar lancamento financeiro

- aceita apenas `receita` ou `despesa`;
- exige descricao;
- exige valor positivo;
- exige competencia ou vencimento;
- cria apenas um lancamento individual;
- nao cria recorrencia.

### Anexar documento

- exige arquivo original disponivel na sessao do COS;
- envia para o bucket `gate-documents`;
- cria registro em `documents`;
- nao vincula automaticamente a entidades sem revisao.

## Logs de auditoria

Foi criado/atualizado o SQL seguro:

- `supabase/gate-os-cos-action-logs.sql`

O SQL usa:

- `create table if not exists`;
- RLS habilitado;
- policies apenas para usuario autenticado dono do log;
- indices auxiliares.

O SQL nao foi executado automaticamente.

Se a tabela ainda nao estiver aplicada no Supabase, a acao pode ser executada e a interface informa que o log ficou pendente de tabela.

## Arquivos alterados

- `components/header.tsx`
- `lib/cos/cos-action-utils.ts`
- `app/api/cos/actions/create-client/route.ts`
- `app/api/cos/actions/create-financial-entry/route.ts`
- `app/api/cos/actions/attach-document/route.ts`
- `supabase/gate-os-cos-action-logs.sql`

## Regras preservadas

- Auth nao foi alterado.
- RLS existente nao foi alterado no banco.
- DRE, Dashboard, Contratos e Equipamentos nao foram alterados.
- Nao ha exclusao.
- Nao ha update.
- Nao ha upsert.
- Nao ha execucao em massa.
- Nao ha gravacao automatica sem confirmacao humana.

## Validacoes executadas

- `npm run lint`
- `npm run build`
- Build listou as tres novas rotas do COS como dinamicas.
- Varredura confirmou ausencia de `update`, `upsert`, `delete`, `DROP` e `TRUNCATE` nos arquivos do COS.

