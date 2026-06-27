# GATE OS - Finance Recurrence and Client Actions Fix

## Escopo

Corrigida a recorrencia fixa do lancamento financeiro e ajustada a acao segura de excluir/inativar cliente.

Nao foram alterados:

- COS;
- Auth;
- Login;
- Sessao;
- RLS;
- Supabase policies;
- DRE historica;
- contratos;
- documentos;
- juridico vinculado;
- dados relacionados em cascata.

## Arquivos alterados

- `components/financeiro-content.tsx`
- `components/clientes-content.tsx`

## Financeiro - Mais de uma vez

### Antes

Ao selecionar `Mais de uma vez`, o formulario bloqueava a gravacao com a mensagem:

```text
Parcelamento/recorrencia ainda nao esta habilitado...
```

### Depois

`Mais de uma vez` cria lancamentos individuais em `financial_entries`.

Exemplo:

```text
Periodicidade: Mensal
Por: 9 vezes
```

Resultado:

- 9 lancamentos individuais;
- descricao com sufixo `1/9`, `2/9`, `3/9`;
- valor preservado;
- tipo preservado;
- categoria DRE preservada;
- conta bancaria preservada;
- cliente/fornecedor preservado;
- forma de pagamento preservada;
- anexo replicado para cada lancamento, quando arquivo for informado;
- datas calculadas a partir da data de vencimento.

### Periodicidades suportadas

- Semanal: +7 dias;
- Quinzenal: +15 dias;
- Mensal: +1 mes;
- Bimestral: +2 meses;
- Trimestral: +3 meses;
- Semestral: +6 meses;
- Anual: +12 meses.

### Regras mantidas

- `Nao se repete` cria apenas 1 lancamento.
- `Sempre` continua bloqueado.
- Quantidade precisa ser inteiro maior que 1.
- Periodicidade e obrigatoria quando repetir.

## Clientes - Excluir/Inativar

### Antes

Quando o cliente tinha vinculos, a acao bloqueava e parava. Isso deixava a impressao de que nada acontecia alem do toast.

### Depois

A acao continua sem DELETE fisico.

Fluxo atual:

1. Verifica vinculos reais em:
   - `contracts`;
   - `financial_entries`;
   - `documents`;
   - `legal_cases`.
2. Se houver vinculos, informa que nao pode excluir fisicamente e pergunta se deseja inativar.
3. Se nao houver vinculos, pede confirmacao para inativar.
4. Atualiza `clients.status = inativo`.
5. Recarrega a lista.
6. Mostra toast real de sucesso ou erro.

Nenhum contrato, financeiro, documento ou caso juridico e apagado.

## Validacao executada

- `npm run lint`;
- `npm run build`.

## Testes manuais esperados

1. Criar ganho `Nao se repete`: deve criar 1 lancamento.
2. Criar ganho `Mais de uma vez`, mensal, 9 vezes: deve criar 9 lancamentos.
3. Conferir datas futuras.
4. Conferir categoria, conta, cliente, forma de pagamento e valor.
5. Selecionar `Sempre`: deve continuar bloqueado.
6. Cliente com vinculos: nao excluir fisicamente; permitir inativacao com aviso.
7. Cliente sem vinculos: inativar apos confirmacao.
8. A lista deve atualizar e o cliente deve aparecer como inativo ou sair do filtro de ativos.

## Observacoes

- A recorrencia fixa foi implementada como multiplos inserts individuais, nao como recorrencia infinita.
- Ainda nao foi criada entidade de grupo recorrente.
- O comportamento e simples e operacional, preservando o fluxo existente do financeiro.
- A acao de cliente permanece segura: inativa, nao apaga fisicamente.

## Parecer

O financeiro agora suporta parcelamento/recorrencia fixa operacional para criacao manual. A acao de cliente deixa de parecer sem efeito e passa a inativar com seguranca, mesmo quando ha vinculos que impedem exclusao fisica.
