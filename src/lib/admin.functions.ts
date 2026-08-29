import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PortalUser = {
  id: string;
  email: string;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  role: "owner" | "premium" | "lite" | null;
};

async function assertOwner(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "owner",
  });
  if (error || !data) throw new Error("Acesso restrito ao administrador do portal.");
}

export const listPortalUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortalUser[]> => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authError) throw authError;

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesError) throw rolesError;

    const byUser = new Map<string, string>();
    for (const r of roles ?? []) byUser.set(r.user_id, r.role);

    return authData.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(sem e-mail)",
      provider: (u.app_metadata?.provider as string) ?? "email",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      role: (byUser.get(u.id) as PortalUser["role"]) ?? null,
    }));
  });

export const setPortalUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["premium", "lite"]).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((current ?? []).some((r) => r.role === "owner")) {
      throw new Error("O perfil de administrador não pode ser alterado por aqui.");
    }

    const { error: delError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .in("role", ["premium", "lite"]);
    if (delError) throw delError;

    if (data.role) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error) throw error;
    }

    await supabaseAdmin.from("admin_audit_logs").insert({
      action: data.role ? "role_set" : "role_removed",
      actor_id: context.userId,
      actor_email: (context.claims as { email?: string })?.email ?? null,
      target_user_id: data.userId,
      details: { role: data.role },
    });
    return { ok: true };
  });

export const deletePortalUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertOwner(context);
    if (data.userId === context.userId) {
      throw new Error("Você não pode excluir a própria conta de administrador.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((current ?? []).some((r) => r.role === "owner")) {
      throw new Error("A conta do administrador não pode ser excluída.");
    }

    const { data: target } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const targetEmail = target?.user?.email ?? null;

    for (const table of ["tasks", "brain_dumps", "journal_entries", "categories", "user_roles"] as const) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", data.userId);
      if (error) throw error;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (authError) throw authError;

    await supabaseAdmin.from("admin_audit_logs").insert({
      action: "user_deleted",
      actor_id: context.userId,
      actor_email: (context.claims as { email?: string })?.email ?? null,
      target_user_id: data.userId,
      target_email: targetEmail,
      details: { deleted_at: new Date().toISOString() },
    });

    return { ok: true };
  });
