import { auth } from "@/auth";
import { Breadcrumbs } from "./breadcrumbs";
import { AuthButtons } from "./auth-buttons";
import { AppLogo } from "./app-logo";
import Link from "next/link";
import { Scroll, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function Header() {
    const session = await auth();
    const user = session?.user;
    const equippedTheme = session?.user?.equipped_theme || "cyberpunk";

    return (
        <header className="sticky top-0 z-[60] flex h-16 w-full items-center justify-between border-b border-theme bg-theme-card px-3 sm:px-4 md:px-6 backdrop-blur-md transition-colors duration-400 select-none">
            {/* Desktop Left: Breadcrumbs (100% inalterado) */}
            <div className="hidden items-center gap-2 md:flex">
                <Breadcrumbs />
            </div>

            {/* Mobile Left: Compact Logo da Guilda */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 md:hidden">
                <AppLogo theme={equippedTheme} variant="compact" />
            </div>

            {/* Right Controls */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-6">
                {/* Mobile Quick Action Shortcuts: Mural & Quests */}
                <div className="flex items-center gap-1.5 md:hidden">
                    <Link href="/board" passHref>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-2.5 rounded-lg border border-white/5 bg-zinc-900/60 hover:bg-theme-primary/20 hover:text-theme-primary text-zinc-300 text-xs font-bold gap-1.5 transition-all active:scale-95"
                            title="Quadro de Avisos / Mural de Contratos"
                        >
                            <Scroll className="h-4 w-4 text-rose-400" />
                            <span className="hidden sm:inline">Mural</span>
                        </Button>
                    </Link>

                    <Link href="/quests" passHref>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-2.5 rounded-lg border border-white/5 bg-zinc-900/60 hover:bg-theme-primary/20 hover:text-theme-primary text-zinc-300 text-xs font-bold gap-1.5 transition-all active:scale-95"
                            title="Histórico de Quests & Backlog"
                        >
                            <Map className="h-4 w-4 text-emerald-400" />
                            <span className="hidden sm:inline">Quests</span>
                        </Button>
                    </Link>
                </div>

                {/* User Profile / Auth Actions */}
                <AuthButtons user={user} />
            </div>
        </header>
    );
}

