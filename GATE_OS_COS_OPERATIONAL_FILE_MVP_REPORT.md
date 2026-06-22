# GATE OS - COS Operational File MVP

Data: 2026-06-21

## O que foi implementado

- O COS Assistant existente passou a aceitar anexos no modal atual.
- Foi adicionado botao `+` no campo de mensagem.
- O COS permite selecionar ou arrastar arquivos para o painel.
- Arquivos anexados aparecem antes do envio e podem ser removidos.
- Mensagens do usuario mostram os anexos enviados.
- O endpoint `/api/cos` passou a aceitar `multipart/form-data`, mantendo o fluxo JSON antigo para perguntas em texto.
- Planilhas Excel/CSV sao lidas no servidor com `xlsx`.
- O COS lista arquivos, abas, quantidade de linhas e colunas encontradas.
- O COS gera previa segura de possiveis:
  - lancamentos financeiros;
  - clientes;
  - equipamentos.
- A confirmacao de execucao aparece preparada, mas desabilitada.

## Arquivos alterados

- `components/header.tsx`
- `app/api/cos/route.ts`
- `lib/cos/cos-context.ts`
- `lib/cos/cos-file-analysis.ts`
- `supabase/gate-os-cos-action-logs.sql`
- `GATE_OS_COS_OPERATIONAL_FILE_MVP_REPORT.md`

## Regras de seguranca

- Nenhum dado e gravado automaticamente.
- Nenhum lancamento financeiro e criado nesta etapa.
- Nenhum cliente, contrato, equipamento, documento ou DRE e alterado por analise de arquivo.
- O endpoint continua exigindo usuario autenticado.
- O COS respeita a sessao/RLS existente.
- Imagens e PDFs sao recebidos para previa, mas OCR/parser completo fica documentado como limite do MVP.

## Limites da primeira versao

- A leitura automatica estruturada esta disponivel para Excel/CSV.
- PDF ainda nao possui parser dedicado.
- Imagens/prints ainda dependem de integracao OCR futura.
- O botao de confirmar execucao esta desabilitado ate a proxima etapa.
- Nao ha criacao, edicao ou exclusao em massa nesta entrega.

## SQL sugerido

Foi criado o arquivo:

- `supabase/gate-os-cos-action-logs.sql`

Ele define a tabela `cos_action_logs` para registrar analises, previas, execucoes confirmadas e erros em uma etapa futura. O SQL nao foi executado automaticamente.

## Como testar

1. Abrir o GATE OS autenticado.
2. Clicar em `Abrir no COS`.
3. Clicar no botao `+`.
4. Anexar Excel ou CSV.
5. Enviar com ou sem mensagem.
6. Validar que o COS mostra arquivos, abas, colunas e previas.
7. Anexar imagem/PDF e validar que o COS informa o limite de OCR/parser.
8. Confirmar que Dashboard, Financeiro e DRE nao mudam apos apenas analisar arquivos.

## Validacoes executadas

- `npm run lint`
- `npm run build`

## Proximos passos

- Habilitar confirmacao de lancamentos selecionados com preview auditavel.
- Registrar acoes em `cos_action_logs` apos aplicacao manual do SQL.
- Implementar OCR para imagens/prints.
- Implementar parser de PDF.
- Permitir criacao assistida de clientes/equipamentos somente apos confirmacao humana.
