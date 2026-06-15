# GATE OS - Operational readiness audit

Data: 2026-06-15

## Regra aplicada

Toda acao visivel foi revisada para ficar em um dos tres estados:

- operacional, quando executa rota, exportacao, insert/update ou fluxo real;
- removida ou retirada do comportamento clicavel quando nao ha backend/fluxo seguro;
- desabilitada visualmente quando a funcionalidade existe no desenho do produto, mas ainda exige decisao de negocio antes de persistir dados reais.

Nenhum CTA deve abrir toast de "em preparacao" ou simular sucesso.

## Funcionalidades 100% operacionais

### Critico

- Link publico do cliente:
  - carrega contrato por token publico;
  - lista maquinas/equipamentos vinculados;
  - abre chamado real em `maintenance_orders`;
  - nao envia mais coluna inexistente `type`;
  - preserva tipo do problema e prioridade dentro de `problem`.

- Login:
  - usa Supabase Auth real via `signInWithPassword`.
  - recuperacao de senha foi desabilitada visualmente porque nao ha fluxo real configurado.

### Alto

- Clientes:
  - listagem via Supabase;
  - criacao via `createClient`;
  - detalhes em modal;
  - exportacao PDF.

- Contratos:
  - listagem via Supabase;
  - criacao de contrato, equipamentos vinculados, parcelas e documentos;
  - detalhes via rota `/contratos/[id]`;
  - link publico do cliente com geracao/copia real;
  - exportacao PDF.

- Equipamentos:
  - listagem via Supabase;
  - criacao via `createEquipment`;
  - criacao de patrimonio vinculado quando aplicavel;
  - exportacao PDF.

- Manutencoes:
  - listagem via Supabase;
  - abertura real de ordem via `createMaintenanceOrder`;
  - exportacao PDF.

- Financeiro:
  - listagem de lancamentos reais;
  - criacao de lancamento financeiro;
  - criacao de conta bancaria manual;
  - quitacao de parcela quando aplicavel;
  - categorias DRE carregadas de `dre_categories`;
  - exportacao PDF.

- DRE:
  - 2026 operacional com template, baseline, categorias, lancamentos reais e exportacoes;
  - 2022-2025 historico via `dre_historical_values`;
  - ajustes manuais e fechamento mensal nos fluxos ja conectados.

- Socios:
  - listagem via `partners`;
  - exibicao de nomes por campos alternativos reais;
  - edicao de socio via `updatePartner`;
  - lancamentos via `partner_entries`;
  - exportacao PDF.

- Documentos:
  - upload real via Supabase Storage/tabela de documentos;
  - listagem via Supabase.

- Juridico:
  - listagem e criacao de caso juridico nos fluxos existentes;
  - exportacao PDF.

- Relatorios:
  - relatorios existentes geram PDF real.

## Funcionalidades removidas ou desabilitadas

### Alto

- Clientes:
  - `Editar` e `Excluir` foram desabilitados na lista ate existir fluxo persistente seguro.

- Contratos:
  - `Editar`, `Duplicar`, `Renovar`, `Cancelar` e `Enviar para juridico` foram desabilitados quando nao ha fluxo real completo.

- Equipamentos:
  - `Gerar etiquetas`, `Ver detalhes`, `Editar` e `Descartar` foram desabilitados.
  - `Registrar manutencao` permanece ativo porque navega para o modulo real de manutencoes.

- Financeiro:
  - `Conexao bancaria`, `Importar extrato`, `Conciliar`, `Ver detalhes`, `Editar` e `Excluir` foram desabilitados quando nao ha fluxo real completo.

- Manutencoes:
  - `Ver detalhes`, `Editar` e `Atribuir tecnico` foram desabilitados.

- Patrimonio:
  - `Ver detalhes`, `Editar` e `Alienar` foram desabilitados.

- Documentos:
  - `Visualizar`, `Download` e `Excluir` foram desabilitados nos cards/listas enquanto nao houver acao real de arquivo e delecao auditada.

- Juridico:
  - atualizacao de andamento, baixa de parcelas, recibo, anexos, pagamento, acordo e encerramento foram desabilitados onde nao ha persistencia completa.

