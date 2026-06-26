# GATE OS - Base mestra de conhecimento do COS Executor Operacional

## 1. Proposito oficial

Este documento define a base de conhecimento operacional para evoluir o COS de assistente de leitura para Executor Operacional Inteligente do GATE OS.

A nova arquitetura nao coloca o COS como responsavel principal por OCR, leitura de PDF ou extracao automatica de contratos. A extracao continua existindo como apoio, mas a responsabilidade central do COS passa a ser:

- compreender dados estruturados ou semi-estruturados enviados pelo usuario;
- consultar dados reais do GATE OS;
- validar regras de negocio;
- localizar registros existentes;
- detectar inconsistencias;
- calcular impactos;
- gerar preview claro;
- solicitar confirmacao humana;
- executar somente acoes permitidas;
- registrar logs reais;
- explicar o que foi feito ou por que foi bloqueado.

Fluxo oficial futuro:

```text
Documento ou fonte externa
-> IA especializada/ChatGPT extrai e estrutura
-> Usuario revisa
-> COS recebe dados estruturados
-> COS consulta o GATE OS
-> COS valida regras
-> COS resolve relacionamentos
-> COS calcula impactos
-> COS gera preview
-> Usuario confirma
-> COS executa
-> COS registra log
```

O COS deve agir como operador especialista do sistema, nao como leitor autonomo de arquivos.

## 2. Principios permanentes

### O COS deve pensar como o GATE OS

Antes de executar qualquer coisa, o COS deve perguntar internamente:

- Qual modulo sera afetado?
- Qual tabela ou entidade operacional sera alterada?
- Quais registros relacionados precisam existir?
- Quais campos sao obrigatorios?
- Quais campos sao calculados e nao devem ser manipulados?
- Qual impacto isso gera em contratos, estoque, financeiro, DRE, dashboard ou documentos?
- Existe risco de duplicidade?
- Existe ambiguidade?
- O usuario viu o preview completo?
- A acao esta permitida nesta fase?

### Dados estruturados sao a fonte primaria

O COS deve aceitar comandos como:

```text
Cadastrar cliente:
Razao social:
CNPJ:
Endereco:
Telefone:
E-mail:
```

E nao depender de interpretar um contrato inteiro sozinho. Quando receber texto extraido de documento, deve tratar como dado de entrada revisavel, nao como verdade absoluta.

### Nenhuma operacao sem preview

Toda criacao, edicao, ajuste, vinculacao ou fechamento deve passar por:

```text
Entrada
-> Normalizacao
-> Validacao
-> Busca de registros existentes
-> Preview humano
-> Confirmacao
-> Execucao
-> Log
```

### Diagnostico nao e correcao

Quando encontrar divergencia, o COS deve explicar a origem provavel e sugerir correcao. Ele nao deve corrigir automaticamente.

## 3. Mapa geral do sistema

### Rotas principais

| Rota | Modulo | Finalidade operacional |
|---|---|---|
| `/login` | Auth/Login | Autenticacao. Area proibida para alteracao pelo COS. |
| `/dashboard` | Dashboard | Indicadores consolidados da empresa. |
| `/clientes` | Clientes | Cadastro, consulta e status de clientes. |
| `/clientes/[id]` | Clientes | Detalhe de cliente. |
| `/contratos` | Contratos | Contratos, parcelas e vinculo de equipamentos. |
| `/contratos/[id]` | Contratos | Detalhe de contrato. |
| `/cliente/contrato/[token]` | Portal publico | Consulta publica de contrato/chamado. |
| `/equipamentos` | Equipamentos/Estoque | Inventario, disponibilidade e status. |
| `/financeiro` | Financeiro | Receitas, despesas, contas bancarias e anexos. |
| `/documentos` | Documentos | Upload e vinculacao documental. |
| `/dre` | DRE | DRE operacional, historica, importacoes, ajustes e fechamentos. |
| `/juridico` | Juridico | Casos juridicos, cobrancas, acordos e prazos. |
| `/socios` | Socios | Socios, distribuicoes, aportes e retiradas. |
| `/manutencoes` | Manutencoes | Chamados e ordens de manutencao. |
| `/patrimonio` | Patrimonio | Ativos patrimoniais. |
| `/relatorios` | Relatorios | Relatorios e exportacoes. |
| `/analise` | Analise | Analises gerenciais. |
| `/configuracoes` | Configuracoes | Configuracoes do sistema. Nao deve ser alterado pelo COS executor sem fase propria. |

### Modulos e responsabilidades

| Modulo | Responsabilidade | Impacta |
|---|---|---|
| Clientes | Identidade e contato dos clientes. | Contratos, financeiro, documentos, juridico, manutencoes, dashboard. |
| Contratos | Relacao comercial, periodo, valor, parcelas, equipamentos. | Estoque, financeiro previsto, documentos, juridico, dashboard. |
| Equipamentos | Inventario, disponibilidade, locacao, manutencao. | Contratos, estoque, patrimonio, manutencoes, dashboard. |
| Financeiro | Receitas, despesas, pagamentos, recebimentos, contas. | DRE, dashboard, banco, inadimplencia, socios. |
| DRE | Resultado operacional, categorias, ajustes e fechamento. | Dashboard, analise gerencial, fechamento mensal. |
| Documentos | Arquivos vinculados a entidades. | Clientes, contratos, financeiro, juridico, manutencoes. |
| Juridico | Casos, cobrancas, acordos e riscos. | Clientes, contratos, financeiro, documentos. |
| Socios | Distribuicoes, aportes, retiradas e participacao. | DRE, financeiro, dashboard. |
| Manutencoes | Chamados, problemas, diagnosticos e custos. | Equipamentos, clientes, contratos, financeiro. |
| Patrimonio | Ativos da empresa. | Equipamentos, dashboard, relatorios. |
| Dashboard | Leitura consolidada. | Nao deve ser fonte editavel; reflete dados de outros modulos/views. |

## 4. Mapa tecnico atual do COS

### Arquivos principais

| Arquivo | Papel |
|---|---|
| `components/header.tsx` | UI principal do COS, modal, chat, upload, persistencia local, preview, revisao final e chamadas de acao. |
| `app/api/cos/route.ts` | Entrada API do COS para mensagens e arquivos. |
| `lib/cos/cos-router.ts` | Roteador textual simples para perguntas/resumos. |
| `lib/cos/cos-tools.ts` | Consultas Supabase e resumos operacionais. |
| `lib/cos/cos-context.ts` | Contexto textual do COS. |
| `lib/cos/cos-file-analysis.ts` | Leitura de arquivos, OCR, parser e normalizacao de analises. |
| `lib/cos/cos-action-utils.ts` | Utilitarios de acao e log. |
| `app/api/cos/actions/create-client/route.ts` | Acao segura atual para criar cliente. |
| `app/api/cos/actions/create-financial-entry/route.ts` | Acao segura atual para criar lancamento financeiro. |
| `app/api/cos/actions/attach-document/route.ts` | Acao segura atual para anexar documento. |
| `supabase/gate-os-cos-action-logs.sql` | Tabela e politicas de logs COS. |

