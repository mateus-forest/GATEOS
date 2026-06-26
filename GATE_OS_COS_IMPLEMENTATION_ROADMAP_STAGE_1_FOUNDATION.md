# GATE OS - COS Implementation Roadmap

## Etapa 1 - Foundation Read Only

## 1. Objetivo

Implementar a primeira versao realmente utilizavel do COS como especialista de leitura, busca, explicacao e diagnostico do GATE OS.

Nesta etapa o COS nao sera executor.

O COS deve operar em modo 100% leitura:

- ler dados reais;
- buscar registros;
- localizar informacoes;
- explicar modulos;
- explicar indicadores;
- diagnosticar inconsistencias;
- comparar fontes;
- conciliar somente em modo diagnostico;
- orientar proximos passos.

Nesta etapa o COS nao pode alterar absolutamente nenhum dado.

Proibido:

- INSERT;
- UPDATE;
- DELETE;
- UPSERT;
- DROP;
- TRUNCATE;
- escrita em Storage;
- endpoint de gravacao;
- fechamento mensal;
- cadastro;
- edicao;
- exclusao;
- anexacao;
- recalculo persistido;
- alteracao de banco;
- alteracao de Supabase;
- alteracao de Auth/RLS/Login/Sessao.

## 2. Resultado esperado da etapa

Ao final da Etapa 1, o usuario devera conseguir conversar com todo o sistema.

Exemplos:

```text
Quem e o cliente Fribal?
Mostre os contratos da Estacio.
Quais contratos vencem este mes?
Quantos nobreaks estao disponiveis?
Quanto faturamos em maio?
Explique por que a DRE caiu.
Qual indicador gera esse card do Dashboard?
Por que o banco nao bate?
O que falta para fechar maio?
```

Todas as respostas devem usar dados reais do sistema, sem modificar nada.

## 3. Principio de arquitetura

A Etapa 1 implementa apenas engines read-only do Runtime:

```text
Usuario
-> Intent Engine
-> Capability Engine
-> Skill Engine
-> Knowledge Engine
-> Context Engine
-> Validation Engine read-only
-> Decision Engine read-only
-> Resposta ao usuario
```

Execution Engine permanece desabilitada para qualquer acao de negocio.

Audit Engine pode ser planejada, mas nesta etapa nao deve exigir nova escrita no banco, salvo autorizacao posterior explicita. Se houver logs, devem ser logs locais/diagnosticos nao operacionais ou apenas futura especificacao.

## 4. Regra de ouro

Se o usuario pedir uma acao de escrita, o COS deve responder:

```text
Nesta etapa eu ainda nao posso executar essa acao.
Posso consultar os dados, validar riscos, montar o preview conceitual e explicar o que seria necessario para executar com seguranca em uma etapa futura.
```

## 5. Escopo liberado

Liberado:

- ler;
- buscar;
- listar;
- explicar;
- diagnosticar;
- comparar;
- conciliar em modo leitura;
- navegar entre modulos;
- explicar regras;
- explicar impactos;
- apontar pendencias;
- sugerir proximos passos sem executar.

Bloqueado:

- criar;
- cadastrar;
- editar;
- excluir;
- anexar;
- fechar mes;
- ajustar DRE;
- alterar financeiro;
- alterar estoque;
- alterar contrato;
- alterar cliente;
- alterar documentos;
- alterar juridico;
- alterar socios;
- recalcular persistindo;
- executar em massa.

## 6. Epico 1 - Conhecimento do Sistema

### Objetivo

O COS deve conhecer todos os modulos existentes e explicar sua finalidade, dependencias, impactos e capacidades.

### Modulos obrigatorios

- Clientes;
- Contratos;
- Equipamentos;
- Financeiro;
- DRE;
- Dashboard;
- Documentos;
- Juridico;
- Socios;
- Patrimonio;
- Manutencoes;
- Relatorios;
- Configuracoes.

### Entregas

1. Catalogo read-only de modulos.
2. Mapa de finalidade por modulo.
3. Mapa de dependencias operacionais.
4. Mapa de impactos entre modulos.
5. Mapa de capacidades read-only disponiveis.
6. Respostas explicativas sobre regras de negocio.

### Exemplos aceitos

```text
O que acontece quando crio um contrato?
O que alimenta a DRE?
Esse indicador vem de qual modulo?
Como financeiro afeta dashboard?
O que fecha o mes?
```

### Criterios de aceite

