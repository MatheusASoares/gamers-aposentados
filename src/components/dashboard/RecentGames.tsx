import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Clock, User, ChevronRight } from 'lucide-react';

interface RecentGame {
    id: string;
    status: string;
    updated_at: Date;
    game: {
        title: string;
        quest_type: string;
        hltb_time: number | null;
        nominator: { name: string | null; username: string | null } | null;
    };
}

interface RecentGamesProps {
    games: RecentGame[];
}

function getStatusColor(status: string) {
    switch (status) {
        case 'ACTIVE':
            return 'bg-[#bd0df2]/20 text-[#bd0df2] border-[#bd0df2]/30';
        case 'COMPLETED':
            return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'DROPPED':
            return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'SUGGESTED':
            return 'bg-zinc-700/40 text-zinc-400 border-zinc-600/30';
        case 'IN_POOL':
            return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        default:
            return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'ACTIVE': return 'Ativo';
        case 'COMPLETED': return 'Zerado';
        case 'DROPPED': return 'Dropado';
        case 'SUGGESTED': return 'Sugerido';
        case 'IN_POOL': return 'No Pote';
        default: return status;
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
}

export function RecentGames({ games }: RecentGamesProps) {
    if (games.length === 0) {
        return null;
    }

    return (
        <div
            className="glass-card overflow-hidden animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
        >
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Atividade Recente</h3>
                <Link
                    href="/quests"
                    className="text-xs text-[#bd0df2] font-bold hover:underline flex items-center gap-1"
                >
                    Ver Todos
                    <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="divide-y divide-zinc-800/60">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors group"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Quest Type Icon */}
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">
                                    {game.game.quest_type === 'MAIN_QUEST' ? '🛡️' : '⚔️'}
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-white truncate">
                                        {game.game.title}
                                    </h4>
                                    <span
                                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wider flex-shrink-0 ${getStatusColor(game.status)}`}
                                    >
                                        {getStatusLabel(game.status)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-zinc-500">
                                    {game.game.nominator && (
                                        <span className="text-[11px] flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {game.game.nominator.name ?? game.game.nominator.username ?? 'Anônimo'}
                                        </span>
                                    )}
                                    {game.game.hltb_time && (
                                        <span className="text-[11px] flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            ~{game.game.hltb_time}h
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <span className="text-[10px] text-zinc-600 font-medium flex-shrink-0">
                            {formatDate(game.updated_at)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
