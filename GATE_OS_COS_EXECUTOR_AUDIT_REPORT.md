# GATE OS - Auditoria estrategica para COS Executor Operacional

## 1. Visao geral

Esta auditoria mapeia o GATE OS para preparar uma futura estrategia do COS como executor operacional baseado em entrada estruturada no chat.

A nova direcao reduz dependencia de extracao automatica de contratos/documentos e prioriza este fluxo:

Usuario informa dados revisados ou semi-estruturados -> COS interpreta -> valida -> abre preview humano -> confirma -> executa acao segura -> registra log real.

Esta auditoria nao altera codigo funcional, banco, Supabase, Auth, RLS, endpoints, parser, DRE, Dashboard ou regras de negocio.

## 2. Mapa de rotas

### Paginas

| Rota | Arquivo | Modulo | Finalidade |
|---|---|---|---|
| `/` | `app/page.tsx` | Entrada | Pagina inicial/redirect conforme app. |
| `/login` | `app/login/page.tsx` | Auth/Login | Autenticacao via `components/login-form.tsx`. Nao deve ser manipulado pelo COS. |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard | Indicadores e resumo operacional. |
| `/clientes` | `app/clientes/page.tsx` | Clientes | Listagem, filtros, cadastro e detalhe de clientes. |
| `/clientes/[id]` | `app/clientes/[id]/page.tsx` | Clientes | Detalhe de cliente. |
| `/contratos` | `app/contratos/page.tsx` | Contratos | Listagem, cadastro de contrato, vinculo de equipamentos, parcelas. |
| `/contratos/[id]` | `app/contratos/[id]/page.tsx` | Contratos | Detalhe de contrato. |
| `/cliente/contrato/[token]` | `app/cliente/contrato/[token]/page.tsx` | Portal publico | Consulta publica de contrato e abertura de chamado. |
| `/equipamentos` | `app/equipamentos/page.tsx` | Equipamentos | Inventario e cadastro de equipamentos. |
| `/financeiro` | `app/financeiro/page.tsx` | Financeiro | Lancamentos, contas bancarias, anexos financeiros. |
| `/documentos` | `app/documentos/page.tsx` | Documentos | Upload e vinculacao de documentos. |
| `/dre` | `app/dre/page.tsx` | DRE | DRE operacional, historica, importacoes, ajustes e fechamentos. |
| `/juridico` | `app/juridico/page.tsx` | Juridico | Casos juridicos, cobrancas, acordos. |
| `/socios` | `app/socios/page.tsx` | Socios | Socios, aportes, distribuicoes e edicao de socios. |
| `/manutencoes` | `app/manutencoes/page.tsx` | Manutencoes | Ordens/chamados de manutencao. |
| `/patrimonio` | `app/patrimonio/page.tsx` | Patrimonio | Ativos/patrimonio. |
| `/relatorios` | `app/relatorios/page.tsx` | Relatorios | Exportacoes e relatorios. |
| `/analise` | `app/analise/page.tsx` | Analise | Analises gerenciais. |
| `/configuracoes` | `app/configuracoes/page.tsx` | Configuracoes | Configuracoes visuais/operacionais. Nao deve ser alterado pelo COS executor. |

### APIs existentes

| Metodo | Rota | Finalidade atual | Pode ser usado pelo COS hoje |
|---|---|---|---|
| POST | `/api/cos` | Perguntas ao COS ou analise de arquivos. | Sim, fluxo principal. |
| POST | `/api/cos/actions/create-client` | Cadastrar cliente individual apos revisao. | Sim, ja permitido. |
| POST | `/api/cos/actions/create-financial-entry` | Criar lancamento financeiro individual apos revisao. | Sim, ja permitido. |
| POST | `/api/cos/actions/attach-document` | Anexar documento original ao Storage e criar registro. | Sim, ja permitido. |

Nao ha endpoints REST dedicados para clientes, contratos, equipamentos, DRE, juridico ou dashboard fora do COS. As telas usam helpers client-side em `lib/data/*`, que falam diretamente com Supabase.

## 3. Mapa de modulos

| Modulo | Componentes principais | Helpers de dados | Papel operacional |
|---|---|---|---|
| Layout/Header/COS | `components/header.tsx`, `components/internal-layout.tsx`, `components/sidebar.tsx` | `lib/cos/*` | Navegacao, busca global, chat COS, upload, preview, revisao, acoes COS. |
| Clientes | `components/clientes-content.tsx`, `app/clientes/[id]/page.tsx` | `lib/data/clients.ts` | Cadastro, consulta e status de clientes. |
| Contratos | `components/contratos-content.tsx` | `lib/data/contracts.ts`, `lib/data/installments.ts`, `lib/data/equipment.ts` | Contrato, vinculo de equipamentos, estoque e parcelas. |
| Equipamentos | `components/equipamentos-content.tsx` | `lib/data/equipment.ts` | Inventario e disponibilidade. |
| Financeiro | `components/financeiro-content.tsx` | `lib/data/financial.ts`, `lib/data/financial-status.ts`, `lib/data/documents.ts` | Lancamentos, contas bancarias, DRE categoria, anexos. |
| Documentos | `components/documentos-content.tsx` | `lib/data/documents.ts` | Upload, Storage e vinculos com entidades. |
| DRE | `components/dre-content.tsx`, `lib/dre-import-parser.ts` | `lib/data/dre.ts`, `lib/data/recurring-revenue.ts` | DRE operacional/historica, importacao, ajustes, fechamento. |
| Juridico | `components/juridico-content.tsx` | `lib/data/legal.ts`, `lib/juridico-data.ts` | Casos juridicos, acordos, valores atualizados. |
| Socios | `components/socios-content.tsx` | `lib/data/partners.ts`, `lib/data/profit-distribution.ts` | Lancamentos de socios e regras de distribuicao. |
| Manutencoes | `components/manutencoes-content.tsx`, portal publico | `lib/data/maintenance.ts` | Chamados e ordens de manutencao. |
| Dashboard | `components/dashboard-content.tsx` | `lib/data/dashboard.ts` | Indicadores calculados a partir de tabelas e views. |

