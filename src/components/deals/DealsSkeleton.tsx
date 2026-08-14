// src/components/deals/DealsSkeleton.tsx

import React from "react";

export function ComparisonSkeleton() {
    return (
        <div className="glass-card border border-theme bg-theme-card relative overflow-hidden rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            {/* Header shimmer */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-theme/20 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-32 rounded-xl bg-zinc-800/60 animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-6 w-48 rounded bg-zinc-800 animate-pulse" />
                        <div className="h-4 w-32 rounded bg-zinc-800/60 animate-pulse" />
                    </div>
                </div>
                <div className="h-8 w-44 rounded-xl bg-zinc-800/80 animate-pulse" />
            </div>

            {/* Winner Banner skeleton */}
            <div className="my-6 h-14 w-full rounded-2xl bg-zinc-800/40 animate-pulse border border-theme/20" />

            {/* Side-by-side cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-theme/20 bg-zinc-950/60 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-6 w-24 rounded bg-zinc-800 animate-pulse" />
                        <div className="h-6 w-16 rounded-full bg-zinc-800 animate-pulse" />
                    </div>
                    <div className="h-9 w-36 rounded bg-zinc-800 animate-pulse" />
                    <div className="h-4 w-28 rounded bg-zinc-800/60 animate-pulse" />
                    <div className="h-11 w-full rounded-xl bg-zinc-800/80 animate-pulse" />
                </div>

                <div className="rounded-2xl border border-theme/20 bg-zinc-950/60 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-6 w-24 rounded bg-zinc-800 animate-pulse" />
                        <div className="h-6 w-16 rounded-full bg-zinc-800 animate-pulse" />
                    </div>
                    <div className="h-9 w-36 rounded bg-zinc-800 animate-pulse" />
                    <div className="h-4 w-28 rounded bg-zinc-800/60 animate-pulse" />
                    <div className="h-11 w-full rounded-xl bg-zinc-800/80 animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function FeaturedDealsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-theme/20 bg-zinc-950/60 p-3.5 space-y-3 animate-pulse"
                >
                    <div className="aspect-video w-full rounded-xl bg-zinc-800/70" />
                    <div className="h-4 w-3/4 rounded bg-zinc-800" />
                    <div className="flex items-center justify-between pt-2">
                        <div className="h-5 w-16 rounded bg-zinc-800" />
                        <div className="h-5 w-12 rounded bg-zinc-800" />
                    </div>
                </div>
            ))}
        </div>
    );
}
