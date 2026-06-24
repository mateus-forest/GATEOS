# GATE OS - Hardening do fluxo de revisao do COS

## Escopo

Correcao de qualidade e seguranca do COS apos teste real em producao.

Nao foram alterados Auth, Login, Usuarios, Sessao, RLS, banco, Supabase, DRE operacional, Dashboard, contratos existentes, clientes existentes, equipamentos existentes, edicoes, exclusoes, upserts ou execucao em massa.

## Problemas tratados

- Cliente podia chegar ao endpoint com razao social contaminada por CNPJ, endereco e texto juridico.
- Revisao final mostrava campos tecnicos como `due_date`, `competence_date`, `confidenceLevel`, `sourceType` e `suggested_due_day`.
- Lancamento financeiro podia ser revisado com valor parcial ou suspeito.
- Analise do COS se perdia ao fechar o modal.
- Preview principal mostrava informacao tecnica demais para o operador.
- Modal de revisao precisava de z-index e scroll interno mais controlados.

## Sanitizacao de cliente

Implementado bloqueio antes de gravar cliente:

- `name` e `legal_name` sao limpos por `normalizeCosClientName`.
- O endpoint `create-client` recusa nome com CNPJ/CPF, endereco, `pessoa juridica`, `denominada`, clausulas, foro, obrigacoes ou texto longo.
- Se o nome nao puder ser separado com seguranca, a API responde: `Dados do cliente ainda precisam de revisão manual.`
- O frontend tambem limpa e bloqueia o CTA quando detecta nome contaminado.

Campos permitidos para revisao de cliente:

- Razao social.
- CNPJ/CPF.
- Endereco.
- Cidade.
- Estado.
- CEP.
- Representante legal.
- Contato principal.
- E-mail.
- Telefone.

## Financeiro do contrato

Refinado o parser financeiro de contrato:

- Valor mensal prefere o padrao `preco da locacao sera de R$`.
- Caucao prefere o padrao `como caucao... no valor de R$`.
- Valores parciais abaixo de R$ 100 sao descartados quando a clausula contem valor contratual maior.
- O endpoint financeiro bloqueia valor menor que R$ 100 quando existe valor contratual de referencia maior.
- O endpoint financeiro bloqueia descricao juridica longa ou com termos de clausula.
- `numberField` agora aceita corretamente `3697.33` e `R$ 3.697,33` como `3697.33`.

Para o contrato ATIBAIA, a validacao confirma:

- Valor mensal: R$ 3.697,33.
- Caucao: R$ 3.697,33.
- Vencimento: dia 15.
- Prazo: 36 meses.
- Parcelas: 36.
- Data de assinatura: 27/05/2025.
- Inicio provavel: 27/05/2025.
- Final previsto: 27/05/2028.
- O valor `7.33` nao e aceito como valor mensal.

## Persistencia temporaria da analise

Implementada persistencia local versionada:

- Chave: `gate-cos-last-analysis-v1`.
- Armazena mensagens com preview, arquivos analisados em metadados, preview normalizado e inteligencia operacional.
- Ao fechar e reabrir o COS, a ultima analise permanece visivel.
- Arquivos binarios originais nao sao persistidos em localStorage.
- Anexar documento continua bloqueado se o arquivo original nao estiver disponivel na sessao.
- Adicionada acao `Limpar analise`.

## Modal de revisao final

O modal passa a usar campos por tipo de acao, nao mais `Object.entries` do payload.

Labels humanos:

- `due_date` -> Data de vencimento.
- `competence_date` -> Competencia.
- `status` -> Status.
- `category` -> Categoria.
- `description` -> Descricao.
- `value` -> Valor.
- `source_file` -> Arquivo de origem.

Melhorias visuais:

- z-index superior ao COS.
- Conteudo centralizado.
- Scroll interno.
- Campos relevantes por acao.
- Metadados tecnicos continuam no payload para validacao/log, mas nao aparecem como campos de revisao.

## Preview visual

- Cards agora usam quebra de linha e `overflow-wrap`.
- Tabelas deixam de truncar agressivamente textos longos.
- Inteligencia operacional exibe resumo humano, dados encontrados, dados ausentes e divergencias.
- Detalhes tecnicos ficam recolhidos em `Ver detalhes tecnicos`.
- Schema/backend nao aparece no fluxo principal.

## Execucao em massa

Permanece bloqueado:

- Confirmar execucao.
- Cadastrar contrato.
- Cadastrar equipamentos.
- Criar recorrencia.
- Criar parcelas.
- Executar tudo.
- Editar.
- Excluir.
- Upsert.

## Validacao executada

- `node scripts\validate-cos-atibaia-contract.cjs`: sucesso, `failures: []`.
- `npm run lint`: sucesso.
- `npm run build`: sucesso.

O validador local cobre:

- Extracao ATIBAIA completa.
- Cliente nao contaminado por texto bruto.
- Valor mensal nao extraido como `7.33`.
- Normalizacao numerica de `3697.33` e `R$ 3.697,33`.
- Persistencia local da analise.
- Acao `Limpar analise`.
- Modal com whitelist de campos.
- Labels em portugues.
- Ausencia de loop bruto sobre `Object.entries(cosActionPayload)`.
- z-index superior do modal de revisao.

## Parecer

O COS permanece em etapa segura de leitura, revisao e acoes isoladas. Esta correcao reduz risco de gravacao incorreta, melhora a revisao humana e preserva a decisao de nao liberar execucao em massa.
