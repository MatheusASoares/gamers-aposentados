import Link from 'next/link';
import { Gamepad2, Play, Info } from 'lucide-react';

interface ActiveQuestHeroProps {
    game: {
        id: string;
        title: string;
        cover_url: string | null;
        quest_type: string;
        status: string;
        hltb_time: number | null;
        start_date: Date | null;
        nominator: { name: string | null; username: string | null } | null;
    } | null;
    userName: string;
}

function getTimeSince(date: Date | null): string {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Há 1 dia';
    return `Há ${days} dias`;
}

export function ActiveQuestHero({ game, userName }: ActiveQuestHeroProps) {
    if (!game) {
        return (
            <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[280px] space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Gamepad2 className="h-10 w-10 text-zinc-600" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">
                            Nenhuma Quest Ativa
                        </h2>
                        <p className="text-zinc-500 text-sm max-w-md">
                            Nenhum jogo de Main Quest está em andamento. Vá ao Randomizer para sortear o próximo!
                        </p>
                    </div>
                    <Link
                        href="/randomizer"
                        className="mt-2 bg-[#bd0df2] hover:bg-[#bd0df2]/90 text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 neon-glow"
                    >
                        <Gamepad2 className="h-4 w-4" />
                        Ir ao Randomizer
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="glass-card overflow-hidden flex flex-col min-h-[400px] animate-fade-in-up group h-full border-t-4 border-t-[#bd0df2]"
            style={{ animationDelay: '0ms' }}
        >
            {/* Cover Image Side (Top Banner) */}
            <div className="w-full relative h-48 sm:h-64 flex-shrink-0 overflow-hidden flex items-center justify-center bg-zinc-950/80">
                {game.cover_url ? (
                    <>
                        {/* Blurred backdrop */}
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl transform scale-110"
                            style={{ backgroundImage: `url(${game.cover_url})` }}
                        />
                        {/* Crisp Box Art */}
                        <div className="relative z-10 w-32 h-44 sm:w-40 sm:h-56 mt-8 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(189,13,242,0.4)] border border-white/10 group-hover:scale-105 transition-transform duration-500">
                            <img
                                alt={game.title}
                                className="w-full h-full object-cover"
                                src={game.cover_url}
                            />
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                        <Gamepad2 className="h-24 w-24 text-zinc-800" />
                    </div>
                )}
                {/* Gradient blend to info side */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09090b] to-transparent" />
            </div>

            {/* Info Side */}
            <div className="w-full p-6 sm:p-8 flex flex-col flex-1 justify-between z-10 bg-[#09090b]">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-[#bd0df2]/20 border border-[#bd0df2]/50 text-[#bd0df2] text-xs font-black rounded-lg uppercase tracking-widest">
                                Main Quest
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-white">{game.title}</h2>
                        {game.nominator && (
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Info className="h-3.5 w-3.5" />
                                <p className="text-xs">
                                    Indicado por: {game.nominator.name ?? game.nominator.username ?? 'Anônimo'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {game.hltb_time && (
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-zinc-500">Tempo Estimado (HLTB)</span>
                                <span className="text-[#bd0df2]">~{game.hltb_time}h</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#bd0df2] progress-glow rounded-full transition-all duration-1000"
                                    style={{ width: '50%' }}
                                />
                            </div>
                        </div>
                    )}

                </div>

                <button className="mt-6 bg-[#bd0df2] hover:bg-[#bd0df2]/90 text-white w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-[0_10px_40px_rgba(189,13,242,0.3)] neon-glow">
                    <Gamepad2 className="h-5 w-5" />
                    RESUME QUEST
                </button>
            </div>
        </div>
    );
}
