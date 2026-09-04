"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    Sparkles,
    RefreshCw,
    Flame,
    Radar,
    ThumbsUp,
    Heart,
    ExternalLink,
    Check,
    Gamepad2,
    Crown,
    Gem,
    Compass,
} from "lucide-react";
import {
    OracleGameRecommendation,
    OracleRecommendationsResponse,
    OracleGameTier,
} from "@/types/deals";
import { cn } from "@/lib/utils";

interface DealOracleSectionProps {
    onToggleTrack?: (deal: {
        id: string;
        title: string;
        steamAppId?: number | null;
        slug?: string;
        coverImage?: string | null;
    }) => void;
    isTracked?: (idOrAppId: string | number) => boolean;
}

export function DealOracleSection({ onToggleTrack, isTracked }: DealOracleSectionProps) {
    const [data, setData] = useState<OracleRecommendationsResponse | null>(null);
    const [hasConsulted, setHasConsulted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"on_sale" | "on_radar">("on_sale");
    const [dismissedTitles, setDismissedTitles] = useState<Set<string>>(new Set());
    const [justDismissedTitle, setJustDismissedTitle] = useState<string | null>(null);

    // Consulta on-demand ao clicar
    const handleConsult = async (forceRefresh: boolean = false) => {
        try {
            if (forceRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const url = forceRefresh ? "/api/deals/oracle?forceRefresh=true" : "/api/deals/oracle";
            const res = await fetch(url, {
                method: forceRefresh ? "POST" : "GET",
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setData(json);
                    setHasConsulted(true);
                    if (forceRefresh) {
                        setDismissedTitles(new Set());
                    }
                    if (json.onSale?.length === 0 && json.onRadar?.length > 0) {
                        setActiveTab("on_radar");
                    }
                }
            }
        } catch (err) {
            console.error("[DealOracleSection] Failed to load oracle:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Marcar como "Já joguei esse"
    const handleDismiss = async (game: OracleGameRecommendation) => {
        setDismissedTitles((prev) => new Set([...prev, game.title.toLowerCase().trim()]));
        setJustDismissedTitle(game.title);
        setTimeout(() => setJustDismissedTitle(null), 3000);

        try {
            await fetch("/api/deals/oracle/dismiss", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: game.title,
                    steamAppId: game.steamAppId,
                }),
            });
        } catch (err) {
            console.error("[DealOracleSection] Failed to dismiss game:", err);
        }
    };

    const currentItems = (activeTab === "on_sale" ? data?.onSale : data?.onRadar) || [];
    const visibleItems = currentItems.filter(
        (item) => !dismissedTitles.has(item.title.toLowerCase().trim()),
    );

    const onSaleCount =
        data?.onSale?.filter((i) => !dismissedTitles.has(i.title.toLowerCase().trim())).length || 0;
    const onRadarCount =
        data?.onRadar?.filter((i) => !dismissedTitles.has(i.title.toLowerCase().trim())).length || 0;

    const renderTierBadge = (tier: OracleGameTier) => {
        switch (tier) {
            case "AAA":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-bold text-purple-300 shadow-sm">
                        <Crown className="h-3 w-3 text-purple-400" />
                        AAA Blockbuster
                    </span>
                );
            case "INDIE":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shadow-sm">
                        <Gamepad2 className="h-3 w-3 text-emerald-400" />
                        Indie de Ouro
                    </span>
                );
            case "HIDDEN_GEM":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 shadow-sm">
                        <Gem className="h-3 w-3 text-amber-400" />
                        Gema Oculta
                    </span>
                );
        }
    };

    // Estado 1: Tela de Entrada On-Demand (antes da consulta)
    if (!hasConsulted && !isLoading) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-[#bd0df2]/40 bg-zinc-950/85 p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-[#bd0df2]/15 text-center transition-all my-2">
                <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-[#bd0df2]/20 blur-3xl" />

                <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto">
                    <div className="flex items-center justify-center h-14 w-14 rounded-2xl border border-[#bd0df2]/50 bg-[#bd0df2]/15 text-[#bd0df2] mb-4 shadow-lg shadow-[#bd0df2]/20 animate-pulse">
                        <Sparkles className="h-7 w-7 text-white" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-md border border-[#bd0df2]/50 bg-[#bd0df2]/20 px-3 py-1 text-xs font-black tracking-wide text-white uppercase shadow-sm mb-2">
                        Oráculo da Guilda
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Garimpo Personalizado com IA
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                        A IA cruza o seu histórico de jogos favoritos e tempo livre para minerar{" "}
                        <strong className="text-white">10 títulos sob medida</strong> divididos em{" "}
                        <strong className="text-purple-400">3 Superproduções AAA</strong>,{" "}
                        <strong className="text-emerald-400">4 Grandes Indies</strong> e{" "}
                        <strong className="text-amber-400">3 Gemas Ocultas</strong>, checando os
                        preços ao vivo na Steam.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleConsult(false)}
                            className="inline-flex items-center gap-2.5 rounded-xl border border-[#bd0df2] bg-[#bd0df2] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#bd0df2]/30 transition-all hover:bg-[#a00bd0] hover:scale-105 active:scale-95"
                        >
                            <Compass className="h-4 w-4" />
                            <span>✨ Consultar Oráculo da Guilda</span>
                        </button>
                    </div>

                    <p className="text-[11px] text-zinc-500 mt-3">
                        Leva ~1 segundo • Sem jogos live-service ou grind infinito • Preços checados na Steam
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-[#bd0df2]/30 bg-zinc-950/80 p-4 sm:p-6 backdrop-blur-xl shadow-2xl shadow-[#bd0df2]/10 transition-all my-2">
            {/* Efeito sutil de iluminação neon no topo */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-[#bd0df2]/15 blur-3xl" />

            {/* Cabeçalho da Seção */}
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#bd0df2]/50 bg-[#bd0df2]/20 px-2.5 py-1 text-xs font-black tracking-wide text-white uppercase shadow-sm">
                            <Sparkles className="h-3.5 w-3.5 text-[#bd0df2] animate-pulse" />
                            Oráculo da Guilda
                        </span>
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-bold text-zinc-400">
                            IA Curadora
                        </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        Garimpo Inteligente pro seu Perfil
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 max-w-2xl">
                        A IA minerou 10 títulos sob medida pro seu tempo livre:{" "}
                        <strong className="text-purple-400">AAA</strong>,{" "}
                        <strong className="text-emerald-400">Grandes Indies</strong> e{" "}
                        <strong className="text-amber-400">Pérolas Cult</strong>.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => handleConsult(true)}
                        disabled={isRefreshing || isLoading}
                        className={cn(
                            "flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs font-bold text-zinc-200 transition-all hover:border-[#bd0df2]/60 hover:text-white hover:bg-zinc-800 shadow-sm",
                            isRefreshing && "opacity-60 cursor-not-allowed",
                        )}
                        title="Sortear novo leque de recomendações com a IA"
                    >
                        <RefreshCw
                            className={cn("h-3.5 w-3.5 text-[#bd0df2]", isRefreshing && "animate-spin")}
                        />
                        <span>{isRefreshing ? "Minerando..." : "Sortear Novas Dicas"}</span>
                    </button>
                </div>
            </div>

            {/* Notificação toast rápida de jogo descartado */}
            {justDismissedTitle && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 animate-in fade-in slide-in-from-top-1">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>
                        <strong className="text-white">"{justDismissedTitle}"</strong> foi marcado como
                        já jogado. O Oráculo não irá mais recomendá-lo!
                    </span>
                </div>
            )}

            <div className="mt-4 space-y-4">
                {/* Seletor de Sub-Abas (No Preço vs No Radar) */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("on_sale")}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border",
                            activeTab === "on_sale"
                                ? "border-orange-500/50 bg-orange-500/15 text-orange-300 shadow-sm"
                                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                        )}
                    >
                        <Flame className="h-3.5 w-3.5 text-orange-400" />
                        <span>🔥 No Preço! Em Promoção</span>
                        <span className="ml-1 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-black text-orange-300">
                            {onSaleCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("on_radar")}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border",
                            activeTab === "on_radar"
                                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-sm"
                                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                        )}
                    >
                        <Radar className="h-3.5 w-3.5 text-cyan-400" />
                        <span>📡 No seu Radar (Preço Normal)</span>
                        <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-black text-cyan-300">
                            {onRadarCount}
                        </span>
                    </button>
                </div>

                {/* Estado de Carregamento Skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {[1, 2, 3].map((n) => (
                            <div
                                key={n}
                                className="h-64 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse p-4 flex flex-col justify-between"
                            >
                                <div className="h-32 rounded-lg bg-zinc-800/60" />
                                <div className="space-y-2 mt-3">
                                    <div className="h-4 w-3/4 rounded bg-zinc-800" />
                                    <div className="h-3 w-1/2 rounded bg-zinc-800/50" />
                                </div>
                                <div className="h-8 rounded bg-zinc-800/80 mt-4" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Lista de Cards */}
                {!isLoading && visibleItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {visibleItems.map((game, idx) => {
                            const gameDealId = game.steamAppId ? `steam-${game.steamAppId}` : game.title;
                            const favorited = isTracked
                                ? isTracked(game.steamAppId || gameDealId)
                                : false;

                            return (
                                <div
                                    key={`${game.title}-${idx}`}
                                    className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 transition-all hover:border-[#bd0df2]/50 hover:bg-zinc-900 hover:shadow-xl hover:shadow-[#bd0df2]/5"
                                >
                                    <div>
                                        {/* Capa com Imagem e Tier Badge */}
                                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-zinc-950">
                                            {game.coverImage ? (
                                                <Image
                                                    src={game.coverImage}
                                                    alt={game.title}
                                                    fill
                                                    unoptimized
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-600">
                                                    <Gamepad2 className="h-10 w-10" />
                                                </div>
                                            )}

                                            <div className="absolute top-2 left-2 z-10">
                                                {renderTierBadge(game.tier)}
                                            </div>

                                            {/* Preço e Desconto em Destaque na Capa */}
                                            <div className="absolute bottom-2 right-2 z-10">
                                                {game.isOnSale ? (
                                                    <div className="flex items-center gap-1.5 rounded-lg bg-black/90 px-2 py-1 backdrop-blur-md border border-emerald-500/40 shadow-md">
                                                        <span className="rounded bg-emerald-500 px-1 py-0.2 text-[10px] font-black text-black">
                                                            -{game.discountPercent}%
                                                        </span>
                                                        <span className="text-xs font-black text-emerald-400">
                                                            R$ {game.priceBR?.toFixed(2).replace(".", ",")}
                                                        </span>
                                                    </div>
                                                ) : game.priceBR !== undefined && game.priceBR > 0 ? (
                                                    <div className="rounded-lg bg-black/80 px-2 py-1 backdrop-blur-md border border-zinc-700/60 text-xs font-bold text-zinc-300">
                                                        R$ {game.priceBR?.toFixed(2).replace(".", ",")}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        {/* Título e Avaliação */}
                                        <div className="mt-3">
                                            <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1 group-hover:text-[#bd0df2] transition-colors">
                                                {game.title}
                                            </h4>

                                            {/* Badge de Avaliação Steam */}
                                            {game.steamReviews && (
                                                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                                                    <ThumbsUp className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                                    <span className="font-semibold text-emerald-300">
                                                        {game.steamReviews.positivePercent}%
                                                    </span>
                                                    <span className="line-clamp-1 text-[11px] text-zinc-400">
                                                        ({game.steamReviews.reviewScoreDesc})
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pitch do Oráculo */}
                                        <div className="mt-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs text-zinc-300">
                                            <p className="line-clamp-3 leading-relaxed">
                                                <span className="text-[#bd0df2] font-black mr-1">“</span>
                                                {game.pitch}
                                                <span className="text-[#bd0df2] font-black ml-1">”</span>
                                            </p>
                                            {game.highlightReason && (
                                                <p className="mt-1.5 text-[11px] font-bold text-zinc-400 line-clamp-1">
                                                    ✦ {game.highlightReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Barra de Ações Rápidas */}
                                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                                        {/* Botão Já Joguei */}
                                        <button
                                            type="button"
                                            onClick={() => handleDismiss(game)}
                                            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
                                            title="Ocultar jogo e ensinar a IA que você já jogou"
                                        >
                                            <Check className="h-3 w-3" />
                                            <span>Já joguei</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {/* Botão Monitorar Preço */}
                                            {onToggleTrack && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onToggleTrack({
                                                            id: gameDealId,
                                                            title: game.title,
                                                            steamAppId: game.steamAppId || null,
                                                            coverImage: game.coverImage,
                                                        })
                                                    }
                                                    className={cn(
                                                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all border",
                                                        favorited
                                                            ? "border-pink-500/50 bg-pink-500/20 text-pink-300"
                                                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30",
                                                    )}
                                                    title={
                                                        favorited
                                                            ? "Remover dos Favoritos"
                                                            : "Adicionar aos Favoritos para monitorar preço"
                                                    }
                                                >
                                                    <Heart
                                                        className={cn(
                                                            "h-3 w-3",
                                                            favorited && "fill-pink-400 text-pink-400",
                                                        )}
                                                    />
                                                    <span>{favorited ? "Salvo" : "Monitorar"}</span>
                                                </button>
                                            )}

                                            {/* Link da Steam */}
                                            {game.dealUrl && (
                                                <a
                                                    href={game.dealUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-[11px] font-bold text-white hover:border-zinc-500 hover:bg-zinc-700 transition-all shadow-sm"
                                                >
                                                    <span>Steam</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State se todos os jogos foram descartados */}
                {!isLoading && visibleItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8 text-center">
                        <Sparkles className="h-8 w-8 text-[#bd0df2]/60 mb-2" />
                        <h4 className="text-sm font-bold text-white">
                            {activeTab === "on_sale"
                                ? "Nenhum jogo em promoção nesta rodada"
                                : "Nenhum jogo no radar restante"}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                            {activeTab === "on_sale"
                                ? "Confira a aba 'No seu Radar' para ver outros achados que combinam com seu perfil ou clique em 'Sortear Novas Dicas'."
                                : "Clique em 'Sortear Novas Dicas' para o Oráculo garimpar mais recomendações inéditas!"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
