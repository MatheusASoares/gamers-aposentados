"use client";

import Image from "next/image";
import Link from "next/link";
import { Shield, Sparkles, Swords, Compass, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuildGameProgress {
    id: string;
    title: string;
    cover_url: string | null;
    artwork_url: string | null;
    quest_type: "MAIN_QUEST" | "SIDE_QUEST";
    hltb_time: number | null;
    playersProgress: Array<{
        name: string;
        progress_percentage: number;
        status: string;
    }>;
}

interface GuildStatusCardProps {
    mainGame: GuildGameProgress | null;
    sideGame: GuildGameProgress | null;
}

export function GuildStatusCard({ mainGame, sideGame }: GuildStatusCardProps) {
    if (!mainGame && !sideGame) return null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-theme/40 bg-zinc-950/80 p-5 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.6)]">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#bd0df2]/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                    <Shield className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <div>
                        <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                            Guilda dos Fundadores
                        </h3>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            Matheus & Lucas • Quests Oficiais em Andamento
                        </p>
                    </div>
                </div>

                <Link
                    href="/quests"
                    className="flex items-center gap-1 text-xs font-bold text-[#bd0df2] hover:text-purple-300 uppercase tracking-wider transition-colors"
                >
                    Potes Oficiais
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Grid 2x1 com as Quests da Guilda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainGame && (
                    <div className="flex gap-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 backdrop-blur-sm">
                        <div className="relative h-20 w-15 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
                            <Image
                                src={mainGame.cover_url || "/placeholder-game.jpg"}
                                alt={mainGame.title}
                                fill
                                className="object-cover"
                                sizes="60px"
                            />
                        </div>
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                                    <Swords className="h-3 w-3" />
                                    Main Quest Oficial
                                </div>
                                <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                                    {mainGame.title}
                                </h4>
                            </div>

                            <div className="flex flex-col gap-1 mt-2">
                                {mainGame.playersProgress.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-zinc-400 truncate max-w-[80px]">{p.name}:</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 sm:w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-amber-400 h-full rounded-full transition-all"
                                                    style={{ width: `${p.progress_percentage}%` }}
                                                />
                                            </div>
                                            <span className="font-mono font-bold text-zinc-300 text-[10px]">
                                                {p.progress_percentage}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {sideGame && (
                    <div className="flex gap-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 backdrop-blur-sm">
                        <div className="relative h-20 w-15 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
                            <Image
                                src={sideGame.cover_url || "/placeholder-game.jpg"}
                                alt={sideGame.title}
                                fill
                                className="object-cover"
                                sizes="60px"
                            />
                        </div>
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                                    <Compass className="h-3 w-3" />
                                    Side Quest Oficial
                                </div>
                                <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                                    {sideGame.title}
                                </h4>
                            </div>

                            <div className="flex flex-col gap-1 mt-2">
                                {sideGame.playersProgress.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-zinc-400 truncate max-w-[80px]">{p.name}:</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 sm:w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-400 h-full rounded-full transition-all"
                                                    style={{ width: `${p.progress_percentage}%` }}
                                                />
                                            </div>
                                            <span className="font-mono font-bold text-zinc-300 text-[10px]">
                                                {p.progress_percentage}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
