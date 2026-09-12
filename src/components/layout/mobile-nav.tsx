"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(false);
    }, [pathname]);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-8.5 w-8.5 sm:h-9 sm:w-9 p-0 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-theme-primary/20 hover:border-theme-primary/40 hover:text-white text-zinc-300 transition-all active:scale-95 shrink-0 md:hidden shadow-sm"
                onClick={() => setOpen(true)}
                title="Abrir Menu Completo de Navegação"
            >
                <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-theme-primary" />
                <span className="sr-only">Abrir Menu</span>
            </Button>

            {mounted &&
                open &&
                createPortal(
                    <div className="animate-in fade-in-0 fixed inset-0 z-[100] flex bg-black/80 backdrop-blur-sm">
                        <div className="animate-in slide-in-from-left-full relative h-full w-[85%] max-w-xs border-r border-theme-primary/30 duration-300">
                            {/* Mobile Background mirror of Sidebar */}
                            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
                            <div
                                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                                style={{
                                    backgroundImage:
                                        "url('/noise.svg')",
                                }}
                            />

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 z-50 text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close Menu</span>
                            </Button>

                            <div className="relative z-10 h-full w-full">
                                <Sidebar className="static flex h-full w-full border-none bg-transparent pt-4 shadow-none" />
                            </div>
                        </div>
                        <div className="flex-1" onClick={() => setOpen(false)} />
                    </div>,
                    document.body,
                )}
        </>
    );
}