### Estado atual do COS

Hoje o COS consegue:

- responder perguntas operacionais simples;
- consultar resumos de clientes, contratos, equipamentos, financeiro, documentos, manutencoes e DRE;
- receber arquivos;
- analisar arquivos como apoio;
- mostrar previews;
- persistir ultima analise em `localStorage`;
- abrir revisao final;
- cadastrar cliente individual;
- criar lancamento financeiro individual;
- anexar documento;
- registrar logs de acoes.

Hoje o COS ainda nao deve:

- criar contratos;
- criar equipamentos;
- criar parcelas;
- criar recorrencias;
- editar registros;
- excluir registros;
- executar lotes;
- fechar DRE;
- ajustar DRE;
- alterar dashboard;
- confirmar tudo.

## 5. Banco de dados e entidades operacionais

Esta secao descreve o que o COS precisa saber antes de operar cada tabela. A lista se baseia no codigo atual do workspace, helpers de dados e formularios existentes.

### `clients`

Finalidade: cadastro mestre de clientes.

Campos operacionais:

- identidade: `name`, `legal_name`, `company_name`, `fantasy_name`, `trade_name`;
- documento: `document_number`, `document`, `type`;
- contato: `email`, `phone`, `whatsapp`;
- endereco: `address`, `city`, `state`, `zip_code`, `street`, `number`, `district`, `complement` e aliases `address_*`;
- status: `status`;
- observacoes: `notes`.

Obrigatorios na UI atual:

- `name`;
- `status`.

Status conhecidos:

- `ativo`;
- `inativo`;
- `inadimplente`.

Relacionamentos:

- contratos usam `client_id`;
- financeiro pode usar `client_id`;
- documentos podem usar `client_id`;
- juridico usa `client_id`;
- manutencoes podem usar `client_id`;
- parcelas podem usar `client_id`.

Campos que o COS nao deve manipular:

- `id`;
- `created_at`;
- campos de auditoria, se existirem;
- qualquer campo de Auth/usuario.

Validacoes obrigatorias para o COS:

- nome limpo, sem CNPJ, endereco ou texto juridico;
- documento normalizado quando informado;
- busca de duplicidade por documento;
- se documento ausente, exigir confirmacao reforcada;
- status dentro dos valores aceitos;
- quando houver cliente parecido, pedir escolha humana.

Impactos:

- cliente errado contamina contratos, financeiro, documentos, juridico e dashboard;
- duplicidade de cliente quebra conciliacoes futuras.

### `contracts`

Finalidade: representar acordo comercial com cliente.

Campos operacionais:

- identidade: `contract_number`, `client_id`;
- tipo: `type`, `contract_type`;
- status: `status`;
- datas: `start_date`, `end_date`, `due_day`;
- valores: `monthly_value`, `total_value`, `down_payment`, `linked_asset_value`;
- parcelas/resumos: `installments_count`, `paid_installments`, `pending_installments`, `overdue_installments`, `amount_paid`, `amount_pending`, `amount_overdue`;
- documentos: `contract_pdf_url`, `receipt_url`, `other_documents_url`;
- acesso publico: `public_access_token`, `public_access_enabled`, `public_access_created_at`;
- operacao: `payment_method`, `cost_center`, `dre_category`, `notes`;
- legado/simplificado: `equipment_id`, `equipment_quantity`.

Campos obrigatorios na UI atual:

- `client_id`;
- `type`;
- `status`;
- `start_date`;
- data/dia de vencimento;
- `monthly_value`;
- equipamentos quando o tipo for locacao.

Tipos conhecidos:

- `locacao`;
- `venda`;
- `servico`.

Status conhecidos:

- `ativo`;
- `encerrado`;
- `cancelado`;
- `inadimplente`.

Relacionamentos:

- `client_id` -> `clients`;
- `contract_equipment` vincula contratos a equipamentos;
- `installments` usa `contract_id`;
- `financial_entries` pode usar `contract_id`;
- `documents` pode usar `contract_id`;
- `legal_cases` pode usar `contract_id`;
- dashboard usa contratos e views/resumos.

Regras reais:

- a tela gera numero de contrato;
- cria token publico;
- cria parcelas;
- vincula equipamentos;
- recalcula estoque dos equipamentos vinculados;
- contrato de locacao exige estoque disponivel.

Campos que o COS nao deve manipular diretamente:

- contadores/resumos de parcelas;
- valores agregados `amount_*`;
- token publico sem regra dedicada;
- URLs de documentos sem upload real;
- qualquer campo que seja consequencia de parcelas ou vinculos.

Validacoes obrigatorias para o COS:

- cliente resolvido com ID real;
- data inicial valida;
- data final posterior a data inicial;
- valor mensal positivo;
- vencimento entre 1 e 31;
- tipo e status aceitos;
- se locacao, equipamentos resolvidos e estoque suficiente;
- verificar contrato semelhante ativo para o mesmo cliente;
- preview de parcelas;
- preview de impacto no estoque;
- preview de impacto financeiro/DRE.

Impactos:

- contrato cria compromissos financeiros;
- contrato altera estoque se houver equipamentos;
- contrato gera parcelas;
- contrato pode gerar receitas recorrentes previstas;
- contrato alimenta dashboard por status, vencimento e inadimplencia.

### `contract_equipment`

Finalidade: vincular equipamento a contrato.

Campos:

- `contract_id`;
- `equipment_id`;
- `quantity`;
- `asset_value`.

Regras:

- quantidade deve ser positiva;
- equipamento deve existir;
- contrato deve existir;
- quantidade nao pode exceder disponibilidade;
- apos vinculo, estoque precisa ser recalculado.

COS deve validar:

- equipamento por ID real, nao apenas nome;
- estoque antes/depois;
- duplicidade do mesmo equipamento no mesmo contrato;
- impacto em `quantity_rented` e `quantity_available`.

Nunca fazer:

- criar vinculo sem recalcular estoque;
- criar vinculo com estoque negativo;
- inferir equipamento por texto ambiguo.

### `equipment`

Finalidade: inventario e estoque operacional.

Campos operacionais:

