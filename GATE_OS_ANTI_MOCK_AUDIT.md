# GATE OS - Auditoria antimock final

Data: 2026-06-15

## Escopo

Auditoria somente de leitura para localizar dependencias restantes de mock-data, fake-data, seed-data, placeholders, arrays hardcoded, valores estaticos e exemplos temporarios.

Nenhuma correcao foi aplicada nesta rodada.

## Metodologia

Foram pesquisados termos e padroes como:

- `mock-data`, `mock`, `MockCreateDialog`
- `placeholder`, `fallback`, `sample`, `example`, `dummy`
- arrays hardcoded com `const ... = [` e `export const ... = [`
- seeds SQL e arquivos de carga
- helpers genericos que retornam arrays vazios em falhas do Supabase

## Resumo executivo

Foram encontradas 34 ocorrencias relevantes.

Nao ha uso amplo de dados falsos para substituir tabelas operacionais principais da DRE, Financeiro, Clientes, Contratos, Equipamentos, Manutencoes, Patrimonio ou Socios. Porem ainda existem pontos que podem induzir divergencia ou esconder falha real:

- Juridico ainda possui casos estaticos usados por Contratos.
- Relatorios exibe historico/agendamentos estaticos.
- Financeiro exibe conexoes bancarias estaticas.
- Helpers genericos de Supabase retornam fallback vazio em erro de leitura.
- `lib/mock-data.ts` ainda existe como arquivo legado de tipos e valores zerados.

## Atualizacao apos correcao dos riscos altos

Status: corrigido em 2026-06-15.

Os 12 itens classificados como ALTO nesta auditoria foram tratados sem criar novos mocks:

- `juridicoCases`, `isContratoEmJuridico` e `getJuridicoByContrato` foram removidos de `lib/juridico-data.ts`.
- `components/contratos-content.tsx` passou a consultar `legal_cases` via Supabase para decidir se um contrato possui caso juridico real.
- `relatoriosRecentes` e `agendados` foram removidos de `components/relatorios-content.tsx`; as abas agora exibem estados vazios profissionais.
- `bankConnections` foi removido de `components/financeiro-content.tsx`; a secao bancaria agora usa `bank_accounts` reais.
- Foi criado `selectRowsStrict` em `lib/data/supabase-helpers.ts`.
- Modulos operacionais principais passaram a usar leitura estrita, propagando erro real de Supabase em vez de converter falhas em listas vazias.

Validacoes executadas apos a correcao:

- `npm run lint`
- `npm run build`

Riscos altos remanescentes desta auditoria: 0.

## Ocorrencias por severidade

### CRITICO

Nenhuma ocorrencia critica confirmada.

Nao foi encontrado mock que grave dados falsos em Supabase ou simule sucesso persistente em fluxo critico atual.

### ALTO

