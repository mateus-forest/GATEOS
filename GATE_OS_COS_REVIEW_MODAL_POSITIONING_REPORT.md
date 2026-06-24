# GATE OS - Correcao visual do modal de revisao do COS

## Escopo

Correcao exclusivamente visual do modal de revisao final do COS.

Nao foram alterados parser, OCR, inteligencia operacional, endpoints, Supabase, Auth, RLS, banco, DRE, Dashboard, Contratos, Clientes, Equipamentos, acoes, validacoes de negocio ou execucao em massa.

## Alteracao aplicada

- O modal de revisao final deixou de usar o `Dialog` compartilhado dentro do `Header`.
- A revisao final agora renderiza em `document.body` via portal proprio.
- Overlay dedicado: `fixed inset-0 z-[9999]`.
- Conteudo dedicado: `relative z-[10000]`.
- Modal centralizado com `items-center justify-center`.
- Largura responsiva com `w-full max-w-2xl`.
- Altura limitada por viewport com `max-h-[min(90vh,760px)]`.
- Estrutura separada em header, corpo rolavel e rodape.
- Corpo com `overflow-y-auto` e `overscroll-contain`.
- Rodape com `shrink-0`, mantendo os botoes sempre acessiveis.
- Scroll do fundo travado enquanto a revisao esta aberta.
- Modal principal do COS nao foi alterado.

## Validacao

- `npm run lint`: sucesso.
- `npm run build`: sucesso.
- Inspecao estrutural confirmou:
  - overlay `fixed inset-0`;
  - z-index explicito `z-[9999]` e `z-[10000]`;
  - centralizacao por flex;
  - corpo interno rolavel;
  - rodape fora da area rolavel;
  - bloqueio de scroll do `document.body`.

## Observacao

Foi iniciado dev server local em `http://localhost:3018`, mas a rota `/dashboard` retornou 404 nessa sessao local, impedindo reproduzir o clique real no COS via Playwright sem alterar autenticacao/rotas/dados. A validacao executada ficou restrita a lint, build e verificacao estrutural do modal.

## Parecer

A correcao isola o modal de revisao final do contexto visual do Header/COS, evitando corte no topo, dependencia do scroll da pagina de fundo e disputa de z-index com o restante do sistema.
