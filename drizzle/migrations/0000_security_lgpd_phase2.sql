-- Configuração protegida (sem acesso pela API pública)
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_config(key, value) VALUES ('admin_user_id', 'ad9ff173-2402-4056-b569-63ebe109f819')
ON CONFLICT (key) DO NOTHING;

-- Máscara de e-mail
CREATE OR REPLACE FUNCTION public.mask_email(_email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN _email IS NULL OR position('@' in _email) = 0 THEN _email
    ELSE left(split_part(_email,'@',1), 2) || '***@' || split_part(_email,'@',2) END
$$;

-- Perfil efetivo real
CREATE OR REPLACE FUNCTION public.my_effective_role(_uid uuid DEFAULT auth.uid())
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _uid
      ORDER BY CASE role WHEN 'owner' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END LIMIT 1),
    'lite'::app_role)
$$;
REVOKE EXECUTE ON FUNCTION public.my_effective_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_effective_role(uuid) TO authenticated, service_role;

-- Administrador por UUID
CREATE OR REPLACE FUNCTION public.sync_my_role()
RETURNS app_role LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  admin_id text;
  current_role_value app_role;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;
  SELECT value INTO admin_id FROM public.app_config WHERE key = 'admin_user_id';

  IF admin_id IS NOT NULL AND uid::text = admin_id THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
    DELETE FROM public.user_roles WHERE user_id = uid AND role <> 'owner';
    RETURN 'owner';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = uid AND role = 'owner';

  SELECT role INTO current_role_value FROM public.user_roles WHERE user_id = uid
  ORDER BY CASE role WHEN 'premium' THEN 1 ELSE 2 END LIMIT 1;

  IF current_role_value IS NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'lite')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN 'lite';
  END IF;
  RETURN current_role_value;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_my_role() TO authenticated;

-- Limites de tarefas + validação de categoria
CREATE OR REPLACE FUNCTION public.enforce_task_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  open_count int;
BEGIN
  IF NEW.area NOT IN ('pessoal','trabalho','outros') AND NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.user_id = NEW.user_id AND c.slug = NEW.area
  ) THEN
    RAISE EXCEPTION 'Categoria inválida para esta conta.' USING ERRCODE = 'check_violation';
  END IF;

  IF public.my_effective_role(NEW.user_id) = 'lite' AND NEW.done = false AND (
    TG_OP = 'INSERT' OR OLD.area IS DISTINCT FROM NEW.area OR OLD.done = true
  ) THEN
    SELECT count(*) INTO open_count FROM public.tasks
    WHERE user_id = NEW.user_id AND area = NEW.area AND done = false AND id <> NEW.id;
    IF open_count >= 3 THEN
      RAISE EXCEPTION 'Limite do plano Lite: 3 tarefas abertas por categoria.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_task_rules ON public.tasks;
CREATE TRIGGER enforce_task_rules BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_task_rules();
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_area_valid;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_area_len CHECK (char_length(area) BETWEEN 1 AND 40);

-- Limite do diário
CREATE OR REPLACE FUNCTION public.enforce_journal_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.my_effective_role(NEW.user_id) = 'lite'
     AND (SELECT count(*) FROM public.journal_entries WHERE user_id = NEW.user_id) >= 4 THEN
    RAISE EXCEPTION 'Limite do plano Lite: 4 registros no diário.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_journal_limit ON public.journal_entries;
CREATE TRIGGER enforce_journal_limit BEFORE INSERT ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.enforce_journal_limit();

-- Limite de categorias próprias
CREATE OR REPLACE FUNCTION public.enforce_category_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.slug NOT IN ('pessoal','trabalho','outros')
     AND public.my_effective_role(NEW.user_id) = 'lite'
     AND (SELECT count(*) FROM public.categories
          WHERE user_id = NEW.user_id AND slug NOT IN ('pessoal','trabalho','outros')) >= 2 THEN
    RAISE EXCEPTION 'Limite do plano Lite: 2 categorias próprias.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_category_limit ON public.categories;
CREATE TRIGGER enforce_category_limit BEFORE INSERT ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.enforce_category_limit();

