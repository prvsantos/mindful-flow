import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { useAccess } from "@/hooks/use-access";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme();
  const { canUseDarkMode, label, isLoading } = useAccess();

  // Plano sem tema escuro sempre volta para o modo claro.
  useEffect(() => {
    if (!isLoading && !canUseDarkMode && isDark) toggle();
  }, [isLoading, canUseDarkMode, isDark, toggle]);

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      aria-label={isDark ? "Usar modo claro" : "Usar modo escuro"}
      title={
        canUseDarkMode
          ? isDark
            ? "Modo claro"
            : "Modo escuro"
          : `Modo escuro não disponível no plano ${label}`
      }
      onClick={() => {
        if (!canUseDarkMode) {
          toast("Modo escuro disponível nos plano Premium.");
          return;
        }
        toggle();
      }}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
