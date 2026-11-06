"use client";

import { useState } from "react";
import { Shield, Sparkles, Loader2, Dices, Layers } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { createGuild } from "@/app/lib/guild-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CreateGuildModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateGuildModal({ isOpen, onClose }: CreateGuildModalProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [questMode, setQuestMode] = useState<"ONLY_MAIN" | "MAIN_AND_SIDE">("ONLY_MAIN");
    const [mainNominations, setMainNominations] = useState<number>(4);
    const [sideNominations, setSideNominations] = useState<number>(3);
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
                questMode,
                mainQuestNominations: mainNominations,
                sideQuestNominations: questMode === "MAIN_AND_SIDE" ? sideNominations : 0,
            });

            if (res.success) {
                onClose();
                setName("");
                setDescription("");
                setQuestMode("ONLY_MAIN");
                setMainNominations(4);
                setSideNominations(3);
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
            <DialogContent className="max-w-lg border border-theme bg-theme-card p-6 backdrop-blur-xl shadow-[0_0_40px_var(--theme-glow)] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-white">
                        <Shield className="h-5 w-5 text-theme-primary" />
                        Criar Nova Guilda
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        Defina o nome do seu esquadrão e personalize as regras de sorteio e quests.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {error && (
                        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-300">
                            Nome da Guilda *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Duo dos Aposentados, Squad Cyberpunk..."
                            maxLength={35}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-500 focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-300">
                            Lema / Descrição (Opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Jogamos um jogo por vez, 4 indicações cada um."
                            rows={2}
                            maxLength={200}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all resize-none"
                        />
                    </div>

                    {/* Seção de Regras Customizáveis da Guilda */}
                    <div className="rounded-2xl border border-theme/40 bg-zinc-900/60 p-4 space-y-3.5">
                        <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                            <Dices className="h-4 w-4 text-theme-primary" />
                            <span className="text-xs font-black uppercase tracking-wider text-white">
                                Regras de Quests & Sorteio
                            </span>
                        </div>

                        {/* Modo de Quests */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                Modo de Jogo da Guilda
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuestMode("ONLY_MAIN");
                                        setMainNominations(4);
                                    }}
                                    className={cn(
                                        "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                                        questMode === "ONLY_MAIN"
                                            ? "border-theme-primary bg-theme-primary/15 shadow-[0_0_15px_var(--theme-glow)] text-white"
                                            : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <Layers className="h-3.5 w-3.5 text-amber-400" />
                                        1 Quest por Vez
                                    </div>
                                    <span className="text-[10px] text-zinc-500 mt-1">
                                        Foco total em 1 jogo compartilhado (Apenas Main Quest)
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuestMode("MAIN_AND_SIDE");
                                        setMainNominations(2);
                                        setSideNominations(3);
                                    }}
                                    className={cn(
                                        "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                                        questMode === "MAIN_AND_SIDE"
                                            ? "border-theme-primary bg-theme-primary/15 shadow-[0_0_15px_var(--theme-glow)] text-white"
                                            : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <Sparkles className="h-3.5 w-3.5 text-theme-primary" />
                                        Main + Side Quest
                                    </div>
                                    <span className="text-[10px] text-zinc-500 mt-1">
                                        2 jogos em paralelo (Clássico do app)
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Cotas de Indicações */}
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                                    Indicações por Membro (Main Quest)
                                </label>
                                <span className="text-xs font-black text-amber-400 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                                    {mainNominations} jogos / membro
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={6}
                                step={1}
                                value={mainNominations}
                                onChange={(e) => setMainNominations(Number(e.target.value))}
                                className="w-full accent-amber-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 font-bold px-0.5">
                                <span>1 jogo</span>
                                <span>2 jogos</span>
                                <span>3 jogos</span>
                                <span>4 jogos</span>
                                <span>5 jogos</span>
                                <span>6 jogos</span>
                            </div>
                        </div>

                        {questMode === "MAIN_AND_SIDE" && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                                        Indicações por Membro (Side Quest)
                                    </label>
                                    <span className="text-xs font-black text-[#bd0df2] px-2 py-0.5 rounded-md bg-[#bd0df2]/10 border border-[#bd0df2]/20">
                                        {sideNominations} jogos / membro
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={6}
                                    step={1}
                                    value={sideNominations}
                                    onChange={(e) => setSideNominations(Number(e.target.value))}
                                    className="w-full accent-[#bd0df2] cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-500 font-bold px-0.5">
                                    <span>1 jogo</span>
                                    <span>2 jogos</span>
                                    <span>3 jogos</span>
                                    <span>4 jogos</span>
                                    <span>5 jogos</span>
                                    <span>6 jogos</span>
                                </div>
                            </div>
                        )}
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
                            className="flex items-center gap-1.5 rounded-xl border border-theme-primary bg-theme-primary px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_var(--theme-glow)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
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
