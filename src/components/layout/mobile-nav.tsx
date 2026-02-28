"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

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

            {open && (
                <div className="animate-in fade-in-0 fixed inset-0 z-[100] flex bg-black/50 backdrop-blur-sm">
                    <div className="bg-card border-border animate-in slide-in-from-left-full relative h-full w-[85%] max-w-xs border-r duration-300">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => setOpen(false)}
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close Menu</span>
                        </Button>

                        <Sidebar className="static flex h-full w-full border-none pt-12" />
                    </div>
                    <div className="flex-1" onClick={() => setOpen(false)} />
                </div>
            )}
        </>
    );
}
