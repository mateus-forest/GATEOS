# GATE OS - Auditoria completa do COS

## Escopo da auditoria

Esta auditoria analisou o COS atualmente presente no workspace, sem alterar codigo de comportamento, banco, Supabase, Auth, RLS, UI, rotas, prompts ou dados.

Arquivos e fluxos auditados:

- `components/header.tsx`
- `app/api/cos/route.ts`
- `lib/cos/cos-router.ts`
- `lib/cos/cos-context.ts`
- `lib/cos/cos-tools.ts`
- `lib/cos/cos-file-analysis.ts`
- `lib/cos/cos-action-utils.ts`
- `app/api/cos/actions/create-client/route.ts`
- `app/api/cos/actions/create-financial-entry/route.ts`
- `app/api/cos/actions/attach-document/route.ts`
- `supabase/gate-os-cos-action-logs.sql`

Observacao de estado do workspace: existem alteracoes nao relacionadas ja presentes em `next-env.d.ts` e `pnpm-workspace.yaml`. Esta auditoria nao depende delas.

## Parte 1 - Arquitetura geral

### Onde o COS comeca

O COS comeca no `Header`, em `components/header.tsx`, pelo botao "Abrir no COS". O mesmo componente concentra:

- abertura do modal do COS;
- entrada de texto;
- anexos temporarios;
- drag-and-drop;
- envio para `/api/cos`;
- renderizacao de mensagens;
- renderizacao de previews;
- abertura do modal de revisao;
- chamada dos endpoints de acoes seguras.

### Onde o COS termina

O COS termina em dois pontos diferentes:

- Para perguntas sem arquivo: termina em uma resposta textual gerada por regras e consultas Supabase.
- Para arquivos: termina em preview estruturado e, quando o usuario aciona uma CTA permitida, em um endpoint isolado que grava uma unica entidade ou anexa um documento.

Nao existe fluxo atual de execucao em massa, "confirmar tudo", edicao em massa ou automacao total.

### Componentes envolvidos

- `Header`: interface principal do COS, modal, upload, chat, preview e revisao.
- `CosPreviewPanel`: painel de preview geral de arquivos.
- `ContractExtractionCards`: cards de contrato, cliente, contrato, equipamentos, financeiro e documento.
- `FinancialOcrCards`: cards de OCR/documentos financeiros.
- `Dialog`: modal de revisao final.

### APIs envolvidas

- `POST /api/cos`
  - autentica usuario;
  - roteia multipart com arquivos para `analyzeCosFiles`;
  - roteia perguntas sem arquivo para `answerCosQuestion`.

- `POST /api/cos/actions/create-client`
  - cria cliente individual;
  - valida nome/razao social;
  - exige confirmacao extra se nao houver documento;
  - evita duplicidade por `document_number`;
  - grava log COS.

- `POST /api/cos/actions/create-financial-entry`
  - cria lancamento financeiro individual;
  - valida tipo, descricao, valor e data;
  - grava log COS.

- `POST /api/cos/actions/attach-document`
  - faz upload do arquivo original no bucket `gate-documents`;
  - cria registro em `documents`;
  - grava log COS.

### Fluxo de upload

Mapa real:

Usuario
-> Header / modal COS
-> input file ou drag-and-drop
-> estado local `cosAttachments`
-> `sendCosMessage`
-> `FormData` com `message` e `files`
-> `POST /api/cos`
-> `analyzeCosFiles`
-> preview retornado
-> arquivos originais guardados em memoria em `cosUploadedFiles`

Limitacao importante: o arquivo original fica disponivel para anexacao apenas enquanto existir naquela sessao de frontend. Se o estado for perdido, anexar documento falha com aviso.

### Fluxo de analise

Mapa real:

Arquivo
-> deteccao por extensao/tipo
-> XLS/XLSX/CSV: `xlsx`
-> DOCX: leitura ZIP/XML propria
-> PDF textual: extracao simples de strings PDF
-> imagem: `tesseract.js`
-> parser especifico
-> normalizacao
-> operational intelligence
-> preview

O fluxo nao usa LLM externo. A inteligencia atual e deterministica, baseada em regras, heuristicas, regex, classificadores simples e estruturas montadas em codigo.

### Fluxo de preview

O preview e renderizado dentro da conversa do COS. Ele inclui:

