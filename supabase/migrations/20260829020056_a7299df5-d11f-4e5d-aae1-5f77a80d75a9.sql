CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid,
  actor_email text,
  target_user_id uuid,
  target_email text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));

CREATE OR REPLACE FUNCTION public.sync_my_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  mail text;
  current_role_value app_role;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT email INTO mail FROM auth.users WHERE id = uid;

  IF lower(coalesce(mail, '')) = 'paulorobertovs2@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
    DELETE FROM public.user_roles WHERE user_id = uid AND role <> 'owner';
    RETURN 'owner';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = uid AND role = 'owner';

  SELECT role INTO current_role_value
  FROM public.user_roles
  WHERE user_id = uid
  ORDER BY CASE role WHEN 'premium' THEN 1 ELSE 2 END
  LIMIT 1;

  IF current_role_value IS NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'lite')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN 'lite';
  END IF;

  RETURN current_role_value;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_my_role() FROM public;
GRANT EXECUTE ON FUNCTION public.sync_my_role() TO authenticated;