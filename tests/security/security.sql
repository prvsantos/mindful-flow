-- Testes de segurança do OrganizaMente. Rodam dentro de uma transação e são desfeitos no final.
\set ON_ERROR_STOP on
BEGIN;
-- A = uma conta Lite existente; B = a conta do administrador (dados criados aqui são desfeitos).
SELECT set_config('test.a', (SELECT user_id::text FROM public.user_roles WHERE role='lite' LIMIT 1), false);
SELECT set_config('test.b', (SELECT value FROM public.app_config WHERE key='admin_user_id'), false);

CREATE TEMP TABLE results(name text, ok boolean, info text);
GRANT ALL ON results TO authenticated, anon;

CREATE OR REPLACE FUNCTION pg_temp.as_user(uid text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

-- B cria dados (Premium)
SELECT pg_temp.as_user(current_setting('test.b'));
INSERT INTO public.categories(slug,label) VALUES ('casa-b-teste','Casa B');
INSERT INTO public.tasks(title, area) VALUES ('Tarefa de B', 'casa-b-teste');
INSERT INTO public.journal_entries(mood, feeling) VALUES (3, 'texto privado de B');
RESET ROLE;

-- A (Lite)
SELECT pg_temp.as_user(current_setting('test.a'));
INSERT INTO results SELECT '1. A não lê tarefas de B', count(*)=0, count(*)::text FROM public.tasks WHERE user_id <> current_setting('test.a')::uuid;
INSERT INTO results SELECT '1. A não lê diário de B', count(*)=0, count(*)::text FROM public.journal_entries WHERE user_id <> current_setting('test.a')::uuid;
WITH u AS (UPDATE public.tasks SET title='hack' WHERE user_id <> current_setting('test.a')::uuid RETURNING 1) INSERT INTO results SELECT '1. A não altera tarefas de B', count(*)=0, '' FROM u;
WITH d AS (DELETE FROM public.journal_entries WHERE user_id <> current_setting('test.a')::uuid RETURNING 1) INSERT INTO results SELECT '1. A não apaga diário de B', count(*)=0, '' FROM d;

DO $$ BEGIN
  INSERT INTO public.tasks(user_id, title, area) VALUES (current_setting('test.b')::uuid,'forjada','pessoal');
  INSERT INTO results VALUES ('2. A não grava em nome de B', false, 'inseriu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('2. A não grava em nome de B', true, SQLERRM); END $$;

DO $$ BEGIN
  INSERT INTO public.tasks(title, area) VALUES ('usar categoria de B','casa-b-teste');
  INSERT INTO results VALUES ('3. A não usa categoria de B', false, 'inseriu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('3. A não usa categoria de B', true, SQLERRM); END $$;

DO $$ BEGIN
  INSERT INTO public.user_roles(user_id, role) VALUES (current_setting('test.a')::uuid,'premium');
  INSERT INTO results VALUES ('4. A não se dá Premium', false, 'inseriu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('4. A não se dá Premium', true, SQLERRM); END $$;
WITH u AS (UPDATE public.user_roles SET role='owner' RETURNING 1) INSERT INTO results SELECT '4. A não vira administrador', count(*)=0, '' FROM u;

INSERT INTO results SELECT '5. Lite bloqueado na IA', (public.ai_begin_call('organize')->>'reason')='plan', public.ai_begin_call('organize')::text;

DO $$ DECLARE i int; BEGIN
  FOR i IN 1..3 LOOP INSERT INTO public.tasks(title, area) VALUES ('t'||i, 'pessoal'); END LOOP;
  BEGIN
    INSERT INTO public.tasks(title, area) VALUES ('t4', 'pessoal');
    INSERT INTO results VALUES ('6. Lite: máx. 3 tarefas abertas por categoria', false, 'inseriu a 4ª');
  EXCEPTION WHEN others THEN INSERT INTO results VALUES ('6. Lite: máx. 3 tarefas abertas por categoria', true, SQLERRM); END;
END $$;

DO $$ DECLARE i int; BEGIN
  FOR i IN 1..4 LOOP INSERT INTO public.journal_entries(mood) VALUES (3); END LOOP;
  BEGIN
    INSERT INTO public.journal_entries(mood) VALUES (3);
    INSERT INTO results VALUES ('6. Lite: máx. 4 registros no diário', false, 'inseriu o 5º');
  EXCEPTION WHEN others THEN INSERT INTO results VALUES ('6. Lite: máx. 4 registros no diário', true, SQLERRM); END;
END $$;

DO $$ BEGIN
  INSERT INTO public.categories(slug,label) VALUES ('c1','C1'),('c2','C2');
  BEGIN
    INSERT INTO public.categories(slug,label) VALUES ('c3','C3');
    INSERT INTO results VALUES ('6. Lite: máx. 2 categorias próprias', false, 'inseriu a 3ª');
  EXCEPTION WHEN others THEN INSERT INTO results VALUES ('6. Lite: máx. 2 categorias próprias', true, SQLERRM); END;
END $$;

DO $$ BEGIN
  INSERT INTO public.ai_usage(user_id, feature) VALUES (auth.uid(), 'organize');
  INSERT INTO results VALUES ('7. Ninguém grava consumo da IA direto', false, 'inseriu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('7. Ninguém grava consumo da IA direto', true, SQLERRM); END $$;

DO $$ BEGIN
  PERFORM public.ai_usage_summary();
  INSERT INTO results VALUES ('7. Só o admin vê o resumo de consumo', false, 'leu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('7. Só o admin vê o resumo de consumo', true, SQLERRM); END $$;
RESET ROLE;

-- A promovido a Premium (desfeito): consentimento e limites da IA
UPDATE public.user_roles SET role='premium' WHERE user_id=current_setting('test.a')::uuid;
SELECT pg_temp.as_user(current_setting('test.a'));
INSERT INTO results SELECT '8. Sem consentimento, padrões do diário bloqueados', (public.ai_begin_call('patterns')->>'reason')='consent', '';
INSERT INTO public.user_consents(purpose, granted, notice_version) VALUES ('ai_journal_patterns', true, 'v1');
INSERT INTO public.user_consents(purpose, granted, notice_version) VALUES ('ai_journal_patterns', false, 'v1');
INSERT INTO results SELECT '8. Consentimento revogado bloqueia de novo', (public.ai_begin_call('patterns')->>'reason')='consent', '';
INSERT INTO results SELECT '9. Premium pode usar a IA', (public.ai_begin_call('organize')->>'ok')='true', '';
INSERT INTO results SELECT '9. Chamada simultânea bloqueada', (public.ai_begin_call('organize')->>'reason')='concurrent', '';
RESET ROLE;
UPDATE public.ai_usage SET status='ok', created_at = now() - interval '1 minute' WHERE user_id=current_setting('test.a')::uuid;
INSERT INTO public.ai_usage(user_id, feature, status)
  SELECT current_setting('test.a')::uuid,'organize','ok' FROM generate_series(1, (SELECT daily_limit_per_user FROM public.ai_settings) - 1);
UPDATE public.ai_usage SET created_at = greatest(date_trunc('day', now()), now() - interval '1 minute') WHERE user_id=current_setting('test.a')::uuid;
SELECT pg_temp.as_user(current_setting('test.a'));
INSERT INTO results SELECT '9. Limite diário por pessoa respeitado', (public.ai_begin_call('organize')->>'reason')='daily', public.ai_begin_call('organize')::text;
RESET ROLE;
UPDATE public.ai_settings SET monthly_global_limit = 0;
DELETE FROM public.ai_usage WHERE user_id=current_setting('test.a')::uuid;
SELECT pg_temp.as_user(current_setting('test.a'));
INSERT INTO results SELECT '9. Teto mensal global respeitado', (public.ai_begin_call('organize')->>'reason')='monthly', '';
RESET ROLE;

-- Administrador: não lê conteúdo pessoal
SELECT pg_temp.as_user(current_setting('test.b'));
INSERT INTO results SELECT '10. Admin não lê o diário dos outros', count(*)=0, count(*)::text FROM public.journal_entries WHERE user_id <> current_setting('test.b')::uuid;
INSERT INTO results SELECT '10. Admin não lê tarefas dos outros', count(*)=0, '' FROM public.tasks WHERE user_id <> current_setting('test.b')::uuid;
DO $$ BEGIN PERFORM 1 FROM public.app_config; INSERT INTO results VALUES ('11. Configuração protegida invisível', false, 'leu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('11. Configuração protegida invisível', true, SQLERRM); END $$;
RESET ROLE;

-- Não autenticado
SET LOCAL ROLE anon;
DO $$ BEGIN PERFORM 1 FROM public.journal_entries; INSERT INTO results VALUES ('12. Anônimo não lê dados privados', false, 'leu');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('12. Anônimo não lê dados privados', true, SQLERRM); END $$;
DO $$ BEGIN PERFORM public.ai_begin_call('organize'); INSERT INTO results VALUES ('12. Anônimo não chama a IA', false, 'chamou');
EXCEPTION WHEN others THEN INSERT INTO results VALUES ('12. Anônimo não chama a IA', true, SQLERRM); END $$;
RESET ROLE;

SELECT CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END || ' | ' || name || CASE WHEN ok THEN '' ELSE ' | ' || info END FROM results ORDER BY name;
ROLLBACK;
