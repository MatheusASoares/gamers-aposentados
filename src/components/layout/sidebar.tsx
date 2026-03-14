"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../../public/logo.jpg";
import {
    LayoutDashboard,
    History,
    Dices,
    LogOut,
    Map,
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
                "group relative flex min-h-screen w-64 flex-col border-r border-white/5 bg-zinc-950/80 pb-12 shadow-2xl transition-all duration-500",
                className,
            )}
        >
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
            />

            <div className="relative z-10 space-y-4 py-8">
                {/* NEW PREMIUM LOGO */}
                <Link
                    href="/"
                    className="relative flex flex-col items-center justify-center px-6 pb-6 transition-all duration-500 hover:scale-105"
                >
                    {/* Premium Ambient Glow */}
                    <div className="absolute -inset-1 z-0 animate-pulse rounded-[2.5rem] bg-[#bd0df2]/20 blur-2xl transition-all duration-500 group-hover:bg-[#bd0df2]/40" />
                    
                    {/* Logo Container with Refined Glass Effect */}
                    <div className="relative z-10 overflow-hidden rounded-[2.5rem] border border-white/5 bg-transparent p-1 shadow-2xl backdrop-blur-xl transition-all duration-500 group-hover:border-[#bd0df2]/40 group-hover:shadow-[0_0_30px_rgba(189,13,242,0.3)]">
                        {/* Inner Decorative Gradient */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#bd0df2]/10 via-transparent to-transparent opacity-30" />
                        
                        <Image
                            src={logo}
                            alt="Gamers Aposentados Logo"
                            width={180}
                            height={180}
                            className="relative z-10 h-auto w-full mix-blend-screen transition-all duration-700 group-hover:brightness-110 group-hover:contrast-125"
                        />
                        
                        {/* Shine Effect Overlay */}
                        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
                    </div>
                </Link>

                <div className="mt-4 px-4 py-2">
                    <nav className="space-y-3">
                        <Link href="/" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/")
                                        ? "border border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.15)] hover:bg-[#bd0df2]/20"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <LayoutDashboard className="h-5 w-5" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/quests" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/quests")
                                        ? "border border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.15)] hover:bg-[#bd0df2]/20"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <Map className="h-5 w-5" />
                                Quests
                            </Button>
                        </Link>
                        <Link href="/reviews" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/reviews")
                                        ? "border border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.15)] hover:bg-[#bd0df2]/20"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <History className="h-5 w-5" />
                                Reviews
                            </Button>
                        </Link>
                        <Link href="/randomizer" passHref>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-12 w-full justify-start gap-4 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300",
                                    isActive("/randomizer")
                                        ? "border border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.15)] hover:bg-[#bd0df2]/20"
                                        : "text-zinc-500 hover:bg-zinc-800/40 hover:pl-6 hover:text-zinc-300",
                                )}
                            >
                                <Dices className="h-5 w-5" />
                                Randomizer
                            </Button>
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="relative z-10 mt-auto space-y-1 border-t border-white/5 bg-zinc-950/40 px-4 py-6 backdrop-blur-sm">
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
