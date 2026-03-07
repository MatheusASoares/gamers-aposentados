"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";
import { SettingsModal } from "@/components/auth/settings-modal";
import { handleSignOut } from "@/lib/actions";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";

interface AuthButtonsProps {
    user: any; // Using any for now to avoid dragging in session types, improving later
}

export function AuthButtons({ user }: AuthButtonsProps) {
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Use the live session image so it updates instantly after Settings saves
    const { data: session } = useSession();
    const liveImage = session?.user?.image ?? user?.image;

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
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 shadow-inner">
                                {liveImage ? (
                                    <img
                                        src={liveImage}
                                        alt={user.name || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-5 w-5 text-zinc-500" />
                                )}
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 border-white/10 bg-zinc-950/95 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                    >
                        <DropdownMenuLabel className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                            Minha Conta
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            className="cursor-pointer text-zinc-300 focus:bg-white/5 focus:text-white"
                            asChild
                        >
                            <Link href="/profile">
                                <User className="mr-2 h-4 w-4 text-[#bd0df2]" />
                                <span className="font-medium">Perfil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-zinc-300 focus:bg-white/5 focus:text-white"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="mr-2 h-4 w-4 text-[#bd0df2]" />
                            <span className="font-medium">Configurações</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-400"
                            onClick={() => handleSignOut()}
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
