import { Star, BookOpen, Quote } from 'lucide-react';
import Image from 'next/image';

interface StatsGridProps {
    lastReview: {
        rating: number;
        review_text: string | null;
        game: { title: string, cover_url: string | null };
        user: { name: string | null; username: string | null };
    } | null;
}

export function StatsGrid({
    lastReview,
}: StatsGridProps) {
    if (!lastReview) {
        return (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <BookOpen className="h-16 w-16 text-zinc-700 mb-5" />
                <h4 className="font-black text-zinc-300 text-2xl">Nenhuma review disponível</h4>
                <p className="text-zinc-500 text-base mt-3 max-w-sm">Jogue, finalize e conte para os outros aposentados o que achou da sua jornada.</p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden animate-fade-in-up group hover:border-[#bd0df2]/50 transition-colors" style={{ animationDelay: '300ms' }}>
            <div className="flex flex-col md:flex-row relative">
                {/* Visual Area (Cover Image / Rating) */}
                <div className="md:w-1/3 relative hidden md:block aspect-[4/3] bg-zinc-900 border-r border-zinc-800">
                    {lastReview.game.cover_url ? (
                        <>
                            <Image
                                src={lastReview.game.cover_url}
                                alt={lastReview.game.title}
                                fill
                                className="object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/20 to-zinc-950" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Star className="w-16 h-16 text-zinc-800" />
                        </div>
                    )}
                    <div className="absolute top-4 left-4 h-16 w-16 rounded-full bg-zinc-900/90 backdrop-blur-md border-[1.5px] border-[#bd0df2] flex items-center justify-center shadow-[0_0_20px_rgba(189,13,242,0.4)] z-10">
                        <span className="text-2xl font-black text-white">{lastReview.rating}</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-5">
                        <h4 className="text-sm font-black text-[#bd0df2] uppercase tracking-widest flex items-center gap-2 bg-[#bd0df2]/10 px-3 py-1 rounded-lg">
                            <Star className="w-4 h-4" /> A Review da Vez
                        </h4>
                        <div className="md:hidden px-4 py-1.5 bg-zinc-900 border-[1.5px] border-[#bd0df2] text-white text-base font-black rounded-full shadow-[0_0_15px_rgba(189,13,242,0.3)]">
                            {lastReview.rating} / 10
                        </div>
                    </div>

                    <h5 className="font-black text-3xl text-white mb-4 group-hover:text-primary transition-colors">{lastReview.game.title}</h5>

                    <div className="relative mb-8">
                        <Quote className="absolute -top-3 -left-4 w-10 h-10 text-zinc-800 rotate-180 z-0" />
                        <p className="text-base text-zinc-300 leading-relaxed italic relative z-10 pl-5 border-l-[3px] border-zinc-700/50">
                            {lastReview.review_text ? `"${lastReview.review_text}"` : "O jogador não deixou um comentário para essa review, mas a nota fala por si só."}
                        </p>
                    </div>

                    <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-800 pt-5 gap-3">
                        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                            por <span className="text-white bg-zinc-800/50 px-2 py-1 rounded-md ml-1">{lastReview.user.name ?? lastReview.user.username ?? 'Anônimo'}</span>
                        </p>
                        <button className="text-sm text-[#bd0df2] font-black hover:underline uppercase tracking-widest transition-colors flex items-center gap-1 bg-[#bd0df2]/10 hover:bg-[#bd0df2]/20 px-4 py-2 rounded-lg">
                            Ver Todas As Reviews &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
