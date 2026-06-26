# GATE OS - COS Capability Map

## 1. Proposito

Este documento transforma a documentacao estrategica do COS em um mapa pratico de capacidades operacionais executaveis.

Ele conecta:

- Executor Audit;
- Master Knowledge Base;
- Operational Playbook;
- Business Manual;
- implementacao futura do COS.

O COS nao deve iniciar seu raciocinio por endpoint. Ele deve iniciar por capacidade operacional.

Exemplos:

```text
"Feche maio"
-> Monthly Closing

"Cadastre este contrato"
-> Contract Creation

"Por que o banco nao bate com o financeiro?"
-> Bank Reconciliation Diagnosis
```

Cada capacidade deve declarar o que precisa saber, validar, previewar, bloquear, executar e logar.

## 2. Regras fundamentais

1. Capacidades de leitura podem ser liberadas antes.
2. Capacidades que alteram financeiro, DRE, banco, estoque, contratos ou fechamento sao alta ou critica.
3. Nenhuma capacidade critica pode executar sem validacao, preview, confirmacao, log, erro real e rastreabilidade.
4. O COS deve bloquear quando houver ambiguidade, duplicidade provavel ou divergencia critica.
5. Diagnosticar nao e corrigir.
6. Corrigir deve acontecer na origem do dado, nao no indicador.
7. Execucao em massa, fechamento e DRE sao fases futuras governadas.

## 3. Classificacoes

### Criticidade

- Baixa: leitura, melhoria cadastral ou pendencia sem impacto operacional direto.
- Media: risco de auditoria, vinculo ou qualidade operacional.
- Alta: risco financeiro, juridico, contratual, de estoque ou duplicidade relevante.
- Critica: risco de distorcer DRE, banco, fechamento, estoque, contratos ou dashboard.

### Confirmacao

- Nenhuma, apenas leitura.
- Confirmacao simples.
- Confirmacao reforcada.
- Bloqueado por fase.
- Nunca automatico.

### Status de execucao atual

- Sim: ja existe fluxo seguro hoje.
- Parcial: existe leitura/diagnostico ou endpoint incompleto.
- Nao: precisa endpoint/implementacao futura.

## 4. Tabela resumo

| Capacidade | Categoria | Criticidade | Pode executar hoje? | Precisa endpoint? | Precisa preview? | Confirmacao |
|---|---|---:|---|---|---|---|
| Buscar cliente | Cliente | Baixa | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Cadastrar cliente | Cliente | Alta | Sim | Ja existe | Sim | Confirmacao simples/reforcada |
| Editar cliente | Cliente | Alta | Nao | Sim | Sim | Bloqueado por fase |
| Detectar cliente duplicado | Cliente | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Analisar saude do cliente | Cliente | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Buscar contrato | Contratos | Baixa | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Cadastrar contrato | Contratos | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Editar contrato | Contratos | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Renovar contrato | Contratos | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Encerrar contrato | Contratos | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Detectar contrato duplicado | Contratos | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar contratos vencendo | Contratos | Media | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Detectar contrato ativo sem financeiro | Contratos | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar contrato de locacao sem equipamento | Contratos | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Buscar equipamento | Equipamentos | Baixa | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Cadastrar equipamento | Equipamentos | Alta | Nao | Sim | Sim | Bloqueado por fase |
| Editar equipamento | Equipamentos | Alta | Nao | Sim | Sim | Bloqueado por fase |
| Verificar disponibilidade | Equipamentos | Media | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Conciliar estoque | Equipamentos | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar estoque negativo | Equipamentos | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar equipamento locado sem contrato | Equipamentos | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar contrato sem equipamento | Equipamentos | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Criar lancamento financeiro | Financeiro | Alta | Sim | Ja existe | Sim | Confirmacao simples/reforcada |
| Editar lancamento financeiro | Financeiro | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Buscar lancamento | Financeiro | Baixa | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Detectar lancamento duplicado | Financeiro | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar financeiro sem categoria DRE | Financeiro | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar financeiro sem conta bancaria | Financeiro | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar receita de contrato ausente | Financeiro | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar receitas/despesas fora da competencia | Financeiro | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Conciliar banco x financeiro | Banco | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar diferenca de saldo | Banco | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Encontrar candidatos da divergencia | Banco | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Diagnosticar lancamentos pagos sem conta | Banco | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Diagnosticar pagamentos sem data | Banco | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Analisar DRE | DRE | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Conciliar DRE x financeiro | DRE | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Conciliar DRE x dashboard | DRE | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar categoria ausente | DRE | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar ajuste manual | DRE | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Sugerir ajuste DRE | DRE | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Preparar fechamento DRE | DRE | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Bloquear fechamento com divergencia | DRE | Critica | Parcial | Nao | Sim | Nunca automatico |
| Rodar checklist de fechamento | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar financeiro | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar contratos | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar estoque | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar banco | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar DRE | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar dashboard | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Validar socios | Fechamento | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Gerar diagnostico de fechamento | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Sugerir correcoes | Fechamento | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Revalidar fechamento | Fechamento | Critica | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Registrar fechamento mensal | Fechamento | Critica | Nao | Sim | Sim | Bloqueado por fase |
| Anexar documento | Documentos | Media | Sim | Ja existe | Sim | Confirmacao simples |
| Buscar documento | Documentos | Baixa | Sim | Nao | Nao | Nenhuma, apenas leitura |
| Vincular documento | Documentos | Media | Parcial | Sim | Sim | Confirmacao simples |
| Detectar documento sem vinculo | Documentos | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar contrato sem documento | Documentos | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar comprovante financeiro ausente | Documentos | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Buscar caso juridico | Juridico | Baixa | Parcial | Nao | Nao | Nenhuma, apenas leitura |
| Criar caso juridico | Juridico | Alta | Nao | Sim | Sim | Bloqueado por fase |
| Editar caso juridico | Juridico | Alta | Nao | Sim | Sim | Bloqueado por fase |
| Detectar inadimplencia com risco juridico | Juridico | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar prazo juridico proximo | Juridico | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Diagnosticar valores juridicos em aberto | Juridico | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Buscar socio | Socios | Baixa | Parcial | Nao | Nao | Nenhuma, apenas leitura |
| Analisar distribuicao | Socios | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Conciliar socios x resultado | Socios | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Detectar distribuicao antes do fechamento | Socios | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Criar lancamento de socio | Socios | Alta | Nao | Sim | Sim | Bloqueado por fase |
| Explicar indicador do dashboard | Dashboard | Baixa | Parcial | Nao | Nao | Nenhuma, apenas leitura |
| Diagnosticar indicador divergente | Dashboard | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Gerar relatorio operacional | Relatorios | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Gerar relatorio financeiro | Relatorios | Media | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Gerar relatorio de fechamento | Relatorios | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |
| Gerar relatorio de pendencias criticas | Relatorios | Alta | Parcial | Nao | Sim | Nenhuma, apenas leitura |

## 5. Capacidades de Cliente

### Buscar cliente

- Descricao: localizar cliente por nome, razao social, documento, email, telefone ou status.
- Quando ativar: pedidos de consulta, validacao, cadastro relacionado, contrato, financeiro ou documento.
- Exemplos: "Ache o cliente ATIBAIA", "Esse CNPJ ja existe?", "Mostre clientes inadimplentes".
- Modulos envolvidos: Clientes, Contratos, Financeiro, Documentos, Juridico.
- Tabelas envolvidas: `clients`, possivelmente `contracts`, `financial_entries`, `documents`, `legal_cases`.
- Skills necessarias: entity search, fuzzy match, document normalization, ambiguity handling.
- Dados obrigatorios: pelo menos um identificador.
- Dados opcionais: status, cidade, documento, telefone, email.
- Validacoes: normalizar documento; comparar nomes parecidos; retornar candidatos.
- Riscos: escolher cliente errado; esconder duplicidade.
- Criticidade: Baixa para leitura, Alta se destravar criacao.
- Pode executar hoje: Sim, como leitura/resumo.
- Precisa endpoint futuro: Nao para leitura; sim para busca estruturada robusta, se centralizada.
- Precisa preview: Nao para leitura simples; sim se for usado em acao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional em consultas; obrigatorio se virar acao.
- Resultado esperado: cliente encontrado, candidatos ou ausencia clara.
- Bloqueios: ambiguidade em acao operacional.

### Cadastrar cliente

- Descricao: criar cliente novo a partir de dados estruturados revisados.
- Quando ativar: "Cadastre cliente", "Criar cliente", "Registrar esta empresa".
- Exemplos: "Cadastrar cliente: Razao social..., CNPJ...".
- Modulos envolvidos: Clientes, Documentos, Contratos, Financeiro, Juridico.
- Tabelas envolvidas: `clients`, `cos_action_logs`.
- Skills necessarias: structured input parsing, sanitization, duplicate detection, preview generation.
- Dados obrigatorios: nome/razao social; status ou default seguro; documento recomendado.
- Dados opcionais: nome fantasia, endereco, cidade, estado, CEP, email, telefone, representante, observacoes.
- Validacoes: nome limpo; documento normalizado; duplicidade por documento/nome; status aceito.
- Riscos: cliente duplicado; nome contaminado; documento errado.
- Criticidade: Alta.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Ja existe endpoint atual.
- Precisa preview: Sim.
- Confirmacao: Confirmacao simples; reforcada se sem documento ou baixa confianca.
- Logs necessarios: `create_client`, payload sanitizado, resultado real, erro real.
- Resultado esperado: cliente criado ou bloqueio explicado.
- Bloqueios: nome contaminado, documento duplicado, ambiguidade, falta de confirmacao.

