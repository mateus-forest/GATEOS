# GATE OS - COS Runtime Architecture

## 1. Proposito

Este documento define a arquitetura oficial do Runtime do COS.

Os documentos anteriores definem:

- o que existe no sistema;
- o que o COS conhece;
- como o COS pensa;
- como a GATE funciona;
- quais capacidades o COS deve possuir.

Este documento define como a IA do COS deve funcionar internamente ao receber uma solicitacao do usuario.

O objetivo e separar responsabilidades em engines independentes, auditaveis e seguras. Apenas uma camada pode alterar dados: Execution Engine. Todas as demais interpretam, consultam, analisam, validam, decidem ou auditam.

## 2. Fluxo geral do Runtime

```text
Usuario
   |
   v
Intent Engine
   |
   v
Capability Engine
   |
   v
Skill Engine
   |
   v
Knowledge Engine
   |
   v
Context Engine
   |
   v
Validation Engine
   |
   v
Decision Engine
   |------------------.
   |                  |
   v                  v
Bloquear          Preview + Confirmacao
   |                  |
   v                  v
Resposta          Execution Engine
                      |
                      v
                 Audit Engine
                      |
                      v
              Resposta ao usuario
```

### Regra central

```text
Somente a Execution Engine pode alterar dados.
```

Nenhuma outra engine pode criar, editar, excluir, ajustar, fechar, anexar, baixar, atualizar, recalcular persistido ou modificar qualquer registro.

## 3. Contrato interno do Runtime

Toda solicitacao deve trafegar internamente como um envelope estruturado.

Modelo conceitual:

```json
{
  "requestId": "uuid",
  "userId": "uuid",
  "rawMessage": "texto original do usuario",
  "source": {
    "channel": "cos_chat",
    "attachments": [],
    "timestamp": "ISO-8601"
  },
  "intent": {},
  "capability": {},
  "context": {},
  "knowledge": {},
  "skills": [],
  "validation": {},
  "decision": {},
  "preview": {},
  "execution": {},
  "audit": {}
}
```

Este envelope permite rastrear:

- o que o usuario pediu;
- como o COS interpretou;
- qual capacidade foi ativada;
- quais dados reais foram consultados;
- quais validacoes foram feitas;
- por que decidiu executar ou bloquear;
- qual preview foi mostrado;
- qual confirmacao foi recebida;
- qual operacao foi executada;
- qual log foi gerado.

## 4. Intent Engine

### Responsabilidade

A Intent Engine compreende a intencao do usuario.

Ela responde:

- o usuario quer consultar?
- quer criar?
- quer editar?
- quer diagnosticar?
- quer conciliar?
- quer fechar mes?
- quer anexar documento?
- quer entender um indicador?
- esta continuando um contexto anterior?

### Entradas

- mensagem bruta do usuario;
- anexos;
- contexto conversacional atual;
- historico curto da conversa;
- idioma e sinonimos operacionais;
- sinais de acao, como "cadastre", "crie", "feche", "corrija", "explique", "por que".

### Saidas

Exemplo:

```json
{
  "intentName": "CreateClient",
  "intentType": "create",
  "confidence": "high",
  "entitiesMentioned": ["client"],
  "requiresContext": false,
  "rawEvidence": ["Cadastre este cliente"]
}
```

### Exemplos

```text
"Cadastre este cliente"
-> CreateClient

"Feche maio"
-> MonthlyClosing

"Por que o banco nao bate?"
-> BankReconciliationDiagnosis

"Anexe esse contrato no cliente"
-> AttachDocument

"Agora altera apenas o vencimento"
-> UpdateCurrentContextDueDate
```

### Regras

1. Nao executar nada.
2. Nao consultar banco diretamente, salvo se o projeto decidir permitir consulta leve para desambiguacao futura.
3. Nao inventar entidade.
4. Se a intencao estiver ambigua, marcar como `ambiguous`.
5. Se a mensagem tiver multiplas intencoes, separar em lista ordenada.
6. Se o usuario pedir acao proibida, ainda assim identificar a intencao, mas marcar como potencialmente bloqueada.