- DRE:
  - analise de divergencias e reabertura de mes foram desabilitadas.

- Dashboard:
  - filtro de ultimo mes foi desabilitado ate existir filtro real por periodo.

- Relatorios:
  - envio por e-mail, agendamento automatico e edicao de agendamento foram desabilitados.

## Funcionalidades que exigem decisao de negocio

### Critico

- Exclusao/edicao de lancamentos financeiros:
  - exige regra de auditoria, recalculo de DRE e impacto em caixa.

- Cancelamento/renovacao de contrato:
  - exige regra para parcelas, equipamentos, estoque, financeiro e juridico.

- Alienacao/descarte de patrimonio/equipamento:
  - exige baixa contabil, financeiro e trilha de auditoria.

### Alto

- Reabertura de fechamento DRE:
  - exige regra de permissao e historico de fechamento.

- Delecao de documentos:
  - exige exclusao coordenada entre Storage e tabela, com auditoria.

- Atualizacoes juridicas:
  - exigem modelagem final de historico, pagamentos, acordos e anexos.

## Rotas orfas

Nenhuma rota compilada apareceu como quebrada no build.

Rotas compiladas:

- `/`
- `/analise`
- `/cliente/contrato/[token]`
- `/clientes`
- `/clientes/[id]`
- `/configuracoes`
- `/contratos`
- `/contratos/[id]`
- `/dashboard`
- `/documentos`
- `/dre`
- `/equipamentos`
- `/financeiro`
- `/juridico`
- `/lancamentos`
- `/login`
- `/manutencoes`
- `/patrimonio`
- `/relatorios`
- `/socios`

## Componentes orfaos ou conflitos de nomenclatura

### Medio

- `MockCreateDialog` continua com nome legado, mas os usos ativos auditados chamam `onSave` real e persistem no Supabase.
  - Recomendacao: renomear para `CreateDialog` em uma rodada posterior para eliminar conflito semantico.

## Tabelas sem uso aparente

### Medio

- `dre_imports` e `dre_import_rows` permanecem como legado de snapshot/importacao.
  - A DRE por ano usa `dre_historical_values` para 2022-2025 e estrutura operacional para 2026.

## Queries sem uso ou legadas

### Medio

- Consultas de snapshot/importacao DRE permanecem como suporte legado e mensagens de diagnostico.
- Consultas de documentos ainda nao sustentam visualizar/download/delete de arquivo por registro; por isso os CTAs foram desabilitados.

## Modais sem persistencia

### Alto

- Modais de criacao baseados em `MockCreateDialog` estao operacionais quando recebem `onSave`.
- Modais/acoes sem persistencia foram removidos do comportamento clicavel ou desabilitados visualmente.

## Fluxos incompletos

### Critico

- Mutacoes destrutivas financeiras, contratuais, patrimoniais e juridicas ainda precisam de regra de negocio formal antes de ficarem ativas.

### Alto

- Visualizacao/download/delete de documentos precisa usar URL/path real do Storage.
- Atribuicao de tecnico em manutencoes precisa update real em `maintenance_orders`.
- Detalhes/edicao de equipamentos e patrimonio precisam modais ou rotas persistentes.

## Conflitos de arquitetura

### Alto

- O sistema mistura nomes internos em ingles com labels em portugues. Isso nao bloqueia operacao, mas dificulta auditoria.
- Alguns tipos de view ainda importam de `mock-data`, embora os dados sejam carregados do Supabase. Isso e tecnico/semantico, nao um mock operacional visivel.

### Medio

- Build ainda emite aviso do Recharts sobre dimensoes `-1` durante renderizacao estatica. O build passa, mas os containers de graficos devem receber dimensoes minimas consistentes em uma rodada visual.

## Validacoes finais

- `npm run lint`: passou.
- `npm run build`: passou.
- Busca por CTAs de placeholder: nenhum uso em componentes, app ou fluxos visiveis.
- Link publico do cliente nao envia mais `maintenance_orders.type`.
- DRE 2026 e historico 2022-2025 permaneceram preservados.
