-- Migration sugerida para habilitar links publicos por contrato.
-- Nao execute automaticamente sem validar RLS/policies do projeto.

alter table public.contracts
  add column if not exists public_access_token uuid,
  add column if not exists public_access_enabled boolean not null default false,
  add column if not exists public_access_created_at timestamptz;

create unique index if not exists contracts_public_access_token_key
  on public.contracts (public_access_token)
  where public_access_token is not null;

-- Politica/RLS sugerida:
-- A leitura publica por token precisa ser liberada apenas para contratos com
-- public_access_enabled = true e filtragem por public_access_token.
-- Ajuste conforme as policies atuais antes de aplicar em producao.
