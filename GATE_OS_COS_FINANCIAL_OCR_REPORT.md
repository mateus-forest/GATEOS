# GATE OS - COS OCR financeiro

Data: 2026-06-22

## Objetivo

Adicionar ao COS uma primeira camada funcional de OCR financeiro para imagens e prints de DRE, Granatum, fluxo de caixa, contas a pagar/receber, extratos e relatorios financeiros.

Nenhum dado e gravado automaticamente. Os CTAs continuam desabilitados e a analise permanece em modo somente leitura.

## O que foi implementado

- Instalado `tesseract.js` para OCR local server-side.
- Criado analisador deterministico para textos financeiros extraidos por OCR.
- Imagens `PNG`, `JPG`, `JPEG`, `WEBP` e demais `image/*` agora passam por OCR no endpoint `/api/cos`.
- PDFs textuais nao contratuais tambem podem passar pela analise financeira textual.
- PDFs escaneados recebem aviso real: o motor atual nao faz OCR direto de PDF; a pagina deve ser enviada como imagem para OCR.
- O preview do COS ganhou cards especificos de analise financeira por OCR.

## Estrutura normalizada

O backend retorna preview com:

- `sourceType: "financial_image"`
- `detectedType`
- `confidence`
- `extractedColumns`
- `extractedClients`
- `extractedRevenue`
- `extractedExpenses`
- `extractedCategories`
- `extractedFinancialEntries`
- `extractedWarnings`
- `suggestedActions`
- `summary`

## Classificacao

O COS tenta classificar o arquivo como:

- DRE Gerencial
- Fluxo de Caixa
- Contas a Pagar
- Contas a Receber
- Relatorio Granatum
- Extrato Bancario
- Relatorio Financeiro
- Planilha Generica

## Preview visual

Foram adicionados cards no modal do COS para:

- Resumo financeiro
- Clientes encontrados
- Categorias DRE encontradas
- Receitas encontradas
- Despesas encontradas
- Lancamentos financeiros sugeridos
- Documento

Todos os CTAs permanecem desabilitados:

- Cadastrar clientes
- Criar receitas
- Criar despesas
- Criar categorias DRE
- Vincular categorias
- Criar lancamentos financeiros
- Salvar analise
- Anexar documento

## Arquivos alterados

- `lib/cos/cos-file-analysis.ts`
- `components/header.tsx`
- `package.json`
- `package-lock.json`

## Regras de seguranca preservadas

- Nenhum `INSERT`, `UPDATE`, `UPSERT` ou `DELETE` foi adicionado.
- Nenhuma tabela foi criada ou alterada.
- Nenhum SQL foi executado.
- Supabase Auth, RLS, DRE, Dashboard, Financeiro, Clientes, Contratos e Equipamentos nao foram alterados.
- O COS nao grava nada sem confirmacao humana.
- O botao de confirmacao de execucao segue bloqueado.

## Limitacoes desta versao

- A acuracia depende da qualidade da imagem, resolucao, contraste e alinhamento.
- `tesseract.js` nao faz OCR direto de PDF escaneado; para esses casos, o usuario deve enviar a pagina como imagem.
- As categorias e entidades sao extraidas por regras deterministicas, sem OpenAI.
- As acoes de cadastro permanecem preparadas visualmente, mas sem execucao.

## Validacoes executadas

- `npm run lint`
- `npm run build`
- Verificacao de ausencia de escritas em `lib/cos/cos-file-analysis.ts`.

