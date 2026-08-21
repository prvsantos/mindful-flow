ALTER TABLE public.tasks ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.brain_dumps ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.journal_entries ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_title_len CHECK (char_length(title) BETWEEN 1 AND 300),
  ADD CONSTRAINT tasks_notes_len CHECK (notes IS NULL OR char_length(notes) <= 4000),
  ADD CONSTRAINT tasks_area_valid CHECK (area IN ('pessoal','trabalho','outros')),
  ADD CONSTRAINT tasks_priority_valid CHECK (priority IN ('alta','media','baixa'));

ALTER TABLE public.brain_dumps
  ADD CONSTRAINT brain_dumps_kind_valid CHECK (kind IN ('dump','sos')),
  ADD CONSTRAINT brain_dumps_text_len CHECK (char_length(raw_text) BETWEEN 1 AND 8000);

ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_mood_range CHECK (mood BETWEEN 1 AND 5),
  ADD CONSTRAINT journal_energy_range CHECK (energy IS NULL OR energy BETWEEN 1 AND 5),
  ADD CONSTRAINT journal_text_len CHECK (
    coalesce(char_length(feeling),0) <= 2000
    AND coalesce(char_length(what_happened),0) <= 4000
    AND coalesce(char_length(thoughts),0) <= 4000
    AND coalesce(char_length(helped),0) <= 2000
    AND coalesce(char_length(not_helped),0) <= 2000
  );