### Editar cliente

- Descricao: alterar dados de cliente existente.
- Quando ativar: "Atualize o telefone", "Corrija o CNPJ", "Mude status do cliente".
- Exemplos: "Editar cliente ATIBAIA: status inadimplente".
- Modulos envolvidos: Clientes, Contratos, Financeiro, Juridico, Documentos.
- Tabelas envolvidas: `clients`; leituras em modulos dependentes.
- Skills necessarias: entity resolution, diff preview, impact analysis.
- Dados obrigatorios: cliente alvo resolvido; campos novos.
- Dados opcionais: justificativa, documento de suporte.
- Validacoes: cliente unico; diff antes/depois; documento nao pertence a outro cliente; impacto em historico.
- Riscos: alterar cliente errado; corromper historico; quebrar relacoes.
- Criticidade: Alta.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase; futuramente confirmacao reforcada.
- Logs necessarios: update_client, before/after, justificativa.
- Resultado esperado: diff aprovado e alteracao registrada.
- Bloqueios: cliente ambiguo, documento duplicado, periodo/registro sensivel sem justificativa.

### Detectar cliente duplicado

- Descricao: identificar clientes com mesmo documento, nome similar ou contatos iguais.
- Quando ativar: antes de cadastrar/editar cliente ou por auditoria.
- Exemplos: "Esse cliente ja existe?", "Verifique duplicidades de clientes".
- Modulos envolvidos: Clientes, Contratos, Financeiro.
- Tabelas envolvidas: `clients`, opcionalmente `contracts`, `financial_entries`.
- Skills necessarias: duplicate detection, fuzzy matching, document normalization.
- Dados obrigatorios: nome ou documento.
- Dados opcionais: email, telefone, cidade.
- Validacoes: documento sem mascara; similaridade de nome; contato coincidente.
- Riscos: falso positivo ou falso negativo.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico; sim para acao de merge no futuro.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional; recomendado se bloquear acao.
- Resultado esperado: lista de duplicidades provaveis com confianca.
- Bloqueios: bloquear criacao quando duplicidade forte existir.

### Analisar saude do cliente

- Descricao: avaliar situacao operacional de um cliente.
- Quando ativar: consulta gerencial, antes de contrato, antes de juridico ou fechamento.
- Exemplos: "Como esta o cliente ATIBAIA?", "Esse cliente esta saudavel?".
- Modulos envolvidos: Clientes, Contratos, Financeiro, Documentos, Juridico, Manutencoes.
- Tabelas envolvidas: `clients`, `contracts`, `financial_entries`, `installments`, `documents`, `legal_cases`, `maintenance_orders`.
- Skills necessarias: entity resolution, cross-module summarization, risk scoring.
- Dados obrigatorios: cliente.
- Dados opcionais: periodo.
- Validacoes: cliente unico; contratos ativos; inadimplencia; documentos; juridico.
- Riscos: resumo incompleto ocultar risco.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao, mas precisa agregador estruturado.
- Precisa preview: Sim, como painel/resumo.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: status, pendencias, riscos e proximas acoes.
- Bloqueios: nenhum para leitura; bloquear nova acao se risco alto/critico.

## 6. Capacidades de Contratos

### Buscar contrato

- Descricao: localizar contrato por cliente, numero, status, periodo ou vencimento.
- Quando ativar: consultas, renovacao, encerramento, financeiro ou documentos.
- Exemplos: "Buscar contrato da ATIBAIA", "Quais contratos vencem este mes?".
- Modulos envolvidos: Contratos, Clientes, Financeiro, Equipamentos, Documentos.
- Tabelas envolvidas: `contracts`, `clients`, `contract_equipment`, `equipment`, `installments`.
- Skills necessarias: entity search, date filtering, status interpretation.
- Dados obrigatorios: cliente, numero ou filtro.
- Dados opcionais: status, periodo, tipo.
- Validacoes: cliente resolvido; periodo coerente.
- Riscos: contrato errado por cliente similar.
- Criticidade: Baixa.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Nao para leitura.
- Precisa preview: Nao para consulta simples.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: contrato(s) encontrados com status e pendencias.
- Bloqueios: ambiguidade antes de acao.

### Cadastrar contrato

- Descricao: criar contrato a partir de dados estruturados e revisados.
- Quando ativar: "Cadastre este contrato", "Criar contrato de locacao".
- Exemplos: "Cadastrar contrato: Cliente ATIBAIA, tipo locacao, inicio...".
- Modulos envolvidos: Contratos, Clientes, Equipamentos, Estoque, Parcelas, Financeiro, DRE, Documentos.
- Tabelas envolvidas: `contracts`, `contract_equipment`, `equipment`, `installments`, possivelmente `documents`, `financial_entries`.
- Skills necessarias: structured contract parsing, entity resolution, stock validation, installment projection, impact preview.
- Dados obrigatorios: cliente, tipo, status, data inicial, vencimento, valor; equipamentos se locacao.
- Dados opcionais: data final, prazo, caucao, reajuste, documento, observacoes.
- Validacoes: cliente ativo; contrato duplicado; datas; valor; estoque; parcelas; categoria DRE futura.
- Riscos: estoque negativo, parcelas erradas, receita ausente, contrato duplicado.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim, completo.
- Confirmacao: Bloqueado por fase; futuramente confirmacao reforcada.
- Logs necessarios: create_contract, related ids, parcelas previstas, estoque antes/depois.
- Resultado esperado: contrato criado com parcelas/vinculos/estoque consistentes.
- Bloqueios: cliente nao resolvido, estoque insuficiente, duplicidade, dados financeiros ausentes.

### Editar contrato

- Descricao: alterar contrato existente.
- Quando ativar: ajuste de valor, datas, status, vencimento ou equipamentos.
- Exemplos: "Atualize o valor do contrato", "Mude a data final".
- Modulos envolvidos: Contratos, Parcelas, Financeiro, Estoque, DRE, Dashboard.
- Tabelas envolvidas: `contracts`, `installments`, `contract_equipment`, `equipment`, `financial_entries`.
- Skills necessarias: diff preview, impact analysis, recalculation.
- Dados obrigatorios: contrato resolvido; campos alterados; justificativa.
- Dados opcionais: documento de suporte.
- Validacoes: diff; estoque; parcelas; periodo fechado; financeiro vinculado.
- Riscos: quebrar financeiro, estoque, historico ou DRE.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: update_contract, before/after, justificativa, impactos.
- Resultado esperado: alteracao rastreavel e impactos recalculados.
- Bloqueios: contrato ambiguo, periodo fechado, estoque negativo, parcelas conflitantes.

### Renovar contrato

- Descricao: prorrogar contrato com novo periodo, valor ou condicoes.
- Quando ativar: contratos vencendo ou pedido de renovacao.
- Exemplos: "Renove o contrato por 12 meses", "Prorrogar contrato ATIBAIA".
- Modulos envolvidos: Contratos, Financeiro, Parcelas, Equipamentos, Documentos.
- Tabelas envolvidas: `contracts`, `installments`, `contract_equipment`, `financial_entries`, `documents`.
- Skills necessarias: renewal analysis, date calculation, financial projection.
- Dados obrigatorios: contrato, novo prazo/data final, confirmacao de condicoes.
- Dados opcionais: novo valor, reajuste, documento.
- Validacoes: contrato ativo/vencendo; inadimplencia; equipamentos; parcelas futuras.
- Riscos: renovar contrato inadimplente, duplicar parcelas, manter valor errado.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: renew_contract, before/after, parcelas, impactos.
- Resultado esperado: renovacao rastreavel com financeiro projetado.
- Bloqueios: inadimplencia critica, contrato ambiguo, estoque/parcelas inconsistentes.

### Encerrar contrato

- Descricao: encerrar ou cancelar contrato.
- Quando ativar: termino, cancelamento, devolucao, encerramento de cliente.
- Exemplos: "Encerrar contrato da ATIBAIA", "Cancelar contrato".
- Modulos envolvidos: Contratos, Estoque, Equipamentos, Parcelas, Financeiro, Documentos, Juridico.
- Tabelas envolvidas: `contracts`, `contract_equipment`, `equipment`, `installments`, `financial_entries`, `documents`, `legal_cases`.
- Skills necessarias: closure checklist, pending detection, stock release preview.
- Dados obrigatorios: contrato, data de encerramento, motivo.
- Dados opcionais: documento, observacoes, devolucao.
- Validacoes: parcelas abertas; financeiro em aberto; equipamentos; juridico; documentos.
- Riscos: liberar estoque indevidamente, apagar receita esperada, encerrar com pendencias.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: close_contract, motivo, pendencias, impactos.
- Resultado esperado: contrato encerrado com impactos conhecidos.
- Bloqueios: pendencia critica sem confirmacao ou sem processo.

