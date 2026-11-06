"use client";

import { useState } from "react";
import { Shield, Sparkles, Link2, Plus, ArrowLeft } from "lucide-react";
import { CreateGuildModal } from "./CreateGuildModal";
import { JoinGuildModal } from "./JoinGuildModal";
import Link from "next/link";

interface GuildEmptyStateProps {
    title?: string;
    description?: string;
    showBackToDashboard?: boolean;
}

export function GuildEmptyState({
    title = "Nenhuma Guilda Selecionada",
    description = "Você ainda não faz parte de nenhuma guilda ou nenhuma está ativa no momento. Crie um novo esquadrão com suas próprias regras ou entre com o código de convite dos seus amigos.",
    showBackToDashboard = true,
}: GuildEmptyStateProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center select-none">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-[#bd0df2]/50 bg-[#bd0df2]/15 text-[#bd0df2] shadow-[0_0_40px_rgba(189,13,242,0.4)] mb-6 animate-pulse">
                <Shield className="h-12 w-12" />
                <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#bd0df2] text-white shadow-lg">
                    <Sparkles className="h-4 w-4" />
                </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-3">
                {title}
            </h1>
            <p className="text-sm text-zinc-400 max-w-lg mb-8 leading-relaxed">
                {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#bd0df2] bg-[#bd0df2] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(189,13,242,0.5)] hover:brightness-110 active:scale-95 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    Criar Nova Guilda
                </button>

                <button
                    type="button"
                    onClick={() => setIsJoinOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 hover:bg-zinc-800 px-6 py-3 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95"
                >
                    <Link2 className="h-4 w-4 text-[#bd0df2]" />
                    Entrar com Código
                </button>
            </div>

            {showBackToDashboard && (
                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Voltar ao Dashboard
                    </Link>
                </div>
            )}

            {/* Modais de Ação */}
            <CreateGuildModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <JoinGuildModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
        </div>
    );
}