- identidade: `name`, `category`, `description`, `brand`, `model`, `configuration`, `serial_number`;
- quantidades: `quantity_total`, `quantity_available`, `quantity_rented`, `quantity_reserved`, `quantity_maintenance` e aliases;
- valores: `purchase_value`, `sale_value`, `rental_value`, `purchase_unit_value`, `monthly_rental_value`;
- status: `status`;
- observacoes: `notes`.

Obrigatorios na UI:

- `name`;
- `category`;
- `quantity_total`;
- `status`.

Categorias conhecidas:

- `servidor`;
- `computador`;
- `impressora`;
- `rede`;
- `telefonia`;
- `seguranca`;
- `outro`.

Status conhecidos:

- `disponivel`;
- `locado`;
- `reservado`;
- `manutencao`;
- `vendido`;
- `baixado`.

Relacionamentos:

- `contract_equipment`;
- `maintenance_orders`;
- `documents`;
- `assets`;
- dashboard de equipamentos/estoque.

Regras reais:

- disponibilidade pode ser campo salvo ou calculada por total menos locado;
- contratos recalculam locado/disponivel;
- manutencao pode afetar leitura de disponibilidade operacional.

COS deve validar:

- quantidade inteira positiva;
- status aceito;
- categoria aceita;
- serial unico quando houver serial;
- nao editar quantidade disponivel como substituto de contrato;
- se for criar muitos itens, preview item a item.

### `financial_entries`

Finalidade: lancamentos de receitas e despesas.

Campos operacionais:

- `type`;
- `status`;
- `description`;
- `value` / `amount`;
- `competence_date`;
- `due_date`;
- `payment_date`;
- `bank_account_id`;
- `dre_category_id`;
- `cost_center_id`;
- `client_id`;
- `contract_id`;
- `installment_id`;
- `supplier_name`;
- `payment_method`;
- `recurrence`;
- `tags`;
- `notes`;
- `attachment_type`;
- `attachment_url`.

Obrigatorios na UI completa:

- tipo;
- descricao;
- valor;
- vencimento;
- categoria DRE;
- conta bancaria.

Regras atuais:

- status deriva do tipo e da data de pagamento em alguns fluxos;
- DRE depende da categoria e da competencia;
- dashboard depende de tipo, status, datas e valores;
- anexo financeiro pode criar documento.

COS deve validar:

- tipo `receita` ou `despesa`;
- descricao curta e operacional;
- valor positivo e confiavel;
- competencia e vencimento coerentes;
- conta bancaria real quando obrigatoria;
- categoria DRE real quando obrigatoria;
- cliente/contrato resolvido quando informado;
- duplicidade por descricao + valor + competencia + cliente/contrato;
- se veio de contrato, comparar com valor mensal esperado;
- se veio de parcela, comparar com parcela.

Nao manipular automaticamente:

- recorrencia;
- parcelas em lote;
- ajustes retroativos;
- baixa/pagamento sem confirmacao explicita;
- lancamentos que alterem DRE sem categoria validada.

### `bank_accounts`

Finalidade: contas financeiras/bancarias.

Campos:

- `name`;
- `bank_name`;
- `agency`;
- `account_number`;
- `account_type`;
- `opening_balance`;
- `current_balance`;
- `is_active`;
- `open_finance_connected`;
- `last_sync_at`.

Tipos:

- `corrente`;
- `poupanca`;
- `caixa`;
- `investimento`.

COS deve saber:

- saldo bancario pode ser saldo declarado, nao necessariamente calculado;
- conciliacao precisa comparar saldo de banco com lancamentos financeiros;
- diferenca deve gerar diagnostico, nao correcao automatica.

### `documents`

Finalidade: registrar arquivos e seus vinculos.

Campos:

- `name`;
- `type`;
- `file_url`;
- `file_path`;
- `mime_type`;
- `size_bytes`;
- `bucket`;
- `path`;
- `client_id`;
- `contract_id`;
- `installment_id`;
- `financial_entry_id`;
- `equipment_id`;
- `legal_case_id`;
- `notes`.

Buckets conhecidos:

- `gate-documents`;
- `gate-contracts`;
- `gate-legal`.

COS deve validar:

- arquivo original disponivel;
- tipo documental escolhido;
- entidade de destino resolvida;
- nao anexar por inferencia ambigua;
- upload real antes do insert;
- erro de storage deve aparecer como erro real.

### `installments`

Finalidade: parcelas associadas a contratos.

Campos:

- `contract_id`;
- `client_id`;
- `installment_number`;
- `original_value`;
- `updated_value`;
- `paid_value`;
- `due_date`;
- `payment_date`;
- `status`;
- `fine_value`;
- `interest_value`;
- `discount_value`;
- `days_overdue`;
- `notes`;
- `total_contract_value`;
- `installments_count`;
- `down_payment`;
- `installment_value`;
- `first_due_date`;
- `fixed_due_day`;
- `apply_late_fee`;
- `fine_amount`;
- `interest_amount`.

COS deve saber:

- parcelas sao consequencia de contrato;
- parcelas afetam inadimplencia;
- parcelas podem se relacionar a financeiro;
- criar parcela solta e perigoso;
- calendario deve ser previewado.

### `dre_categories`

Finalidade: categorias que conectam financeiro a DRE.

Campos:

- `name`;
- `group_name`;
- `type`;
- `sort_order`;
- `active`.

COS deve validar:

- categoria existe e esta ativa;
- tipo da categoria combina com receita/despesa;
- categoria ausente reduz confianca do lancamento financeiro;
- criacao/edicao de categoria e fase futura.

### `dre_manual_adjustments`

Finalidade: ajuste manual de valor na DRE.

Campos:

- `year`;
- `month`;
- `dre_category_id`;
- `previous_value`;
- `new_value`;
- `reason`;
- `responsible`.

Regra:

- exige motivo e responsavel;
- altera a leitura gerencial;
- deve ser usado somente com governanca.

COS deve inicialmente:

- sugerir ajuste;
- explicar impacto;
- exigir confirmacao reforcada;
- nao executar ate existir fase aprovada.

### `dre_monthly_closings`

Finalidade: registrar fechamento mensal.

Campos:

- `year`;
- `month`;
- `revenue_total`;
- `expenses_total`;
- `operational_profit`;
- `operational_result`;
- `previous_balance`;
- `operation_balance`;
- `bank_balance`;
- `difference`;
- `status`;
- `closed_at`;
- `closed_by`.

COS deve saber:

- fechamento mensal e operacao sensivel;
- antes de fechar, precisa validar financeiro, contratos, estoque, banco, DRE e dashboard;
- se houver divergencias, status deve ser diagnostico/aguardando correcao;
- fechamento automatico nao deve ser liberado sem fase formal.

### `dre_imports` e `dre_import_rows`

Finalidade: historico/importacao DRE.