### Detectar contrato duplicado

- Descricao: encontrar contrato semelhante para mesmo cliente/periodo/equipamentos.
- Quando ativar: antes de cadastrar/renovar contrato.
- Exemplos: "Esse contrato ja existe?", "Verifique contratos duplicados".
- Modulos envolvidos: Contratos, Clientes, Equipamentos.
- Tabelas envolvidas: `contracts`, `clients`, `contract_equipment`.
- Skills necessarias: duplicate detection, date overlap, entity matching.
- Dados obrigatorios: cliente ou contrato proposto.
- Dados opcionais: datas, valor, equipamentos.
- Validacoes: sobreposicao de periodo, mesmo cliente, valor parecido, equipamentos iguais.
- Riscos: criar contrato duplicado.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional; recomendado se bloquear criacao.
- Resultado esperado: duplicidades provaveis e confianca.
- Bloqueios: duplicidade forte bloqueia criacao.

### Detectar contratos vencendo

- Descricao: listar contratos proximos do vencimento.
- Quando ativar: rotina comercial, renovacao, dashboard.
- Exemplos: "Quais contratos vencem nos proximos 30 dias?".
- Modulos envolvidos: Contratos, Clientes, Financeiro.
- Tabelas envolvidas: `contracts`, `clients`.
- Skills necessarias: date filtering, status filtering.
- Dados obrigatorios: periodo ou janela default.
- Dados opcionais: cliente, status.
- Validacoes: data final, status ativo.
- Riscos: ignorar contrato sem data final.
- Criticidade: Media.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: lista ordenada por vencimento.
- Bloqueios: nenhum.

### Detectar contrato ativo sem financeiro

- Descricao: identificar contratos ativos sem receita/parcela/lancamento correspondente.
- Quando ativar: fechamento, auditoria, criacao financeira.
- Exemplos: "Quais contratos ativos nao tem financeiro?".
- Modulos envolvidos: Contratos, Parcelas, Financeiro, DRE.
- Tabelas envolvidas: `contracts`, `installments`, `financial_entries`.
- Skills necessarias: reconciliation, expected revenue calculation.
- Dados obrigatorios: periodo.
- Dados opcionais: cliente, status.
- Validacoes: contrato ativo no periodo; receita esperada; lancamentos/parcelas.
- Riscos: subfaturamento, DRE incorreta.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em fechamento.
- Resultado esperado: contratos sem financeiro e valor esperado.
- Bloqueios: bloqueia fechamento.

### Detectar contrato de locacao sem equipamento

- Descricao: encontrar contratos de locacao sem vinculo de equipamentos.
- Quando ativar: auditoria, contrato, estoque, fechamento.
- Exemplos: "Mostre contratos de locacao sem equipamento".
- Modulos envolvidos: Contratos, Equipamentos, Estoque.
- Tabelas envolvidas: `contracts`, `contract_equipment`, `equipment`.
- Skills necessarias: relationship validation.
- Dados obrigatorios: periodo/status.
- Dados opcionais: cliente.
- Validacoes: tipo locacao, status ativo, vinculos existentes.
- Riscos: estoque e operacao inconsistentes.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em auditoria.
- Resultado esperado: contratos afetados e pendencia.
- Bloqueios: bloqueia criacao/fechamento conforme contexto.

## 7. Capacidades de Equipamentos e Estoque

### Buscar equipamento

- Descricao: localizar equipamento por nome, categoria, configuracao, serial ou status.
- Quando ativar: contrato, manutencao, estoque, patrimonio.
- Exemplos: "Buscar nobreak APC", "Tem monitor disponivel?".
- Modulos envolvidos: Equipamentos, Contratos, Manutencoes, Patrimonio.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `maintenance_orders`, `assets`.
- Skills necessarias: search, fuzzy match, availability interpretation.
- Dados obrigatorios: identificador ou filtro.
- Dados opcionais: categoria, status, configuracao.
- Validacoes: item unico ou candidatos; status; disponibilidade.
- Riscos: selecionar item errado.
- Criticidade: Baixa.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: equipamentos encontrados.
- Bloqueios: ambiguidade antes de acao.

### Cadastrar equipamento

- Descricao: criar item ou lote revisado de equipamento.
- Quando ativar: compra, inventario, contrato futuro.
- Exemplos: "Cadastrar 10 monitores", "Registrar equipamento".
- Modulos envolvidos: Equipamentos, Estoque, Patrimonio, Contratos.
- Tabelas envolvidas: `equipment`, opcionalmente `assets`.
- Skills necessarias: structured input, deduplication, quantity validation.
- Dados obrigatorios: nome, categoria, quantidade, status.
- Dados opcionais: marca, modelo, configuracao, serial, valores, observacoes.
- Validacoes: quantidade positiva, categoria/status aceitos, duplicidade/serial.
- Riscos: duplicar estoque, criar quantidade errada.
- Criticidade: Alta.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: create_equipment, payload, resultado.
- Resultado esperado: equipamento criado com disponibilidade inicial coerente.
- Bloqueios: quantidade invalida, duplicidade forte, serial duplicado.

### Editar equipamento

- Descricao: alterar cadastro, status ou quantidade.
- Quando ativar: correcao, manutencao, baixa, ajuste de inventario.
- Exemplos: "Atualize quantidade", "Marque como manutencao".
- Modulos envolvidos: Equipamentos, Contratos, Estoque, Manutencoes, Patrimonio.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `contracts`, `maintenance_orders`.
- Skills necessarias: diff preview, stock impact analysis.
- Dados obrigatorios: equipamento resolvido, alteracoes, justificativa.
- Dados opcionais: documento/evidencia.
- Validacoes: nova quantidade >= locado; status coerente; serial unico.
- Riscos: estoque negativo, historico incorreto.
- Criticidade: Alta.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: update_equipment, before/after, impacto.
- Resultado esperado: equipamento ajustado sem quebrar estoque.
- Bloqueios: quantidade menor que locado, ambiguidade, contrato ativo conflitante.

### Verificar disponibilidade

- Descricao: calcular se ha estoque disponivel para um item/quantidade.
- Quando ativar: contrato, proposta, manutencao, venda.
- Exemplos: "Tem 10 monitores disponiveis?", "Posso locar 2 racks?".
- Modulos envolvidos: Equipamentos, Contratos, Estoque.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `contracts`, `maintenance_orders`.
- Skills necessarias: stock calculation, status filtering.
- Dados obrigatorios: equipamento/categoria, quantidade.
- Dados opcionais: periodo, contrato pretendido.
- Validacoes: total, locado, manutencao, reservado.
- Riscos: disponibilidade superestimada.
- Criticidade: Media.
- Pode executar hoje: Sim/parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao, exceto em contrato.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: disponivel/indisponivel e motivo.
- Bloqueios: contrato bloqueado se estoque insuficiente.

### Conciliar estoque

- Descricao: comparar estoque salvo com estoque calculado por contratos e manutencoes.
- Quando ativar: auditoria, fechamento, divergencia de disponibilidade.
- Exemplos: "Concilie o estoque", "Por que estoque esta negativo?".
- Modulos envolvidos: Equipamentos, Contratos, Manutencoes, Dashboard.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `contracts`, `maintenance_orders`.
- Skills necessarias: reconciliation, anomaly detection.
- Dados obrigatorios: escopo ou todos os equipamentos.
- Dados opcionais: categoria, status.
- Validacoes: total >= locado; locado = soma contratos ativos; manutencao.
- Riscos: falso diagnostico por status irregular.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em auditoria/fechamento.
- Resultado esperado: estoque salvo, calculado, diferencas e origem provavel.
- Bloqueios: estoque negativo bloqueia contrato/fechamento.

### Detectar estoque negativo

- Descricao: identificar equipamentos com disponibilidade negativa ou inconsistente.
- Quando ativar: fechamento, contrato, auditoria.
- Exemplos: "Tem estoque negativo?", "Liste problemas de estoque".
- Modulos envolvidos: Equipamentos, Contratos, Dashboard.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `contracts`.
- Skills necessarias: anomaly detection.
- Dados obrigatorios: nenhum; opcional filtro.
- Dados opcionais: categoria.
- Validacoes: quantidade total, locada, disponivel.
- Riscos: ignorar campos alias de quantidade.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: lista de itens criticos.
- Bloqueios: bloqueia novas locacoes e fechamento.

### Detectar equipamento locado sem contrato

- Descricao: encontrar equipamento marcado/contado como locado sem contrato ativo correspondente.
- Quando ativar: auditoria de estoque, fechamento.
- Exemplos: "Equipamentos locados sem contrato".
- Modulos envolvidos: Equipamentos, Contratos, Estoque.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `contracts`.
- Skills necessarias: relationship validation.
- Dados obrigatorios: nenhum.
- Dados opcionais: categoria/status.
- Validacoes: status/quantidade locada x vinculos ativos.
- Riscos: liberar equipamento indevidamente.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: itens e causa provavel.
- Bloqueios: bloqueia fechamento se impacto critico.

### Detectar contrato sem equipamento

