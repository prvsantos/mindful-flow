import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      aria-label={isDark ? "Usar modo claro" : "Usar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      onClick={toggle}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