Campos:

- importacao: `file_name`, `sheet_name`, `year`, `imported_by`, `import_kind`;
- linhas: `row_index`, `group_name`, `account_name`, `row_type`, meses `jan` a `dez`, `total`, `raw_label`, `raw_data`.

Regra critica:

- DRE historica e DRE operacional nao podem ser misturadas.

### `dre_operational_template_rows` e `dre_operational_baseline_values`

Finalidade: estrutura e baseline da DRE operacional.

COS deve saber:

- alterar template operacional tem alto impacto;
- substituicao de template pode remover/substituir estrutura por ano;
- nao deve ser executado pelo COS em fases iniciais.

### `legal_cases`

Finalidade: processos/cobrancas juridicas.

Campos:

- relacoes: `client_id`, `contract_id`, `installment_id`;
- identificacao: `case_number`, `process_number`;
- responsaveis: `responsible_internal`, `lawyer_name`, `law_office`;
- estado: `status`, `stage`, `risk`, `next_deadline`;
- descricao: `summary`, `case_summary`, `notes`;
- valores: `original_value`, `monthly_value`, `overdue_installments`, `fine_value`, `interest_value`, `court_costs`, `attorney_fees`, `discount_value`, `updated_value`, `negotiated_value`, `paid_value`, `balance_due`;
- acordo: `is_installment_agreement`, `agreement_installments`, `agreement_down_payment`, `agreement_installment_value`, `first_due_date`, `payment_method`.

Status conhecidos:

- `em_analise`;
- `notificacao_extrajudicial`;
- `em_negociacao`;
- `acordo_firmado`;
- `acao_judicial`;
- `em_execucao`;
- `encerrado`;
- `perdido`.

Riscos conhecidos:

- envolve cobranca e valores sensiveis;
- precisa resolver cliente/contrato/parcela;
- precisa preview completo antes de criar ou editar.

### `partner_entries`, `partners`, `partner_distribution_rules`

Finalidade: socios, aportes, retiradas, distribuicao e regras.

`partner_entries`:

- `partner_id`;
- `type`;
- `description`;
- `competence_date`;
- `value`;
- `status`;
- `financial_entry_id`.

Status conhecidos:

- `previsto`;
- `pago`.

`partners`:

- `name`;
- `participation_percentage`;
- `fixed_monthly_value`;
- `result_participation_percentage`;
- `active`.

COS deve inicialmente:

- ler e analisar;
- nao editar regras de distribuicao sem fase propria;
- nao gerar distribuicao automatica sem fechamento validado.

### `maintenance_orders`

Finalidade: chamados e ordens de manutencao.

Campos conhecidos:

- `ticket_number`;
- `equipment_id`;
- `client_id`;
- `contract_id`;
- `problem`;
- `diagnosis`;
- `solution`;
- `priority`;
- `technician`;
- `status`;
- `entry_date`;
- `expected_exit_date`;
- `completed_at`;
- `cost`;
- `notes`.

COS deve validar:

- equipamento existe;
- cliente/contrato coerentes;
- prioridade e status aceitos pela UI;
- custo nao deve virar financeiro automaticamente sem confirmacao.

### `assets`

Finalidade: patrimonio.

Campos:

- `name`;
- `category`;
- `acquisition_value`;
- `current_value`;
- `depreciation_value`;
- `location`;
- `status`;
- `equipment_id`.

COS deve saber:

- patrimonio pode se relacionar a equipamento;
- valor patrimonial nao e o mesmo que valor de locacao;
- nao misturar estoque operacional com patrimonio sem validacao.

### `cos_action_logs`

Finalidade: auditoria de acoes COS.

Campos:

- `user_id`;
- `action_type`;
- `source_file_name`;
- `source_file_type`;
- `source_confidence`;
- `payload`;
- `result`;
- `status`;
- `error_message`;
- `created_at`.

Regra:

- toda execucao COS deve registrar log real;
- falhas tambem devem ser logadas quando possivel;
- preview/diagnostico futuro tambem deveria ter log ou sessao persistente propria.

## 6. Endpoints e acoes atuais

### `POST /api/cos`

Finalidade:

- receber mensagens;
- receber arquivos;
- responder perguntas;
- gerar analises/previews.

Entradas:

- JSON com `message`;
- multipart com `message` e `files`.

Validacoes:

- usuario autenticado;
- mensagem ou arquivo obrigatorio.

Uso futuro:

- detectar entrada estruturada;
- gerar intents operacionais;
- nao executar diretamente sem review/action endpoint.

### `POST /api/cos/actions/create-client`

Finalidade:

- criar cliente individual.

Validacoes atuais importantes:

- usuario autenticado;
- nome obrigatorio;
- nome sanitizado;
- bloqueio de nome contaminado por CNPJ/endereco/texto juridico;
- confirmacao reforcada se sem documento;
- busca de duplicidade por documento.

Pode ser usado pelo COS:

- sim, ja permitido.

Evolucao necessaria:

- aceitar entrada estruturada do chat;
- retornar candidatos de duplicidade;
- preview com campos em portugues;
- log mais rico de origem estruturada.

### `POST /api/cos/actions/create-financial-entry`

Finalidade:

- criar lancamento financeiro individual.

Validacoes atuais:

- tipo receita/despesa;
- descricao;
- valor positivo;
- competencia ou vencimento;
- bloqueio de valor parcial suspeito;
- bloqueio de descricao juridica longa;
- bloqueio em baixa confianca quando aplicavel.

Pode ser usado pelo COS:

- sim, mas com cautela.

Lacunas:

- UI completa exige categoria DRE e conta bancaria;
- endpoint atual e mais permissivo do que o formulario completo;
- precisa evoluir antes de ser base de conciliacao/fechamento.

### `POST /api/cos/actions/attach-document`

Finalidade:

- anexar documento ao Storage e criar registro em `documents`.

Validacoes:

- usuario autenticado;
- arquivo obrigatorio;
- arquivo original precisa estar disponivel.

Pode ser usado pelo COS:

- sim, ja permitido.

Lacunas:

- resolver IDs por nome;
- evitar vinculo ambiguo;
- persistencia de binarios nao existe no localStorage.

### Endpoints inexistentes para futuro COS executor

Ainda nao existem endpoints COS dedicados para:

- criar contrato;
- criar equipamento;
- vincular equipamento a contrato;
- criar parcelas;
- criar manutencao;
- criar caso juridico;
- criar/editar socio;
- criar ajuste DRE;
- executar fechamento mensal;
- editar registros;
- excluir registros;
- executar lote.

Esses endpoints precisam existir antes de liberar as capacidades correspondentes.

## 7. Como o COS deve interpretar entrada estruturada

