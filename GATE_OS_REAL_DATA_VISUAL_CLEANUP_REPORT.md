# GATE OS - Relatorio de limpeza visual de dados reais

Data: 2026-06-11

## Objetivo

Remover dados ficticios da interface, evitar UUIDs como labels para usuario final, corrigir edicao real de socios, gerar relatorios sem popup e melhorar atividades recentes do Dashboard.

## Selects corrigidos

- Financeiro:
  - Categoria DRE salva `dre_category_id` e exibe `name` ou `description`.
  - Conta bancaria salva `bank_account_id` e exibe `name`, `bank_name` ou `account_name`.
  - Cliente salva `client_id` e exibe `name`, `legal_name` ou `company_name`.
- Documentos:
  - Cliente salva `client_id` e exibe nome amigavel.
  - Contrato salva `contract_id` e exibe numero do contrato + cliente quando disponivel.
- Contratos:
  - Cliente salva `client_id` e exibe nome amigavel.
  - Equipamento salva `equipment_id` e exibe nome amigavel + quantidade disponivel no texto da opcao.
- Socios:
  - Lancamento salva `partner_id` quando disponivel e exibe `name`.

Fallback universal adicionado: `Registro sem nome`, sem exibir UUID como label principal.

## Onde havia UUID sendo exibido

- Financeiro podia cair para `record.id` em categorias, contas e clientes.
- Documentos podia cair para `record.id` em clientes e contratos.
- Contratos podia cair para `record.id` em clientes/equipamentos.
- Socios usava texto livre/fixo em vez de select por socio real.

## Dados mockados removidos

- Tela Analise:
  - Removidos KPIs hardcoded como Ticket Medio, CAC, LTV, Churn Rate, NPS e ROI.
  - Removidos alertas falsos de contratos, Fribal, meta de receita e manutencao preventiva.
  - Removidos graficos hardcoded de receita, categorias, performance e metas.
  - Removido ranking falso de clientes.

## Dados reais preservados

- Analise agora usa somente:
  - `contracts`
  - `financial_entries`
  - `clients`
  - `equipment`
  - `maintenance_orders`
  - `installments`
- Dashboard manteve:
  - `notifications`
  - `contracts`
  - `financial_entries`
  - `installments`
  - `equipment`
  - views financeiras ja integradas.

## Origem dos cards reais

- Analise:
  - MRR/ARR: contratos ativos.
  - Ticket medio: MRR dividido por contratos ativos.
  - Clientes: `clients`.
  - Equipamentos: `equipment`.
  - Inadimplencia: `installments`.
  - Manutencoes abertas: `maintenance_orders`.
- Dashboard:
  - Atividades recentes: `notifications`.
  - Cards inferiores: contratos, parcelas, lancamentos financeiros e views ja carregadas no Dashboard.

## Edicao de socio corrigida

- O botao Editar abre modal real.
- Dados sao carregados da tabela `partners`.
- Update real executado via `updatePartner`.
- Allowlist de colunas em `partners` adicionada no helper Supabase.
- Lista local atualiza apos retorno do Supabase.
- Erro real e exibido via toast.

## Geracao de relatorio corrigida

- Exportacao PDF deixou de usar `window.open`.
- PDF passa a ser gerado como Blob e baixado diretamente.
- Botoes de historico/impressao usam template universal em vez de `window.print()` bruto.
- Sem popup bloqueavel.

## Pendencias reais

- Sem biblioteca PDF dedicada no projeto, o PDF gerado e simples e textual, mas e um arquivo PDF real baixado via Blob.
- Alguns modulos ainda possuem CTAs de funcionalidades futuras com mensagem informativa, sem sucesso falso.
- Validacao visual de PDF deve ser feita no navegador apos deploy.

## Como testar

- Abrir Financeiro e conferir labels de Categoria DRE, Conta bancaria e Cliente.
- Abrir Documentos e conferir labels de Cliente e Contrato.
- Abrir Contratos e conferir Cliente/Equipamento sem UUID.
- Abrir Analise e confirmar que nao ha alertas ou graficos ficticios.
- Abrir Socios, clicar em Editar, alterar um campo e salvar.
- Gerar relatorio e confirmar download direto de PDF.
- Abrir Dashboard e conferir atividades recentes com data formatada em pt-BR.
- Executar `npm run lint`.
- Executar `npm run build`.