- arquivos analisados;
- abas/colunas/linhas de planilhas;
- contrato analisado;
- locadora;
- cliente/locataria;
- contrato;
- equipamentos;
- financeiro sugerido;
- documento;
- OCR financeiro;
- linhas DRE/gerenciais;
- diagnosticos;
- inteligencia operacional;
- possiveis lancamentos, clientes e equipamentos.

### Fluxo de confirmacao

Usuario
-> CTA isolada no card
-> `openCosActionReview`
-> modal de revisao final
-> campos editaveis
-> validacoes de UI
-> confirmacao humana
-> `executeCosAction`
-> endpoint isolado

Travas existentes:

- lancamento financeiro exige competencia ou vencimento;
- cliente sem CNPJ/CPF exige confirmacao;
- baixa confianca pode exigir confirmacao extra;
- anexar documento exige arquivo original ainda disponivel.

### Fluxo de gravacao

Gravacao atual permitida:

- cliente novo em `clients`;
- lancamento financeiro novo em `financial_entries`;
- documento novo em storage + `documents`.

Gravacao atual nao permitida pelo COS:

- contratos;
- equipamentos;
- categorias DRE;
- ajustes DRE;
- edicoes;
- exclusoes;
- updates;
- upserts;
- execucao em massa.

### Fluxo de logs

Endpoints de acao chamam `writeCosActionLog`, que insere em `cos_action_logs`:

- `user_id`;
- `action_type`;
- arquivo de origem;
- tipo de origem;
- confianca;
- payload;
- resultado;
- status;
- mensagem de erro.

O log e real, mas depende da tabela/politicas existirem no Supabase. Se a escrita do log falha, a acao pode ter sido executada e o frontend mostra "Log pendente".

## Parte 2 - Mentalidade atual do COS

### Como ele toma decisoes hoje

O COS atual decide por:

- intents textuais simples para perguntas;
- consultas Supabase diretas para resumo do sistema;
- extensao/MIME para tipo de arquivo;
- parsers de XLSX/CSV, DOCX, PDF textual e imagem;
- OCR com `tesseract.js`;
- regex e heuristicas de texto;
- classificacao por termos;
- blocos semanticos para contratos;
- estrutura operacional normalizada;
- entidades GATE derivadas por regras;
- mapeamentos fixos de entidade para modulo.

### Ele entende documentos?

Parcialmente.

O COS hoje monta uma camada chamada `operationalIntelligence`, com:

- tipo de documento;
- motivo da classificacao;
- estrutura logica;
- entidades de negocio;
- mapeamento para modulos;
- resumo executivo;
- dados faltantes;
- problemas e divergencias.

Isso e mais do que um parser simples, mas ainda nao e compreensao semantica profunda. A "compreensao" e deterministica e baseada em regras codificadas.

### Ele entende entidades?

Parcialmente.

Ele transforma leituras em entidades como:

- Cliente;
- Contrato;
- Equipamento;
- Financeiro;
- Documento;
- Banco;
- DRE.

Porem, essas entidades sao inferidas por heuristicas e nao reconciliadas contra todo o banco real. Por exemplo: uma receita de DRE pode virar possivel Cliente, mas o COS ainda nao valida automaticamente se existe contrato ativo correspondente.

### Ele entende contratos?

Ele entende contratos em nivel intermediario.

Pontos fortes:

- separa locadora, locataria e fiador por blocos;
- extrai dados principais;
- extrai equipamentos apenas de blocos permitidos;
- gera entidades operacionais;
- reduz risco de capturar clausulas juridicas como equipamento.

Limites:

- ainda depende de termos e padroes textuais;
- PDF escaneado nao passa por OCR de contrato;
- contratos com layout incomum podem ser classificados com baixa confianca;
- campos juridicos complexos nao sao interpretados em profundidade.

### Ele entende DRE?

Ele entende DRE como estrutura operacional basica, nao como motor contavel completo.

Ele identifica:

- receitas;
- despesas;
- impostos;
- resultado;
- saldos;
- diferencas;
- categorias.

Mas ainda nao concilia automaticamente com financeiro real, contratos ativos, parcelas previstas ou bancos reais. Os diagnosticos atuais sao explicativos e baseados no preview extraido, nao em auditoria cruzada completa contra todos os modulos.

## Parte 3 - Conhecimento atual do sistema

