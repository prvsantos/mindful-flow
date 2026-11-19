import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PERSONAL_TABLES = ["tasks", "brain_dumps", "journal_entries", "categories", "ai_usage", "user_consents", "user_roles"] as const;

/** Exclusão da própria conta: apaga todos os registros e a conta. Irreversível. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirm: z.literal("EXCLUIR") }).parse(d))
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase.rpc("my_effective_role", {});
    if (role === "owner") throw new Error("A conta do administrador não pode ser excluída por aqui.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const table of PERSONAL_TABLES) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", context.userId);
      if (error) throw new Error("Não consegui excluir seus dados agora.");
    }
    const email = (context.claims as { email?: string })?.email ?? null;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Não consegui excluir sua conta agora.");

    const { data: masked } = await supabaseAdmin.rpc("mask_email", { _email: email ?? "" });
    await supabaseAdmin.from("admin_audit_logs").insert({
      action: "self_deleted",
      actor_id: context.userId,
      actor_email: (masked as string) || null,
      target_user_id: context.userId,
      target_email: (masked as string) || null,
      details: { deleted_at: new Date().toISOString() },
    });
    return { ok: true };
  });
