"use client";

import { useState } from "react";
import { Star, BookOpen, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserLink } from "@/components/ui/user-link";

interface StatsGridProps {
    reviews: {
        id: string;
        rating: number;
        review_text: string | null;
        game: { title: string; cover_url: string | null };
        user: { id: string; name: string | null; username: string | null };
    }[];
}

export function StatsGrid({ reviews }: StatsGridProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!reviews || reviews.length === 0) {
        return (
            <div
                className="glass-card animate-fade-in-up flex flex-col items-center justify-center p-10 text-center"
                style={{ animationDelay: "300ms" }}
            >
                <BookOpen className="mb-5 h-16 w-16 text-zinc-700" />
                <h4 className="text-2xl font-black text-zinc-300">Nenhuma review disponível</h4>
                <p className="mt-3 max-w-sm text-base text-zinc-500">
                    Jogue, finalize e conte para os outros aposentados o que achou da sua jornada.
                </p>
            </div>
        );
    }

    const currentReview = reviews[currentIndex];

    const nextReview = () => {
        setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
    };

    const prevReview = () => {
        setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
    };

    return (
        <div
            className="glass-card animate-fade-in-up group overflow-hidden transition-colors hover:border-[#bd0df2]/50"
            style={{ animationDelay: "300ms" }}
        >
            <div className="group/carousel relative flex flex-col md:flex-row">
                {/* Carousel Navigation (Left) */}
                {reviews.length > 1 && (
                    <button
                        onClick={prevReview}
                        className="absolute top-1/2 -left-4 z-20 -translate-y-1/2 rounded-full border border-zinc-700/50 bg-zinc-900/90 p-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:scale-110 hover:border-[#bd0df2] hover:bg-[#bd0df2] hover:text-white hover:shadow-[0_0_20px_rgba(189,13,242,0.4)] sm:left-2"
                        aria-label="Review anterior"
                    >
                        <ChevronLeft className="h-6 w-6 text-zinc-400 group-hover/carousel:text-white" />
                    </button>
                )}

                {/* Visual Area (Cover Image / Rating) */}
                <div className="relative hidden aspect-[4/3] border-r border-zinc-800 bg-zinc-900 md:block md:w-1/3">
                    {currentReview.game.cover_url ? (
                        <>
                            <Image
                                src={currentReview.game.cover_url.replace("t_cover_big", "t_1080p")}
                                alt={currentReview.game.title}
                                fill
                                className="object-contain opacity-60 mix-blend-luminosity transition-all duration-500 group-hover/carousel:opacity-100 group-hover/carousel:mix-blend-normal"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-900/60 opacity-100 transition-opacity duration-500 group-hover/carousel:opacity-0" />
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Star className="h-16 w-16 text-zinc-800" />
                        </div>
                    )}
                    <div className="absolute top-4 left-4 z-10 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-[#bd0df2] bg-zinc-900/90 shadow-[0_0_20px_rgba(189,13,242,0.4)] backdrop-blur-md">
                        <span className="text-2xl font-black text-white">
                            {currentReview.rating}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative flex flex-1 flex-col justify-center p-6 md:p-10">
                    <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h4 className="flex items-center gap-2 rounded-lg bg-[#bd0df2]/10 px-3 py-1 text-sm font-black tracking-widest text-[#bd0df2] uppercase">
                                <Star className="h-4 w-4" /> A Review da Vez
                            </h4>
                            {reviews.length > 1 && (
                                <div className="hidden rounded-full border border-zinc-800/60 bg-zinc-950/50 px-3 py-1 text-xs font-black tracking-widest text-zinc-500 shadow-inner backdrop-blur-md sm:block">
                                    <span className="text-white">{currentIndex + 1}</span>
                                    <span className="mx-1 text-zinc-700">/</span>
                                    <span>{reviews.length}</span>
                                </div>
                            )}
                        </div>
                        <div className="rounded-full border-[1.5px] border-[#bd0df2] bg-zinc-900 px-4 py-1.5 text-base font-black text-white shadow-[0_0_15px_rgba(189,13,242,0.3)] md:hidden">
                            {currentReview.rating} / 10
                        </div>
                    </div>

                    <h5 className="group-hover:text-primary mb-4 text-3xl font-black text-white transition-colors sm:px-8">
                        {currentReview.game.title}
                    </h5>

                    <div className="relative mb-8 sm:px-8">
                        <Quote className="absolute -top-3 -left-4 z-0 h-10 w-10 rotate-180 text-zinc-800 sm:left-4" />
                        <p className="relative z-10 border-l-[3px] border-zinc-700/50 pl-5 text-base leading-relaxed text-zinc-300 italic">
                            {currentReview.review_text
                                ? `"${currentReview.review_text}"`
                                : "O jogador não deixou um comentário para essa review, mas a nota fala por si só."}
                        </p>
                    </div>

                    <div className="mt-auto flex flex-col items-start justify-between gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:px-8">
                        <p className="text-sm font-bold tracking-widest text-zinc-500 uppercase">
                            por{" "}
                            <span className="ml-1 rounded-md bg-zinc-800/50 px-2 py-1 text-white">
                                <UserLink
                                    userId={currentReview.user.id}
                                    name={currentReview.user.name}
                                    username={currentReview.user.username}
                                />
                            </span>
                        </p>
                        <Link
                            href="/reviews"
                            className="flex items-center gap-1 rounded-lg bg-[#bd0df2]/10 px-4 py-2 text-sm font-black tracking-widest text-[#bd0df2] uppercase transition-colors hover:bg-[#bd0df2]/20 hover:underline"
                        >
                            Ver Todas As Reviews &rarr;
                        </Link>
                    </div>

                    {/* Carousel Navigation (Right) */}
                    {reviews.length > 1 && (
                        <button
                            onClick={nextReview}
                            className="absolute top-1/2 -right-4 z-20 -translate-y-1/2 rounded-full border border-zinc-700/50 bg-zinc-900/90 p-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:scale-110 hover:border-[#bd0df2] hover:bg-[#bd0df2] hover:text-white hover:shadow-[0_0_20px_rgba(189,13,242,0.4)] sm:right-2"
                            aria-label="Próxima review"
                        >
                            <ChevronRight className="h-6 w-6 text-zinc-400 group-hover/carousel:text-white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
