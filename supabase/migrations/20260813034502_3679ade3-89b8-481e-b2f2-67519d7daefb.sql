CREATE TABLE public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  notes text,
  area text not null default 'pessoal',
  priority text not null default 'media',
  due_at timestamptz,
  remind_at timestamptz,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tasks_user_created_idx ON public.tasks (user_id, created_at DESC);

CREATE TABLE public.brain_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null default 'dump',
  raw_text text not null,
  ai_result jsonb,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_dumps TO authenticated;
GRANT ALL ON public.brain_dumps TO service_role;
ALTER TABLE public.brain_dumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dumps" ON public.brain_dumps FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX brain_dumps_user_created_idx ON public.brain_dumps (user_id, created_at DESC);

CREATE TABLE public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  mood int not null default 3,
  energy int,
  feeling text,
  what_happened text,
  thoughts text,
  helped text,
  not_helped text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX journal_user_created_idx ON public.journal_entries (user_id, created_at DESC);