## 4. Mapa de tabelas e campos relevantes

Fonte principal: `lib/data/supabase-helpers.ts`, SQLs em `supabase/` e componentes de formulario.

### `clients`

Campos gravaveis conhecidos:

- Identidade: `name`, `legal_name`, `company_name`, `fantasy_name`, `trade_name`, `document_number`, `document`, `type`.
- Contato: `email`, `phone`, `whatsapp`.
- Endereco: `address`, `city`, `state`, `zip_code`, `address_zipcode`, `address_street`, `address_number`, `address_complement`, `address_neighborhood`, `address_city`, `address_state`, `district`, `street`, `number`, `complement`.
- Operacao: `status`, `notes`.

Obrigatorios na UI:

- `name`.
- `status`.

Status usados:

- `ativo`, `inativo`, `inadimplente`.

Validacoes atuais:

- `MockCreateDialog` valida apenas campos marcados como obrigatorios.
- Endpoint COS valida nome limpo, documento duplicado e confirmacao para cliente sem documento.

Campos que COS nao deve manipular:

- `id`, `created_at`, campos calculados por views/resumos.
- Auth/usuarios relacionados.

Riscos:

- Duplicidade por CNPJ/CPF se entrada vier sem normalizacao.
- Diferenca entre `document`, `document_number`, `cnpj` e aliases.

### `contracts`

Campos gravaveis conhecidos:

- Identidade: `contract_number`, `client_id`, `type`, `contract_type`, `status`.
- Datas: `start_date`, `end_date`, `due_day`.
- Valores: `monthly_value`, `total_value`, `down_payment`, `linked_asset_value`.
- Parcelas/resumo: `installments_count`, `paid_installments`, `pending_installments`, `overdue_installments`, `amount_paid`, `amount_pending`, `amount_overdue`.
- Operacao: `payment_method`, `cost_center`, `dre_category`, `notes`.
- Publico/anexos: `public_access_token`, `public_access_enabled`, `public_access_created_at`, `contract_pdf_url`, `receipt_url`, `other_documents_url`.
- Legado/simplificado: `equipment_id`, `equipment_quantity`.

Obrigatorios na UI:

- `client_id`, `type`, `status`, `start_date`, `due_date` na tela, `monthly_value`.
- Para `type = locacao`, pelo menos um equipamento vinculado.

Status usados:

- `ativo`, `encerrado`, `cancelado`, `inadimplente`.

Tipos usados:

- `locacao`, `venda`, `servico`.

Regras atuais:

- `createContract` gera/ajusta `contract_number` para evitar duplicidade.
- `due_day` vem do dia da data de vencimento informada.
- `monthly_value` tambem vira `total_value` na criacao atual.
- Contrato criado gera parcelas automaticamente.
- Contrato de locacao exige estoque disponivel.
- Link publico e token sao criados por padrao na tela de contrato.

Campos que COS nao deve manipular sem regra dedicada:

- Contadores/resumos `paid_installments`, `pending_installments`, `overdue_installments`, `amount_*`.
- Token publico sem padrao controlado.
- Campos de documento URL se o upload nao tiver ocorrido.

### `contract_equipment`

Campos:

- `id`, `contract_id`, `equipment_id`, `quantity`, `asset_value`, `created_at`.

Relacionamentos:

- `contract_id` -> `contracts.id`.
- `equipment_id` -> `equipment.id`.

Regras atuais:

- Criacao ocorre apos contrato.
- Quantidade deve ser maior que zero.
- UI bloqueia quantidade maior que estoque disponivel.
- Apos criar vinculos, chama `recalculateEquipmentInventory`.

Risco para COS:

- Nao criar vinculo sem recalcular estoque.
- Nao aceitar equipamento inexistente ou estoque insuficiente.

### `equipment`

Campos gravaveis conhecidos:

- Identidade: `name`, `category`, `description`, `brand`, `model`, `configuration`, `serial_number`.
- Quantidades: `quantity_total`, `quantity_available`, `quantity_rented`, `quantity_reserved`, `quantity_maintenance`, `total_quantity`, `available_quantity`, `rented_quantity`, `reserved_quantity`, `maintenance_quantity`.
- Valores: `purchase_value`, `sale_value`, `rental_value`, `purchase_unit_value`, `monthly_rental_value`.
- Operacao: `status`, `notes`.

Obrigatorios na UI:

- `name`, `category`, `quantity_total`, `status`.

