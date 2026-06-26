# GATE OS - Financial Recurrence Form

## Escopo

Adicionada a secao visual de recorrencia/parcelamento no modal de novo lancamento financeiro.

A alteracao foi focada no formulario financeiro e nao mexeu em:

- COS;
- Dashboard;
- DRE;
- banco;
- Supabase;
- Auth;
- RLS;
- Login;
- Sessao;
- regras de negocio globais;
- endpoints;
- policies.

## Arquivos alterados

- `components/financeiro-content.tsx`

## Banco e suporte atual

Foi auditado o fluxo atual de criacao financeira.

O financeiro hoje cria lancamentos em:

- `financial_entries`

Helper atual:

- `createFinancialEntry()` em `lib/data/financial.ts`

Campos confirmados no fluxo atual:

- `type`;
- `status`;
- `description`;
- `value`;
- `competence_date`;
- `due_date`;
- `payment_date`;
- `bank_account_id`;
- `dre_category_id`;
- `client_id`;
- `payment_method`;
- `attachment_type`.

Nao foi encontrado suporte direto em `financial_entries` para:

- `recurrence_type`;
- `recurrence_interval`;
- `recurrence_count`;
- `recurrence_group_id`;
- `installment_number`;
- `installment_total`.

Tambem existe tabela `installments`, mas ela e usada para parcelas de contratos, nao para recorrencia livre de lancamentos financeiros.

## Comportamento implementado

Foi adicionada a secao:

```text
Repetir
[Nao se repete] [Mais de uma vez] [Sempre]
```

### Nao se repete

- Mantem o comportamento atual.
- Cria um unico lancamento em `financial_entries`.
- Nao envia campos novos para o banco.

### Mais de uma vez

Mostra:

- periodicidade;
- quantidade de vezes.

Periodicidades disponiveis:

- Mensal;
- Semanal;
- Quinzenal;
- Bimestral;
- Trimestral;
- Semestral;
- Anual.

Validacao:

- periodicidade obrigatoria;
- quantidade deve ser numero inteiro maior que 1.

Execucao:

- bloqueada nesta versao, porque o banco/fluxo atual ainda nao possui suporte seguro para gerar multiplos lancamentos financeiros recorrentes.

Mensagem:

```text
Parcelamento/recorrencia ainda nao esta habilitado para gravacao nesta versao. Use Nao se repete para criar um lancamento individual.
```

### Sempre

Mostra:

- periodicidade.

Validacao:

- periodicidade obrigatoria.

Execucao:

- bloqueada nesta versao.

Mensagem:

```text
Recorrencia continua ainda nao esta habilitada nesta versao.
```

## Limitacoes

- Nao foram criados campos novos no banco.
- Nao foi criada migration.
- Nao foram gerados multiplos lancamentos.
- Nao foi criada recorrencia infinita.
- Nao foi alterado o fluxo de DRE.
- O formulario de edicao financeira nao foi encontrado como fluxo dedicado nesta etapa; a alteracao foi aplicada ao modal de novo lancamento.

## Validacao esperada

- `npm run lint`;
- `npm run build`.

## Testes manuais esperados

1. Abrir o modal de novo lancamento financeiro.
2. Confirmar que `Nao se repete` aparece selecionado por padrao.
3. Salvar um lancamento normal e confirmar que o comportamento antigo continua funcionando.
4. Selecionar `Mais de uma vez`.
5. Confirmar que periodicidade e quantidade aparecem.
6. Selecionar `Mensal` e `12` vezes.
7. Tentar salvar e confirmar bloqueio claro, sem criar multiplos lancamentos.
8. Selecionar `Sempre`.
9. Confirmar que periodicidade aparece e quantidade some.
10. Tentar salvar e confirmar bloqueio claro.
11. Confirmar que selects/dropdowns continuam abrindo com o fix global de z-index.

## Proximos passos

Para habilitar recorrencia real no futuro, sera necessario definir uma estrutura segura, por exemplo:

- `recurrence_type`;
- `recurrence_interval`;
- `recurrence_count`;
- `recurrence_group_id`;
- `installment_number`;
- `installment_total`.

Depois disso, implementar geracao transacional/idempotente de lancamentos futuros, com preview e confirmacao.

## Parecer

A tela agora possui os controles operacionais de recorrencia no padrao solicitado, sem inventar persistencia inexistente.

Lancamentos individuais continuam funcionando. Recorrencia fixa e recorrencia continua ficam preparadas visualmente, validadas e bloqueadas com mensagem clara ate o banco e a regra de negocio suportarem a execucao com seguranca.