- COS explica cada modulo em linguagem operacional.
- COS diferencia dado de origem e indicador.
- COS explica impactos sem prometer execucao.
- COS nao inventa regras quando nao houver fonte.

## 7. Epico 2 - Navegacao Inteligente

## 7.1 Client Search

### Objetivo

Buscar clientes por nome, razao social, nome fantasia, CNPJ/CPF, email, telefone ou status.

### Exemplos

```text
Procure a Fribal.
Quem e a Estacio?
Busque cliente pelo CNPJ.
Clientes inadimplentes.
```

### Skills

- `ResolveClient()`;
- `NormalizeDocument()`;
- `SearchClients()`;
- `RankClientCandidates()`;
- `ExplainClientSummary()`.

### Fontes

- `clients`;
- opcionalmente `contracts`, `financial_entries`, `documents`, `legal_cases` para resumo.

### Validacoes read-only

- documento normalizado;
- nomes similares;
- cliente unico ou candidatos;
- status.

### Resultado esperado

Resposta com:

- cliente encontrado;
- dados principais;
- status;
- documento;
- contatos;
- contratos relacionados, quando solicitado;
- alertas de duplicidade, se houver.

### Bloqueios

- se houver ambiguidade, pedir escolha;
- nunca cadastrar cliente nesta etapa.

### Status

Producao read-only.

## 7.2 Contract Search

### Objetivo

Buscar contratos por cliente, numero, status, tipo, periodo ou vencimento.

### Exemplos

```text
Contratos da Fribal.
Contrato do Atibaia.
Contratos vencendo.
Contratos ativos.
Contratos encerrados.
```

### Skills

- `ResolveClient()`;
- `ResolveContract()`;
- `SearchContracts()`;
- `FilterContractsByStatus()`;
- `FilterContractsByDate()`;
- `ExplainContractSummary()`.

### Fontes

- `contracts`;
- `clients`;
- `installments`;
- `contract_equipment`;
- `equipment`;
- `documents`.

### Resultado esperado

- contratos encontrados;
- status;
- tipo;
- cliente;
- datas;
- vencimento;
- valor;
- pendencias conhecidas.

### Bloqueios

- nunca criar, renovar, editar ou encerrar contrato nesta etapa.

## 7.3 Equipment Search

### Objetivo

Buscar equipamentos e disponibilidade.

### Exemplos

```text
Quantos nobreaks temos?
Servidores Dell disponiveis.
Equipamentos em manutencao.
Quantos monitores estao locados?
```

### Skills

- `SearchEquipment()`;
- `NormalizeEquipmentTerm()`;
- `CalculateReadOnlyAvailability()`;
- `ExplainEquipmentStatus()`.

### Fontes

- `equipment`;
- `contract_equipment`;
- `contracts`;
- `maintenance_orders`;
- `assets`.

### Resultado esperado

- total;
- disponivel;
- locado;
- reservado;
- manutencao;
- status;
- possiveis inconsistencias.

### Bloqueios

- nunca editar estoque;
- nunca recalcular persistindo;
- nunca cadastrar equipamento.

## 7.4 Financial Search

### Objetivo

Buscar receitas, despesas, lancamentos, valores em aberto e historico financeiro.

### Exemplos

```text
Receitas de maio.
Despesas da Fribal.
Financeiro em aberto.
Contas vencidas.
Lancamentos sem categoria.
```

### Skills

- `SearchFinancialEntries()`;
- `NormalizePeriod()`;
- `ResolveClient()`;
- `GroupFinancialEntries()`;
- `ExplainFinancialSummary()`.

### Fontes

- `financial_entries`;
- `clients`;
- `contracts`;
- `dre_categories`;
- `bank_accounts`.

### Resultado esperado

- lista ou resumo;
- totais por tipo/status;
- periodo;
- categoria;
- conta;
- cliente/contrato quando houver;
- alertas.

### Bloqueios

- nunca criar ou editar lancamento;
- nunca baixar pagamento;
- nunca alterar status.

## 7.5 Document Search

### Objetivo

Buscar documentos por nome, tipo, cliente, contrato ou modulo.

### Exemplos

```text
Contrato da Estacio.
Documentos da Fribal.
Comprovantes de maio.
Documentos sem vinculo.
```

### Skills

- `SearchDocuments()`;
- `ResolveClient()`;
- `ResolveContract()`;
- `ExplainDocumentLinks()`.

