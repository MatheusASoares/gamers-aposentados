"use client";

import { useState } from "react";
import { Star, BookOpen, ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
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
    const [isAnimating, setIsAnimating] = useState(false);

    if (!reviews || reviews.length === 0) {
        return (
            <div
                className="glass-card animate-fade-in-up flex flex-col items-center justify-center rounded-3xl border border-zinc-800/50 bg-zinc-950/40 p-14 text-center backdrop-blur-md"
                style={{ animationDelay: "300ms" }}
            >
                <BookOpen className="mb-6 h-20 w-20 text-zinc-800 drop-shadow-md" />
                <h4 className="text-3xl font-black tracking-tight text-white/90">
                    Nenhuma review disponível
                </h4>
                <p className="mt-4 max-w-md text-base font-medium text-zinc-500">
                    Jogue, finalize e conte para os outros aposentados o que achou da sua jornada.
                </p>
            </div>
        );
    }

    const currentReview = reviews[currentIndex];

    const handleNavigation = (direction: "next" | "prev") => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => {
                if (direction === "next") return prev === reviews.length - 1 ? 0 : prev + 1;
                return prev === 0 ? reviews.length - 1 : prev - 1;
            });
            setTimeout(() => setIsAnimating(false), 50);
        }, 300); // 300ms matches the fade out transition duration
    };

    return (
        <div
            className="group relative w-full overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/80 shadow-2xl transition-all duration-700 hover:border-[#bd0df2]/30 hover:shadow-[#bd0df2]/10"
            style={{ animationDelay: "300ms" }}
        >
            {/* Dark/Grain/Glow Background Effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#12001a]" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />

            {/* Dynamic Cover Image Background Overlay */}
            {currentReview.game.cover_url && (
                <div
                    className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${isAnimating ? "opacity-0" : "opacity-20 mix-blend-overlay"}`}
                >
                    <Image
                        src={currentReview.game.cover_url.replace("t_cover_big", "t_1080p")}
                        alt={currentReview.game.title}
                        fill
                        sizes="100vw"
                        className="scale-110 object-cover blur-2xl"
                        priority
                    />
                </div>
            )}

            <div
                className={`relative z-10 flex flex-col transition-opacity duration-300 ease-in-out md:flex-row ${isAnimating ? "scale-[0.98] opacity-0" : "scale-100 opacity-100"}`}
            >
                {/* Left: Huge Cover & Score */}
                <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-zinc-950/50 p-6 md:aspect-auto md:min-h-[450px] md:w-2/5">
                    {currentReview.game.cover_url ? (
                        <div className="relative h-full max-h-[500px] w-full max-w-[350px] overflow-hidden rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-transform duration-1000 ease-out group-hover:scale-105">
                            <Image
                                src={currentReview.game.cover_url.replace("t_cover_big", "t_1080p")}
                                alt={currentReview.game.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-zinc-900/50">
                            <Gamepad2 className="h-24 w-24 text-zinc-800" />
                        </div>
                    )}

                    {/* Gradient overlay to seamlessly merge the image container with the right side */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950/95 to-transparent md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-32 md:bg-gradient-to-l" />

                    {/* Neon Score Badge */}
                    <div className="absolute bottom-10 left-10 z-20 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-[#bd0df2]/40 bg-zinc-950/90 shadow-[0_0_30px_rgba(189,13,242,0.4)] backdrop-blur-xl transition-transform hover:scale-110 md:top-10 md:bottom-auto md:left-10">
                        <span className="text-sm font-bold tracking-widest text-[#bd0df2] uppercase">
                            Nota
                        </span>
                        <span className="text-4xl font-black tracking-tighter text-white">
                            {currentReview.rating}
                        </span>
                    </div>
                </div>

                {/* Right: Review Content */}
                <div className="relative flex flex-1 flex-col justify-center bg-zinc-950/80 p-8 backdrop-blur-sm md:p-12 lg:p-16">
                    {/* Header Tag */}
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-[#bd0df2]/30 bg-[#bd0df2]/10 px-4 py-1.5 backdrop-blur-md">
                            <Star className="h-4 w-4 text-[#bd0df2]" />
                            <span className="text-xs font-black tracking-[0.2em] text-[#bd0df2] uppercase">
                                Review da Vez
                            </span>
                        </div>

                        {reviews.length > 1 && (
                            <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-md">
                                <span className="text-xs font-bold tracking-widest text-zinc-400">
                                    <span className="text-white">{currentIndex + 1}</span> /{" "}
                                    {reviews.length}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Game Title */}
                    <h3 className="mb-8 text-4xl leading-[1.1] font-black tracking-tighter text-white drop-shadow-sm md:text-5xl lg:text-6xl">
                        {currentReview.game.title}
                    </h3>

                    {/* Review Text */}
                    <div className="relative mb-10 border-l-2 border-[#bd0df2]/40 pl-6">
                        <p className="text-lg leading-relaxed font-medium text-zinc-300 md:text-xl">
                            {currentReview.review_text
                                ? `"${currentReview.review_text}"`
                                : "O jogador escolheu deixar apenas a nota. O silêncio, às vezes, fala mais alto."}
                        </p>
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="mt-auto flex flex-col items-start justify-between gap-6 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-800 font-black text-zinc-400 uppercase">
                                {currentReview.user.name?.[0] ||
                                    currentReview.user.username?.[0] ||
                                    "?"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                    Avaliado por
                                </span>
                                <span className="font-bold text-white transition-colors hover:text-[#bd0df2]">
                                    <UserLink
                                        userId={currentReview.user.id}
                                        name={currentReview.user.name}
                                        username={currentReview.user.username}
                                    />
                                </span>
                            </div>
                        </div>

                        <Link
                            href="/reviews"
                            className="group/link relative flex items-center gap-2 text-sm font-bold tracking-widest text-zinc-400 uppercase transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#bd0df2] after:transition-all hover:text-white hover:after:w-full"
                        >
                            Ver Todas
                            <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Carousel Navigation Floating Buttons */}
            {reviews.length > 1 && (
                <>
                    <button
                        onClick={() => handleNavigation("prev")}
                        disabled={isAnimating}
                        className="absolute top-1/2 left-4 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-950/60 text-white backdrop-blur-xl transition-all hover:scale-110 hover:border-[#bd0df2] hover:bg-[#bd0df2] hover:shadow-[0_0_20px_rgba(189,13,242,0.4)] disabled:pointer-events-none disabled:opacity-50"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => handleNavigation("next")}
                        disabled={isAnimating}
                        className="absolute top-1/2 right-4 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-950/60 text-white backdrop-blur-xl transition-all hover:scale-110 hover:border-[#bd0df2] hover:bg-[#bd0df2] hover:shadow-[0_0_20px_rgba(189,13,242,0.4)] disabled:pointer-events-none disabled:opacity-50"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}
        </div>
    );
}
