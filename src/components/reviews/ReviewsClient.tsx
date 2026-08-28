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
import { AppDropdown, type AppDropdownOption } from "@/components/ui/app-dropdown";
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

const SORT_OPTIONS: AppDropdownOption<"NEWEST" | "HIGHEST_RATED">[] = [
    { value: "NEWEST", label: "Mais Recentes", icon: "⚡" },
    { value: "HIGHEST_RATED", label: "Maior Nota", icon: "⭐" },
];

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

    const userOptions = useMemo<AppDropdownOption<string>[]>(() => {
        const list: AppDropdownOption<string>[] = [
            { value: "ALL", label: "Todos os Membros", icon: "👥" },
        ];
        uniqueUsers.forEach((u) => {
            list.push({
                value: u.id,
                label: u.name || u.username || "Gamer",
            });
        });
        return list;
    }, [uniqueUsers]);

    // Derived filtered and sorted reviews
    const filteredReviews = useMemo(() => {
        return reviews
            .filter((r) => {
                // Filter by type
                if (filterType === "MAIN_QUEST" && r.game?.quest_type !== "MAIN_QUEST") return false;
                if (filterType === "SIDE_QUEST" && r.game?.quest_type !== "SIDE_QUEST") return false;

                // Filter by user
                if (filterUser !== "ALL" && r.user_id !== filterUser) return false;

                // Filter by search term
                if (searchQuery.trim() !== "") {
                    const q = searchQuery.toLowerCase();
                    const matchesGame = r.game?.title?.toLowerCase().includes(q);
                    const matchesUser =
                        r.user?.name?.toLowerCase().includes(q) ||
                        r.user?.username?.toLowerCase().includes(q);
                    const matchesText = r.review_text?.toLowerCase().includes(q);

                    if (!matchesGame && !matchesUser && !matchesText) return false;
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "HIGHEST_RATED") {
                    return b.rating - a.rating;
                }
                // Default: NEWEST
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [reviews, filterType, filterUser, searchQuery, sortBy]);

    // Statistics
    const stats = useMemo(() => {
        const total = reviews.length;
        const avgRating = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
        const totalScreenshots = reviews.reduce(
            (acc, r) => acc + (r.screenshots ? r.screenshots.length : 0),
            0
        );
        const perfectScores = reviews.filter((r) => r.rating === 10).length;

        return {
            total,
            avgRating: avgRating.toFixed(1),
            totalScreenshots,
            totalPlatinums: perfectScores,
        };
    }, [reviews]);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background noise and gradient */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/40 to-black/80" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-8 px-4 sm:px-6 py-6 sm:py-8 md:px-8 lg:px-12 lg:py-12">
                {/* Header Area */}
                <div className="flex flex-col justify-between gap-6 border-b border-theme/20 pb-8 lg:flex-row lg:items-end">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--theme-glow)]" />
                            <span className="text-xs font-black tracking-widest text-primary uppercase">
                                Diário dos Conquistadores
                            </span>
                        </div>
                        <h1 className="text-shadow-glow text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
                            Reviews & Críticas
                        </h1>
                        <p className="text-sm sm:text-base font-bold tracking-wide text-zinc-400 max-w-2xl">
                            Todas as análises sinceras, notas, registros de screenshots e impressões finais deixadas pelos membros após zerarem suas jornadas.
                        </p>
                    </div>

                    {/* Botão de Adicionar Review */}
                    <div className="flex items-center gap-4">
                        <AddReviewModal games={games} />
                    </div>
                </div>

                {/* Stat Badges Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-theme/30 bg-zinc-950/60 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_var(--theme-glow)]">
                            <Star className="h-5 w-5 fill-primary" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                                Média Geral
                            </span>
                            <span className="text-xl font-black text-white">
                                {stats.avgRating} <span className="text-xs text-zinc-500 font-bold">/ 10</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-theme/30 bg-zinc-950/60 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                            <Award className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                                Platinas
                            </span>
                            <span className="text-xl font-black text-white">
                                {stats.totalPlatinums} <span className="text-xs text-zinc-500 font-bold">jogos 100%</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-theme/30 bg-zinc-950/60 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <Camera className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                                Galeria
                            </span>
                            <span className="text-xl font-black text-white">
                                {stats.totalScreenshots} <span className="text-xs text-zinc-500 font-bold">capturas</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-theme/30 bg-zinc-950/60 p-4 backdrop-blur-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-300">
                            <Gamepad2 className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                                Total de Reviews
                            </span>
                            <span className="text-xl font-black text-white">
                                {stats.total} <span className="text-xs text-zinc-500 font-bold">escritas</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="flex flex-col gap-4 rounded-3xl border border-theme/30 bg-zinc-950/80 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                        {/* Campo de Busca */}
                        <div className="relative flex-1 min-w-0 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                aria-label="Buscar por jogo, usuário ou palavra-chave"
                                placeholder="Buscar por jogo, usuário ou palavra-chave..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-theme/30 bg-zinc-900/80 py-2.5 pl-11 pr-4 text-sm font-bold text-white placeholder-zinc-500 transition-colors focus:border-primary focus:outline-none min-h-[44px]"
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
                                className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-black tracking-wider uppercase transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
                                    filterType === "ALL"
                                        ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_15px_var(--theme-glow)]"
                                        : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                }`}
                            >
                                Todas Quests
                            </button>
                            <button
                                onClick={() => setFilterType("MAIN_QUEST")}
                                className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-black tracking-wider uppercase transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
                                    filterType === "MAIN_QUEST"
                                        ? "border-amber-400/60 bg-amber-400/15 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                                        : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                }`}
                            >
                                Main Quests
                            </button>
                            <button
                                onClick={() => setFilterType("SIDE_QUEST")}
                                className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-black tracking-wider uppercase transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-theme/20">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-48">
                                <AppDropdown
                                    value={sortBy}
                                    onChange={setSortBy}
                                    options={SORT_OPTIONS}
                                    accentColor="purple"
                                />
                            </div>

                            <div className="w-52">
                                <AppDropdown
                                    value={filterUser}
                                    onChange={setFilterUser}
                                    options={userOptions}
                                    accentColor="purple"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <span className="text-zinc-400 font-bold text-xs sm:text-sm">
                                Exibindo <strong className="text-white font-black">{filteredReviews.length}</strong> de {reviews.length} reviews
                            </span>
                            <div className="flex shrink-0 overflow-hidden rounded-xl border border-theme/30 bg-zinc-950 text-zinc-500">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center ${
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
                                    className={`p-2 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center ${
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
                                className="text-xs sm:text-sm font-bold text-primary hover:underline uppercase tracking-wider"
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