| Modulo | Conhece | Le | Interpreta | Cria | Edita | Sugere | Valida |
|---|---:|---:|---:|---:|---:|---:|---:|
| Clientes | Sim | Sim | Parcial | Sim, individual | Nao | Sim | Parcial |
| Contratos | Sim | Sim | Parcial | Nao | Nao | Sim | Parcial |
| Equipamentos | Sim | Sim | Parcial | Nao | Nao | Sim | Baixo |
| Financeiro | Sim | Sim | Parcial | Sim, individual | Nao | Sim | Parcial |
| DRE | Sim | Sim | Parcial | Nao | Nao | Sim | Baixo/medio |
| Documentos | Sim | Sim | Parcial | Sim, anexo | Nao | Sim | Parcial |
| Socios | Sim, no mapeamento | Nao diretamente pelo COS | Baixo | Nao | Nao | Baixo | Nao |
| Dashboard | Sim, como resumo indireto | Nao diretamente | Baixo | Nao | Nao | Nao | Nao |
| Manutencoes | Sim para perguntas | Sim | Baixo | Nao | Nao | Sim, orientacao | Baixo |
| Banco/contas | Sim como entidade financeira | Parcial | Baixo/medio | Nao | Nao | Sim | Baixo |

### Leitura por perguntas

Perguntas sem arquivo usam `answerCosQuestion` e `cos-tools`.

O COS sabe consultar:

- `clients`;
- `contracts`;
- `equipment`;
- `financial_entries`;
- `documents`;
- `maintenance_orders`;
- `installments`;
- `dre_historical_values` para anos 2022-2025;
- financeiro calculado para DRE operacional atual.

### Leitura por documentos

Arquivos usam `analyzeCosFiles`.

O COS sabe ler:

- XLSX;
- XLS;
- CSV;
- DOCX;
- PDF textual simples;
- imagens via OCR;
- documentos financeiros textuais.

## Parte 4 - Capacidades atuais

### Uploads

Capacidade: anexar ate 8 arquivos na sessao, via input ou drag-and-drop.

Maturidade: alta para UX basica.

Limitacoes:

- arquivo fica em memoria local do componente;
- nao ha fila persistente;
- nao ha controle explicito de tamanho no frontend;
- `.txt` aparece no accept, mas nao possui leitor especifico em `analyzeCosFiles`.

### OCR

Capacidade: OCR de imagens com `tesseract.js` em portugues e ingles.

Maturidade: media.

Limitacoes:

- nao faz OCR direto de PDF escaneado;
- qualidade depende muito da imagem;
- nao ha pre-processamento de imagem;
- erro de OCR pode virar linha financeira errada.

### Contratos

Capacidade: ler DOCX/PDF textual, identificar partes, dados contratuais, equipamentos, financeiro e documento.

Maturidade: media/alta para contratos textuais simples.

Limitacoes:

- ainda depende de blocos e termos conhecidos;
- datas e valores podem falhar em redacoes incomuns;
- nao cria contrato nem equipamento;
- nao consulta banco para verificar cliente/contrato existente.

### DRE

Capacidade: identificar linhas, categorias, valores, totais, saldos e diagnosticos basicos.

Maturidade: media.

Limitacoes:

- nao fecha DRE;
- nao altera DRE;
- nao compara automaticamente contra DRE operacional real;
- nao entende todas as variacoes possiveis de layout.

### Granatum

Capacidade: detectar termo Granatum como relatorio financeiro e processar por OCR/texto/planilha.

Maturidade: baixa/media.

Limitacoes:

- nao ha parser especifico para layout Granatum;
- depende do texto extraido e termos financeiros gerais;
- conciliacao com financeiro real ainda nao existe.

### Financeiro

Capacidade: sugerir receitas/despesas e criar lancamento individual apos revisao.

Maturidade: media.

Limitacoes:

- nao cria recorrencia;
- nao cria parcelas em massa;
- nao vincula categoria DRE real automaticamente;
- nao concilia com banco.

### Documentos

Capacidade: anexar arquivo original ao storage e criar registro em `documents`.

Maturidade: media/alta.

Limitacoes:

- vinculo com cliente/contrato depende de ids no formulario, mas o preview atual geralmente nao resolve esses ids;
- se o arquivo original sair da memoria, anexacao falha;
- nao ha versionamento documental.

