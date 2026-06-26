# GATE OS - COS Etapa 1 / Sprint 2 - Conversational Intelligence

## Escopo

Implementada a fundacao conversacional read-only do COS.

Esta sprint nao criou endpoint de escrita, nao alterou banco, nao alterou Supabase, nao alterou Auth, Login, Usuarios, Sessao, RLS, Dashboard, DRE, Financeiro, Contratos, Clientes ou Equipamentos fora do fluxo de leitura do COS.

## Arquivos alterados

- `app/api/cos/route.ts`
- `lib/cos/cos-router.ts`
- `lib/cos/read-only-router.ts`
- `lib/cos/read-only-tools.ts`

## Arquivos criados

- `lib/cos/read-only-context.ts`
- `lib/cos/read-only-response-composer.ts`
- `GATE_OS_COS_STAGE_1_SPRINT_2_CONVERSATIONAL_INTELLIGENCE_REPORT.md`

## Arquitetura implementada

- Context Engine read-only em memoria de processo, separado por `user.id`.
- Resolution Engine para selecionar candidato pendente por numero ou nome.
- Response Composer para organizar respostas com resumo, dados, alertas, contexto e sugestoes.
- Navigation Skills para navegar entre cliente, contratos, equipamentos, financeiro, documentos, DRE e dashboard usando contexto ativo.
- Operational Memory temporaria com cliente ativo, foco ativo, periodo e resolucao pendente.
- Ambiguity Resolver para clientes com multiplos resultados.
- Context Reset por comandos como `Limpar contexto`, `Comecar nova analise` e `Nova consulta`.

## Context Engine

O contexto operacional fica em memoria local do runtime, usando `Map` em `read-only-context.ts`.

Ele guarda:

- cliente ativo;
- contrato ativo, preparado para fases futuras;
- equipamento ativo, preparado para fases futuras;
- periodo ativo, preparado para fases futuras;
- foco ativo;
- resolucao pendente;
- timestamp de atualizacao.

Regras:

- nao grava em banco;
- nao compartilha entre usuarios;
- expira apos janela de tempo;
- pode ser limpo pelo usuario;
- nao autoriza execucao.

## Resolution Engine

Quando uma busca de cliente retorna mais de um candidato, o COS responde com lista numerada e guarda a resolucao pendente.

Depois, o usuario pode responder com:

- numero da opcao;
- nome da opcao.

O contexto e atualizado automaticamente para o cliente escolhido.

## Response Composer

As respostas read-only agora podem incluir:

- titulo;
- resumo;
- dados encontrados;
- alertas;
- contexto atual;
- sugestoes de proximos passos.

Exemplos de sugestoes apos cliente:

- ver contratos;
- ver equipamentos;
- ver financeiro;
- ver documentos;
- ver DRE;
- ver dashboard;
- ver diagnostico.

## Navigation Skills

O router entende referencias contextuais como:

- `Agora contratos`;
- `Agora ativos`;
- `Agora equipamentos`;
- `Agora financeiro`;
- `Agora documentos`;
- `Agora DRE`;
- `Agora dashboard`;
- `Agora maio`.

Quando ha cliente ativo, as buscas de contrato, financeiro e documentos usam esse contexto para filtrar resultados quando os registros possuem `client_id`.

## Operational Memory

A memoria operacional e temporaria e read-only.

Ela e usada somente para:

- interpretar referencias curtas;
- manter foco da conversa;
- conduzir proximos passos;
- resolver ambiguidades.

Ela nunca:

- persiste dados;
- altera registros;
- executa acoes;
- grava logs operacionais;
- compartilha contexto entre usuarios.

## Ambiguity Resolver

Implementado para cliente.

Se uma busca como `Fribal` retornar varios clientes, o COS pergunta qual deve analisar e aguarda escolha.

Limitacao atual:

- ambiguidades de contrato, equipamento e financeiro ainda precisam de refinamento nas proximas sprints.

## Guardrails preservados

Os bloqueios da Sprint 1 permanecem ativos antes das capacidades read-only.

Pedidos como:

- cadastrar cliente;
- criar contrato;
- anexar documento;
- fechar mes;
- corrigir DRE;
- baixar pagamento;

continuam bloqueados no fluxo textual da Etapa 1.

## Consultas read-only mantidas

- clientes;
- contratos;
- equipamentos;
- financeiro;
- documentos;
- banco x financeiro;
- DRE x financeiro;
- checklist conceitual de fechamento;
- explicacoes de sistema.

## Validacao executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

Tambem foi verificado por busca textual que os novos arquivos da sprint nao chamam:

- `insertRow`;
- `updateRows`;
- `deleteRows`;
- `uploadDocument`;
- `fetch`;
- `.insert()`;
- `.update()`;
- `.delete()`;
- `.upsert()`.

## Testes manuais esperados

Fluxo 1:

```text
Procure a Fribal
Agora contratos
Agora ativos
Agora equipamentos
Agora financeiro
Agora documentos
Agora DRE
Agora dashboard
```

Fluxo 2:

```text
Procure Estacio
Agora contratos
Agora apenas vencidos
Agora financeiro
Agora maio
Agora explique a DRE
```

Fluxo 3:

```text
Fribal
Selecionar um candidato
Agora contratos
```

Fluxo 4:

```text
Limpar contexto
Pesquisar outro cliente
```

## Limitacoes

- Contexto e memoria em processo; pode ser perdido em restart/serverless cold start.
- Ambiguidade estruturada esta implementada inicialmente para cliente.
- Nao ha UI dedicada de selecao de candidatos.
- Filtro contextual depende de registros possuirem `client_id`.
- `Agora DRE` ainda usa diagnostico DRE geral, com contexto exibido.
- Documentos usam busca inicial simples.
- Juridico e socios seguem para proxima expansao conversacional.

## Proximos passos

1. Expandir Resolution Engine para contratos, equipamentos, financeiro e documentos.
2. Criar periodo ativo real a partir de frases como `maio de 2026`.
3. Criar Navigation Skills especificas para juridico e socios.
4. Aprofundar resposta de cliente com saude operacional consolidada.
5. Criar testes automatizados do Context Engine e do Guardrail.
6. Avaliar persistencia local de contexto no frontend se a memoria em processo for insuficiente.

## Parecer

A Sprint 2 transforma o COS read-only de perguntas isoladas para conversa com memoria operacional. Ele passa a manter cliente/foco ativo, resolver ambiguidades iniciais, navegar entre modulos e conduzir a conversa com sugestoes, preservando integralmente a regra de nao alterar dados na Etapa 1.

