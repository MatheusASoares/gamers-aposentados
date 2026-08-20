// src/components/deals/DealsContainer.tsx

"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
    DealComparisonResult,
    FeaturedDealItem,
    SearchGameItem,
    CurrencyRate,
    DealFilterType,
} from "@/types/deals";
import { DealsSearch } from "./DealsSearch";
import { TopDealsCarousel } from "./TopDealsCarousel";
import { DealComparisonCard } from "./DealComparisonCard";
import { ComparisonSkeleton, FeaturedDealsSkeleton } from "./DealsSkeleton";
import { Sparkles, AlertCircle, Zap, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUICK_SUGGESTIONS = [
    { title: "ELDEN RING", steamAppId: 1245620 },
    { title: "Baldur's Gate 3", steamAppId: 1086940 },
    { title: "Cyberpunk 2077", steamAppId: 1091500 },
    { title: "Hades II", steamAppId: 1145350 },
    { title: "Monster Hunter: World", steamAppId: 582010 },
];

export function DealsContainer() {
    const [comparison, setComparison] = useState<DealComparisonResult | null>(null);
    const [featuredDeals, setFeaturedDeals] = useState<FeaturedDealItem[]>([]);
    const [currencyRate, setCurrencyRate] = useState<CurrencyRate | null>(null);
    const [activeFilter, setActiveFilter] = useState<DealFilterType>("best_savings");

    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [justUpdated, setJustUpdated] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Fetch featured deals with filter support and optional cache bypass
    const loadFeaturedDeals = useCallback(
        async (filter: DealFilterType = "best_savings", forceRefresh = false) => {
            if (!forceRefresh) {
                setIsLoadingFeatured(true);
            }
            try {
                const res = await fetch(
                    `/api/deals/featured?filter=${filter}${forceRefresh ? "&refresh=true" : ""}`,
                    forceRefresh ? { cache: "no-store" } : undefined,
                );
                if (res.ok) {
                    const data = await res.json();
                    startTransition(() => {
                        setFeaturedDeals(data.deals || []);
                        if (data.currencyRate) {
                            setCurrencyRate(data.currencyRate);
                        }
                    });
                }
            } catch (err) {
                console.error("Error loading featured deals:", err);
            } finally {
                setIsLoadingFeatured(false);
            }
        },
        [],
    );

    useEffect(() => {
        loadFeaturedDeals(activeFilter);
    }, [loadFeaturedDeals, activeFilter]);

    const handleFilterChange = (newFilter: DealFilterType) => {
        setActiveFilter(newFilter);
    };

    // Manual Refresh button handler (bypasses cache for featured deals and currency rate)
    const handleManualRefresh = async () => {
        if (isRefreshing || cooldown > 0) return;
        setIsRefreshing(true);
        setJustUpdated(false);

        try {
            const refreshPromises: Promise<unknown>[] = [
                loadFeaturedDeals(activeFilter, true),
            ];

            // If there's an active comparison, refresh it simultaneously
            if (comparison) {
                const searchParams = new URLSearchParams();
                searchParams.set("title", comparison.title);
                if (comparison.id) searchParams.set("gameId", comparison.id);
                if (comparison.steamAppId) {
                    searchParams.set("steamAppId", String(comparison.steamAppId));
                }
                searchParams.set("refresh", "true");

                refreshPromises.push(
                    fetch(`/api/deals/compare?${searchParams.toString()}`, {
                        cache: "no-store",
                    })
                        .then((res) => (res.ok ? res.json() : null))
                        .then((data: DealComparisonResult | null) => {
                            if (data) {
                                startTransition(() => {
                                    setComparison(data);
                                    if (data.currencyRate) {
                                        setCurrencyRate(data.currencyRate);
                                    }
                                });
                            }
                        })
                        .catch((err) =>
                            console.error("Error refreshing comparison data:", err),
                        ),
                );
            }

            await Promise.all(refreshPromises);
            setJustUpdated(true);
            setCooldown(8);
            setTimeout(() => setJustUpdated(false), 2500);
        } catch (err) {
            console.error("Manual refresh failed:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle game comparison selection
    const handleCompare = async (params: {
        title: string;
        gameId?: string;
        steamAppId?: number | null;
    }) => {
        setIsSearching(true);
        setErrorMessage(null);

        try {
            const searchParams = new URLSearchParams();
            searchParams.set("title", params.title);
            if (params.gameId) searchParams.set("gameId", params.gameId);
            if (params.steamAppId) {
                searchParams.set("steamAppId", String(params.steamAppId));
            }

            const res = await fetch(`/api/deals/compare?${searchParams.toString()}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.error || "Não foi possível encontrar preços para este jogo.",
                );
            }

            const data: DealComparisonResult = await res.json();
            startTransition(() => {
                setComparison(data);
                if (data.currencyRate) {
                    setCurrencyRate(data.currencyRate);
                }
            });

            // Smooth scroll to comparison card
            const el = document.getElementById("comparison-result-view");
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Erro ao comparar jogo.",
            );
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSearchGame = (game: SearchGameItem) => {
        handleCompare({
            title: game.title,
            gameId: game.id,
            steamAppId: game.steamAppId,
        });
    };

    const handleSelectFeatured = (deal: FeaturedDealItem) => {
        handleCompare({
            title: deal.title,
            gameId: deal.id,
            steamAppId: deal.steamAppId,
        });
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-8 px-6 py-8 md:px-8 lg:px-12">
                {/* Header Area (Padrão do Aplicativo) */}
                <div className="flex flex-col justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-md md:text-5xl">
                            DEALS TRACKER
                        </h2>
                        <p className="max-w-2xl text-lg font-medium text-zinc-400">
                            Comparador de preços Steam Family (US 🇺🇸 vs BR 🇧🇷).
                        </p>
                    </div>

                    {/* Live Exchange Rate Pill + Manual Refresh Button */}
                    {currencyRate && (
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-zinc-900/40 px-4 py-2.5 shadow-xl backdrop-blur-md">
                                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                <div className="text-xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                                        Câmbio Comercial (AwesomeAPI)
                                    </span>
                                    <span className="text-sm font-extrabold text-emerald-400">
                                        1 USD = R$ {currencyRate.rate.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Refresh Button */}
                            <button
                                type="button"
                                onClick={handleManualRefresh}
                                disabled={isRefreshing || cooldown > 0}
                                title={
                                    cooldown > 0
                                        ? `Aguarde ${cooldown}s para atualizar novamente`
                                        : "Atualizar cotação e promoções agora"
                                }
                                aria-label="Atualizar cotação e ofertas"
                                className={cn(
                                    "group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 shadow-xl backdrop-blur-md",
                                    justUpdated
                                        ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        : cooldown > 0 || isRefreshing
                                          ? "border-white/5 bg-zinc-900/20 text-zinc-600 cursor-not-allowed"
                                          : "border-white/10 bg-zinc-900/50 text-zinc-300 hover:border-[#bd0df2]/60 hover:bg-[#bd0df2]/10 hover:text-white hover:shadow-[0_0_15px_rgba(189,13,242,0.25)] active:scale-95",
                                )}
                            >
                                {justUpdated ? (
                                    <Check className="h-4 w-4 text-emerald-400 animate-in zoom-in-50 duration-200" />
                                ) : (
                                    <RefreshCw
                                        className={cn(
                                            "h-4 w-4 transition-transform",
                                            isRefreshing && "animate-spin text-[#bd0df2]",
                                        )}
                                    />
                                )}

                                {cooldown > 0 && !justUpdated && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 px-1 text-[9px] font-extrabold text-zinc-300">
                                        {cooldown}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Search & Control Bar */}
                <div className="glass-card border border-theme bg-theme-card flex flex-col gap-4 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
                    <DealsSearch onSelectGame={handleSelectSearchGame} className="w-full max-w-full" />

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-theme/20">
                        <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mr-1">
                            <Zap className="h-3.5 w-3.5 text-theme-primary" /> Sugestões Rápidas:
                        </span>
                        {QUICK_SUGGESTIONS.map((item) => (
                            <button
                                key={item.title}
                                type="button"
                                onClick={() =>
                                    handleCompare({
                                        title: item.title,
                                        steamAppId: item.steamAppId,
                                    })
                                }
                                className="rounded-xl border border-theme/30 bg-zinc-900/60 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-all hover:border-theme-primary hover:bg-theme-primary/10 hover:text-white"
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                        <p className="flex-1 font-medium">{errorMessage}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setErrorMessage(null)}
                            className="text-xs text-red-300 hover:text-white"
                        >
                            Fechar
                        </Button>
                    </div>
                )}

                {/* Active Comparison View */}
                <div id="comparison-result-view">
                    {isSearching ? (
                        <ComparisonSkeleton />
                    ) : (
                        comparison && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-theme-primary" />
                                        Resultado da Comparação
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setComparison(null)}
                                        className="text-xs font-bold text-zinc-400 hover:text-white"
                                    >
                                        Limpar
                                    </Button>
                                </div>
                                <DealComparisonCard
                                    comparison={comparison}
                                    onRefresh={() =>
                                        handleCompare({
                                            title: comparison.title,
                                            gameId: comparison.id,
                                            steamAppId: comparison.steamAppId,
                                        })
                                    }
                                    isRefreshing={isSearching}
                                />
                            </div>
                        )
                    )}
                </div>

                {/* Top Deals Showcase */}
                <div>
                    {isLoadingFeatured ? (
                        <FeaturedDealsSkeleton />
                    ) : (
                        <TopDealsCarousel
                            deals={featuredDeals}
                            onSelectDeal={handleSelectFeatured}
                            selectedId={comparison?.id}
                            activeFilter={activeFilter}
                            onFilterChange={handleFilterChange}
                            isLoading={isLoadingFeatured}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