- Descricao: encontrar contratos de locacao sem itens vinculados.
- Quando ativar: contrato, estoque, fechamento.
- Exemplos: "Contratos sem equipamento".
- Modulos envolvidos: Contratos, Equipamentos, Estoque.
- Tabelas envolvidas: `contracts`, `contract_equipment`, `equipment`.
- Skills necessarias: relationship validation.
- Dados obrigatorios: periodo/status.
- Dados opcionais: cliente.
- Validacoes: tipo locacao e status ativo.
- Riscos: contrato operacionalmente incompleto.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: contratos pendentes.
- Bloqueios: bloqueia fechamento/execucao contratual conforme contexto.

## 8. Capacidades de Financeiro

### Criar lancamento financeiro

- Descricao: registrar receita ou despesa individual.
- Quando ativar: "Criar lancamento", "Registrar receita", "Lancar despesa".
- Exemplos: "Criar receita de R$ 3.697,33 para ATIBAIA".
- Modulos envolvidos: Financeiro, DRE, Banco, Clientes, Contratos, Documentos.
- Tabelas envolvidas: `financial_entries`, `clients`, `contracts`, `bank_accounts`, `dre_categories`, `cos_action_logs`.
- Skills necessarias: structured input, amount/date validation, duplicate detection.
- Dados obrigatorios: tipo, descricao, valor, competencia ou vencimento.
- Dados opcionais: categoria DRE, conta bancaria, cliente, contrato, status, pagamento, documento.
- Validacoes: valor positivo; datas; tipo; descricao; duplicidade; categoria/conta quando aplicavel.
- Riscos: DRE errada, duplicidade, banco divergente.
- Criticidade: Alta.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Ja existe, mas deve evoluir para regras completas.
- Precisa preview: Sim.
- Confirmacao: Confirmacao simples ou reforcada se risco alto.
- Logs necessarios: create_financial_entry, payload, resultado/erro.
- Resultado esperado: lancamento criado com dados revisados.
- Bloqueios: valor invalido, data ausente, duplicidade forte, categoria/conta ausente em contexto critico.

### Editar lancamento financeiro

- Descricao: alterar valor, data, status, categoria, conta ou vinculos.
- Quando ativar: correcao financeira, conciliacao, fechamento.
- Exemplos: "Corrija a competencia", "Mude categoria DRE".
- Modulos envolvidos: Financeiro, DRE, Banco, Dashboard, Fechamento.
- Tabelas envolvidas: `financial_entries`, `dre_categories`, `bank_accounts`, `dre_monthly_closings`.
- Skills necessarias: diff preview, period-lock awareness, impact analysis.
- Dados obrigatorios: lancamento resolvido, alteracao, justificativa.
- Dados opcionais: documento.
- Validacoes: periodo fechado; valor; conta; categoria; status; impacto DRE/banco.
- Riscos: distorcer fechamento, saldo, DRE.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: update_financial_entry, before/after, justificativa.
- Resultado esperado: ajuste rastreavel e revalidado.
- Bloqueios: mes fechado, lancamento ambiguo, impacto critico sem governanca.

### Buscar lancamento

- Descricao: localizar lancamento financeiro.
- Quando ativar: consulta, conciliacao, edicao, documento.
- Exemplos: "Buscar pagamento de R$ 830", "Ache a receita da ATIBAIA em maio".
- Modulos envolvidos: Financeiro, Banco, DRE.
- Tabelas envolvidas: `financial_entries`, `clients`, `contracts`, `bank_accounts`, `dre_categories`.
- Skills necessarias: search, date/value matching.
- Dados obrigatorios: algum filtro.
- Dados opcionais: tipo, periodo, valor, cliente, contrato.
- Validacoes: periodo e valor normalizados.
- Riscos: selecionar lancamento errado.
- Criticidade: Baixa.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao para leitura.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: lancamentos candidatos.
- Bloqueios: ambiguidade antes de edicao/baixa.

### Detectar lancamento duplicado

- Descricao: encontrar receitas/despesas repetidas.
- Quando ativar: antes de criar, fechamento, auditoria.
- Exemplos: "Tem despesa duplicada?", "Esse lancamento ja existe?".
- Modulos envolvidos: Financeiro, DRE, Banco.
- Tabelas envolvidas: `financial_entries`.
- Skills necessarias: duplicate detection by value/date/description/entity.
- Dados obrigatorios: lancamento proposto ou periodo.
- Dados opcionais: cliente, categoria, conta.
- Validacoes: valor, descricao similar, competencia/vencimento, entidade.
- Riscos: duplicidade distorcer DRE e banco.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado se bloquear criacao.
- Resultado esperado: duplicidades provaveis.
- Bloqueios: duplicidade forte bloqueia criacao.

### Detectar financeiro sem categoria DRE

- Descricao: listar lancamentos relevantes sem categoria DRE.
- Quando ativar: fechamento, DRE, criacao financeira.
- Exemplos: "Lancamentos sem categoria DRE".
- Modulos envolvidos: Financeiro, DRE, Fechamento.
- Tabelas envolvidas: `financial_entries`, `dre_categories`.
- Skills necessarias: classification audit.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo, status.
- Validacoes: categoria ausente ou invalida.
- Riscos: DRE incompleta.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em fechamento.
- Resultado esperado: lancamentos pendentes de classificacao.
- Bloqueios: bloqueia fechamento.

### Detectar financeiro sem conta bancaria

- Descricao: identificar lancamentos pagos/recebidos sem conta bancaria.
- Quando ativar: conciliacao bancaria, fechamento.
- Exemplos: "Pagamentos sem conta bancaria".
- Modulos envolvidos: Financeiro, Banco.
- Tabelas envolvidas: `financial_entries`, `bank_accounts`.
- Skills necessarias: bank reconciliation checks.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo/status.
- Validacoes: pagamento/recebimento com `bank_account_id` ausente.
- Riscos: saldo bancario inconsistente.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: lista de lancamentos sem conta.
- Bloqueios: bloqueia conciliacao/fechamento se critico.

### Detectar receita de contrato ausente

- Descricao: identificar contratos ativos sem receita prevista/lancada.
- Quando ativar: fechamento, auditoria, contratos.
- Exemplos: "Receitas de contrato ausentes".
- Modulos envolvidos: Contratos, Financeiro, DRE.
- Tabelas envolvidas: `contracts`, `installments`, `financial_entries`.
- Skills necessarias: expected revenue calculation.
- Dados obrigatorios: periodo.
- Dados opcionais: cliente/status.
- Validacoes: contrato ativo no periodo; valor esperado; lancamento correspondente.
- Riscos: subfaturamento, DRE subestimada.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em fechamento.
- Resultado esperado: contratos e valores ausentes.
- Bloqueios: bloqueia fechamento.

### Detectar despesas/receitas fora da competencia

- Descricao: encontrar lancamentos em competencia incorreta ou suspeita.
- Quando ativar: DRE, fechamento, conciliacao.
- Exemplos: "Lancamentos fora da competencia de maio".
- Modulos envolvidos: Financeiro, DRE, Fechamento.
- Tabelas envolvidas: `financial_entries`, `contracts`, `installments`.
- Skills necessarias: period validation, recurrence/contract comparison.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo, categoria, cliente.
- Validacoes: competencia x vencimento x contrato/parcela.
- Riscos: resultado mensal incorreto.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: lancamentos suspeitos e motivo.
- Bloqueios: bloqueia fechamento se impacto critico.

## 9. Capacidades de Banco e Conciliacao

### Conciliar banco x financeiro

- Descricao: comparar saldo/lancamentos financeiros com saldo bancario.
- Quando ativar: "Banco nao bate", fechamento, auditoria financeira.
- Exemplos: "Por que o banco nao bate com o financeiro?".
- Modulos envolvidos: Banco, Financeiro, DRE, Fechamento.
- Tabelas envolvidas: `bank_accounts`, `financial_entries`.
- Skills necessarias: reconciliation, period filtering, variance analysis.
- Dados obrigatorios: conta ou periodo.
- Dados opcionais: saldo informado, banco, extrato.
- Validacoes: pagamentos/recebimentos, conta bancaria, datas, saldo inicial/final.
- Riscos: corrigir saldo em vez da origem; ignorar lancamentos sem conta.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em fechamento.
- Resultado esperado: saldo calculado, saldo banco, diferenca, causas provaveis.
- Bloqueios: bloqueia fechamento se divergencia critica.

### Detectar diferenca de saldo

- Descricao: identificar diferenca entre saldo operacional e saldo bancario.
- Quando ativar: conciliacao, fechamento.
- Exemplos: "Qual a diferenca do saldo?".
- Modulos envolvidos: Banco, Financeiro.
- Tabelas envolvidas: `bank_accounts`, `financial_entries`.
- Skills necessarias: balance calculation.
- Dados obrigatorios: conta/periodo.
- Dados opcionais: saldo informado.
- Validacoes: saldo inicial, lancamentos pagos/recebidos.
- Riscos: usar periodo errado.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: diferenca numerica e contexto.
- Bloqueios: bloqueia fechamento se nao explicada.

### Encontrar candidatos da divergencia

