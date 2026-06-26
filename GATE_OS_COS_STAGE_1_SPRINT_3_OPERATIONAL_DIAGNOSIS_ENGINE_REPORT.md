# GATE OS - COS Etapa 1 / Sprint 3 - Operational Diagnosis Engine

## Escopo

Implementada a primeira versao do Operational Diagnosis Engine do COS em modo 100% read-only.

Esta sprint nao criou endpoint de escrita, nao criou Server Action, nao alterou banco, nao alterou Supabase, nao alterou Auth, Login, Sessao, RLS, Dashboard, DRE, Financeiro, Contratos, Equipamentos, UI ou fluxo legado fora do roteamento read-only do COS.

## Arquivos alterados

- `lib/cos/read-only-capabilities.ts`
- `lib/cos/read-only-router.ts`

## Arquivos criados

- `lib/cos/read-only-diagnosis.ts`
- `GATE_OS_COS_STAGE_1_SPRINT_3_OPERATIONAL_DIAGNOSIS_ENGINE_REPORT.md`

## Engines implementadas

### Diagnosis Engine

Criada em `read-only-diagnosis.ts`.

Responsavel por:

- identificar dominio do problema;
- consultar dados em modo leitura;
- comparar fontes;
- encontrar divergencias;
- explicar origem provavel;
- classificar criticidade;
- sugerir proximo passo seguro;
- nunca executar correcao.

### Diagnosis Composer

Toda resposta de diagnostico segue padrao unico:

- problema;
- origem provavel;
- modulos envolvidos;
- impacto;
- criticidade;
- proximo passo recomendado;
- evidencias;
- timeline operacional, quando aplicavel.

### Cross Module Analysis

Foram adicionadas comparacoes read-only entre:

- Financeiro x DRE;
- Financeiro x Banco;
- Contratos x Financeiro;
- Contratos x Equipamentos;
- Equipamentos x Estoque;
- Dashboard x DRE/Financeiro;
- Fechamento x pendencias criticas.

## Diagnosis Skills

### FinancialDiagnosis

Detecta:

- lancamentos sem categoria DRE;
- lancamentos liquidados sem conta bancaria;
- receitas sem contrato;
- receitas sem cliente;
- possiveis duplicidades financeiras;
- competencias suspeitas.

### ContractDiagnosis

Detecta:

- contratos ativos sem financeiro;
- contratos vencidos ainda ativos;
- contratos de locacao sem equipamento;
- contratos possivelmente duplicados;
- contratos ativos sem documento.

### EquipmentDiagnosis

Detecta:

- estoque negativo ou locado acima do total;
- equipamentos locados sem contrato ativo correspondente;
- manutencao relevante frente ao total;
- equipamentos possivelmente duplicados;
- manutencoes abertas.

### DREDiagnosis

Detecta:

- diferenca Financeiro x DRE;
- lancamentos sem categoria;
- ajustes manuais;
- categorias sem movimento no periodo.

### DashboardDiagnosis

Investiga consistencia do Dashboard a partir das fontes operacionais disponiveis, principalmente DRE e Financeiro.

Quando nao ha indicador especifico, o COS declara a limitacao e pede o card/indicador para rastreio mais preciso.

### BankDiagnosis

Detecta:

- diferenca entre saldo bancario cadastrado e movimento financeiro liquidado;
- lancamentos liquidados sem conta bancaria;
- pagamentos/recebimentos sem data;
- candidatos provaveis da divergencia.

### ClosingDiagnosis

Gera checklist consolidado de fechamento com diagnosticos de:

- financeiro;
- contratos;
- equipamentos/estoque;
- banco;
- DRE;
- dashboard.

Nunca registra fechamento.

## Criticidade

Implementada classificacao:

- Baixa;
- Media;
- Alta;
- Critica.

As respostas sao ordenadas por criticidade, priorizando riscos criticos.

Exemplos:

