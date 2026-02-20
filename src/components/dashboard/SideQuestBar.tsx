import { Flame, ChevronRight } from 'lucide-react';

interface SideQuestBarProps {
    game: {
        id: string;
        title: string;
        cover_url: string | null;
        hltb_time: number | null;
        nominator: { name: string | null; username: string | null } | null;
    } | null;
}

export function SideQuestBar({ game }: SideQuestBarProps) {
    if (!game) {
        return (
            <div
                className="glass-card overflow-hidden flex flex-col min-h-[400px] animate-fade-in-up group h-full border-t-4 border-t-zinc-700 opacity-60"
                style={{ animationDelay: '100ms' }}
            >
                <div className="w-full relative h-48 sm:h-64 flex-shrink-0 flex flex-col items-center justify-center bg-zinc-900/50 space-y-4">
                    <Flame className="h-16 w-16 text-zinc-700" />
                    <span className="text-zinc-600 font-bold uppercase tracking-widest text-sm">Aguardando Sorteio</span>
                </div>
                <div className="w-full p-6 sm:p-8 flex flex-col flex-1 space-y-2 z-10 bg-[#09090b]">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Side Quest</span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-500">Nenhum Jogo Ativo</h3>
                    <p className="text-xs text-zinc-600">Nenhum Side Quest em andamento no momento. Vá ao Randomizer para escolher.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="glass-card overflow-hidden flex flex-col min-h-[400px] animate-fade-in-up group h-full border-t-4 border-t-[#bd0df2]"
            style={{ animationDelay: '100ms' }}
        >
            {/* Cover Image Side (Top Banner) */}
            <div className="w-full relative h-48 sm:h-64 flex-shrink-0 overflow-hidden flex items-center justify-center bg-zinc-950/80">
                {game.cover_url ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl transform scale-110"
                            style={{ backgroundImage: `url(${game.cover_url})` }}
                        />
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
                        <Flame className="h-24 w-24 text-[#bd0df2]/50" />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#09090b] to-transparent" />
            </div>

            {/* Info Side (Bottom) */}
            <div className="w-full p-6 sm:p-8 flex flex-col flex-1 justify-between z-10 bg-[#09090b]">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-[#bd0df2]/20 border border-[#bd0df2]/50 text-[#bd0df2] text-xs font-black rounded-lg uppercase tracking-widest">
                                Side Quest
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white">{game.title}</h3>
                        <p className="text-xs text-zinc-400">
                            Indicado por: {game.nominator?.name ?? game.nominator?.username ?? 'Desconhecido'}
                        </p>
                    </div>

                    {/* HLTB Time */}
                    {game.hltb_time && (
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                <span>Tempo Estimado</span>
                                <span className="text-[#bd0df2]">~{game.hltb_time}h</span>
                            </div>
                            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-[#bd0df2]/60 w-1/2 rounded-full" />
                            </div>
                        </div>
                    )}
                </div>

                <button className="mt-6 bg-[#bd0df2] hover:bg-[#bd0df2]/90 text-white w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 shadow-[0_10px_40px_rgba(189,13,242,0.3)] neon-glow">
                    <Flame className="h-5 w-5" />
                    RESUME QUEST
                </button>
            </div>
        </div>
    );
}