Status usados:

- `disponivel`, `locado`, `reservado`, `manutencao`, `vendido`, `baixado`.
- Aliases tratados em telas: `active`, `maintenance`, `inactive`, `disposed`.

Regras atuais:

- Disponivel calculado por `quantity_available` quando existe; senao `total - rented`.
- Contratos recalculam `quantity_rented` e `quantity_available`.

Riscos:

- COS nao deve ajustar quantidade disponivel manualmente quando for consequencia de contrato.
- Criacao em lote exige preview por item e deduplicacao.

### `financial_entries`

Campos gravaveis conhecidos:

- Basicos: `type`, `status`, `description`, `value`, `amount`.
- Datas: `competence_date`, `due_date`, `payment_date`.
- Relacoes: `bank_account_id`, `dre_category_id`, `cost_center_id`, `client_id`, `contract_id`, `installment_id`.
- Operacao: `supplier_name`, `payment_method`, `recurrence`, `tags`, `notes`.
- Anexos: `attachment_type`, `attachment_url`.

Obrigatorios na UI:

- `type`, `description`, `amount`, `dueDate`, `dreCategoryId`, `bankAccountId`.

Status:

- Normalizados por `normalizeFinancialStatus`.
- Uso comum: `pendente`, recebido/pago conforme tipo e data de pagamento.

Regras atuais:

- Novo lancamento alimenta DRE por `dre_category_id` e competencia.
- Status depende de tipo + existencia de `payment_date`.
- Anexo opcional cria documento em `gate-documents`.
- Endpoint COS atual exige `receita|despesa`, descricao, valor positivo, competencia ou vencimento.

Riscos:

- Financeiro sem categoria DRE/conta bancaria nao segue a regra completa da tela.
- Criacao recorrente ainda nao existe no COS.
- `value` e `amount` precisam ser consistentes.

### `bank_accounts`

Campos gravaveis:

- `name`, `bank_name`, `agency`, `account_number`, `account_type`, `opening_balance`, `current_balance`, `is_active`, `open_finance_connected`, `last_sync_at`.

Obrigatorios na UI:

- `name`, `accountType`, `openingBalance` numerico.

Tipos:

- `corrente`, `poupanca`, `caixa`, `investimento`.

Riscos:

- `current_balance` pode divergir de lancamentos. COS deve tratar saldo como area de conciliacao, nao correcao automatica.

### `documents`

Campos gravaveis:

- Arquivo: `name`, `type`, `file_url`, `file_path`, `mime_type`, `size_bytes`, `bucket`, `path`.
- Vinculos: `client_id`, `contract_id`, `installment_id`, `financial_entry_id`, `equipment_id`, `legal_case_id`.
- `notes`.

Buckets:

- `gate-documents`, `gate-contracts`, `gate-legal`.

Obrigatorios na UI:

- Pelo menos um arquivo.
- Tipo do documento.

Regras:

- Upload usa Storage com `upsert: false`.
- Registro em `documents` e criado apos upload.

Riscos:

- COS so pode anexar se tiver arquivo original disponivel.
- Vinculo por nome deve virar preview e confirmacao; nao inferir ID silenciosamente.

### `installments`

Campos gravaveis:

- `contract_id`, `client_id`, `installment_number`, `original_value`, `updated_value`, `paid_value`, `due_date`, `payment_date`, `status`, `fine_value`, `interest_value`, `discount_value`, `days_overdue`, `notes`, `total_contract_value`, `installments_count`, `down_payment`, `installment_value`, `first_due_date`, `fixed_due_day`, `apply_late_fee`, `fine_amount`, `interest_amount`.

Regras:

- Geradas automaticamente pela tela de contrato.
- Status inicial atual: `aberta`.

Riscos:

- COS nao deve criar parcelas soltas sem contrato e calendario revisado.

### `dre_categories`

Campos:

- `name`, `group_name`, `type`, `sort_order`, `active`.

Uso:

- Categoriza lancamentos financeiros na DRE operacional.

Riscos:

- Criacao/alteracao de categoria muda a leitura da DRE; exige fase propria.

### `dre_manual_adjustments`

Campos:

- `year`, `month`, `dre_category_id`, `previous_value`, `new_value`, `reason`, `responsible`.

Regras:

- Ajuste manual altera exibicao da DRE operacional.
- Existe delete manual de ajuste na UI.

Riscos:

- Alta sensibilidade. COS nao deve ajustar DRE sem preview detalhado, log e aprovacao explicita.

### `dre_monthly_closings`

Campos:

- `year`, `month`, `revenue_total`, `expenses_total`, `operational_profit`, `operational_result`, `previous_balance`, `operation_balance`, `bank_balance`, `difference`, `status`, `closed_at`, `closed_by`.

Status:

- `fechado`.

Regras:

- Fecha um mes com valores atuais calculados.

Riscos:

- Fechamento e irreversivel operacionalmente na pratica. COS deve apenas diagnosticar ate existir processo formal.

### `dre_imports` e `dre_import_rows`

Campos principais:

- `dre_imports`: `file_name`, `sheet_name`, `year`, `imported_by`, `import_kind`, `created_at`.
- `dre_import_rows`: `import_id`, `row_index`, `group_name`, `account_name`, `row_type`, meses `jan` a `dez`, `total`, `raw_label`, `raw_data`, `created_at`.