- contrato ativo sem financeiro: Critica;
- banco diferente do financeiro: Critica;
- financeiro sem categoria DRE: Alta;
- contrato sem documento: Media;
- categoria DRE sem movimento: Baixa.

## Operational Health Score

Implementado resumo inicial de saude operacional.

Quando ha denominador simples e confiavel, o COS calcula score inicial para:

- contratos;
- financeiro;
- estoque.

Quando nao ha calculo confiavel nesta sprint, o COS declara:

```text
Health Score ainda nao disponivel para este modulo.
```

Clientes, Banco e DRE permanecem parcialmente explicativos nesta fase.

## Operational Timeline

Alguns diagnosticos ja retornam sequencia operacional.

Exemplos:

- Contrato ativo identificado;
- Financeiro vinculado ausente;
- DRE pode nao receber a receita;
- Dashboard pode refletir receita menor.

E tambem:

- Lancamento financeiro liquidado;
- Conta bancaria deveria ser vinculada;
- Saldo operacional e comparado ao saldo bancario;
- Diferenca bloqueia fechamento se nao explicada.

## Router read-only

O router agora reconhece intents como:

- `financial_diagnosis`;
- `contract_diagnosis`;
- `equipment_diagnosis`;
- `dashboard_diagnosis`;
- `bank_reconciliation_diagnosis`;
- `dre_diagnosis`;
- `monthly_closing_diagnosis`;
- `operational_health`.

Exemplos roteados:

- `Por que o banco nao bate?`
- `Por que a DRE caiu?`
- `Qual contrato nao gera receita?`
- `Quais contratos estao inconsistentes?`
- `Existe estoque negativo?`
- `O que impede fechar maio?`
- `Quais sao os maiores problemas operacionais hoje?`
- `O Dashboard esta consistente?`
- `O Financeiro esta consistente?`
- `Onde devo comecar a corrigir?`

## Guardrails preservados

Os bloqueios das Sprints 1 e 2 permanecem ativos.

Pedidos de escrita continuam bloqueados:

- cadastrar;
- criar;
- editar;
- excluir;
- anexar;
- fechar mes;
- corrigir DRE;
- baixar pagamento;
- executar em massa.

Fechamento continua sendo apenas diagnostico/checklist read-only.

## Validacao executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

Tambem foi executada busca textual nos arquivos novos/alterados da sprint para garantir ausencia de chamadas proibidas:

- `insertRow`;
- `updateRows`;
- `deleteRows`;
- `uploadDocument`;
- `.insert()`;
- `.update()`;
- `.delete()`;
- `.upsert()`;
- `fetch()`.

Nenhuma chamada proibida foi encontrada nos arquivos da sprint.

## Limitacoes

- Diagnosticos usam heuristicas iniciais sobre campos existentes.
- DashboardDiagnosis ainda depende de indicador/card especifico para rastreio completo.
- Health Score ainda e parcial e conservador.
- Resolution Engine de ambiguidades continua mais forte para clientes; contratos/equipamentos/financeiro podem ser refinados.
- Diagnosticos nao corrigem registros e nao geram logs operacionais em banco.
- Algumas tabelas opcionais podem nao existir em todos os ambientes; nesses casos o diagnostico usa as fontes disponiveis.

## Proximos passos

1. Aprofundar rastreio por indicador especifico do Dashboard.
2. Expandir timeline operacional por cliente/contrato.
3. Criar ranking de impacto financeiro por divergencia.
4. Criar testes automatizados para as Diagnosis Skills.
5. Refinar Health Score com denominadores oficiais por modulo.
6. Expandir diagnosticos para Juridico, Socios e Documentos.

## Parecer

A Sprint 3 muda o COS read-only de buscador/explicador para investigador operacional.

Ele agora consegue localizar origem provavel de inconsistencias, comparar modulos, classificar criticidade, sugerir proximos passos e consolidar riscos sem alterar nenhum dado.
