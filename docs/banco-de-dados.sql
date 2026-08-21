-- =============================================================================
-- Portal OrganizaMente — script completo do banco de dados (PostgreSQL/Supabase)
-- Estado: 100% operacional (schema + grants + RLS + integridade)
-- Execute de cima para baixo em um banco vazio para recriar tudo.
-- =============================================================================

-- Extensão usada por gen_random_uuid() (já habilitada por padrão no Supabase)
create extension if not exists pgcrypto;

-- =============================================================================
-- 1) TAREFAS
-- =============================================================================
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  title       text not null,
  notes       text,
  area        text not null default 'pessoal',
  priority    text not null default 'media',
  due_at      timestamptz,
  remind_at   timestamptz,
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Privilégios da Data API (sem GRANT a tabela é inacessível, mesmo com RLS)
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
-- Nenhum grant para "anon": dados são privados.

alter table public.tasks enable row level security;

create policy "own tasks" on public.tasks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index tasks_user_created_idx on public.tasks (user_id, created_at desc);

alter table public.tasks
  add constraint tasks_title_len     check (char_length(title) between 1 and 300),
  add constraint tasks_notes_len     check (notes is null or char_length(notes) <= 4000),
  add constraint tasks_area_valid    check (area in ('pessoal','trabalho','outros')),
  add constraint tasks_priority_valid check (priority in ('alta','media','baixa'));

-- =============================================================================
-- 2) DESPEJO MENTAL / SOS (entrada bruta + resultado da IA)
-- =============================================================================
create table public.brain_dumps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  kind        text not null default 'dump',   -- 'dump' | 'sos'
  raw_text    text not null,
  ai_result   jsonb,
  created_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.brain_dumps to authenticated;
grant all on public.brain_dumps to service_role;

alter table public.brain_dumps enable row level security;

create policy "own dumps" on public.brain_dumps
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index brain_dumps_user_created_idx on public.brain_dumps (user_id, created_at desc);

alter table public.brain_dumps
  add constraint brain_dumps_kind_valid check (kind in ('dump','sos')),
  add constraint brain_dumps_text_len   check (char_length(raw_text) between 1 and 8000);

-- =============================================================================
-- 3) DIÁRIO (humor, energia e reflexões — todos os campos de texto opcionais)
-- =============================================================================
create table public.journal_entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  mood           int not null default 3,
  energy         int,
  feeling        text,
  what_happened  text,
  thoughts       text,
  helped         text,
  not_helped     text,
  created_at     timestamptz not null default now()
);

grant select, insert, update, delete on public.journal_entries to authenticated;
grant all on public.journal_entries to service_role;

alter table public.journal_entries enable row level security;

create policy "own journal" on public.journal_entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index journal_user_created_idx on public.journal_entries (user_id, created_at desc);

alter table public.journal_entries
  add constraint journal_mood_range   check (mood between 1 and 5),
  add constraint journal_energy_range check (energy is null or energy between 1 and 5),
  add constraint journal_text_len     check (
    coalesce(char_length(feeling), 0)       <= 2000
    and coalesce(char_length(what_happened), 0) <= 4000
    and coalesce(char_length(thoughts), 0)      <= 4000
    and coalesce(char_length(helped), 0)        <= 2000
    and coalesce(char_length(not_helped), 0)    <= 2000
  );

-- =============================================================================
-- 4) VERIFICAÇÃO PÓS-INSTALAÇÃO
-- =============================================================================
-- RLS ligado em todas as tabelas:
--   select relname, relrowsecurity from pg_class
--   where relnamespace = 'public'::regnamespace and relkind = 'r';
-- Políticas existentes:
--   select tablename, policyname, roles, cmd from pg_policies where schemaname = 'public';
-- Privilégios concedidos:
--   select table_name, grantee, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' order by table_name, grantee;
