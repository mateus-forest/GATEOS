# GATE OS - COS Etapa 1 / Sprint 5 - Operational Timeline & Relationship Graph

## Escopo

Implementada a fundacao do Relationship Graph Engine e da Operational Timeline do COS em modo 100% read-only.

Esta sprint nao criou endpoint de escrita, nao criou Server Action, nao alterou banco, nao alterou Supabase, nao alterou Auth, Login, Sessao, RLS, Dashboard, DRE, Financeiro, Contratos, Equipamentos ou UI existente.

## Arquivos alterados

- `lib/cos/read-only-capabilities.ts`
- `lib/cos/read-only-router.ts`

## Arquivos criados

- `lib/cos/read-only-relationship-graph.ts`
- `GATE_OS_COS_STAGE_1_SPRINT_5_OPERATIONAL_TIMELINE_RELATIONSHIP_GRAPH_REPORT.md`

## Relationship Graph Engine

Criado em `read-only-relationship-graph.ts`.

Responsavel por reconstruir relacionamentos operacionais entre:

- clientes;
- contratos;
- equipamentos;
- financeiro;
- documentos;
- juridico;
- manutencoes;
- DRE;
- dashboard.

O grafo utiliza somente consultas read-only com `selectCosRows`.

## Operational Timeline

A timeline operacional foi implementada para entidades principais:

- cliente;
- contrato;
- equipamento;
- financeiro.

Exemplos de eventos gerados:

- entidade principal localizada;
- contratos relacionados encontrados ou ausentes;
- equipamentos relacionados encontrados ou ausentes;
- financeiro relacionado encontrado ou ausente;
- documentos relacionados encontrados ou ausentes;
- DRE e Dashboard dependem dos lancamentos financeiros classificados por competencia;
- situacao atual calculada somente por leitura.

Quando algum passo esperado esta ausente, o COS informa no fluxo.

## Dependency Graph

O COS passa a explicar impactos por tipo de entidade.

### Cliente

Impacta:

- contratos;
- equipamentos via contratos;
- financeiro;
- documentos;
- juridico;
- DRE;
- dashboard.

### Contrato

Impacta:

- cliente;
- estoque;
- equipamentos;
- financeiro;
- DRE;
- dashboard;
- documentos;
- juridico.

### Equipamento

Impacta:

- estoque;
- contratos;
- manutencoes;
- patrimonio;
- financeiro quando vinculado a locacao.

### Financeiro

Impacta:

- cliente/contrato;
- banco;
- DRE;
- dashboard;
- fechamento.

## Related Records Engine

Sempre que uma entidade e encontrada, o COS tenta buscar automaticamente registros relacionados.

### Cliente

Busca:

- contratos;
- contract_equipment;
- equipamentos;
- financeiro;
- documentos;
- juridico;
- manutencoes relacionadas.

### Contrato

Busca:

- cliente;
- equipamentos;
- financeiro;
- documentos;
- juridico;
- manutencoes.

### Equipamento

Busca:

- contratos;
- clientes;
- financeiro indireto por contrato;
- documentos;
- manutencoes.

### Financeiro

Busca:

- cliente;
- contrato;
- documentos;
- categoria DRE.

## Entity Explorer

O COS agora monta um painel read-only por entidade.

Exemplo de cliente:

- nome;
- status;
- cidade;
- contratos totais e ativos;
- equipamentos vinculados;
- receita recorrente estimada;
- financeiro em aberto;
- documentos;
- juridico;
- manutencoes;
- pendencias de vinculo;
- Timeline Health.

## Timeline Composer

Toda timeline segue estrutura sequencial:

```text
Entidade principal
-> Contratos
-> Equipamentos
-> Financeiro
-> Documentos
-> DRE/Dashboard
-> Situacao atual
```

Quando um elo esta ausente, ele aparece como ausente em vez de ser inventado.

## Missing Link Detector

Implementado detector read-only de relacionamentos quebrados.

Detecta:

- contrato sem cliente;
- contrato ativo sem financeiro;
- contrato de locacao sem equipamento;
- financeiro sem cliente;
- receita sem contrato;
- financeiro sem categoria DRE;
- documento sem vinculo operacional.

Nada e corrigido automaticamente.

## Timeline Health

Cada grafo/timeline retorna uma classificacao:

- Fluxo completo nas relacoes verificadas;
- Fluxo incompleto;
- Fluxo inconsistente.

A classificacao considera vinculos essenciais ausentes.

## Router read-only

Nova capability:

- `relationship_graph`.

Exemplos roteados:

- `Mostre tudo relacionado`;
- `Agora timeline`;
- `Quem depende dele?`;
- `Mostre impactos`;
- `Quem utiliza este equipamento?`;
- `Qual contrato originou?`;
- `Onde aparece na DRE?`;
- `Mostre relacionamentos quebrados`;
- `Vinculos ausentes`.

## Guardrails preservados

Todos os bloqueios das Sprints anteriores permanecem ativos.

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
- executar em massa;
- criar vinculos;
- corrigir relacionamentos.

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
- `.upsert()`.

Nenhuma chamada proibida foi encontrada.

## Limitacoes

- O grafo usa heuristicas iniciais sobre chaves comuns como `client_id`, `contract_id`, `equipment_id` e `financial_entry_id`.
- DRE e Dashboard sao explicados como impactos derivados, nao como grafo completo de views.
- Socios ainda nao entram no grafo operacional detalhado.
- Timeline e baseada nos registros relacionados encontrados, nao em eventos historicos auditados.
- O Relationship Graph nao cria nem corrige vinculos ausentes.

## Proximos passos

1. Adicionar grafo detalhado para documentos, juridico e socios.
2. Criar timeline baseada em logs/auditoria quando existir fonte oficial.
3. Expandir grafo DRE/Dashboard com rastreio de views e categorias.
4. Integrar Relationship Graph aos diagnosticos para mostrar causa e impacto em uma unica resposta.
5. Criar testes automatizados para Missing Link Detector.
6. Expor navegação por grafo no contexto conversacional, mantendo read-only.

## Parecer

A Sprint 5 faz o COS enxergar a operacao como grafo, nao apenas como registros isolados.

Ele agora consegue explicar o que uma entidade afeta, quais registros dependem dela, quais vinculos estao ausentes e como a historia operacional se encadeia, preservando integralmente o modo read-only.
