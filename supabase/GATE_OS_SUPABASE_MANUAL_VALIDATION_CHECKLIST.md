# GATE OS - Checklist manual Supabase antes do push

Commit local pronto: `d1e0596 fix(gate): audit system integration and enforce real auth`

Regra: nao fazer push enquanto todos os itens abaixo nao estiverem validados manualmente no Supabase e no app.

## 1. Criar usuario admin no Supabase Auth

- Acessar Supabase Dashboard > Authentication > Users.
- Criar/invitar o usuario admin oficial da GATE.
- Definir senha por fluxo seguro do Supabase, convite ou reset de senha.
- Nao colocar senha no frontend, no SQL versionado, em `NEXT_PUBLIC_*` ou no relatorio.

Evidencia esperada:

- Usuario aparece em Authentication > Users.
- E-mail confirmado ou convite aceito.
- User UID disponivel.

Status: `pendente`

## 2. Vincular usuario na tabela public.users

- Abrir `supabase/gate-os-structural-audit-fixes.sql`.
- Usar somente a secao `A1`.
- Trocar `admin@gate.example` pelo e-mail real do admin criado.
- Executar no SQL Editor.
- Rodar a consulta de verificacao da secao `A3`.

Evidencia esperada:

- `public.users.id` igual ao UID do Supabase Auth.
- `public.users.email` igual ao e-mail admin.
- `public.users.role = 'admin'`.

Status: `pendente`

## 3. Confirmar/criar buckets

Buckets obrigatorios:

- `gate-documents`
- `gate-contracts`
- `gate-legal`

Passos:

- Verificar em Supabase Dashboard > Storage.
- Se algum bucket nao existir, executar a secao `A2` do SQL.
- Rodar a consulta de verificacao da secao `A3`.

Evidencia esperada:

- Os tres buckets existem.
- `public = false` para os tres buckets, salvo decisao explicita em contrario.

Status: `pendente`

## 4. Aplicar/verificar policies RLS para authenticated

Passos:

- Revisar a secao `B1` antes de executar.
- Confirmar se o modelo aprovado e: todo usuario `authenticated` pode ler/criar/editar dados internos.
- Se sim, executar `B1`.
- Se houver escopo por cargo, empresa, dono do registro ou permissao granular, adaptar as policies antes.
- Revisar deletes em `B2`; executar apenas nas tabelas onde exclusao real estiver aprovada.
- Revisar policies de Storage em `B3`; executar se usuarios autenticados puderem ler/enviar arquivos.

Evidencia esperada:

- RLS habilitado nas tabelas internas.
- Policies para role `authenticated` existem.
- Nenhuma policy anon ampla em tabelas internas.
- Storage permite upload/download autenticado nos buckets aprovados.

Status: `pendente`

## 5. Testar login real com usuario valido

Passos:

- Rodar o app local.
- Abrir `/login`.
- Entrar com e-mail/senha do admin criado no Supabase Auth.

Evidencia esperada:

- Login bem-sucedido.
- Redirecionamento para `/dashboard`.
- Header mostra perfil da sessao autenticada.

Status: `pendente`

## 6. Testar bloqueio de login invalido

Passos:

- Sair da sessao.
- Tentar entrar com e-mail inexistente ou senha incorreta.

Evidencia esperada:

- Usuario permanece em `/login`.
- Erro real do Supabase Auth aparece na tela.
- Nao ha redirecionamento para `/dashboard`.

Status: `pendente`

## 7. Testar upload em documentos

Pre-requisitos:

- Buckets criados.
- Policies de Storage autenticadas aplicadas.
- Usuario autenticado.

Passos:

- Abrir `/documentos`.
- Fazer upload de um arquivo pequeno de teste.
- Conferir Storage e tabela `documents`.

Evidencia esperada:

- Objeto criado em `storage.objects` no bucket correto.
- Linha criada em `public.documents`.
- Tela mostra sucesso somente depois da persistencia real.

Status: `pendente`

## 8. Testar Dashboard com sessao autenticada

Passos:

- Entrar com usuario valido.
- Abrir `/dashboard`.
- Conferir cards e blocos contra views/tabelas no Supabase.

Evidencia esperada:

- `/dashboard` abre somente autenticado.
- Cards consultam dados reais, sem valores mockados.
- Estados vazios aparecem como vazio/sem dados, nao como sucesso falso.

Status: `pendente`

## 9. Testar rota publica /cliente/contrato/[token]

Passos:

- Criar/usar contrato com `public_access_enabled = true` e `public_access_token` preenchido.
- Abrir `/cliente/contrato/[token]` em janela anonima ou sem sessao.
- Testar visualizacao dos dados publicos autorizados.
- Se houver chamado publico, testar criacao de chamado.

Evidencia esperada:

- Rota publica abre sem login apenas com token valido.
- Token invalido ou acesso desabilitado nao mostra dados sensiveis.
- Acesso anon fica restrito a essa rota e suas dependencias minimas.

Status: `pendente`

## 10. Validacao final local

Executar depois dos testes manuais:

```bash
npm run lint
npm run build
```

Evidencia esperada:

- Lint sem erros.
- Build sem falha.

Status: `pendente`

## 11. Push

Somente se todos os itens anteriores estiverem `ok`:

```bash
git push origin main
```

Nao criar commit vazio.
Nao mascarar pendencias.
Nao aplicar SQL nao revisado.