| # | Arquivo | Linha | Funcao/escopo | Ocorrencia | Impacto | Afeta producao |
|---|---|---:|---|---|---|---|
| 1 | `lib/juridico-data.ts` | 90 | `juridicoCases` | Casos juridicos hardcoded. | Pode exibir casos juridicos que nao vieram de `legal_cases`, gerando divergencia operacional. | Sim |
| 2 | `lib/juridico-data.ts` | 207 | `isContratoEmJuridico` | Verifica contrato em juridico usando `juridicoCases` estatico. | Contratos podem mostrar estado juridico com base em dados fixos. | Sim |
| 3 | `lib/juridico-data.ts` | 211 | `getJuridicoByContrato` | Retorna caso juridico a partir de array estatico. | Pode direcionar a decisao do usuario para informacao nao persistida. | Sim |
| 4 | `components/contratos-content.tsx` | 68 | imports | Usa `isContratoEmJuridico` vindo de `lib/juridico-data.ts`. | Integra o mock juridico na tela de Contratos. | Sim |
| 5 | `components/contratos-content.tsx` | 986 | renderizacao de acoes | Exibe indicador/acao juridica com base no mock juridico. | Usuario pode ver "caso juridico" sem origem real no Supabase. | Sim |
| 6 | `components/contratos-content.tsx` | 1013 | renderizacao de menu | Altera CTA conforme `isContratoEmJuridico`. | CTA pode variar por dado estatico, nao por `legal_cases`. | Sim |
| 7 | `components/relatorios-content.tsx` | 105 | `relatoriosRecentes` | Historico de relatorios hardcoded. | Usuario pode acreditar que relatorios foram gerados quando nao ha registro real. | Sim |
| 8 | `components/relatorios-content.tsx` | 113 | `agendados` | Agenda de relatorios hardcoded. | Pode indicar agendamentos inexistentes. | Sim |
| 9 | `components/financeiro-content.tsx` | 100 | `bankConnections` | Conexoes bancarias e status hardcoded. | Pode sugerir bancos/conexoes que nao existem em Supabase/Open Finance. | Sim |
| 10 | `lib/data/supabase-helpers.ts` | 354 | `selectRows` | Todas as consultas aceitam fallback externo. | Uma falha de query/schema/RLS pode virar lista vazia em vez de erro visivel. | Sim |
| 11 | `lib/data/supabase-helpers.ts` | 359 | `selectRows` | Retorna fallback quando env Supabase nao esta configurado. | Pode mascarar ambiente mal configurado como "sem dados". | Sim |
| 12 | `lib/data/supabase-helpers.ts` | 381 | `selectRows` | Retorna fallback quando Supabase retorna erro. | Pode ocultar erro real em modulos que usam helper generico. | Sim |

### MEDIO

| # | Arquivo | Linha | Funcao/escopo | Ocorrencia | Impacto | Afeta producao |
|---|---|---:|---|---|---|---|
| 13 | `lib/mock-data.ts` | 1 | arquivo inteiro | Arquivo legado chamado `mock-data`. | Ainda centraliza tipos de view e valores zerados; nome induz dependencia legada. | Parcial |
| 14 | `lib/mock-data.ts` | 120 | `currentUser` | Usuario estatico `Usuario GATE OS`. | Se importado no futuro, pode mascarar usuario autenticado real. | Nao confirmado |
| 15 | `lib/mock-data.ts` | 130 | exports de colecoes | Arrays vazios para socios/clientes/equipamentos/etc. | Se importados em tela operacional, podem ocultar dados reais. Hoje aparecem como legado. | Parcial |
| 16 | `lib/mock-data.ts` | 140 | `dashboardMetrics` | Metricas zeradas hardcoded. | Risco se algum dashboard voltar a consumir este objeto. | Parcial |
| 17 | `lib/mock-data.ts` | 162 | charts/atividades/pagamentos | Charts e listas vazias estaticas. | Risco de tela vazia falsa se reutilizado. | Parcial |
| 18 | `components/clientes-content.tsx` | 55 | imports | Importa tipo `ClientView` de `mock-data`. | Dependencia nominal de arquivo mock; uso atual parece somente type. | Nao direto |
| 19 | `components/contratos-content.tsx` | 61 | imports | Importa tipo `ContractView` de `mock-data`. | Dependencia nominal de arquivo mock; uso atual parece somente type. | Nao direto |
| 20 | `components/equipamentos-content.tsx` | 48 | imports | Importa tipo `EquipmentView` de `mock-data`. | Dependencia nominal de arquivo mock; uso atual parece somente type. | Nao direto |
| 21 | `components/manutencoes-content.tsx` | 45 | imports | Importa tipo `MaintenanceView` de `mock-data`. | Dependencia nominal de arquivo mock; uso atual parece somente type. | Nao direto |
| 22 | `components/patrimonio-content.tsx` | 54 | imports | Importa tipo `AssetView` de `mock-data`. | Dependencia nominal de arquivo mock; uso atual parece somente type. | Nao direto |
| 23 | `components/mock-create-dialog.tsx` | 40 | `MockCreateDialogProps` | Componente ainda nomeado como mock. | Nome legado; se usado sem `onSave`, pode fechar com sucesso sem persistir. | Parcial |
| 24 | `components/mock-create-dialog.tsx` | 100 | `handleSubmit` | `await onSave?.(...)` permite ausencia de persistencia. | Hoje usos auditados passam `onSave`, mas o componente permite sucesso sem salvar. | Parcial |
| 25 | `components/clientes-content.tsx` | 164 | `MockCreateDialog` | Usa componente de nome mock para criar cliente. | Persistencia existe via `onSave`, mas dependencia nominal continua. | Nao direto |
| 26 | `components/equipamentos-content.tsx` | 199 | `MockCreateDialog` | Usa componente de nome mock para criar equipamento. | Persistencia existe via `onSave`, mas dependencia nominal continua. | Nao direto |
| 27 | `components/manutencoes-content.tsx` | 177 | `MockCreateDialog` | Usa componente de nome mock para criar manutencao. | Persistencia existe via `onSave`, mas dependencia nominal continua. | Nao direto |
| 28 | `components/dashboard-content.tsx` | 78 | constantes de topo | Comentario diz "Computed metrics from the mock data". | Comentario legado e constantes zeradas; dashboard real recalcula dados dentro do componente. | Baixo/parcial |
| 29 | `components/dashboard-content.tsx` | 88 | `bankBalances` de topo | Saldos bancarios estaticos zerados. | Ha calculo real posterior, mas constantes de topo permanecem como legado. | Parcial |
| 30 | `components/header.tsx` | 64 | estado inicial de perfil | Perfil inicial hardcoded `Usuario GATE`. | Exibicao temporaria ate carregar sessao; pode aparecer se metadata falhar. | Sim, baixo impacto |

