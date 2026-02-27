"use client";

import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import { AddReviewModal } from "./AddReviewModal";
import { Grid, List, Plus } from "lucide-react";

export interface ReviewsClientProps {
    reviews: any[]; // Adjust type based on Prisma include
    games: any[];
    currentUserId?: string;
}

export function ReviewsClient({ reviews, games, currentUserId }: ReviewsClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterType, setFilterType] = useState<"ALL" | "MAIN_QUEST" | "SIDE_QUEST">("ALL");

    // Filtrar reviews baseado no tipo de quest
    const filteredReviews = reviews.filter((review) => {
        if (filterType === "ALL") return true;
        return review.game.quest_type === filterType;
    });

    return (
        <div className="mx-auto w-full px-6 py-8">
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
            <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                        Sort:
                    </span>
                    <select className="border-primary bg-primary/10 text-primary focus:ring-primary/50 relative cursor-pointer appearance-none rounded-full border-[1.5px] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23bd0df2%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_14px_center] bg-no-repeat px-5 py-2 pr-10 text-sm font-bold uppercase transition-colors focus:ring-2 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-white [&>option]:normal-case">
                        <option>Newest Finished</option>
                        <option>Highest Rated</option>
                        <option>Oldest</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFilterType("ALL")}
                        className={`rounded-full border-[1.5px] px-5 py-2 text-sm font-bold uppercase transition-colors ${filterType === "ALL" ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50 border-zinc-700 text-zinc-400 hover:text-zinc-300"}`}
                    >
                        All Quests
                    </button>
                    <button
                        onClick={() => setFilterType("MAIN_QUEST")}
                        className={`rounded-full border-[1.5px] px-5 py-2 text-sm font-bold uppercase transition-colors ${filterType === "MAIN_QUEST" ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50 border-zinc-700 text-zinc-400 hover:text-zinc-300"}`}
                    >
                        Main Quest
                    </button>
                    <button
                        onClick={() => setFilterType("SIDE_QUEST")}
                        className={`rounded-full border-[1.5px] px-5 py-2 text-sm font-bold uppercase transition-colors ${filterType === "SIDE_QUEST" ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50 border-zinc-700 text-zinc-400 hover:text-zinc-300"}`}
                    >
                        Side Quest
                    </button>
                </div>

                <div className="ml-auto hidden items-center gap-4 lg:flex">
                    <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                        Displaying {filteredReviews.length} Reviews
                    </span>
                    <div className="flex overflow-hidden rounded-lg border border-zinc-700">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 ${viewMode === "grid" ? "text-primary bg-zinc-700" : "text-zinc-500 hover:bg-zinc-700"}`}
                        >
                            <Grid className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 ${viewMode === "list" ? "text-primary bg-zinc-700" : "text-zinc-500 hover:bg-zinc-700"}`}
                        >
                            <List className="h-5 w-5" />
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
                        <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 py-20 text-center">
                        <p className="font-medium text-zinc-500">
                            Nenhuma review foi encontrada para esse filtro.
                        </p>
                    </div>
                )}

                {/* Add Review Placeholder Card */}
                <AddReviewModal
                    games={games}
                    trigger={
                        <button className="group hover:border-primary/50 relative flex min-h-[400px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 transition-all duration-300">
                            <div className="group-hover:text-primary flex flex-col items-center gap-4 text-zinc-500 transition-colors">
                                <div className="group-hover:border-primary/50 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-zinc-700 transition-all group-hover:shadow-[0_0_20px_rgba(189,13,242,0.4)]">
                                    <Plus className="group-hover:text-primary h-10 w-10 text-zinc-600 transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-base font-black tracking-widest text-zinc-400 uppercase transition-colors group-hover:text-white">
                                        Add New Review
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-zinc-600">
                                        Share your gaming wisdom
                                    </p>
                                </div>
                            </div>
                        </button>
                    }
                />
            </div>
        </div>
    );
}
