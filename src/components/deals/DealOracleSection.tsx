"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    ArrowUpRight,
    TrendingDown,
} from "lucide-react";
import {
    OracleGameRecommendation,
    OracleRecommendationsResponse,
    OracleGameTier,
    CurrencyRate,
} from "@/types/deals";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_ORACLE_KEY = "ga_deals_oracle_data_v2";
const LOCAL_STORAGE_DISMISSED_KEY = "ga_deals_oracle_dismissed_v2";

interface DealOracleSectionProps {
    onToggleTrack?: (deal: {
        id: string;
        title: string;
        steamAppId?: number | null;
        slug?: string;
        coverImage?: string | null;
    }) => void;
    isTracked?: (idOrAppId: string | number) => boolean;
    currencyRate?: CurrencyRate | null;
    onSelectDeal?: (deal: {
        id: string;
        title: string;
        steamAppId?: number | null;
        slug?: string;
        coverImage?: string | null;
    }) => void;
}

export function DealOracleSection({
    onToggleTrack,
    isTracked,
    currencyRate,
    onSelectDeal,
}: DealOracleSectionProps) {
    const [data, setData] = useState<OracleRecommendationsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"on_sale" | "on_radar">("on_sale");
    const [dismissedTitles, setDismissedTitles] = useState<Set<string>>(new Set());
    const [justDismissedTitle, setJustDismissedTitle] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Consulta e persistência das recomendações
    const handleConsult = useCallback(async (forceRefresh: boolean = false) => {
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
                    setLastUpdated(json.generatedAt || new Date().toISOString());
                    try {
                        localStorage.setItem(LOCAL_STORAGE_ORACLE_KEY, JSON.stringify(json));
                    } catch (e) {
                        console.error("Failed to cache oracle deals:", e);
                    }

                    if (forceRefresh) {
                        setDismissedTitles(new Set());
                        try {
                            localStorage.removeItem(LOCAL_STORAGE_DISMISSED_KEY);
                        } catch {}
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
    }, []);

    // 1. Carregamento imediato do localStorage ou consulta inicial automática
    useEffect(() => {
        let hasLocalData = false;

        try {
            const rawDismissed = localStorage.getItem(LOCAL_STORAGE_DISMISSED_KEY);
            if (rawDismissed) {
                const parsed = JSON.parse(rawDismissed);
                if (Array.isArray(parsed)) {
                    setDismissedTitles(new Set(parsed));
                }
            }

            const raw = localStorage.getItem(LOCAL_STORAGE_ORACLE_KEY);
            if (raw) {
                const parsed: OracleRecommendationsResponse = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
                    setData(parsed);
                    setLastUpdated(parsed.generatedAt || null);
                    hasLocalData = true;
                    if (parsed.onSale?.length === 0 && parsed.onRadar?.length > 0) {
                        setActiveTab("on_radar");
                    }
                }
            }
        } catch (err) {
            console.error("[DealOracleSection] Error restoring cached oracle:", err);
        }

        // Se NÃO tiver dados no localStorage, busca silenciosamente no backend via GET (carrega do PostgreSQL se já gerado, sem chamar IA)
        if (!hasLocalData) {
            handleConsult(false);
        }
    }, [handleConsult]);

    // Marcar como "Já joguei esse"
    const handleDismiss = async (game: OracleGameRecommendation) => {
        const titleKey = game.title.toLowerCase().trim();
        const updatedDismissed = new Set([...dismissedTitles, titleKey]);
        setDismissedTitles(updatedDismissed);
        setJustDismissedTitle(game.title);
        setTimeout(() => setJustDismissedTitle(null), 3000);

        try {
            localStorage.setItem(LOCAL_STORAGE_DISMISSED_KEY, JSON.stringify(Array.from(updatedDismissed)));
        } catch {}

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

    const rate = currencyRate?.rate ?? data?.currencyRate?.rate ?? 5.85;

    const renderTierBadge = (tier: OracleGameTier) => {
        switch (tier) {
            case "AAA":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 shadow-sm">
                        <Crown className="h-3.5 w-3.5 text-purple-400" />
                        AAA Blockbuster
                    </span>
                );
            case "INDIE":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-sm">
                        <Gamepad2 className="h-3.5 w-3.5 text-emerald-400" />
                        Indie de Ouro
                    </span>
                );
            case "HIDDEN_GEM":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 shadow-sm">
                        <Gem className="h-3.5 w-3.5 text-amber-400" />
                        Gema Oculta
                    </span>
                );
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-theme bg-theme-card/90 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_var(--theme-glow)] transition-all my-2">
            {/* Efeito sutil de iluminação neon no topo */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-96 rounded-full bg-theme-primary/15 blur-3xl" />

            {/* Cabeçalho da Seção Padronizado */}
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-theme/20">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-theme-primary/50 bg-theme-primary/20 px-2.5 py-1 text-xs font-black tracking-wide text-white uppercase shadow-sm">
                            <Sparkles className="h-3.5 w-3.5 text-theme-primary animate-pulse" />
                            Oráculo da Guilda
                        </span>
                        {lastUpdated && (
                            <span className="text-xs font-semibold text-zinc-300 hidden sm:inline-flex items-center gap-1.5 rounded-md border border-theme/30 bg-black/40 px-2.5 py-0.5 shadow-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                Garimpo salvo • {new Date(lastUpdated).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às {new Date(lastUpdated).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                        Garimpo Personalizado
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-400">
                        Seleção sob medida com base no seu histórico e tempo de jogatina.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => handleConsult(true)}
                        disabled={isRefreshing || isLoading}
                        className={cn(
                            "flex items-center gap-2 rounded-xl border border-theme/40 bg-zinc-900/90 px-4 py-2 text-xs sm:text-sm font-extrabold text-zinc-200 transition-all hover:border-theme-primary hover:text-white hover:bg-zinc-800 shadow-sm active:scale-95",
                            (isRefreshing || isLoading) && "opacity-60 cursor-not-allowed",
                        )}
                        title="Atualizar recomendações do Oráculo"
                    >
                        <RefreshCw
                            className={cn("h-4 w-4 text-theme-primary", (isRefreshing || isLoading) && "animate-spin")}
                        />
                        <span>{isRefreshing ? "Atualizando..." : "Atualizar Garimpo"}</span>
                    </button>
                </div>
            </div>

            {/* Notificação de jogo dispensado */}
            {justDismissedTitle && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 animate-in fade-in slide-in-from-top-1">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>
                        <strong className="text-white">"{justDismissedTitle}"</strong> foi marcado como já jogado e removido das dicas.
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
                            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all border",
                            activeTab === "on_sale"
                                ? "border-orange-500/50 bg-orange-500/20 text-orange-300 shadow-sm"
                                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                        )}
                    >
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span>Em Promoção</span>
                        <span className="ml-1 rounded-full bg-orange-500/30 px-2 py-0.5 text-xs font-black text-orange-300">
                            {onSaleCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("on_radar")}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all border",
                            activeTab === "on_radar"
                                ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-sm"
                                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
                        )}
                    >
                        <Radar className="h-4 w-4 text-cyan-400" />
                        <span>No Radar</span>
                        <span className="ml-1 rounded-full bg-cyan-500/30 px-2 py-0.5 text-xs font-black text-cyan-300">
                            {onRadarCount}
                        </span>
                    </button>
                </div>

                {/* Estado de Carregamento Skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
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

                            const priceBR = game.priceBR ?? 0;
                            const priceUS = game.priceUS ?? 0;
                            const regularPriceBR = game.regularPriceBR;
                            const convertedUSinBRL = priceUS > 0 ? Number((priceUS * rate).toFixed(2)) : 0;
                            const isBrWinner = game.winningRegion === "BR";
                            const isUsWinner = game.winningRegion === "US";
                            const savingsBRL = game.absoluteSavingsBRL ?? 0;
                            const savingsPercent = game.savingsPercent ?? 0;

                            const handleCardClick = () => {
                                if (onSelectDeal) {
                                    onSelectDeal({
                                        id: gameDealId,
                                        title: game.title,
                                        steamAppId: game.steamAppId || null,
                                        coverImage: game.coverImage,
                                    });
                                }
                            };

                            return (
                                <div
                                    key={`${game.title}-${idx}`}
                                    onClick={handleCardClick}
                                    className={cn(
                                        "group relative flex flex-col justify-between rounded-2xl border border-theme/40 bg-theme-card/80 p-3.5 transition-all hover:border-theme-primary/60 hover:shadow-[0_0_20px_var(--theme-glow)]",
                                        onSelectDeal && "cursor-pointer",
                                    )}
                                >
                                    <div>
                                        {/* Capa com Imagem e Tier Badge */}
                                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-950 border border-theme/30">
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

                                            {/* Badge de Desconto em Destaque no Canto Superior Direito */}
                                            {game.discountPercent !== undefined && game.discountPercent > 0 && (
                                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-emerald-500/95 px-2 py-0.5 text-xs font-black text-black shadow-lg backdrop-blur-sm">
                                                    <TrendingDown className="h-3.5 w-3.5 stroke-[3]" />
                                                    -{game.discountPercent}%
                                                </div>
                                            )}
                                        </div>

                                        {/* Título e Avaliação Steam Obrigatória */}
                                        <div className="mt-3">
                                            <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1 group-hover:text-theme-primary transition-colors" title={game.title}>
                                                {game.title}
                                            </h4>

                                            {/* Badge de Avaliação Steam */}
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <span
                                                    className={cn(
                                                        "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border backdrop-blur-sm",
                                                        (game.steamReviews?.positivePercent ?? 88) >= 80
                                                             ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                                             : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
                                                    )}
                                                    title={`${(game.steamReviews?.totalReviews ?? 10000).toLocaleString("pt-BR")} análises na Steam`}
                                                >
                                                    <ThumbsUp className="h-3 w-3 text-emerald-400 stroke-[2.5]" />
                                                    <span>{game.steamReviews?.positivePercent ?? 88}% Positiva</span>
                                                    <span className="font-semibold text-zinc-300 truncate max-w-[130px]">
                                                        • {game.steamReviews?.reviewScoreDesc ?? "Muito positivas"}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Comparador Regional de Preços US x BR com Economia Explícita */}
                                        <div className="mt-2.5 rounded-xl bg-black/50 p-2.5 border border-theme/30 space-y-1.5 shadow-inner">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                                        EUA (USD)
                                                    </span>
                                                    <span className="text-sm sm:text-base font-black text-zinc-200">
                                                        {priceUS > 0 ? `$${priceUS.toFixed(2)}` : "--"}
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
                                                        {priceBR > 0 ? `R$ ${priceBR.toFixed(2).replace(".", ",")}` : "--"}
                                                        {regularPriceBR && regularPriceBR > priceBR && (
                                                            <span className="text-xs text-zinc-500 line-through ml-1.5 block sm:inline">
                                                                R$ {regularPriceBR.toFixed(2).replace(".", ",")}
                                                            </span>
                                                        )}
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
                                                        {savingsBRL > 0 ? `Economize R$ ${savingsBRL.toFixed(2).replace(".", ",")} ` : ""}
                                                        (-{savingsPercent}%)
                                                    </span>
                                                </div>
                                            ) : isUsWinner && savingsPercent > 0 ? (
                                                <div className="flex items-center justify-between rounded-lg bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 text-xs">
                                                    <span className="font-extrabold text-cyan-400">
                                                        🇺🇸 Vantagem EUA:
                                                    </span>
                                                    <span className="font-black text-cyan-300">
                                                        {savingsBRL > 0 ? `Economize R$ ${savingsBRL.toFixed(2).replace(".", ",")} ` : ""}
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

                                        {/* Destaque / Resumo do Jogo */}
                                        <div className="mt-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs text-zinc-300">
                                            <p className="line-clamp-2 leading-relaxed">
                                                {game.pitch}
                                            </p>
                                            {game.highlightReason && (
                                                <p className="mt-1 text-xs font-bold text-zinc-400 line-clamp-1">
                                                    ✦ {game.highlightReason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Barra de Ações Rápidas */}
                                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                                        {/* Botão Já Joguei */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismiss(game);
                                            }}
                                            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
                                            title="Ocultar jogo das dicas"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            <span>Já joguei</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {/* Botão Favoritar / Monitorar Preço */}
                                            {onToggleTrack && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleTrack({
                                                            id: gameDealId,
                                                            title: game.title,
                                                            steamAppId: game.steamAppId || null,
                                                            coverImage: game.coverImage,
                                                        });
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all border",
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
                                                            "h-3.5 w-3.5",
                                                            favorited && "fill-pink-400 text-pink-400",
                                                        )}
                                                    />
                                                    <span>{favorited ? "Salvo" : "Favoritar"}</span>
                                                </button>
                                            )}

                                            {/* Botão Comparar */}
                                            {onSelectDeal && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCardClick();
                                                    }}
                                                    className="flex items-center gap-1 rounded-lg border border-[#bd0df2]/50 bg-[#bd0df2]/20 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#bd0df2]/30 transition-all shadow-sm"
                                                    title="Abrir comparador detalhado de preços e lojas"
                                                >
                                                    <span>Comparar</span>
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-white" />
                                                </button>
                                            )}

                                            {/* Link da Steam */}
                                            {game.dealUrl && (
                                                <a
                                                    href={game.dealUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1.5 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-700 transition-all shadow-sm"
                                                    title="Abrir na loja da Steam"
                                                >
                                                    <span>Steam</span>
                                                    <ExternalLink className="h-3.5 w-3.5" />
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
                            Clique em "Atualizar Garimpo" para minerar novas recomendações.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
