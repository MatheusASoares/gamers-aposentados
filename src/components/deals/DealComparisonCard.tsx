// src/components/deals/DealComparisonCard.tsx

"use client";

import React from "react";
import Image from "next/image";
import {
    DealComparisonResult,
    RegionDeal,
} from "@/types/deals";
import {
    Trophy,
    TrendingDown,
    ExternalLink,
    Store,
    ShieldCheck,
    RefreshCw,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DealComparisonCardProps {
    comparison: DealComparisonResult;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function DealComparisonCard({
    comparison,
    onRefresh,
    isRefreshing = false,
}: DealComparisonCardProps) {
    const {
        title,
        coverImage,
        steamAppId,
        winningRegion,
        savingsPercent,
        savingsInUSD,
        savingsInBRL,
        usDeal,
        brDeal,
        currencyRate,
        cachedAt,
        source,
    } = comparison;

    const isBrWinner = winningRegion === "BR";
    const isUsWinner = winningRegion === "US";
    const isEqual = winningRegion === "EQUAL";

    const formattedDate = new Date(cachedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const renderRegionCard = (
        deal: RegionDeal | null,
        region: "US" | "BR",
        isWinner: boolean,
    ) => {
        const isUS = region === "US";
        const flag = isUS ? "🇺🇸" : "🇧🇷";
        const regionName = isUS ? "Estados Unidos" : "Brasil";
        const currencyCode = isUS ? "USD" : "BRL";
        const oppositeCode = isUS ? "BRL" : "USD";
        const currencySymbol = isUS ? "$" : "R$";
        const oppositeSymbol = isUS ? "R$" : "$";

        if (!deal) {
            return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-theme/20 bg-zinc-950/60 p-8 text-center">
                    <p className="text-sm font-semibold text-zinc-400">
                        {flag} Nenhuma oferta oficial encontrada para {regionName}
                    </p>
                </div>
            );
        }

        const { bestStore, convertedPrice, allStores } = deal;
        const otherStores = (allStores || []).filter(
            (s) => s.storeName !== bestStore.storeName || s.currentPrice !== bestStore.currentPrice,
        );

        return (
            <div
                className={cn(
                    "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-500 backdrop-blur-xl",
                    isWinner
                        ? isUS
                            ? "border-cyan-500/80 bg-gradient-to-b from-cyan-950/30 via-zinc-950/90 to-zinc-950 shadow-[0_0_25px_rgba(6,182,212,0.2)]"
                            : "border-theme-primary bg-gradient-to-b from-fuchsia-950/30 via-zinc-950/90 to-zinc-950 theme-glow"
                        : "border-theme/30 bg-zinc-950/60 hover:border-theme/50",
                )}
            >
                {/* Winner ribbon if applicable */}
                {isWinner && (
                    <div
                        className={cn(
                            "absolute top-0 right-0 rounded-bl-xl px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-md",
                            isUS ? "bg-cyan-500 text-black" : "bg-theme-primary text-white",
                        )}
                    >
                        MELHOR OPÇÃO 🔥
                    </div>
                )}

                <div>
                    {/* Region Header */}
                    <div className="flex items-center justify-between border-b border-theme/20 pb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{flag}</span>
                            <div>
                                <h4 className="text-base font-extrabold text-white">
                                    {regionName} ({currencyCode})
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                    <Store className="h-3.5 w-3.5 text-theme-secondary" />
                                    <span>
                                        Loja: <strong className="text-zinc-200">{bestStore.storeName}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 rounded-full bg-zinc-900/90 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="h-3.5 w-3.5" /> Oficial
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className="my-6 space-y-2">
                        {bestStore.discountPercent > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 line-through">
                                    {currencySymbol} {bestStore.regularPrice.toFixed(2)}
                                </span>
                                <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-black text-emerald-400 border border-emerald-500/40">
                                    <TrendingDown className="h-3 w-3" /> -{bestStore.discountPercent}%
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-zinc-400">Preço Regular</span>
                        )}

                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight text-white">
                                {currencySymbol} {bestStore.currentPrice.toFixed(2)}
                            </span>
                        </div>

                        {/* Converted Equivalent Price */}
                        <div className="rounded-xl bg-zinc-900/70 p-2.5 border border-theme/20 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                Equivalente em {oppositeCode}:
                            </span>
                            <span className="text-xs font-black text-theme-secondary">
                                ≈ {oppositeSymbol} {convertedPrice.toFixed(2)}
                            </span>
                        </div>

                        {bestStore.voucher && (
                            <div className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-400 border border-amber-500/30">
                                Cupom: <strong>{bestStore.voucher}</strong>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Action Button */}
                    <Button
                        asChild
                        className={cn(
                            "h-11 w-full rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-lg transition-all duration-300",
                            isWinner
                                ? isUS
                                    ? "bg-cyan-500 text-black hover:bg-cyan-400"
                                    : "bg-theme-primary text-white hover:bg-theme-primary/90"
                                : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white",
                        )}
                    >
                        <a
                            href={bestStore.url || `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                        >
                            <span>Comprar na {bestStore.storeName}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </Button>

                    {/* Secondary Stores List if available */}
                    {otherStores.length > 0 && (
                        <div className="border-t border-theme/20 pt-3">
                            <p className="mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Outras Lojas Oficiais ({otherStores.length}):
                            </p>
                            <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                {otherStores.map((store, idx) => (
                                    <a
                                        key={idx}
                                        href={store.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded-lg bg-zinc-900/40 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                                    >
                                        <span className="truncate">{store.storeName}</span>
                                        <span className="font-bold text-zinc-300">
                                            {currencySymbol} {store.currentPrice.toFixed(2)}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="glass-card border border-theme bg-theme-card relative overflow-hidden rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            {/* Top Bar Header */}
            <div className="flex flex-col gap-4 border-b border-theme/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    {coverImage && (
                        <div className="relative h-16 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-theme/30 bg-zinc-900 shadow-md">
                            <Image
                                src={coverImage}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="128px"
                                unoptimized
                            />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                {title}
                            </h3>
                            {steamAppId && (
                                <span className="rounded-lg bg-zinc-900 px-2 py-0.5 text-[11px] font-bold text-zinc-400 border border-theme/20">
                                    App #{steamAppId}
                                </span>
                            )}
                            {comparison.isAllTimeLow && (
                                <span className="flex items-center gap-1 rounded-lg bg-amber-500/90 px-2 py-0.5 text-[11px] font-black text-black shadow-md">
                                    <Trophy className="h-3 w-3" /> Recorde Histórico
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400 flex items-center gap-2">
                            <span>Fonte: <strong className="text-theme-primary uppercase">{source}</strong></span>
                            <span>•</span>
                            <span>Atualizado às {formattedDate}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-theme/30 bg-zinc-900/80 px-3.5 py-1.5 text-right">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Câmbio Comercial
                        </span>
                        <div className="text-sm font-black text-emerald-400 flex items-center justify-end gap-1">
                            <span>1 USD = R$ {currencyRate.rate.toFixed(2)}</span>
                            {currencyRate.isFallback && (
                                <span className="text-[10px] text-amber-400 font-normal">(offline)</span>
                            )}
                        </div>
                    </div>

                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="rounded-xl border border-theme/30 text-zinc-400 hover:border-theme-primary hover:text-white"
                            title="Recarregar cotação e preços"
                        >
                            <RefreshCw
                                className={cn("h-4 w-4", isRefreshing && "animate-spin text-theme-primary")}
                            />
                        </Button>
                    )}
                </div>
            </div>

            {/* Winner Banner */}
            <div className="my-6">
                {isBrWinner && (
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/60 bg-gradient-to-r from-emerald-950/50 via-zinc-950/80 to-emerald-950/50 p-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-black shadow-md">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                        Vencedor do Confronto Regional
                                    </span>
                                    <h4 className="text-base font-black text-white flex items-center gap-2">
                                        🇧🇷 Melhor Comprar no Brasil!
                                    </h4>
                                </div>
                            </div>

                            <div className="rounded-xl bg-black/50 px-3.5 py-1.5 text-right border border-emerald-500/30">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                    Economia Estimada
                                </span>
                                <span className="text-sm font-black text-white">
                                    R$ {savingsInBRL.toFixed(2)}{" "}
                                    <span className="text-xs text-zinc-400 font-normal">
                                        (${savingsInUSD.toFixed(2)} USD)
                                    </span>{" "}
                                    <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400 font-black">
                                        -{savingsPercent}%
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {isUsWinner && (
                    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/60 bg-gradient-to-r from-cyan-950/50 via-zinc-950/80 to-cyan-950/50 p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-black shadow-md">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                                        Vencedor do Confronto Regional
                                    </span>
                                    <h4 className="text-base font-black text-white flex items-center gap-2">
                                        🇺🇸 Melhor Comprar nos EUA!
                                    </h4>
                                </div>
                            </div>

                            <div className="rounded-xl bg-black/50 px-3.5 py-1.5 text-right border border-cyan-500/30">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                                    Economia Estimada
                                </span>
                                <span className="text-sm font-black text-white">
                                    ${savingsInUSD.toFixed(2)} USD{" "}
                                    <span className="text-xs text-zinc-400 font-normal">
                                        (R$ {savingsInBRL.toFixed(2)})
                                    </span>{" "}
                                    <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-400 font-black">
                                        -{savingsPercent}%
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {isEqual && (
                    <div className="rounded-2xl border border-theme/20 bg-zinc-900/60 p-3 text-center">
                        <h4 className="text-xs font-bold text-zinc-200 flex items-center justify-center gap-2">
                            🤝 Preços Praticamente Idênticos nas Duas Regiões
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                            A diferença cambial é menor que US$ 0.05. Compre na conta que preferir!
                        </p>
                    </div>
                )}
            </div>

            {/* Side-by-side Regional Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderRegionCard(usDeal, "US", isUsWinner)}
                {renderRegionCard(brDeal, "BR", isBrWinner)}
            </div>

            {/* Steam Family Tip */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-theme/20 bg-theme-primary/5 p-3.5 text-xs text-zinc-300">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-theme-primary/20 text-theme-primary mt-0.5">
                    <Info className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                    <p className="font-bold text-white">
                        Dica Steam Family:
                    </p>
                    <p className="text-zinc-400 text-[11px]">
                        Comprando na região vencedora ({isBrWinner ? "Brasil 🇧🇷" : isUsWinner ? "EUA 🇺🇸" : "Qualquer uma"}), o jogo fica imediatamente disponível na biblioteca compartilhada de todos os membros da família.
                    </p>
                </div>
            </div>
        </div>
    );
}
