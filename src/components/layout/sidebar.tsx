"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Swords,
    History,
    Dices,
    Store,
    Settings,
    LogOut,
    Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/actions";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div
            className={cn(
                "bg-card border-border flex min-h-screen w-64 flex-col border-r pb-12",
                className,
            )}
        >
            <div className="space-y-4 py-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-2 transition-opacity hover:opacity-80"
                >
                    <Gamepad2 className="text-primary h-8 w-8" />
                    <h2 className="from-primary bg-gradient-to-r to-purple-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                        Gamers
                        <br />
                        Aposentados
                    </h2>
                </Link>
                <div className="px-3 py-2">
                    <nav className="space-y-1">
                        <Link href="/" passHref>
                            <Button
                                variant={isActive("/") ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2",
                                    isActive("/") &&
                                        "bg-primary/10 text-primary hover:bg-primary/20",
                                )}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        {/* <Link href="/quests" passHref>
                            <Button
                                variant={isActive("/quests") ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-2", isActive("/quests") && "bg-primary/10 text-primary hover:bg-primary/20")}
                            >
                                <Swords className="h-4 w-4" />
                                Quests
                            </Button>
                        </Link> */}
                        <Link href="/reviews" passHref>
                            <Button
                                variant={isActive("/reviews") ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2",
                                    isActive("/reviews") &&
                                        "bg-primary/10 text-primary hover:bg-primary/20",
                                )}
                            >
                                <History className="h-4 w-4" />
                                Reviews
                            </Button>
                        </Link>
                        <Link href="/randomizer" passHref>
                            <Button
                                variant={isActive("/randomizer") ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-2",
                                    isActive("/randomizer") &&
                                        "bg-primary/10 text-primary hover:bg-primary/20",
                                )}
                            >
                                <Dices className="h-4 w-4" />
                                Randomizer
                            </Button>
                        </Link>
                        {/* <div className="relative">
                            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" disabled>
                                <Store className="h-4 w-4" />
                                Shop
                            </Button>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">SOON</span>
                        </div> */}
                    </nav>
                </div>
            </div>

            <div className="mt-auto space-y-1 px-3 py-4">
                {/* <Link href="/settings" passHref>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </Link> */}
                <form action={handleSignOut}>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </div>
        </div>
    );
}
