import { useQuery } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_BY_ROLE, type Access, type Role } from "@/lib/access";

const VIEW_AS_KEY = "organizamente:view-as";
const ORDER: Role[] = ["owner", "premium", "lite"];

/** Store global do "modo de teste" do administrador (sincroniza todas as telas). */
const listeners = new Set<() => void>();
let viewAsValue: Role | null = null;
let hydrated = false;

function readStored(): Role | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(VIEW_AS_KEY) as Role | null;
  return stored && ORDER.includes(stored) ? stored : null;
}

function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    viewAsValue = readStored();
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Role | null {
  if (!hydrated) {
    hydrated = true;
    viewAsValue = readStored();
  }
  return viewAsValue;
}

/**
 * Perfil de acesso do usuário logado.
 * O Owner pode simular outros perfis (apenas visual, o banco continua com RLS).
 */
export function useAccess(): Access & { realRole: Role; viewAs: Role | null; setViewAs: (r: Role | null) => void; isLoading: boolean } {
  const viewAs = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const setViewAs = useCallback((r: Role | null) => {
    viewAsValue = r;
    hydrated = true;
    if (r) window.localStorage.setItem(VIEW_AS_KEY, r);
    else window.localStorage.removeItem(VIEW_AS_KEY);
    listeners.forEach((cb) => cb());
  }, []);


  const { data: realRole = "lite", isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<Role> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return "lite";
      // Garante/aplica o perfil salvo no banco (admin fixo por e-mail, Lite por padrão).
      const { data: synced } = await supabase.rpc("sync_my_role");
      if (synced && ORDER.includes(synced as Role)) return synced as Role;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (data ?? []).map((r) => r.role as Role);
      return ORDER.find((r) => roles.includes(r)) ?? "lite";
    },
    staleTime: 60 * 1000,
  });

  const effective = realRole === "owner" && viewAs ? viewAs : realRole;
  return {
    ...ACCESS_BY_ROLE[effective],
    realRole,
    viewAs: realRole === "owner" ? viewAs : null,
    setViewAs,
    isLoading,
  };
}
