create table if not exists public.partner_distribution_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rule_type text not null check (rule_type in ('partner', 'extra_percentage', 'fixed_amount')),
  percentage numeric default 0 check (percentage >= 0 and percentage <= 100),
  fixed_amount numeric default 0 check (fixed_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_distribution_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_distribution_rules'
      and policyname = 'Authenticated users can read profit distribution rules'
  ) then
    create policy "Authenticated users can read profit distribution rules"
      on public.partner_distribution_rules
      for select
      to authenticated
      using (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_distribution_rules'
      and policyname = 'Authenticated users can insert profit distribution rules'
  ) then
    create policy "Authenticated users can insert profit distribution rules"
      on public.partner_distribution_rules
      for insert
      to authenticated
      with check (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'partner_distribution_rules'
      and policyname = 'Authenticated users can update profit distribution rules'
  ) then
    create policy "Authenticated users can update profit distribution rules"
      on public.partner_distribution_rules
      for update
      to authenticated
      using (true)
      with check (true);
  end if;
end;
$$;

create or replace function public.set_partner_distribution_rules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_partner_distribution_rules_updated_at on public.partner_distribution_rules;
create trigger trg_partner_distribution_rules_updated_at
  before update on public.partner_distribution_rules
  for each row
  execute function public.set_partner_distribution_rules_updated_at();

insert into public.partner_distribution_rules (name, rule_type, percentage, fixed_amount, is_active)
select seed.name, seed.rule_type, seed.percentage, seed.fixed_amount, true
from (
  values
    ('Carlos', 'partner', 65, 0),
    ('Renan', 'partner', 35, 0),
    ('Mateus', 'extra_percentage', 8, 0),
    ('Mateus', 'fixed_amount', 0, 0)
) as seed(name, rule_type, percentage, fixed_amount)
where not exists (
  select 1
  from public.partner_distribution_rules existing
  where lower(existing.name) = lower(seed.name)
    and existing.rule_type = seed.rule_type
);
