# GATE OS - Integração do banner 3D no login

Data: 2026-06-16

## Escopo

Ajuste exclusivamente visual na página `/login`. Não houve alteração de Supabase Auth, validações, rotas, banco, regras de negócio, dashboard ou módulos internos.

## Imagem aplicada

- Arquivo de origem: `ChatGPT Image 16 de jun. de 2026, 14_28_04.png`
- Arquivo no projeto: `public/images/gate-login-hero-3d.png`

## Arquivo alterado

- `app/page.tsx`

## Estratégia de posicionamento

- A tela segue dividida em duas áreas no desktop:
  - coluna esquerda com logo, título, subtítulo, card de login e versão;
  - área direita com o banner 3D da GATE.
- A área visual direita usa `next/image` com `fill`, `priority` e `object-cover`.
- O enquadramento usa `object-[62%_center]` para manter o símbolo 3D grande, visível e com respiro em notebooks.
- Foram adicionados gradientes sutis sobre a imagem para integrar o fundo claro à área do formulário sem borda dura.
- O formulário não fica sobre o símbolo e permanece legível.

## Comportamento responsivo

- Desktop/notebook: banner visível na lateral direita, ocupando a altura total da tela.
- Larguras maiores: o enquadramento central preserva a composição do símbolo.
- Mobile/tablet menor: a área visual fica oculta e o login permanece limpo e centralizado.

## Validações executadas

- `/login` validado localmente.
- Imagem pública `/images/gate-login-hero-3d.png` validada localmente.
- `npm run lint`
- `npm run build`

## Confirmação

O fluxo de autenticação e o componente `LoginForm` não foram alterados.