### BAIXO

| # | Arquivo | Linha | Funcao/escopo | Ocorrencia | Impacto | Afeta producao |
|---|---|---:|---|---|---|---|
| 31 | `components/relatorios-content.tsx` | 30 | `relatoriosPredefinidos` | Lista estatica de modelos de relatorio. | Parece catalogo de tipos, nao dado operacional. | Sim, sem divergencia direta |
| 32 | `lib/juridico-data.ts` | 13 | `juridicoStatuses` | Lista estatica de status juridico. | Lista de opcoes/enum de UI. | Sim, esperado |
| 33 | `lib/juridico-data.ts` | 37 | `juridicoResponsaveis` | Responsaveis juridicos hardcoded. | Pode ficar desalinhado com usuarios reais, mas e lista de filtro. | Sim, baixo/medio |
| 34 | `lib/dre-store.ts` | 3 | `paymentMethods`/`attachmentTypes` | Opcoes estaticas de forma de pagamento/anexo. | Configuracao de UI, nao mock de dados reais. | Sim, esperado |

## Seed-data e arquivos de carga

Foram encontrados arquivos SQL de seed/carga em `supabase/`, incluindo cargas da DRE operacional, historica, categorias e baseline.

Impacto:

- Nao sao dependencia runtime da interface.
- Sao artefatos de implantacao/carga manual.
- Nao afetam producao enquanto nao forem executados no banco.
- Devem permanecer versionados se forem fonte auditavel de carga.

Classificacao: BAIXO.

## Modulos ainda com dependencia de mock ou dado estatico sensivel

- Juridico: usa `juridicoCases` estatico e responsaveis hardcoded.
- Contratos: consome o mock juridico para indicar contrato em juridico.
- Relatorios: exibe historico e agendamentos estaticos.
- Financeiro: exibe conexoes bancarias estaticas.
- Dashboard: conserva constantes legadas zeradas e comentario de mock, embora o calculo principal venha de Supabase.
- Componentes de criacao: usam `MockCreateDialog`, que persiste nos usos atuais, mas ainda permite uso sem `onSave`.