Regras:

- Historico importado nao deve alterar DRE operacional.
- DRE operacional 2026 usa template operacional.

Riscos:

- Misturar historico e operacional e proibido para COS.

### `dre_operational_template_rows` e `dre_operational_baseline_values`

Campos:

- Template: `year`, `row_index`, `group_name`, `account_name`, `row_type`, `source_sheet`, `active`.
- Baseline: `year`, `row_index`, `month`, `value`, `source_label`.

Uso:

- Estrutura e valores-base da DRE operacional.

Riscos:

- `replaceDreOperationalTemplateRows` faz delete/replace do template por ano. Nao deve ser chamado pelo COS executor sem autorizacao de fase avancada.

### `legal_cases`

Campos gravaveis conhecidos:

- Relacoes: `client_id`, `contract_id`, `installment_id`.
- Caso: `case_number`, `process_number`, `responsible_internal`, `lawyer_name`, `law_office`, `status`, `stage`, `risk`, `next_deadline`, `summary`, `case_summary`, `notes`.
- Valores: `original_value`, `monthly_value`, `overdue_installments`, `fine_value`, `interest_value`, `court_costs`, `attorney_fees`, `discount_value`, `updated_value`, `negotiated_value`, `paid_value`, `balance_due`.
- Acordo: `is_installment_agreement`, `agreement_installments`, `agreement_down_payment`, `agreement_installment_value`, `first_due_date`, `payment_method`.
- Aliases: `original_open_amount`, `fine_amount`, `interest_amount`, `discount_amount`, `negotiated_amount`, `will_be_installment`, `installments_count`, `down_payment`.

Status:

- `em_analise`, `notificacao_extrajudicial`, `em_negociacao`, `acordo_firmado`, `acao_judicial`, `em_execucao`, `encerrado`, `perdido`.

Risco:

- Juridico envolve cobranca, acordos e prazos. COS deve criar caso apenas apos resolver IDs reais de cliente/contrato e preview.

### `partner_entries`, `partners`, `partner_distribution_rules`

`partner_entries`:

- `partner_id`, `type`, `description`, `competence_date`, `value`, `status`, `financial_entry_id`.
- Status: `previsto`, `pago`.

`partners`:

- `name`, `participation_percentage`, `fixed_monthly_value`, `result_participation_percentage`, `active`.

`partner_distribution_rules`:

- `name`, `rule_type`, `percentage`, `fixed_amount`, `is_active`.
- `rule_type`: `partner`, `extra_percentage`, `fixed_amount`.

Risco:

- Impacta distribuicao de lucros e socios. COS deve inicialmente ler/analisar; editar socio e regras exige fase posterior.

### Outras tabelas e views importantes

- `maintenance_orders`: chamados e ordens; possui `ticket_number`, `equipment_id`, `client_id`, `contract_id`, `problem`, `diagnosis`, `solution`, `priority`, `technician`, `status`, datas e custo.
- `assets`: patrimonio, relacionado opcionalmente a `equipment_id`.
- `notifications`: notificacoes do sistema.
- Views usadas: `v_contracts_summary`, `v_dre_monthly`, `v_legal_summary`, `v_profit_distribution_current_month`.
- `cos_action_logs`: logs reais de acoes COS com `user_id`, `action_type`, `source_file_name`, `source_file_type`, `source_confidence`, `payload`, `result`, `status`, `error_message`, `created_at`.

## 5. Mapa de endpoints/actions

### `/api/cos`

- Metodo: POST.
- JSON: `{ message }`.
- Multipart: `message`, `files[]`.
- Requer usuario autenticado.
- Se tiver arquivo: chama `analyzeCosFiles`.
- Sem arquivo: chama `answerCosQuestion`.
- Erros: Supabase ausente, usuario nao autenticado, mensagem/arquivo ausente, erro interno.
- Uso futuro: deve receber tambem entrada estruturada textual para intenções de execucao, mas isso ainda nao existe.

### `/api/cos/actions/create-client`

- Metodo: POST JSON.
- Payload atual: `payload`, `source`, `confirmNoDocument`.
- Campos aceitos: `name`, `legalName`, `legal_name`, documento via `documentNumber`, `document_number`, `document`, `cnpj`, `cpf`, `address`, `city`, `state`, `postalCode`, `zip_code`, `cep`, `status`.
- Validacoes: autentica usuario, sanitiza nome, bloqueia nome contaminado, exige nome, exige confirmacao se sem documento, verifica duplicidade por `document_number`.
- Grava: `clients`.
- Log: `cos_action_logs`.
- Pode ser usado pelo COS: sim.

### `/api/cos/actions/create-financial-entry`

- Metodo: POST JSON.
- Campos: `type`, `description`, `value|amount`, `competence_date`, `due_date`, `payment_date`, `status`, `supplier_name/client_name/vendor_name`, `category`, source.
- Validacoes: `type` receita/despesa, descricao, valor positivo, bloqueio de valor parcial suspeito, bloqueio de baixa confianca, bloqueio de descricao juridica longa, competencia ou vencimento.
- Grava: `financial_entries`.
- Log: `cos_action_logs`.
- Pode ser usado pelo COS: sim, mas ainda abaixo do formulario completo porque nao exige DRE categoria e conta bancaria.