### Fontes

- `documents`;
- entidades relacionadas.

### Resultado esperado

- documentos encontrados;
- tipo;
- vinculo;
- data/metadados disponiveis;
- pendencias de vinculo.

### Bloqueios

- nunca anexar arquivo;
- nunca mover documento;
- nunca alterar vinculo.

## 7.6 Legal Search

### Objetivo

Buscar casos juridicos, riscos, prazos e valores em aberto.

### Exemplos

```text
Casos juridicos da Fribal.
Prazos juridicos da semana.
Clientes com risco juridico.
```

### Skills

- `SearchLegalCases()`;
- `ResolveClient()`;
- `FilterLegalDeadlines()`;
- `ExplainLegalRisk()`.

### Fontes

- `legal_cases`;
- `clients`;
- `contracts`;
- `installments`;
- `documents`.

### Resultado esperado

- casos encontrados;
- status;
- etapa;
- risco;
- prazo;
- valores;
- vinculos.

### Bloqueios

- nunca criar ou editar caso juridico.

## 7.7 Partner Search

### Objetivo

Buscar dados de socios, participacoes e lancamentos.

### Exemplos

```text
Mostre socios.
Distribuicoes de maio.
Lancamentos do socio X.
```

### Skills

- `SearchPartners()`;
- `SearchPartnerEntries()`;
- `ExplainPartnerDistribution()`.

### Fontes

- `partners`;
- `partner_entries`;
- `partner_distribution_rules`;
- DRE/resultado quando necessario.

### Resultado esperado

- socios;
- participacoes;
- lancamentos;
- distribuicao prevista/realizada;
- pendencias.

### Bloqueios

- nunca criar lancamento de socio;
- nunca alterar participacao.

## 8. Epico 3 - Diagnostico Explicativo

Nesta etapa o COS explica, nao corrige.

## 8.1 Explain Dashboard

### Objetivo

Explicar indicadores do dashboard e suas origens.

### Exemplos

```text
Como esse indicador e calculado?
Por que caiu?
De onde vem esse card?
```

### Skills

- `IdentifyDashboardIndicator()`;
- `TraceDashboardSource()`;
- `CompareIndicatorWithSource()`;
- `ExplainIndicator()`.

### Fontes

- views/helpers de dashboard;
- modulos de origem: financeiro, contratos, equipamentos, juridico, DRE.

### Resultado esperado

- nome do indicador;
- fonte provavel;
- regra de leitura;
- modulos envolvidos;
- causa provavel de variacao;
- limitacoes.

## 8.2 Explain DRE

### Objetivo

Explicar resultado, receitas, despesas, categorias, ajustes e variacoes.

### Exemplos

```text
Explique maio.
Por que o lucro caiu?
Quais categorias pesaram mais?
```

### Skills

- `LoadDrePeriod()`;
- `GroupFinancialByDreCategory()`;
- `DetectManualAdjustments()`;
- `ExplainDreVariation()`.

### Resultado esperado

- resumo do periodo;
- principais receitas/despesas;
- ajustes;
- divergencias;
- possiveis causas.

## 8.3 Explain Financial

### Objetivo

Explicar situacao financeira, contas vencidas e composicao de receitas/despesas.

### Exemplos

```text
Por que existem contas vencidas?
O que esta em aberto?
Quais receitas nao foram recebidas?
```

### Skills

- `SearchFinancialEntries()`;
- `ClassifyOverdueEntries()`;
- `ExplainFinancialStatus()`.

### Resultado esperado

- valores em aberto;
- vencidos;
- clientes/fornecedores envolvidos;
- status;
- alertas.

## 8.4 Explain Contracts

### Objetivo

Explicar status, vencimento, pendencias e impacto de contratos.

### Exemplos

```text
Por que esse contrato aparece vencido?
Quais contratos estao ativos?
Esse contrato tem financeiro?
```

### Skills

- `ResolveContract()`;
- `CheckContractDates()`;
- `CheckContractFinancialLinks()`;
- `CheckContractEquipmentLinks()`.

### Resultado esperado

- status explicado;
- datas;
- financeiro;
- equipamentos;
- documentos;
- pendencias.

## 8.5 Explain Stock

### Objetivo

Explicar disponibilidade, locacao, manutencao e inconsistencias de estoque.

### Exemplos

```text
Por que o estoque ficou negativo?
Quantos equipamentos estao locados?
Esse item esta disponivel?
```

