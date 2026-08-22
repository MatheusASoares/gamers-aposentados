"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Dices,
    Scale,
    Star,
    Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: "Início",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Sorteio",
        href: "/randomizer",
        icon: Dices,
    },
    {
        label: "Deals",
        href: "/deals",
        icon: Scale,
    },
    {
        label: "Reviews",
        href: "/reviews",
        icon: Star,
    },
    {
        label: "Perfil",
        href: "/profile",
        icon: Trophy,
    },
];

export function BottomNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <nav
            aria-label="Navegação móvel principal"
            className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-theme/40 bg-zinc-950/90 backdrop-blur-xl px-2 pt-2 pb-[max(env(safe-area-inset-bottom),10px)] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] md:hidden transition-all duration-300 select-none"
        >
            {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all duration-300 min-h-[48px] active:scale-95",
                            active
                                ? "text-theme-primary font-black"
                                : "text-zinc-500 hover:text-zinc-300 font-bold",
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
                                    : "opacity-70",
                            )}
                        />

                        <span className="text-[10px] tracking-wider uppercase leading-none">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
