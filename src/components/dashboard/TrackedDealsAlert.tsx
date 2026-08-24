// src/components/dashboard/TrackedDealsAlert.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, X, Sparkles } from "lucide-react";
import { TrackedDealItem, TrackedDealsResponse } from "@/types/deals";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_TRACKED_KEY = "ga_tracked_deals";

export function TrackedDealsAlert() {
    const [alertData, setAlertData] = useState<{
        topGame: TrackedDealItem;
        totalAtlCount: number;
    } | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_TRACKED_KEY);
            if (!raw) return;
            const parsed: TrackedDealItem[] = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) return;

            // Check if dismissed in this session
            const isSessionDismissed = sessionStorage.getItem("ga_atl_alert_dismissed");
            if (isSessionDismissed) return;

            // Fetch live status for tracked items
            fetch("/api/deals/tracked", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: parsed }),
            })
                .then((res) => (res.ok ? res.json() : null))
                .then((data: TrackedDealsResponse | null) => {
                    if (data && data.hasAllTimeLow && data.items.length > 0) {
                        const atlItems = data.items.filter((i) => i.isAllTimeLow);
                        if (atlItems.length > 0) {
                            setAlertData({
                                topGame: atlItems[0],
                                totalAtlCount: atlItems.length,
                            });
                        }
                    }
                })
                .catch((err) => console.error("Error checking tracked deals for alert:", err));
        } catch (err) {
            console.error("Failed to load tracked deals for dashboard alert:", err);
        }
    }, []);

    if (!alertData || dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem("ga_atl_alert_dismissed", "true");
        } catch (e) {
            console.error(e);
        }
    };

    const { topGame, totalAtlCount } = alertData;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-zinc-950/90 to-purple-950/40 p-3 sm:p-4 shadow-[0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-500">
            {/* Ambient pulse */}
            <div className="pointer-events-none absolute -left-10 top-0 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl animate-pulse" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-md">
                        <Trophy className="h-5 w-5" />
                    </div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                                <Sparkles className="h-2.5 w-2.5" /> Recorde Histórico
                            </span>
                            {totalAtlCount > 1 && (
                                <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                                    +{totalAtlCount - 1} outros jogos
                                </span>
                            )}
                        </div>

                        <p className="text-xs sm:text-sm font-extrabold text-white">
                            <strong className="text-amber-300">{topGame.title}</strong> atingiu o menor preço de todos os tempos!
                            {topGame.currentPriceBR && topGame.currentPriceBR > 0 && (
                                <span className="text-emerald-400 ml-1 font-black">
                                    (R$ {topGame.currentPriceBR.toFixed(2)})
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                        href="/deals"
                        className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-300 transition-all hover:bg-amber-500 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
                    >
                        <span>Ver no Deals Tracker</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="Fechar aviso"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
