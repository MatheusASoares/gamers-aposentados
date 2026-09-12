"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Trophy, Shield } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";
import { SettingsModal } from "@/components/auth/settings-modal";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";

import { UserProfile } from "@/types/api";
import { UserAvatar } from "@/components/ui/user-avatar";

interface AuthButtonsProps {
    user: UserProfile | null | undefined;
}

export function AuthButtons({ user }: AuthButtonsProps) {
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Use the live session image & frame so it updates instantly after equipping
    const { data: session } = useSession();
    const liveImage = session?.user?.image ?? user?.image;
    const equippedFrame = session?.user?.equipped_frame ?? user?.equipped_frame ?? null;

    const openLogin = () => {
        setRegisterOpen(false);
        setLoginOpen(true);
    };

    const openRegister = () => {
        setLoginOpen(false);
        setRegisterOpen(true);
    };

    if (user) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-80">
                            <div className="hidden text-right sm:block">
                                <p className="text-sm leading-none font-bold text-white">
                                    {user.name || "Gamer"}
                                </p>
                                <p className="mt-1 text-xs font-medium text-zinc-400">
                                    @{user.username || "user"}
                                </p>
                            </div>
                            <UserAvatar
                                src={liveImage}
                                name={user.name || "User"}
                                frameUrl={equippedFrame}
                                size="md"
                            />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 border border-theme bg-theme-card shadow-[0_10px_35px_rgba(0,0,0,0.8)] shadow-[0_0_20px_var(--theme-glow)] backdrop-blur-xl"
                    >
                        <DropdownMenuLabel className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                            Minha Conta
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="cursor-pointer text-zinc-300 focus:bg-theme-primary/15 focus:text-theme-primary transition-colors"
                            asChild
                        >
                            <Link href="/guild">
                                <Shield className="mr-2 h-4 w-4 text-theme-primary" />
                                <span className="font-medium text-theme-primary">Sede da Guilda</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-zinc-300 focus:bg-amber-400/15 focus:text-amber-300 transition-colors"
                            asChild
                        >
                            <Link href="/profile">
                                <Trophy className="mr-2 h-4 w-4 text-amber-400" />
                                <span className="font-medium text-amber-300">Hall of Fame</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-zinc-300 focus:bg-theme-primary/15 focus:text-theme-primary transition-colors"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="mr-2 h-4 w-4 text-theme-primary" />
                            <span className="font-medium">Configurações</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-500 focus:bg-red-500/15 focus:text-red-400 transition-colors"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="font-bold">Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />
            </>
        );
    }

    return (
        <>
            <Button onClick={() => setLoginOpen(true)} className="font-semibold">
                Entrar
            </Button>

            <LoginModal
                open={loginOpen}
                onOpenChange={setLoginOpen}
                onSwitchToRegister={openRegister}
            />

            <RegisterModal
                open={registerOpen}
                onOpenChange={setRegisterOpen}
                onSwitchToLogin={openLogin}
            />
        </>
    );
}