### Limitacoes

- Pode interpretar mal mensagens curtas.
- Pode precisar do Context Engine para entender continuidade.
- Nao decide se a acao pode executar.
- Nao valida regra de negocio.

## 5. Capability Engine

### Responsabilidade

A Capability Engine transforma a intencao em capacidade operacional.

Ela responde:

- qual capacidade do Capability Map corresponde a esta intencao?
- a capacidade existe?
- a capacidade pode executar hoje?
- a capacidade e leitura, diagnostico ou escrita?
- ha mais de uma capacidade envolvida?
- existe ambiguidade?

### Entradas

- intent estruturada;
- Capability Map;
- contexto ativo;
- fase atual do COS;
- permissoes funcionais da arquitetura.

### Saidas

Exemplo:

```json
{
  "capabilityName": "Contract Creation",
  "category": "Contratos",
  "criticality": "Critica",
  "canExecuteNow": false,
  "requiresFutureEndpoint": true,
  "requiresPreview": true,
  "confirmationType": "Bloqueado por fase"
}
```

### Catalogo de capacidades

A fonte oficial e `GATE_OS_COS_CAPABILITY_MAP.md`.

Exemplos:

- Client Search;
- Client Creation;
- Contract Creation;
- Equipment Availability Check;
- Financial Entry Creation;
- Bank Reconciliation Diagnosis;
- DRE Reconciliation;
- Monthly Closing Checklist;
- Document Attachment;
- Legal Risk Detection;
- Partner Distribution Analysis;
- Dashboard Indicator Explanation.

### Resolucao de ambiguidades

Se a intent for ambigua:

```text
"Atualize o cliente"
```

A engine deve perguntar:

- qual cliente?
- atualizar qual campo?
- isso e criacao ou edicao?

Se houver duas capacidades:

```text
"Cadastre o contrato e anexe o PDF"
```

Resolver como plano:

1. Contract Creation;
2. Document Attachment.

Mas executar apenas o que estiver permitido. Se contrato estiver bloqueado por fase, anexar documento tambem pode precisar aguardar destino real.

### Fallback

Quando nao encontrar capacidade:

- responder que a capacidade ainda nao esta mapeada;
- sugerir capacidade proxima;
- pedir reformulacao;
- nunca improvisar endpoint.

### Multiplas capacidades em uma conversa

O Capability Engine pode montar uma fila:

```json
{
  "capabilities": [
    "ResolveClient",
    "Contract Creation",
    "Document Attachment"
  ],
  "executionMode": "sequential_with_human_confirmation"
}
```

Cada capacidade precisa passar pelas engines seguintes separadamente.

## 6. Skill Engine

### Responsabilidade

A Skill Engine decompoe uma capacidade em pequenas skills reutilizaveis.

Uma capacidade nao deve ser implementada como um bloco monolitico. Ela deve ser composta de skills.

### Exemplos de skills

- `ResolveClient()`;
- `ResolveContract()`;
- `ResolveEquipment()`;
- `ValidateCNPJ()`;
- `ValidateDates()`;
- `ValidateMoney()`;
- `CheckDuplicateClient()`;
- `CheckDuplicateContract()`;
- `CheckEquipmentAvailability()`;
- `CalculateInstallments()`;
- `CalculateContractPeriod()`;
- `CompareBankBalance()`;
- `FindReconciliationCandidates()`;
- `ExplainDRE()`;
- `TraceDashboardIndicator()`;
- `GeneratePreview()`;
- `RequireConfirmation()`;
- `WriteAuditLog()`.

### Contrato de uma skill

Toda skill deve declarar:

```json
{
  "skillName": "ResolveClient",
  "objective": "Encontrar cliente real no sistema",
  "inputs": ["clientName", "documentNumber"],
  "outputs": ["clientCandidates", "selectedClient", "confidence"],
  "dependencies": ["clients"],
  "canMutateData": false,
  "reusableBy": ["Contract Creation", "Financial Entry Creation", "Document Attachment"]
}
```

### Entradas