- Descricao: listar lancamentos que podem explicar diferenca de saldo.
- Quando ativar: apos detectar divergencia.
- Exemplos: "O que pode explicar essa diferenca?".
- Modulos envolvidos: Banco, Financeiro.
- Tabelas envolvidas: `financial_entries`, `bank_accounts`.
- Skills necessarias: candidate ranking, anomaly detection.
- Dados obrigatorios: diferenca, periodo/conta.
- Dados opcionais: tolerancia, tipo.
- Validacoes: valores iguais/proximos, sem conta, sem data, status incoerente.
- Riscos: apontar causa errada como certeza.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: candidatos com nivel de confianca.
- Bloqueios: nenhum; acao corretiva futura precisa confirmacao.

### Diagnosticar lancamentos pagos sem conta bancaria

- Descricao: encontrar entradas/saidas marcadas como pagas/recebidas sem conta.
- Quando ativar: conciliacao, fechamento.
- Exemplos: "Pagos sem conta".
- Modulos envolvidos: Financeiro, Banco.
- Tabelas envolvidas: `financial_entries`.
- Skills necessarias: status/date/account validation.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo.
- Validacoes: `payment_date` presente e `bank_account_id` ausente.
- Riscos: saldo bancario incompleto.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: lancamentos afetados.
- Bloqueios: bloqueia conciliacao/fechamento.

### Diagnosticar pagamentos sem data

- Descricao: encontrar status pago/recebido sem data de pagamento/recebimento.
- Quando ativar: conciliacao, fechamento.
- Exemplos: "Pagamentos sem data".
- Modulos envolvidos: Financeiro, Banco.
- Tabelas envolvidas: `financial_entries`.
- Skills necessarias: status consistency check.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo/status.
- Validacoes: status x `payment_date`.
- Riscos: entrada/saida contabilizada no periodo errado.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: registros inconsistentes.
- Bloqueios: bloqueia conciliacao/fechamento se impacto material.

## 10. Capacidades de DRE

### Analisar DRE

- Descricao: explicar receitas, despesas, resultado, ajustes e pendencias por periodo.
- Quando ativar: perguntas gerenciais, fechamento, divergencias.
- Exemplos: "Analise a DRE de maio".
- Modulos envolvidos: DRE, Financeiro, Dashboard, Socios.
- Tabelas envolvidas: `financial_entries`, `dre_categories`, `dre_manual_adjustments`, `dre_monthly_closings`, `partner_entries`.
- Skills necessarias: financial summarization, category grouping.
- Dados obrigatorios: periodo.
- Dados opcionais: categoria, comparativo.
- Validacoes: categorias, ajustes, competencias.
- Riscos: explicar DRE sem verificar fonte.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional; recomendado em fechamento.
- Resultado esperado: resumo DRE, pendencias e divergencias.
- Bloqueios: nenhum para leitura.

### Conciliar DRE x financeiro

- Descricao: comparar DRE operacional com lancamentos por categoria/competencia.
- Quando ativar: fechamento, divergencia de resultado.
- Exemplos: "DRE bate com financeiro?".
- Modulos envolvidos: DRE, Financeiro.
- Tabelas envolvidas: `financial_entries`, `dre_categories`, `dre_manual_adjustments`.
- Skills necessarias: reconciliation, category mapping.
- Dados obrigatorios: periodo.
- Dados opcionais: categoria.
- Validacoes: competencia, categoria, ajustes.
- Riscos: fechamento incorreto.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: total DRE, total financeiro, diferenca e causas.
- Bloqueios: bloqueia fechamento.

### Conciliar DRE x dashboard

- Descricao: comparar indicadores do dashboard com DRE.
- Quando ativar: divergencia gerencial, fechamento.
- Exemplos: "Por que DRE e dashboard nao batem?".
- Modulos envolvidos: DRE, Dashboard, Financeiro.
- Tabelas envolvidas: DRE e views de dashboard.
- Skills necessarias: indicator source tracing.
- Dados obrigatorios: periodo/indicador.
- Dados opcionais: categoria.
- Validacoes: filtros, periodo, status, ajustes.
- Riscos: corrigir indicador errado.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: diferenca e origem provavel.
- Bloqueios: bloqueia fechamento se sem explicacao.

### Detectar categoria ausente

- Descricao: encontrar lancamentos sem categoria DRE.
- Quando ativar: DRE, financeiro, fechamento.
- Exemplos: "Categorias ausentes".
- Modulos envolvidos: DRE, Financeiro.
- Tabelas envolvidas: `financial_entries`, `dre_categories`.
- Skills necessarias: missing-field audit.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo.
- Validacoes: categoria ausente/inativa.
- Riscos: DRE incompleta.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: lista de lancamentos.
- Bloqueios: bloqueia fechamento.

### Detectar ajuste manual

- Descricao: identificar ajustes que alteram DRE.
- Quando ativar: analise DRE, fechamento, auditoria.
- Exemplos: "Quais ajustes manuais existem em maio?".
- Modulos envolvidos: DRE, Financeiro.
- Tabelas envolvidas: `dre_manual_adjustments`, `dre_categories`.
- Skills necessarias: adjustment tracing.
- Dados obrigatorios: periodo.
- Dados opcionais: categoria.
- Validacoes: motivo, responsavel, valor anterior/novo.
- Riscos: ajuste mascarar problema.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: ajustes e impacto.
- Bloqueios: fechamento bloqueado se ajuste sem justificativa.

### Sugerir ajuste DRE

- Descricao: propor ajuste DRE sem executar automaticamente.
- Quando ativar: divergencia com causa identificada e sem correcao direta simples.
- Exemplos: "Gerar ajuste sugerido".
- Modulos envolvidos: DRE, Financeiro, Fechamento.
- Tabelas envolvidas: `dre_manual_adjustments`, `dre_categories`.
- Skills necessarias: adjustment proposal, impact preview.
- Dados obrigatorios: ano, mes, categoria, valor atual, novo valor, motivo.
- Dados opcionais: evidencia.
- Validacoes: motivo forte, categoria real, impacto, periodo.
- Riscos: mascarar erro de origem.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase; futuramente reforcada.
- Logs necessarios: suggest/apply_dre_adjustment, before/after, motivo.
- Resultado esperado: sugestao clara, nao execucao.
- Bloqueios: sem justificativa, divergencia de origem corrigivel no financeiro.

### Preparar fechamento DRE

- Descricao: reunir validacoes para fechamento mensal da DRE.
- Quando ativar: "Preparar fechamento", "Fechar maio".
- Exemplos: "Prepare a DRE para fechamento".
- Modulos envolvidos: DRE, Financeiro, Banco, Dashboard, Socios.
- Tabelas envolvidas: `financial_entries`, `dre_categories`, `dre_manual_adjustments`, `dre_monthly_closings`, `bank_accounts`, `partner_entries`.
- Skills necessarias: closing checklist, reconciliation.
- Dados obrigatorios: mes/ano.
- Dados opcionais: conta, saldo informado.
- Validacoes: categorias, ajustes, banco, dashboard.
- Riscos: fechamento incorreto.
- Criticidade: Critica.
- Pode executar hoje: Parcial, diagnostico.
- Precisa endpoint futuro: Nao para preparo; sim para fechamento.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: pronto/bloqueado com pendencias.
- Bloqueios: divergencia critica.

### Bloquear fechamento com divergencia

- Descricao: impedir fechamento quando houver risco critico.
- Quando ativar: checklist de fechamento.
- Exemplos: "Nao fechar se houver divergencia".
- Modulos envolvidos: DRE, Fechamento, Financeiro, Banco, Dashboard.
- Tabelas envolvidas: fontes de fechamento.
- Skills necessarias: risk classification.
- Dados obrigatorios: diagnostico de divergencias.
- Dados opcionais: tolerancias aprovadas.
- Validacoes: criticidade, materialidade, justificativas.
- Riscos: fechar resultado errado.
- Criticidade: Critica.
- Pode executar hoje: Parcial como regra documental.
- Precisa endpoint futuro: Nao para bloqueio logico; sim para fechamento.
- Precisa preview: Sim.
- Confirmacao: Nunca automatico.
- Logs necessarios: blocked_closing_reason.
- Resultado esperado: fechamento bloqueado com explicacao.
- Bloqueios: qualquer divergencia critica sem resolucao.

## 11. Capacidades de Fechamento Mensal

### Rodar checklist de fechamento

- Descricao: executar checklist completo de validacoes do mes.
- Quando ativar: "Fechar maio", "Validar fechamento".
- Exemplos: "Feche maio", "Rode o checklist de junho".
- Modulos envolvidos: Financeiro, Contratos, Parcelas, Estoque, Banco, DRE, Dashboard, Socios.
- Tabelas envolvidas: `financial_entries`, `contracts`, `installments`, `equipment`, `contract_equipment`, `bank_accounts`, `dre_*`, `partner_entries`, views de dashboard.
- Skills necessarias: orchestration, reconciliation, risk scoring.
- Dados obrigatorios: mes/ano.
- Dados opcionais: conta, saldo informado, tolerancia.
- Validacoes: todas as validacoes abaixo.
- Riscos: parecer fechado sem verificar fontes.
- Criticidade: Critica.
- Pode executar hoje: Parcial, como diagnostico.
- Precisa endpoint futuro: Nao para diagnostico; sim para registrar fechamento.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_checklist_run.
- Resultado esperado: status pronto/pendente/bloqueado.
- Bloqueios: divergencias criticas.

