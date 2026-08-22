import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Gamers Aposentados",
    description: "A comunidade de gamers aposentados",
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    appleWebApp: {
        title: "Gamers Aposentados",
        capable: true,
        statusBarStyle: "black-translucent",
    },
};

export const viewport: Viewport = {
    themeColor: "#09090b",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
};


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
