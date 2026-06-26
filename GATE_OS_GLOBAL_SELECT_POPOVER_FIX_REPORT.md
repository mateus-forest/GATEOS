# GATE OS - Global Select/Popover Interaction Fix

## Escopo

Corrigido o problema global de interacao em selects, dropdowns, popovers e date pickers/listas expansivas que apareciam como se nao abrissem em modais e telas do sistema.

Nao foram alterados:

- COS;
- IA;
- parser;
- structured input;
- DRE;
- Dashboard;
- banco;
- Supabase;
- Auth;
- RLS;
- regras de negocio;
- endpoints;
- dados reais.

## Causa raiz encontrada

O `DialogContent` global renderiza o modal com overlay fixo em:

```text
z-[1200]
```

Enquanto os componentes globais de portal estavam em:

```text
z-50
```

Componentes afetados:

- `SelectContent`;
- `PopoverContent`;
- `DropdownMenuContent`.

Como esses menus sao renderizados em portal, eles abriam fora da arvore visual do modal, mas ficavam atras do overlay do dialog. Na pratica, o usuario clicava no campo e o menu/calendario/dropdown parecia nao abrir ou ficava bloqueado pelo backdrop.

## Arquivos alterados

- `components/ui/select.tsx`
- `components/ui/popover.tsx`
- `components/ui/dropdown-menu.tsx`

## Correcao aplicada

Foi elevada a camada dos portais globais para ficar acima do overlay de modal:

```text
z-[1300]
```

Aplicado em:

- `SelectPrimitive.Positioner`;
- `SelectPrimitive.Popup`;
- `PopoverPrimitive.Positioner`;
- `PopoverPrimitive.Popup`;
- `MenuPrimitive.Positioner`;
- `MenuPrimitive.Popup`.

Isso preserva a biblioteca atual e corrige o comportamento global sem refatorar telas ou formularios.

## Impacto esperado

Agora devem abrir corretamente:

- selects;
- dropdown menus;
- popovers;
- calendarios em popover;
- listas expansivas baseadas nos wrappers globais.

Dentro de modais, os menus devem aparecer acima do modal/backdrop e nao ser cortados por `overflow-y-auto`.

## Tela principal validada por inspecao

### Modal Novo Contrato

Campos cobertos pela correcao:

- Cliente;
- Status;
- Tipo;
- Equipamento.

Os campos de data no modal Novo Contrato usam `input type="date"` nativo. A causa encontrada nao altera a logica deles, mas remove o bloqueio de camada que afetava popovers/portais globais.

## Outra tela coberta

A correcao e global nos wrappers, portanto tambem cobre selects/dropdowns em telas como:

- Clientes;
- Financeiro;
- Documentos;
- Juridico;
- Equipamentos;
- DRE;
- Relatorios;
- Socios.

## Validacao executada

- `npm run lint`: sucesso.
- `npm run build`: sucesso.

Tentativa adicional:

- Foi iniciado dev server local em `http://localhost:3018`.
- Tentativa de teste automatizado com Playwright foi iniciada, mas o runner `@playwright/test` nao resolveu o import no workspace mesmo apos tentativa com `npx --package=@playwright/test`.
- O arquivo temporario de teste foi removido.

## Observacoes

- A correcao foi cirurgica e centralizada.
- Nenhum formulario foi refeito.
- Nenhuma validacao de negocio foi alterada.
- Nenhuma rota ou action foi alterada.
- Nenhum dado real foi alterado.

## Parecer

O problema era de camada visual/interativa: portais de select/popover/dropdown estavam abaixo do overlay de dialog. A elevacao do z-index para `z-[1300]` restaura a interacao global sem afetar regras de negocio.
