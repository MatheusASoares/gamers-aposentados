"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    History,
    Dices,
    LogOut,
    Map,
    Scroll,
    Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/actions";

import { useSession } from "next-auth/react";
import { AppLogo } from "@/components/layout/app-logo";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const equippedTheme = session?.user?.equipped_theme || "cyberpunk";

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/";
        return pathname.startsWith(path);
    };

    return (
        <div
            className={cn(
                "group relative flex min-h-screen w-64 flex-col border-r border-theme bg-zinc-950/90 pb-12 shadow-2xl transition-all duration-500",
                className,
            )}
        >
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/60" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />

            <div className="relative z-10 space-y-4 py-8">
                {/* DYNAMIC THEMED LOGO */}
                <AppLogo theme={equippedTheme} variant="sidebar" />

                <div className="mt-4 px-4 py-2">
                    <nav className="space-y-3">
                        <Link href="/" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/")
                                        ? "border border-theme-primary bg-theme-primary/15 text-theme-primary theme-glow"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <LayoutDashboard className={cn("h-5 w-5 transition-colors", isActive("/") ? "text-theme-primary drop-shadow-[0_0_8px_var(--theme-glow)]" : "text-cyan-400")} />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/profile" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/profile")
                                        ? "border border-theme-primary bg-theme-primary/15 text-theme-primary theme-glow"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <Trophy className={cn("h-5 w-5 transition-colors", isActive("/profile") ? "text-theme-primary drop-shadow-[0_0_8px_var(--theme-glow)]" : "text-amber-400")} />
                                Hall of Fame
                            </Button>
                        </Link>
                        <Link href="/quests" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/quests")
                                        ? "border border-theme-primary bg-theme-primary/15 text-theme-primary theme-glow"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <Map className={cn("h-5 w-5 transition-colors", isActive("/quests") ? "text-theme-primary drop-shadow-[0_0_8px_var(--theme-glow)]" : "text-emerald-400")} />
                                Quests
                            </Button>
                        </Link>
                        <Link href="/board" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/board")
                                        ? "border border-theme-primary bg-theme-primary/15 text-theme-primary theme-glow"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <Scroll className={cn("h-5 w-5 transition-colors", isActive("/board") ? "text-theme-primary drop-shadow-[0_0_8px_var(--theme-glow)]" : "text-rose-400")} />
                                Board
                            </Button>
                        </Link>
                        <Link href="/reviews" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/reviews")
                                        ? "border border-theme-primary bg-theme-primary/15 text-theme-primary theme-glow"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <History className={cn("h-5 w-5 transition-colors", isActive("/reviews") ? "text-theme-primary drop-shadow-[0_0_8px_var(--theme-glow)]" : "text-indigo-400")} />
                                Reviews
                            </Button>
                        </Link>
                        <Link href="/randomizer" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/randomizer")
                                        ? "border border-theme-primary bg-theme-primary/15 text-theme-primary theme-glow"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <Dices className={cn("h-5 w-5 transition-colors", isActive("/randomizer") ? "text-theme-primary drop-shadow-[0_0_8px_var(--theme-glow)]" : "text-fuchsia-400")} />
                                Randomizer
                            </Button>
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="relative z-10 mt-auto space-y-1 border-t border-theme bg-black/40 px-4 py-6 backdrop-blur-sm">
                <form action={handleSignOut}>
                    <Button
                        variant="ghost"
                        className="h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest text-red-500 uppercase transition-all duration-300 hover:border hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </form>
            </div>
        </div>
    );
}
