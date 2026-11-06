"use client";

import { useState } from "react";
import { Shield, Link2, Plus } from "lucide-react";
import { CreateGuildModal } from "@/components/guild/CreateGuildModal";
import { JoinGuildModal } from "@/components/guild/JoinGuildModal";

export function GuildOnboardingBanner() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-theme/40 bg-gradient-to-r from-[#bd0df2]/15 via-zinc-900/90 to-zinc-950/90 p-5 sm:p-6 shadow-[0_0_30px_rgba(189,13,242,0.15)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#bd0df2]/50 bg-[#bd0df2]/20 text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.3)]">
                        <Shield className="h-7 w-7" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#bd0df2] text-[9px] text-white">
                            !
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                                Primeiro Passo
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">
                                Nenhuma Guilda Ativa
                            </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                            Funde seu Esquadrão ou Junte-se a uma Guilda
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                            Para participar dos sorteios do Randomizer, definir regras de quests e acompanhar o progresso em equipe, crie sua própria guilda ou use o código de um amigo.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-theme-primary bg-theme-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_var(--theme-glow)] hover:brightness-110 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Criar Guilda
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsJoinOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-95"
                    >
                        <Link2 className="h-4 w-4 text-[#bd0df2]" />
                        Entrar com Código
                    </button>
                </div>
            </div>

            <CreateGuildModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <JoinGuildModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
        </div>
    );
}

