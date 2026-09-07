"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { joinGuildByInviteCode } from "@/app/lib/guild-actions";
import { useRouter } from "next/navigation";

interface AcceptInviteButtonProps {
    inviteCode: string;
    isLoggedIn: boolean;
}

export function AcceptInviteButton({ inviteCode, isLoggedIn }: AcceptInviteButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        if (!isLoggedIn) {
            router.push(`/login?callbackUrl=/invite/${inviteCode}`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await joinGuildByInviteCode(inviteCode);
            if (res.success) {
                router.push("/guild");
                router.refresh();
            } else {
                setError(res.error || "Erro ao entrar na guilda.");
            }
        } catch {
            setError("Ocorreu um erro inesperado. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            {error && (
                <div className="w-full rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400 text-center">
                    {error}
                </div>
            )}

            <button
                type="button"
                disabled={isLoading}
                onClick={handleAccept}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#bd0df2] bg-[#bd0df2] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(189,13,242,0.4)] hover:bg-[#bd0df2]/90 active:scale-95 transition-all disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Entrando no Esquadrão...
                    </>
                ) : isLoggedIn ? (
                    <>
                        <Sparkles className="h-4 w-4" />
                        Aceitar Convite & Entrar na Guilda
                    </>
                ) : (
                    <>
                        Fazer Login para Entrar na Guilda
                    </>
                )}
            </button>
        </div>
    );
}
