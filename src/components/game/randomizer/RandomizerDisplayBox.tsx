"use client";

import Image from "next/image";
import { Loader2, Trophy, History, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { WinnerState, LockStatus } from "./types";

interface RandomizerDisplayBoxProps {
    winner: WinnerState;
    isRolling: boolean;
    cycleText: string;
    poolIsComplete: boolean;
    hasUnsavedChanges: boolean;
    lockStatus: LockStatus;
    isSaving: boolean;
    poolId: string | null;
    isLeader: boolean;
    totalGames: number;
    requiredTotal: number;
    onClearBoard: () => void;
    onRoll: (forceEmergency: boolean) => void;
    onTestRoll: () => void;
}

export function RandomizerDisplayBox({
    winner,
    isRolling,
    cycleText,
    poolIsComplete,
    hasUnsavedChanges,
    lockStatus,
    isSaving,
    poolId,
    isLeader,
    totalGames,
    requiredTotal,
    onClearBoard,
    onRoll,
    onTestRoll,
}: RandomizerDisplayBoxProps) {
    return (
        <div>
            <div className="glass-card border border-theme bg-theme-card group relative flex min-h-125 flex-col items-center justify-center overflow-hidden rounded-3xl p-8 shadow-2xl backdrop-blur-md lg:p-12">
                {/* Glow effect */}
                <div className="absolute -top-24 -right-24 size-64 rounded-full bg-theme-primary/20 blur-[100px]"></div>

                <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
                    {/* Display Box */}
                    <div className="flex w-full flex-col items-center gap-4">
                        <div className="relative flex min-h-100 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-theme/40 bg-black/50 px-4 py-8 shadow-[0_0_40px_var(--theme-glow)] backdrop-blur-sm">
                            <div className="absolute inset-0 bg-gradient-to-t from-theme-primary/10 to-transparent opacity-50"></div>

                            {winner && winner.imageUrl && (
                                <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
                                    <Image
                                        src={winner.imageUrl}
                                        alt="Winner background"
                                        fill
                                        sizes="100vw"
                                        unoptimized
                                        className="scale-125 object-cover blur-3xl"
                                    />
                                </div>
                            )}

                            <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
                                {isRolling ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 className="h-12 w-12 animate-spin text-theme-primary" />
                                        <div className="min-h-20">
                                            <span className="text-shadow-glow animate-pulse text-4xl font-black tracking-tighter text-white uppercase md:text-5xl">
                                                {cycleText || "ROLLING..."}
                                            </span>
                                        </div>
                                    </div>
                                ) : winner ? (
                                    <div className="animate-in zoom-in spin-in-2 flex flex-col items-center gap-6 duration-700">
                                        <div className="relative aspect-3/4 w-48 overflow-hidden rounded-2xl border-2 border-[#bd0df2]/50 shadow-[0_0_40px_rgba(189,13,242,0.6)]">
                                            <div className="absolute inset-0 bg-[#bd0df2]/20 blur-xl"></div>
                                            {winner.imageUrl ? (
                                                <Image
                                                    src={winner.imageUrl}
                                                    alt={winner.title}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                    unoptimized
                                                    className="relative z-10 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                                                    <span className="font-bold text-[#bd0df2]/50 uppercase">
                                                        No Image
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-shadow-glow text-4xl leading-tight font-black tracking-tighter text-white uppercase md:text-5xl">
                                            {winner.title}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="animate-pulse text-4xl leading-tight font-black tracking-tighter text-[#bd0df2] uppercase opacity-50 md:text-5xl lg:text-5xl">
                                        {poolIsComplete && !hasUnsavedChanges
                                            ? "READY TO SPIN"
                                            : hasUnsavedChanges
                                              ? "SAVE FIRST"
                                              : "ADD GAMES FIRST"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Roll Button */}
                    {lockStatus.locked ? (
                        <div className="mx-auto w-full max-w-sm rounded-2xl border-[1.5px] border-red-500/30 bg-red-500/10 px-8 py-5 text-center">
                            <p className="text-base leading-relaxed font-black tracking-widest text-red-400 uppercase drop-shadow-[0_0_5px_rgba(248,113,113,0.5)] md:text-lg">
                                ❌ SORTEIO BLOQUEADO
                            </p>
                            <p className="mt-2 text-sm font-medium text-red-300/90">
                                {lockStatus.message}
                            </p>
                        </div>
                    ) : winner ? (
                        <button
                            onClick={onClearBoard}
                            className="mx-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-zinc-800 px-8 py-4 text-white transition-all hover:scale-105 hover:bg-zinc-700 active:scale-95"
                        >
                            <History className="h-6 w-6" />
                            <span className="text-xl font-bold tracking-tighter uppercase">
                                Limpar Quadro
                            </span>
                        </button>
                    ) : (
                        <div className="mx-auto flex flex-col items-center justify-center gap-4 w-full max-w-xl">
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                <button
                                    onClick={() => onRoll(false)}
                                    disabled={
                                        !poolIsComplete ||
                                        hasUnsavedChanges ||
                                        isRolling ||
                                        isSaving ||
                                        !poolId
                                    }
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-3 rounded-2xl border px-8 py-4 transition-all duration-300 w-full",
                                        poolIsComplete &&
                                            !hasUnsavedChanges &&
                                            !isRolling &&
                                            !isSaving &&
                                            poolId
                                            ? "border-theme-primary/50 bg-theme-primary/20 text-theme-primary shadow-[0_10px_40px_var(--theme-glow)] hover:scale-[1.03] hover:bg-theme-primary/30 active:scale-[0.97]"
                                            : "cursor-not-allowed border-white/5 bg-zinc-900 text-zinc-600",
                                    )}
                                >
                                    <Trophy
                                        className={cn(
                                            "h-8 w-8",
                                            isRolling && "animate-spin",
                                        )}
                                    />
                                    <span className="text-xl font-black tracking-tighter whitespace-nowrap uppercase lg:text-2xl">
                                        {isRolling ? "Rolling..." : "Roll the Dice"}
                                    </span>
                                </button>
                                <button
                                    onClick={onTestRoll}
                                    disabled={isRolling}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-theme-primary/30 bg-theme-primary/10 px-6 py-4 text-xs font-black tracking-widest text-theme-primary uppercase transition-all duration-300 hover:border-theme-primary/60 hover:bg-theme-primary/20 hover:scale-[1.03] active:scale-95 w-full sm:w-auto"
                                >
                                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                                    <span>Testar 🎲</span>
                                </button>
                            </div>

                            {/* Emergency Roll Button for Leader */}
                            {isLeader && totalGames > 0 && !poolIsComplete && (
                                <button
                                    onClick={() => onRoll(true)}
                                    disabled={isRolling || isSaving || !poolId}
                                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-amber-500/50 bg-amber-500/15 py-3.5 px-6 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:bg-amber-500/25 hover:border-amber-400 hover:scale-[1.02] active:scale-95 transition-all"
                                    title="Sortear antecipadamente com as indicações presentes"
                                >
                                    <Flame className="h-5 w-5 text-amber-400 animate-pulse" />
                                    <span>⚡ Forçar Sorteio de Emergência ({totalGames}/{requiredTotal})</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
