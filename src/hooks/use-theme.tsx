import { useCallback, useEffect, useState } from "react";

/**
 * Dark/light theme toggle.
 *
 * The initial theme is applied by an inline script in __root.tsx (before
 * React hydrates) so there is no flash and no hydration mismatch. This hook
 * reads the current state from the DOM on mount and exposes a toggle that
 * updates the `.dark` class + localStorage.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}