- capability selecionada;
- dados extraidos da mensagem;
- contexto ativo;
- fontes do Knowledge Engine;
- resultados de skills anteriores.

### Saidas

- resultados parciais;
- evidencias;
- riscos;
- pendencias;
- dados normalizados;
- erros;
- sinais para validacao.

### Dependencias

Skills podem depender de:

- banco de dados;
- documentos oficiais;
- contexto;
- outras skills;
- regras de negocio;
- catalogo de capacidades.

### Reutilizacao

Exemplos:

`ResolveClient()` e usado por:

- cadastrar contrato;
- criar financeiro;
- anexar documento;
- criar juridico;
- analisar saude do cliente.

`ValidateDates()` e usado por:

- contrato;
- financeiro;
- juridico;
- fechamento.

`CheckDuplicate()` e usado por:

- cliente;
- contrato;
- equipamento;
- financeiro.

### Regra

Skills nao alteram dados. Mesmo skills chamadas `GeneratePreview()` ou `RequireConfirmation()` apenas produzem estruturas. A gravacao final pertence exclusivamente a Execution Engine.

## 7. Knowledge Engine

### Responsabilidade

A Knowledge Engine decide qual fonte consultar para responder ou validar uma solicitacao.

Ela responde:

- preciso consultar banco real?
- preciso consultar a Base Mestra?
- preciso consultar o Playbook?
- preciso consultar o Business Manual?
- preciso consultar o Capability Map?
- preciso usar contexto da conversa?
- preciso pedir informacao ao usuario?

### Fontes possiveis

1. Banco de dados real.
2. Master Knowledge Base.
3. Operational Playbook.
4. Business Manual.
5. Capability Map.
6. Documentacao futura.
7. Contexto da conversa.
8. Anexos enviados.

### Prioridade de fontes

Para fatos operacionais atuais:

```text
Banco real
-> contexto atual confirmado
-> documentos/anexos revisados
-> conhecimento documental
```

Para regras e governanca:

```text
Capability Map
-> Operational Playbook
-> Master Knowledge Base
-> Business Manual
```

Para cultura, tom e decisao:

```text
Business Manual
-> Operational Playbook
```

### Regras

1. Nunca inventar respostas.
2. Sempre priorizar dados reais para situacao atual.
3. Se o dado real nao estiver disponivel, declarar incerteza.
4. Documentacao define regras; banco define estado.
5. Indicador divergente deve levar a fonte de origem.
6. Nao corrigir indicador; investigar dado que gera indicador.

### Saida esperada

```json
{
  "sourcesUsed": [
    "clients",
    "contracts",
    "GATE_OS_COS_CAPABILITY_MAP.md"
  ],
  "facts": [],
  "rules": [],
  "unknowns": [],
  "confidence": "medium"
}
```

## 8. Context Engine

### Responsabilidade

A Context Engine mantem o contexto operacional da conversa.

Ela permite que o COS entenda continuidade:

```text
Usuario: "Cadastrar contrato da ATIBAIA."
Usuario: "Agora altera apenas o vencimento para dia 15."
```

O COS deve entender que "o vencimento" pertence ao contrato em revisao, nao a qualquer outro registro.

### Tipos de memoria

#### Memoria de curto prazo

Guarda a conversa recente:

- mensagens;
- intents recentes;
- entidades mencionadas;
- previews abertos;
- pendencias;
- escolhas do usuario.

#### Memoria operacional

Guarda o trabalho ativo:

- capacidade em andamento;
- entidade principal;
- candidatos encontrados;
- dados normalizados;
- validacoes;
- preview;
- status de confirmacao.

#### Contexto ativo

O contexto ativo e o foco atual do COS.

Exemplos:

- cliente em revisao;
- contrato sendo preparado;
- fechamento de maio;
- divergencia bancaria investigada;
- documento a anexar.

### Troca de contexto

Se o usuario mudar de assunto:

```text
"Esquece o contrato, agora veja o financeiro de junho."
```

O Context Engine deve:

- encerrar ou pausar o contexto anterior;
- registrar que havia uma operacao incompleta;
- iniciar novo contexto;
- evitar misturar dados.

