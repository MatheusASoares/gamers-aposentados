"use client";

import { useState } from "react";
import { Trophy, Swords, Globe, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface PlayerStats {
    id: string;
    name: string;
    email: string;
    image: string | null;
    goldMedals: number;   // Main Quests completadas
    silverMedals: number; // Side Quests completadas
}

export interface MemberLeaderboardStats {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    level: number;
    xp_points: number;
    goldMedals: number;
    silverMedals: number;
    platinumCount: number;
}

interface LeaderboardProps {
    players: PlayerStats[];
    allMembers?: MemberLeaderboardStats[];
}

function GoldMedalIcon({ className = "h-5.5 w-5.5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L9 9L12 2" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 2L15 9L12 2" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="14" r="6" fill="url(#goldGradient)" stroke="#fbbf24" strokeWidth="1.5"/>
            <defs>
                <linearGradient id="goldGradient" x1="12" y1="8" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fbbf24"/>
                    <stop offset="50%" stopColor="#f59e0b"/>
                    <stop offset="100%" stopColor="#d97706"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

function SilverMedalIcon({ className = "h-5.5 w-5.5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L9 9L12 2" stroke="#bd0df2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 2L15 9L12 2" stroke="#bd0df2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="14" r="6" fill="url(#silverGradient)" stroke="#d946ef" strokeWidth="1.5"/>
            <defs>
                <linearGradient id="silverGradient" x1="12" y1="8" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f3f4f6"/>
                    <stop offset="50%" stopColor="#d1d5db"/>
                    <stop offset="100%" stopColor="#9ca3af"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

export function Leaderboard({ players, allMembers = [] }: LeaderboardProps) {
    const [tab, setTab] = useState<"DUEL" | "GLOBAL">("DUEL");

    return (
        <div
            className="glass-card border border-theme bg-theme-card animate-fade-in-up relative flex flex-col overflow-hidden rounded-[1.5rem] shadow-2xl"
            style={{ animationDelay: "500ms" }}
            data-testid="leaderboard"
        >
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#12001a]" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />

            {/* Header com Abas Dual-Paradigm */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 bg-zinc-950/40 px-5 py-4 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 text-[17px] font-black tracking-widest text-white uppercase drop-shadow-sm">
                    <Trophy className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    Fila do INSS
                </h3>

                <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setTab("DUEL")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                            tab === "DUEL"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Swords className="h-3.5 w-3.5" />
                        Duelo Fundadores
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("GLOBAL")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                            tab === "GLOBAL"
                                ? "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/40 shadow-[0_0_10px_rgba(189,13,242,0.2)]"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        Geral
                    </button>
                </div>
            </div>

            {/* Conteúdo Aba 1: Duelo dos Fundadores */}
            {tab === "DUEL" && (
                <div className="relative z-10 grid grid-cols-2 divide-x divide-white/5 bg-zinc-950/60 p-3 sm:p-5 backdrop-blur-md flex-1 items-center">
                    {players.map((player, idx) => {
                        return (
                            <div key={idx} className="flex flex-col items-center px-2 sm:px-4 py-3 sm:py-4 text-center w-full min-w-0">
                                {/* Avatar */}
                                <div className="group relative mb-2 sm:mb-3">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-[#bd0df2] opacity-50 blur-md transition-all duration-500 group-hover:scale-110 group-hover:opacity-75" />
                                    <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105">
                                        {player.image ? (
                                            <Image
                                                src={player.image}
                                                alt={player.name}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg sm:text-xl font-black text-zinc-400 uppercase">
                                                {player.name[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Name */}
                                <h4 className="mb-3 sm:mb-4 text-sm sm:text-[17px] font-black tracking-tight text-white uppercase truncate max-w-full">
                                    {player.name}
                                </h4>

                                {/* Medals grid */}
                                <div className="w-full space-y-2 sm:space-y-3">
                                    {/* Main Quests (Gold) */}
                                    <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2.5 sm:px-4 sm:py-3.5 transition-all hover:bg-amber-500/20 hover:scale-[1.02] duration-300">
                                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                            <GoldMedalIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-amber-400/90 uppercase truncate">
                                                Main
                                            </span>
                                        </div>
                                        <Link
                                            href={`/reviews?user=${player.id}&type=MAIN_QUEST`}
                                            className="text-base sm:text-xl font-black text-white hover:text-amber-400 hover:underline transition-colors duration-200 shrink-0"
                                            title={`Ver reviews de Main Quests do ${player.name}`}
                                        >
                                            {player.goldMedals}
                                        </Link>
                                    </div>

                                    {/* Side Quests (Purple/Magenta) */}
                                    <div className="flex items-center justify-between rounded-xl border border-[#bd0df2]/30 bg-[#bd0df2]/10 px-2.5 py-2.5 sm:px-4 sm:py-3.5 transition-all hover:bg-[#bd0df2]/20 hover:scale-[1.02] duration-300">
                                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                            <SilverMedalIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#bd0df2] uppercase truncate">
                                                Side
                                            </span>
                                        </div>
                                        <Link
                                            href={`/reviews?user=${player.id}&type=SIDE_QUEST`}
                                            className="text-base sm:text-xl font-black text-white hover:text-[#bd0df2] hover:underline transition-colors duration-200 shrink-0"
                                            title={`Ver reviews de Side Quests do ${player.name}`}
                                        >
                                            {player.silverMedals}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Conteúdo Aba 2: Ranking Geral da Comunidade */}
            {tab === "GLOBAL" && (
                <div className="relative z-10 flex flex-col divide-y divide-zinc-800/60 bg-zinc-950/60 backdrop-blur-md flex-1 max-h-[360px] overflow-y-auto">
                    {allMembers.length === 0 ? (
                        <div className="py-12 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
                            Nenhum membro registrado ainda
                        </div>
                    ) : (
                        allMembers.map((member, rankIdx) => (
                            <Link
                                key={member.id}
                                href={`/profile/${member.username || member.id}`}
                                className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-zinc-900/60 transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={cn(
                                        "w-6 text-center font-black text-xs sm:text-sm font-mono",
                                        rankIdx === 0 ? "text-amber-400 font-black text-base" :
                                        rankIdx === 1 ? "text-zinc-300 font-black" :
                                        rankIdx === 2 ? "text-amber-600 font-black" : "text-zinc-600"
                                    )}>
                                        #{rankIdx + 1}
                                    </span>

                                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                                        {member.image ? (
                                            <Image
                                                src={member.image}
                                                alt={member.name}
                                                fill
                                                className="object-cover"
                                                sizes="36px"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center font-bold text-zinc-400 text-xs uppercase">
                                                {member.name[0]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs sm:text-sm font-black text-zinc-200 group-hover:text-theme-primary transition-colors truncate">
                                            {member.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            Nível {member.level} • {member.xp_points} XP
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex items-center gap-0.5 text-xs font-black text-amber-400" title="Main Quests">
                                            <GoldMedalIcon className="h-3.5 w-3.5" />
                                            {member.goldMedals}
                                        </span>
                                        <span className="flex items-center gap-0.5 text-xs font-black text-[#bd0df2]" title="Side Quests">
                                            <SilverMedalIcon className="h-3.5 w-3.5" />
                                            {member.silverMedals}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {/* Footer Humorous Subtext */}
            <div className="relative z-10 border-t border-white/5 bg-zinc-950/40 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-xs font-black tracking-widest text-zinc-600 uppercase">
                    O primeiro a conseguir a aposentadoria integral ganha.
                </p>
            </div>
        </div>
    );
}