## Modulos 100% Supabase no fluxo de dados principal

Com base nos arquivos auditados, estes modulos usam Supabase como fonte operacional principal e nao dependem de mock para dados de negocio no fluxo principal:

- DRE 2026 operacional: template, categorias, baseline, lancamentos, ajustes e fechamentos.
- DRE historica 2022-2025: `dre_historical_values`.
- Clientes: leitura/criacao via `clients`.
- Contratos: leitura/criacao/exclusao via `contracts`, parcelas e equipamentos vinculados; excecao: indicador juridico usa mock.
- Equipamentos: leitura/criacao via `equipment`.
- Manutencoes: leitura/criacao via `maintenance_orders`.
- Patrimonio: leitura via `assets`.
- Financeiro/lancamentos: leitura/criacao via `financial_entries`; excecao: conexoes bancarias estaticas.
- Socios: leitura via `partners`, lancamentos e distribuicao.
- Documentos: leitura via `documents`; upload depende de buckets Supabase Storage.

## Mocks que podem causar divergencia de dados

- `juridicoCases` em `lib/juridico-data.ts`: pode divergir de `legal_cases`.
- `isContratoEmJuridico` em `lib/juridico-data.ts`: pode marcar contrato como juridico sem registro real.
- `relatoriosRecentes` em `components/relatorios-content.tsx`: pode indicar relatorios inexistentes.
- `agendados` em `components/relatorios-content.tsx`: pode indicar agendamentos inexistentes.
- `bankConnections` em `components/financeiro-content.tsx`: pode indicar conexoes bancarias inexistentes.
- `selectRows` fallback em `lib/data/supabase-helpers.ts`: pode transformar erro real em array vazio.

## Mocks removiveis sem risco imediato

- Constantes legadas de topo em `components/dashboard-content.tsx` que sao recalculadas dentro do componente.
- Comentario "Computed metrics from the mock data" em `components/dashboard-content.tsx`.
- Valores zerados e colecoes vazias de `lib/mock-data.ts`, desde que os tipos de view sejam movidos para outro arquivo antes.
- Nome `MockCreateDialog`, desde que o componente seja renomeado e `onSave` vire obrigatorio.
- `relatoriosRecentes` e `agendados`, se a interface remover essas secoes ou substitui-las por Supabase.

## Pendencias recomendadas

### ALTO

- Migrar `juridicoCases` para `legal_cases`/Supabase e remover os casos hardcoded.
- Remover ou persistir `relatoriosRecentes` e `agendados`.
- Remover `bankConnections` hardcoded ou trocar por dados reais de `bank_accounts`/integracao bancaria.
- Tornar `selectRows` mais explicito em modulos operacionais, evitando fallback vazio silencioso.

### MEDIO

- Mover os tipos de view de `lib/mock-data.ts` para um arquivo sem dados, por exemplo `lib/view-types.ts`.
- Renomear `MockCreateDialog` para um nome neutro e tornar `onSave` obrigatorio.
- Remover constantes legadas zeradas do topo de `components/dashboard-content.tsx`.
- Trocar `juridicoResponsaveis` por usuarios/responsaveis reais quando houver tabela fonte.

### BAIXO

- Separar listas estaticas legitimas de UI em arquivos de constantes com nome explicito.
- Revisar arquivos SQL de seed para deixar claro quais sao artefatos de carga e quais sao migrations.

## Totais finais

- Total de ocorrencias relevantes: 34.
- Ocorrencias criticas: 0.
- Ocorrencias altas: 12.
- Ocorrencias medias: 18.
- Ocorrencias baixas: 4.

## Conclusao

O sistema nao parece depender de mocks para a DRE ou para os cadastros operacionais principais, mas ainda ha dependencias pontuais capazes de gerar percepcao errada em producao, principalmente Juridico, Relatorios, conexoes bancarias do Financeiro e fallbacks genericos de leitura.

Nenhuma correcao foi aplicada nesta auditoria.
