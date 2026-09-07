"use client";

import { useState } from "react";
import { Link2, Sparkles, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { joinGuildByInviteCode } from "@/app/lib/guild-actions";
import { useRouter } from "next/navigation";

interface JoinGuildModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JoinGuildModal({ isOpen, onClose }: JoinGuildModalProps) {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanCode = inviteCode.trim().toUpperCase();
        if (!cleanCode) {
            setError("Por favor, digite o código de convite.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await joinGuildByInviteCode(cleanCode);
            if (res.success) {
                onClose();
                setInviteCode("");
                router.refresh();
            } else {
                setError(res.error || "Código de convite inválido.");
            }
        } catch {
            setError("Ocorreu um erro inesperado ao entrar na guilda.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md border border-theme bg-zinc-950/95 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-white">
                        <Link2 className="h-5 w-5 text-amber-400" />
                        Entrar em uma Guilda
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        Digite ou cole o código de convite fornecido pelo líder da guilda.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {error && (
                        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                            Código de Convite
                        </label>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="Ex: FUNDADORES, CYBER1234..."
                            maxLength={20}
                            disabled={isLoading}
                            className="w-full font-mono text-center tracking-widest uppercase rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-3 text-base font-black text-amber-400 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Entrar na Guilda
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
