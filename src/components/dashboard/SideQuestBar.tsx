import { Flame, ChevronRight } from 'lucide-react';

interface SideQuestBarProps {
    game: {
        id: string;
        title: string;
        hltb_time: number | null;
        nominator: { display_name: string | null; username: string } | null;
    } | null;
}

export function SideQuestBar({ game }: SideQuestBarProps) {
    if (!game) {
        return (
            <div
                className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 border-l-4 border-l-zinc-700 opacity-60 animate-fade-in-up"
                style={{ animationDelay: '100ms' }}
            >
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
                    <Flame className="h-7 w-7 text-zinc-600" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Side Quest</span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Nenhuma ativa</span>
                    </div>
                    <h3 className="text-lg font-bold text-zinc-500">Aguardando sorteio...</h3>
                    <p className="text-xs text-zinc-600">Nenhum Side Quest em andamento</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 border-l-4 border-l-[#bd0df2] animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
        >
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
                <Flame className="h-7 w-7 text-[#bd0df2]" />
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Side Quest</span>
                    <span className="text-zinc-700">•</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Current Run</span>
                </div>
                <h3 className="text-xl font-bold text-white">{game.title}</h3>
                <p className="text-xs text-zinc-500">
                    Indicado por: {game.nominator?.display_name ?? game.nominator?.username ?? 'Desconhecido'}
                </p>
            </div>

            {/* HLTB Time */}
            {game.hltb_time && (
                <div className="md:w-1/4 space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500">
                        <span>Tempo HLTB</span>
                        <span>~{game.hltb_time}h</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-[#bd0df2]/60 w-1/2 rounded-full" />
                    </div>
                </div>
            )}

            <button className="px-6 py-2 border border-zinc-800 hover:border-[#bd0df2]/50 rounded-lg text-xs font-bold text-zinc-300 transition-colors flex items-center gap-1">
                Continue Run
                <ChevronRight className="h-3 w-3" />
            </button>
        </div>
    );
}
