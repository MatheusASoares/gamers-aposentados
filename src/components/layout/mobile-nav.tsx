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
        setOpen(false);
    }, [pathname]);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2 -ml-2"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>

            {open && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in-0 flex">
                    <div className="w-[85%] max-w-xs h-full bg-card border-r border-border relative animate-in slide-in-from-left-full duration-300">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 z-10"
                            onClick={() => setOpen(false)}
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close Menu</span>
                        </Button>

                        <Sidebar className="w-full h-full border-none static flex pt-12" />
                    </div>
                    <div className="flex-1" onClick={() => setOpen(false)} />
                </div>
            )}
        </>
    )
}
