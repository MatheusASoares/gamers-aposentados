"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "cyberpunk",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme = "cyberpunk" }: ThemeProviderProps) {
  const { data: session, status } = useSession();

  // Resolve theme with local persistence priority:
  // 1. Existing DOM attribute if set by SSR/inline script
  // 2. localStorage
  // 3. initialTheme passed from server cookies
  // 4. Default fallback: "cyberpunk"
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const domTheme = document.documentElement.getAttribute("data-theme");
      if (domTheme) return domTheme;
      const local = localStorage.getItem("gp_theme");
      if (local) return local;
    }
    return initialTheme;
  });

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("gp_theme", newTheme);
      document.cookie = `gp_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  // Sync if session has a valid equipped_theme when loaded
  useEffect(() => {
    if (status === "authenticated" && session?.user?.equipped_theme) {
      const sessionTheme = session.user.equipped_theme;
      if (sessionTheme && sessionTheme !== theme) {
        const local = typeof window !== "undefined" ? localStorage.getItem("gp_theme") : null;
        if (!local || local === sessionTheme) {
          setTheme(sessionTheme);
        }
      }
    }
  }, [session?.user?.equipped_theme, status]);

  // Keep DOM attribute in sync with state
  useEffect(() => {
    if (typeof document !== "undefined") {
      const currentDomTheme = document.documentElement.getAttribute("data-theme");
      if (currentDomTheme !== theme) {
        document.documentElement.setAttribute("data-theme", theme);
      }
    }
  }, [theme]);

  // Listen for storage events across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "gp_theme" && e.newValue && e.newValue !== theme) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute("data-theme", e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