-- Configuração da IA (linha única)
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  daily_limit_per_user int NOT NULL DEFAULT 20 CHECK (daily_limit_per_user BETWEEN 0 AND 1000),
  monthly_global_limit int NOT NULL DEFAULT 1000 CHECK (monthly_global_limit BETWEEN 0 AND 1000000),
  max_output_tokens int NOT NULL DEFAULT 1200 CHECK (max_output_tokens BETWEEN 100 AND 8000),
  min_interval_seconds int NOT NULL DEFAULT 5 CHECK (min_interval_seconds BETWEEN 0 AND 600),
  alert_threshold_pct int NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),
  retention_days int NOT NULL DEFAULT 180 CHECK (retention_days >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads ai settings" ON public.ai_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "admin updates ai settings" ON public.ai_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
INSERT INTO public.ai_settings(id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Consumo da IA (sem textos)
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  feature text NOT NULL CHECK (feature IN ('organize','sos','patterns')),
  model text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ok','error','blocked')),
  input_tokens int,
  output_tokens int,
  est_cost_usd numeric(12,6),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON public.ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_created_idx ON public.ai_usage(created_at DESC);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin reads usage" ON public.ai_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'));

-- Consentimentos (histórico)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  purpose text NOT NULL CHECK (purpose IN ('ai_journal_patterns')),
  granted boolean NOT NULL,
  notice_version text NOT NULL CHECK (char_length(notice_version) BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_consents_user_idx ON public.user_consents(user_id, purpose, created_at DESC);
GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents read" ON public.user_consents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own consents insert" ON public.user_consents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_consent(_purpose text, _uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT granted FROM public.user_consents
    WHERE user_id = _uid AND purpose = _purpose ORDER BY created_at DESC LIMIT 1), false)
$$;
REVOKE EXECUTE ON FUNCTION public.has_consent(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_consent(text, uuid) TO authenticated, service_role;

-- Início de chamada à IA: valida tudo e reserva a chamada
CREATE OR REPLACE FUNCTION public.ai_begin_call(_feature text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  s public.ai_settings;
  r app_role;
  day_count int;
  month_count int;
  last_at timestamptz;
  new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;
  IF _feature NOT IN ('organize','sos','patterns') THEN RAISE EXCEPTION 'Função inválida.'; END IF;

  r := public.my_effective_role(uid);
  IF r NOT IN ('premium','owner') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'plan');
  END IF;
  IF _feature = 'patterns' AND NOT public.has_consent('ai_journal_patterns', uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'consent');
  END IF;

  SELECT * INTO s FROM public.ai_settings WHERE id = 1;
  IF NOT s.enabled THEN RETURN jsonb_build_object('ok', false, 'reason', 'disabled'); END IF;

  -- serializa chamadas da mesma pessoa
  PERFORM pg_advisory_xact_lock(hashtext(uid::text));

  IF EXISTS (SELECT 1 FROM public.ai_usage WHERE user_id = uid AND status = 'pending'
             AND created_at > now() - interval '90 seconds') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'concurrent');
  END IF;

  SELECT max(created_at) INTO last_at FROM public.ai_usage WHERE user_id = uid;
  IF last_at IS NOT NULL AND last_at > now() - make_interval(secs => s.min_interval_seconds) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'interval');
  END IF;

  SELECT count(*) INTO day_count FROM public.ai_usage
  WHERE user_id = uid AND status <> 'blocked' AND created_at >= date_trunc('day', now());
  IF r <> 'owner' AND day_count >= s.daily_limit_per_user THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'daily');
  END IF;

  SELECT count(*) INTO month_count FROM public.ai_usage
  WHERE status <> 'blocked' AND created_at >= date_trunc('month', now());
  IF month_count >= s.monthly_global_limit THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'monthly');
  END IF;

  INSERT INTO public.ai_usage(user_id, feature) VALUES (uid, _feature) RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok', true, 'id', new_id, 'max_output_tokens', s.max_output_tokens);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ai_begin_call(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_begin_call(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ai_finish_call(_id uuid, _status text, _model text, _in int, _out int, _cost numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _status NOT IN ('ok','error') THEN RAISE EXCEPTION 'Status inválido.'; END IF;
  UPDATE public.ai_usage SET status = _status, model = left(_model, 80),
    input_tokens = _in, output_tokens = _out, est_cost_usd = _cost, finished_at = now()
  WHERE id = _id AND user_id = auth.uid() AND status = 'pending';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ai_finish_call(uuid, text, text, int, int, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_finish_call(uuid, text, text, int, int, numeric) TO authenticated;

-- Resumo para o administrador (sem conteúdo)
CREATE OR REPLACE FUNCTION public.ai_usage_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.ai_settings; res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Acesso restrito.'; END IF;
  SELECT * INTO s FROM public.ai_settings WHERE id = 1;
  SELECT jsonb_build_object(
    'settings', to_jsonb(s),
    'today', (SELECT count(*) FROM public.ai_usage WHERE status <> 'blocked' AND created_at >= date_trunc('day', now())),
    'month', (SELECT count(*) FROM public.ai_usage WHERE status <> 'blocked' AND created_at >= date_trunc('month', now())),
    'month_errors', (SELECT count(*) FROM public.ai_usage WHERE status = 'error' AND created_at >= date_trunc('month', now())),
    'month_tokens_in', (SELECT COALESCE(sum(input_tokens),0) FROM public.ai_usage WHERE created_at >= date_trunc('month', now())),
    'month_tokens_out', (SELECT COALESCE(sum(output_tokens),0) FROM public.ai_usage WHERE created_at >= date_trunc('month', now())),
    'month_cost_usd', (SELECT COALESCE(sum(est_cost_usd),0) FROM public.ai_usage WHERE created_at >= date_trunc('month', now())),
    'by_user', COALESCE((SELECT jsonb_agg(x ORDER BY x->>'calls' DESC) FROM (
      SELECT jsonb_build_object('email', public.mask_email(u.email), 'calls', count(*)) AS x
      FROM public.ai_usage a LEFT JOIN auth.users u ON u.id = a.user_id
      WHERE a.status <> 'blocked' AND a.created_at >= date_trunc('month', now())
      GROUP BY u.email) t), '[]'::jsonb)
  ) INTO res;
  RETURN res;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.ai_usage_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage_summary() TO authenticated;

-- Retenção dos despejos mentais
CREATE OR REPLACE FUNCTION public.apply_brain_dump_retention()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE days int;
BEGIN
  SELECT retention_days INTO days FROM public.ai_settings WHERE id = 1;
  IF days IS NOT NULL AND days > 0 THEN
    DELETE FROM public.brain_dumps
    WHERE user_id = NEW.user_id AND created_at < now() - make_interval(days => days);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS apply_brain_dump_retention ON public.brain_dumps;
CREATE TRIGGER apply_brain_dump_retention AFTER INSERT ON public.brain_dumps
FOR EACH ROW EXECUTE FUNCTION public.apply_brain_dump_retention();