# GATE OS - Auditoria definitiva frontend x schema Supabase

Data: 2026-06-11

## Objetivo

Alinhar os payloads do frontend ao schema real atual do Supabase, evitando colunas inexistentes, enums incorretos, labels salvas em campos de ID e UUIDs expostos em selects.

## Campos inexistentes removidos

- `financial_entries`: mantido sem `bank_account_name`, `dre_category_name`, `party_name` ou labels em campos de ID.
- `documents`: removido envio de `file_name`, `size`, `file_size`, `category`, `storage_bucket` e `storage_path`.
- `maintenance_orders`: removido envio de `description` e `type`; descrição operacional agora salva em `problem`.
- `legal_cases`: removido envio de `client_name`, `contract_number` e `internal_notes`.
- `partner_entries`: removido envio de `partner_name`, `date`, `reference_month` e `amount`.
- `partners`: removido envio de `role`, `share`, `status` e `notes`.
- `dre_manual_adjustments`: removido envio de `category`, `month_index` e `adjustment_date`.

## Campos corrigidos por tabela

- `clients`: criação usa `name`, `type`, `document_number`, `email`, `phone`, `whatsapp`, `city`, `status` e `notes`.
- `contracts`: criação passa pela allowlist real e salva `type/status` técnicos, além de vínculo em `contract_equipment`.
- `equipment`: criação prioriza `quantity_total`, `quantity_available`, `quantity_rented`, `quantity_reserved` e `quantity_maintenance`.
- `documents`: upload salva `name`, `type`, `mime_type`, `size_bytes`, `bucket`, `path`, `file_path` e FKs reais.
- `maintenance_orders`: ticket automático em `ticket_number`; problema salvo em `problem`.
- `legal_cases`: criação usa `case_number`, `client_id`, `contract_id`, `status`, `stage`, `risk`, `next_deadline`, `summary`, `case_summary` e `notes`.
- `partners`: edição usa `participation_percentage`, `fixed_monthly_value`, `result_participation_percentage` e `active`.
- `partner_entries`: criação usa `partner_id`, `type`, `description`, `competence_date`, `value` e `status`.
- `dre_manual_adjustments`: criação usa `year`, `month`, `dre_category_id`, `previous_value`, `new_value`, `reason` e `responsible`.

## Enums corrigidos

- Financeiro salva `type` como `receita` ou `despesa`.
- Financeiro mantém `status` real: `recebido`, `pago`, `a_receber`, `a_pagar`, `parcial`, `cancelado`.
- Contratos usam `ativo`, `encerrado`, `cancelado`, `inadimplente`, `juridico` e tipos `locacao`, `venda`, `servico`.
- Equipamentos usam `disponivel`, `locado`, `reservado`, `manutencao`, `vendido`, `baixado`.
- Documentos usam `contrato`, `boleto`, `recibo`, `nota_fiscal`, `comprovante`, `peticao`, `sentenca`, `acordo`, `documento_interno`, `outro`.
- Jurídico usa `em_analise`, `notificacao_extrajudicial`, `em_negociacao`, `acordo_firmado`, `acao_judicial`, `em_execucao`, `encerrado`, `perdido`; risco usa `baixo`, `medio`, `alto`, `critico`.
- Parcelas corrigidas para marcar pagamento com `paga`.

## Selects corrigidos

- Clientes, contratos, equipamentos, categorias DRE, contas bancárias e sócios mantêm `value` como ID e `label` amigável.
- Manutenções usam labels amigáveis para cliente, contrato e equipamento.
- Jurídico salva IDs em `client_id` e `contract_id`.
- Sócios salva `partner_id` e exibe nome do sócio.

## Módulos corrigidos

- Clientes
- Contratos
- Equipamentos
- Financeiro
- Documentos
- Jurídico
- Manutenções
- Sócios
- DRE
- Helpers Supabase

## Integrações corrigidas

- Contrato com equipamento recalcula estoque usando `quantity_available` e `quantity_rented`.
- Contratos continuam compondo MRR/ARR/receita prevista no Financeiro, Dashboard, DRE e Relatórios.
- Upload real grava documentos com FKs reais.
- Ajuste manual DRE exige categoria real em `dre_categories` antes de salvar.

## SQL necessário

Nenhum SQL foi criado ou executado nesta etapa. O schema informado já contém as colunas necessárias para os ajustes feitos.

## Pendências reais

- Alguns relatórios e visualizações ainda usam campos derivados/labels para exibição, sem afetar payload de gravação.
- DRE ainda possui linhas históricas visuais herdadas; ajustes manuais só salvam quando existe categoria real correspondente em `dre_categories`.
- Avisos de Recharts aparecem no build por prerender, mas não quebram compilação.

## Como testar

- Criar cliente e confirmar linha em `clients` sem colunas duplicadas obrigatórias.
- Criar equipamento e confirmar `quantity_total`, `quantity_available`, `quantity_rented`, `quantity_reserved`, `quantity_maintenance`.
- Criar contrato com equipamento e validar `contract_equipment` e estoque.
- Criar lançamento financeiro e confirmar enum técnico em `type/status`.
- Fazer upload de documento e confirmar `documents` com `size_bytes`, `bucket`, `path` e vínculo por ID.
- Criar caso jurídico e confirmar `client_id`, `contract_id`, `status`, `risk`.
- Criar manutenção e confirmar `ticket_number` e `problem`.
- Criar lançamento de sócio e confirmar `competence_date` e `value`.
- Editar sócio e confirmar update em `partners`.
- Abrir Dashboard, Financeiro, DRE e Relatórios após cadastros.
- Executar `npm run lint` e `npm run build`.
