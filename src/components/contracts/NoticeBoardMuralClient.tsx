"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CampaignContract, CampaignContractProgress, Game } from "@prisma/client";
import { Scroll, Lock, CheckCircle2, Swords, Loader2, Compass } from "lucide-react";
import { generateNoticeBoardAction, completeContractAction } from "@/app/lib/notice-board-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter,
} from "@/components/ui/dialog";

function useDragScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!ref.current) return;
        setIsDragging(true);
        setStartX(e.clientX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
    };

    const onMouseLeave = () => {
        setIsDragging(false);
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !ref.current) return;
        e.preventDefault();
        const x = e.clientX - ref.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        ref.current.scrollLeft = scrollLeft - walk;
    };

    return {
        ref,
        props: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
            className: "cursor-grab active:cursor-grabbing select-none",
        },
    };
}

interface ContractWithProgress extends CampaignContract {
    user_progresses: CampaignContractProgress[];
}

interface NoticeBoardMuralClientProps {
    isPlayer: boolean;
    mainGame: Game | null;
    sideGame: Game | null;
    mainContracts: ContractWithProgress[];
    sideContracts: ContractWithProgress[];
}

export function NoticeBoardMuralClient({
    isPlayer,
    mainGame,
    sideGame,
    mainContracts,
    sideContracts,
}: NoticeBoardMuralClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [targetGameId, setTargetGameId] = useState<string | null>(null);

    const mainLaneDrag = useDragScroll();
    const sideLaneDrag = useDragScroll();

    useEffect(() => {
        // Find all active contracts (AVAILABLE) and scroll them into view
        const activeContracts = document.querySelectorAll('[data-active="true"]');
        activeContracts.forEach((el) => {
            el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        });
    }, [mainContracts, sideContracts]);

    const handleGenerateBoard = (gameId: string) => {
        setTargetGameId(gameId);
        setIsConfirmOpen(true);
    };

    const confirmGenerateBoard = () => {
        if (!targetGameId) return;
        setIsConfirmOpen(false);
        startTransition(async () => {
            const res = await generateNoticeBoardAction(targetGameId);
            if (res.success) {
                router.refresh();
            } else {
                const errorMsg = "error" in res ? res.error : "Erro ao gerar contratos.";
                alert(errorMsg);
            }
        });
    };

    const handleCompleteContract = (progressId: string) => {
        startTransition(async () => {
            const res = await completeContractAction(progressId);
            if (res.success) {
                router.refresh();
            } else {
                const errorMsg = "error" in res ? res.error : "Erro ao completar contrato.";
                alert(errorMsg);
            }
        });
    };

    const renderLane = (
        title: string,
        icon: React.ReactNode,
        game: Game | null,
        contracts: ContractWithProgress[],
        badgeText: string,
        drag: ReturnType<typeof useDragScroll>,
    ) => {
        if (!game) {
            return (
                <div className="glass-card flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-white/5 bg-zinc-950/40 p-8 text-center">
                    <div className="mb-3 text-zinc-600">{icon}</div>
                    <h3 className="text-lg font-bold text-zinc-400">Nenhuma Campanha Ativa</h3>
                    <p className="mt-1 max-w-sm text-sm text-zinc-500">
                        Não há nenhum jogo definido como ativo nesta categoria no momento.
                    </p>
                </div>
            );
        }

        const hasContracts = contracts.length > 0;

        // Mobile UX Optimization: find the current single relevant contract to show on small screens
        const activeContract = contracts.find((c) => c.user_progresses[0]?.status === "AVAILABLE");
        const nextContract =
            activeContract || contracts.find((c) => c.user_progresses[0]?.status === "LOCKED");
        const mobileTargetContract =
            nextContract || (contracts.length > 0 ? contracts[contracts.length - 1] : null);

        return (
            <div className="space-y-4">
                {/* Lane Header */}
                <div className="relative flex min-h-[180px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/60 px-6 py-6 sm:min-h-[200px] sm:flex-row sm:items-center">
                    {/* Ambient Dual-Layer Artwork Background */}
                    {(game.artwork_url || game.cover_url) && (
                        <div className="pointer-events-none absolute inset-0 hidden sm:block">
                            {/* Layer 1: Blurred ambient background color */}
                            <div
                                className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-[0.25] mix-blend-luminosity blur-xl filter"
                                style={{
                                    backgroundImage: `url(${game.artwork_url || game.cover_url})`,
                                }}
                            />
                            {/* Layer 2: Crisp right-aligned artwork scaling proportionally without stretch or clipping */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={(game.artwork_url || game.cover_url) ?? undefined}
                                alt=""
                                className="pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-[55%] object-cover object-right opacity-[0.8] select-none"
                                style={{
                                    maskImage: "linear-gradient(to right, transparent, black 35%)",
                                    WebkitMaskImage:
                                        "linear-gradient(to right, transparent, black 35%)",
                                }}
                            />
                            {/* Dark gradient to ensure high text contrast on the left */}
                            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
                        </div>
                    )}

                    <div className="relative z-10 flex items-center gap-5">
                        <div
                            className={cn(
                                "shrink-0 rounded-2xl border border-white/5 bg-zinc-900/90 p-3.5",
                                badgeText === "Main Quest" ? "text-amber-400" : "text-[#bd0df2]",
                            )}
                        >
                            {icon}
                        </div>

                        <div className="space-y-2">
                            <div className="flex flex-col items-start gap-1.5">
                                <span
                                    className={cn(
                                        "rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase",
                                        badgeText === "Main Quest"
                                            ? "border-amber-400/20 bg-amber-400/10 text-amber-400"
                                            : "border-[#bd0df2]/20 bg-[#bd0df2]/10 text-[#bd0df2]",
                                    )}
                                >
                                    {badgeText}
                                </span>
                                <h3 className="text-shadow-glow text-3xl font-black tracking-tighter text-white uppercase sm:text-4xl">
                                    {game.title}
                                </h3>
                            </div>
                            {(game.platform || game.hltb_time) && (
                                <p className="text-xs font-medium text-zinc-400">
                                    {game.platform ? `Plataforma: ${game.platform}` : ""}
                                    {game.platform && game.hltb_time ? " | " : ""}
                                    {game.hltb_time ? `HLTB: ${game.hltb_time}h` : ""}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Admin Action: Generate Board */}
                    {!hasContracts && isPlayer && (
                        <Button
                            disabled={isPending}
                            onClick={() => handleGenerateBoard(game.id)}
                            className="h-9 rounded-xl bg-gradient-to-r from-[#bd0df2] to-[#d946ef] px-4 py-2 text-xs font-black tracking-wider text-white uppercase shadow-[0_0_15px_rgba(189,13,242,0.3)] transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                                <Scroll className="mr-1.5 h-4 w-4" />
                            )}
                            Summon Contracts
                        </Button>
                    )}
                </div>

                {/* Contracts scrollable shelf */}
                {!hasContracts ? (
                    <div className="glass-card flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-white/5 bg-zinc-950/40 p-8 text-center">
                        <Scroll className="mb-2 h-8 w-8 text-zinc-700" />
                        <h4 className="text-sm font-black tracking-widest text-zinc-500 uppercase">
                            Board is Empty
                        </h4>
                        <p className="mt-1 max-w-xs text-xs text-zinc-500">
                            {isPlayer
                                ? "No contracts have been posted for this game yet. Summon the contracts above."
                                : "Awaiting guild commanders to post the contracts for this campaign."}
                        </p>
                    </div>
                ) : (
                    <div
                        ref={drag.ref}
                        onMouseDown={drag.props.onMouseDown}
                        onMouseLeave={drag.props.onMouseLeave}
                        onMouseUp={drag.props.onMouseUp}
                        onMouseMove={drag.props.onMouseMove}
                        className={`custom-scrollbar flex gap-6 overflow-x-auto px-1 pt-1 pb-4 ${drag.props.className}`}
                    >
                        {contracts.map((contract) => {
                            const progress = contract.user_progresses[0];
                            const status = progress?.status || "LOCKED";
                            const progressId = progress?.id || "";

                            // Determine status styles
                            const isLocked = status === "LOCKED";
                            const isCompleted = status === "COMPLETED";
                            const isAvailable = status === "AVAILABLE";
                            const isMobileTarget = contract.id === mobileTargetContract?.id;

                            let cardClasses =
                                "relative flex-shrink-0 min-h-[210px] p-6 rounded-lg border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden ";
                            let cornerColorClass = "";

                            if (isLocked) {
                                cardClasses +=
                                    "bg-zinc-950/40 border-zinc-800/80 text-zinc-700 opacity-60 ";
                                cornerColorClass = "text-zinc-800";
                            } else if (isCompleted) {
                                cardClasses +=
                                    "bg-zinc-950/90 border-green-500/20 text-green-500/60 shadow-[0_0_15px_rgba(34,197,94,0.05)] ";
                                cornerColorClass = "text-green-500/40";
                            } else {
                                cardClasses +=
                                    "bg-zinc-900/95 border-[#bd0df2] text-[#bd0df2] shadow-[0_0_20px_rgba(189,13,242,0.15)] ring-1 ring-[#bd0df2]/20 hover:shadow-[0_0_30px_rgba(189,13,242,0.3)] hover:scale-[1.01] ";
                                cornerColorClass = "text-[#bd0df2]";
                            }

                            if (isMobileTarget) {
                                cardClasses += "flex w-[calc(100vw-3rem)] max-w-sm sm:w-96";
                            } else {
                                cardClasses += "hidden sm:flex sm:w-96";
                            }

                            return (
                                <div
                                    key={contract.id}
                                    className={cardClasses}
                                    data-active={isAvailable ? "true" : "false"}
                                >
                                    {/* Cyberpunk corner brackets */}
                                    <div
                                        className={`absolute top-0 left-0 h-2.5 w-2.5 border-t-2 border-l-2 ${cornerColorClass} ${isAvailable ? "cyber-pulse-glow" : ""}`}
                                    />
                                    <div
                                        className={`absolute top-0 right-0 h-2.5 w-2.5 border-t-2 border-r-2 ${cornerColorClass} ${isAvailable ? "cyber-pulse-glow" : ""}`}
                                    />
                                    <div
                                        className={`absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 ${cornerColorClass} ${isAvailable ? "cyber-pulse-glow" : ""}`}
                                    />
                                    <div
                                        className={`absolute right-0 bottom-0 h-2.5 w-2.5 border-r-2 border-b-2 ${cornerColorClass} ${isAvailable ? "cyber-pulse-glow" : ""}`}
                                    />

                                    {/* Background decorative grid pattern for cyberpunk board look */}
                                    <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] opacity-[0.02]" />

                                    <div className="relative z-10 space-y-3">
                                        {/* Card Header Info */}
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                                                    isCompleted
                                                        ? "border border-green-500/20 bg-green-500/10 text-green-500"
                                                        : isAvailable
                                                          ? "border border-[#bd0df2]/20 bg-[#bd0df2]/10 text-[#bd0df2]"
                                                          : "bg-zinc-900 text-zinc-600"
                                                }`}
                                            >
                                                CONTRACT #{contract.sequence_order}
                                            </span>
                                            <span className="text-xs font-black tracking-wider text-amber-500">
                                                +{contract.progress_percentage}% Total
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h4
                                            className={`text-base font-black tracking-tight ${
                                                isCompleted
                                                    ? "text-zinc-500 line-through"
                                                    : "text-white"
                                            }`}
                                        >
                                            {contract.title}
                                        </h4>

                                        {/* Objectives (Blurred if LOCKED to prevent spoilers) */}
                                        <div
                                            className={`space-y-2.5 transition-all duration-500 ${isLocked ? "pointer-events-none blur-[4.5px] select-none" : ""}`}
                                        >
                                            <div>
                                                <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                                                    Quest Milestone
                                                </p>
                                                <p className="mt-0.5 text-xs leading-relaxed font-medium text-zinc-300">
                                                    {contract.objective}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons & Status Overlay */}
                                    <div className="relative z-10 mt-auto pt-4">
                                        {isLocked && (
                                            <div className="absolute inset-0 -top-24 flex flex-col items-center justify-center bg-transparent text-center">
                                                <Lock className="h-8 w-8 animate-pulse text-zinc-700" />
                                                <p className="mt-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                                                    Contract Locked
                                                </p>
                                                <p className="mt-0.5 text-[9px] text-zinc-600">
                                                    Complete the previous contract to unlock
                                                </p>
                                            </div>
                                        )}

                                        {isCompleted && (
                                            <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold tracking-wider text-green-500/80 uppercase">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Contract Completed!
                                            </div>
                                        )}

                                        {isAvailable && (
                                            <Button
                                                disabled={isPending}
                                                onClick={() => handleCompleteContract(progressId)}
                                                className="h-12 w-full rounded-xl border border-green-500/20 bg-zinc-950 py-3.5 text-sm font-black tracking-widest text-green-500 uppercase shadow-[0_0_15px_rgba(34,197,94,0.05)] transition-all hover:border-green-500/40 hover:bg-green-500/10"
                                            >
                                                {isPending ? (
                                                    <Loader2 className="mr-1.5 h-4.5 w-4.5 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                                )}
                                                Complete Contract
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Inline CSS styling for custom scrollbars and keyframe animations */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(24, 24, 27, 0.3); /* zinc-950/30 */
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a; /* zinc-800 */
                    border-radius: 9999px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #bd0df2; /* purple neon */
                    box-shadow: 0 0 10px rgba(189, 13, 242, 0.5);
                }
                
                @keyframes cyberpunk-pulse {
                    0%, 100% { 
                        opacity: 0.6; 
                        filter: drop-shadow(0 0 2px #bd0df2); 
                    }
                    50% { 
                        opacity: 1; 
                        filter: drop-shadow(0 0 8px #bd0df2); 
                    }
                }
                .cyber-pulse-glow {
                    animation: cyberpunk-pulse 2s infinite ease-in-out;
                }
            `,
                }}
            />

            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-12 px-6 py-8 md:px-8 lg:px-12 lg:py-12">
                {/* Header Area */}
                <div className="flex flex-col justify-between gap-8 border-b border-white/5 pb-8 lg:flex-row lg:items-end">
                    <div>
                        <h1 className="text-shadow-glow mb-2 text-4xl font-black tracking-tight text-white uppercase lg:text-5xl">
                            BOARD
                        </h1>
                        <p className="text-lg font-medium tracking-wide text-zinc-400">
                            Backlog fatigue ends here. Take up your contracts, defeat the bosses,
                            and finish the story.
                        </p>
                    </div>
                </div>

                {/* Main Quest Lane */}
                {renderLane(
                    "Campanha Principal (Main Quest)",
                    <Swords className="h-8 w-8" />,
                    mainGame,
                    mainContracts,
                    "Main Quest",
                    mainLaneDrag,
                )}

                {/* Side Quest Lane */}
                {renderLane(
                    "Campanha Secundária (Side Quest)",
                    <Compass className="h-8 w-8" />,
                    sideGame,
                    sideContracts,
                    "Side Quest",
                    sideLaneDrag,
                )}

                {/* Confirmation Modal */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent className="rounded-2xl border border-white/5 bg-zinc-950 p-6 sm:max-w-md">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-xl font-black tracking-tight text-white uppercase">
                                Summon contracts for this campaign?
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Summon contracts confirmation dialog.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6 flex flex-row justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsConfirmOpen(false)}
                                className="h-12 rounded-xl border border-white/5 bg-zinc-900 px-6 py-3 text-sm font-black tracking-wider text-zinc-400 uppercase hover:bg-zinc-800/80 hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmGenerateBoard}
                                className="h-12 rounded-xl bg-gradient-to-r from-[#bd0df2] to-[#d946ef] px-6 py-3 text-sm font-black tracking-wider text-white uppercase shadow-[0_0_15px_rgba(189,13,242,0.3)] transition-all hover:scale-[1.03] active:scale-95"
                            >
                                Summon
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
