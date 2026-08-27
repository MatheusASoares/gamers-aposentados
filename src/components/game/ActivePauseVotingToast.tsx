"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SpecialProposalDTO, voteSpecialGameProposal } from "@/app/lib/special-game-actions";
import { SpecialReleaseBadge } from "./SpecialReleaseBadge";
import { Check, X, Loader2, Sparkles, Swords, Compass } from "lucide-react";

interface ActivePauseVotingToastProps {
    proposals: SpecialProposalDTO[];
    currentUserId?: string;
}

export function ActivePauseVotingToast({
    proposals,
    currentUserId,
}: ActivePauseVotingToastProps) {
    const router = useRouter();
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [dismissedMap, setDismissedMap] = useState<Record<string, boolean>>({});

    // Encontrar apenas propostas onde o usuário atual NÃO é o proponente e AINDA NÃO votou
    const pendingActionableProposals = proposals.filter((p) => {
        if (dismissedMap[p.id]) return false;
        const isProposer = p.proposer_id === currentUserId;
        const hasVoted = p.votes.some((v) => v.user_id === currentUserId);
        return !isProposer && !hasVoted;
    });

    if (pendingActionableProposals.length === 0) {
        return null;
    }

    const proposal = pendingActionableProposals[0];
    const isMain = proposal.quest_type === "MAIN_QUEST";
    const questLabel = isMain ? "Main Quest" : "Side Quest";
    const isLoading = actionLoadingId === proposal.id;

    const handleVote = async (approved: boolean) => {
        setActionLoadingId(proposal.id);
        try {
            const res = await voteSpecialGameProposal(proposal.id, approved);
            if (res.success) {
                setDismissedMap((prev) => ({ ...prev, [proposal.id]: true }));
                router.refresh();
            }
        } catch (err) {
            console.error("Erro ao votar via toast:", err);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <aside
            aria-label="Notificação de Votação de Pausa Ativa"
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100%-2rem)] max-w-sm sm:max-w-md animate-in slide-in-from-bottom-4 duration-500"
        >
            <div className="relative overflow-hidden rounded-2xl border border-theme bg-theme-card p-4 sm:p-5 shadow-[0_0_30px_var(--theme-glow)] backdrop-blur-xl transition-all">
                {/* Accent ambient bar on top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#bd0df2] via-theme-primary to-cyan-400 animate-pulse" />

                {/* Dismiss button */}
                <button
                    onClick={() => setDismissedMap((prev) => ({ ...prev, [proposal.id]: true }))}
                    className="absolute top-3 right-3 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    title="Dispensar notificação"
                    aria-label="Dispensar notificação"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="mb-3 flex items-center gap-2 pr-6">
                    <SpecialReleaseBadge variant="compact" label="Pausa Ativa" />
                    <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-black uppercase ${
                            isMain ? "text-amber-400 bg-amber-400/10" : "text-cyan-400 bg-cyan-400/10"
                        }`}
                    >
                        {isMain ? <Swords className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
                        {questLabel}
                    </span>
                </div>

                {/* Content info */}
                <div className="flex items-center gap-3">
                    {proposal.game_cover_url && (
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-sm">
                            <Image
                                src={proposal.game_cover_url}
                                alt={proposal.game_title}
                                fill
                                sizes="64px"
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-black text-white line-clamp-1">
                            {proposal.game_title}
                        </h4>
                        <p className="text-xs text-zinc-300 line-clamp-2">
                            <strong className="text-[#bd0df2]">
                                {proposal.proposer.name || proposal.proposer.username || "Lucas"}
                            </strong>{" "}
                            propôs iniciar este jogo agora. Aceita o consenso da guilda?
                        </p>
                    </div>
                </div>

                {/* Actions (Thumb-friendly on mobile, dual button row) */}
                <div className="mt-4 flex items-center gap-2">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={isLoading}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#bd0df2]/60 bg-[#bd0df2] px-3.5 py-2 text-xs font-black uppercase text-white shadow-[0_0_15px_rgba(189,13,242,0.4)] transition-all hover:bg-[#bd0df2]/90 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Aceitar e Iniciar
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={isLoading}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-bold uppercase text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95 disabled:opacity-50"
                    >
                        <X className="h-3.5 w-3.5" />
                        Recusar
                    </button>
                </div>
            </div>
        </aside>
    );
}