### Skills

- `CalculateReadOnlyStock()`;
- `CompareSavedAndCalculatedStock()`;
- `ExplainStockAnomaly()`.

### Resultado esperado

- total/disponivel/locado/manutencao;
- fonte da diferenca;
- contratos relacionados;
- pendencias.

## 9. Epico 4 - Diagnosticos Inteligentes

## 9.1 Bank Reconciliation Diagnosis

### Objetivo

Diagnosticar por que banco e financeiro nao batem.

### Exemplos

```text
O banco nao bate.
Por que o saldo esta diferente?
Qual lancamento explica a diferenca?
```

### Skills

- `NormalizePeriod()`;
- `LoadBankAccounts()`;
- `LoadPaidFinancialEntries()`;
- `CalculateOperationalBalance()`;
- `CompareBankBalance()`;
- `FindReconciliationCandidates()`.

### Resultado esperado

- saldo banco;
- saldo operacional calculado;
- diferenca;
- candidatos;
- origem provavel;
- proximos passos.

### Bloqueios

- nao alterar saldo;
- nao criar ajuste;
- nao baixar pagamento.

## 9.2 DRE Diagnosis

### Objetivo

Comparar financeiro, DRE e dashboard.

### Exemplos

```text
DRE bate com financeiro?
Dashboard bate com DRE?
Por que o resultado esta diferente?
```

### Skills

- `LoadDrePeriod()`;
- `LoadFinancialByCompetence()`;
- `LoadDashboardIndicators()`;
- `CompareDreFinancialDashboard()`;
- `FindDreDivergenceCauses()`.

### Resultado esperado

- total financeiro;
- total DRE;
- indicador dashboard;
- diferencas;
- causas provaveis.

### Bloqueios

- nao ajustar DRE;
- nao alterar indicador;
- nao fechar mes.

## 9.3 Contract Diagnosis

### Objetivo

Encontrar problemas em contratos.

Detectar:

- contratos sem financeiro;
- contratos vencidos;
- contratos duplicados;
- contratos sem equipamento;
- contratos sem parcelas;
- contratos sem documento.

### Skills

- `LoadContracts()`;
- `DetectExpiredActiveContracts()`;
- `DetectContractWithoutFinancial()`;
- `DetectContractWithoutEquipment()`;
- `DetectDuplicateContracts()`.

### Resultado esperado

- lista de problemas;
- criticidade;
- impacto;
- proximos passos sugeridos.

## 9.4 Equipment Diagnosis

### Objetivo

Encontrar problemas em equipamentos e estoque.

Detectar:

- estoque negativo;
- equipamentos locados sem contrato;
- equipamentos duplicados;
- contratos sem equipamento;
- manutencoes conflitantes.

### Skills

- `LoadEquipment()`;
- `LoadContractEquipment()`;
- `CalculateReadOnlyStock()`;
- `DetectNegativeStock()`;
- `DetectRentedWithoutContract()`.

### Resultado esperado

- divergencias;
- origem provavel;
- impacto operacional;
- proximos passos.

## 9.5 Financial Diagnosis

### Objetivo

Encontrar problemas no financeiro.

Detectar:

- duplicidades;
- categorias ausentes;
- competencias incorretas;
- lancamentos sem conta bancaria;
- pagamentos sem data;
- receitas de contrato ausentes.

### Skills

- `LoadFinancialEntries()`;
- `DetectDuplicateFinancialEntries()`;
- `DetectMissingDreCategory()`;
- `DetectMissingBankAccount()`;
- `DetectWrongCompetence()`.

### Resultado esperado

- pendencias financeiras;
- criticidade;
- impacto DRE/banco;
- proximos passos.

## 10. Epico 5 - Explicacao do Sistema

### Objetivo

Responder perguntas sobre regras, dependencias e impactos do GATE OS.

### Exemplos

```text
O que acontece quando crio um contrato?
O que alimenta a DRE?
Esse indicador vem de qual tabela?
Esse financeiro impacta onde?
O que fecha o mes?
Por que contrato afeta estoque?
```

### Skills

- `ExplainModulePurpose()`;
- `ExplainBusinessRule()`;
- `ExplainOperationalImpact()`;
- `TraceDataFlow()`;
- `ExplainMonthlyClosingRequirements()`.

### Fontes

- Master Knowledge Base;
- Operational Playbook;
- Business Manual;
- Capability Map;
- Runtime Architecture;
- codigo e helpers existentes como referencia tecnica.