### `/api/cos/actions/attach-document`

- Metodo: POST multipart.
- Campos: `file`, `sourceFileName`, `sourceFileType`, `sourceConfidence`, `detectedType`, `notes`, `clientId`, `contractId`, `financialEntryId`.
- Validacoes: usuario autenticado, arquivo obrigatorio.
- Grava: Storage `gate-documents`, tabela `documents`.
- Log: `cos_action_logs`.
- Pode ser usado pelo COS: sim, se arquivo original estiver disponivel.

### Helpers client-side existentes

Os demais modulos usam `insertRow`, `updateRows`, `deleteRows` diretamente pelo client-side Supabase. Para COS executor confiavel, nao e recomendavel chamar esses helpers diretamente do chat sem endpoints dedicados server-side com validacao e logs.

## 6. Mapa de telas, formularios e campos

### Clientes

Formulario: `MockCreateDialog` em `components/clientes-content.tsx`.

- Obrigatorios: `name`, `status`.
- Opcionais: `document`, `type`, `email`, `phone`, `whatsapp`, `city`, `notes`.
- Selects: `type` = `pf|pj`; `status` = `ativo|inativo|inadimplente`.
- Impacto: base para contratos, financeiro, documentos, juridico e dashboard.

### Contratos

Formulario: `NewContractDialog` em `components/contratos-content.tsx`.

- Obrigatorios: `client_id`, `type`, `status`, `start_date`, `due_date`, `monthly_value`.
- Obrigatorio condicional: equipamento vinculado se `type = locacao`.
- Opcionais: `end_date`, arquivo de contrato.
- Selects: status `ativo|encerrado|cancelado|inadimplente`; tipo `locacao|venda|servico`; equipamentos disponiveis.
- Impacto: cria contrato, parcelas, vinculos `contract_equipment`, recalcula estoque.

### Equipamentos

Formulario: `MockCreateDialog` em `components/equipamentos-content.tsx`.

- Obrigatorios: `name`, `category`, `quantity_total`, `status`.
- Opcionais: `description`, `notes`.
- Selects: categoria `servidor|computador|impressora|rede|telefonia|seguranca|outro`; status `disponivel|locado|reservado|manutencao|vendido|baixado`.
- Impacto: estoque, contratos, manutencoes, patrimonio.

### Financeiro

Formularios:

- `NewLaunchDialog`: lancamento financeiro.
- `NewBankAccountDialog`: conta bancaria.

Lancamento:

- Obrigatorios: `type`, `description`, `amount`, `dueDate`, `dreCategoryId`, `bankAccountId`.
- Opcionais: `paymentDate`, `clientId`, `paymentMethod`, `attachment`, arquivo.
- Selects: tipo financeiro, categoria DRE, conta bancaria, cliente/fornecedor, forma de pagamento, tipo de anexo.
- Impacto: DRE, dashboard, saldo/analises, documentos.

Conta bancaria:

- Obrigatorios: `name`, `openingBalance` valido.
- Opcionais: banco, agencia, numero, tipo, ativa.
- Selects: `corrente|poupanca|caixa|investimento`.
- Impacto: conciliacao financeira e saldo banco.

### Documentos

Formulario: `components/documentos-content.tsx`.

- Obrigatorios: arquivo(s), tipo.
- Opcionais: cliente, contrato, observacoes.
- Impacto: Storage e tabela `documents`.

### DRE

Fluxos:

- Ajuste manual de valor por categoria/mes.
- Fechamento mensal.
- Importacao de planilha operacional/historica.
- Exclusao de ajustes/importacoes em fluxos especificos.

Campos sensiveis:

- `year`, `month`, `dre_category_id`, valores, motivo, responsavel.

Impacto:

- Altera leitura da DRE operacional, historico importado ou fechamento.

Recomendacao:

- COS nao deve executar DRE inicialmente. Deve diagnosticar e sugerir.

### Juridico

Formulario: `CaseFormDialog`.

- Obrigatorios: cliente, status, etapa.
- Opcionais atuais na tela: contrato, risco, prazo, resumo.
- Opcoes: status juridico, etapa, risco.
- Impacto: cobranca, acordos, contratos, documentos juridicos.

### Socios

Fluxos:

- Criar lancamento de socio em `partner_entries`.
- Editar socio em `partners`.

Lancamento:

- Campos: socio, tipo, data, descricao, status, valor.
- Validacao: valor numerico.
- Status: `previsto|pago`.

Edicao de socio:

- Nome, participacao, fixo mensal, participacao no resultado, ativo.

### Dashboard

Nao possui formulario operacional principal. Calcula indicadores por consultas em helpers/views. COS deve ler, explicar e diagnosticar; nao editar dashboard.

## 7. Regras de negocio reais

### Cliente

- Criacao comum usa `createClient` client-side e valida pouco.
- Criacao via COS e mais restrita: sanitiza nome e verifica duplicidade por documento.
- Cliente e referencia para contratos, financeiro, documentos, juridico e manutencoes.

### Contrato

- Cria registro em `contracts`.
- Gera numero unico por prefixo/sequencia.
- Cria token/link publico.
- Gera parcelas em `installments` com datas calculadas.
- Vincula equipamentos via `contract_equipment`.
- Recalcula estoque de cada equipamento vinculado.

