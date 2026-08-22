"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewCard } from "./ReviewCard";
import { AddReviewModal } from "./AddReviewModal";
import {
    Grid,
    List,
    Search,
    Star,
    Camera,
    Award,
    SlidersHorizontal,
    Gamepad2,
} from "lucide-react";

import { ReviewCardProps } from "./ReviewCard";

export interface ReviewsClientProps {
    reviews: ReviewCardProps["review"][];
    games: {
        id: string;
        title: string;
        cover_url?: string | null;
        platform?: string | null;
        quest_type?: string;
    }[];
    currentUserId?: string;
}

export function ReviewsClient({ reviews, games, currentUserId }: ReviewsClientProps) {
    const searchParams = useSearchParams();
    const paramType = searchParams.get("type");
    const paramUser = searchParams.get("user");
    const paramSearch = searchParams.get("search");

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState(() => paramSearch || "");
    const [filterType, setFilterType] = useState<"ALL" | "MAIN_QUEST" | "SIDE_QUEST">(() => {
        if (paramType === "MAIN_QUEST" || paramType === "SIDE_QUEST") {
            return paramType;
        }
        return "ALL";
    });
    const [sortBy, setSortBy] = useState<"NEWEST" | "HIGHEST_RATED">("NEWEST");
    const [filterUser, setFilterUser] = useState<string>(paramUser || "ALL");

    // Extract unique users
    const uniqueUsers = useMemo(() => {
        return Array.from(
            new Map(
                reviews.map((r) => [
                    r.user_id,
                    { id: r.user_id, name: r.user?.name, username: r.user?.username },
                ])
            ).values()
        );
    }, [reviews]);

    // Guild Stats summary
    const stats = useMemo(() => {
        const total = reviews.length;
        if (total === 0) return { total: 0, avgRating: 0, totalScreenshots: 0 };
        const avg = reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total;
        const screenshotsCount = reviews.reduce(
            (acc, r) => acc + (r.screenshots?.length || 0),
            0
        );
        return {
            total,
            avgRating: avg.toFixed(1),
            totalScreenshots: screenshotsCount,
        };
    }, [reviews]);

    // Filter and Sort reviews
    const filteredReviews = useMemo(() => {
        return reviews
            .filter((review) => {
                if (filterType !== "ALL" && review.game?.quest_type !== filterType) return false;
                if (filterUser !== "ALL" && review.user_id !== filterUser) return false;
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase();
                    const titleMatch = review.game?.title?.toLowerCase().includes(query);
                    const textMatch = review.review_text?.toLowerCase().includes(query);
                    const authorMatch = (review.user?.name || review.user?.username || "")
                        .toLowerCase()
                        .includes(query);
                    return titleMatch || textMatch || authorMatch;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "HIGHEST_RATED") {
                    if (b.rating === a.rating) {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                    return b.rating - a.rating;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [reviews, filterType, filterUser, searchQuery, sortBy]);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />

            <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col px-2 sm:px-6 py-4 sm:py-8 md:px-8 lg:px-12 lg:py-12">
                {/* Hero Header Section (Padrão do Aplicativo) */}
                <div className="mb-6 sm:mb-10 flex flex-col justify-between gap-5 sm:gap-6 md:flex-row md:items-end">
                    <div className="space-y-1.5 sm:space-y-3">
                        <h2 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow-md sm:text-4xl md:text-5xl">
                            Game Reviews
                        </h2>
                        <p className="max-w-2xl text-sm sm:text-lg font-medium text-zinc-400">
                            Honest takes from the retired vanguard of the golden era.
                        </p>
                    </div>

                    <AddReviewModal games={games} />
                </div>
                {/* Filters & Control Bar Component (Padronizado com o Tema do Aplicativo) */}
                <div className="glass-card border border-theme bg-theme-card mb-8 flex flex-col gap-4 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
                    
                    {/* Faixa de Estatísticas Rápidas da Guilda */}
                    <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-theme/20">
                        <div className="flex items-center gap-2 rounded-xl border border-theme/30 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-bold text-zinc-300">
                            <Award className="h-4 w-4 text-amber-400" />
                            <span>Reviews: <strong className="text-white">{stats.total}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-theme/30 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-bold text-zinc-300">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span>Média Guilda: <strong className="text-amber-300">{stats.avgRating}/10</strong></span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-theme/30 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-bold text-zinc-300">
                            <Camera className="h-4 w-4 text-emerald-400" />
                            <span>Capturas: <strong className="text-emerald-400">{stats.totalScreenshots} prints</strong></span>
                        </div>
                    </div>

                    {/* Linha de Busca e Filtro de Quests */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Campo de Busca */}
                        <div className="relative flex-1 min-w-0 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                aria-label="Buscar por jogo, usuário ou palavra-chave"
                                placeholder="Buscar por jogo, usuário ou palavra-chave..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-theme/30 bg-zinc-900/80 py-2.5 pl-11 pr-4 text-sm font-medium text-white placeholder-zinc-500 transition-colors focus:border-theme-primary focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 hover:text-white"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>

                        {/* Botões de Filtro de Quest */}
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar no-scrollbar pb-1 lg:pb-0 w-full lg:w-auto">
                            <button
                                onClick={() => setFilterType("ALL")}
                                className={`rounded-xl border px-3 sm:px-4 py-2 text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap shrink-0 ${
                                    filterType === "ALL"
                                        ? "border-theme-primary/60 bg-theme-primary/15 text-theme-primary shadow-[0_0_15px_var(--theme-glow)]"
                                        : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                }`}
                            >
                                Todas Quests
                            </button>
                            <button
                                onClick={() => setFilterType("MAIN_QUEST")}
                                className={`rounded-xl border px-3 sm:px-4 py-2 text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap shrink-0 ${
                                    filterType === "MAIN_QUEST"
                                        ? "border-amber-400/60 bg-amber-400/15 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                                        : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                }`}
                            >
                                Main Quests
                            </button>
                            <button
                                onClick={() => setFilterType("SIDE_QUEST")}
                                className={`rounded-xl border px-3 sm:px-4 py-2 text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap shrink-0 ${
                                    filterType === "SIDE_QUEST"
                                        ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                        : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                }`}
                            >
                                Side Quests
                            </button>
                        </div>
                    </div>

                    {/* Linha de Ordenação, Filtro de Usuário e Modo de Exibição */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-theme/20 text-xs font-bold uppercase text-zinc-400">
                        <div className="flex flex-wrap items-center gap-3">
                            
                            <div className="flex items-center gap-1.5">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-theme-primary shrink-0" />
                                <span>Ordenar:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as "NEWEST" | "HIGHEST_RATED")}
                                    className="rounded-lg border border-theme/30 bg-zinc-900 px-2.5 py-1.5 font-bold text-white transition-colors focus:border-theme-primary focus:outline-none cursor-pointer"
                                >
                                    <option value="NEWEST">Mais Recentes</option>
                                    <option value="HIGHEST_RATED">Maior Nota</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span>Gamer:</span>
                                <select
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                    className="rounded-lg border border-theme/30 bg-zinc-900 px-2.5 py-1.5 font-bold text-white transition-colors focus:border-theme-primary focus:outline-none cursor-pointer"
                                >
                                    <option value="ALL">Todos os Membros</option>
                                    {uniqueUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.username || "Gamer"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <span className="text-zinc-500 font-bold text-[11px] sm:text-xs">
                                Exibindo <strong className="text-white">{filteredReviews.length}</strong> de {reviews.length} reviews
                            </span>
                            <div className="flex shrink-0 overflow-hidden rounded-xl border border-theme/30 bg-zinc-950 text-zinc-500">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 sm:p-2 transition-colors ${
                                        viewMode === "grid"
                                            ? "bg-zinc-800 text-white"
                                            : "hover:bg-zinc-900 hover:text-white"
                                    }`}
                                    title="Visualização em Grade"
                                >
                                    <Grid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-1.5 sm:p-2 transition-colors ${
                                        viewMode === "list"
                                            ? "bg-zinc-800 text-white"
                                            : "hover:bg-zinc-900 hover:text-white"
                                    }`}
                                    title="Visualização em Lista"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Review Cards Grid / List */}
                <div
                    className={`grid gap-8 ${
                        viewMode === "grid"
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "grid-cols-1"
                    }`}
                >
                    {filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                currentUserId={currentUserId}
                                layout={viewMode}
                            />
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 py-24 text-center backdrop-blur-sm space-y-3">
                            <Gamepad2 className="h-16 w-16 text-zinc-700 opacity-40 animate-pulse" />
                            <p className="text-base font-black tracking-widest text-zinc-400 uppercase">
                                Nenhuma review encontrada para estes filtros.
                            </p>
                            <button
                                onClick={() => {
                                    setFilterType("ALL");
                                    setFilterUser("ALL");
                                    setSearchQuery("");
                                }}
                                className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                                Limpar todos os filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
