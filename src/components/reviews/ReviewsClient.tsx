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
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-3">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">Game Reviews</h2>
                    <p className="text-zinc-400 max-w-2xl text-xl font-medium break-keep">
                        Honest takes from the retired vanguard of the golden era.
                    </p>
                </div>

                <AddReviewModal games={games} />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 mb-8 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Sort:</span>
                    <select className="px-5 py-2 rounded-full text-sm font-bold border-[1.5px] border-primary bg-primary/10 text-primary uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23bd0df2%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_14px_center] bg-no-repeat [&>option]:bg-zinc-900 [&>option]:text-white [&>option]:normal-case">
                        <option>Newest Finished</option>
                        <option>Highest Rated</option>
                        <option>Oldest</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setFilterType("ALL")}
                        className={`px-5 py-2 rounded-full text-sm font-bold border-[1.5px] uppercase transition-colors ${filterType === 'ALL' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-700 text-zinc-400 hover:border-primary/50 hover:text-zinc-300'}`}>
                        All Quests
                    </button>
                    <button
                        onClick={() => setFilterType("MAIN_QUEST")}
                        className={`px-5 py-2 rounded-full text-sm font-bold border-[1.5px] uppercase transition-colors ${filterType === 'MAIN_QUEST' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-700 text-zinc-400 hover:border-primary/50 hover:text-zinc-300'}`}>
                        Main Quest
                    </button>
                    <button
                        onClick={() => setFilterType("SIDE_QUEST")}
                        className={`px-5 py-2 rounded-full text-sm font-bold border-[1.5px] uppercase transition-colors ${filterType === 'SIDE_QUEST' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-700 text-zinc-400 hover:border-primary/50 hover:text-zinc-300'}`}>
                        Side Quest
                    </button>
                </div>

                <div className="ml-auto hidden lg:flex items-center gap-4">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        Displaying {filteredReviews.length} Reviews
                    </span>
                    <div className="flex border border-zinc-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 ${viewMode === "grid" ? "bg-zinc-700 text-primary" : "text-zinc-500 hover:bg-zinc-700"}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 ${viewMode === "list" ? "bg-zinc-700 text-primary" : "text-zinc-500 hover:bg-zinc-700"}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Review Cards Grid */}
            <div className={`grid gap-8 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {filteredReviews.length > 0 ? (
                    filteredReviews.map(review => (
                        <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-zinc-900/20 border border-zinc-800 rounded-xl border-dashed">
                        <p className="text-zinc-500 font-medium">Nenhuma review foi encontrada para esse filtro.</p>
                    </div>
                )}

                {/* Add Review Placeholder Card */}
                <AddReviewModal
                    games={games}
                    trigger={
                        <button className="group relative bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex items-center justify-center min-h-[400px] w-full cursor-pointer">
                            <div className="flex flex-col items-center gap-4 text-zinc-500 group-hover:text-primary transition-colors">
                                <div className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(189,13,242,0.4)] transition-all">
                                    <Plus className="w-10 h-10 text-zinc-600 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black uppercase tracking-widest text-base text-zinc-400 group-hover:text-white transition-colors">Add New Review</p>
                                    <p className="text-sm mt-2 text-zinc-600 font-medium">Share your gaming wisdom</p>
                                </div>
                            </div>
                        </button>
                    }
                />
            </div>
        </div>
    );
}
