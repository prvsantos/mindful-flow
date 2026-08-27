import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Sair"
      title="Sair"
      className="text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive"
      onClick={async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
      }}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
