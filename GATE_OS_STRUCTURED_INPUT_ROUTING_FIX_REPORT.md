# GATE OS - Structured Input Routing Fix

## Escopo

Corrigido o roteamento do modo Structured Input do COS.

O objetivo foi garantir que mensagens com blocos operacionais e campos estruturados sejam tratadas como entrada estruturada antes de qualquer busca read-only.

Nao foram alterados:

- parser;
- IA;
- buscas read-only;
- guardrails;
- endpoints;
- banco;
- Supabase;
- Auth;
- RLS;
- regras de negocio.

## Arquivos alterados

- `lib/cos/structured-input-detector.ts`

## Causa raiz encontrada

O pipeline principal ja chamava `answerStructuredInput(message)` antes do Read Only Router em `lib/cos/cos-router.ts`.

O problema estava no detector.

O detector anterior dependia de criterios frageis de texto e possuia aliases acentuados com encoding inconsistente. Em alguns casos, entradas como:

```text
CLIENTE
Razao social: Lucas Tecnologia LTDA
CNPJ: 00.000.000/0001-00
```

ou:

```text
FINANCEIRO
Tipo: Receita
Descricao: Locacao ATIBAIA
Valor: R$ 3.697,33
Competencia: maio/2025
Vencimento: 27/05/2025
```

nao eram classificadas com seguranca como entrada estruturada e acabavam caindo no Read Only Router.

## Correcao aplicada

O detector foi recriado de forma deterministica e normalizada.

Agora ele reconhece:

- titulos de secao: `CLIENTE`, `CONTRATO`, `FINANCEIRO`, `EQUIPAMENTOS`, `DOCUMENTO`, `DRE`;
- titulos com ou sem `:`;
- campos estruturados por chave conhecida;
- mensagem com titulo operacional + campos;
- listas de equipamento com quantidade;
- texto normalizado sem depender de acentos.

## Fluxo corrigido

Mensagens estruturadas agora seguem obrigatoriamente:

```text
Detector
-> Structured Parser
-> Structured Preview
-> CTAs
```

Sem passar pelo Read Only Router.

## CTAs esperados

### Cliente

Entrada:

```text
CLIENTE
Razao social: Lucas Tecnologia LTDA
CNPJ: 00.000.000/0001-00
```

Resultado esperado:

- preview estruturado;
- entidade Cliente identificada;
- CTA `Cadastrar cliente`.

### Financeiro

Entrada:

```text
FINANCEIRO
Tipo: Receita
Descricao: Locacao ATIBAIA
Valor: R$ 3.697,33
Competencia: maio/2025
Vencimento: 27/05/2025
```

Resultado esperado:

- preview financeiro;
- CTA `Criar lancamento financeiro`.

## Validacao esperada

- `npm run lint`;
- `npm run build`.

## Observacoes

- A ordem de roteamento em `cos-router.ts` ja estava correta.
- O Header ja reconhecia `preview.kind === "structured_input"`.
- A correcao foi limitada ao detector para restaurar a decisao de entrada no fluxo Structured Input.

## Parecer

O modo Structured Input estava implementado, mas o classificador de entrada nao estava robusto o suficiente. Com o detector normalizado, blocos operacionais deixam de cair em busca de cliente/financeiro e passam a gerar preview estruturado com CTAs.