### Pipeline padrao

```text
Texto estruturado do usuario
-> detectar intencao
-> identificar entidade principal
-> normalizar campos
-> validar campos minimos
-> buscar registros relacionados
-> detectar duplicidades/ambiguidade
-> calcular impactos
-> gerar preview
-> pedir confirmacao
-> executar endpoint permitido
-> registrar log
-> retornar resultado
```

### Modelo: cadastrar cliente

Entrada recomendada:

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

Campos minimos:

- razao social ou nome;
- documento recomendado.

Validacoes:

- nome limpo;
- CNPJ/CPF valido quando informado;
- duplicidade por documento;
- duplicidade por nome parecido;
- status aceito.

Preview:

- dados que serao gravados;
- possiveis duplicidades;
- campos ausentes;
- confirmacao se sem documento.

Endpoint provavel:

- atual `/api/cos/actions/create-client`.

### Modelo: cadastrar contrato

Entrada recomendada:

```text
Cadastrar contrato:
Cliente:
Tipo:
Status:
Data inicio:
Data final:
Prazo:
Valor mensal:
Vencimento:
Caucao:
Reajuste:
Equipamentos:
Observacoes:
Documento:
```

Campos minimos:

- cliente;
- tipo;
- status;
- data inicio;
- vencimento;
- valor mensal;
- equipamentos se locacao.

Validacoes:

- cliente existe;
- se nao existe, sugerir cadastrar cliente primeiro;
- datas coerentes;
- prazo calculado bate com data inicial/final;
- valor mensal positivo;
- equipamentos existem ou precisam ser cadastrados;
- estoque disponivel;
- contrato semelhante ativo;
- impacto financeiro previsto;
- impacto no estoque.

Preview obrigatorio:

- contrato;
- parcelas;
- equipamentos vinculados;
- estoque antes/depois;
- receitas previstas;
- documentos sugeridos.

Endpoint necessario:

- novo endpoint COS server-side.

### Modelo: criar financeiro

