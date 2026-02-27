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

interface AuthButtonsProps {
    user: any; // Using any for now to avoid dragging in session types, improving later
}

export function AuthButtons({ user }: AuthButtonsProps) {
    const [loginOpen, setLoginOpen] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

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
                                <p className="text-sm leading-none font-medium">
                                    {user.name || "Gamer"}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    @{user.username || "user"}
                                </p>
                            </div>
                            <div className="bg-secondary border-border flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="text-muted-foreground h-5 w-5" />
                                )}
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" asChild>
                            <Link href="/profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setSettingsOpen(true)}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                            onClick={() => handleSignOut()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
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
