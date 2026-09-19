// src/components/deals/TopDealsCarousel.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
    Flame,
    ArrowUpRight,
    TrendingDown,
    Trophy,
    Gamepad2,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Heart,
    ShoppingBag,
    ThumbsUp,
    ArrowUpDown,
    Users,
    Loader2,
    CheckCircle2,
    Tag,
} from "lucide-react";

import {
    FeaturedDealItem,
    DealFilterType,
    StoreFilterType,
    RegionAdvantageFilterType,
    PriceCapFilterType,
    TrackedDealItem,
    CurrencyRate,
    SteamCommunityReview,
} from "@/types/deals";
import { cn } from "@/lib/utils";
import { DealOracleSection } from "./DealOracleSection";

const ITEMS_PER_PAGE = 12;

export type SortOption = "savings" | "discount" | "rating" | "price_asc";

interface TopDealsCarouselProps {
    deals: FeaturedDealItem[];
    trackedDeals?: TrackedDealItem[];
    currencyRate?: CurrencyRate | null;
    onSelectDeal: (deal: FeaturedDealItem | TrackedDealItem) => void;
    selectedId?: string | null;
    activeFilter?: DealFilterType;
    onFilterChange?: (filter: DealFilterType) => void;
    storeFilter?: StoreFilterType;
    onStoreFilterChange?: (store: StoreFilterType) => void;
    priceCap?: PriceCapFilterType;
    onPriceCapChange?: (priceCap: PriceCapFilterType) => void;
    regionFilter?: RegionAdvantageFilterType;
    onRegionFilterChange?: (region: RegionAdvantageFilterType) => void;
    onToggleTrack?: (game: {
        id: string;
        title: string;
        steamAppId?: number | null;
        slug?: string;
        coverImage?: string | null;
    }) => void;
    isTracked?: (idOrAppId: string | number) => boolean;
    familySharingOnly?: boolean;
    onToggleFamilySharing?: () => void;
    isOwned?: (idOrAppId: string | number) => boolean;
    onToggleOwned?: (game: {
        id: string;
        title: string;
        steamAppId?: number | null;
        slug?: string;
        coverImage?: string | null;
    }) => void;
    monitoredCount?: number;
    isLoading?: boolean;
    isAuthenticated?: boolean;
    onRequireLogin?: () => void;
}

