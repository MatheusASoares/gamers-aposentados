"use client";

import { Loader2, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemedEmblemIcon } from "./ThemedEmblemIcon";

interface RandomizerRollOverlayProps {
    isRolling: boolean;
    equippedTheme: string;
    cycleText: string;
}

export function RandomizerRollOverlay({
    isRolling,
    equippedTheme,
    cycleText,
}: RandomizerRollOverlayProps) {
    if (!isRolling) return null;

    return (
        <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-2xl">
            {/* Ambient Particle & Sound Wave Backdrops */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/80 to-black" />

                {/* Theme Specific Ambient Motion Background */}
                {equippedTheme === "theme-medieval" ? (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_70%)] animate-pulse" />
                ) : equippedTheme === "theme-space" ? (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25)_0%,transparent_70%)] animate-pulse" />
                ) : equippedTheme === "theme-pixel" ? (
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_6px] opacity-60" />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(189,13,242,0.25)_0%,transparent_70%)] animate-pulse" />
                )}
            </div>

            <div className="relative z-10 flex max-w-2xl flex-col items-center justify-center gap-6 sm:gap-8 text-center w-full px-2">
                {/* THEMED EMBLEM CONTAINER */}
                <div className="relative flex h-40 w-40 sm:h-52 sm:w-52 items-center justify-center perspective-[1000px]">
                    {equippedTheme === "theme-medieval" ? (
                        /* MEDIEVAL FLAMING RUNE EMBLEM */
                        <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-3xl border-4 border-amber-500 bg-gradient-to-br from-amber-950 via-stone-900 to-black p-4 shadow-[0_0_90px_rgba(245,158,11,0.9),inset_0_0_35px_rgba(245,158,11,0.5)] animate-bounce">
                            <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-amber-400/50 animate-spin" />
                            <ThemedEmblemIcon theme="theme-medieval" />
                            <Flame className="absolute -bottom-3 -left-3 h-10 w-10 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
                        </div>
                    ) : equippedTheme === "theme-space" ? (
                        /* SPACE QUANTUM GYROSCOPE EMBLEM */
                        <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-full border-4 border-sky-400 bg-gradient-to-br from-slate-950 via-sky-950 to-black p-4 shadow-[0_0_90px_rgba(56,189,248,0.9),inset_0_0_35px_rgba(56,189,248,0.5)] animate-pulse">
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-300/70 animate-spin" />
                            <div className="absolute inset-2 rounded-full border border-dashed border-amber-400/60 animate-spin" />
                            <ThemedEmblemIcon theme="theme-space" />
                        </div>
                    ) : equippedTheme === "theme-pixel" ? (
                        /* PIXEL ART 16-BIT RETRO EMBLEM */
                        <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-2xl border-4 border-amber-400 bg-indigo-950 p-4 shadow-[0_0_90px_rgba(34,197,94,0.9),inset_0_0_0_3px_#06b6d4] animate-bounce">
                            <ThemedEmblemIcon theme="theme-pixel" />
                        </div>
                    ) : (
                        /* CYBERPUNK NEON HOLO EMBLEM */
                        <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-3xl border-4 border-[#bd0df2] border-l-4 border-l-[#06b6d4] bg-gradient-to-br from-purple-950 via-zinc-950 to-black p-4 shadow-[0_0_90px_rgba(189,13,242,0.9),0_0_40px_rgba(6,182,212,0.6)] animate-pulse">
                            <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/50 animate-spin" />
                            <ThemedEmblemIcon theme="cyberpunk" />
                        </div>
                    )}
                </div>

                {/* STATUS BANNER & SLOT-MACHINE CYCLING TEXT */}
                <div className="flex w-full flex-col items-center gap-4">
                    <span
                        className={cn(
                            "text-xs font-black tracking-widest uppercase px-2",
                            equippedTheme === "theme-medieval"
                                ? "font-serif text-amber-400"
                                : equippedTheme === "theme-space"
                                ? "font-mono text-sky-400"
                                : equippedTheme === "theme-pixel"
                                ? "font-mono text-emerald-400"
                                : "font-mono text-[#bd0df2]",
                        )}
                    >
                        {equippedTheme === "theme-medieval"
                            ? "⚔️ O Oráculo das Runas está invocando o Destino..."
                            : equippedTheme === "theme-space"
                            ? "🛰️ Calculando Trajetória Quântica Estelar..."
                            : equippedTheme === "theme-pixel"
                            ? "🕹️ 16-BIT RETRO ROULETTE SPINNING..."
                            : "👾 NETRUNNER PROTOCOL: EXECUTING HOLO-ROULETTE..."}
                    </span>

                    <div className="glass-card border border-theme bg-theme-card relative w-full overflow-hidden rounded-2xl px-4 py-4 sm:px-8 sm:py-6 shadow-2xl backdrop-blur-xl">
                        <span
                            className={cn(
                                "block truncate text-xl sm:text-3xl font-black tracking-wide drop-shadow-lg md:text-4xl lg:text-5xl",
                                equippedTheme === "theme-medieval"
                                    ? "font-serif text-amber-300"
                                    : equippedTheme === "theme-space"
                                    ? "font-mono text-sky-300 uppercase"
                                    : equippedTheme === "theme-pixel"
                                    ? "font-mono text-emerald-400 uppercase"
                                    : "text-cyan-300 uppercase",
                            )}
                        >
                            {cycleText || "SORTEANDO NOME..."}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-widest uppercase">
                        <Loader2 className="text-theme-primary h-4 w-4 animate-spin" />
                        <span>Aguarde o veredito do RNG...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
