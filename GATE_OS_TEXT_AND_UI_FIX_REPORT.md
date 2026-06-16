# GATE OS - Correção global de textos, COS e favicon

Data: 2026-06-16

## Escopo

Correção exclusivamente visual/textual. Não houve alteração de banco, Supabase, Auth, RLS, rotas, queries, regras de negócio, dados reais, financeiro ou cálculos da DRE.

## Padrões de encoding encontrados

Foram corrigidas sequências de mojibake UTF-8 comuns em textos visíveis, incluindo:

- acentos agudos, circunflexos e tils exibidos como pares de caracteres corrompidos;
- cedilha exibida como sequência corrompida;
- ordinal masculino/feminino com caractere extra;
- aspas, travessões, apóstrofos, reticências e marcadores importados com encoding incorreto.

Exemplos de termos restaurados:

- `Gestão`
- `renovação`
- `manutenção`
- `Lançamento`
- `Descrição`
- `competência`
- `mês`
- `Conta bancária`
- `participação`
- `concluído`

## Arquivos corrigidos

- `components/contratos-content.tsx`
- `components/dashboard-content.tsx`
- `components/documentos-content.tsx`
- `components/dre-content.tsx`
- `components/equipamentos-content.tsx`
- `components/financeiro-content.tsx`
- `components/header.tsx`
- `components/juridico-content.tsx`
- `components/manutencoes-content.tsx`
- `components/patrimonio-content.tsx`
- `components/relatorios-content.tsx`

## COS Assistant

O modal do COS foi corrigido definitivamente para ser renderizado via `createPortal` em `document.body`, evitando que o painel fique preso ao header com blur.

Correções aplicadas:

- Overlay `fixed` em tela inteira com blur suave.
- Z-index elevado acima de header/sidebar.
- Painel branco centralizado por `top: 50%`, `left: 50%` e `translate(-50%, -50%)`.
- Largura responsiva com limite de `520px`.
- Altura máxima `calc(100vh - 96px)`.
- Scroll interno no conteúdo.
- Cabeçalho, botão fechar, mensagem inicial, sugestões e input de rodapé preservados.

## Favicon

O logo enviado foi aplicado como favicon/ícone do sistema:

- `public/favicon.png`
- `public/apple-icon.png`
- `app/icon.png`

Também foi ajustado `app/layout.tsx` para apontar `metadata.icons.icon` para `/favicon.png` e `metadata.icons.apple` para `/apple-icon.png`.

## Fonte

Foi revalidado que a aplicação continua usando Geist Sans globalmente. A busca por `font-serif`, `Times` e `Georgia` nos arquivos principais não encontrou uso na interface.

## Validações executadas

- Varredura real via Node para mojibake em `app`, `components` e `lib`: `0` arquivos com padrões restantes.
- Varredura em relatórios `GATE_OS_*.md`: sem padrões de mojibake restantes.
- `npm run lint`: passou.
- `npm run build`: passou.
- Dev server local:
  - `/dashboard`: `307` para login, esperado sem sessão.
  - `/clientes`: `307` para login, esperado sem sessão.
  - `/contratos`: `307` para login, esperado sem sessão.
  - `/financeiro`: `307` para login, esperado sem sessão.
  - `/dre`: `307` para login, esperado sem sessão.
  - `/documentos`: `307` para login, esperado sem sessão.
  - `/manutencoes`: `307` para login, esperado sem sessão.
  - `/cliente/contrato/teste`: `200`.
  - `/favicon.png`: `200 image/png`.
  - `/icon.png`: `200 image/png`.

## Pendências visuais restantes

- A validação visual completa dentro dos módulos privados depende de sessão autenticada no ambiente real.
- Nenhuma pendência textual de mojibake foi encontrada após a varredura automatizada.

## Confirmação

Não foi alterada lógica operacional, DRE, Supabase, banco, dados reais, autenticação, RLS, queries ou regras de negócio.