### Encerramento de contexto

Um contexto termina quando:

- acao foi concluida;
- usuario cancelou;
- houve bloqueio final;
- contexto expirou;
- usuario iniciou nova tarefa incompatível.

### Regras

1. Contexto nao substitui banco real.
2. Contexto nao autoriza execucao.
3. Contexto nao deve carregar dados ambiguos para acao critica.
4. Se houver duvida, pedir confirmacao.
5. Preview antigo nao deve ser executado se dados relacionados mudaram.

### Saida esperada

```json
{
  "activeContext": "ContractCreation",
  "primaryEntity": {
    "type": "client",
    "name": "ATIBAIA"
  },
  "pendingAction": "GeneratePreview",
  "contextFreshness": "current",
  "requiresUserClarification": false
}
```

## 9. Validation Engine

### Responsabilidade

A Validation Engine garante que nenhuma acao prossiga sem verificacoes obrigatorias.

Ela valida:

- dados obrigatorios;
- formato;
- regras de negocio;
- duplicidade;
- conflitos;
- dependencias;
- impactos cruzados;
- criticidade;
- fase de liberacao.

### Entradas

- capacidade;
- dados normalizados;
- contexto;
- fatos do Knowledge Engine;
- resultados de skills;
- estado real do banco;
- Capability Map;
- Playbook.

### Saidas

```json
{
  "isValid": false,
  "severity": "critical",
  "errors": [],
  "warnings": [],
  "missingFields": [],
  "crossChecks": [],
  "blockingReasons": []
}
```

### Validacoes por modulo

#### Clientes

- nome/razao social limpo;
- documento normalizado;
- duplicidade por documento;
- duplicidade por nome similar;
- status permitido;
- cliente existente resolvido antes de criar contrato/financeiro;
- cliente inativo/inadimplente gera alerta.

#### Contratos

- cliente existe;
- cliente esta ativo ou possui confirmacao reforcada;
- tipo permitido;
- status permitido;
- data inicial valida;
- data final posterior a inicial;
- prazo coerente;
- vencimento valido;
- valor mensal positivo;
- contrato duplicado;
- contrato semelhante no periodo;
- equipamentos obrigatorios se locacao;
- estoque suficiente;
- parcelas projetadas;
- impacto financeiro/DRE.

#### Equipamentos

- equipamento existe quando referenciado;
- categoria aceita;
- status aceito;
- quantidade positiva;
- disponibilidade suficiente;
- serial duplicado;
- estoque negativo;
- locado x contratos ativos;
- manutencao x disponibilidade.

#### Financeiro

- tipo receita/despesa;
- descricao operacional;
- valor positivo;
- competencia;
- vencimento;
- data de pagamento/recebimento;
- categoria DRE;
- conta bancaria;
- cliente/contrato quando aplicavel;
- duplicidade por valor/data/descricao;
- status coerente com pagamento;
- periodo fechado.

#### Banco

- conta bancaria existe;
- saldo inicial/final;
- lancamentos pagos/recebidos possuem conta;
- pagamentos possuem data;
- periodo de conciliacao;
- diferenca de saldo;
- candidatos da divergencia.

#### DRE

- categorias presentes;
- categoria ativa;
- tipo financeiro combina com categoria;
- competencia correta;
- ajustes manuais com motivo/responsavel;
- DRE x financeiro;
- DRE x dashboard;
- historico separado do operacional.

#### Dashboard

- indicador identificado;
- fonte do indicador conhecida;
- periodo/filtro coerente;
- divergencia com fonte real;
- nao editar dashboard diretamente.

#### Juridico

- cliente resolvido;
- contrato/parcela coerentes;
- status/etapa/risco validos;
- valores coerentes;
- prazos;
- caso duplicado;
- documentos de suporte.

#### Documentos

- arquivo disponivel;
- tipo definido;
- entidade destino resolvida;
- vinculo nao ambiguo;
- duplicidade de documento;
- upload real antes de registro.

#### Socios

- socio ativo;
- periodo;
- resultado fechado/confiavel;
- distribuicao prevista x realizada;
- duplicidade;
- impacto em financeiro/DRE.

