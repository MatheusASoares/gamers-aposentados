// src/components/deals/TopDealsCarousel.tsx

"use client";

import React, { useState } from "react";
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
    Globe,
} from "lucide-react";
import {
    FeaturedDealItem,
    DealFilterType,
    StoreFilterType,
    RegionAdvantageFilterType,
    PriceCapFilterType,
    TrackedDealItem,
} from "@/types/deals";
import { cn } from "@/lib/utils";
import { DealOracleSection } from "./DealOracleSection";

const ITEMS_PER_PAGE = 12;

interface TopDealsCarouselProps {
    deals: FeaturedDealItem[];
    trackedDeals?: TrackedDealItem[];
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
    monitoredCount?: number;
    isLoading?: boolean;
}

export function TopDealsCarousel({
    deals,
    trackedDeals = [],
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
    monitoredCount = 0,
    isLoading = false,
}: TopDealsCarouselProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [prevFilter, setPrevFilter] = useState(activeFilter);
    const [prevStore, setPrevStore] = useState(storeFilter);
    const [prevPriceCap, setPrevPriceCap] = useState(priceCap);

    if (
        prevFilter !== activeFilter ||
        prevStore !== storeFilter ||
        prevPriceCap !== priceCap
    ) {
        setPrevFilter(activeFilter);
        setPrevStore(storeFilter);
        setPrevPriceCap(priceCap);
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
            label: "Recordes (ATL)",
            icon: <Trophy className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />,
        },
        {
            id: "highest_cut",
            label: "Super Descontos",
            icon: <Flame className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />,
        },
        {
            id: "oracle",
            label: "Oráculo IA",
            icon: <Sparkles className="h-3.5 w-3.5 text-[#bd0df2] flex-shrink-0" />,
        },
        {
            id: "monitored",
            label: "Favoritos",
            icon: <Heart className="h-3.5 w-3.5 text-pink-400 fill-pink-400/30 flex-shrink-0" />,
            badge: monitoredCount,
        },
    ];

    const priceCapOptions: Array<{ id: PriceCapFilterType; label: string }> = [
        { id: "all", label: "Qualquer Preço" },
        { id: "under_30", label: "Até R$ 30" },
        { id: "under_60", label: "Até R$ 60" },
        { id: "under_100", label: "Até R$ 100" },
    ];

    const storeOptions: Array<{ id: StoreFilterType; label: string; icon: React.ReactNode }> = [
        { id: "all", label: "Todas as Lojas", icon: <ShoppingBag className="h-3 w-3" /> },
        { id: "steam", label: "Só Steam", icon: <Gamepad2 className="h-3 w-3 text-cyan-400" /> },
    ];

    const isMonitoredTab = activeFilter === "monitored";
    const isOracleTab = activeFilter === "oracle";
    const currentList = isMonitoredTab ? trackedDeals : deals;
    const totalDeals = currentList.length;
    const totalPages = Math.max(1, Math.ceil(totalDeals / ITEMS_PER_PAGE));
    const paginatedDeals = currentList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

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
                                        "flex items-center justify-center lg:justify-start gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
                                        isActive
                                            ? "border border-theme-primary bg-theme-primary/20 text-white shadow-[0_0_15px_var(--theme-glow)]"
                                            : "border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40",
                                    )}
                                >
                                    {opt.icon}
                                    <span className="whitespace-nowrap">{opt.label}</span>
                                    {opt.badge !== undefined && opt.badge > 0 && (
                                        <span className={cn(
                                            "ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] sm:text-xs font-black",
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

            {/* Store & Price Cap Micro-Filters (Only shown on deals tabs, not on monitored or oracle tab) */}
            {!isMonitoredTab && !isOracleTab && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    {/* Price Cap Filter */}
                    {onPriceCapChange && (
                        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/80 p-1.5 rounded-xl border border-theme/30 w-full sm:w-auto">
                            <span className="text-xs font-black uppercase text-zinc-400 px-1.5">Preço:</span>
                            {priceCapOptions.map((cap) => {
                                const isCapActive = priceCap === cap.id;
                                return (
                                    <button
                                        key={cap.id}
                                        type="button"
                                        onClick={() => onPriceCapChange(cap.id)}
                                        className={cn(
                                            "rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-black transition-all",
                                            isCapActive
                                                ? "bg-theme-primary/25 text-white border border-theme-primary shadow-sm"
                                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent",
                                        )}
                                    >
                                        {cap.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Store Filter */}
                    {onStoreFilterChange && (
                        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1.5 rounded-xl border border-theme/30 sm:border-transparent sm:bg-transparent sm:p-0">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline px-1">
                                Loja:
                            </span>
                            {storeOptions.map((storeOpt) => {
                                const isStoreActive = storeFilter === storeOpt.id;
                                return (
                                    <button
                                        key={storeOpt.id}
                                        type="button"
                                        onClick={() => onStoreFilterChange(storeOpt.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                                            isStoreActive
                                                ? "bg-zinc-800 text-white border border-theme/40 shadow-sm"
                                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 border border-transparent",
                                        )}
                                    >
                                        {storeOpt.icon}
                                        <span>{storeOpt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* If Oracle Tab is active, render DealOracleSection */}
            {isOracleTab ? (
                <DealOracleSection
                    onToggleTrack={onToggleTrack}
                    isTracked={isTracked}
                />
            ) : (
                <>
                    {/* Empty State */}
                    {(!currentList || currentList.length === 0) && (
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
                                Experimente alterar o teto de preço ou a loja selecionada para ver mais títulos.
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
                        const priceBR = "priceBR" in deal ? deal.priceBR : (deal as TrackedDealItem).currentPriceBR ?? 0;
                        const priceUS = "priceUS" in deal ? deal.priceUS : (deal as TrackedDealItem).currentPriceUS ?? 0;
                        const discountPercent = deal.discountPercent ?? 0;
                        const savingsPercent = deal.savingsPercent ?? 0;

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
                                {/* Image & Badges */}
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-theme/20">
                                    {deal.coverImage ? (
                                        <Image
                                            src={deal.coverImage}
                                            alt={deal.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
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

                                    {/* Top-Right: Favorite Button + Regional Economy or ATL Badge */}
                                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                        {/* Heart/Track button */}
                                        {onToggleTrack && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
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

                                        {deal.isAllTimeLow && (
                                            <span className="flex items-center gap-1 rounded-lg bg-amber-500/95 px-2 py-0.5 text-[10px] sm:text-xs font-black text-black shadow-md backdrop-blur-sm">
                                                <Trophy className="h-3 w-3" /> Recorde
                                            </span>
                                        )}

                                        {isBrWinner && savingsPercent > 0 && !deal.isAllTimeLow && (
                                            <span className="rounded-lg bg-zinc-950/90 px-2 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/40 backdrop-blur-md shadow-md">
                                                🇧🇷 -{savingsPercent}% Econ.
                                            </span>
                                        )}
                                        {isUsWinner && savingsPercent > 0 && !deal.isAllTimeLow && (
                                            <span className="rounded-lg bg-zinc-950/90 px-2 py-0.5 text-xs font-black text-cyan-400 border border-cyan-500/40 backdrop-blur-md shadow-md">
                                                🇺🇸 -{savingsPercent}% Econ.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="mt-2.5 flex-1 space-y-2">
                                    <h4 className="truncate text-sm sm:text-base font-bold text-white group-hover:text-theme-primary transition-colors" title={deal.title}>
                                        {deal.title}
                                    </h4>

                                    {/* Steam Community Reviews Badge */}
                                    {deal.steamReviews && deal.steamReviews.totalReviews > 0 ? (
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={cn(
                                                    "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-black border backdrop-blur-sm",
                                                    deal.steamReviews.positivePercent >= 80
                                                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                                        : deal.steamReviews.positivePercent >= 70
                                                          ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                                          : "bg-zinc-800 text-zinc-400 border-zinc-700",
                                                )}
                                                title={`${deal.steamReviews.totalReviews.toLocaleString("pt-BR")} análises na Steam`}
                                            >
                                                <ThumbsUp className="h-3 w-3 stroke-[2.5]" />
                                                <span>{deal.steamReviews.positivePercent}%</span>
                                                <span className="font-semibold text-zinc-300 truncate max-w-[130px]">
                                                    {deal.steamReviews.reviewScoreDesc}
                                                </span>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="h-5" />
                                    )}

                                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-900/70 p-2 border border-theme/20">
                                        <div>
                                            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                                EUA (USD)
                                            </span>
                                            <span className="text-sm sm:text-base font-black text-zinc-200">
                                                ${priceUS > 0 ? priceUS.toFixed(2) : "--"}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                                Brasil (BRL)
                                            </span>
                                            <span className="text-sm sm:text-base font-black text-emerald-400">
                                                R$ {priceBR > 0 ? priceBR.toFixed(2) : "--"}
                                            </span>
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
                            className="flex h-8 items-center gap-1 rounded-xl border border-theme/30 bg-zinc-900/80 px-3 text-xs font-bold text-zinc-300 transition-all hover:bg-theme-primary/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
                                                ? "border border-theme-primary bg-theme-primary text-black font-black shadow-md scale-105"
                                                : "border border-theme/20 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800",
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
                            className="flex h-8 items-center gap-1 rounded-xl border border-theme/30 bg-zinc-900/80 px-3 text-xs font-bold text-zinc-300 transition-all hover:bg-theme-primary/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Próximo <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
                </>
            )}
        </div>
    );
}
