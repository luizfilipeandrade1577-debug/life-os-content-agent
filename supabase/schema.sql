-- LIFE OS Content Agent — Supabase schema v0.2
create extension if not exists pgcrypto;

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text default '',
  source text default 'Outro',
  status text not null default 'INSIGHT'
    check (status in ('INSIGHT','PAUTA','DESCARTADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_id uuid references public.insights(id) on delete set null,
  title text not null,
  format text default 'A definir',
  status text not null default 'DRAFT'
    check (status in ('PAUTA','DRAFT','AGUARDANDO_APROVACAO','APROVADO','AGENDADO','PUBLICADO','ANALISADO','DESCARTADO')),
  caption text default '',
  scheduled_at timestamptz,
  published_at timestamptz,
  instagram_media_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editorial_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_key text not null,
  title text not null,
  body text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, rule_key)
);

create table if not exists public.content_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  metric_date date not null default current_date,
  reach integer,
  impressions integer,
  likes integer,
  comments integer,
  saves integer,
  shares integer,
  follows integer,
  created_at timestamptz not null default now(),
  unique(content_id, metric_date)
);

alter table public.insights enable row level security;
alter table public.contents enable row level security;
alter table public.editorial_rules enable row level security;
alter table public.content_metrics enable row level security;

drop policy if exists "Users manage own insights" on public.insights;
create policy "Users manage own insights" on public.insights
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own contents" on public.contents;
create policy "Users manage own contents" on public.contents
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own editorial rules" on public.editorial_rules;
create policy "Users manage own editorial rules" on public.editorial_rules
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own metrics" on public.content_metrics;
create policy "Users manage own metrics" on public.content_metrics
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists insights_updated_at on public.insights;
create trigger insights_updated_at before update on public.insights
for each row execute function public.set_updated_at();

drop trigger if exists contents_updated_at on public.contents;
create trigger contents_updated_at before update on public.contents
for each row execute function public.set_updated_at();

drop trigger if exists editorial_rules_updated_at on public.editorial_rules;
create trigger editorial_rules_updated_at before update on public.editorial_rules
for each row execute function public.set_updated_at();
