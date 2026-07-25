"use client";

import { useState } from "react";
import Image from "next/image";
import { Trophy, Award, Sparkles, CheckCircle2 } from "lucide-react";
import { claimPlatinumBonus } from "@/app/lib/gamification-actions";
import { calculateGameXP } from "@/app/lib/xp-engine";

export interface CompletedGameItem {
    progressId: string;
    gameId: string;
    title: string;
    coverUrl: string | null;
    questType: "MAIN_QUEST" | "SIDE_QUEST";
    hltbTime: number | null;
    completedAt: Date | string | null;
    isPlatinum: boolean;
    platinumAt: Date | string | null;
}

interface HallOfFameGalleryProps {
    completedGames: CompletedGameItem[];
    isOwner: boolean;
}

export function HallOfFameGallery({
    completedGames,
    isOwner,
}: HallOfFameGalleryProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleClaimPlatinum = async (progressId: string) => {
        setLoadingId(progressId);
        try {
            const res = await claimPlatinumBonus(progressId);
            if (!res.success) {
                alert(res.error || "Failed to claim platinum bonus.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Hall of Fame Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Trophy className="h-7 w-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase drop-shadow-md">
                        Galeria Hall of Fame ({completedGames.length})
                    </h2>
                </div>
            </div>

            {/* Gallery Grid */}
            {completedGames.length === 0 ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/5 bg-zinc-950/30 py-16">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                        Nenhum jogo zerado no Hall of Fame ainda.
                    </span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {completedGames.map((item) => {
                        const xpEarned = calculateGameXP({
                            hltbHours: item.hltbTime,
                            questType: item.questType,
                            isPlatinum: item.isPlatinum,
                        });

                        return (
                            <div
                                key={item.progressId}
                                className={`glass-card group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
                                    item.isPlatinum
                                        ? "border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-zinc-900/80 to-zinc-950 shadow-[0_0_25px_rgba(251,191,36,0.25)]"
                                        : "border-theme bg-theme-card hover:border-theme-primary/60 hover:shadow-[0_0_25px_var(--theme-glow)]"
                                }`}
                            >
                                {/* Game Cover Header */}
                                <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                                    {item.coverUrl ? (
                                        <Image
                                            src={
                                                item.coverUrl.startsWith("//")
                                                    ? `https:${item.coverUrl}`
                                                    : item.coverUrl.replace(
                                                          "t_cover_big",
                                                          "t_1080p",
                                                      )
                                            }
                                            alt={item.title}
                                            fill
                                            unoptimized
                                            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600">
                                            <Trophy className="h-10 w-10 opacity-30" />
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                                    {/* Quest Type Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase ${
                                                item.questType === "MAIN_QUEST"
                                                    ? "border border-amber-500/50 bg-amber-500/20 text-amber-300"
                                                    : "border border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                                            }`}
                                        >
                                            {item.questType === "MAIN_QUEST"
                                                ? "Main Quest"
                                                : "Side Quest"}
                                        </span>
                                    </div>

                                    {/* XP Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/80 px-3 py-1 text-xs font-black text-emerald-300 shadow-md backdrop-blur-md">
                                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />+
                                            {xpEarned} XP
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-5">
                                    <h3 className="line-clamp-1 text-lg font-black text-white">
                                        {item.title}
                                    </h3>

                                    <div className="mt-2 flex items-center justify-between text-xs font-bold text-zinc-400">
                                        <span>
                                            {item.hltbTime ? `${item.hltbTime}h HLTB` : "N/A"}
                                        </span>
                                        <span>
                                            {item.completedAt
                                                ? new Date(item.completedAt).toLocaleDateString()
                                                : "Completed"}
                                        </span>
                                    </div>

                                    {/* Platinum Status / Claim Button */}
                                    <div className="mt-5 border-t border-white/10 pt-4">
                                        {item.isPlatinum ? (
                                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-xs font-black text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
                                                <Award className="h-4 w-4 shrink-0 text-amber-400" />
                                                <span>🏆 100% PLATINOU! (+50% XP)</span>
                                            </div>
                                        ) : isOwner ? (
                                            <button
                                                onClick={() => handleClaimPlatinum(item.progressId)}
                                                disabled={loadingId === item.progressId}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/15 px-3 py-2.5 text-xs font-black text-amber-300 transition-all hover:border-amber-500 hover:bg-amber-500/30 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50"
                                            >
                                                <Award className="h-4 w-4 shrink-0 text-amber-400" />
                                                <span>
                                                    {loadingId === item.progressId
                                                        ? "Registrando..."
                                                        : "🏆 REGISTRAR PLATINA / 100% (+50% XP)"}
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>Campanha Zerada</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
