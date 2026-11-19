REVOKE ALL ON public.tasks, public.brain_dumps, public.journal_entries, public.categories,
  public.user_roles, public.user_consents, public.ai_usage, public.ai_settings,
  public.admin_audit_logs, public.app_config FROM anon;
REVOKE ALL ON public.app_config FROM authenticated;