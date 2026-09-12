"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "@/components/providers/theme-provider";
import { ReactNode } from "react";

export { ThemeProvider, useTheme };

export function Providers({ children, initialTheme }: { children: ReactNode; initialTheme?: string }) {
    return (
        <SessionProvider>
            <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
        </SessionProvider>
    );
}
