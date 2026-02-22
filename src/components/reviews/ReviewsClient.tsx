"use client";

import { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import { AddReviewModal } from "./AddReviewModal";
import { Grid, List, Plus } from "lucide-react";

export interface ReviewsClientProps {
    reviews: any[]; // Adjust type based on Prisma include
    games: any[];
}

export function ReviewsClient({ reviews, games }: ReviewsClientProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">Game Reviews</h2>
                    <p className="text-zinc-400 max-w-md text-lg">
                        Honest takes from the retired vanguard of the golden era.
                    </p>
                </div>

                <AddReviewModal games={games} />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 mb-8 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Sort:</span>
                    <select className="bg-transparent border-none text-sm font-medium focus:ring-0 py-0 pr-8 text-white cursor-pointer">
                        <option>Newest Finished</option>
                        <option>Highest Rated</option>
                        <option>Oldest</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-1.5 rounded-full text-xs font-bold border border-primary bg-primary/10 text-primary uppercase">All Genres</button>
                    <button className="px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-700 text-zinc-500 hover:border-primary/50 transition-colors uppercase">RPG</button>
                    <button className="px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-700 text-zinc-500 hover:border-primary/50 transition-colors uppercase">Souls-like</button>
                    <button className="px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-700 text-zinc-500 hover:border-primary/50 transition-colors uppercase">Action</button>
                </div>

                <div className="ml-auto hidden lg:flex items-center gap-4">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Displaying {reviews.length} Reviews
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
                {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                ))}

                {/* Add Review Placeholder Card */}
                <AddReviewModal
                    games={games}
                    trigger={
                        <button className="group relative bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex items-center justify-center min-h-[400px] w-full cursor-pointer">
                            <div className="flex flex-col items-center gap-4 text-zinc-500 group-hover:text-primary transition-colors">
                                <div className="h-16 w-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(189,13,242,0.3)] transition-all">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold uppercase tracking-widest text-sm">Add New Review</p>
                                    <p className="text-xs mt-1 text-zinc-600">Share your gaming wisdom</p>
                                </div>
                            </div>
                        </button>
                    }
                />
            </div>
        </div>
    );
}
