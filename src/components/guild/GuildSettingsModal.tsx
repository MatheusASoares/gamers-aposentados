"use client";

import { useState, useEffect } from "react";
import { Settings, Sparkles, Loader2, Link2, Shield, Dices, Layers } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { updateGuildSettings, type ActiveGuildDetailsDTO } from "@/app/lib/guild-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface GuildSettingsModalProps {
    guild: ActiveGuildDetailsDTO;
    isOpen: boolean;
    onClose: () => void;
}

export function GuildSettingsModal({ guild, isOpen, onClose }: GuildSettingsModalProps) {
    const router = useRouter();
    const [name, setName] = useState(guild.name);
    const [inviteCode, setInviteCode] = useState(guild.inviteCode);
    const [isCustomCode, setIsCustomCode] = useState(false);
    const [description, setDescription] = useState(guild.description || "");
    const [questMode, setQuestMode] = useState<"ONLY_MAIN" | "MAIN_AND_SIDE">(
        (guild.questMode as "ONLY_MAIN" | "MAIN_AND_SIDE") || "MAIN_AND_SIDE"
    );
    const [mainNominations, setMainNominations] = useState<number>(guild.mainQuestNominations || 2);
    const [sideNominations, setSideNominations] = useState<number>(guild.sideQuestNominations || 3);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync initial state when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(guild.name);
            setInviteCode(guild.inviteCode);
            setDescription(guild.description || "");
            setQuestMode((guild.questMode as "ONLY_MAIN" | "MAIN_AND_SIDE") || "MAIN_AND_SIDE");
            setMainNominations(guild.mainQuestNominations || 2);
            setSideNominations(guild.sideQuestNominations || 3);
            setIsCustomCode(false);
            setError(null);
        }
    }, [isOpen, guild]);

    // Reactively derive invite code from guild name if not manually customized
    const handleNameChange = (newName: string) => {
        setName(newName);
        if (!isCustomCode) {
            const derivedCode = newName
                .toUpperCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 16);
            if (derivedCode.length >= 3) {
                setInviteCode(derivedCode);
            }
        }
    };

    const handleInviteCodeChange = (newCode: string) => {
        setIsCustomCode(true);
        const clean = newCode
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, "")
            .slice(0, 20);
        setInviteCode(clean);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (name.trim().length < 3) {
            setError("O nome da guilda deve ter pelo menos 3 caracteres.");
            return;
        }

        if (inviteCode.trim().length < 3) {
            setError("O código de convite deve ter pelo menos 3 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await updateGuildSettings(guild.id, {
                name: name.trim(),
                inviteCode: inviteCode.trim(),
                description: description.trim() || undefined,
                questMode,
                mainQuestNominations: mainNominations,
                sideQuestNominations: questMode === "MAIN_AND_SIDE" ? sideNominations : 0,
            });

            if (res.success) {
                onClose();
                router.refresh();
            } else {
                setError(res.error || "Erro ao atualizar dados.");
            }
        } catch {
            setError("Ocorreu um erro ao atualizar a guilda.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg border border-theme bg-theme-card p-6 backdrop-blur-2xl shadow-[0_0_40px_var(--theme-glow)] rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2.5 text-lg font-black uppercase tracking-wider text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-theme-primary/40 bg-theme-primary/15 text-theme-primary">
                            <Settings className="h-4 w-4" />
                        </div>
                        Configurações da Guilda
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-300 font-medium">
                        Altere as informações públicas, código de convite e regras de quests do esquadrão.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {error && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Guild Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-300">
                            Nome da Guilda *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            maxLength={35}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-500 focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all shadow-inner"
                            placeholder="Ex: Guilda dos Fundadores"
                            required
                        />
                    </div>

                    {/* Reactive Invite Code */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                                <Link2 className="h-3.5 w-3.5 text-amber-400" />
                                Código de Convite *
                            </label>
                            <span className="text-xs text-zinc-400 font-mono">
                                Reativo ao nome
                            </span>
                        </div>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => handleInviteCodeChange(e.target.value)}
                            maxLength={20}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-amber-500/40 bg-amber-950/20 px-3.5 py-2.5 font-mono text-sm font-black uppercase tracking-wider text-amber-400 placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
                            placeholder="Ex: FUNDADORES"
                            required
                        />
                        <p className="text-xs text-zinc-400 font-mono pt-0.5">
                            Link de convite: <span className="text-zinc-200 font-bold">/invite/{inviteCode || "CODIGO"}</span>
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-zinc-300">
                            Lema / Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            maxLength={200}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all resize-none"
                            placeholder="Lema ou descrição do esquadrão..."
                        />
                    </div>

                    {/* Seção de Regras de Jogo Customizáveis */}
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
                                    onClick={() => setQuestMode("ONLY_MAIN")}
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
                                        Foco total em 1 jogo (Apenas Main Quest)
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setQuestMode("MAIN_AND_SIDE")}
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
                                        2 jogos em paralelo (Clássico)
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
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-xl border border-theme-primary bg-theme-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_var(--theme-glow)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
