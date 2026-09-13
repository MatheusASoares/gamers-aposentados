// src/components/deals/SteamSaleCountdownCard.tsx

"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
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
import { getSteamSaleStatus, getTimeRemaining, SteamSaleEvent } from "@/lib/constants/steam-sales";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

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
    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );

    // Timer to update live countdown seconds
    useEffect(() => {
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
        <div className="glass-card border-theme bg-theme-card relative flex flex-col overflow-hidden rounded-[1.25rem] border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 sm:rounded-[1.5rem] sm:p-5">
            {/* Ambient Background Glow matching the Sale Accent */}
            <div
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20 blur-[100px] transition-colors duration-1000"
                style={{ backgroundColor: activeTarget.accentColor }}
            />
            <div className="bg-theme-primary/10 pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-[100px]" />

            {/* Main Header & Sale Radar */}
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Event Info */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {currentSale ? (
                            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/20 px-3 py-0.5 text-xs font-black text-red-300 uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                <Flame className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                                PROMOÇÃO AO VIVO NA STEAM!
                            </span>
                        ) : (
                            <span className="border-theme-primary/40 bg-theme-primary/15 text-theme-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-black uppercase shadow-[0_0_12px_var(--theme-glow)]">
                                <Clock className="h-3.5 w-3.5" />
                                RADAR DE PROMOÇÕES STEAM
                            </span>
                        )}

                        <span
                            className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-extrabold tracking-wider uppercase",
                                activeTarget.badgeClass,
                            )}
                        >
                            {activeTarget.shortName}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-3xl drop-shadow-md select-none sm:text-4xl">
                            {activeTarget.emoji}
                        </span>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-white uppercase drop-shadow-md sm:text-2xl">
                                {activeTarget.name}
                            </h3>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-300 sm:text-sm">
                                <span className="font-normal text-zinc-400">Duração:</span>
                                <span className="font-semibold text-zinc-100">
                                    {formatSalePeriod(activeTarget.startDate, activeTarget.endDate)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Live 4-Pill Countdown Timer */}
                <div className="flex flex-col items-center gap-2.5 lg:items-end">
                    <span className="text-xs font-extrabold tracking-widest text-zinc-400 uppercase">
                        {currentSale
                            ? "Tempo Restante da Promoção"
                            : "Contagem Regressiva para o Início"}
                    </span>

                    {isMounted ? (
                        <div className="grid w-full grid-cols-4 gap-2 sm:w-auto sm:gap-3">
                            {/* Days */}
                            <div className="border-theme/40 bg-theme-card/85 flex min-w-[64px] flex-col items-center justify-center rounded-2xl border px-3 py-2.5 shadow-lg sm:min-w-[74px] sm:px-4">
                                <span className="font-mono text-xl leading-none font-black text-white sm:text-2xl">
                                    {String(timeRemaining.days).padStart(2, "0")}
                                </span>
                                <span className="mt-1 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                                    DIAS
                                </span>
                            </div>

                            {/* Hours */}
                            <div className="border-theme/40 bg-theme-card/85 flex min-w-[64px] flex-col items-center justify-center rounded-2xl border px-3 py-2.5 shadow-lg sm:min-w-[74px] sm:px-4">
                                <span className="font-mono text-xl leading-none font-black text-white sm:text-2xl">
                                    {String(timeRemaining.hours).padStart(2, "0")}
                                </span>
                                <span className="mt-1 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                                    HORAS
                                </span>
                            </div>

                            {/* Minutes */}
                            <div className="border-theme/40 bg-theme-card/85 flex min-w-[64px] flex-col items-center justify-center rounded-2xl border px-3 py-2.5 shadow-lg sm:min-w-[74px] sm:px-4">
                                <span className="font-mono text-xl leading-none font-black text-cyan-400 sm:text-2xl">
                                    {String(timeRemaining.minutes).padStart(2, "0")}
                                </span>
                                <span className="mt-1 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                                    MIN
                                </span>
                            </div>

                            {/* Seconds */}
                            <div className="border-theme-primary/40 bg-theme-card/85 ring-theme-primary/20 flex min-w-[64px] flex-col items-center justify-center rounded-2xl border px-3 py-2.5 shadow-lg ring-1 sm:min-w-[74px] sm:px-4">
                                <span className="text-theme-primary animate-pulse font-mono text-xl leading-none font-black sm:text-2xl">
                                    {String(timeRemaining.seconds).padStart(2, "0")}
                                </span>
                                <span className="text-theme-primary mt-1 text-xs font-bold tracking-wider uppercase">
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
                            className="mt-1 inline-flex items-center gap-1.5 text-xs font-black tracking-wider text-amber-400 uppercase transition-colors hover:text-amber-300"
                        >
                            <span>Ir para a Steam Store</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            </div>

            {/* Collapsible Roadmap Trigger */}
            <div className="border-theme/20 relative z-10 mt-3.5 flex flex-col justify-between gap-2.5 border-t pt-3 sm:flex-row sm:items-center">
                <button
                    type="button"
                    onClick={() => setIsRoadmapOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase transition-colors hover:text-white"
                >
                    <Calendar className="text-theme-primary h-4 w-4" />
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
                <div className="animate-in fade-in-50 relative z-10 mt-4 grid grid-cols-1 gap-3 duration-300 sm:grid-cols-2 lg:grid-cols-4">
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
                                            <span className="bg-theme-primary/20 border-theme-primary/40 text-theme-primary rounded-full border px-2 py-0.5 text-[9px] font-black uppercase">
                                                A Seguir
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="line-clamp-1 text-sm font-black tracking-tight text-white uppercase">
                                        {sale.shortName}
                                    </h4>
                                    <p className="line-clamp-2 text-xs text-zinc-400">
                                        {sale.description}
                                    </p>
                                </div>

                                <div className="mt-3 border-t border-white/5 pt-2 text-[11px] font-extrabold text-zinc-300">
                                    <span>
                                        {formatDateBR(sale.startDate)} -{" "}
                                        {formatDateBR(sale.endDate)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