### Validar financeiro

- Descricao: checar lancamentos do periodo.
- Quando ativar: fechamento mensal.
- Exemplos: "Valide financeiro de maio".
- Modulos envolvidos: Financeiro, DRE, Banco.
- Tabelas envolvidas: `financial_entries`, `dre_categories`, `bank_accounts`.
- Skills necessarias: missing fields, duplicate detection, date validation.
- Dados obrigatorios: mes/ano.
- Dados opcionais: tipo/status.
- Validacoes: categoria, conta, competencia, vencimento, status, duplicidade.
- Riscos: resultado errado.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_financial.
- Resultado esperado: lista de pendencias.
- Bloqueios: sem categoria, duplicidades, contas ausentes relevantes.

### Validar contratos

- Descricao: verificar contratos ativos, vencidos, sem financeiro ou parcelas.
- Quando ativar: fechamento.
- Exemplos: "Valide contratos do mes".
- Modulos envolvidos: Contratos, Financeiro, Parcelas.
- Tabelas envolvidas: `contracts`, `installments`, `financial_entries`.
- Skills necessarias: contract period analysis, expected revenue.
- Dados obrigatorios: mes/ano.
- Dados opcionais: status/cliente.
- Validacoes: ativo no periodo, receita, parcelas, vencimento.
- Riscos: receita ausente.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_contracts.
- Resultado esperado: contratos ok/pendentes.
- Bloqueios: contrato ativo sem financeiro/parcelas.

### Validar estoque

- Descricao: verificar estoque e vinculos de locacao.
- Quando ativar: fechamento ou auditoria operacional.
- Exemplos: "Valide estoque no fechamento".
- Modulos envolvidos: Equipamentos, Contratos, Manutencoes.
- Tabelas envolvidas: `equipment`, `contract_equipment`, `contracts`, `maintenance_orders`.
- Skills necessarias: stock reconciliation.
- Dados obrigatorios: mes/ano ou snapshot atual.
- Dados opcionais: categoria.
- Validacoes: estoque negativo, contrato sem equipamento, locado sem contrato.
- Riscos: disponibilidade falsa.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_stock.
- Resultado esperado: pendencias de estoque.
- Bloqueios: estoque negativo e locacao inconsistente.

### Validar banco

- Descricao: reconciliar saldo bancario e financeiro.
- Quando ativar: fechamento.
- Exemplos: "Valide banco".
- Modulos envolvidos: Banco, Financeiro.
- Tabelas envolvidas: `bank_accounts`, `financial_entries`.
- Skills necessarias: bank reconciliation.
- Dados obrigatorios: mes/ano; conta ou todas.
- Dados opcionais: saldo informado.
- Validacoes: saldo, conta, data de pagamento, status.
- Riscos: fechamento com caixa errado.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_bank.
- Resultado esperado: saldo conciliado ou divergencia.
- Bloqueios: diferenca sem explicacao.

### Validar DRE

- Descricao: verificar resultado, categorias, ajustes e consistencia.
- Quando ativar: fechamento.
- Exemplos: "Valide DRE".
- Modulos envolvidos: DRE, Financeiro.
- Tabelas envolvidas: `financial_entries`, `dre_categories`, `dre_manual_adjustments`, `dre_monthly_closings`.
- Skills necessarias: DRE reconciliation.
- Dados obrigatorios: mes/ano.
- Dados opcionais: categoria.
- Validacoes: DRE x financeiro, ajustes, categorias.
- Riscos: resultado incorreto.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_dre.
- Resultado esperado: DRE consistente ou pendencias.
- Bloqueios: categoria ausente, ajuste sem justificativa, divergencia.

### Validar dashboard

- Descricao: comparar indicadores do dashboard com fontes.
- Quando ativar: fechamento ou divergencia gerencial.
- Exemplos: "Valide dashboard".
- Modulos envolvidos: Dashboard, Financeiro, DRE, Contratos, Estoque.
- Tabelas envolvidas: views de dashboard e fontes.
- Skills necessarias: indicator tracing.
- Dados obrigatorios: periodo/indicadores.
- Dados opcionais: modulo.
- Validacoes: periodo, status, fonte.
- Riscos: indicador gerencial errado.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_dashboard.
- Resultado esperado: indicadores batendo ou divergencias.
- Bloqueios: divergencia critica sem explicacao.

### Validar socios

- Descricao: verificar distribuicoes e resultado antes de socios.
- Quando ativar: fechamento e distribuicao.
- Exemplos: "Valide socios no fechamento".
- Modulos envolvidos: Socios, DRE, Financeiro.
- Tabelas envolvidas: `partners`, `partner_entries`, `partner_distribution_rules`, DRE.
- Skills necessarias: distribution analysis.
- Dados obrigatorios: periodo.
- Dados opcionais: socio.
- Validacoes: resultado fechado, lancamentos duplicados, distribuicao antes de fechamento.
- Riscos: distribuir lucro errado.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_validate_partners.
- Resultado esperado: distribuicao ok/pendente.
- Bloqueios: distribuicao antes de fechamento confiavel.

### Gerar diagnostico de fechamento

- Descricao: consolidar todas as pendencias e criticidades do mes.
- Quando ativar: final do checklist.
- Exemplos: "Diagnostico do fechamento".
- Modulos envolvidos: todos os modulos de fechamento.
- Tabelas envolvidas: fontes do checklist.
- Skills necessarias: summary, risk scoring, prioritization.
- Dados obrigatorios: resultados de validacoes.
- Dados opcionais: filtros.
- Validacoes: criticidade e impacto.
- Riscos: omitir pendencia critica.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_diagnosis.
- Resultado esperado: status, pendencias, bloqueios, proximos passos.
- Bloqueios: divergencias criticas.

### Sugerir correcoes

- Descricao: propor acoes para resolver pendencias de fechamento.
- Quando ativar: apos diagnostico.
- Exemplos: "Como corrigir?", "Gerar correcoes sugeridas".
- Modulos envolvidos: conforme pendencias.
- Tabelas envolvidas: conforme pendencias.
- Skills necessarias: remediation planning.
- Dados obrigatorios: diagnostico.
- Dados opcionais: prioridade.
- Validacoes: cada sugestao aponta origem e impacto.
- Riscos: sugerir ajuste em indicador em vez da origem.
- Criticidade: Alta.
- Pode executar hoje: Parcial, apenas sugestao.
- Precisa endpoint futuro: Nao para sugestao; sim para executar correcoes.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recommended_fixes.
- Resultado esperado: plano de correcao ordenado.
- Bloqueios: nao executar correcao bloqueada por fase.

### Revalidar fechamento

- Descricao: rodar novamente validacoes apos correcoes.
- Quando ativar: depois de pendencias corrigidas.
- Exemplos: "Revalide maio".
- Modulos envolvidos: fechamento completo.
- Tabelas envolvidas: fontes do checklist.
- Skills necessarias: repeatable validation, diff from previous run.
- Dados obrigatorios: mes/ano.
- Dados opcionais: diagnostico anterior.
- Validacoes: pendencias resolvidas.
- Riscos: assumir resolucao sem nova leitura.
- Criticidade: Critica.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: closing_revalidation.
- Resultado esperado: pronto para fechamento ou novas pendencias.
- Bloqueios: qualquer divergencia critica restante.

### Registrar fechamento mensal

- Descricao: gravar fechamento mensal oficial.
- Quando ativar: somente apos checklist sem criticos e fase aprovada.
- Exemplos: "Registrar fechamento de maio".
- Modulos envolvidos: DRE, Financeiro, Banco, Dashboard, Socios.
- Tabelas envolvidas: `dre_monthly_closings`, fontes de fechamento.
- Skills necessarias: governed execution, final preview, audit logging.
- Dados obrigatorios: mes/ano, totais, status, responsavel.
- Dados opcionais: observacoes.
- Validacoes: checklist aprovado, sem divergencias criticas.
- Riscos: fechar mes incorreto.
- Criticidade: Critica.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase; futuramente confirmacao reforcada.
- Logs necessarios: monthly_closing_recorded, snapshot, responsavel.
- Resultado esperado: fechamento registrado.
- Bloqueios: divergencia critica, checklist incompleto, fase nao aprovada.

## 12. Capacidades de Documentos

### Anexar documento

- Descricao: fazer upload e criar registro de documento.
- Quando ativar: contrato, cliente, financeiro, juridico ou comprovante.
- Exemplos: "Anexar este contrato ao cliente", "Anexar comprovante".
- Modulos envolvidos: Documentos e entidade destino.
- Tabelas envolvidas: `documents`, storage, `cos_action_logs`.
- Skills necessarias: file handling, entity resolution, upload validation.
- Dados obrigatorios: arquivo, tipo.
- Dados opcionais: cliente, contrato, financeiro, equipamento, juridico, observacoes.
- Validacoes: arquivo disponivel; destino resolvido; tipo; duplicidade.
- Riscos: vincular documento errado.
- Criticidade: Media.
- Pode executar hoje: Sim.
- Precisa endpoint futuro: Ja existe; vinculos avancados podem exigir evolucao.
- Precisa preview: Sim.
- Confirmacao: Confirmacao simples.
- Logs necessarios: attach_document, destino, arquivo.
- Resultado esperado: documento anexado com URL/registro.
- Bloqueios: arquivo ausente, destino ambiguo, erro de storage.

