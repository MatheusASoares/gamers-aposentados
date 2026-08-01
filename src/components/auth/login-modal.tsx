"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authenticate } from "@/app/lib/actions";
import { useActionState } from "react";
import { Rocket, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react"; // For Google Auth client-side

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToRegister: () => void;
}

export function LoginModal({ open, onOpenChange, onSwitchToRegister }: LoginModalProps) {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-card border-border border-primary/20 overflow-hidden p-0 sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only font-bold">Login to your account</DialogTitle>
                <DialogDescription className="sr-only">
                    Insira suas credenciais para acessar sua conta no Gamers Aposentados.
                </DialogDescription>
                <div className="relative p-8">
                    {/* Background Pattern */}
                    <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-5" />

                    <div className="mb-6 flex flex-col items-center">
                        <div className="bg-primary/10 mb-2 rounded-lg p-2">
                            <Rocket className="text-primary h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Login to Adventure</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Enter your credentials to access your dashboard.
                        </p>
                    </div>

                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground ml-1 text-xs font-medium tracking-wider uppercase">
                                Email
                            </Label>
                            <div className="group relative">
                                <Mail className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    className="bg-background/50 border-input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                    Password
                                </Label>
                                <a
                                    href="#"
                                    className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                                >
                                    Forgot Password?
                                </a>
                            </div>
                            <div className="group relative">
                                <Lock className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                <Input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="bg-background/50 border-input pr-10 pl-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            className="bg-primary hover:bg-primary/90 w-full font-bold"
                            disabled={isPending}
                        >
                            {isPending ? "Logging in..." : "Login to Adventure"}
                            {!isPending && <Rocket className="ml-2 h-4 w-4" />}
                        </Button>

                        <div
                            className="flex h-4 items-end space-x-1"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <p className="w-full text-center text-sm text-red-500">
                                    {errorMessage}
                                </p>
                            )}
                        </div>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="border-border w-full border-t"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card text-muted-foreground px-2 font-medium">
                                Or continue quest with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Button
                            variant="outline"
                            className="relative w-full gap-2"
                            onClick={() => signIn("google")}
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                        {/* <Button variant="outline" className="w-full" disabled>
                            Discord
                        </Button> */}
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            New to the guild?
                            <button
                                onClick={onSwitchToRegister}
                                className="text-primary ml-1 font-semibold hover:underline"
                            >
                                Join us today
                            </button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
