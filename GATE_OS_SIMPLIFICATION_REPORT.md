# GATE OS - Relatorio de simplificacao operacional

Data: 2026-06-09

## Objetivo

Simplificar cadastros internos, reduzir campos obrigatorios e alinhar payloads com o Supabase para evitar envio de colunas inexistentes.

## Correcao imediata

Erro corrigido:

`financial_entries: Could not find the 'bank_account_name' column`

O modal financeiro nao envia mais `bank_account_name`, `dre_category_name`, `cost_center_name`, `party_name`, `recurrence` ou `tags`.

Agora o lancamento salva payload minimo:

- `type`
- `status`
- `description`
- `value`
- `amount`
- `competence_date`
- `due_date`
- `payment_date`
- `dre_category_id`
- `bank_account_id`
- `client_id`
- `payment_method`
- `attachment_type`

## Protecao de schema

Foi adicionada allowlist por tabela em `lib/data/supabase-helpers.ts`. Inserts e updates passam a descartar campos que nao pertencem ao conjunto conhecido da tabela antes de chamar o Supabase.

Isso reduz risco de `PGRST204` sem mascarar erros reais de permissao, RLS, tipo invalido ou constraint.

## Modais simplificados

### Financeiro

Mantido:

- Tipo
- Descricao
- Valor
- Data de vencimento
- Data de pagamento opcional
- Categoria DRE
- Conta bancaria
- Cliente opcional
- Forma de pagamento opcional
- Anexo opcional

Removido:

- Competencia manual
- Centro de custo
- Recorrencia
- Tags
- Status manual
- Fornecedor texto sem coluna confirmada

### Clientes

Mantido:

- Nome / razao social
- Tipo PF/PJ
- CPF/CNPJ opcional
- E-mail
- Telefone/WhatsApp
- Cidade
- Status
- Observacoes

Removido:

- Razao social duplicada
- Nome fantasia duplicado
- Endereco completo obrigatorio
- CEP, numero, complemento, bairro, estado como cadastro inicial

### Contratos

Mantido:

- Cliente
- Tipo
- Status
- Data inicial
- Data final opcional
- Data de vencimento convertida para `due_day`
- Valor mensal
- Anexos opcionais

Automatico:

- Numero do contrato
- Token publico
- Data de criacao pelo banco

Removido do payload:

- `installments_count`
- `payment_method`
- `notes`

### Equipamentos

Mantido:

- Nome
- Categoria
- Status
- Quantidade total
- Observacoes

Removido:

- Modelo
- Numero de serie
- Quantidades manuais derivadas
- Valor de compra/venda/locacao
- Campos patrimoniais manuais

### Patrimonio

Sem novo cadastro manual. A tela permanece como visao/resumo e o botao direciona para Equipamentos.

### Manutencoes

Mantido:

- Cliente
- Contrato opcional
- Equipamento
- Tipo
- Status
- Prioridade
- Descricao
- Data prevista opcional

Removido:

- Numero de ticket manual
- Diagnostico
- Solucao
- Custo
- Tecnico
- Anexos no cadastro inicial

### Juridico

Mantido:

- Cliente
- Contrato opcional
- Status
- Etapa
- Risco
- Prazo opcional
- Descricao/resumo

Removido do cadastro inicial:

- Desconto
- Honorarios
- Custas
- Valor negociado
- Parcelamento
- Quantidade de parcelas
- Entrada
- Forma de pagamento
- Campos financeiros complexos

### Socios

Lancamento simplificado para:

- Socio
- Tipo
- Valor
- Data
- Descricao
- Status

Observacao: edicao cadastral de socio ainda depende de fluxo real para `partners`.

### Documentos

Upload simplificado para:

- Arquivo
- Tipo do documento
- Cliente opcional
- Contrato opcional
- Observacao opcional

Lista mockada inicial removida. A tela carrega `documents` do Supabase.

## SQL manual criado

Arquivo:

`supabase/gate-os-simplification-required-sql.sql`

Nao foi executado. Usar apenas se a validacao manual confirmar ausencia de colunas essenciais como:

- `financial_entries.bank_account_id`
- `financial_entries.dre_category_id`
- `financial_entries.client_id`
- `documents.client_id`
- `documents.contract_id`
- `partner_entries.date`
- `partner_entries.description`
- `partner_entries.status`

## Testes recomendados

- Login valido e invalido.
- Criar cliente com somente nome e status.
- Criar contrato com cliente, tipo, status, inicio, vencimento e valor.
- Criar lancamento financeiro com conta e categoria por ID.
- Criar equipamento com nome, categoria, status e quantidade.
- Criar manutencao com cliente, equipamento, descricao e prioridade.
- Criar caso juridico simples.
- Fazer upload de documento com tipo e arquivo.
- Conferir Dashboard apos cadastros.

## Validacao local

Executar:

```bash
npm run lint
npm run build
```