### Buscar documento

- Descricao: localizar documentos por nome, tipo ou vinculo.
- Quando ativar: auditoria, contrato, juridico, financeiro.
- Exemplos: "Ache contrato assinado", "Documentos da ATIBAIA".
- Modulos envolvidos: Documentos, Clientes, Contratos, Financeiro, Juridico.
- Tabelas envolvidas: `documents`.
- Skills necessarias: document search.
- Dados obrigatorios: filtro.
- Dados opcionais: tipo, periodo, entidade.
- Validacoes: entidade resolvida.
- Riscos: retornar documento errado.
- Criticidade: Baixa.
- Pode executar hoje: Sim/parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: documentos encontrados.
- Bloqueios: ambiguidade antes de vincular/editar.

### Vincular documento

- Descricao: associar documento existente a entidade correta.
- Quando ativar: documento sem vinculo ou vinculo errado.
- Exemplos: "Vincule este PDF ao contrato".
- Modulos envolvidos: Documentos e entidade destino.
- Tabelas envolvidas: `documents`, destino.
- Skills necessarias: entity resolution, diff preview.
- Dados obrigatorios: documento, destino.
- Dados opcionais: observacao.
- Validacoes: documento e destino unicos; impacto de auditoria.
- Riscos: evidencia no registro errado.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Sim para update seguro.
- Precisa preview: Sim.
- Confirmacao: Confirmacao simples; reforcada se juridico/contrato.
- Logs necessarios: link_document, before/after.
- Resultado esperado: documento vinculado.
- Bloqueios: documento/destino ambiguo.

### Detectar documento sem vinculo

- Descricao: listar documentos sem entidade operacional.
- Quando ativar: auditoria documental.
- Exemplos: "Documentos sem vinculo".
- Modulos envolvidos: Documentos.
- Tabelas envolvidas: `documents`.
- Skills necessarias: missing relationship audit.
- Dados obrigatorios: nenhum.
- Dados opcionais: periodo/tipo.
- Validacoes: todos os ids de vinculo nulos.
- Riscos: documento sem utilidade operacional.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: lista de documentos soltos.
- Bloqueios: nenhum.

### Detectar contrato sem documento

- Descricao: encontrar contratos sem documento/anexo.
- Quando ativar: auditoria, fechamento, renovacao.
- Exemplos: "Contratos sem documento".
- Modulos envolvidos: Contratos, Documentos.
- Tabelas envolvidas: `contracts`, `documents`.
- Skills necessarias: relationship audit.
- Dados obrigatorios: periodo/status.
- Dados opcionais: cliente.
- Validacoes: contrato ativo, documento vinculado ou URL.
- Riscos: inseguranca juridica/operacional.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em auditoria.
- Resultado esperado: contratos pendentes de documento.
- Bloqueios: pode bloquear criacao financeira/fechamento conforme politica.

### Detectar comprovante financeiro ausente

- Descricao: encontrar lancamentos pagos/recebidos sem comprovante/anexo.
- Quando ativar: auditoria financeira.
- Exemplos: "Comprovantes ausentes".
- Modulos envolvidos: Financeiro, Documentos.
- Tabelas envolvidas: `financial_entries`, `documents`.
- Skills necessarias: document relationship audit.
- Dados obrigatorios: periodo.
- Dados opcionais: tipo/status.
- Validacoes: pago/recebido, anexo/documento.
- Riscos: falha de auditoria.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: lancamentos sem comprovante.
- Bloqueios: nenhum automatico; alerta em fechamento.

## 13. Capacidades de Juridico

### Buscar caso juridico

- Descricao: localizar caso por cliente, contrato, status, prazo ou processo.
- Quando ativar: cobranca, inadimplencia, auditoria.
- Exemplos: "Casos juridicos da ATIBAIA".
- Modulos envolvidos: Juridico, Clientes, Contratos, Financeiro, Documentos.
- Tabelas envolvidas: `legal_cases`, `clients`, `contracts`.
- Skills necessarias: entity search, deadline filtering.
- Dados obrigatorios: filtro.
- Dados opcionais: status, risco, prazo.
- Validacoes: cliente/contrato resolvido.
- Riscos: caso errado.
- Criticidade: Baixa.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: casos encontrados.
- Bloqueios: ambiguidade antes de editar.

### Criar caso juridico

- Descricao: abrir caso juridico vinculado a cliente/contrato/parcela.
- Quando ativar: inadimplencia, conflito, processo, notificacao.
- Exemplos: "Abrir caso juridico para cliente inadimplente".
- Modulos envolvidos: Juridico, Clientes, Contratos, Financeiro, Documentos.
- Tabelas envolvidas: `legal_cases`, possivelmente `documents`.
- Skills necessarias: risk assessment, entity resolution, legal preview.
- Dados obrigatorios: cliente, status, etapa/resumo.
- Dados opcionais: contrato, parcela, valores, prazo, advogado, documentos.
- Validacoes: cliente, contrato/parcela, duplicidade, valores, prazo.
- Riscos: juridico sem base, caso duplicado, cobranca errada.
- Criticidade: Alta.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: create_legal_case, origem, valores, vinculos.
- Resultado esperado: caso criado e rastreavel.
- Bloqueios: cliente nao resolvido, duplicidade, falta de causa.

### Editar caso juridico

- Descricao: alterar status, etapa, valores, prazo ou acordo.
- Quando ativar: andamento juridico, acordo, encerramento.
- Exemplos: "Atualize status do caso", "Registrar acordo".
- Modulos envolvidos: Juridico, Financeiro, Documentos.
- Tabelas envolvidas: `legal_cases`, possivelmente acordos/documentos.
- Skills necessarias: diff preview, legal risk handling.
- Dados obrigatorios: caso resolvido, alteracao, justificativa.
- Dados opcionais: documento, valores.
- Validacoes: diff, prazo, valores, impacto financeiro.
- Riscos: acordo/valor errado, encerramento indevido.
- Criticidade: Alta.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: update_legal_case, before/after.
- Resultado esperado: caso atualizado com rastreabilidade.
- Bloqueios: caso ambiguo, processo duplicado, impacto financeiro sem preview.

### Detectar inadimplencia com risco juridico

- Descricao: encontrar clientes/contratos com atraso relevante.
- Quando ativar: cobranca, fechamento, juridico.
- Exemplos: "Quem tem risco juridico por inadimplencia?".
- Modulos envolvidos: Financeiro, Contratos, Clientes, Juridico.
- Tabelas envolvidas: `financial_entries`, `installments`, `clients`, `contracts`, `legal_cases`.
- Skills necessarias: overdue analysis, risk scoring.
- Dados obrigatorios: periodo ou criterio.
- Dados opcionais: dias atraso, valor minimo.
- Validacoes: vencimento, status, cliente, casos existentes.
- Riscos: acionar juridico indevidamente ou tarde demais.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: lista priorizada de riscos.
- Bloqueios: bloquear novo contrato se risco critico.

### Detectar prazo juridico proximo

- Descricao: listar casos com prazo proximo.
- Quando ativar: rotina juridica.
- Exemplos: "Prazos juridicos da semana".
- Modulos envolvidos: Juridico.
- Tabelas envolvidas: `legal_cases`.
- Skills necessarias: date filtering, risk prioritization.
- Dados obrigatorios: janela temporal.
- Dados opcionais: responsavel/status.
- Validacoes: `next_deadline`.
- Riscos: perder prazo.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: prazos ordenados.
- Bloqueios: nenhum; alerta prioritario.

### Diagnosticar valores juridicos em aberto

- Descricao: explicar valores originais, multa, juros, desconto, negociado e saldo.
- Quando ativar: cobranca, acordo, fechamento.
- Exemplos: "Qual valor em aberto no juridico?".
- Modulos envolvidos: Juridico, Financeiro, Contratos.
- Tabelas envolvidas: `legal_cases`, `financial_entries`, `installments`.
- Skills necessarias: value breakdown, reconciliation.
- Dados obrigatorios: caso/cliente.
- Dados opcionais: periodo.
- Validacoes: valores coerentes, pagamentos relacionados.
- Riscos: cobrar valor errado.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: composicao de saldo e pendencias.
- Bloqueios: acao juridica/financeira sem valor validado.

## 14. Capacidades de Socios

### Buscar socio

- Descricao: localizar socio, participacao ou lancamentos.
- Quando ativar: distribuicao, fechamento, consulta.
- Exemplos: "Mostrar socios", "Lancamentos do socio X".
- Modulos envolvidos: Socios, Financeiro, DRE.
- Tabelas envolvidas: `partners`, `partner_entries`, `partner_distribution_rules`.
- Skills necessarias: entity search.
- Dados obrigatorios: filtro opcional.
- Dados opcionais: periodo/status.
- Validacoes: socio ativo.
- Riscos: baixo em leitura.
- Criticidade: Baixa.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: socios e dados relacionados.
- Bloqueios: nenhum.

### Analisar distribuicao