Entrada recomendada:

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
Observacoes:
```

Campos minimos:

- tipo;
- descricao;
- valor;
- vencimento ou competencia.

Campos recomendados:

- categoria DRE;
- conta bancaria;
- cliente/contrato quando aplicavel.

Validacoes:

- valor positivo;
- tipo aceito;
- categoria DRE real;
- conta bancaria real;
- cliente/contrato resolvido;
- duplicidade por valor/data/descricao;
- se contrato informado, valor bate com contrato/parcela.

Preview:

- lancamento;
- impacto na DRE;
- impacto no banco;
- possivel duplicidade.

Endpoint:

- atual existe, mas deve ser endurecido para aderir ao formulario completo.

### Modelo: cadastrar equipamento

Entrada recomendada:

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

Campos minimos:

- nome;
- categoria;
- quantidade;
- status.

Validacoes:

- quantidade inteira positiva;
- categoria aceita;
- status aceito;
- serial unico;
- item duplicado por nome/configuracao.

Preview:

- item;
- quantidade;
- disponibilidade inicial;
- possiveis duplicidades.

Endpoint necessario:

- novo endpoint COS.

### Modelo: anexar documento

Entrada recomendada:

```text
Anexar documento:
Tipo:
Cliente:
Contrato:
Financeiro:
Equipamento:
Juridico:
Observacoes:
Arquivo:
```

Campos minimos:

- arquivo;
- tipo.

Validacoes:

- arquivo original disponivel;
- entidade de destino resolvida;
- nao vincular se houver ambiguidade;
- tamanho/tipo do arquivo aceito pelas regras do app/storage.

Endpoint:

- atual `/api/cos/actions/attach-document`.

### Modelo: criar caso juridico

Entrada recomendada:

```text
Criar juridico:
Cliente:
Contrato:
Parcela:
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
Observacoes:
```

Campos minimos:

- cliente;
- status;
- etapa.

Validacoes:

- cliente real;
- contrato/parcela coerentes quando informados;
- status/risco aceitos;
- prazo valido;
- valores numericos;
- duplicidade por cliente/contrato/processo.

Endpoint necessario:

- novo endpoint COS juridico.

### Modelo: fechamento mensal

Entrada recomendada:

```text
Fechar mes:
Mes:
Ano:
Saldo bancario informado:
Conta bancaria:
Observacoes:
```

Regra:

- inicialmente diagnosticar;
- fechamento real somente em fase aprovada;
- se houver divergencia, nao fechar.

## 8. Regras de negocio por modulo

### Clientes

Criar cliente afeta:

- contratos futuros;
- financeiro;
- documentos;
- juridico;
- manutencoes;
- dashboard por relacionamentos.

COS deve:

- evitar duplicidade;
- preservar documento limpo;
- bloquear nome contaminado;
- mostrar cliente semelhante antes de criar.

### Contratos

Criar contrato afeta:

- contratos;
- parcelas;
- estoque;
- documentos;
- financeiro previsto;
- dashboard;
- eventual juridico futuro.

Fluxo correto para contrato:

```text
Resolver cliente
-> validar contrato
-> resolver equipamentos
-> validar estoque
-> calcular parcelas
-> calcular impacto financeiro
-> gerar preview
-> confirmar
-> criar contrato
-> criar parcelas
-> criar vinculos de equipamento
-> recalcular estoque
-> anexar documento se houver
-> log
```

Nunca:

- criar contrato sem cliente;
- criar contrato sem validar estoque;
- criar contrato com equipamentos ambiguos;
- criar parcelas sem preview;
- atualizar estoque manualmente sem regra de vinculo.

### Equipamentos e estoque

Estoque deve ser visto como consequencia de:

- cadastro de equipamentos;
- vinculos em contratos;
- manutencao;
- reservas/status;
- baixas/vendas.

COS deve conciliar:

- quantidade total;
- quantidade locada;
- quantidade disponivel;
- quantidade em manutencao;
- contratos ativos;
- equipamentos sem vinculo;
- vinculos sem contrato ativo.

Diagnosticos importantes:

- equipamento locado sem contrato;
- contrato ativo sem equipamento;
- estoque negativo;
- estoque disponivel inconsistente;
- manutencao em equipamento locado.

### Financeiro

Financeiro deve ser fonte para:

- DRE;
- dashboard;
- inadimplencia;
- banco;
- socios;
- fechamento mensal.

COS deve validar:

- competencia;
- vencimento;
- pagamento;
- categoria DRE;
- conta bancaria;
- cliente/contrato;
- duplicidade;
- status.

Diagnosticos importantes:

- receita de contrato sem lancamento;
- lancamento sem categoria DRE;
- lancamento sem conta bancaria;
- despesa duplicada;
- competencia incorreta;
- status incoerente com data de pagamento;
- valor divergente do contrato/parcela.

### DRE

DRE operacional deve ser explicada como resultado de:

- `financial_entries`;
- `dre_categories`;
- ajustes manuais;
- socios;
- contas bancarias;
- fechamentos;
- templates/baseline operacionais.

COS deve:

- comparar financeiro com DRE;
- separar DRE historica de operacional;
- detectar categoria ausente;
- detectar lancamento fora da competencia;
- explicar ajustes manuais;
- nao alterar DRE automaticamente.

### Dashboard

Dashboard e camada de leitura. Fontes atuais incluem views e helpers como:

- `v_dashboard_financial`;
- `v_bank_balances`;
- `v_contracts_summary`;
- `v_overdue_installments_summary`;
- `v_assets_summary`;
- `v_equipment_summary`;
- `v_legal_summary`;
- `v_profit_distribution_current_month`;
- `notifications`;
- `v_revenue_chart`.

COS deve:

- usar dashboard como indicador consolidado;
- quando houver divergencia, voltar nas fontes;
- nao alterar dashboard diretamente;
- explicar qual dado de origem parece causar o indicador.

### Documentos

Documentos devem servir como evidencia vinculada.

COS deve:

- anexar somente com arquivo real;
- resolver destino;
- nao depender apenas de nome textual;
- registrar tipo e observacoes;
- permitir preview do vinculo.

### Juridico

Juridico se relaciona a:

- cliente;
- contrato;
- parcelas;
- valores em aberto;
- documentos;
- acordos.

COS deve:

- detectar inadimplencia que pode virar juridico;
- sugerir abertura de caso;
- criar caso apenas com preview e endpoint dedicado;
- nao negociar/alterar acordo automaticamente.

### Socios

Socios se relacionam a:

- distribuicao de lucros;
- aportes;
- retiradas;
- resultado operacional;
- financeiro.

COS deve:

- ler distribuicoes;
- explicar valores;
- nao alterar regras sem fase formal.

### Manutencoes

Manutencao se relaciona a:

- equipamento;
- cliente;
- contrato;
- custo;
- disponibilidade.

COS deve:

- abrir chamado somente quando endpoint existir;
- validar equipamento/cliente/contrato;
- informar impacto no estoque se equipamento sair de uso;
- nao criar custo financeiro automaticamente sem confirmacao.

## 9. Conciliações obrigatorias

### Financeiro x banco

Fontes:

- `financial_entries`;
- `bank_accounts`;
- possiveis extratos importados futuramente.

Perguntas:

- soma de entradas/saidas bate com saldo?
- saldo inicial foi considerado?
- ha lancamentos pagos sem conta bancaria?
- ha pagamentos sem data?
- ha diferenca entre saldo operacional e saldo informado?

Saida esperada:

- valor calculado;
- saldo banco;
- diferenca;
- principais candidatos da diferenca;
- sugestoes de investigacao.

### Financeiro x DRE

Fontes:

- `financial_entries`;
- `dre_categories`;
- `dre_manual_adjustments`;
- `dre_monthly_closings`;
- DRE operacional.

Perguntas:

- todo lancamento tem categoria DRE?
- categoria combina com tipo?
- competencia esta no mes correto?
- valores da DRE batem com lancamentos?
- ajustes manuais explicam diferencas?

Saida esperada:

- total financeiro por categoria;
- total DRE por categoria;
- diferenca;
- lancamentos sem categoria;
- ajustes envolvidos.

### DRE x dashboard

Fontes:

- DRE operacional;
- views do dashboard;
- financeiro.

Perguntas:

- receita total do dashboard bate com DRE?
- despesa total bate?
- lucro/resultado bate?
- periodo usado e o mesmo?
- existem filtros/status diferentes?

Saida esperada:

- indicador divergente;
- fonte usada;
- periodo;
- causa provavel.

### Contratos x financeiro

Fontes:

- `contracts`;
- `installments`;
- `financial_entries`;
- clientes.

Perguntas:

- contrato ativo possui receita prevista?
- parcelas existem?
- valor mensal do contrato bate com lancamentos?
- existe receita recorrente sem contrato?
- contrato vencido continua gerando receita?

Saida esperada:

- contratos sem financeiro;
- lancamentos sem contrato;
- diferencas de valor;
- diferencas de competencia.

### Contratos x parcelas

Fontes:

- `contracts`;
- `installments`.

Perguntas:

- quantidade de parcelas bate com prazo?
- datas de vencimento seguem o dia correto?
- soma das parcelas bate com valor esperado?
- status das parcelas reflete pagamentos?

Saida esperada:

- calendario esperado;
- calendario real;
- divergencias.

### Equipamentos x estoque x contratos

Fontes:

- `equipment`;
- `contract_equipment`;
- `contracts`;
- `maintenance_orders`.

Perguntas:

- quantidade locada bate com contratos ativos?
- existe estoque negativo?
- equipamento em manutencao esta em contrato ativo?
- contrato ativo sem equipamento?
- equipamento locado sem contrato?

Saida esperada:

- estoque calculado;
- estoque salvo;
- diferenca;
- registros causadores.

### Documentos x registros

Fontes:

- `documents`;
- clientes;
- contratos;
- financeiro;
- juridico;
- equipamentos.

Perguntas:

- contrato possui documento?
- documento esta vinculado ao cliente correto?
- documento financeiro esta ligado ao lancamento correto?
- caso juridico possui evidencias?

Saida esperada:

- documentos sem vinculo;
- registros sem documento esperado;
- vinculos suspeitos.

## 10. Fechamento mensal pelo COS

Fechamento mensal deve ser uma das principais responsabilidades futuras do COS, mas deve comecar como diagnostico.

Comando esperado:

```text
Fechar maio/2026
```

### Etapa 1 - Validar financeiro

Verificar:

- receitas do mes;
- despesas do mes;
- competencias;
- vencimentos;
- pagamentos/recebimentos;
- status;
- categorias DRE;
- contas bancarias;
- clientes;
- contratos;
- duplicidades.

Bloqueios:

- lancamentos sem categoria DRE;
- lancamentos sem conta bancaria;
- valores negativos indevidos;
- datas fora do mes;
- duplicidades provaveis.

### Etapa 2 - Validar contratos

Verificar:

- contratos ativos no mes;
- contratos vencidos;
- contratos ativos sem financeiro;
- contratos com valor divergente;
- contratos sem parcelas;
- parcelas atrasadas;
- contratos inadimplentes.

Bloqueios:

- contrato ativo sem parcela quando deveria ter;
- receita esperada sem lancamento;
- valor de lancamento diferente do contrato sem justificativa.

### Etapa 3 - Validar estoque

Verificar:

- quantidade total;
- quantidade locada;
- quantidade disponivel;
- manutencoes;
- contratos sem equipamento;
- equipamentos locados sem contrato.

Bloqueios:

- estoque negativo;
- locado maior que total;
- contrato de locacao sem equipamentos.

### Etapa 4 - Validar banco

Comparar:

```text
saldo operacional calculado
x
saldo bancario informado/salvo
```

Verificar:

- lancamentos pagos sem conta;
- lancamentos pendentes marcados como pagos;
- saldo inicial;
- diferencas por conta bancaria;
- datas de pagamento fora do periodo.

Se houver diferenca:

- localizar origem provavel;
- listar candidatos;
- nao ajustar automaticamente.

### Etapa 5 - Validar DRE

Comparar:

```text
financeiro
x
DRE operacional
x
dashboard
```

Encontrar:

- receitas ausentes;
- despesas ausentes;
- categorias incorretas;
- ajustes manuais;
- lancamentos duplicados;
- competencias incorretas;
- diferencas entre indicadores.

### Etapa 6 - Gerar diagnostico

Formato esperado:

```text
Fechamento Maio/2026