#### Fechamento

- financeiro validado;
- contratos validados;
- parcelas validadas;
- estoque validado;
- banco validado;
- DRE validada;
- dashboard validado;
- socios validados;
- sem divergencias criticas;
- revalidacao apos correcoes.

### Validacoes cruzadas

- cliente x contrato;
- contrato x financeiro;
- contrato x parcelas;
- contrato x equipamento;
- equipamento x estoque;
- financeiro x DRE;
- financeiro x banco;
- DRE x dashboard;
- juridico x inadimplencia;
- socios x resultado;
- documentos x registros.

### Regras de bloqueio

Bloquear quando:

- dados obrigatorios ausentes em acao critica;
- entidade ambigua;
- duplicidade forte;
- estoque negativo;
- contrato sem cliente;
- contrato de locacao sem equipamento;
- financeiro sem categoria DRE em fechamento;
- saldo bancario divergente sem explicacao;
- DRE divergente do dashboard sem origem;
- fase nao permite execucao;
- usuario nao confirmou preview.

## 10. Decision Engine

### Responsabilidade

A Decision Engine decide o que fazer apos validacao.

Ela nao executa. Ela apenas decide:

- pode prosseguir para preview?
- precisa pedir mais dados?
- deve bloquear?
- deve sugerir correcao?
- pode enviar para Execution Engine?

### Fluxo

```text
Pode executar?
   |
   |-- Nao
   |     -> Explicar motivo
   |     -> Mostrar pendencias
   |     -> Sugerir proximos passos
   |
   |-- Sim, mas precisa preview
   |     -> Gerar preview
   |     -> Pedir confirmacao
   |
   |-- Sim, leitura/diagnostico
         -> Responder sem gravar
```

### Criterios

- criticidade da capacidade;
- resultado da validacao;
- fase atual do COS;
- confianca da resolucao de entidades;
- presenca de preview;
- confirmacao recebida;
- riscos residuais;
- permissao de execucao.

### Niveis de confianca

- Alta: dados completos, entidade unica, validacoes aprovadas.
- Media: dados suficientes, mas existem alertas nao bloqueantes.
- Baixa: campos ausentes, entidade incerta ou risco relevante.

### Decisoes automaticas permitidas

- responder consultas;
- gerar diagnosticos;
- listar pendencias;
- sugerir proximos passos;
- preparar preview;
- bloquear por regra.

### Decisoes proibidas

- executar acao critica sem preview;
- executar sem confirmacao;
- ignorar erro real;
- assumir entidade ambigua;
- corrigir DRE automaticamente;
- alterar saldo bancario automaticamente;
- fechar mes com divergencia critica;
- executar lote sem confirmacao granular.

### Saida esperada

```json
{
  "decision": "block",
  "reason": "Contrato de locacao sem equipamento vinculado",
  "severity": "high",
  "nextSteps": [
    "Resolver equipamentos",
    "Validar estoque",
    "Gerar novo preview"
  ]
}
```

## 11. Execution Engine

### Responsabilidade

A Execution Engine e a unica camada autorizada a alterar dados.

Ela executa:

- inserts;
- updates futuros;
- anexos;
- fechamentos futuros;
- ajustes futuros;
- acoes compostas futuras;
- chamadas a endpoints/server actions;
- operacoes transacionais quando existirem.

### Entradas obrigatorias

- requestId;
- userId;
- capacidade;
- payload final validado;
- preview apresentado;
- confirmacao recebida;
- decision aprovada;
- lista de logs a gerar;
- idempotency key;
- contexto de seguranca.

### Saidas

```json
{
  "status": "success",
  "recordsChanged": [
    {
      "table": "clients",
      "id": "uuid",
      "operation": "insert"
    }
  ],
  "errors": [],
  "durationMs": 420
}
```

### Execucao

A Execution Engine deve:

1. receber apenas payload validado;
2. revalidar pontos criticos server-side;
3. executar endpoint permitido;
4. capturar erro real;
5. nao simular sucesso;
6. retornar IDs reais;
7. enviar resultado para Audit Engine;
8. responder ao usuario com o resultado real.

