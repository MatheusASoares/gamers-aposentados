"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings } from "lucide-react";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";
import { handleSignOut } from "@/lib/actions";
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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium leading-none">{user.name || "Gamer"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Pro Player</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                            {user.image ? (
                                <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10" onClick={() => handleSignOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
