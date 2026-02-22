"use client";
import { useState } from 'react';
import { Flame, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
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
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-[#bd0df2]/20 border border-[#bd0df2]/50 text-[#bd0df2] text-xs font-black rounded-lg uppercase tracking-widest">
                                Side Quest
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-white">{progress.game.title}</h3>
                        <p className="text-xs text-zinc-400">
                            Indicado por: {progress.game.nominator?.name ?? progress.game.nominator?.username ?? 'Desconhecido'}
                        </p>
                    </div>

                    {/* Progress & HLTB Time */}
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            <span>Progresso ({progress.progress_percentage}%)</span>
                            {progress.game.hltb_time && <span className="text-[#bd0df2]">HLTB: ~{progress.game.hltb_time}h</span>}
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-[#bd0df2]/60 rounded-full transition-all duration-1000" style={{ width: `${progress.progress_percentage}%` }} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    {isUpdating ? (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="0" max="100"
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 text-white text-sm focus:border-[#bd0df2] focus:outline-none"
                            />
                            <button
                                disabled={isLoading}
                                onClick={async () => {
                                    setIsLoading(true);
                                    await updateQuestProgress(progress.game.id, percentage);
                                    setIsLoading(false);
                                    setIsUpdating(false);
                                }}
                                className="bg-[#bd0df2] hover:bg-[#bd0df2]/90 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(189,13,242,0.3)] disabled:opacity-50"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={() => setIsUpdating(false)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
                            >
                                X
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsUpdating(true)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <RefreshCw className="h-4 w-4" />
                            ATUALIZAR PROGRESSO
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button
                            disabled={isLoading}
                            onClick={async () => {
                                if (!confirm("Tem certeza que quer COMLETAR este jogo?")) return;
                                setIsLoading(true);
                                await completeQuest(progress.game.id);
                                setIsLoading(false);
                            }}
                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-green-500/30 disabled:opacity-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            COMPLETAR
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={async () => {
                                if (!confirm("Tem certeza que quer DROPAR este jogo?")) return;
                                setIsLoading(true);
                                await dropQuest(progress.game.id);
                                setIsLoading(false);
                            }}
                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-red-500/30 disabled:opacity-50"
                        >
                            <XCircle className="h-4 w-4" />
                            DROPAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