### Segurança

1. Nunca executar se a Decision Engine nao aprovou.
2. Nunca executar sem confirmacao quando a capacidade exige.
3. Nunca executar acao bloqueada por fase.
4. Nunca executar fora de endpoints/server actions autorizados.
5. Nunca alterar Auth, Login, Usuarios, Sessao ou RLS.
6. Nunca executar SQL destrutivo.

### Idempotencia

Toda execucao deve ter uma chave de idempotencia:

```text
userId + capability + normalizedPayloadHash + contextId
```

Objetivo:

- evitar clique duplo;
- evitar reenvio da mesma acao;
- evitar duplicidade por retry;
- permitir resposta segura se a operacao ja foi feita.

### Transacoes

Operacoes compostas futuras devem ser transacionais quando possivel.

Exemplo de contrato futuro:

```text
Criar contrato
-> criar parcelas
-> vincular equipamentos
-> recalcular estoque
-> anexar documento
-> log
```

Se uma etapa critica falhar, a operacao deve:

- fazer rollback quando tecnicamente possivel;
- ou registrar estado parcial com erro real;
- nunca fingir conclusao total.

### Rollback futuro

O Runtime deve prever rollback para:

- contrato composto;
- parcelas;
- vinculo de equipamentos;
- anexos;
- fechamento;
- ajustes DRE.

Rollback nao deve ser improvisado. Deve ser uma capacidade governada.

### Rastreabilidade

Toda alteracao deve registrar:

- quem pediu;
- quem confirmou;
- o que foi mostrado no preview;
- o que foi gravado;
- quais registros foram alterados;
- qual erro ocorreu, se houver.

## 12. Audit Engine

### Responsabilidade

A Audit Engine registra tudo que importa para rastreabilidade.

Ela deve registrar tanto sucesso quanto erro.

### O que registrar

- usuario;
- horario;
- requestId;
- intent detectada;
- capacidade ativada;
- skills utilizadas;
- modulos consultados;
- fontes consultadas;
- registros lidos;
- registros alterados;
- validacoes executadas;
- warnings;
- bloqueios;
- preview apresentado;
- confirmacao recebida;
- endpoint/action chamado;
- resultado;
- erro;
- tempo de execucao;
- versao do runtime;
- fase da capacidade.

### Formato esperado

```json
{
  "requestId": "uuid",
  "userId": "uuid",
  "timestamp": "ISO-8601",
  "intent": {
    "name": "CreateClient",
    "confidence": "high"
  },
  "capability": {
    "name": "Client Creation",
    "criticality": "Alta",
    "phase": "enabled"
  },
  "skillsUsed": [
    "NormalizeClientName",
    "ValidateCNPJ",
    "CheckDuplicateClient",
    "GeneratePreview"
  ],
  "modulesConsulted": [
    "Clientes"
  ],
  "recordsRead": [
    {
      "table": "clients",
      "criteria": "document_number"
    }
  ],
  "preview": {
    "previewId": "uuid",
    "shownAt": "ISO-8601",
    "hash": "sha256"
  },
  "confirmation": {
    "required": true,
    "type": "Confirmacao simples",
    "confirmedAt": "ISO-8601"
  },
  "execution": {
    "status": "success",
    "recordsChanged": [
      {
        "table": "clients",
        "id": "uuid",
        "operation": "insert"
      }
    ]
  },
  "error": null,
  "durationMs": 420
}
```

### Logs de bloqueio

Bloqueios importantes tambem devem ser auditaveis.

Exemplo:

```json
{
  "requestId": "uuid",
  "intent": "MonthlyClosing",
  "capability": "Monthly Closing Checklist",
  "decision": "blocked",
  "blockingReasons": [
    "Saldo bancario divergente sem explicacao",
    "Financeiro sem categoria DRE"
  ],
  "severity": "Critica",
  "recordsChanged": []
}
```

### Regras