### Diagnosticos

Capacidade: gerar diagnosticos de estrutura financeira, diferencas entre DRE extraida e lancamentos extraidos, e possivel diferenca banco/sistema.

Maturidade: baixa/media.

Limitacoes:

- ainda nao e auditoria cruzada completa contra banco real;
- nao verifica contrato ativo sem receita;
- nao verifica receita sem contrato real;
- nao verifica equipamento locado sem contrato;
- nao verifica saldo bancario real.

### Logs

Capacidade: gravar logs reais de acoes COS em `cos_action_logs`.

Maturidade: media.

Limitacoes:

- logs cobrem acoes, nao necessariamente todos os previews/analisadores;
- se tabela/politica nao estiver aplicada, log falha sem impedir necessariamente a operacao;
- nao ha tela dedicada de auditoria COS descrita nesta leitura.

### Acoes seguras

Capacidade:

- cadastrar cliente;
- criar lancamento financeiro individual;
- anexar documento.

Maturidade: alta para limites de seguranca, media para completude.

Limitacoes:

- nao cria contratos/equipamentos;
- nao edita existentes;
- nao executa em massa;
- validacoes sao basicas.

## Parte 5 - Limitacoes atuais

### Erros e fragilidades conhecidas

- Dependencia de strings e termos em portugues normalizado.
- Varias mensagens e trechos exibem problemas de encoding (`UsuÃ¡rio`, `prÃ³ximos`, etc.), o que nao quebra logica mas afeta UX.
- `supportedContractDocument` existe, mas aparentemente nao e usado no fluxo principal.
- `normalizedRowText` existe, mas nao e usado.
- `.txt` e aceito no frontend, mas nao tem leitor automatico.

### Campos mal extraidos ou potencialmente frageis

- Representante legal e CPF/RG em contratos longos.
- Data final explicita se a redacao nao usa "termino" ou "data final".
- Valor mensal se estiver em tabela com multiplas colunas.
- Equipamentos sem quantidade clara.
- Cidade/estado em enderecos fora do padrao `Cidade - UF`.
- Juros/multa/reajuste em clausulas juridicas complexas.

### Tipos de documentos problematicos

- PDF escaneado de contrato.
- Print com baixa resolucao.
- Planilha sem cabecalho claro.
- Granatum com layout diferente do esperado.
- Extrato bancario com colunas pouco legiveis.
- Nota fiscal e documento societario: classificados em tese, mas sem parser dedicado.

### Limitacoes do OCR

- Sem pre-processamento.
- Sem deteccao de tabela visual.
- Sem OCR multi-pagina para PDF escaneado.
- Sem verificacao humana campo-a-campo antes de converter OCR em entidade.

### Limitacoes do parser

- PDF textual usa extracao simples de strings PDF; pode falhar em PDFs comprimidos, protegidos ou com texto fragmentado.
- DOCX e lido por XML bruto, nao por layout visual real.
- XLSX/CSV usa heuristica de cabecalho e linhas, mas nao entende formulas complexas como semantica financeira completa.

### Limitacoes do diagnostico

- Diagnosticos ainda usam principalmente dados extraidos no arquivo.
- Nao ha reconciliacao profunda com Supabase em `analyzeCosFiles`.
- Nao ha grafo real de relacoes cliente-contrato-equipamento-financeiro.
- Nao ha score de divergencia baseado em dados reais do sistema inteiro.

### Limitacoes da UI

- COS fica dentro do Header, que concentra muita responsabilidade.
- Preview pode ficar extenso em documentos grandes.
- Campos da revisao sao gerados por `Object.entries`, sem labels amigaveis por dominio.
- Algumas acoes aparecem como "proxima etapa", mas nao ha explicacao contextual detalhada para todas.

### Limitacoes de confianca

- Confianca e heuristica, nao probabilistica.
- Nao ha calibracao estatistica com exemplos reais.
- Pode elevar confianca quando sinais textuais aparecem mas contexto esta errado.
- Confianca operacional considera ausencias, mas ainda nao valida consistencia contra banco real.

### Limitacoes de performance

- OCR roda no request da API e pode ser pesado.
- Analise de arquivos grandes pode bloquear resposta.
- Nao ha fila/background job.
- Nao ha cache de analises.
- Nao ha streaming de progresso.

