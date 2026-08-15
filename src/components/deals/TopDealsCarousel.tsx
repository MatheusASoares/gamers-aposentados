// src/components/deals/TopDealsCarousel.tsx

"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { FeaturedDealItem, DealFilterType } from "@/types/deals";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 12;

interface TopDealsCarouselProps {
    deals: FeaturedDealItem[];
    onSelectDeal: (deal: FeaturedDealItem) => void;
    selectedId?: string | null;
    activeFilter?: DealFilterType;
    onFilterChange?: (filter: DealFilterType) => void;
    isLoading?: boolean;
}

export function TopDealsCarousel({
    deals,
    onSelectDeal,
    selectedId,
    activeFilter = "best_savings",
    onFilterChange,
    isLoading = false,
}: TopDealsCarouselProps) {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page to 1 whenever activeFilter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter]);

    const filterOptions: Array<{ id: DealFilterType; label: string; icon: React.ReactNode }> = [
        {
            id: "best_savings",
            label: "Melhores Deals (US x BR)",
            icon: <Flame className="h-3.5 w-3.5" />,
        },
        {
            id: "historical_low",
            label: "Menor Preço Histórico",
            icon: <Trophy className="h-3.5 w-3.5 text-amber-400" />,
        },
        {
            id: "steam_only",
            label: "Só na Steam",
            icon: <Gamepad2 className="h-3.5 w-3.5 text-cyan-400" />,
        },
    ];

    const totalDeals = deals.length;
    const totalPages = Math.max(1, Math.ceil(totalDeals / ITEMS_PER_PAGE));
    const paginatedDeals = deals.slice(
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-md">
                        <Flame className="h-5 w-5 fill-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
                            Vitrine de Deals
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                                {totalDeals} Jogos Curados
                            </span>
                        </h3>
                        <p className="text-xs font-medium text-zinc-400">
                            Apenas jogos base e títulos aclamados ordenados por vantagem cambial
                        </p>
                    </div>
                </div>

                {/* Filter Pills */}
                {onFilterChange && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-theme/30 bg-zinc-900/60 p-1.5 shadow-xl backdrop-blur-md">
                        {filterOptions.map((opt) => {
                            const isActive = activeFilter === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => onFilterChange(opt.id)}
                                    disabled={isLoading}
                                    className={cn(
                                        "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all duration-300",
                                        isActive
                                            ? "border border-theme-primary bg-theme-primary/20 text-white shadow-[0_0_15px_var(--theme-glow)]"
                                            : "border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/40",
                                    )}
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Empty State */}
            {(!deals || deals.length === 0) && (
                <div className="glass-card border border-theme bg-theme-card flex flex-col items-center justify-center rounded-2xl p-10 text-center">
                    <Sparkles className="h-8 w-8 text-theme-primary mb-2" />
                    <p className="text-sm font-bold text-zinc-300">
                        Nenhum deal encontrado para este filtro no momento.
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Tente alternar para a aba de &quot;Melhores Deals&quot;.
                    </p>
                </div>
            )}

            {/* Deals Grid (12 items: 3 rows of 4 columns) */}
            {paginatedDeals && paginatedDeals.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {paginatedDeals.map((deal) => {
                        const isSelected = selectedId === deal.id || selectedId === String(deal.steamAppId);
                        const isBrWinner = deal.winningRegion === "BR";
                        const isUsWinner = deal.winningRegion === "US";

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
                                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                            No Image
                                        </div>
                                    )}

                                    {/* Top-Left: Store Discount badge */}
                                    {deal.discountPercent > 0 && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-emerald-500/95 px-2 py-0.5 text-xs font-black text-black shadow-lg backdrop-blur-sm">
                                            <TrendingDown className="h-3 w-3 stroke-[3]" />
                                            -{deal.discountPercent}%
                                        </div>
                                    )}

                                    {/* Top-Right: Regional Economy or ATL Badge */}
                                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                        {isBrWinner && deal.savingsPercent > 0 && (
                                            <span className="rounded-lg bg-zinc-950/90 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/40 backdrop-blur-md shadow-md">
                                                🇧🇷 -{deal.savingsPercent}% Econ.
                                            </span>
                                        )}
                                        {isUsWinner && deal.savingsPercent > 0 && (
                                            <span className="rounded-lg bg-zinc-950/90 px-2 py-0.5 text-[10px] font-black text-cyan-400 border border-cyan-500/40 backdrop-blur-md shadow-md">
                                                🇺🇸 -{deal.savingsPercent}% Econ.
                                            </span>
                                        )}

                                        {deal.isAllTimeLow && (
                                            <span className="flex items-center gap-1 rounded-lg bg-amber-500/90 px-2 py-0.5 text-[9px] font-black text-black shadow-md backdrop-blur-sm">
                                                <Trophy className="h-2.5 w-2.5" /> Recorde
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="mt-2.5 flex-1 space-y-1.5">
                                    <h4 className="truncate text-xs font-bold text-white group-hover:text-theme-primary transition-colors" title={deal.title}>
                                        {deal.title}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-zinc-900/60 p-1.5 border border-theme/20">
                                        <div>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                                                EUA (USD)
                                            </span>
                                            <span className="text-xs font-black text-white">
                                                ${deal.priceUS.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                                                Brasil (BRL)
                                            </span>
                                            <span className="text-xs font-black text-emerald-400">
                                                R$ {deal.priceBR.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action CTA footer */}
                                <div className="mt-2.5 flex items-center justify-between border-t border-theme/20 pt-2 text-[10px]">
                                    <span className="text-zinc-500 font-medium truncate max-w-[90px]">
                                        Loja: <strong className="text-zinc-300">{deal.storeBR || "Steam"}</strong>
                                    </span>
                                    <span className="flex items-center gap-0.5 font-bold text-theme-primary group-hover:translate-x-0.5 transition-transform">
                                        Comparar <ArrowUpRight className="h-3 w-3" />
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
                        de <strong className="text-white">{totalDeals}</strong> ofertas
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
        </div>
    );
}
