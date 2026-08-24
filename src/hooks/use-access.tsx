import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_BY_ROLE, type Access, type Role } from "@/lib/access";

const VIEW_AS_KEY = "organizamente:view-as";
const ORDER: Role[] = ["owner", "premium", "lite"];

/**
 * Perfil de acesso do usuário logado.
 * O Owner pode simular outros perfis (apenas visual, o banco continua com RLS).
 */
export function useAccess(): Access & { realRole: Role; viewAs: Role | null; setViewAs: (r: Role | null) => void; isLoading: boolean } {
  const [viewAs, setViewAsState] = useState<Role | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_AS_KEY) as Role | null;
    if (stored && ORDER.includes(stored)) setViewAsState(stored);
  }, []);

  const setViewAs = useCallback((r: Role | null) => {
    setViewAsState(r);
    if (r) window.localStorage.setItem(VIEW_AS_KEY, r);
    else window.localStorage.removeItem(VIEW_AS_KEY);
  }, []);

  const { data: realRole = "lite", isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<Role> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return "lite";
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (data ?? []).map((r) => r.role as Role);
      return ORDER.find((r) => roles.includes(r)) ?? "lite";
    },
    staleTime: 5 * 60 * 1000,
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
