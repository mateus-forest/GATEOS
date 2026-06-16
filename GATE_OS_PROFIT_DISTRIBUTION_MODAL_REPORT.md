# GATE OS - Modal de configuracao da distribuicao de resultados

Data: 2026-06-16

## Objetivo

Transformar a secao "Distribuicao de Lucros" do Dashboard em um bloco operacional configuravel, sem recriar o modulo Socios, sem adicionar rota e sem alterar a estrutura geral do Dashboard.

## Arquivos alterados

- `components/dashboard-content.tsx`
- `lib/data/profit-distribution.ts`
- `lib/data/supabase-helpers.ts`
- `supabase/gate-os-profit-distribution-rules.sql`

## Tabela criada

Foi criado o SQL:

- `supabase/gate-os-profit-distribution-rules.sql`

Tabela proposta:

- `partner_distribution_rules`

Campos:

- `id`
- `name`
- `rule_type`
- `percentage`
- `fixed_amount`
- `is_active`
- `created_at`
- `updated_at`

O SQL tambem cria policies para usuarios autenticados e seed inicial idempotente:

- Carlos, socio, 65%
- Renan, socio, 35%
- Mateus, participacao extra, 8%
- Mateus, valor fixo, R$ 0,00

O SQL nao foi executado automaticamente.

## Regras implementadas

No Dashboard, a secao "Distribuicao de Lucros" ganhou um botao discreto de configuracao.

O modal permite:

- adicionar participante;
- editar nome;
- editar tipo;
- editar participacao percentual;
- editar valor fixo;
- ativar/desativar participante sem exclusao fisica;
- escolher base de calculo:
  - Receita Bruta;
  - Receita Liquida;
  - Resultado Operacional.

## Calculo

Quando existem regras ativas carregadas de `partner_distribution_rules`, o Dashboard calcula:

- valor percentual sobre a base selecionada;
- valor fixo direto;
- total distribuido;
- lucro retido.

Quando a tabela ainda nao esta aplicada, a tela preserva o calculo anterior e o modal mostra erro claro ao tentar carregar/salvar regras.

## Validacoes de seguranca

O modal valida:

- nome vazio;
- percentual negativo;
- percentual maior que 100%;
- valor fixo negativo;
- participante percentual ativo com percentual zero.

Nao ha exclusao fisica. A desativacao grava `is_active = false`.

## Validacoes executadas

- `npm run lint`
- `npm run build`

O build passou e manteve o Dashboard como rota existente.

## Observacoes

- Nenhum modulo Socios foi reativado.
- Nenhum item foi adicionado na sidebar.
- Nenhuma rota nova foi criada.
- Nenhum dado do Supabase foi apagado.

