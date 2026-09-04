"use client";

import { useState } from "react";
import { Shield, Sparkles, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { createGuild } from "@/app/lib/guild-actions";
import { useRouter } from "next/navigation";

interface CreateGuildModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateGuildModal({ isOpen, onClose }: CreateGuildModalProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (name.trim().length < 3) {
            setError("O nome da guilda deve ter pelo menos 3 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await createGuild({
                name: name.trim(),
                description: description.trim() || undefined,
            });

            if (res.success) {
                onClose();
                setName("");
                setDescription("");
                router.refresh();
            } else {
                setError(res.error || "Erro ao criar guilda.");
            }
        } catch {
            setError("Ocorreu um erro inesperado. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md border border-theme bg-zinc-950/95 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(189,13,242,0.2)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-white">
                        <Shield className="h-5 w-5 text-[#bd0df2]" />
                        Criar Nova Guilda
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        Crie um esquadrão com seus amigos, realize sorteios dinâmicos e conquistem jogos juntos.
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
                            Nome da Guilda *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Clã dos Aposentados, Squad Cyberpunk..."
                            maxLength={35}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-500 focus:border-[#bd0df2] focus:outline-none focus:ring-1 focus:ring-[#bd0df2] transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                            Lema / Descrição (Opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Jogamos RPGs, indies e focamos em platinas aos fins de semana."
                            rows={3}
                            maxLength={200}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-[#bd0df2] focus:outline-none focus:ring-1 focus:ring-[#bd0df2] transition-all resize-none"
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
                            className="flex items-center gap-1.5 rounded-xl border border-[#bd0df2] bg-[#bd0df2] px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(189,13,242,0.4)] hover:bg-[#bd0df2]/90 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Fundar Guilda
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
