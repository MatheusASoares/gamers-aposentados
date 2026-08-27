"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SpecialProposalDTO, voteSpecialGameProposal, cancelSpecialGameProposal } from "@/app/lib/special-game-actions";
import { SpecialReleaseBadge } from "./SpecialReleaseBadge";
import { Check, X, Ban, Loader2, Gamepad2, Swords, Compass, Users } from "lucide-react";

interface ActivePauseVotingBannerProps {
    proposals: SpecialProposalDTO[];
    currentUserId?: string;
    currentUserEmail?: string;
}

export function ActivePauseVotingBanner({
    proposals,
    currentUserId,
    currentUserEmail,
}: ActivePauseVotingBannerProps) {
    const router = useRouter();
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ id: string; text: string; type: "success" | "error" } | null>(null);
    const [toastDismissed, setToastDismissed] = useState<Record<string, boolean>>({});

    if (!proposals || proposals.length === 0) {
        return null;
    }

    const handleVote = async (proposalId: string, approved: boolean) => {
        setActionLoadingId(proposalId);
        setStatusMessage(null);
        try {
            const res = await voteSpecialGameProposal(proposalId, approved);
            if (res.success) {
                setStatusMessage({
                    id: proposalId,
                    text: res.message || (approved ? "Voto afirmativo registrado!" : "Proposta recusada."),
                    type: "success",
                });
                router.refresh();
            } else {
                setStatusMessage({
                    id: proposalId,
                    text: res.error || "Erro ao registrar voto.",
                    type: "error",
                });
            }
        } catch (err) {
            console.error("Erro ao votar:", err);
            setStatusMessage({ id: proposalId, text: "Erro de conexão ao votar.", type: "error" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancel = async (proposalId: string) => {
        setActionLoadingId(proposalId);
        setStatusMessage(null);
        try {
            const res = await cancelSpecialGameProposal(proposalId);
            if (res.success) {
                setStatusMessage({
                    id: proposalId,
                    text: res.message || "Proposta cancelada.",
                    type: "success",
                });
                router.refresh();
            } else {
                setStatusMessage({
                    id: proposalId,
                    text: res.error || "Erro ao cancelar proposta.",
                    type: "error",
                });
            }
        } catch (err) {
            console.error("Erro ao cancelar:", err);
            setStatusMessage({ id: proposalId, text: "Erro de conexão ao cancelar.", type: "error" });
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="w-full space-y-4">
            {proposals.map((proposal) => {
                const isProposer = currentUserId === proposal.proposer_id;
                const hasVoted = proposal.votes.some((v) => v.user_id === currentUserId);
                const isTargetPlayer = !isProposer;
                const questLabel = proposal.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest";
                const isMain = proposal.quest_type === "MAIN_QUEST";
                const isLoading = actionLoadingId === proposal.id;
                const msg = statusMessage?.id === proposal.id ? statusMessage : null;
                const isDismissed = toastDismissed[proposal.id];

                return (
                    <div
                        key={proposal.id}
                        className="group relative overflow-hidden rounded-2xl border border-[#bd0df2]/50 bg-gradient-to-r from-zinc-950 via-[#180026] to-zinc-950 p-4 sm:p-5 shadow-[0_0_25px_rgba(189,13,242,0.25)] transition-all duration-300 hover:border-[#bd0df2] hover:shadow-[0_0_35px_rgba(189,13,242,0.4)]"
                    >
                        {/* Ambient glow decoration */}
                        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#bd0df2]/20 blur-3xl" />
                        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

                        {/* Layout: Desktop 1-line flex, Mobile stacked */}
                        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Left: Box Art + Title + Badges */}
                            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                {/* Crisp Box Art */}
                                <div className="relative h-20 w-16 sm:h-24 sm:w-18 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-md">
                                    {proposal.game_cover_url ? (
                                        <Image
                                            src={proposal.game_cover_url}
                                            alt={proposal.game_title}
                                            fill
                                            sizes="96px"
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                            <Gamepad2 className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Texts & Badges */}
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <SpecialReleaseBadge variant="compact" label="Pausa Ativa" />
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                                                isMain
                                                    ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                                                    : "bg-cyan-400/15 text-cyan-400 border border-cyan-400/30"
                                            }`}
                                        >
                                            {isMain ? <Swords className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
                                            {questLabel}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400">
                                            <Users className="h-3.5 w-3.5 text-[#bd0df2]" />
                                            Quórum: 1/2 Votos
                                        </span>
                                    </div>

                                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
                                        {proposal.game_title}
                                    </h3>

                                    <p className="text-xs sm:text-sm font-medium text-zinc-300">
                                        {isProposer ? (
                                            <span>
                                                Você propôs esta Pausa Ativa. Aguardando aceite de{" "}
                                                <strong className="text-white">outro jogador da guilda</strong> para iniciar.
                                            </span>
                                        ) : (
                                            <span>
                                                <strong className="text-[#bd0df2]">
                                                    {proposal.proposer.name || proposal.proposer.username || "Lucas"}
                                                </strong>{" "}
                                                propôs Pausa Ativa para iniciar este jogo. Você aceita?
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Actions / Buttons (Dual Paradigm: Continuous 4x1 row on lg, 2x2 or flex on mobile) */}
                            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pt-2 lg:pt-0">
                                {isTargetPlayer && !hasVoted && (
                                    <>
                                        <button
                                            onClick={() => handleVote(proposal.id, true)}
                                            disabled={isLoading}
                                            className="flex flex-1 lg:flex-none items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/60 bg-[#bd0df2] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[0_0_20px_rgba(189,13,242,0.5)] transition-all hover:scale-105 hover:bg-[#bd0df2]/90 active:scale-95 disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4" />
                                            )}
                                            Aceitar e Iniciar
                                        </button>
                                        <button
                                            onClick={() => handleVote(proposal.id, false)}
                                            disabled={isLoading}
                                            className="flex flex-1 lg:flex-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-300 transition-all hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 active:scale-95 disabled:opacity-50"
                                        >
                                            <X className="h-4 w-4" />
                                            Recusar
                                        </button>
                                    </>
                                )}

                                {isProposer && (
                                    <button
                                        onClick={() => handleCancel(proposal.id)}
                                        disabled={isLoading}
                                        className="flex flex-1 lg:flex-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 active:scale-95 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Ban className="h-4 w-4" />
                                        )}
                                        Cancelar Proposta
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status / Feedback Alert Message */}
                        {msg && (
                            <div
                                className={`mt-3 rounded-lg border px-3 py-2 text-xs font-bold ${
                                    msg.type === "success"
                                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                                        : "border-red-500/40 bg-red-500/10 text-red-400"
                                }`}
                            >
                                {msg.text}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
