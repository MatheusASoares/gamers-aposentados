import { Star, BookOpen, Quote } from "lucide-react";
import Image from "next/image";
import { UserLink } from "@/components/ui/user-link";

interface StatsGridProps {
    lastReview: {
        rating: number;
        review_text: string | null;
        game: { title: string; cover_url: string | null };
        user: { id: string; name: string | null; username: string | null };
    } | null;
}

export function StatsGrid({ lastReview }: StatsGridProps) {
    if (!lastReview) {
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

    return (
        <div
            className="glass-card animate-fade-in-up group overflow-hidden transition-colors hover:border-[#bd0df2]/50"
            style={{ animationDelay: "300ms" }}
        >
            <div className="relative flex flex-col md:flex-row">
                {/* Visual Area (Cover Image / Rating) */}
                <div className="relative hidden aspect-[4/3] border-r border-zinc-800 bg-zinc-900 md:block md:w-1/3">
                    {lastReview.game.cover_url ? (
                        <>
                            <Image
                                src={lastReview.game.cover_url}
                                alt={lastReview.game.title}
                                fill
                                className="object-cover opacity-60 mix-blend-luminosity transition-all duration-500 group-hover:mix-blend-normal"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/20 to-zinc-950" />
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Star className="h-16 w-16 text-zinc-800" />
                        </div>
                    )}
                    <div className="absolute top-4 left-4 z-10 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-[#bd0df2] bg-zinc-900/90 shadow-[0_0_20px_rgba(189,13,242,0.4)] backdrop-blur-md">
                        <span className="text-2xl font-black text-white">{lastReview.rating}</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
                    <div className="mb-5 flex items-center justify-between">
                        <h4 className="flex items-center gap-2 rounded-lg bg-[#bd0df2]/10 px-3 py-1 text-sm font-black tracking-widest text-[#bd0df2] uppercase">
                            <Star className="h-4 w-4" /> A Review da Vez
                        </h4>
                        <div className="rounded-full border-[1.5px] border-[#bd0df2] bg-zinc-900 px-4 py-1.5 text-base font-black text-white shadow-[0_0_15px_rgba(189,13,242,0.3)] md:hidden">
                            {lastReview.rating} / 10
                        </div>
                    </div>

                    <h5 className="group-hover:text-primary mb-4 text-3xl font-black text-white transition-colors">
                        {lastReview.game.title}
                    </h5>

                    <div className="relative mb-8">
                        <Quote className="absolute -top-3 -left-4 z-0 h-10 w-10 rotate-180 text-zinc-800" />
                        <p className="relative z-10 border-l-[3px] border-zinc-700/50 pl-5 text-base leading-relaxed text-zinc-300 italic">
                            {lastReview.review_text
                                ? `"${lastReview.review_text}"`
                                : "O jogador não deixou um comentário para essa review, mas a nota fala por si só."}
                        </p>
                    </div>

                    <div className="mt-auto flex flex-col items-start justify-between gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center">
                        <p className="text-sm font-bold tracking-widest text-zinc-500 uppercase">
                            por{" "}
                            <span className="ml-1 rounded-md bg-zinc-800/50 px-2 py-1 text-white">
                                <UserLink
                                    userId={lastReview.user.id}
                                    name={lastReview.user.name}
                                    username={lastReview.user.username}
                                />
                            </span>
                        </p>
                        <button className="flex items-center gap-1 rounded-lg bg-[#bd0df2]/10 px-4 py-2 text-sm font-black tracking-widest text-[#bd0df2] uppercase transition-colors hover:bg-[#bd0df2]/20 hover:underline">
                            Ver Todas As Reviews &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