### Limitacoes de contexto

- COS nao mantem memoria persistente da analise alem da conversa local.
- Arquivos analisados nao viram historico consultavel automaticamente.
- Nao ha aprendizado incremental por cliente, contrato ou fornecedor.

## Parte 6 - Riscos

### Cadastro incorreto

Risco: medio.

Motivo: acoes de cliente e financeiro gravam dados reais. Ha revisao humana, mas se o preview estiver errado e o usuario confirmar, o erro entra no sistema.

Mitigacoes atuais:

- revisao final;
- campos editaveis;
- bloqueio sem documento;
- confirmacao extra para baixa confianca;
- logs.

### Extracao incorreta

Risco: medio/alto.

Motivo: OCR, PDF e regex podem errar. Contratos fora do padrao e planilhas sem cabecalho claro sao especialmente sensiveis.

### Confianca elevada indevidamente

Risco: medio.

Motivo: scores sao baseados em sinais presentes. Um documento pode conter sinais fortes em contexto errado.

### Divergencias nao detectadas

Risco: alto.

Motivo: diagnostico atual nao cruza automaticamente todos os dados reais do sistema.

Exemplos nao cobertos completamente:

- receita na DRE sem contrato ativo real;
- contrato ativo sem receita prevista;
- equipamento locado sem contrato;
- saldo banco real divergente;
- parcelas previstas divergentes.

### Dependencia excessiva de layout/regex

Risco: medio.

O novo desenho reduziu dependencia de layout fixo, mas ainda existe dependencia de termos, regex e blocos textuais.

### Dependencia de OCR

Risco: medio.

OCR pode gerar valores errados, trocar separadores ou cortar linhas. A revisao humana e obrigatoria para acao, mas preview pode induzir erro.

### Problemas de UX

Risco: medio.

Previews longos, labels tecnicos e muitos cards podem cansar o usuario. A revisao final ainda e generica.

### Problemas de seguranca

Risco: baixo/medio.

Pontos positivos:

- exige usuario autenticado;
- usa server client;
- nao expõe service role no frontend;
- nao executa DELETE/UPDATE/UPSERT;
- acoes sao isoladas.

Pontos de atencao:

- upload de documentos depende de regras do storage/Supabase;
- logs podem falhar se tabela/politica nao estiver aplicada;
- anexacao cria documento real se usuario confirmar arquivo errado.

## Parte 7 - Potencial

O COS tem potencial para evoluir de parser inteligente para copiloto operacional e, depois, camada operacional da empresa.

### Potencial de curto prazo

- Validar cliente extraido contra `clients`.
- Validar contrato extraido contra `contracts`.
- Validar equipamento extraido contra `equipment`.
- Comparar DRE importada com `financial_entries`.
- Gerar relatorio de divergencias mais confiavel.
- Salvar analises como historico consultavel.

### Potencial de medio prazo

- Criar contratos apos revisao detalhada.
- Criar equipamentos apos revisao detalhada.
- Criar parcelas recorrentes com preview calendario.
- Vincular documento a cliente/contrato automaticamente por match confirmado.
- Conciliar extratos bancarios com financeiro.
- Criar categorias DRE sugeridas apos revisao.

### Potencial de longo prazo

- Copiloto operacional: detectar problemas e orientar o operador.
- Auditor operacional: monitorar contratos, receitas, equipamentos e DRE.
- Orquestrador: propor planos de acao entre modulos.
- Automacao assistida: executar lotes apenas com preview completo, regras e confirmacao granular.
- Sistema operacional da empresa: acompanhar ciclo completo cliente -> contrato -> equipamento -> financeiro -> DRE -> dashboard.

## Parte 8 - Roadmap recomendado

### Prioridade 1 - Confianca e validacao contra dados reais

Fazer primeiro:

- reconciliar entidades extraidas com Supabase;
- detectar duplicidade real de cliente antes do preview;
- validar contrato ativo para cliente detectado;
- validar se receita sugerida ja existe;
- validar se equipamento existe/esta disponivel;
- separar diagnostico "extraido do arquivo" de diagnostico "conferido no sistema".

Nao fazer agora:

- execucao em massa;
- criacao automatica de contrato/equipamento;
- correcao automatica de DRE;
- update em registros existentes.

Risco a resolver antes:

