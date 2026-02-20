import { Trophy, Star, BookOpen, Inbox } from 'lucide-react';

interface StatsGridProps {
    totalGames: number;
    completedGames: number;
    suggestedGames: number;
    lastReview: {
        rating: number;
        review_text: string | null;
        game: { title: string };
        user: { name: string | null; username: string | null };
    } | null;
}

export function StatsGrid({
    totalGames,
    completedGames,
    suggestedGames,
    lastReview,
}: StatsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conquistas / Completed Games */}
            <div
                className="glass-card p-6 space-y-4 animate-fade-in-up"
                style={{ animationDelay: '200ms' }}
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                        Conquistas
                    </h4>
                    <Trophy className="h-5 w-5 text-[#bd0df2]" />
                </div>

                <div className="flex items-end gap-2 py-2">
                    <span className="text-4xl font-black text-white">{completedGames}</span>
                    <span className="text-zinc-600 text-lg font-bold mb-1">/{totalGames}</span>
                </div>

                <p className="text-[10px] text-zinc-500 font-medium uppercase">
                    Jogos Zerados no Total
                </p>

                {/* Progress dots visualization */}
                <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: Math.min(totalGames, 10) }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 w-4 rounded ${i < Math.min(completedGames, 10)
                                ? 'bg-[#bd0df2] shadow-[0_0_8px_rgba(189,13,242,0.4)]'
                                : 'bg-zinc-800'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Última Review */}
            <div
                className="glass-card p-6 space-y-3 animate-fade-in-up"
                style={{ animationDelay: '300ms' }}
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                        Última Review
                    </h4>
                    {lastReview ? (
                        <div className="px-2 py-0.5 bg-[#bd0df2] text-white text-xs font-black rounded italic">
                            {lastReview.rating}
                        </div>
                    ) : (
                        <Star className="h-5 w-5 text-zinc-600" />
                    )}
                </div>

                {lastReview ? (
                    <div className="space-y-1">
                        <h5 className="font-bold text-sm text-white">{lastReview.game.title}</h5>
                        {lastReview.review_text && (
                            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                                &quot;{lastReview.review_text}&quot;
                            </p>
                        )}
                        <p className="text-[10px] text-zinc-600 mt-1">
                            por {lastReview.user.name ?? lastReview.user.username ?? 'Anônimo'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 py-2">
                        <BookOpen className="h-8 w-8 text-zinc-700" />
                        <p className="text-xs text-zinc-600">Nenhuma review ainda</p>
                    </div>
                )}

                <button className="text-[10px] text-[#bd0df2] font-bold hover:underline uppercase tracking-widest flex items-center gap-1">
                    {lastReview ? 'Ler Review Completa →' : 'Escrever Primeira Review →'}
                </button>
            </div>

            {/* Backlog Burner */}
            <div
                className="glass-card p-6 space-y-4 animate-fade-in-up"
                style={{ animationDelay: '400ms' }}
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                        Backlog
                    </h4>
                    <Inbox className="h-5 w-5 text-zinc-500" />
                </div>

                <div className="flex items-center justify-center py-2">
                    <div className="text-center">
                        <span className="text-4xl font-black text-white">
                            {suggestedGames}
                        </span>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">
                            Jogos na Fila
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500">
                        <span>Backlog Burn Rate</span>
                        <span className="text-[#bd0df2]">
                            {totalGames > 0
                                ? `${Math.round((completedGames / totalGames) * 100)}%`
                                : '0%'}
                        </span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#bd0df2] rounded-full transition-all"
                            style={{
                                width: totalGames > 0
                                    ? `${Math.round((completedGames / totalGames) * 100)}%`
                                    : '0%',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
