<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Plan limits and AI access are enforced in the database (triggers + `ai_begin_call`/`ai_finish_call`); UI checks are cosmetic only, because client calls can bypass them.
- AI calls go through `runGuardedAI` in `src/lib/ai.server.ts` via `@lovable.dev/ai-gateway`; never log prompts or responses, because they contain sensitive health data.
- Admin identity comes from `app_config.admin_user_id`, never from an email in code, because the repository is public.
- Security tests live in `tests/security/` and run against the real API with throwaway sessions (`SEC_USER_SESSION`, `SEC_ADMIN_SESSION`).