- confianca ainda nao esta ancorada em consistencia real do banco.

### Prioridade 2 - Persistencia da analise e auditoria

Fazer:

- criar entidade/tabela de analises COS, se autorizado;
- salvar previews, diagnosticos, versao do parser e origem;
- expor historico de analises;
- registrar logs tambem para analise sem acao, nao so para gravacao.

Nao fazer agora:

- transformar analise salva em fechamento DRE;
- usar historico como verdade operacional sem revisao.

Risco a resolver:

- hoje uma analise pode se perder se o frontend/session for perdido.

### Prioridade 3 - UX de revisao operacional

Fazer:

- labels amigaveis por tipo de acao;
- revisao por entidade;
- destaque de campos criticos;
- comparacao lado a lado arquivo vs entidade;
- status de confianca por campo, nao apenas por entidade;
- filtros por "pronto para cadastro", "revisar", "proxima etapa".

Nao fazer agora:

- "Confirmar tudo";
- tela de automacao total;
- acoes destrutivas.

Risco a resolver:

- usuario pode confiar demais em preview extenso ou generico.

## Parte 9 - Nota de maturidade

| Area | Nota | Justificativa |
|---|---:|---|
| Upload | 8 | Fluxo simples, drag-and-drop e multiplos arquivos; falta persistencia/fila. |
| OCR | 6 | Funciona para imagens; nao cobre PDF escaneado e nao pre-processa. |
| Contratos | 7 | Blocos semanticos e entidades operacionais; ainda depende de termos/regex. |
| Financeiro | 6 | Cria lancamento individual e extrai receitas/despesas; sem recorrencia/conciliacao. |
| DRE | 5 | Interpreta linhas e categorias; nao audita contra sistema real profundamente. |
| Granatum | 4 | Detecta como relatorio financeiro; nao tem parser especifico. |
| Diagnostico | 5 | Diagnosticos iniciais bons, mas ainda nao cruzam todos os modulos reais. |
| UI | 7 | Modal e cards funcionais; preview pode ficar extenso e revisao ainda generica. |
| Logs | 6 | Logs reais para acoes; nao loga toda analise e depende de tabela/politica aplicada. |
| Seguranca | 8 | Sem massa, sem delete/update, com confirmacao; risco permanece por confirmacao humana de dado errado. |
| Acoes | 6 | Acoes seguras isoladas existem; contratos/equipamentos/DRE ficam apenas sugeridos. |
| Operational Intelligence | 6 | Ja existe estrutura mental operacional; ainda e deterministica e sem reconciliacao real completa. |

## Parte 10 - Conclusao executiva

Hoje o COS esta mais proximo de um parser inteligente com camada inicial de assistente operacional.

Ele ja passou da fase de simples leitor de arquivos porque:

- le varios formatos;
- identifica entidades;
- estrutura contratos e DRE;
- gera diagnosticos;
- mapeia entidades para modulos GATE;
- exige revisao antes de gravar;
- grava logs das acoes.

Ele ainda nao e um copiloto operacional completo porque:

- nao reconcilia profundamente contra todos os dados reais;
- nao cria contratos/equipamentos;
- nao cria recorrencias;
- nao controla DRE;
- nao audita saldo bancario real;
- nao mantem historico persistente de analises;
- nao possui raciocinio probabilistico ou semantico amplo alem das regras codificadas.

Ele definitivamente ainda nao e o sistema operacional da empresa. Para chegar la, precisa primeiro virar auditor operacional confiavel: comparar arquivo, banco, contratos, financeiro, equipamentos, DRE e documentos com rastreabilidade e confianca por campo.

Parecer final:

O COS esta em um ponto promissor. A arquitetura atual e segura porque limita a execucao e preserva revisao humana. O maior valor atual esta em leitura, preview e preparacao operacional. O maior risco esta em tratar heuristicas como certeza. O proximo salto deve ser consistencia contra dados reais do GATE OS, nao aumento de automacao.

## Validacao desta auditoria

- Codigo nao alterado.
- Banco nao alterado.
- Supabase nao alterado.
- Auth nao alterado.
- RLS nao alterado.
- UI nao alterada.
- Rotas nao alteradas.
- Commit nao criado.
- Push nao executado.

Artefato criado:

- `GATE_OS_COS_FULL_AUDIT_REPORT.md`
