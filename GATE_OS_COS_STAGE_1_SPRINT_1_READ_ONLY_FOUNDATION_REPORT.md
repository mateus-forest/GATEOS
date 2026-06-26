# GATE OS - COS Etapa 1 / Sprint 1 - Read Only Foundation

## Escopo

Implementada a base tecnica inicial da Etapa 1 do COS em modo read-only.

Esta sprint nao criou endpoint de escrita, nao alterou banco, nao alterou Supabase, nao alterou Auth, Login, Usuarios, Sessao, RLS, Dashboard, DRE, Financeiro, Contratos, Clientes ou Equipamentos fora do fluxo de leitura do COS.

## Arquivos alterados

- `lib/cos/cos-context.ts`
- `lib/cos/cos-router.ts`

## Arquivos criados

- `lib/cos/read-only-guardrail.ts`
- `lib/cos/read-only-capabilities.ts`
- `lib/cos/read-only-router.ts`
- `lib/cos/read-only-tools.ts`
- `lib/cos/read-only-responses.ts`
- `GATE_OS_COS_STAGE_1_SPRINT_1_READ_ONLY_FOUNDATION_REPORT.md`

## O que foi implementado

- Guardrail central para bloquear intents de escrita no fluxo textual do COS.
- Router read-only executado antes do router legado de perguntas.
- Catalogo inicial de capabilities read-only.
- Mensagens padronizadas para bloqueio de escrita.
- Query layer read-only usando `selectCosRows` e helpers de leitura existentes.
- Buscas iniciais para:
  - clientes;
  - contratos;
  - equipamentos/estoque;
  - financeiro.
- Diagnosticos iniciais read-only para:
  - banco x financeiro;
  - DRE x financeiro;
  - checklist conceitual de fechamento.
- Explicacoes operacionais sobre:
  - contratos;
  - DRE;
  - dashboard;
  - fechamento;
  - dependencias gerais do sistema.

## Como o guardrail read-only funciona

O arquivo `read-only-guardrail.ts` detecta termos de escrita antes de qualquer capability read-only ou router legado.

Quando detecta escrita, o COS responde:

```text
Nesta etapa eu ainda nao posso executar alteracoes. Posso consultar dados reais, validar riscos e preparar um diagnostico ou preview conceitual.
```

Para pedidos de fechamento, o guardrail bloqueia a execucao e retorna somente checklist/diagnostico read-only.

## Intents bloqueadas

- Criacao/cadastro: `cadastre`, `cadastrar`, `crie`, `criar`, `registrar`, `lancar`.
- Edicao: `edite`, `editar`, `altere`, `atualizar`, `corrigir`, `mudar`.
- Exclusao: `excluir`, `apagar`, `remover`, `delete`.
- Anexacao/upload: `anexar`, `anexe`, `upload`, `subir arquivo`.
- Baixa financeira: `baixar pagamento`, `marcar como pago`, `dar baixa`.
- Ajuste DRE: `corrigir DRE`, `ajustar DRE`, `alterar DRE`.
- Fechamento mensal: `fechar`, `feche`, `registrar fechamento`.
- Execucao em massa: `executar tudo`, `confirmar tudo`, `criar todos`.

## Consultas read-only liberadas

- `clients` para busca de clientes, status e duplicidades iniciais.
- `contracts` para contratos ativos, vencidos, vencendo e busca por criterio.
- `equipment` para disponibilidade, locados e manutencao.
- `financial_entries` para receitas, despesas, em aberto, periodo e diagnosticos.
- `bank_accounts` para diagnostico banco x financeiro.
- `dre_historical_values` e `financial_entries` via helpers existentes para resumo DRE.
- Fontes auxiliares ja usadas pelo COS legado, sempre em leitura.

## Preservacao de fluxos existentes

- `/api/cos` continua igual.
- Upload e analise de arquivos continuam roteados para `analyzeCosFiles`.
- Router legado continua funcionando como fallback quando o novo router read-only nao reconhece a pergunta.
- Acoes antigas nao foram removidas.
- O novo fluxo textual read-only nao chama endpoints de acao.

## Validacao executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

Observacao:

- `npx tsc --noEmit` foi testado durante a implementacao e falhou em `.next/dev/types/routes.d.ts`, artefato gerado fora deste escopo. O build de producao passou.

## Limitacoes

- Busca ainda e heuristica por termos e campos conhecidos.
- Nao ha UI nova para escolher candidatos ambiguos.
- Diagnosticos sao iniciais e explicativos, nao conciliacoes completas.
- Fechamento mensal ainda e checklist conceitual/read-only.
- Documentos, juridico e socios ainda dependem majoritariamente do router legado ou proximas sprints.
- Nenhum log operacional em banco foi criado nesta etapa, para preservar o escopo 100% read-only.

## Proximos passos

1. Expandir busca read-only para documentos, juridico e socios.
2. Criar respostas estruturadas com candidatos quando houver ambiguidade.
3. Aprofundar diagnosticos de contrato sem financeiro, contrato sem equipamento e estoque negativo.
4. Aprofundar DRE x financeiro x dashboard.
5. Criar testes automatizados para guardrail read-only.
6. Criar suite manual de perguntas reais por modulo.

## Parecer

A Sprint 1 estabelece a primeira camada operacional read-only do COS. O COS passa a bloquear pedidos de escrita no fluxo textual novo, responder buscas iniciais com dados reais e gerar diagnosticos sem alterar dados.

