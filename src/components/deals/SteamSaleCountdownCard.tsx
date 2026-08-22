// src/components/deals/SteamSaleCountdownCard.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Flame,
    Clock,
    Calendar,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Sparkles,
    ShieldAlert,
    Gamepad2,
} from "lucide-react";
import {
    getSteamSaleStatus,
    getTimeRemaining,
    SteamSaleEvent,
} from "@/lib/constants/steam-sales";
import { cn } from "@/lib/utils";

function formatDateBR(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatSalePeriod(startIso: string, endIso: string): string {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const startFormatted = start.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
    const endFormatted = end.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
    return `${startFormatted} a ${endFormatted} • 14:00 BRT`;
}

export function SteamSaleCountdownCard() {
    const [now, setNow] = useState<Date>(() => new Date());
    const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Client-only mount protection for hydration consistency
    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const { currentSale, nextSale, upcomingList } = useMemo(() => {
        return getSteamSaleStatus(now);
    }, [now]);

    const activeTarget = currentSale || nextSale;
    const targetDateIso = currentSale ? currentSale.endDate : nextSale ? nextSale.startDate : "";

    const timeRemaining = useMemo(() => {
        if (!targetDateIso) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isCompleted: true };
        }
        return getTimeRemaining(targetDateIso, now);
    }, [targetDateIso, now]);

    if (!activeTarget) return null;

    return (
        <div className="glass-card border border-theme bg-theme-card relative flex flex-col overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all duration-300">
            {/* Ambient Background Glow matching the Sale Accent */}
            <div
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-[100px] transition-colors duration-1000"
                style={{ backgroundColor: activeTarget.accentColor }}
            />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#bd0df2]/10 blur-[100px]" />

            {/* Main Header & Sale Radar */}
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                
                {/* Left: Event Info */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {currentSale ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/20 px-3 py-0.5 text-xs font-black text-red-300 uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
                                <Flame className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                                PROMOÇÃO AO VIVO NA STEAM!
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-primary/40 bg-theme-primary/15 px-3 py-0.5 text-xs font-black text-theme-primary uppercase shadow-[0_0_12px_var(--theme-glow)]">
                                <Clock className="h-3.5 w-3.5" />
                                RADAR DE PROMOÇÕES STEAM
                            </span>
                        )}

                        <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider", activeTarget.badgeClass)}>
                            {activeTarget.shortName}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-3xl sm:text-4xl drop-shadow-md select-none">
                            {activeTarget.emoji}
                        </span>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-md">
                                {activeTarget.name}
                            </h3>
                            <p className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-zinc-400 font-normal">Duração:</span>
                                <span className="font-semibold text-zinc-100">{formatSalePeriod(activeTarget.startDate, activeTarget.endDate)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Live 4-Pill Countdown Timer */}
                <div className="flex flex-col items-center lg:items-end gap-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                        {currentSale ? "Tempo Restante da Promoção" : "Contagem Regressiva para o Início"}
                    </span>

                    {isMounted ? (
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
                            {/* Days */}
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/80 px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[74px] shadow-lg">
                                <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                                    {String(timeRemaining.days).padStart(2, "0")}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                                    DIAS
                                </span>
                            </div>

                            {/* Hours */}
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/80 px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[74px] shadow-lg">
                                <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                                    {String(timeRemaining.hours).padStart(2, "0")}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                                    HORAS
                                </span>
                            </div>

                            {/* Minutes */}
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/80 px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[74px] shadow-lg">
                                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono leading-none">
                                    {String(timeRemaining.minutes).padStart(2, "0")}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                                    MIN
                                </span>
                            </div>

                            {/* Seconds */}
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-theme-primary/40 bg-zinc-950/80 px-3 sm:px-4 py-2.5 min-w-[64px] sm:min-w-[74px] shadow-lg ring-1 ring-theme-primary/20">
                                <span className="text-xl sm:text-2xl font-black text-theme-primary font-mono leading-none animate-pulse">
                                    {String(timeRemaining.seconds).padStart(2, "0")}
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-theme-primary uppercase tracking-wider mt-1">
                                    SEG
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-16 items-center justify-center text-xs font-bold text-zinc-500">
                            Sincronizando relógio estelar...
                        </div>
                    )}

                    {currentSale && (
                        <a
                            href="https://store.steampowered.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider mt-1"
                        >
                            <span>Ir para a Steam Store</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            </div>

            {/* Collapsible Roadmap Trigger */}
            <div className="relative z-10 mt-3.5 pt-3 border-t border-theme/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                    type="button"
                    onClick={() => setIsRoadmapOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                >
                    <Calendar className="h-4 w-4 text-theme-primary" />
                    <span>Calendário Oficial das Grandes Promoções do Ano</span>
                    {isRoadmapOpen ? (
                        <ChevronUp className="h-4 w-4 text-zinc-500" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                    )}
                </button>

                <span className="text-[11px] font-medium text-zinc-500">
                    Horário de abertura padrão: 14:00 BRT (10:00 PST)
                </span>
            </div>

            {/* Expandable Upcoming Sales List */}
            {isRoadmapOpen && (
                <div className="relative z-10 mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in-50 duration-300">
                    {upcomingList.map((sale) => {
                        const isNext = sale.id === nextSale?.id;
                        return (
                            <div
                                key={sale.id}
                                className={cn(
                                    "flex flex-col justify-between rounded-2xl border p-3.5 backdrop-blur-md transition-all duration-300",
                                    isNext
                                        ? "border-theme-primary/60 bg-theme-primary/10 shadow-[0_0_15px_var(--theme-glow)]"
                                        : "border-white/5 bg-zinc-900/40 hover:border-white/15",
                                )}
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl">{sale.emoji}</span>
                                        {isNext && (
                                            <span className="rounded-full bg-theme-primary/20 border border-theme-primary/40 px-2 py-0.5 text-[9px] font-black text-theme-primary uppercase">
                                                A Seguir
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">
                                        {sale.shortName}
                                    </h4>
                                    <p className="text-xs text-zinc-400 line-clamp-2">
                                        {sale.description}
                                    </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-white/5 text-[11px] font-extrabold text-zinc-300">
                                    <span>{formatDateBR(sale.startDate)} - {formatDateBR(sale.endDate)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
