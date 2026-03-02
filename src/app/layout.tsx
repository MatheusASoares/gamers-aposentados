import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
    title: "Gamers Aposentados",
    description: "A comunidade de gamers aposentados",
};

import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="pt-BR" className="dark" suppressHydrationWarning>
            <body className="bg-background text-foreground font-sans antialiased">
                <Providers>{children}</Providers>
                <SpeedInsights />
            </body>
        </html>
    );
}
