# GATE OS - COS Etapa 1 / Sprint 4 - Deep Search & Entity Resolution

## Escopo

Implementada a fundacao de Deep Search & Entity Resolution do COS em modo 100% read-only.

Esta sprint nao criou endpoint de escrita, nao criou Server Action, nao alterou banco, nao alterou Supabase, nao alterou Auth, Login, Sessao, RLS, policies, Dashboard, Financeiro, DRE, Contratos, Equipamentos, Clientes ou UI aprovada.

## Arquivos alterados

- `lib/cos/read-only-capabilities.ts`
- `lib/cos/read-only-context.ts`
- `lib/cos/read-only-router.ts`

## Arquivos criados

- `lib/cos/read-only-deep-search.ts`
- `lib/cos/read-only-period.ts`
- `GATE_OS_COS_STAGE_1_SPRINT_4_DEEP_SEARCH_ENTITY_RESOLUTION_REPORT.md`

## Deep Search Engine

Criado em `read-only-deep-search.ts`.

Responsavel por buscar registros reais em varios modulos:

- clientes;
- contratos;
- equipamentos;
- financeiro;
- documentos;
- juridico;
- socios.

A busca profunda permite:

- busca por termo;
- busca por documento;
- busca por status;
- busca por periodo ativo;
- busca por valor;
- busca com cliente ativo em contexto;
- busca com contrato/equipamento ativo em contexto;
- busca por entidade relacionada.

Quando uma busca generica como `Fribal` e recebida, o COS pode agrupar resultados por modulo em vez de assumir que se trata apenas de cliente.

## Entity Resolution Engine

A Resolution Engine foi ampliada alem de clientes.

Agora o Ambiguity State aceita:

- cliente;
- contrato;
- equipamento;
- financeiro;
- documento;
- juridico;
- socio;
- periodo.

Quando o usuario escolhe uma opcao numerada, o COS atualiza o contexto apropriado quando aplicavel:

- cliente ativo;
- contrato ativo;
- equipamento ativo;
- periodo ativo.

Para registros sem slot dedicado nesta sprint, como financeiro, documento, juridico e socio, o COS registra a selecao na conversa sem persistir dados.

## Candidate Ranking

Implementado ranking inicial de candidatos.

Critérios usados:

- match exato;
- documento igual;
- termo contido no nome/descricao;
- tokens semelhantes;
- status ativo;
- vinculo com cliente ativo;
- vinculo com contrato ativo;
- vinculo com equipamento ativo;
- periodo ativo;
- valor igual;
- filtro por status.

As respostas de ambiguidade exibem candidatos numerados e pedem escolha.

## Period Resolver

Criado em `read-only-period.ts`.

O COS passa a entender:

- maio;
- maio de 2026;
- este mes;
- mes passado;
- ultimos 30 dias;
- ultimos 90 dias;
- este ano;
- 2025;
- 2026;
- primeiro trimestre;
- segundo trimestre;
- trimestre atual.

Quando o mes aparece sem ano, o COS pergunta:

```text
Voce quis dizer maio de qual ano?
```

Ao selecionar o ano, o contexto read-only recebe o periodo ativo.

## Contextual Search

O contexto operacional foi ampliado para usar:

- cliente ativo;
- contrato ativo;
- equipamento ativo;
- periodo ativo;
- foco ativo.

Exemplos suportados:

```text
Fribal
Agora contratos
Agora ativos
Agora financeiro de maio
Agora documentos
```

Quando seguro, o COS aplica cliente ativo e periodo ativo nas buscas read-only.

## Search Response Composer

As respostas de busca profunda seguem formato agrupado:

```text
Encontrei resultados.

Agrupei por modulo:

Clientes:
1. ...

Contratos:
1. ...

Financeiro:
1. ...

Documentos:
1. ...
```

Quando nao ha resultado, o COS declara a incerteza:

```text
Nao encontrei registros com esse termo.
Busquei em clientes, contratos, financeiro, documentos, equipamentos, juridico e socios.
```

## Ambiguity State

O estado temporario de ambiguidade agora guarda:

- tipo da entidade;
- candidatos;
- prompt original;
- contexto atual;
- timestamp do contexto.

Nada e persistido em banco.

## Safe Unknown Handling

Quando a busca nao encontra registros, o COS nao inventa.

Ele informa onde buscou e sugere melhores chaves:

- CNPJ;
- numero do contrato;
- valor;
- status;
- periodo.

## Capacidades melhoradas

### Clientes

- nome;
- documento;
- razao social;
- fantasia;
- status;
- duplicidade provavel via ranking.

### Contratos

- cliente;
- numero;
- status;
- vencimento;
- periodo;
- contratos ativos;
- contratos vencidos;
- contratos vencendo.

### Equipamentos

- nome;
- categoria;
- status;
- serial;
- marca/modelo;
- disponibilidade contextual.

### Financeiro

- periodo;
- cliente ativo;
- contrato ativo;
- valor;
- status;
- receitas;
- despesas;
- vencidos;
- em aberto.

### Documentos

- cliente;
- contrato;
- tipo;
- nome;
- comprovante.

### Juridico

- cliente;
- contrato;
- processo;
- status;
- prazo;
- risco.

### Socios

- nome;
- periodo;
- distribuicao;
- lancamentos.

## Guardrails preservados

Todos os bloqueios das Sprints anteriores continuam ativos.

Continuam proibidos:

- cadastrar;
- criar;
- editar;
- excluir;
- anexar;
- baixar pagamento;
- fechar mes;
- ajustar DRE;
- movimentar estoque;
- executar em massa.

## Validacao executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

Tambem foi executada busca textual nos arquivos novos/alterados para confirmar ausencia de:

- `insertRow`;
- `updateRows`;
- `deleteRows`;
- `uploadDocument`;
- `.insert()`;
- `.update()`;
- `.delete()`;
- `.upsert()`;
- `fetch()`.

Nenhuma chamada proibida foi encontrada.

## Limitacoes

- Ranking ainda e heuristico e deve ser refinado com dados reais de uso.
- Periodos por trimestre e ultimos dias sao reconhecidos como range textual; nem todas as queries antigas filtram ranges compostos ainda.
- Financeiro, documento, juridico e socio ainda nao possuem slots completos de contexto ativo, apenas selecao operacional temporaria.
- A selecao de candidatos ainda ocorre via texto/numero, sem UI dedicada.
- Busca juridica e socios dependem da existencia das tabelas e campos esperados no ambiente.

## Proximos passos

1. Criar slots de contexto ativo para financeiro, documento, juridico e socio.
2. Aplicar range real em buscas por ultimos 30/90 dias e trimestres.
3. Aprofundar ranking por quantidade de relacionamentos.
4. Criar testes automatizados para Period Resolver e Candidate Ranking.
5. Integrar Deep Search aos diagnosticos para explicar melhor a entidade selecionada.
6. Criar rastreio por documento/contrato/financeiro com timeline operacional.

## Parecer

A Sprint 4 reduz o risco de o COS trabalhar com o registro errado.

O COS agora busca em varios modulos, ranqueia candidatos, pergunta quando ha ambiguidade, resolve periodos, usa contexto ativo e declara claramente quando nao encontra dados, preservando integralmente o modo read-only.
