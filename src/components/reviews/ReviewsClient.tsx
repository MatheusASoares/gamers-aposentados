"use client";

import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import { AddReviewModal } from "./AddReviewModal";
import { Grid, List, Plus } from "lucide-react";

export interface ReviewsClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviews: any[]; // Adjust type based on Prisma include
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    games: any[];
    currentUserId?: string;
}

export function ReviewsClient({ reviews, games, currentUserId }: ReviewsClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterType, setFilterType] = useState<"ALL" | "MAIN_QUEST" | "SIDE_QUEST">("ALL");
    const [sortBy, setSortBy] = useState<"NEWEST" | "HIGHEST_RATED">("NEWEST");
    const [filterUser, setFilterUser] = useState<string>("ALL");

    // Extrair usuários únicos que têm reviews
    const uniqueUsers = Array.from(
        new Map(
            reviews.map((r) => [
                r.user_id,
                { id: r.user_id, name: r.user.name, username: r.user.username },
            ]),
        ).values(),
    );

    // Filtrar e Organizar reviews
    const filteredReviews = reviews
        .filter((review) => {
            if (filterType !== "ALL" && review.game.quest_type !== filterType) return false;
            if (filterUser !== "ALL" && review.user_id !== filterUser) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "HIGHEST_RATED") {
                // If ratings are equal, prioritize newest
                if (b.rating === a.rating) {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                return b.rating - a.rating;
            }
            // NEWEST by default
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    return (
        <div className="relative mx-auto min-h-screen w-full px-6 py-8">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900/50 to-zinc-950" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
            />

            <div className="relative z-10">
                {/* Hero Section */}
                <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="space-y-3">
                        <h2 className="text-5xl font-black tracking-tight text-white uppercase drop-shadow-md md:text-6xl">
                            Game Reviews
                        </h2>
                        <p className="max-w-2xl text-xl font-medium break-keep text-zinc-400">
                            Honest takes from the retired vanguard of the golden era.
                        </p>
                    </div>

                    <AddReviewModal games={games} />
                </div>

                {/* Filters Bar */}
                <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-2xl backdrop-blur-md">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                                Sort:
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(e.target.value as "NEWEST" | "HIGHEST_RATED")
                                }
                                className="relative cursor-pointer appearance-none rounded-xl border-2 border-[#bd0df2]/30 bg-[#bd0df2]/10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23bd0df2%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_14px_center] bg-no-repeat px-5 py-2 pr-10 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_15px_rgba(189,13,242,0.15)] transition-all hover:bg-[#bd0df2]/20 focus:ring-2 focus:ring-[#bd0df2]/50 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white [&>option]:normal-case"
                            >
                                <option value="NEWEST">Newest Finished</option>
                                <option value="HIGHEST_RATED">Highest Rated</option>
                            </select>
                        </div>

                        <div className="hidden h-6 w-px bg-white/10 sm:block"></div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                                Gamer:
                            </span>
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="relative cursor-pointer appearance-none rounded-xl border-2 border-[#bd0df2]/30 bg-[#bd0df2]/10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23bd0df2%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_14px_center] bg-no-repeat px-5 py-2 pr-10 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_15px_rgba(189,13,242,0.15)] transition-all hover:bg-[#bd0df2]/20 focus:ring-2 focus:ring-[#bd0df2]/50 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white [&>option]:normal-case"
                            >
                                <option value="ALL">All Gamers</option>
                                {uniqueUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.username || "Unknown"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setFilterType("ALL")}
                            className={`rounded-xl border-2 px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 ${filterType === "ALL" ? "border-[#bd0df2]/40 bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.15)]" : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"}`}
                        >
                            All Quests
                        </button>
                        <button
                            onClick={() => setFilterType("MAIN_QUEST")}
                            className={`rounded-xl border-2 px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 ${filterType === "MAIN_QUEST" ? "border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]" : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"}`}
                        >
                            Main Quest
                        </button>
                        <button
                            onClick={() => setFilterType("SIDE_QUEST")}
                            className={`rounded-xl border-2 px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 ${filterType === "SIDE_QUEST" ? "border-[#bd0df2]/40 bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.15)]" : "border-white/5 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"}`}
                        >
                            Side Quest
                        </button>
                    </div>

                    <div className="ml-auto hidden items-center gap-4 lg:flex">
                        <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                            Displaying {filteredReviews.length} Reviews
                        </span>
                        <div className="flex overflow-hidden rounded-xl border-2 border-white/5 bg-zinc-950 text-zinc-500 shadow-inner">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-white" : "hover:bg-zinc-900 hover:text-white"}`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 transition-colors ${viewMode === "list" ? "bg-zinc-800 text-white" : "hover:bg-zinc-900 hover:text-white"}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Review Cards Grid */}
                <div
                    className={`grid gap-8 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}
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
                        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950/40 py-20 text-center backdrop-blur-sm">
                            <p className="font-bold tracking-widest text-[#bd0df2]/50 uppercase">
                                Nenhuma review foi encontrada para esse filtro.
                            </p>
                        </div>
                    )}

                    {/* Add Review Placeholder Card */}
                    {viewMode === "grid" && (
                        <AddReviewModal
                            games={games}
                            trigger={
                                <button className="group relative flex min-h-[450px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-zinc-900/20 backdrop-blur-sm transition-all duration-500 hover:border-[#bd0df2]/30 hover:bg-[#bd0df2]/5 hover:shadow-[0_0_30px_rgba(189,13,242,0.1)]">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-zinc-700 bg-zinc-950 transition-all duration-500 group-hover:border-[#bd0df2]/50 group-hover:bg-zinc-900 group-hover:shadow-[0_0_20px_rgba(189,13,242,0.3)]">
                                            <Plus className="h-10 w-10 text-zinc-600 transition-colors duration-500 group-hover:text-[#bd0df2]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black tracking-widest text-zinc-500 uppercase transition-colors duration-500 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                                                Add New Review
                                            </p>
                                            <p className="mt-2 text-xs font-medium tracking-widest text-zinc-600 uppercase">
                                                Share your gaming wisdom
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
