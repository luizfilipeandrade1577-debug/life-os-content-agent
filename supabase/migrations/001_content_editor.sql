-- LIFE OS Content Agent v0.5 — Editor de conteúdo
alter table public.contents
  add column if not exists objective text default '',
  add column if not exists script text default '',
  add column if not exists cta text default '',
  add column if not exists hashtags text default '',
  add column if not exists notes text default '',
  add column if not exists media_urls jsonb not null default '[]'::jsonb;
