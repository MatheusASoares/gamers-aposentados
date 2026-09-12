"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Shield,
    Map,
    Scroll,
    MoreHorizontal,
    Dices,
    Star,
    Trophy,
    Scale,
    X,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PrimaryNavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_ITEMS: PrimaryNavItem[] = [
    {
        label: "Início",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Quests",
        href: "/quests",
        icon: Map,
    },
    {
        label: "Guilda",
        href: "/guild",
        icon: Shield,
    },
    {
        label: "Mural",
        href: "/board",
        icon: Scroll,
    },
];

const MORE_ITEMS = [
    {
        label: "Roleta & Sorteios",
        sublabel: "Sorteador de jogos do esquadrão",
        href: "/randomizer",
        icon: Dices,
        color: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10",
    },
    {
        label: "Reviews & Notas",
        sublabel: "Avaliações e opiniões dos membros",
        href: "/reviews",
        icon: Star,
        color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    },
    {
        label: "Hall da Fama",
        sublabel: "Perfil individual, níveis e troféus",
        href: "/profile",
        icon: Trophy,
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    },
    {
        label: "Promoções & Descontos",
        sublabel: "Ofertas e wishlist sincronizada",
        href: "/deals",
        icon: Scale,
        color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    },
];

export function BottomNav() {
    const pathname = usePathname();
    const [prevPathname, setPrevPathname] = useState(pathname);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Fechar automaticamente a gaveta "Mais" ao navegar de rota
    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setIsMoreOpen(false);
    }

    const isPrimaryActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href));

    return (
        <>
            {/* 1. Sleek Cyberpunk Bottom Sheet Modal for "Mais" Navigation */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-[70] md:hidden select-none">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in transition-opacity"
                        onClick={() => setIsMoreOpen(false)}
                    />

                    {/* Sheet Content */}
                    <div className="fixed inset-x-0 bottom-0 z-[80] rounded-t-[2rem] border-t border-theme-primary/40 bg-theme-card p-5 pb-8 shadow-[0_-10px_40px_var(--theme-glow)] backdrop-blur-2xl animate-fade-in-up">
                        {/* Drag Handle Bar */}
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-700/80" />

                        <div className="flex items-center justify-between pb-3 border-b border-theme/20">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-theme-primary" />
                                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                                    Mais Ferramentas & Módulos
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMoreOpen(false)}
                                className="rounded-xl border border-white/10 bg-zinc-900/80 p-1.5 text-zinc-400 hover:text-white transition-all active:scale-95"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* 2x2 Grid of Secondary Tools */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {MORE_ITEMS.map((item) => {
                                const active = pathname.startsWith(item.href);
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all duration-200 active:scale-95",
                                            active
                                                ? "border-theme-primary bg-theme-primary/20 shadow-[0_0_20px_var(--theme-glow)] text-white font-bold"
                                                : "border-white/10 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-300"
                                        )}
                                    >
                                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", item.color)}>
                                            <Icon className="h-5 w-5 drop-shadow-sm" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-black uppercase tracking-wider text-white truncate">
                                                {item.label}
                                            </span>
                                            <span className="text-[11px] font-medium text-zinc-400 truncate">
                                                {item.sublabel}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Main Mobile Bottom Navigation Bar (5 Items: 4 Core + 1 "Mais") */}
            <nav
                aria-label="Navegação móvel principal"
                className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-theme bg-theme-card/95 backdrop-blur-xl px-2 pt-2 pb-[max(env(safe-area-inset-bottom),10px)] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] md:hidden transition-all duration-300 select-none"
            >
                {PRIMARY_ITEMS.map((item) => {
                    const active = isPrimaryActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all duration-300 min-h-[48px] active:scale-95",
                                active
                                    ? "text-theme-primary font-black"
                                    : "text-zinc-500 hover:text-zinc-300 font-bold"
                            )}
                        >
                            {/* Glow pill for active item */}
                            {active && (
                                <span className="absolute -top-2 h-1 w-8 rounded-full bg-theme-primary shadow-[0_0_12px_var(--theme-glow)] animate-fade-in" />
                            )}

                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-transform duration-200",
                                    active
                                        ? "scale-110 drop-shadow-[0_0_8px_var(--theme-glow)]"
                                        : "opacity-70"
                                )}
                            />

                            <span className="text-[10px] tracking-wider uppercase leading-none whitespace-nowrap truncate max-w-full text-center">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* 5th Tab: "Mais" Button */}
                <button
                    type="button"
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={cn(
                        "relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all duration-300 min-h-[48px] active:scale-95 focus:outline-none",
                        isMoreActive || isMoreOpen
                            ? "text-theme-primary font-black"
                            : "text-zinc-500 hover:text-zinc-300 font-bold"
                    )}
                >
                    {(isMoreActive || isMoreOpen) && (
                        <span className="absolute -top-2 h-1 w-8 rounded-full bg-theme-primary shadow-[0_0_12px_var(--theme-glow)] animate-fade-in" />
                    )}

                    <MoreHorizontal
                        className={cn(
                            "h-5 w-5 transition-transform duration-200",
                            isMoreActive || isMoreOpen
                                ? "scale-110 drop-shadow-[0_0_8px_var(--theme-glow)]"
                                : "opacity-70"
                        )}
                    />

                    <span className="text-[10px] tracking-wider uppercase leading-none whitespace-nowrap truncate max-w-full text-center">
                        Mais
                    </span>
                </button>
            </nav>
        </>
    );
}
