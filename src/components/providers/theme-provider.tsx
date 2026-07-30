"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const theme = session?.user?.equipped_theme || "cyberpunk";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return <>{children}</>;
}
