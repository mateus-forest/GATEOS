# GATE OS - Operational Fixes Finance, DRE and Clients

## Escopo

Corrigidos problemas operacionais em Financeiro, DRE e Clientes apos retomada do cadastro manual.

Nao foram alterados:

- COS;
- Auth;
- Login;
- Sessao;
- RLS;
- Supabase policies;
- DRE historica;
- Dashboard;
- regras globais de negocio;
- endpoints;
- dados vinculados.

## Arquivos alterados

- `components/financeiro-content.tsx`
- `components/dre-content.tsx`
- `components/clientes-content.tsx`
- `lib/data/clients.ts`
- `lib/data/display-labels.ts`

## 1. Selects financeiros com UUID

### Causa raiz

O formulario financeiro usava IDs como `value` dos selects, mas o trigger do select podia exibir o valor selecionado em vez do texto amigavel.

Tambem havia aliases incompletos nos helpers de label para alguns formatos reais de dados.

### Antes

- Categoria DRE podia exibir UUID.
- Conta bancaria podia exibir UUID.
- Cliente/fornecedor podia exibir UUID.

### Depois

- O `value` interno continua sendo ID.
- O trigger do select exibe o label amigavel calculado.
- `dreCategoryLabel`, `bankAccountLabel` e `clientLabel` foram reforcados com aliases usados no sistema.

Labels esperados:

- Categoria DRE: nome/categoria/grupo.
- Conta bancaria: nome, banco e numero quando existirem.
- Cliente/fornecedor: razao social, nome fantasia, nome ou email.

## 2. Recorrencia/parcelamento financeiro

### Causa raiz

A tela ja tinha controles de recorrencia, mas o banco/fluxo atual ainda nao possui suporte seguro para gerar recorrencia real em `financial_entries`.

### Antes

- A opcao de recorrencia podia levar a tentativa confusa de salvar um fluxo ainda nao suportado.

### Depois

- `Nao se repete` continua salvando um lancamento individual.
- `Mais de uma vez` valida periodicidade e quantidade maior que 1, mas bloqueia submit com mensagem clara.
- `Sempre` valida periodicidade, mas bloqueia submit com mensagem clara.
- Nenhum payload recorrente incompleto e enviado.

Mensagens:

```text
Parcelamento/recorrencia ainda nao esta habilitado para gravacao nesta versao. Use Nao se repete para criar um lancamento individual.
```

```text
Recorrencia continua ainda nao esta habilitada nesta versao.
```

## 3. Ajuste manual da DRE sem motivo

### Causa raiz

`dre_manual_adjustments.reason` e obrigatorio no banco, mas o front permitia enviar ajuste com motivo vazio.

### Antes

- Supabase retornava erro de constraint:

```text
null value in column "reason" of relation "dre_manual_adjustments" violates not-null constraint
```

### Depois

- O front bloqueia antes de chamar Supabase.
- Exibe mensagem:

```text
Informe o motivo do ajuste.
```

- O payload enviado usa `reason` preenchido e trimado.
- Novo valor, responsavel e categoria permanecem no fluxo atual.

## 4. Clientes - Excluir/Inativar

### Causa raiz

O menu de tres pontinhos do cliente nao tinha opcao de exclusao/inativacao.

### Auditoria

Nao foi encontrado endpoint/action dedicado de delete cliente.

Existe update seguro em `clients`, e a tabela possui `status`, incluindo `inativo`.

### Correcao aplicada

Foi adicionada a opcao:

```text
Excluir cliente
```

Por seguranca, ela nao executa DELETE fisico.

Fluxo:

1. Checa vinculos do cliente em:
   - `contracts`;
   - `financial_entries`;
   - `documents`;
   - `legal_cases`.
2. Se houver vinculos, bloqueia a acao e explica.
3. Se nao houver vinculos, pede confirmacao.
4. Ao confirmar, atualiza `clients.status = inativo`.

Mensagem de bloqueio:

```text
Cliente possui vinculos e nao pode ser excluido.
```

Nenhum contrato, financeiro, documento ou caso juridico e apagado.

## Validacao executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

## Testes manuais esperados

1. Abrir modal de lancamento financeiro.
2. Confirmar que Categoria DRE mostra nome amigavel.
3. Confirmar que Conta bancaria mostra nome amigavel.
4. Confirmar que Cliente/fornecedor mostra nome amigavel.
5. Selecionar `Nao se repete` e salvar lancamento individual.
6. Selecionar `Mais de uma vez` e confirmar bloqueio claro.
7. Abrir ajuste manual DRE.
8. Tentar salvar sem motivo e confirmar bloqueio no front.
9. Preencher motivo e salvar.
10. Abrir menu tres pontinhos de cliente.
11. Confirmar opcao `Excluir cliente`.
12. Cliente com vinculos deve bloquear exclusao destrutiva.
13. Cliente sem vinculos deve ser inativado, nao deletado fisicamente.

## Observacoes

- A acao de cliente foi implementada como inativacao segura, nao delete fisico.
- A checagem de vinculos evita exclusao destrutiva.
- Recorrencia financeira permanece preparada na UI, mas bloqueada para gravacao recorrente ate existir suporte oficial de banco/regra.

## Parecer

As correcoes restauram operacao manual segura: selects financeiros exibem nomes, DRE nao envia ajuste invalido e clientes passam a ter acao segura de exclusao/inativacao sem destruir dados relacionados.
