import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
    title: "Gamers Aposentados",
    description: "A comunidade de gamers aposentados",
};

import { Providers } from "@/components/providers";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="pt-BR" className="dark" suppressHydrationWarning>
            <body className="bg-background text-foreground font-sans antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
