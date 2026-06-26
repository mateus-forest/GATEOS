# GATE OS - COS Etapa 2 - Structured Input Execution

## Escopo

Implementado o modo de Entrada Estruturada do COS.

O fluxo novo detecta mensagens com secoes operacionais e campos estruturados, classifica entidades, extrai campos, gera preview e mostra CTAs para acoes seguras ja existentes.

A Etapa 1 read-only permanece ativa para perguntas, buscas, diagnosticos, timelines e grafo operacional.

## Arquivos alterados

- `lib/cos/cos-router.ts`
- `components/header.tsx`

## Arquivos criados

- `lib/cos/structured-input-detector.ts`
- `lib/cos/structured-input-parser.ts`
- `lib/cos/structured-input-preview.ts`
- `lib/cos/structured-input-actions.ts`
- `GATE_OS_COS_STAGE_2_STRUCTURED_INPUT_EXECUTION_REPORT.md`

## Roteamento implementado

A ordem agora e:

1. Upload/arquivo: fluxo atual preservado.
2. Mensagem estruturada: Structured Input.
3. Pergunta/busca/diagnostico: Read Only Router.
4. Escrita solta sem dados suficientes: guardrail read-only bloqueia e orienta.

Com isso, mensagens longas com `CLIENTE`, `CONTRATO`, `FINANCEIRO` e `EQUIPAMENTOS` deixam de virar busca de equipamento.

## Detector

Criado em `structured-input-detector.ts`.

Reconhece:

- titulos em caixa alta ou linhas isoladas: `CLIENTE`, `CONTRATO`, `FINANCEIRO`, `EQUIPAMENTOS`, `DOCUMENTO`, `DRE`;
- campos com `:`;
- listas de equipamentos com quantidade;
- termos como `valor mensal`, `data inicio`, `data final`, `parcelas`, `competencia`, `vencimento`.

Exemplo bloqueado corretamente como escrita solta:

```text
Cadastrar cliente Lucas
```

Esse caso nao e tratado como entrada estruturada porque nao possui secoes/campos suficientes.

## Parser

Criado em `structured-input-parser.ts`.

Extrai:

### Cliente

- razao social;
- nome fantasia;
- CNPJ/CPF;
- endereco;
- cidade;
- estado;
- CEP;
- representante;
- telefone;
- e-mail;
- status.

### Contrato

- cliente;
- tipo;
- status;
- data inicio;
- data final;
- prazo;
- vencimento;
- valor mensal;
- caucao;
- reajuste;
- multa;
- juros;
- observacoes.

### Financeiro

- tipo;
- descricao;
- valor;
- competencia;
- vencimento;
- quantidade de parcelas;
- categoria;
- cliente;
- contrato;
- status.

### Equipamentos

- quantidade;
- descricao;
- marca/modelo, quando informado;
- observacoes.

### Documento e DRE

Extracao inicial de tipo, nome, notas, categoria e competencia.

## Preview

Criado em `structured-input-preview.ts`.

O preview separa:

- Cliente identificado;
- Contrato identificado;
- Financeiro identificado;
- Equipamentos identificados;
- Documento identificado;
- DRE identificada;
- Pendencias;
- CTAs.

Nenhum dado e gravado ao gerar preview.

## CTAs

CTAs habilitados quando ha dados minimos:

- `Cadastrar cliente` usando `/api/cos/actions/create-client`;
- `Criar lancamento financeiro` usando `/api/cos/actions/create-financial-entry`.

CTA preparado, mas bloqueado nesta fase:

- `Anexar documento`, quando nao ha arquivo enviado junto;
- `Preparar contrato`;
- `Preparar equipamentos`.

Continuam bloqueados:

- criar contrato real;
- cadastrar equipamento real;
- criar parcelas;
- recorrencia;
- execucao em massa;
- editar;
- excluir;
- fechar mes;
- ajustar DRE.

## UI

`components/header.tsx` foi ajustado para reconhecer `preview.kind === "structured_input"`.

O novo painel:

- mostra entidades separadas;
- mostra pendencias;
- exibe CTAs;
- abre o modal de confirmacao existente para acoes seguras;
- mantem botoes bloqueados para contrato/equipamentos.

As chamadas `fetch` existentes no Header foram preservadas. Nenhum endpoint novo foi criado.

## Segurança

O fluxo estruturado nao chama actions diretamente.

Ele apenas retorna preview e payloads. A execucao continua dependendo de:

- clique no CTA;
- modal de revisao;
- confirmacao humana;
- endpoint seguro existente;
- erro real retornado pela action.

## Validação executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

Busca textual nos novos módulos estruturados e no router:

- `insertRow`;
- `updateRows`;
- `deleteRows`;
- `uploadDocument`;
- `.insert()`;
- `.update()`;
- `.delete()`;
- `.upsert()`;
- `fetch()`.

Nenhuma chamada proibida foi encontrada nos novos módulos estruturados.

## Testes manuais esperados

### Escrita solta

```text
Cadastrar cliente Lucas
```

Resultado esperado:

- bloqueio pelo guardrail;
- orientacao para enviar dados estruturados.

### Cliente estruturado

```text
CLIENTE
Razao social: Lucas Tecnologia LTDA
CNPJ: 00.000.000/0001-00
```

Resultado esperado:

- preview de cliente;
- CTA `Cadastrar cliente`.

### Contrato e equipamentos

```text
CONTRATO
Cliente: ATIBAIA
Tipo: Locacao
Data inicio: 27/05/2025
Data final: 27/05/2028
Prazo: 36 meses
Valor mensal: R$ 3.697,33

EQUIPAMENTOS
10 Nobreak APC
2 Rack 42U
```

Resultado esperado:

- preview de contrato;
- preview de equipamentos;
- CTA `Preparar contrato` bloqueado para gravacao real;
- nenhum contrato real gravado.

### Financeiro estruturado

```text
FINANCEIRO
Tipo: Receita
Descricao: Locacao ATIBAIA
Valor: R$ 3.697,33
Competencia: maio/2025
Vencimento: 27/05/2025
```

Resultado esperado:

- preview financeiro;
- CTA `Criar lancamento financeiro`.

### Texto misturado

Mensagem com `CLIENTE + CONTRATO + FINANCEIRO + EQUIPAMENTOS`.

Resultado esperado:

- entidades separadas corretamente;
- nao virar busca de equipamento;
- CTAs habilitados apenas para acoes seguras.

## Limitacoes

- O parser e deterministico e baseado em secoes/campos; texto livre sem estrutura continua indo para guardrail/read-only.
- Contrato e equipamento ainda nao possuem execucao real liberada.
- Anexar documento por texto estruturado exige arquivo enviado no modal.
- Resolucao de cliente/contrato existente ainda nao vincula automaticamente IDs aos payloads de execucao.
- Categorias DRE e contas bancarias sao apenas pendencias/sugestoes nesta fase.

## Proximos passos

1. Enriquecer o parser com aliases de campos adicionais.
2. Resolver cliente/contrato existentes antes de montar payload financeiro.
3. Adicionar preview de duplicidade usando Deep Search.
4. Criar endpoint seguro futuro para contrato, com preview reforcado.
5. Criar endpoint seguro futuro para equipamentos, com validacao de estoque.
6. Adicionar testes automatizados do detector e parser.

## Parecer

A Etapa 2 inicia a transicao do COS de especialista read-only para executor assistido por entrada estruturada.

O COS agora diferencia pergunta de operacao estruturada, gera preview por entidade e oferece CTAs seguros sem liberar execucoes perigosas como contrato, equipamentos, parcelas ou fechamento.