1. Log nao pode esconder erro.
2. Log nao deve conter segredo sensivel desnecessario.
3. Log deve registrar payload suficiente para auditoria.
4. Log deve diferenciar preview, confirmacao e execucao.
5. Log deve indicar quando nada foi alterado.

## 13. Learning Engine - Fase futura

### Responsabilidade

A Learning Engine aprende padroes operacionais para sugerir melhorias.

Ela nunca altera dados.

### Exemplos permitidos

- o operador sempre classifica fornecedor X na categoria Y;
- cliente X costuma usar determinada conta bancaria;
- contratos de determinado tipo costumam ter vencimento dia 15;
- determinada despesa recorrente aparece todo mes;
- um erro comum ocorre antes do fechamento.

### Saidas permitidas

- sugestoes;
- alertas;
- recomendacoes;
- preenchimento sugerido;
- deteccao de padroes.

### Saidas proibidas

- execucao automatica;
- alteracao sem preview;
- criacao de regra invisivel;
- aprendizado que substitua confirmacao humana;
- uso de dado sensivel fora do contexto.

### Privacidade e seguranca

1. Aprendizado deve ser rastreavel.
2. Padroes devem poder ser explicados.
3. Usuario deve poder ignorar sugestao.
4. Aprendizado nao pode alterar regra de negocio.
5. Aprendizado nao pode contornar validacao.

### Exemplo

```text
Percebi que lancamentos desse fornecedor costumam ser classificados como "Despesas Operacionais".
Deseja usar essa categoria neste lancamento?
```

Nunca:

```text
Classifiquei automaticamente porque aprendi o padrao.
```

## 14. Exemplos de Runtime completo

### Exemplo 1 - Cadastrar cliente

```text
Usuario: "Cadastrar cliente: Razao social ACME LTDA, CNPJ 00.000.000/0001-00"
```

Fluxo:

1. Intent Engine -> `CreateClient`.
2. Capability Engine -> `Client Creation`.
3. Skill Engine -> `NormalizeClientName`, `ValidateCNPJ`, `CheckDuplicateClient`.
4. Knowledge Engine -> consulta `clients` e Capability Map.
5. Context Engine -> cria contexto `ClientCreation`.
6. Validation Engine -> valida nome, documento, duplicidade.
7. Decision Engine -> permite preview.
8. Usuario confirma.
9. Execution Engine -> chama endpoint de criar cliente.
10. Audit Engine -> registra acao.
11. COS responde com resultado real.

### Exemplo 2 - Fechar maio

```text
Usuario: "Feche maio"
```

Fluxo:

1. Intent Engine -> `MonthlyClosing`.
2. Capability Engine -> `Monthly Closing Checklist`.
3. Skill Engine -> validacoes de financeiro, contratos, estoque, banco, DRE, dashboard, socios.
4. Knowledge Engine -> consulta dados reais.
5. Context Engine -> contexto `Closing: Maio/Ano`.
6. Validation Engine -> encontra divergencias criticas.
7. Decision Engine -> bloqueia fechamento.
8. Audit Engine -> registra bloqueio/diagnostico.
9. COS responde com pendencias e proximos passos.

Nenhum dado e alterado.

### Exemplo 3 - Banco nao bate

```text
Usuario: "Por que o banco nao bate com o financeiro?"
```

Fluxo:

1. Intent Engine -> `BankReconciliationDiagnosis`.
2. Capability Engine -> `Conciliar banco x financeiro`.
3. Skill Engine -> `CompareBankBalance`, `FindReconciliationCandidates`.
4. Knowledge Engine -> consulta `bank_accounts` e `financial_entries`.
5. Context Engine -> define periodo/conta ou pede dados.
6. Validation Engine -> valida periodo e conta.
7. Decision Engine -> diagnostico de leitura.
8. Audit Engine -> opcional/recomendado.
9. COS responde com diferenca e candidatos.

Nenhum dado e alterado.

## 15. Tabela final das engines

