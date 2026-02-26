"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Flame, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateQuestProgress, completeQuest, dropQuest } from '@/app/lib/quest-actions';

interface SideQuestBarProps {
    progress: {
        status: string;
        progress_percentage: number;
        game: {
            id: string;
            title: string;
            cover_url: string | null;
            hltb_time: number | null;
            nominator: { name: string | null; username: string | null } | null;
        }
    } | null;
}

export function SideQuestBar({ progress }: SideQuestBarProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [percentage, setPercentage] = useState(progress?.progress_percentage || 0);
    const [isLoading, setIsLoading] = useState(false);

    if (!progress) {
        return (
            <div
                className="glass-card overflow-hidden flex flex-col min-h-[400px] animate-fade-in-up group h-full border-t-4 border-t-zinc-700 opacity-60"
                style={{ animationDelay: '100ms' }}
            >
                <div className="w-full relative h-48 sm:h-64 flex-shrink-0 flex flex-col items-center justify-center bg-zinc-900/50 space-y-4">
                    <Flame className="h-20 w-20 text-zinc-700" />
                    <span className="text-zinc-600 font-bold uppercase tracking-widest text-base">Aguardando Sorteio</span>
                </div>
                <div className="w-full p-6 sm:p-8 flex flex-col flex-1 space-y-3 z-10 bg-[#09090b]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Side Quest</span>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-500">Nenhum Jogo Ativo</h3>
                    <p className="text-sm text-zinc-600">Nenhum Side Quest em andamento no momento. Vá ao Randomizer para escolher.</p>
                </div>
            </div>
        );
    }

    const getThemeClasses = () => {
        if (progress.status === 'COMPLETED') return {
            border: 'border-t-green-500 hover:border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]',
            text: 'text-green-500',
            bg: 'bg-green-500',
            badge: 'bg-green-500/20 border-green-500/50 text-green-500'
        };
        if (progress.status === 'DROPPED') return {
            border: 'border-t-red-500 hover:border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
            text: 'text-red-500',
            bg: 'bg-red-500',
            badge: 'bg-red-500/20 border-red-500/50 text-red-500'
        };
        return {
            border: 'border-t-[#bd0df2] hover:border-[#bd0df2]/50 shadow-[0_0_20px_rgba(189,13,242,0.15)]',
            text: 'text-[#bd0df2]',
            bg: 'bg-[#bd0df2]',
            badge: 'bg-[#bd0df2]/20 border-[#bd0df2]/50 text-[#bd0df2]'
        };
    };
    const theme = getThemeClasses();

    return (
        <div
            className={`glass-card overflow-hidden flex flex-col min-h-[400px] animate-fade-in-up group h-full border-t-4 transition-all duration-500 ${theme.border}`}
            style={{ animationDelay: '100ms' }}
        >
            {/* Cover Image Side (Top Banner) */}
            <div className="w-full relative h-48 sm:h-64 flex-shrink-0 overflow-hidden flex items-center justify-center bg-zinc-950/80">
                {progress.game.cover_url ? (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-40 blur-xl transform scale-110"
                            style={{ backgroundImage: `url(${progress.game.cover_url})` }}
                        />
                        <div className="relative z-10 w-32 h-44 sm:w-40 sm:h-56 mt-8 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(189,13,242,0.4)] border border-white/10 group-hover:scale-105 transition-transform duration-500">
                            <img
                                alt={progress.game.title}
                                className="w-full h-full object-cover"
                                src={progress.game.cover_url}
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
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-4 py-1.5 ${theme.badge} text-xs font-black rounded-lg uppercase tracking-widest`}>
                                Side Quest
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white leading-tight">{progress.game.title}</h3>
                        <p className="text-sm text-zinc-400 font-medium">
                            Indicado por: <span className="text-white">{progress.game.nominator?.name ?? progress.game.nominator?.username ?? 'Desconhecido'}</span>
                        </p>
                    </div>

                    {/* Progress & HLTB Time */}
                    <div className="space-y-3 pt-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                            <span>Progresso {progress.status === 'COMPLETED' ? 'Finalizado' : progress.status === 'DROPPED' ? 'Dropado' : 'Atual'} <span className="text-zinc-300">({progress.progress_percentage}%)</span></span>
                            {progress.game.hltb_time && <span className={theme.text}>HLTB: ~{progress.game.hltb_time}h</span>}
                        </div>
                        <div className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                            <div className={`h-full ${theme.bg} progress-glow rounded-full transition-all duration-1000`} style={{ width: `${progress.progress_percentage}%` }} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    {(!isUpdating && progress.status === 'COMPLETED') ? (
                        <div className="flex flex-col gap-3 items-center justify-center py-6 rounded-xl bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                            <p className="text-green-500 font-black text-xl text-center drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">Parabéns por finalizar!</p>
                            <div className="flex items-center gap-4 mt-2">
                                <Link
                                    href={`/reviews`}
                                    className="text-sm font-black bg-green-500 text-zinc-950 px-5 py-2 rounded-full hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:scale-105 uppercase tracking-widest"
                                >
                                    Fazer Review
                                </Link>
                                <button onClick={() => setIsUpdating(true)} className="text-sm font-bold text-green-500/80 hover:text-green-400 underline transition-colors">Ajustar Progresso</button>
                            </div>
                        </div>
                    ) : (!isUpdating && progress.status === 'DROPPED') ? (
                        <div className="flex flex-col gap-3 items-center justify-center py-6 rounded-xl bg-red-500/10 border border-red-500/20">
                            <XCircle className="h-10 w-10 text-red-500 mb-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <p className="text-red-500 font-black text-xl text-center drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">Sem problemas, na próxima vai!</p>
                            <button onClick={() => setIsUpdating(true)} className="text-sm font-medium text-red-500/80 hover:text-red-400 underline mt-1 transition-colors">Ajustar Progresso</button>
                        </div>
                    ) : isUpdating ? (
                        <div className="flex flex-col gap-4 p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-inner backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Ajustar Progresso</span>
                                <span className={`font-black text-3xl ${theme.text}`}>{percentage}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                className="w-full h-3 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-[#bd0df2] hover:accent-[#d946ef] transition-colors"
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await updateQuestProgress(progress.game.id, percentage);
                                        if (!res.success) {
                                            alert(res.error || "Erro ao atualizar progresso.");
                                        } else {
                                            setIsUpdating(false);
                                            window.location.reload();
                                        }
                                        setIsLoading(false);
                                    }}
                                    className={`flex-1 ${theme.bg} hover:brightness-110 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.3)] disabled:opacity-50`}
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => { setIsUpdating(false); setPercentage(progress.progress_percentage); }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsUpdating(true)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw className="h-5 w-5" />
                                ATUALIZAR PROGRESSO
                            </button>
                            <div className="flex gap-3">
                                <button
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await completeQuest(progress.game.id);
                                        if (!res.success) {
                                            alert(res.error || "Erro ao completar a quest.");
                                        } else {
                                            window.location.reload();
                                        }
                                        setIsLoading(false);
                                    }}
                                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-green-500/30 disabled:opacity-50"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    COMPLETAR
                                </button>
                                <button
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await dropQuest(progress.game.id);
                                        if (!res.success) {
                                            alert(res.error || "Erro ao dropar a quest.");
                                        } else {
                                            window.location.reload();
                                        }
                                        setIsLoading(false);
                                    }}
                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-red-500/30 disabled:opacity-50"
                                >
                                    <XCircle className="h-5 w-5" />
                                    DROPAR
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
