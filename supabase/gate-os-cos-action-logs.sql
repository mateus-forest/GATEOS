-- GATE OS - COS action logs
-- Revisar e aplicar manualmente no Supabase antes de exigir auditoria completa das acoes do COS.
-- Este arquivo nao apaga dados, nao remove tabelas e nao executa operacoes destrutivas.

create table if not exists public.cos_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action_type text not null,
  source_file_name text,
  source_file_type text,
  source_confidence numeric,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  status text not null check (status in ('success', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.cos_action_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cos_action_logs'
      and policyname = 'Authenticated users can read COS action logs'
  ) then
    create policy "Authenticated users can read COS action logs"
      on public.cos_action_logs
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cos_action_logs'
      and policyname = 'Authenticated users can insert COS action logs'
  ) then
    create policy "Authenticated users can insert COS action logs"
      on public.cos_action_logs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end;
$$;

create index if not exists idx_cos_action_logs_user_created_at
  on public.cos_action_logs (user_id, created_at desc);

create index if not exists idx_cos_action_logs_action_type
  on public.cos_action_logs (action_type);