### Estoque

- Total vem de `quantity_total|total_quantity|quantity`.
- Disponivel explicito vem de `quantity_available|available_quantity`; se ausente, calcula `total - rented`.
- Recalculo soma `contract_equipment.quantity` por equipamento e atualiza `quantity_rented` e `quantity_available`.

### Financeiro e DRE

- Lancamento financeiro alimenta DRE pela competencia e categoria DRE.
- Status e normalizado por `financial-status`.
- Receita/despesa no dashboard e DRE dependem de datas, status e tipo.
- Conta bancaria e categoria DRE sao obrigatorias na UI completa, mas nao no endpoint COS atual.

### DRE operacional e historica

- DRE operacional combina categorias, clientes, financeiro, socios, contas bancarias, fechamentos, template e baseline.
- DRE historica usa `dre_historical_values` ou snapshots importados.
- Importacao operacional pode substituir template por ano.
- Historico importado deve ficar separado da DRE operacional.

### Documentos

- Upload sempre deve ocorrer antes do insert em `documents`.
- Storage usa buckets controlados e `upsert: false`.
- Vinculo a entidades depende de IDs reais.

### Juridico

- Caso juridico vincula cliente/contrato opcionalmente.
- Valores atualizados podem derivar de valor original, multa, juros, custas, honorarios e desconto.
- Acordos possuem parcelas, entrada, primeiro vencimento e forma de pagamento.

### Acoes que exigem confirmacao

- Toda criacao via COS deve ter preview e confirmacao.
- Contrato/equipamento/parcelas/DRE/edicao/exclusao ainda devem permanecer bloqueados ate endpoints dedicados existirem.

## 8. COS atual

### Arquivos principais

- UI e estado: `components/header.tsx`.
- API principal: `app/api/cos/route.ts`.
- Acoes: `app/api/cos/actions/create-client`, `create-financial-entry`, `attach-document`.
- Router textual: `lib/cos/cos-router.ts`.
- Consultas/resumos: `lib/cos/cos-tools.ts`.
- Analise de arquivos: `lib/cos/cos-file-analysis.ts`.
- Utils/log: `lib/cos/cos-action-utils.ts`.
- Log SQL: `supabase/gate-os-cos-action-logs.sql`.

### Estado e persistencia

- Mensagens, anexos, arquivos enviados e modal de revisao ficam em `Header`.
- Ultima analise com preview persiste em `localStorage` (`gate-cos-last-analysis-v1`).
- Arquivos binarios originais nao persistem.

### Fluxos atuais

- Pergunta textual -> intent simples -> consulta Supabase -> resposta.
- Upload -> parser/OCR -> preview -> cards -> CTA isolado.
- CTA -> modal de revisao -> endpoint seguro -> Supabase/Storage -> log.

### Acoes permitidas

- Cadastrar cliente.
- Criar lancamento financeiro individual.
- Anexar documento.

### Acoes bloqueadas

- Cadastrar contrato.
- Cadastrar equipamentos.
- Criar parcelas.
- Criar recorrencia.
- Editar.
- Excluir.
- Confirmar tudo.
- Execucao em massa.
- Alterar DRE.

### Limitacoes para nova estrategia

- COS nao interpreta ainda comandos estruturados de cadastro no chat.
- Nao existe schema de intents executaveis para entrada textual tipo `Cadastrar cliente:`.
- Nao ha endpoints server-side para contrato, equipamento, juridico, DRE, socio.
- Acoes completas da UI usam helpers client-side e nao registram log COS.
- Financeiro COS atual nao exige categoria DRE nem conta bancaria.
- Nao ha resolucao robusta de entidades por nome para IDs reais.
- Nao ha engine de preview unificada por entidade.

## 9. Mapa de Capacidades Necessarias do COS

### A) Ler / Buscar

Necessario:

- Buscar cliente por nome, documento, email, telefone.
- Buscar contrato por numero, cliente, status, vencimento.
- Buscar equipamento por nome, categoria, serial/configuracao, status e disponibilidade.
- Buscar lancamento financeiro por descricao, valor, competencia, cliente, contrato, status.
- Buscar documentos por nome, tipo, cliente, contrato, financeiro, juridico.
- Buscar DRE por ano/mes, categoria, linha, resultado, divergencia.
- Buscar inadimplencia por parcelas/lancamentos vencidos.
- Buscar contratos vencendo e vencidos.
- Buscar estoque disponivel por categoria/equipamento.

Base tecnica atual:

- `cos-router` ja le resumos.
- `cos-tools` consulta algumas tabelas.
- Falta busca parametrica e retorno estruturado com IDs.

### B) Criar / Cadastrar

Fases recomendadas:

- Ja permitido: cliente, financeiro individual, documento.
- Proxima fase: contrato com preview completo e endpoints dedicados.
- Depois: equipamento individual.
- Depois: juridico individual.
- Somente depois: parcelas/recorrencia/ajustes DRE.

Cada criacao precisa:

- Parser de entrada estruturada.
- Validacao obrigatoria.
- Resolucao de relacionamentos.
- Preview por entidade.
- Endpoint server-side.
- Log COS.
- Mensagem de erro real.

