# GATE OS - Relatorio de poda operacional

Data: 2026-06-15

## Objetivo

Reduzir o GATE OS ao nucleo operacional usado no dia a dia da GATE, removendo da interface modulos e CTAs sem fluxo persistente real.

Nenhum dado foi apagado. Nenhum SQL destrutivo foi executado. Nenhuma tabela foi removida.

## Modulos mantidos

- Dashboard
- Clientes
- Contratos
- Equipamentos
- Financeiro
- DRE
- Documentos
- Manutencoes

## Modulos removidos ou ocultados do app

- Juridico
- Socios
- Patrimonio
- Relatorios avancados
- Analise
- Configuracoes avancadas
- Lancamentos como rota separada, redirecionada para Financeiro
- Open Finance
- Conciliacao bancaria
- Agendamentos e automacao de relatorios

## Navegacao

A sidebar foi simplificada para exibir somente os oito modulos mantidos. O menu do usuario deixou de apontar para configuracoes avancadas.

## Rotas desativadas ou redirecionadas

As rotas abaixo foram preservadas sem 404, mas redirecionam para uma area operacional:

- `/juridico` -> `/dashboard`
- `/socios` -> `/dashboard`
- `/patrimonio` -> `/dashboard`
- `/relatorios` -> `/dashboard`
- `/analise` -> `/dashboard`
- `/configuracoes` -> `/dashboard`
- `/lancamentos` -> `/financeiro`

As rotas principais mantidas continuam presentes:

- `/dashboard`
- `/clientes`
- `/contratos`
- `/contratos/[id]`
- `/equipamentos`
- `/financeiro`
- `/dre`
- `/documentos`
- `/manutencoes`
- `/cliente/contrato/[token]`

## CTAs removidos

- Botao de configuracoes no header.
- Indicadores e acessos a Juridico em contratos e detalhe de contrato.
- CTAs de editar, duplicar, renovar e cancelar contrato sem fluxo real.
- CTAs de editar e excluir cliente sem fluxo real.
- CTAs de detalhes, editar e descartar equipamento sem fluxo real.
- Botao de etiquetas de equipamento indisponivel.
- CTAs de detalhes, editar e excluir lancamento financeiro sem fluxo real.
- CTAs de Open Finance, importacao de extrato e conciliacao bancaria.
- CTAs de detalhes, editar e atribuir tecnico em manutencoes sem fluxo real.
- CTAs de visualizar, baixar e excluir documentos sem fluxo real.
- CTAs de divergencias e reabertura de mes da DRE sem fluxo estavel.
- Atalhos de dashboard para modulos desativados.

## Dashboard

O dashboard foi limitado a dados dos modulos mantidos:

- clientes
- contratos
- equipamentos
- financeiro
- DRE
- manutencoes
- documentos

Foram removidas referencias de interface a Juridico, Patrimonio e Relatorios avancados.

## Financeiro

Permanecem:

- listagem real de lancamentos
- criacao real de lancamento
- contas bancarias cadastradas manualmente
- categorias DRE
- exportacao

Foram ocultados:

- conexao Open Finance
- importacao OFX/CSV
- conciliacao automatica
- acoes de editar/excluir lancamento sem fluxo seguro

## DRE

A DRE foi preservada:

- DRE operacional 2026
- historico 2022-2025
- categorias DRE
- lancamentos reais
- baseline 2026
- ajustes e exportacoes existentes

Foram removidos somente CTAs instaveis de fechamento.

## Documentos

Permanecem:

- upload
- listagem
- filtros

Foram ocultados os CTAs de visualizar, baixar e excluir ate existirem fluxos persistentes completos.

## Manutencoes

Permanecem:

- listagem
- abertura de ordem
- link publico do cliente abrindo chamado

Foram ocultadas acoes de detalhe, edicao e atribuicao de tecnico sem persistencia real.

## SQL de revisao futura

Foi criado o arquivo:

- `supabase/gate-os-pruning-cleanup-review-only.sql`

Ele contem apenas comandos destrutivos comentados, organizados por modulo, para revisao humana futura. Nada foi executado.

## Arquivos alterados

- `components/sidebar.tsx`
- `components/header.tsx`
- `components/dashboard-content.tsx`
- `components/clientes-content.tsx`
- `components/contratos-content.tsx`
- `components/equipamentos-content.tsx`
- `components/financeiro-content.tsx`
- `components/dre-content.tsx`
- `components/documentos-content.tsx`
- `components/manutencoes-content.tsx`
- `app/contratos/[id]/page.tsx`
- `app/juridico/page.tsx`
- `app/socios/page.tsx`
- `app/patrimonio/page.tsx`
- `app/relatorios/page.tsx`
- `app/analise/page.tsx`
- `app/configuracoes/page.tsx`
- `app/lancamentos/page.tsx`
- `supabase/gate-os-pruning-cleanup-review-only.sql`

## Riscos restantes

- As paginas/componentes dos modulos ocultados ainda existem no codigo para evitar remocao destrutiva nesta fase.
- Visualizacao/download/exclusao de documentos devem ser implementados antes de voltar a expor esses CTAs.
- Edicao/exclusao de lancamentos financeiros deve ser implementada com auditoria antes de voltar a aparecer.
- Cancelamento/renovacao de contratos exige regra de negocio para parcelas, equipamentos e financeiro.

## Proximos passos

- Validar a navegacao com usuario autenticado no ambiente real.
- Priorizar edicao/exclusao financeira se for requisito operacional.
- Implementar download/visualizacao de documentos com Storage real antes de reexpor os botoes.
- Revisar o SQL review-only com backup e janela operacional antes de qualquer limpeza futura.

## Confirmacao

Nenhum dado do Supabase foi apagado. Nenhuma tabela foi dropada. Nenhum SQL destrutivo foi executado.