| Engine | Responsabilidade | Pode alterar dados? | Consulta banco? | Usa documentos? | Gera logs? |
|---|---|---:|---:|---:|---:|
| Intent Engine | Entender intencao do usuario e entidades mencionadas. | Nao | Nao, exceto desambiguacao futura controlada | Pode ler anexos como sinal de intencao | Nao diretamente |
| Capability Engine | Mapear intent para capacidade operacional e fase permitida. | Nao | Nao necessariamente | Usa Capability Map | Nao diretamente |
| Skill Engine | Executar skills reutilizaveis de busca, calculo, normalizacao e preview. | Nao | Sim, por skills de leitura | Sim, quando skill precisar interpretar anexo/metadado | Registra evidencias para Audit |
| Knowledge Engine | Escolher fontes: banco, docs oficiais, contexto e anexos. | Nao | Sim | Sim | Registra fontes para Audit |
| Context Engine | Manter contexto ativo, memoria curta e operacao em andamento. | Nao | Pode consultar para refrescar contexto | Pode referenciar anexos do contexto | Registra mudanca de contexto quando relevante |
| Validation Engine | Validar regras, duplicidades, conflitos e dependencias. | Nao | Sim | Sim, para validar evidencia/vinculo | Registra validacoes e bloqueios |
| Decision Engine | Decidir bloquear, pedir dados, gerar preview ou enviar para execucao. | Nao | Nao diretamente | Usa resultados anteriores | Registra decisao para Audit |
| Execution Engine | Executar a unica alteracao autorizada em dados. | Sim | Sim | Sim, para upload/anexo | Envia resultado para Audit |
| Audit Engine | Registrar intent, capacidade, skills, preview, confirmacao, execucao e erro. | Sim, apenas logs de auditoria | Sim, para gravar/consultar logs | Pode registrar metadados | Sim |
| Learning Engine | Aprender padroes e sugerir preenchimentos futuros. | Nao | Sim, apenas leitura agregada/governada | Pode usar metadados, com limites | Registra sugestoes/aprendizado permitido |

## 16. Regras permanentes do Runtime

1. Somente Execution Engine altera dados.
2. Audit Engine so grava auditoria.
3. Todas as outras engines sao read-only.
4. Nenhuma engine pode inventar dado.
5. Nenhuma engine pode simular sucesso.
6. Erro real deve ser mostrado.
7. Acao critica exige validacao, preview, confirmacao e log.
8. Acao bloqueada por fase nao pode ser executada.
9. Contexto nao substitui confirmacao.
10. Aprendizado nao substitui validacao.
11. Diagnostico nao corrige automaticamente.
12. Correcoes devem acontecer na origem do dado.
13. Fechamento nao ocorre com divergencia critica.
14. Dashboard nao e editado diretamente.
15. DRE nao e ajustada sem justificativa e governanca.
16. Auth, Login, Usuarios, Sessao e RLS sao areas proibidas.

## 17. Contrato de implementacao futura

Toda nova funcionalidade do COS deve declarar:

- qual intent ativa;
- qual capability corresponde;
- quais skills usa;
- quais fontes o Knowledge Engine consulta;
- qual contexto cria ou usa;
- quais validacoes executa;
- quais decisoes podem ocorrer;
- se Execution Engine pode alterar dados;
- qual endpoint/server action sera chamado;
- qual preview sera mostrado;
- qual confirmacao sera exigida;
- qual log sera gravado;
- quais bloqueios existem.

Se uma funcionalidade nao puder responder esses pontos, ela nao deve ser implementada.

## 18. Parecer executivo

O Runtime do COS deve funcionar como uma cadeia de responsabilidade.

Cada engine possui uma funcao clara:

- Intent entende;
- Capability enquadra;
- Skill executa raciocinios pequenos;
- Knowledge escolhe fontes;
- Context mantem continuidade;
- Validation protege regras;
- Decision decide;
- Execution altera dados;
- Audit registra;
- Learning sugere, futuramente.

Essa separacao impede que o COS vire uma automacao opaca. Ela torna cada resposta e cada execucao explicavel, auditavel e segura.

O principio mais importante permanece:

```text
O COS pode pensar em muitas camadas,
mas so pode alterar dados por uma unica porta:
Execution Engine, com validacao, preview, confirmacao e auditoria.
```

