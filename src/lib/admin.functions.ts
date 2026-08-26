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
    return { ok: true };
  });
