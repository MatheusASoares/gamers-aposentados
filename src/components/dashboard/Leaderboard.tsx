"use client";

import { Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface PlayerStats {
    id: string;
    name: string;
    email: string;
    image: string | null;
    goldMedals: number;   // Main Quests completadas
    silverMedals: number; // Side Quests completadas
}

interface LeaderboardProps {
    players: PlayerStats[];
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

export function Leaderboard({ players }: LeaderboardProps) {
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

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-zinc-950/40 px-5 py-4 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 text-[17px] font-black tracking-widest text-white uppercase drop-shadow-sm">
                    <Trophy className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    Fila do INSS
                </h3>
                <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 backdrop-blur-md">
                    <GoldMedalIcon className="h-3.5 w-3.5" />
                    <span className="text-xs font-black tracking-wider text-zinc-400 uppercase">
                        Placar Geral
                    </span>
                </div>
            </div>

            {/* Content: Side-by-side Duelo */}
            <div className="relative z-10 grid grid-cols-2 divide-x divide-white/5 bg-zinc-950/60 p-5 backdrop-blur-md flex-1 items-center">
                {players.map((player, idx) => {
                    return (
                        <div key={idx} className="flex flex-col items-center px-4 py-4 text-center w-full">
                            {/* Avatar */}
                            <div className="group relative mb-3">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-[#bd0df2] opacity-50 blur-md transition-all duration-500 group-hover:scale-110 group-hover:opacity-75" />
                                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-zinc-900 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105">
                                    {player.image ? (
                                        <Image
                                            src={player.image}
                                            alt={player.name}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-black text-zinc-400 uppercase">
                                            {player.name[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <h4 className="mb-4 text-[17px] font-black tracking-tight text-white uppercase">
                                {player.name}
                            </h4>

                            {/* Medals grid */}
                            <div className="w-full space-y-3">
                                {/* Main Quests (Gold) */}
                                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 transition-all hover:bg-amber-500/20 hover:scale-[1.02] duration-300">
                                    <div className="flex items-center gap-2.5">
                                        <GoldMedalIcon className="h-5 w-5" />
                                        <span className="text-xs font-bold tracking-wider text-amber-400/90 uppercase">
                                            Main quests
                                        </span>
                                    </div>
                                    <Link
                                        href={`/reviews?user=${player.id}&type=MAIN_QUEST`}
                                        className="text-xl font-black text-white hover:text-amber-400 hover:underline transition-colors duration-200"
                                        title={`Ver reviews de Main Quests do ${player.name}`}
                                    >
                                        {player.goldMedals}
                                    </Link>
                                </div>

                                {/* Side Quests (Purple/Magenta) */}
                                <div className="flex items-center justify-between rounded-xl border border-[#bd0df2]/30 bg-[#bd0df2]/10 px-4 py-3.5 transition-all hover:bg-[#bd0df2]/20 hover:scale-[1.02] duration-300">
                                    <div className="flex items-center gap-2.5">
                                        <SilverMedalIcon className="h-5 w-5" />
                                        <span className="text-xs font-bold tracking-wider text-[#bd0df2] uppercase">
                                            Side quests
                                        </span>
                                    </div>
                                    <Link
                                        href={`/reviews?user=${player.id}&type=SIDE_QUEST`}
                                        className="text-xl font-black text-white hover:text-[#bd0df2] hover:underline transition-colors duration-200"
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

            {/* Footer Humorous Subtext */}
            <div className="relative z-10 border-t border-white/5 bg-zinc-950/40 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-xs font-black tracking-widest text-zinc-600 uppercase">
                    O primeiro a conseguir a aposentadoria integral ganha.
                </p>
            </div>
        </div>
    );
}