export function TopDealsCarousel({
    deals,
    trackedDeals = [],
    currencyRate,
    onSelectDeal,
    selectedId,
    activeFilter = "historical_low",
    onFilterChange,
    storeFilter = "all",
    onStoreFilterChange,
    priceCap = "all",
    onPriceCapChange,
    onToggleTrack,
    isTracked = () => false,
    familySharingOnly = false,
    onToggleFamilySharing,
    isOwned = () => false,
    onToggleOwned,
    monitoredCount = 0,
    isLoading = false,
    isAuthenticated = true,
    onRequireLogin,
}: TopDealsCarouselProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>("savings");
    const [prevFilter, setPrevFilter] = useState(activeFilter);
    const [prevStore, setPrevStore] = useState(storeFilter);
    const [prevPriceCap, setPrevPriceCap] = useState(priceCap);
    const [prevFamilySharing, setPrevFamilySharing] = useState(familySharingOnly);

    // On-the-fly live Steam reviews and Family Sharing cache for cards
    const [liveData, setLiveData] = useState<
        Record<
            number,
            {
                reviews?: SteamCommunityReview | null;
                isFamilySharing?: boolean;
                loading?: boolean;
            }
        >
    >({});

    if (
        prevFilter !== activeFilter ||
        prevStore !== storeFilter ||
        prevPriceCap !== priceCap ||
        prevFamilySharing !== familySharingOnly
    ) {
        setPrevFilter(activeFilter);
        setPrevStore(storeFilter);
        setPrevPriceCap(priceCap);
        setPrevFamilySharing(familySharingOnly);
        setCurrentPage(1);
    }

    const filterOptions: Array<{
        id: DealFilterType;
        label: string;
        icon: React.ReactNode;
        badge?: number;
    }> = [
        {
            id: "historical_low",
            label: "RECORDES (ATL)",
            icon: <Trophy className="h-4 w-4 text-amber-400 flex-shrink-0" />,
        },
        {
            id: "highest_cut",
            label: "SUPER DESCONTOS",
            icon: <Flame className="h-4 w-4 text-orange-400 flex-shrink-0" />,
        },
        {
            id: "oracle",
            label: "ORÁCULO",
            icon: <Sparkles className="h-4 w-4 text-[#bd0df2] flex-shrink-0" />,
        },
        {
            id: "monitored",
            label: "FAVORITOS",
            icon: <Heart className="h-4 w-4 text-pink-400 fill-pink-400/30 flex-shrink-0" />,
            badge: monitoredCount,
        },
    ];

    const sortOptions: Array<{
        id: SortOption;
        label: string;
        icon: (isActive: boolean) => React.ReactNode;
    }> = [
        {
            id: "savings",
            label: "MAIOR ECONOMIA",
            icon: (isActive: boolean) => (
                <TrendingDown className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-black" : "text-emerald-400")} />
            ),
        },
        {
            id: "discount",
            label: "MAIOR DESCONTO",
            icon: (isActive: boolean) => (
                <Flame className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-black" : "text-orange-400")} />
            ),
        },
        {
            id: "rating",
            label: "MELHOR NOTA",
            icon: (isActive: boolean) => (
                <ThumbsUp className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-black" : "text-cyan-400")} />
            ),
        },
        {
            id: "price_asc",
            label: "MENOR PREÇO",
            icon: (isActive: boolean) => (
                <Tag className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-black" : "text-purple-400")} />
            ),
        },
    ];

    const priceCapOptions: Array<{ id: PriceCapFilterType; label: string }> = [
        { id: "all", label: "TODOS" },
        { id: "under_30", label: "ATÉ R$ 30" },
        { id: "under_60", label: "ATÉ R$ 60" },
        { id: "under_100", label: "ATÉ R$ 100" },
    ];

    const storeOptions: Array<{ id: StoreFilterType; label: string; icon: React.ReactNode }> = [
        { id: "all", label: "TODAS AS LOJAS", icon: <ShoppingBag className="h-3.5 w-3.5 flex-shrink-0" /> },
        { id: "steam", label: "SÓ STEAM", icon: <Gamepad2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" /> },
    ];

    const isMonitoredTab = activeFilter === "monitored";
    const isOracleTab = activeFilter === "oracle";
    const baseList = isMonitoredTab ? trackedDeals : deals;

    // Client-side instant sorting
    const sortedDeals = useMemo(() => {
        let list = [...baseList];

        if (familySharingOnly) {
            list = list.filter((deal) => {
                const appId = deal.steamAppId ? Number(deal.steamAppId) : /^\d+$/.test(deal.id) ? Number(deal.id) : null;
                const fs = deal.isFamilySharing ?? (appId ? liveData[appId]?.isFamilySharing : undefined);
                return fs === true;
            });
        }

        if (sortBy === "savings") {
            return list.sort((a, b) => {
                const savA = "absoluteSavingsBRL" in a ? (a.absoluteSavingsBRL || 0) : 0;
                const savB = "absoluteSavingsBRL" in b ? (b.absoluteSavingsBRL || 0) : 0;
                if (savB !== savA) return savB - savA;
                return (b.savingsPercent || 0) - (a.savingsPercent || 0);
            });
        }
        if (sortBy === "discount") {
            return list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        }
        if (sortBy === "rating") {
            return list.sort((a, b) => {
                const appIdA = a.steamAppId ? Number(a.steamAppId) : /^\d+$/.test(a.id) ? Number(a.id) : null;
                const appIdB = b.steamAppId ? Number(b.steamAppId) : /^\d+$/.test(b.id) ? Number(b.id) : null;

                const rA =
                    ("steamReviews" in a && a.steamReviews?.positivePercent !== undefined)
                        ? a.steamReviews.positivePercent
                        : (appIdA && liveData[appIdA]?.reviews?.positivePercent !== undefined)
                          ? liveData[appIdA]?.reviews?.positivePercent
                          : -1;

                const rB =
                    ("steamReviews" in b && b.steamReviews?.positivePercent !== undefined)
                        ? b.steamReviews.positivePercent
                        : (appIdB && liveData[appIdB]?.reviews?.positivePercent !== undefined)
                          ? liveData[appIdB]?.reviews?.positivePercent
                          : -1;

                return (rB ?? -1) - (rA ?? -1);
            });
        }
        if (sortBy === "price_asc") {
            return list.sort((a, b) => {
                const pA = "priceBR" in a ? a.priceBR : (a as TrackedDealItem).currentPriceBR ?? 0;
                const pB = "priceBR" in b ? b.priceBR : (b as TrackedDealItem).currentPriceBR ?? 0;
                return pA - pB;
            });
        }
        return list;
    }, [baseList, sortBy, familySharingOnly, liveData]);

    const totalDeals = sortedDeals.length;
    const totalPages = Math.max(1, Math.ceil(totalDeals / ITEMS_PER_PAGE));
    const paginatedDeals = sortedDeals.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    // Automatically fetch real Steam reviews and Family Sharing on-the-fly for visible cards if missing
    useEffect(() => {
        if (!paginatedDeals || paginatedDeals.length === 0) return;

        const toFetch: number[] = [];
        paginatedDeals.forEach((deal) => {
            const appId = deal.steamAppId ? Number(deal.steamAppId) : /^\d+$/.test(deal.id) ? Number(deal.id) : null;
            if (!appId) return;

            const current = liveData[appId];
            const hasReviews = !!(deal.steamReviews || (current && current.reviews !== undefined));
            const hasFamily = deal.isFamilySharing !== undefined || (current && current.isFamilySharing !== undefined);

            if ((!hasReviews || !hasFamily) && !current?.loading) {
                toFetch.push(appId);
            }
        });

        if (toFetch.length === 0) return;

        // Mark as loading to prevent duplicate requests
        setLiveData((prev) => {
            const next = { ...prev };
            toFetch.forEach((appId) => {
                next[appId] = { ...next[appId], loading: true };
            });
            return next;
        });

        Promise.allSettled(
            toFetch.map(async (appId) => {
                try {
                    const res = await fetch(`/api/deals/reviews?appId=${appId}`);
                    if (res.ok) {
                        const data = await res.json();
                        return { appId, data };
                    }
                } catch (e) {
                    console.error(`[TopDealsCarousel] Failed on-the-fly fetch for AppId ${appId}:`, e);
                }
                return { appId, data: null };
            }),
        ).then((results) => {
            setLiveData((prev) => {
                const next = { ...prev };
                results.forEach((res) => {
                    if (res.status === "fulfilled" && res.value) {
                        const { appId, data } = res.value;
                        next[appId] = {
                            loading: false,
                            reviews: data?.reviews ?? null,
                            isFamilySharing: data?.isFamilySharing ?? false,
                        };
                    }
                });
                return next;
            });
        });
    }, [paginatedDeals, liveData]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            const vitrineEl = document.getElementById("vitrine-showcase-anchor");
            if (vitrineEl) {
                vitrineEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };

    return (
        <div id="vitrine-showcase-anchor" className="space-y-5 scroll-mt-6">
            {/* Header with Title and Filter Tabs */}
            <div className="flex flex-col gap-4 border-b border-theme/20 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md flex-shrink-0">
                        <Flame className="h-5 w-5 fill-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
                            Vitrine de Deals
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                                {totalDeals} {isMonitoredTab ? "Favoritos" : "Ofertas"}
                            </span>
                        </h3>
                    </div>
                </div>

                {/* 4 Main Filter Pills: 2x2 on mobile, 4x1 on desktop */}
                {onFilterChange && (
                    <div className="grid grid-cols-2 lg:flex lg:flex-row lg:items-center gap-1.5 sm:gap-2 rounded-2xl border border-theme/30 bg-zinc-900/60 p-1.5 shadow-xl backdrop-blur-md w-full lg:w-auto">
                        {filterOptions.map((opt) => {
                            const isActive = activeFilter === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => onFilterChange(opt.id)}
                                    disabled={isLoading}
                                    className={cn(
                                        "flex items-center justify-center lg:justify-start gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 whitespace-nowrap active:scale-95 border",
                                        isActive
                                            ? "border-theme-primary bg-theme-primary/20 text-white shadow-[0_0_15px_var(--theme-glow)]"
                                            : "border-theme/20 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-theme/40",
                                    )}
                                >
                                    {opt.icon}
                                    <span className="whitespace-nowrap">{opt.label}</span>
                                    {opt.badge !== undefined && opt.badge > 0 && (
                                        <span className={cn(
                                            "ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-xs font-black",
                                            isActive ? "bg-theme-primary text-black" : "bg-zinc-800 text-pink-400 border border-pink-400/30",
                                        )}>
                                            {opt.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sub-Filters & Ordenação Bar (Only shown on deals tabs, not on oracle tab) */}
            {!isOracleTab && (
                <div className="rounded-2xl border border-theme/40 bg-theme-card/95 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg space-y-3.5">
                    {/* Linha 1: Filtros de Garimpo (Preço, Loja e Família) */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        {/* Bloco de Preço */}
                        {onPriceCapChange && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                                    <Tag className="h-3.5 w-3.5 text-theme-primary" /> Preço:
                                </span>
                                {/* Mobile: 2x2 grid / Desktop: flex row 4x1 */}
                                <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-theme/30">
                                    {priceCapOptions.map((cap) => {
                                        const isCapActive = priceCap === cap.id;
                                        return (
                                            <button
                                                key={cap.id}
                                                type="button"
                                                onClick={() => onPriceCapChange(cap.id)}
                                                className={cn(
                                                    "flex items-center justify-center rounded-lg px-3 py-2 sm:py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 border",
                                                    isCapActive
                                                        ? "bg-theme-primary text-black border-theme-primary font-black shadow-[0_0_12px_var(--theme-glow)]"
                                                        : "bg-zinc-900/70 border-theme/20 text-zinc-400 hover:text-white hover:bg-zinc-800/70 hover:border-theme/40",
                                                )}
                                            >
                                                {cap.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Bloco de Loja e Família (Sem sobreposição no mobile) */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            {/* Loja */}
                            {onStoreFilterChange && (
                                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-theme/30 w-full sm:w-auto">
                                    {storeOptions.map((storeOpt) => {
                                        const isStoreActive = storeFilter === storeOpt.id;
                                        return (
                                            <button
                                                key={storeOpt.id}
                                                type="button"
                                                onClick={() => onStoreFilterChange(storeOpt.id)}
                                                className={cn(
                                                    "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 border",
                                                    isStoreActive
                                                        ? "bg-theme-primary text-black border-theme-primary font-black shadow-[0_0_12px_var(--theme-glow)]"
                                                        : "bg-zinc-900/70 border-theme/20 text-zinc-400 hover:text-white hover:bg-zinc-800/70 hover:border-theme/40",
                                                )}
                                            >
                                                {storeOpt.icon}
                                                <span className="whitespace-nowrap">{storeOpt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Steam Family Sharing Toggle Button */}
                            {onToggleFamilySharing && (
                                <button
                                    type="button"
                                    onClick={onToggleFamilySharing}
                                    className={cn(
                                        "flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 border shadow-sm active:scale-95 w-full sm:w-auto",
                                        familySharingOnly
                                            ? "bg-purple-950/90 border-[#bd0df2] text-white font-black shadow-[0_0_15px_rgba(189,13,242,0.4)]"
                                            : "bg-zinc-900/70 border-theme/30 text-zinc-400 hover:text-white hover:bg-zinc-800/70 hover:border-theme/50",
                                    )}
                                >
                                    <Users className={cn("h-3.5 w-3.5", familySharingOnly ? "text-[#bd0df2]" : "text-zinc-400")} />
                                    <span className="whitespace-nowrap">STEAM FAMÍLIA</span>
                                    {familySharingOnly && (
                                        <span className="h-2 w-2 rounded-full bg-[#bd0df2] animate-pulse ml-0.5" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Linha Divisória Sutil */}
                    <div className="border-t border-theme/20" />

                    {/* Linha 2: Barra de Ordenação Dedicada (4x1 no Desktop, 2x2 no Mobile) */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                <ArrowUpDown className="h-3.5 w-3.5 text-theme-primary" /> Ordenar Por:
                            </span>
                            <span className="text-xs text-zinc-400 font-bold hidden sm:inline uppercase">
                                {totalDeals} {isMonitoredTab ? "FAVORITOS FILTRADOS" : "OFERTAS ENCONTRADAS"}
                            </span>
                        </div>

                        {/* Grid Dual-Paradigm: 2x2 no Mobile (< lg), 4x1 no Desktop (lg / xl) */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {sortOptions.map((opt) => {
                                const isSortActive = sortBy === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(opt.id);
                                            setCurrentPage(1);
                                        }}
                                        className={cn(
                                            "flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 border",
                                            isSortActive
                                                ? "bg-theme-primary text-black border-theme-primary font-black shadow-[0_0_15px_var(--theme-glow)]"
                                                : "bg-zinc-900/70 border-theme/20 text-zinc-400 hover:text-white hover:bg-zinc-800/70 hover:border-theme/40",
                                        )}
                                    >
                                        {opt.icon(isSortActive)}
                                        <span className="whitespace-nowrap">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}


            {/* Deal Oracle Section (Preserved in DOM to prevent unmounting and refetching on tab switch) */}
            <div className={cn(!isOracleTab && "hidden")}>
                <DealOracleSection
                    onToggleTrack={onToggleTrack}
                    isTracked={isTracked}
                    onToggleOwned={onToggleOwned}
                    isOwned={isOwned}
                    isAuthenticated={isAuthenticated}
                    onRequireLogin={onRequireLogin}
                    currencyRate={currencyRate}
                    onSelectDeal={(game) => {
                        onSelectDeal({
                            id: game.id,
                            title: game.title,
                            steamAppId: game.steamAppId,
                            slug: game.slug || game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                            coverImage: game.coverImage,
                            addedAt: new Date().toISOString(),
                        });
                    }}
                />
            </div>

            {/* Deals Showcase Grid & Pagination (Hidden when in Oracle Tab) */}
            <div className={cn(isOracleTab && "hidden")}>
                    {/* Empty State */}
                    {(!sortedDeals || sortedDeals.length === 0) && (
                        <div className="glass-card border border-theme bg-theme-card flex flex-col items-center justify-center rounded-2xl p-8 sm:p-12 text-center">
                            {isMonitoredTab ? (
                                <>
                                    <Heart className="h-10 w-10 text-pink-400/60 mb-2.5 animate-pulse" />
                                    <h4 className="text-base font-extrabold text-white">Nenhum jogo favoritado ainda</h4>
                                    <p className="max-w-md text-xs text-zinc-400 mt-1">
                                        Clique no ícone de <strong className="text-pink-400">coração ❤️</strong> em qualquer oferta para salvá-lo. Seus favoritos ficam sincronizados na sua conta!
                                    </p>
                                </>
                            ) : activeFilter === "historical_low" ? (
                                <>
                                    <Trophy className="h-8 w-8 text-amber-400 mb-2" />
                                    <h4 className="text-sm font-extrabold text-white">Nenhum recorde histórico encontrado</h4>
                                    <p className="max-w-md text-xs text-zinc-400 mt-1">
                                        Experimente alterar o teto de preço ou a ordenação para ver mais títulos.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-8 w-8 text-theme-primary mb-2" />
                                    <p className="text-sm font-bold text-zinc-300">
                                        Nenhum deal encontrado para este filtro no momento.
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Tente alternar o teto de preço ou a loja selecionada.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Deals Grid (12 items: 3 rows of 4 columns) */}
                    {paginatedDeals && paginatedDeals.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {paginatedDeals.map((deal) => {
                                const isSelected = selectedId === deal.id || (deal.steamAppId && selectedId === String(deal.steamAppId));
                                const isBrWinner = deal.winningRegion === "BR";
                                const isUsWinner = deal.winningRegion === "US";
                                const tracked = isTracked(deal.steamAppId || deal.id);
                                const owned = isOwned(deal.steamAppId || deal.id);
                                const priceBR = "priceBR" in deal ? deal.priceBR : (deal as TrackedDealItem).currentPriceBR ?? 0;
                                const priceUS = "priceUS" in deal ? deal.priceUS : (deal as TrackedDealItem).currentPriceUS ?? 0;
                                const discountPercent = deal.discountPercent ?? 0;
                                const savingsPercent = deal.savingsPercent ?? 0;
                                const savingsBRL = "absoluteSavingsBRL" in deal ? (deal.absoluteSavingsBRL || 0) : 0;
                                const convertedUSinBRL = currencyRate && priceUS > 0 ? Number((priceUS * currencyRate.rate).toFixed(2)) : 0;

                                const appId = deal.steamAppId ? Number(deal.steamAppId) : /^\d+$/.test(deal.id) ? Number(deal.id) : null;
                                const live = appId ? liveData[appId] : null;
                                const isFamilyOk = deal.isFamilySharing ?? live?.isFamilySharing;
                                const steamRev = deal.steamReviews || live?.reviews;
                                const isFetchingReview = live?.loading;

                                return (
                                    <div
                                        key={deal.id}
                                        onClick={() => onSelectDeal(deal)}
                                        className={cn(
                                            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 transition-all duration-300 cursor-pointer backdrop-blur-md",
                                            isSelected
                                                ? "border-theme-primary bg-theme-primary/15 theme-glow shadow-2xl scale-[1.02]"
                                                : "border-theme/40 bg-zinc-950/70 hover:border-theme-primary/60 hover:bg-zinc-900/70 hover:shadow-xl hover:-translate-y-1",
                                        )}
                                    >
                                        <div>
                                            {/* Image & Badges */}
                                            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-theme/20">
                                                {deal.coverImage ? (
                                                    <Image
                                                        src={deal.coverImage}
                                                        alt={deal.title}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/20 p-3 text-center">
                                                        <Gamepad2 className="h-6 w-6 text-theme-primary/60 mb-1" />
                                                        <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 line-clamp-1">
                                                            {deal.title}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Top-Left: Store Discount badge */}
                                                {discountPercent > 0 && (
                                                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-emerald-500/95 px-2 py-0.5 text-xs font-black text-black shadow-lg backdrop-blur-sm">
                                                        <TrendingDown className="h-3.5 w-3.5 stroke-[3]" />
                                                        -{discountPercent}%
                                                    </div>
                                                )}

                                                {/* Bottom-Left: Steam Familia OK */}
                                                {isFamilyOk === true && (
                                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-purple-950/90 border border-purple-500/50 px-2 py-0.5 text-xs font-bold text-purple-300 shadow-md backdrop-blur-sm">
                                                        <Users className="h-3 w-3 text-[#bd0df2]" />
                                                        <span>Steam Família OK</span>
                                                    </div>
                                                )}

                                                {/* Bottom-Right: Owned Badge on thumbnail */}
                                                {owned && (
                                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 text-xs font-bold text-emerald-300 shadow-md backdrop-blur-sm">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                        <span>✓ Na Biblioteca</span>
                                                    </div>
                                                )}

                                                {/* Top-Right: Actions (Owned & Favorite) + Record Badge */}
                                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                                                    <div className="flex items-center gap-1">
                                                        {onToggleOwned && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isAuthenticated) {
                                                                        onRequireLogin?.();
                                                                        return;
                                                                    }
                                                                    onToggleOwned({
                                                                        id: deal.id,
                                                                        title: deal.title,
                                                                        steamAppId: deal.steamAppId,
                                                                        slug: deal.slug,
                                                                        coverImage: deal.coverImage,
                                                                    });
                                                                }}
                                                                title={owned ? "Remover da biblioteca (Já possuo)" : "Marcar como já possuído (Na Biblioteca)"}
                                                                className={cn(
                                                                    "flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all shadow-md active:scale-90",
                                                                    owned
                                                                        ? "border-emerald-500/60 bg-emerald-950/90 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                                                                        : "border-white/10 bg-black/60 text-zinc-400 hover:text-emerald-400 hover:border-emerald-400/40",
                                                                )}
                                                            >
                                                                <CheckCircle2 className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5", owned && "stroke-[2.5]")} />
                                                            </button>
                                                        )}

                                                        {onToggleTrack && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isAuthenticated) {
                                                                        onRequireLogin?.();
                                                                        return;
                                                                    }
                                                                    onToggleTrack({
                                                                        id: deal.id,
                                                                        title: deal.title,
                                                                        steamAppId: deal.steamAppId,
                                                                        slug: deal.slug,
                                                                        coverImage: deal.coverImage,
                                                                    });
                                                                }}
                                                                title={tracked ? "Remover dos favoritos" : "Favoritar este jogo"}
                                                                className={cn(
                                                                    "flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all shadow-md active:scale-90",
                                                                    tracked
                                                                        ? "border-pink-500/60 bg-pink-950/90 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
                                                                        : "border-white/10 bg-black/60 text-zinc-400 hover:text-pink-400 hover:border-pink-400/40",
                                                                )}
                                                            >
                                                                <Heart className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5", tracked && "fill-pink-500")} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {deal.isAllTimeLow && (
                                                        <span className="flex items-center gap-1 rounded-lg bg-amber-500/95 px-2 py-0.5 text-xs font-black text-black shadow-md backdrop-blur-sm">
                                                            <Trophy className="h-3.5 w-3.5" /> Recorde
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info: Title and Steam Approval */}
                                            <div className="mt-2.5 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="truncate text-sm sm:text-base font-bold text-white group-hover:text-theme-primary transition-colors" title={deal.title}>
                                                        {deal.title}
                                                    </h4>
                                                    {owned && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-xs font-bold text-emerald-300 shadow-sm">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                            Na Biblioteca
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Steam Community Reviews Badge (Obrigatório em todo card - Dados Reais da Steam) */}
                                                {steamRev && steamRev.totalReviews > 0 ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className={cn(
                                                                "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border backdrop-blur-sm",
                                                                steamRev.positivePercent >= 80
                                                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                                                    : steamRev.positivePercent >= 65
                                                                        ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                                                        : "bg-amber-500/15 text-amber-300 border-amber-500/30",
                                                            )}
                                                            title={`${steamRev.totalReviews.toLocaleString("pt-BR")} análises na Steam`}
                                                        >
                                                            <ThumbsUp className="h-3 w-3 text-emerald-400 stroke-[2.5]" />
                                                            <span>{steamRev.positivePercent}% Positiva</span>
                                                            {steamRev.reviewScoreDesc && (
                                                                <span className="font-semibold text-zinc-300 truncate max-w-[130px]">
                                                                    • {steamRev.reviewScoreDesc}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : isFetchingReview ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border border-zinc-800 bg-zinc-900/60 text-zinc-400">
                                                            <Loader2 className="h-3 w-3 animate-spin text-theme-primary" />
                                                            <span>Consultando Steam...</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-zinc-800/80 bg-zinc-900/40 text-zinc-500">
                                                            <ThumbsUp className="h-3 w-3 opacity-40" />
                                                            <span>Steam</span>
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Comparador Regional de Preços US x BR com Economia Explícita */}
                                                <div className="rounded-xl bg-zinc-900/80 p-2.5 border border-theme/20 space-y-1.5">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                                                EUA (USD)
                                                            </span>
                                                            <span className="text-sm sm:text-base font-black text-zinc-200">
                                                                ${priceUS > 0 ? priceUS.toFixed(2) : "--"}
                                                                {convertedUSinBRL > 0 && (
                                                                    <span className="text-xs text-zinc-400 font-medium ml-1 block sm:inline">
                                                                        (~R$ {convertedUSinBRL.toFixed(2)})
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                                                Brasil (BRL)
                                                            </span>
                                                            <span className="text-sm sm:text-base font-black text-emerald-400">
                                                                R$ {priceBR > 0 ? priceBR.toFixed(2) : "--"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Margem de Economia por Região */}
                                                    {isBrWinner && (savingsBRL > 0 || savingsPercent > 0) ? (
                                                        <div className="flex items-center justify-between rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 text-xs">
                                                            <span className="font-extrabold text-emerald-400">
                                                                🇧🇷 Vantagem Brasil:
                                                            </span>
                                                            <span className="font-black text-emerald-300">
                                                                {savingsBRL > 0 ? `Economize R$ ${savingsBRL.toFixed(2)} ` : ""}
                                                                (-{savingsPercent}%)
                                                            </span>
                                                        </div>
                                                    ) : isUsWinner && savingsPercent > 0 ? (
                                                        <div className="flex items-center justify-between rounded-lg bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 text-xs">
                                                            <span className="font-extrabold text-cyan-400">
                                                                🇺🇸 Vantagem EUA:
                                                            </span>
                                                            <span className="font-black text-cyan-300">
                                                                {savingsBRL > 0 ? `Economize R$ ${savingsBRL.toFixed(2)} ` : ""}
                                                                (-{savingsPercent}%)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-white/5 px-2 py-1 text-xs text-zinc-400">
                                                            <span>Regiões equivalentes</span>
                                                            <span className="font-bold text-zinc-300">Sem diferença</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action CTA footer */}
                                        <div className="mt-2.5 flex items-center justify-between border-t border-theme/20 pt-2 text-xs">
                                            <span className="text-zinc-400 font-medium truncate max-w-[120px]">
                                                Loja: <strong className="text-zinc-200">{deal.storeBR || "Steam"}</strong>
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-theme-primary group-hover:translate-x-0.5 transition-transform">
                                                Comparar <ArrowUpRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-theme/20">
                            <span className="text-xs font-medium text-zinc-400">
                                Mostrando <strong className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> até{" "}
                                <strong className="text-white">
                                    {Math.min(currentPage * ITEMS_PER_PAGE, totalDeals)}
                                </strong>{" "}
                                de <strong className="text-white">{totalDeals}</strong> {isMonitoredTab ? "favoritos" : "ofertas"}
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex h-8 items-center gap-1 rounded-xl border border-theme/30 bg-zinc-900/80 px-3 text-xs font-bold text-zinc-300 transition-all hover:bg-theme-primary/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        const isCurrent = page === currentPage;
                                        return (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => handlePageChange(page)}
                                                className={cn(
                                                    "h-8 min-w-[32px] rounded-xl text-xs font-extrabold transition-all duration-200",
                                                    isCurrent
                                                        ? "bg-theme-primary text-black shadow-md shadow-theme-primary/20"
                                                        : "border border-theme/20 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                                                )}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 items-center gap-1 rounded-xl border border-theme/30 bg-zinc-900/80 px-3 text-xs font-bold text-zinc-300 transition-all hover:bg-theme-primary/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                                >
                                    Próxima <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}
