import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_AI_PATTERNS, PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

export function useAIPatternsConsent() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["consent", CONSENT_AI_PATTERNS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_consents")
        .select("granted, created_at, notice_version")
        .eq("purpose", CONSENT_AI_PATTERNS)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const set = useMutation({
    mutationFn: async (granted: boolean) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("user_consents").insert({
        user_id: u.user!.id,
        purpose: CONSENT_AI_PATTERNS,
        granted,
        notice_version: PRIVACY_NOTICE_VERSION,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consent", CONSENT_AI_PATTERNS] }),
  });
  return { granted: query.data?.granted === true, record: query.data, isLoading: query.isLoading, set };
}