Status: aguardando correcoes

Divergencias:
- Receita sem categoria DRE: R$ X
- Contrato ativo sem lancamento financeiro: Cliente Y
- Diferenca banco x financeiro: R$ Z
- Equipamento locado sem vinculo: Item W
- Despesa duplicada: Lancamento K
```

### Etapa 7 - Sugerir correcoes

Para cada correcao:

- explicar problema;
- mostrar registro afetado;
- mostrar antes/depois;
- informar impacto;
- pedir confirmacao.

Nunca:

- fechar mes com divergencia critica;
- corrigir DRE automaticamente;
- alterar saldo bancario automaticamente;
- criar lancamentos em massa;
- editar contratos/equipamentos sem preview.

## 11. Mapa de capacidades necessarias do COS

### A) Ler / Buscar

O COS precisa buscar:

- cliente por nome, documento, email, telefone;
- contrato por numero, cliente, status, periodo;
- equipamento por nome, categoria, serial, status, disponibilidade;
- financeiro por descricao, valor, competencia, cliente, contrato, status;
- documento por tipo, nome, entidade vinculada;
- DRE por ano, mes, categoria, resultado;
- inadimplencia por parcelas/lancamentos vencidos;
- contratos vencendo/vencidos;
- estoque disponivel;
- manutencoes abertas;
- casos juridicos;
- socios e distribuicoes;
- indicadores do dashboard.

Necessario tecnicamente:

- funcoes de busca parametrica;
- retorno estruturado com IDs;
- tratamento de ambiguidades;
- score de confianca de match;
- preview de registros candidatos.

### B) Criar / Cadastrar

Fase atual permitida:

- cliente;
- financeiro individual;
- documento.

Fases futuras:

- contrato;
- equipamento;
- manutencao;
- juridico;
- patrimonio;
- socio/lancamento de socio;
- ajuste DRE com governanca.

Cada criacao exige:

- schema de entrada;
- validacao;
- endpoint server-side;
- preview;
- confirmacao;
- log.

### C) Editar

Editar exige:

- identificar registro alvo com certeza;
- diff antes/depois;
- validacao de campos editaveis;
- bloqueio de campos calculados;
- confirmacao reforcada;
- log detalhado.

Nao liberar edicao antes de:

- endpoints PATCH por modulo;
- controle de permissao;
- testes de regressao;
- historico de alteracoes.

### D) Analisar

O COS deve analisar:

- receitas;
- despesas;
- inadimplencia;
- estoque;
- contratos;
- rentabilidade;
- clientes;
- DRE;
- dashboard;
- fluxo financeiro;
- juridico;
- manutencoes;
- socios.

### E) Conciliar

O COS deve conciliar:

- financeiro x banco;
- financeiro x DRE;
- DRE x dashboard;
- contratos x financeiro;
- contratos x parcelas;
- equipamentos x estoque;
- estoque x contratos;
- documentos x registros;
- juridico x inadimplencia;
- socios x resultado.

## 12. Governanca de execucao

### Operacoes sempre permitidas como leitura

- consultar;
- listar;
- resumir;
- explicar;
- diagnosticar;
- sugerir.

### Operacoes permitidas hoje com confirmacao

- cadastrar cliente;
- criar lancamento financeiro individual;
- anexar documento.

### Operacoes bloqueadas ate fase futura

- criar contrato;
- criar equipamentos;
- criar parcelas;
- criar recorrencias;
- criar manutencao;
- criar juridico;
- criar patrimonio;
- criar/editar socio;
- editar qualquer registro;
- excluir qualquer registro;
- fechar DRE;
- ajustar DRE;
- executar lote;
- confirmar tudo.

### Operacoes que nunca devem ser automaticas

- alteracao de Auth/Login/Usuarios/Sessao/RLS;
- DROP/TRUNCATE/SQL destrutivo;
- DELETE em massa;
- alteracao direta de dashboard;
- mistura de DRE historica e operacional;
- fechamento mensal com divergencias;
- baixa financeira em massa;
- edicao de campos calculados;
- correcao de saldo bancario sem evidencia.

## 13. Motor de preview futuro

Todo preview deve conter:

- intencao detectada;
- entidade principal;
- dados recebidos;
- dados normalizados;
- campos obrigatorios presentes/ausentes;
- registros relacionados encontrados;
- candidatos ambiguos;
- duplicidades provaveis;
- impactos operacionais;
- riscos;
- acao que sera executada;
- endpoint que sera chamado;
- log que sera registrado;
- botao de confirmar somente se acao permitida.

Exemplo para contrato:

```text
Acao: cadastrar contrato
Cliente encontrado: ATIBAIA (id ...)
Tipo: locacao
Periodo: 27/05/2025 a 27/05/2028
Prazo calculado: 36 meses
Valor mensal: R$ ...
Parcelas previstas: 36
Equipamentos:
- 10 Nobreak APC: estoque disponivel X, apos contrato Y
- 2 Rack 42U: estoque disponivel X, apos contrato Y
Impacto financeiro:
- receita mensal prevista R$ ...
Impacto DRE:
- categoria pendente/definida
Pendencias:
- anexar contrato assinado
Confirmacao:
- criar contrato, parcelas e vinculos de equipamentos
```

## 14. Riscos atuais para transformar o COS em executor

### Riscos altos

- resolver entidade errada por nome semelhante;
- criar contrato sem recalcular estoque;
- criar parcelas duplicadas;
- criar financeiro sem categoria DRE/conta;
- fechar DRE com divergencia;
- ajustar DRE operacional incorretamente;
- editar campos calculados;
- executar lote sem granularidade.

### Riscos medios

- duplicar clientes por documento formatado diferente;
- anexar documento ao registro errado;
- criar juridico sem vinculo correto;
- criar equipamento duplicado;
- interpretar status incompatível entre UI e banco;
- divergencia entre `value` e `amount`.

### Riscos de UX

- preview tecnico demais;
- excesso de campos;
- usuario confirmar sem entender impacto;
- erro real ficar oculto;
- acoes bloqueadas parecerem disponiveis.

### Mitigacoes obrigatorias

- preview humano;
- confirmacao explicita;
- validacao server-side;
- logs reais;
- diff antes/depois para edicao;
- bloqueios por fase;
- testes fixtures;
- mensagens de erro reais.

## 15. Dependencias tecnicas para o COS executor

Antes de liberar novas capacidades, criar:

1. Schema oficial de comandos estruturados.
2. Detector de intencao para comandos.
3. Normalizador por entidade.
4. Resolvedor de entidades existentes.
5. Motor de validacao de regras.
6. Motor de preview.
7. Endpoints server-side por acao.
8. Logs completos por acao.
9. Controle de permissao/fase por capacidade.
10. Testes fixtures por modulo.
11. Historico persistente de analises/execucoes.
12. Tratamento de idempotencia para evitar comandos duplicados.

## 16. Roadmap recomendado

### Fase 1 - Entrada estruturada para acoes ja seguras

Objetivo:

- aceitar texto estruturado para cliente, financeiro individual e documento.

Nao fazer:

- contrato;
- equipamento;
- lote;
- edicao;
- DRE.

Entregas:

- schema de entrada;
- preview padronizado;
- testes fixtures;
- logs.

### Fase 2 - Busca e resolucao de entidades

Objetivo:

- COS encontrar registros reais com confianca.

Entregas:

- buscar cliente/contrato/equipamento/financeiro/documento;
- retornar candidatos;
- pedir escolha quando ambiguo.

### Fase 3 - Contrato assistido

Objetivo:

- criar contrato a partir de dados estruturados.

Entregas:

- endpoint de contrato;
- preview de parcelas;
- preview de estoque;
- criacao atomica;
- recalc de estoque;
- log.

### Fase 4 - Equipamentos e manutencoes

Objetivo:

- criar equipamento individual;
- abrir manutencao com vinculos.

Entregas:

- validacoes de estoque;
- validacao de serial/configuracao;
- impacto em disponibilidade.

### Fase 5 - Financeiro robusto e conciliacao

Objetivo:

- endurecer criacao financeira;
- exigir categoria/conta quando necessario;
- diagnosticar banco x financeiro.

Entregas:

- duplicidade;
- conciliacao;
- preview de impacto DRE.

### Fase 6 - Juridico e documentos avancados

Objetivo:

- criar caso juridico;
- vincular documentos;
- sugerir acordos sem executar automaticamente.

### Fase 7 - Fechamento mensal diagnostico

Objetivo:

- executar checklist de fechamento;
- bloquear fechamento com divergencias;
- sugerir correcoes.

### Fase 8 - Edicao controlada

Objetivo:

- editar registros com diff.

Pre-requisitos:

- endpoints PATCH;
- logs;
- historico;
- permissao;
- testes.

### Fase 9 - DRE governada

Objetivo:

- sugerir e depois executar ajustes DRE com motivo/responsavel.

Nao liberar:

- alteracao automatica;
- fechamento automatico;
- substituicao de template sem autorizacao formal.

## 17. Como o COS deve orientar o usuario

O COS deve responder como operador:

- "Encontrei o cliente X. Posso usar este registro?"
- "Ha dois clientes parecidos. Escolha um antes de continuar."
- "O contrato esta valido, mas os equipamentos nao possuem estoque suficiente."
- "A receita esta sem categoria DRE, entao nao recomendo criar ainda."
- "O saldo banco diverge do financeiro em R$ X. Encontrei estes candidatos."
- "Nao posso executar essa acao nesta etapa. Posso gerar o preview e listar pendencias."

O COS nao deve responder como parser:

- "Extraí os campos."
- "Acho que este e o CNPJ."
- "Vou cadastrar tudo."

## 18. Regras oficiais de seguranca

Nunca:

- alterar Auth;
- alterar Login;
- alterar Usuarios;
- alterar Sessao;
- alterar RLS;
- alterar Supabase estruturalmente sem autorizacao;
- apagar dados;
- executar DELETE em massa;
- executar DROP;
- executar TRUNCATE;
- executar SQL destrutivo;
- criar mocks;
- simular sucesso;
- habilitar execucao em massa sem aprovacao;
- misturar DRE historica com DRE operacional;
- editar registros sem diff;
- executar sem preview;
- esconder erro real.

Sempre:

- preservar arquitetura atual;
- preservar Supabase;
- preservar Dashboard;
- preservar Financeiro;
- preservar Contratos;
- preservar Equipamentos;
- validar antes de executar;
- abrir preview antes de gravar;
- confirmar antes de persistir;
- mostrar erros reais;
- registrar logs reais;
- bloquear ambiguidade;
- explicar impacto.

## 19. Parecer executivo

O GATE OS ja possui os blocos necessarios para que o COS evolua para operador inteligente: clientes, contratos, equipamentos, financeiro, DRE, documentos, juridico, socios, manutencoes, patrimonio e dashboard.

O ponto central nao e fazer o COS "ler melhor PDFs". O ponto central e fazer o COS conhecer o sistema melhor do que um usuario comum:

- saber onde cada informacao mora;
- saber que campos sao obrigatorios;
- saber que campos sao calculados;
- saber quais relacionamentos precisam existir;
- saber quais impactos uma acao gera;
- saber quando deve bloquear;
- saber quando deve pedir escolha;
- saber quando deve apenas diagnosticar.

Hoje o COS esta apto para leitura, preview e acoes isoladas. Para virar executor operacional confiavel, precisa de uma camada formal de comandos estruturados, resolucao de entidades, validacao de regras, preview de impactos, endpoints server-side e logs abrangentes.

O primeiro salto deve ser conservador: entrada estruturada para as acoes ja permitidas. O segundo salto deve ser busca e resolucao de entidades. Somente depois o COS deve criar contratos, equipamentos, parcelas, manutencoes, juridico ou qualquer operacao que afete estoque, DRE, banco e dashboard.

Conclusao: o COS deve evoluir menos como extrator de documentos e mais como controlador operacional governado. A automacao so deve crescer depois que a validacao, a rastreabilidade e a confirmacao humana estiverem maduras.

