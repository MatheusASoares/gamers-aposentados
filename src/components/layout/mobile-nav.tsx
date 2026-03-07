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
                className="mr-2 -ml-2 md:hidden"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>

            {mounted &&
                open &&
                createPortal(
                    <div className="animate-in fade-in-0 fixed inset-0 z-[100] flex bg-black/80 backdrop-blur-sm">
                        <div className="animate-in slide-in-from-left-full relative h-full w-[85%] max-w-xs border-r border-[#bd0df2]/20 duration-300">
                            {/* Mobile Background mirror of Sidebar */}
                            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
                            <div
                                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                                style={{
                                    backgroundImage:
                                        "url('https://grainy-gradients.vercel.app/noise.svg')",
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