- Descricao: analisar distribuicoes previstas/realizadas.
- Quando ativar: fechamento, resultado, socios.
- Exemplos: "Analise distribuicao de lucros".
- Modulos envolvidos: Socios, DRE, Financeiro.
- Tabelas envolvidas: `partner_entries`, `partners`, DRE.
- Skills necessarias: distribution calculation.
- Dados obrigatorios: periodo.
- Dados opcionais: socio.
- Validacoes: resultado do periodo, status, duplicidade.
- Riscos: distribuicao sobre resultado nao fechado.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: distribuicao esperada x realizada.
- Bloqueios: alerta se fechamento pendente.

### Conciliar socios x resultado

- Descricao: comparar lancamentos de socios com resultado operacional.
- Quando ativar: fechamento e distribuicao.
- Exemplos: "Socios batem com resultado?".
- Modulos envolvidos: Socios, DRE, Financeiro.
- Tabelas envolvidas: `partner_entries`, `partners`, DRE/financeiro.
- Skills necessarias: reconciliation.
- Dados obrigatorios: periodo.
- Dados opcionais: regra.
- Validacoes: resultado fechado, regras, valores.
- Riscos: distribuir valor incorreto.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado em fechamento.
- Resultado esperado: diferencas e pendencias.
- Bloqueios: distribuicao antes de fechamento confiavel.

### Detectar distribuicao antes do fechamento

- Descricao: identificar distribuicao/lancamento de socio antes do resultado validado.
- Quando ativar: fechamento, socios.
- Exemplos: "Houve distribuicao antes do fechamento?".
- Modulos envolvidos: Socios, DRE, Fechamento.
- Tabelas envolvidas: `partner_entries`, `dre_monthly_closings`.
- Skills necessarias: period status validation.
- Dados obrigatorios: periodo.
- Dados opcionais: socio/status.
- Validacoes: fechamento existe? resultado confiavel?
- Riscos: distribuicao indevida.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: distribuicoes suspeitas.
- Bloqueios: alerta/bloqueio de novas distribuicoes.

### Criar lancamento de socio

- Descricao: registrar aporte, retirada ou distribuicao de socio.
- Quando ativar: fase futura de socios.
- Exemplos: "Criar distribuicao para socio".
- Modulos envolvidos: Socios, Financeiro, DRE.
- Tabelas envolvidas: `partner_entries`, possivelmente `financial_entries`.
- Skills necessarias: distribution validation, closing awareness.
- Dados obrigatorios: socio, tipo, valor, competencia, status.
- Dados opcionais: financeiro vinculado, descricao.
- Validacoes: socio ativo, resultado fechado, valor, duplicidade.
- Riscos: distribuir antes do resultado, duplicar lancamento.
- Criticidade: Alta.
- Pode executar hoje: Nao.
- Precisa endpoint futuro: Sim.
- Precisa preview: Sim.
- Confirmacao: Bloqueado por fase.
- Logs necessarios: create_partner_entry.
- Resultado esperado: lancamento rastreavel.
- Bloqueios: fechamento pendente, socio ambiguo, valor invalido.

## 15. Capacidades de Dashboard e Relatorios

### Explicar indicador do dashboard

- Descricao: explicar origem de um indicador.
- Quando ativar: perguntas sobre receita, contratos, estoque, inadimplencia, lucro.
- Exemplos: "De onde vem esse numero no dashboard?".
- Modulos envolvidos: Dashboard e modulo-fonte.
- Tabelas envolvidas: views de dashboard e fontes.
- Skills necessarias: source tracing, explanation.
- Dados obrigatorios: indicador.
- Dados opcionais: periodo.
- Validacoes: fonte, filtro, periodo.
- Riscos: explicar indicador sem verificar fonte.
- Criticidade: Baixa.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Nao.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: explicacao e fonte.
- Bloqueios: nenhum.

### Diagnosticar indicador divergente

- Descricao: investigar indicador que nao bate com fonte operacional.
- Quando ativar: dashboard x DRE/financeiro/estoque.
- Exemplos: "Dashboard nao bate com DRE".
- Modulos envolvidos: Dashboard, DRE, Financeiro, Contratos, Estoque.
- Tabelas envolvidas: views e fontes.
- Skills necessarias: cross-source reconciliation.
- Dados obrigatorios: indicador/periodo.
- Dados opcionais: modulo.
- Validacoes: periodo, filtros, status, fonte.
- Riscos: corrigir dashboard em vez da origem.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao para diagnostico.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: origem provavel da divergencia.
- Bloqueios: bloqueia fechamento se indicador critico divergente.

### Gerar relatorio operacional

- Descricao: consolidar clientes, contratos, estoque, documentos e manutencoes.
- Quando ativar: acompanhamento de operacao.
- Exemplos: "Relatorio operacional da semana".
- Modulos envolvidos: Clientes, Contratos, Equipamentos, Documentos, Manutencoes.
- Tabelas envolvidas: fontes operacionais.
- Skills necessarias: report generation, prioritization.
- Dados obrigatorios: periodo/escopo.
- Dados opcionais: cliente/modulo.
- Validacoes: dados atuais e pendencias.
- Riscos: relatorio incompleto.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: resumo, pendencias e prioridades.
- Bloqueios: nenhum.

### Gerar relatorio financeiro

- Descricao: consolidar receitas, despesas, banco, DRE e pendencias.
- Quando ativar: rotina financeira.
- Exemplos: "Relatorio financeiro de maio".
- Modulos envolvidos: Financeiro, Banco, DRE, Dashboard.
- Tabelas envolvidas: `financial_entries`, `bank_accounts`, `dre_*`.
- Skills necessarias: financial reporting.
- Dados obrigatorios: periodo.
- Dados opcionais: conta, categoria.
- Validacoes: categorias, contas, status.
- Riscos: decisao baseada em dado incompleto.
- Criticidade: Media.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: opcional.
- Resultado esperado: resumo financeiro e pendencias.
- Bloqueios: nenhum; alertar divergencias.

### Gerar relatorio de fechamento

- Descricao: consolidar checklist, divergencias, correcoes e status do mes.
- Quando ativar: fechamento mensal.
- Exemplos: "Relatorio de fechamento de maio".
- Modulos envolvidos: todos os modulos de fechamento.
- Tabelas envolvidas: fontes do fechamento.
- Skills necessarias: closing reporting.
- Dados obrigatorios: mes/ano.
- Dados opcionais: diagnostico anterior.
- Validacoes: todas as validacoes de fechamento.
- Riscos: parecer pronto sem base.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado.
- Resultado esperado: status final, pendencias, bloqueios.
- Bloqueios: divergencias criticas.

### Gerar relatorio de pendencias criticas

- Descricao: listar problemas de alta/critica prioridade.
- Quando ativar: rotina diaria, fechamento, auditoria.
- Exemplos: "Quais pendencias criticas temos?".
- Modulos envolvidos: todos.
- Tabelas envolvidas: fontes operacionais.
- Skills necessarias: risk aggregation, prioritization.
- Dados obrigatorios: nenhum ou periodo.
- Dados opcionais: modulo.
- Validacoes: criticidade e impacto.
- Riscos: omitir risco critico.
- Criticidade: Alta.
- Pode executar hoje: Parcial.
- Precisa endpoint futuro: Nao.
- Precisa preview: Sim.
- Confirmacao: Nenhuma, apenas leitura.
- Logs necessarios: recomendado para auditoria.
- Resultado esperado: lista priorizada com acao sugerida.
- Bloqueios: nenhum direto; bloqueia acoes relacionadas.

## 16. Ordem recomendada de implementacao

### Fase 1 - Capacidades de leitura e diagnostico

- Buscar cliente, contrato, equipamento, lancamento e documento.
- Detectar duplicidades.
- Detectar ausencias criticas.
- Explicar dashboard.
- Gerar pendencias criticas.

### Fase 2 - Entrada estruturada para acoes ja permitidas

- Cadastrar cliente.
- Criar lancamento financeiro individual.
- Anexar documento.
- Melhorar preview e logs.

### Fase 3 - Resolvedor operacional de entidades

- Resolver cliente/contrato/equipamento por nome/documento.
- Mostrar candidatos.
- Bloquear ambiguidade.

### Fase 4 - Contratos e estoque assistidos

- Cadastrar contrato.
- Validar estoque.
- Projetar parcelas.
- Recalcular disponibilidade.

### Fase 5 - Conciliacoes e fechamento diagnostico

- Banco x financeiro.
- DRE x financeiro.
- DRE x dashboard.
- Contratos x financeiro.
- Estoque x contratos.
- Checklist de fechamento.

### Fase 6 - Edicoes controladas e DRE governada

- Edicoes com diff.
- Ajuste DRE com justificativa.
- Fechamento mensal apenas apos governanca aprovada.

## 17. Parecer executivo

O COS deve ser implementado por capacidades, nao por endpoints.

Endpoint e detalhe tecnico. Capacidade e responsabilidade operacional.

Cada capacidade deve declarar:

- quando ativa;
- o que consulta;
- o que valida;
- qual risco carrega;
- se pode executar hoje;
- se precisa preview;
- qual confirmacao exige;
- quais logs precisa gerar;
- quando deve bloquear.

Este mapa deve ser usado como contrato de implementacao: nenhuma nova acao do COS deve ser criada sem antes existir como capacidade documentada, classificada e governada.