### C) Editar

Nao recomendado no inicio.

Para liberar editar, precisa:

- Buscar registro alvo com certeza.
- Mostrar antes/depois.
- Validar campos editaveis.
- Bloquear campos calculados.
- Criar endpoints PATCH server-side com log.
- Exigir confirmacao reforcada.

### D) Analisar

Capacidades prioritarias:

- Receitas e despesas por periodo.
- Inadimplencia.
- Contratos vencendo.
- Margem e resultado operacional.
- Estoque disponivel vs locado.
- Divergencias entre financeiro, DRE e dashboard.
- Contrato ativo sem financeiro previsto.
- Receita recorrente sem contrato.

### E) Conciliar

Fase avancada:

- Financeiro x DRE.
- Banco x financeiro.
- Contratos x parcelas.
- Equipamentos locados x contratos.
- Dashboard x fontes reais.

Regra:

- COS diagnostica primeiro; ajustes automaticos so com governanca posterior.

## 10. Modelos de entrada estruturada recomendados

### Cadastrar cliente

Modelo:

```text
Cadastrar cliente:
Razao social:
Nome fantasia:
CNPJ:
CPF:
Endereco:
Cidade:
Estado:
CEP:
Representante:
Telefone:
E-mail:
Status:
Observacoes:
```

Minimos:

- Razao social/nome.
- Documento ou confirmacao reforcada.

Validacoes:

- Documento normalizado.
- Nome sem documento/endereco/texto juridico.
- Duplicidade por documento.
- Status em `ativo|inativo|inadimplente`.

Endpoint provavel:

- Atual: `/api/cos/actions/create-client`.

Preview:

- Obrigatorio.

### Cadastrar contrato

Modelo:

```text
Cadastrar contrato:
Cliente:
Tipo:
Status:
Data inicio:
Data final:
Valor mensal:
Data/dia de vencimento:
Caucao/entrada:
Equipamentos:
Observacoes:
```

Minimos:

- Cliente resolvido para ID.
- Tipo.
- Status.
- Inicio.
- Vencimento.
- Valor mensal.
- Equipamentos se locacao.

Validacoes:

- Cliente existe.
- Estoque suficiente.
- Valor positivo.
- Datas coerentes.
- Preview de parcelas geradas.
- Preview de estoque antes/depois.

Endpoint provavel:

- Criar novo endpoint COS server-side para contrato.

Riscos:

- Gera contrato, parcelas, vinculos e estoque. Nao usar helpers soltos.

### Criar financeiro

Modelo:

```text
Criar financeiro:
Tipo:
Descricao:
Valor:
Data vencimento:
Competencia:
Categoria DRE:
Cliente:
Contrato:
Status:
Conta bancaria:
Forma de pagamento:
```

Minimos:

- Tipo.
- Descricao.
- Valor.
- Vencimento/competencia.

Recomendados para aderir a UI:

- Categoria DRE.
- Conta bancaria.

Endpoint provavel:

- Atual `/api/cos/actions/create-financial-entry`, mas precisa evoluir para exigir categoria/conta quando aplicavel.

### Cadastrar equipamento

Modelo:

```text
Cadastrar equipamento:
Nome:
Categoria:
Quantidade:
Status:
Marca:
Modelo:
Configuracao:
Numero de serie:
Valor compra:
Valor locacao:
Observacoes:
```

Minimos:

- Nome.
- Categoria.
- Quantidade total.
- Status.

Validacoes:

- Quantidade inteira positiva.
- Status aceito.
- Categoria aceita.
- Serial unico se informado.

Endpoint provavel:

- Novo endpoint COS para equipamento.

### Anexar documento

Modelo:

```text
Anexar documento:
Tipo:
Cliente:
Contrato:
Financeiro:
Juridico:
Observacoes:
Arquivo: anexo
```

Minimos:

- Arquivo.
- Tipo.

Endpoint:

- Atual `/api/cos/actions/attach-document`.

### Criar caso juridico

Modelo:

```text
Criar caso juridico:
Cliente:
Contrato:
Status:
Etapa:
Risco:
Prazo:
Processo:
Advogado:
Valor original:
Multa:
Juros:
Desconto:
Resumo:
```

Minimos:

- Cliente.
- Status.
- Etapa.

Endpoint provavel:

- Novo endpoint COS juridico.

### Ajuste DRE

Modelo futuro, nao inicial:

```text
Sugerir ajuste DRE:
Ano:
Mes:
Categoria:
Valor atual:
Novo valor:
Motivo:
Responsavel:
```

Minimos:

- Ano, mes, categoria real, novo valor, motivo.

Regra:

- Inicialmente apenas diagnosticar/sugerir. Execucao so em fase avancada.

## 11. Seguranca e governanca

Nunca pode:

- Alterar Auth, Login, Usuarios, Sessao ou RLS.
- Executar DROP, TRUNCATE ou SQL destrutivo.
- Executar DELETE em massa.
- Misturar DRE historica com DRE operacional.
- Criar mocks ou simular sucesso.
- Habilitar execucao em massa sem aprovacao formal.
- Editar/excluir registros sem preview antes/depois.

Deve:

- Preservar arquitetura atual.
- Usar endpoints server-side para acoes COS.
- Validar antes de executar.
- Abrir preview antes de gravar.
- Confirmar antes de persistir.
- Mostrar erros reais.
- Gravar logs reais.
- Resolver IDs reais antes de criar relacionamento.
- Separar diagnostico de execucao.

## 12. Lacunas atuais

- Falta parser de entrada estruturada textual.
- Falta schema unificado de `intent -> entidade -> validacao -> preview -> endpoint`.
- Falta endpoints COS para contrato, equipamento, juridico, socio e DRE.
- Falta logs para acoes criadas por telas fora do COS.
- Falta resolucao confiavel de entidade por nome/documento.
- Falta preview operacional de efeitos colaterais: parcelas, estoque, DRE, banco.
- Falta controle de permissao por tipo de acao COS.
- Falta historico persistente de analises/execucoes COS no banco.
- Falta testes fixture para entrada estruturada.
- Falta politica de idempotencia/deduplicacao para comandos repetidos.

## 13. Riscos

### Alto

- Criar contrato sem recalcular estoque.
- Criar parcelas duplicadas.
- Alterar DRE operacional indevidamente.
- Resolver cliente/equipamento errado por nome parecido.
- Criar financeiro sem categoria DRE/conta bancaria e distorcer DRE/dashboard.

### Medio

- Duplicar cliente por documento formatado diferente.
- Anexar documento ao registro errado.
- Criar juridico sem contrato/cliente correto.
- Editar campos calculados ou de resumo.

### Baixo/medio

- Campos opcionais incompletos.
- Labels divergentes entre UI e banco.
- Encoding visual em textos existentes.

## 14. Recomendacoes

### Arquitetura recomendada para COS executor

Criar pipeline:

1. Detectar intencao de entrada estruturada.
2. Normalizar campos para schema interno.
3. Resolver entidades existentes com busca auditavel.
4. Validar campos obrigatorios e regras de negocio.
5. Gerar preview humano por entidade.
6. Exigir confirmacao.
7. Executar endpoint server-side especifico.
8. Registrar log em `cos_action_logs`.
9. Retornar resultado real e links para registros.

### Padrao de endpoint COS futuro

Cada endpoint deve:

- Exigir usuario autenticado.
- Receber `payload`, `source`, `confirmation`.
- Validar schema e regras.
- Bloquear campos calculados.
- Fazer uma acao atomica ou uma transacao clara.
- Registrar log sucesso/erro.
- Retornar erro real.

### Padrao de preview

Cada preview deve mostrar:

- Dados que serao gravados.
- Registros relacionados encontrados.
- Campos ausentes.
- Riscos.
- Efeitos colaterais.
- Botao de confirmar apenas para acao permitida.

## 15. Plano sugerido por fases

### Fase 1 - Entrada estruturada para acoes ja permitidas

- Cadastrar cliente por texto estruturado.
- Criar financeiro individual por texto estruturado.
- Anexar documento com metadados por texto estruturado.
- Sem novos tipos de execucao.
- Testes fixtures para cada modelo.

### Fase 2 - Busca e resolucao de entidades

- Buscar cliente/contrato/equipamento/documento/financeiro por campos.
- Resolver nomes para IDs com nivel de confianca.
- Quando houver ambiguidade, pedir escolha humana.

### Fase 3 - Contrato assistido

- Endpoint COS para criar contrato.
- Preview de contrato, parcelas, equipamentos e estoque.
- Criacao atomica: contrato -> parcelas -> vinculos -> recalc estoque -> log.
- Sem lote.

### Fase 4 - Equipamentos

- Criar equipamento individual.
- Criar multiplos equipamentos somente como lista revisavel item a item.
- Deduplicacao por serial/configuracao.

### Fase 5 - Juridico e documentos avancados

- Criar caso juridico.
- Vincular documentos a juridico.
- Criar andamentos juridicos.

### Fase 6 - Analise e conciliacao

- Diagnosticar financeiro x DRE.
- Diagnosticar banco x financeiro.
- Diagnosticar contratos x parcelas.
- Diagnosticar estoque x contratos.
- Sem corrigir automaticamente.

### Fase 7 - Edicao controlada

- Editar cliente/financeiro/equipamento com diff antes/depois.
- Bloquear campos calculados.
- Confirmacao reforcada.

### Fase 8 - DRE operacional

- Sugerir ajustes.
- Salvar ajuste DRE apenas com motivo, responsavel, preview e confirmacao.
- Fechamento mensal somente com aprovacao formal.

## 16. Conclusao executiva

Hoje o COS e um assistente operacional seguro para leitura, preview e tres acoes isoladas. Para virar executor operacional confiavel, ele nao precisa "adivinhar" documentos; precisa entender entradas estruturadas, validar contra o banco real, resolver relacionamentos e executar endpoints server-side com logs.

O primeiro salto estrategico deve ser pequeno e robusto: entrada estruturada para cliente, financeiro e documento. O segundo salto deve ser resolver entidades. So depois deve criar contratos, equipamentos, parcelas ou qualquer acao que afete estoque, DRE ou dashboard.

Parecer final: o GATE OS ja tem a maioria dos blocos operacionais. O que falta para o COS executor e uma camada formal de comandos, validacoes, previews e endpoints dedicados por modulo, com governanca forte e sem execucao em massa.