### Resultado esperado

- explicacao clara;
- modulos envolvidos;
- fontes de dados;
- impacto operacional;
- limites da etapa atual.

## 11. Arquitetura minima da Etapa 1

### Componentes logicos

1. Intent Engine read-only.
2. Capability Router read-only.
3. Skill Registry read-only.
4. Knowledge Access Layer.
5. Context Memory curta.
6. Read-only Query Layer.
7. Diagnosis Formatter.
8. Response Composer.
9. Read-only Guardrail.

### Guardrail obrigatorio

Antes de qualquer resposta que pareca execucao, aplicar:

```text
Esta capacidade altera dados?
   |
   |-- Sim -> bloquear nesta etapa.
   |
   |-- Nao -> permitir leitura/diagnostico.
```

### Query Layer

Deve usar apenas operacoes de leitura:

- SELECT;
- views;
- RPCs exclusivamente read-only, se existirem e forem confirmadas como leitura.

Proibido:

- insert helpers;
- update helpers;
- delete helpers;
- storage upload;
- action endpoints de escrita;
- mutations.

## 12. Backlog detalhado da Sprint

### Setup de fundamentos read-only

- Criar catalogo de capacidades liberadas na Etapa 1.
- Criar bloqueio central para intents de escrita.
- Separar respostas de leitura de respostas de execucao.
- Garantir que nenhuma action de escrita seja chamada.
- Criar estrutura de resposta padronizada: resumo, dados encontrados, alertas, proximos passos.

### Busca

- Implementar busca de cliente.
- Implementar busca de contrato.
- Implementar busca de equipamento.
- Implementar busca financeira.
- Implementar busca documental.
- Implementar busca juridica.
- Implementar busca de socios.

### Explicacao

- Explicar modulos.
- Explicar indicadores.
- Explicar DRE.
- Explicar financeiro.
- Explicar contratos.
- Explicar estoque.
- Explicar fechamento.

### Diagnostico

- Diagnostico banco x financeiro.
- Diagnostico DRE x financeiro.
- Diagnostico DRE x dashboard.
- Diagnostico contratos.
- Diagnostico equipamentos/estoque.
- Diagnostico financeiro.
- Diagnostico fechamento.

### Validacao read-only

- Validar duplicidades sem corrigir.
- Validar pendencias sem executar.
- Validar divergencias sem ajustar.
- Validar bloqueios sem alterar.

## 13. Perguntas minimas de validacao

A Sprint deve responder corretamente:

### Clientes

- Buscar cliente por nome.
- Buscar cliente por CNPJ.
- Buscar cliente por razao social.
- Explicar status do cliente.
- Identificar cliente duplicado provavel.

### Contratos

- Buscar contratos ativos.
- Buscar contratos encerrados.
- Buscar contratos vencendo.
- Explicar contrato vencido.
- Encontrar contrato sem financeiro.
- Encontrar contrato de locacao sem equipamento.

### Equipamentos

- Localizar equipamento por nome.
- Localizar por status.
- Mostrar disponiveis.
- Mostrar manutencao.
- Explicar estoque negativo.

### Financeiro

- Consultar por periodo.
- Consultar por cliente.
- Consultar por categoria.
- Identificar em aberto.
- Identificar vencidos.
- Identificar duplicidade.

### DRE

- Explicar categorias.
- Explicar resultado do mes.
- Comparar DRE x financeiro.
- Listar ajustes.
- Explicar queda de lucro.

### Banco

- Comparar banco x financeiro.
- Detectar diferenca.
- Encontrar candidatos da divergencia.
- Identificar pagos sem conta.
- Identificar pagamentos sem data.

### Dashboard

- Explicar indicador.
- Apontar fonte.
- Diagnosticar divergencia.

### Fechamento

- Informar o que falta para fechar um mes.
- Classificar pendencias.
- Bloquear conceitualmente fechamento com divergencia critica.

## 14. Criterios de aceite

A Etapa 1 so esta concluida se:

1. O COS responde perguntas reais sobre qualquer modulo prioritario.
2. Todas as respostas usam dados reais ou declaram claramente quando nao ha dados.
3. Nenhuma operacao altera dados.
4. Pedidos de escrita sao bloqueados com explicacao.
5. Busca de cliente funciona por nome, CNPJ e razao social.
6. Busca de contratos funciona por status e vencimento.
7. Busca de equipamentos funciona por status/disponibilidade.
8. Financeiro pode ser consultado por periodo, cliente e categoria.
9. Dashboard pode ser explicado por fonte/indicador.
10. DRE pode ser explicada por categoria/periodo.
11. DRE x financeiro pode ser comparado.
12. Banco x financeiro pode ser comparado.
13. Divergencias sao explicadas com origem provavel.
14. Fechamento mensal gera checklist de pendencias.
15. O COS explica dependencias entre modulos.
16. Nao existe INSERT, UPDATE, DELETE, UPSERT ou upload em nenhuma resposta da Etapa 1.

## 15. Testes obrigatorios

### Testes de seguranca read-only

- Pedir "Cadastre cliente" deve bloquear.
- Pedir "Crie contrato" deve bloquear.
- Pedir "Anexe documento" deve bloquear.
- Pedir "Feche maio" deve rodar diagnostico, nao fechamento.
- Pedir "Corrija DRE" deve bloquear.
- Pedir "Baixe esse pagamento" deve bloquear.

### Testes de busca

- Cliente por nome.
- Cliente por documento.
- Contrato por cliente.
- Contratos vencendo.
- Equipamento por status.
- Financeiro por periodo.
- Documento por cliente/contrato.
- Juridico por cliente.
- Socios por periodo.

### Testes de diagnostico

- Banco x financeiro.
- DRE x financeiro.
- DRE x dashboard.
- Contrato ativo sem financeiro.
- Estoque negativo.
- Financeiro sem categoria DRE.
- Pagamento sem conta.

## 16. Mensagens padrao

### Bloqueio de escrita

```text
Nesta etapa eu ainda nao posso executar alteracoes.
Posso consultar os dados reais, validar riscos e preparar um diagnostico ou preview conceitual.
```

### Dados insuficientes

```text
Nao encontrei dados suficientes para responder com seguranca.
Preciso de pelo menos: [campo].
```

### Ambiguidade

```text
Encontrei mais de um registro possivel.
Escolha qual deles devo usar para continuar a analise.
```

### Diagnostico

```text
Encontrei uma divergencia.
Origem provavel:
Impacto:
Gravidade:
Proximo passo seguro:
```

### Fechamento bloqueado

```text
Nao recomendo fechar este mes.
Encontrei divergencias criticas que precisam ser resolvidas antes.
```

## 17. Fora de escopo

Fora da Etapa 1:

- cadastrar cliente;
- criar contrato;
- criar equipamento;
- criar financeiro;
- anexar documento;
- editar qualquer registro;
- excluir qualquer registro;
- ajustar DRE;
- fechar mes;
- upload persistente;
- logs operacionais em banco;
- execucao em massa;
- confirmar tudo;
- automacao.

## 18. Riscos da etapa

### Risco: resposta parecer execucao

Mitigacao:

- sempre diferenciar diagnostico de acao;
- usar linguagem read-only.

### Risco: dado real incompleto

Mitigacao:

- declarar incerteza;
- listar fontes consultadas;
- mostrar ausencias.

### Risco: diagnostico errado por regra de status divergente

Mitigacao:

- explicar criterio usado;
- permitir refinamento por periodo/status.

### Risco: chamar helper de escrita sem querer

Mitigacao:

- read-only guardrail central;
- testes de seguranca;
- revisao de imports/chamadas.

## 19. Definition of Done

A Etapa 1 esta pronta quando:

- todas as capacidades read-only prioritarias respondem;
- diagnosticos principais funcionam;
- perguntas de sistema sao explicadas;
- pedidos de escrita sao bloqueados;
- nao ha nenhuma chamada de escrita no fluxo COS;
- testes de seguranca read-only passam;
- `npm run lint` passa;
- `npm run build` passa;
- relatorio tecnico da etapa e gerado;
- nenhuma alteracao destrutiva foi feita.

## 20. Parecer executivo

A Etapa 1 e a fundacao de confianca do COS.

Ela deve provar que o COS conhece a operacao antes de tentar executa-la.

O sucesso desta etapa nao e "cadastrar algo". O sucesso e o usuario conseguir perguntar sobre qualquer parte do GATE OS e receber uma resposta correta, rastreavel e baseada em dados reais.

Somente depois que o COS demonstrar dominio de leitura, busca, explicacao, diagnostico e conciliacao read-only a Etapa 2 deve liberar as primeiras execucoes seguras.

