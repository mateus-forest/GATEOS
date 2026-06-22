-- GATE OS - COS action logs
-- Revisar e executar manualmente no Supabase quando a etapa de execucao assistida for aprovada.
-- Este arquivo nao e executado automaticamente pelo app.

create table if not exists public.cos_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action_type text not null,
  source text,
  status text not null,
  prompt text,
  preview_payload jsonb,
  executed_payload jsonb,
  result_payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.cos_action_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cos_action_logs'
      and policyname = 'Authenticated users can read COS action logs'
  ) then
    create policy "Authenticated users can read COS action logs"
      on public.cos_action_logs
      for select
      to authenticated
      using (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cos_action_logs'
      and policyname = 'Authenticated users can insert COS action logs'
  ) then
    create policy "Authenticated users can insert COS action logs"
      on public.cos_action_logs
      for insert
      to authenticated
      with check (auth.uid() = user_id or user_id is null);
  end if;
end;
$$;
