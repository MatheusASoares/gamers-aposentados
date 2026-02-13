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
    Gamepad2
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
        <div className={cn("pb-12 min-h-screen w-64 bg-card border-r border-border flex flex-col", className)}>
            <div className="space-y-4 py-4">
                <div className="px-6 py-2 flex items-center gap-2">
                    <Gamepad2 className="h-8 w-8 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Gamers<br />Aposentados
                    </h2>
                </div>
                <div className="px-3 py-2">
                    <nav className="space-y-1">
                        <Link href="/dashboard" passHref>
                            <Button
                                variant={isActive("/dashboard") ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-2", isActive("/dashboard") && "bg-primary/10 text-primary hover:bg-primary/20")}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/quests" passHref>
                            <Button
                                variant={isActive("/quests") ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-2", isActive("/quests") && "bg-primary/10 text-primary hover:bg-primary/20")}
                            >
                                <Swords className="h-4 w-4" />
                                Quests
                            </Button>
                        </Link>
                        <Link href="/history" passHref>
                            <Button
                                variant={isActive("/history") ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-2", isActive("/history") && "bg-primary/10 text-primary hover:bg-primary/20")}
                            >
                                <History className="h-4 w-4" />
                                History
                            </Button>
                        </Link>
                        <Link href="/randomizer" passHref>
                            <Button
                                variant={isActive("/randomizer") ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-2", isActive("/randomizer") && "bg-primary/10 text-primary hover:bg-primary/20")}
                            >
                                <Dices className="h-4 w-4" />
                                Randomizer
                            </Button>
                        </Link>
                        <div className="relative">
                            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" disabled>
                                <Store className="h-4 w-4" />
                                Shop
                            </Button>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">SOON</span>
                        </div>
                    </nav>
                </div>
            </div>

            <div className="mt-auto px-3 py-4 space-y-1">
                <Link href="/settings" passHref>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </Link>
                <form action={handleSignOut}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </div>
        </div>
    );
}
