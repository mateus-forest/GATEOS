# GATE OS - COS contract extraction preview

Data: 2026-06-21

## Objetivo

Evoluir o COS para analisar contratos DOCX/PDF e gerar previa estruturada por entidade operacional, sem gravar dados automaticamente.

## O que foi implementado

- Suporte a upload de `.docx` no seletor do COS.
- Leitura deterministica de DOCX sem dependencia nova, usando extração minima de ZIP/deflate e `word/document.xml`.
- Leitura simples de texto de PDF quando o PDF possui texto embutido.
- Parser deterministico de contrato com heuristicas para:
  - locataria;
  - locadora;
  - CNPJ;
  - endereco, cidade, UF e CEP;
  - representante;
  - fiador;
  - tipo de contrato;
  - data de assinatura;
  - inicio provavel;
  - prazo em meses;
  - final previsto;
  - dia de vencimento;
  - valor mensal;
  - caucao;
  - indice de reajuste;
  - multa/rescisao;
  - foro;
  - equipamentos;
  - financeiro sugerido.

## Preview no COS

O modal do COS agora exibe cards por entidade extraida:

- Cliente / Locataria
- Contrato
- Equipamentos
- Financeiro sugerido
- Documento

Cada card possui CTA isolado:

- `Cadastrar cliente`
- `Cadastrar contrato`
- `Cadastrar equipamentos`
- `Criar financeiro`
- `Anexar documento`

Todos os CTAs permanecem desabilitados nesta etapa. Nenhum sucesso falso e exibido.

## Segurança

- Nenhum `insert`, `update`, `upsert` ou `delete` foi implementado.
- Nenhum dado e gravado no Supabase.
- Nenhum contrato, cliente, equipamento, financeiro, documento, Dashboard ou DRE e alterado.
- PDF escaneado/protegido retorna erro real quando nao ha texto suficiente para extrair.
- O COS informa warnings quando campos essenciais nao sao identificados com confianca.

## Logs

O servidor registra a analise de contrato no console com:

- arquivo;
- tipo;
- tamanho de texto extraido;
- confianca;
- quantidade de equipamentos identificados;
- quantidade de itens financeiros sugeridos.

## Limitacoes

- PDF escaneado ainda depende de OCR futuro.
- DOCX com conteudo em imagens/tabelas muito complexas pode exigir ajustes de heuristica.
- Os CTAs sao apenas preparacao visual para uma proxima etapa de execucao assistida.
- Nao ha OpenAI nesta etapa.

## Validacoes executadas

- `npm run lint`
- `npm run build`
