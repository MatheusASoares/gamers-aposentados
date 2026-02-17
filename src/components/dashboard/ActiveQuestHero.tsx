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
        nominator: { display_name: string | null; username: string } | null;
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
            className="glass-card overflow-hidden flex flex-col md:flex-row min-h-[320px] animate-fade-in-up group"
            style={{ animationDelay: '0ms' }}
        >
            {/* Cover Image Side */}
            <div className="md:w-1/2 relative min-h-[200px]">
                {game.cover_url ? (
                    <img
                        alt={game.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        src={game.cover_url}
                    />
                ) : (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                        <Gamepad2 className="h-24 w-24 text-zinc-800" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/90 via-[#09090b]/40 to-transparent" />
            </div>

            {/* Info Side */}
            <div className="md:w-1/2 p-8 flex flex-col justify-center space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-[#bd0df2]/20 text-[#bd0df2] text-[10px] font-black rounded uppercase tracking-widest">
                            Main Quest
                        </span>
                        <span className="text-zinc-500 text-[10px] uppercase tracking-widest">
                            Ongoing Adventure
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white">{game.title}</h2>
                    {game.nominator && (
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Info className="h-3.5 w-3.5" />
                            <p className="text-xs">
                                Indicado por: {game.nominator.display_name ?? game.nominator.username}
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

                {/* Actions */}
                <div className="flex items-center gap-6">
                    <button className="bg-[#bd0df2] hover:bg-[#bd0df2]/90 text-white px-8 py-3 rounded-lg font-black text-sm flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 neon-glow">
                        <Play className="h-4 w-4" />
                        RESUME
                    </button>
                    {game.start_date && (
                        <span className="text-zinc-500 text-[10px] italic">
                            Iniciado: {getTimeSince(game.start_date)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
