"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shield, Swords, Compass, ArrowUpRight, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerProgressItem {
    name: string;
    progress_percentage: number;
    status: string;
}

interface GuildGameProgress {
    id: string;
    title: string;
    cover_url: string | null;
    artwork_url: string | null;
    quest_type: "MAIN_QUEST" | "SIDE_QUEST";
    hltb_time: number | null;
    playersProgress: PlayerProgressItem[];
}

interface GuildStatusCardProps {
    mainGame: GuildGameProgress | null;
    sideGame: GuildGameProgress | null;
    guildName?: string;
    guildDescription?: string;
    emblemUrl?: string | null;
    bannerUrl?: string | null;
}

function QuestProgressBlock({
    game,
    type,
}: {
    game: GuildGameProgress;
    type: "MAIN" | "SIDE";
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Sort players: highest progress first, then alphabetical
    const sortedPlayers = [...game.playersProgress].sort((a, b) => {
        if (b.progress_percentage !== a.progress_percentage) {
            return b.progress_percentage - a.progress_percentage;
        }
        return a.name.localeCompare(b.name);
    });

    const totalMembers = sortedPlayers.length;
    const completedCount = sortedPlayers.filter(
        (p) => p.status === "COMPLETED" || p.progress_percentage === 100
    ).length;
    const avgProgress = totalMembers > 0
        ? Math.round(sortedPlayers.reduce((acc, p) => acc + p.progress_percentage, 0) / totalMembers)
        : 0;

    const visiblePlayers = isExpanded ? sortedPlayers : sortedPlayers.slice(0, 3);
    const hasMore = totalMembers > 3;

    const isMain = type === "MAIN";
    const accentColor = isMain ? "text-amber-400" : "text-emerald-400";
    const barGradient = isMain
        ? "from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        : "from-emerald-500 to-teal-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]";

    return (
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-5 backdrop-blur-sm transition-all hover:border-zinc-700">
            <div>
                {/* Game Header */}
                <div className="flex gap-4 items-start">
                    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-md">
                        <Image
                            src={game.cover_url || "/placeholder-game.jpg"}
                            alt={game.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                        />
                    </div>

                    <div className="flex flex-1 flex-col min-w-0">
                        <div className={cn("flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", accentColor)}>
                            {isMain ? <Swords className="h-3.5 w-3.5" /> : <Compass className="h-3.5 w-3.5" />}
                            {isMain ? "Main Quest Oficial" : "Side Quest Oficial"}
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-white truncate mt-1" title={game.title}>
                            {game.title}
                        </h4>

                        {/* Guild Collective Progress Bar */}
                        <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-zinc-300 font-bold">Progresso da Guilda:</span>
                                <span className={cn("font-black", accentColor)}>
                                    {avgProgress}% ({completedCount}/{totalMembers} Zerados)
                                </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800 border border-zinc-700/50">
                                <div
                                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", barGradient)}
                                    style={{ width: `${avgProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Individual Members Mini-Leaderboard */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                        <span>Membros Ativos ({totalMembers})</span>
                        <span>Progresso</span>
                    </div>

                    <div className={cn(
                        "space-y-2 transition-all duration-300",
                        isExpanded && totalMembers > 5 ? "max-h-48 overflow-y-auto pr-1" : ""
                    )}>
                        {visiblePlayers.map((p, idx) => {
                            const isCompleted = p.status === "COMPLETED" || p.progress_percentage === 100;
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl bg-zinc-950/50 px-3 py-2 text-xs transition-colors hover:bg-zinc-950/80"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">
                                            {p.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="font-bold text-zinc-200 truncate max-w-[120px] sm:max-w-[160px]">
                                            {p.name}
                                        </span>
                                        {isCompleted && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <div className="w-16 sm:w-20 bg-zinc-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    isCompleted ? "bg-emerald-400" : isMain ? "bg-amber-400" : "bg-emerald-400"
                                                )}
                                                style={{ width: `${p.progress_percentage}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-zinc-300 text-xs w-8 text-right">
                                            {p.progress_percentage}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Expand / Collapse Button for Large Guilds */}
            {hasMore && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-theme/40 bg-theme-card/80 py-2 text-xs font-bold text-zinc-300 hover:border-theme-primary hover:text-white transition-all w-full"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            Recolher Lista
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4" />
                            Ver todos os {totalMembers} membros
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export function GuildStatusCard({
    mainGame,
    sideGame,
    guildName = "Guilda dos Fundadores",
    guildDescription = "Matheus & Lucas • Quests Oficiais em Andamento",
    emblemUrl,
    bannerUrl,
}: GuildStatusCardProps) {
    if (!mainGame && !sideGame) return null;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-theme bg-theme-card/90 p-5 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_var(--theme-glow)]">
            {/* Optional Banner Ambient Glow */}
            {bannerUrl ? (
                <div className="pointer-events-none absolute inset-0 z-0 opacity-15 overflow-hidden">
                    <Image
                        src={bannerUrl}
                        alt="Guild Banner"
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 80vw"
                        className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
                </div>
            ) : (
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-theme-primary/15 blur-2xl pointer-events-none" />
            )}

            <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
                <div className="flex items-center gap-3.5 sm:gap-4">
                    {emblemUrl ? (
                        <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                            <Image
                                src={emblemUrl}
                                alt="Guild Emblem"
                                fill
                                unoptimized
                                sizes="48px"
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <Shield className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    )}
                    <div>
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                            {guildName}
                        </h3>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            {guildDescription}
                        </p>
                    </div>
                </div>

                <Link
                    href="/guild"
                    className="flex items-center gap-1 text-xs font-bold text-[#bd0df2] hover:text-purple-300 uppercase tracking-wider transition-colors"
                >
                    Sede da Guilda
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Grid 2x1 com as Quests da Guilda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainGame && <QuestProgressBlock game={mainGame} type="MAIN" />}
                {sideGame && <QuestProgressBlock game={sideGame} type="SIDE" />}
            </div>
        </div>
    );
}
