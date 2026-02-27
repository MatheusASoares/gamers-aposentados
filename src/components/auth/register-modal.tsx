"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { register } from "@/app/lib/actions";
import { useActionState } from "react";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, CheckCircle, Zap } from "lucide-react";

interface RegisterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSwitchToLogin: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
    const [errorMessage, formAction, isPending] = useActionState(register, undefined);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-card border-border border-primary/20 overflow-hidden p-0 sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">Create an account</DialogTitle>
                <div className="p-8">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="bg-primary/10 mb-2 rounded-full p-2">
                            <Zap className="text-primary h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Join the Guild</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Create your account and start your journey.
                        </p>
                    </div>

                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Warrior Name
                            </Label>
                            <div className="group relative">
                                <User className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                <Input
                                    name="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    className="bg-background/50 border-input pl-10"
                                    required
                                    minLength={3}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Guild Email
                            </Label>
                            <div className="group relative">
                                <Mail className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="bg-background/50 border-input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                Secret Code
                            </Label>
                            <div className="group relative">
                                <Lock className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-background/50 border-input pl-10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <Button
                            className="bg-primary hover:bg-primary/90 w-full py-6 font-bold"
                            disabled={isPending}
                        >
                            {isPending ? "Creating Account..." : "Start My Adventure"}
                            {!isPending && <Zap className="ml-2 h-4 w-4" />}
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
                                Or join with
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
                    </div>

                    <div className="pt-6 text-center">
                        <p className="text-muted-foreground text-sm">
                            Already a member?
                            <button
                                onClick={onSwitchToLogin}
                                className="text-primary ml-1 font-bold hover:underline"
                            >
                                Log in to your base
                            </button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
