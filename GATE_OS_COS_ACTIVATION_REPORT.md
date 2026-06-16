# GATE OS - Ativacao do COS read-only

Data: 2026-06-16

## Objetivo

O COS foi ativado como assistente funcional de leitura para os modulos operacionais mantidos do GATE OS.

Nenhuma regra de negocio foi alterada. Nenhuma escrita no Supabase foi adicionada. Nenhum modulo removido foi reativado.

## Arquitetura criada

- `app/api/cos/route.ts`
  - Endpoint `POST /api/cos`.
  - Exige usuario autenticado via Supabase Auth.
  - Usa o client server-side com anon key e cookies da sessao, respeitando RLS.
  - Retorna erro claro quando nao ha sessao ou quando a consulta falha.

- `lib/cos/cos-context.ts`
  - Tipos, normalizacao de texto, formatacao monetaria, leitura numerica segura e helpers de periodo.

- `lib/cos/cos-tools.ts`
  - Ferramentas internas somente leitura para consultar Supabase.
  - Todas as operacoes usam `select`.

- `lib/cos/cos-router.ts`
  - Roteamento deterministico por intencao/palavras-chave.
  - Nao usa IA externa nesta etapa.

## Modulos que o COS consulta

- Clientes: contagem geral e clientes ativos.
- Contratos: contratos ativos, vencendo nos proximos 30 dias e vencidos.
- Equipamentos: disponibilidade, locacao e manutencao.
- Financeiro: receita realizada, despesas pagas, pendencias e resultado por competencia.
- DRE: resumo por mes/ano, usando historico quando aplicavel e lancamentos financeiros para 2026.
- Documentos: total cadastrado e documentos recentes.
- Manutencoes: chamados abertos e principais ocorrencias.

## Interface

O modal atual do COS foi mantido e passou a:

- preservar historico da conversa enquanto a pagina estiver aberta;
- enviar perguntas para `/api/cos`;
- mostrar loading durante a consulta;
- exibir respostas reais do endpoint;
- acionar as sugestoes rapidas:
  - Mostrar contratos ativos
  - Clientes inadimplentes
  - Receita deste mes
  - Equipamentos disponiveis
  - Abrir chamado
  - Resumo financeiro

## Seguranca

- O COS e somente leitura.
- Nao cria, edita, exclui, cancela ou fecha registros.
- Nao usa service role no frontend.
- Nao libera acesso anonimo a dados privados.
- Nao inventa valores quando uma consulta falha.
- Em falha de leitura, responde que nao conseguiu acessar os dados no momento.

## Perguntas cobertas

- Qual a receita deste mes?
- Quantos contratos ativos temos?
- Quais contratos vencem nos proximos 30 dias?
- Quantos equipamentos estao disponiveis?
- Quais equipamentos estao em manutencao?
- Resumo financeiro
- Resumo da DRE de junho
- Quais chamados estao abertos?
- Quantos documentos existem?
- Tenho clientes inadimplentes?

## Limitacoes

- O COS nao executa acoes operacionais.
- O COS nao cria chamados automaticamente; ele orienta o usuario a usar Manutencoes ou o link publico.
- O roteamento e deterministico nesta fase, sem integracao com IA externa.
- A validacao de dados reais depende de usuario autenticado e policies do Supabase no ambiente.

## Validacoes executadas

- `npm run lint`
- `npm run build`

O build confirmou a rota dinamica:

- `/api/cos`

