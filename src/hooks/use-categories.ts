import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/categories";

const FALLBACK: Omit<Category, "id" | "created_at">[] = [
  { slug: "pessoal", label: "Pessoal", color: "violet", icon: "heart" },
  { slug: "trabalho", label: "Trabalho", color: "blue", icon: "briefcase" },
  { slug: "outros", label: "Outros", color: "amber", icon: "folder" },
];

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data as Category[];

      // Conta nova: cria as categorias padrão uma única vez.
      const rows = FALLBACK.map((c) => ({ ...c, user_id: u.user!.id }));
      const { data: created } = await supabase.from("categories").insert(rows).select("*");
      return (created ?? []) as Category[];
    },
    staleTime: 60 * 1000,
  });
}
