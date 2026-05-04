"use client";
import { useState } from "react";
import Link from "next/link";
import { Flame, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { updateQuestProgress, completeQuest, dropQuest, joinQuest } from "@/app/lib/quest-actions";
import { UserLink } from "@/components/ui/user-link";
import Image from "next/image";
import { HltbBadge } from "@/components/game/HltbBadge";

interface SideQuestBarProps {
    progress: {
        status: string;
        progress_percentage: number;
        game: {
            id: string;
            title: string;
            cover_url: string | null;
            hltb_time: number | null;
            nominator: { id: string; name: string | null; username: string | null } | null;
        };
    } | null;
    activePool?: {
        winner_game: null | {
            id: string;
            title: string;
            cover_url: string | null;
            hltb_time: number | null;
            nominator: { id: string; name: string | null; username: string | null } | null;
        };
    } | null;
}

export function SideQuestBar({ progress, activePool }: SideQuestBarProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [percentage, setPercentage] = useState(progress?.progress_percentage || 0);
    const [isLoading, setIsLoading] = useState(false);

    const game = progress?.game || activePool?.winner_game;

    if (!game) {
        return (
            <div
                className="glass-card animate-fade-in-up group flex h-full min-h-[400px] flex-col overflow-hidden border-t-4 border-t-zinc-700 opacity-60"
                style={{ animationDelay: "100ms" }}
            >
                <div className="relative flex h-48 w-full flex-shrink-0 flex-col items-center justify-center space-y-4 bg-zinc-900/50 sm:h-64">
                    <Flame className="h-20 w-20 text-zinc-700" />
                    <span className="text-base font-bold tracking-widest text-zinc-600 uppercase">
                        Aguardando Sorteio
                    </span>
                </div>
                <div className="z-10 flex w-full flex-1 flex-col space-y-3 bg-[#09090b] p-6 sm:p-8">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Side Quest
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-500">Nenhum Jogo Ativo</h3>
                    <p className="text-sm text-zinc-600">
                        Nenhum Side Quest em andamento no momento. Vá ao Randomizer para escolher.
                    </p>
                </div>
            </div>
        );
    }

    const getThemeClasses = () => {
        if (progress?.status === "COMPLETED")
            return {
                border: "border-t-green-500 hover:border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]",
                text: "text-green-500",
                bg: "bg-green-500",
                badge: "bg-green-500/20 border-green-500/50 text-green-500",
            };
        if (progress?.status === "DROPPED")
            return {
                border: "border-t-red-500 hover:border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
                text: "text-red-500",
                bg: "bg-red-500",
                badge: "bg-red-500/20 border-red-500/50 text-red-500",
            };
        return {
            border: "border-t-[#bd0df2] hover:border-[#bd0df2]/50 shadow-[0_0_20px_rgba(189,13,242,0.15)]",
            text: "text-[#bd0df2]",
            bg: "bg-[#bd0df2]",
            badge: "bg-[#bd0df2]/20 border-[#bd0df2]/50 text-[#bd0df2]",
        };
    };
    const theme = getThemeClasses();

    return (
        <div
            className={`glass-card animate-fade-in-up group flex h-full min-h-[400px] flex-col overflow-hidden rounded-[2rem] border border-t-0 border-white/5 bg-zinc-950/80 shadow-2xl transition-all duration-500 hover:border-[#bd0df2]/30 hover:shadow-[#bd0df2]/10`}
            style={{ animationDelay: "100ms" }}
        >
            {/* Dark/Grain/Glow Background Effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#12001a]" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />

            {/* Cover Image Side (Top Banner) */}
            <div className="relative flex h-64 w-full flex-shrink-0 items-end overflow-hidden sm:h-80">
                {game.cover_url ? (
                    <>
                        {/* Enlarged Blurred Background Image */}
                        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
                            <Image
                                alt={game.title}
                                className="scale-125 object-cover blur-3xl"
                                src={game.cover_url.replace("t_cover_big", "t_1080p")}
                                fill
                                sizes="100vw"
                                unoptimized
                            />
                        </div>
                        {/* Gradient to darken the bottom of the banner so text pops */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

                        {/* Content overlapping the banner */}
                        <div className="relative z-10 flex w-full flex-row items-end gap-6 p-6 sm:p-8">
                            {/* Crisp Box Art */}
                            <div className="relative h-44 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105 sm:h-56 sm:w-40">
                                <Image
                                    alt={game.title}
                                    className="object-cover"
                                    src={game.cover_url.replace("t_cover_big", "t_1080p")}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 30vw"
                                    unoptimized
                                />
                            </div>

                            {/* Title Block */}
                            <div className="flex flex-col justify-end pb-2">
                                <div className="mb-3 flex items-center gap-2">
                                    <span
                                        className={`px-4 py-1.5 ${theme.badge} rounded-full border border-[#bd0df2]/30 text-[10px] font-black tracking-[0.2em] uppercase backdrop-blur-md`}
                                    >
                                        Side Quest
                                    </span>
                                </div>
                                <h3 className="text-3xl leading-[1.1] font-black tracking-tighter text-white drop-shadow-md sm:text-4xl">
                                    {game.title}
                                </h3>
                                <p className="mt-3 text-sm font-medium text-zinc-400">
                                    Indicado por:{" "}
                                    {game.nominator ? (
                                        <span className="font-bold text-white transition-colors hover:text-[#bd0df2]">
                                            <UserLink
                                                userId={game.nominator.id}
                                                name={game.nominator.name}
                                                username={game.nominator.username}
                                            />
                                        </span>
                                    ) : (
                                        <span className="font-bold text-white">Desconhecido</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center border-b border-zinc-800 bg-zinc-900">
                        <Flame className="h-24 w-24 text-[#bd0df2]/50" />
                    </div>
                )}
            </div>

            {/* Info Side (Bottom) */}
            <div className="relative z-10 flex w-full flex-1 flex-col justify-between bg-zinc-950/80 p-6 pt-0 backdrop-blur-sm sm:p-8 sm:pt-4">
                <div className="space-y-4">
                    {/* Progress & HLTB Time */}
                    {progress ? (
                        <div className="space-y-3 pt-3">
                            <div className="flex justify-between text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                                <span>
                                    Progresso{" "}
                                    {progress.status === "COMPLETED"
                                        ? "Finalizado"
                                        : progress.status === "DROPPED"
                                          ? "Dropado"
                                          : "Atual"}{" "}
                                    <span className="text-zinc-300">
                                        ({progress.progress_percentage}%)
                                    </span>
                                </span>
                                <HltbBadge hours={game.hltb_time} className="h-5" />
                            </div>
                            <div className="h-4 overflow-hidden rounded-full border border-zinc-800/50 bg-zinc-900">
                                <div
                                    className={`h-full ${theme.bg} progress-glow rounded-full transition-all duration-1000`}
                                    style={{ width: `${progress.progress_percentage}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="pt-3">
                            <HltbBadge hours={game.hltb_time} className="h-5" />
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    {!progress ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5 bg-zinc-900/40 py-6">
                            <p className="px-4 text-center text-sm font-medium text-zinc-400">
                                Você não está participando desta quest com a comunidade.
                            </p>
                            <button
                                disabled={isLoading}
                                onClick={async () => {
                                    setIsLoading(true);
                                    const res = await joinQuest(game.id);
                                    if (!res.success) alert(res.error);
                                    else window.location.reload();
                                    setIsLoading(false);
                                }}
                                className={`mt-2 ${theme.bg} rounded-xl px-8 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.3)] transition-all hover:scale-105 disabled:opacity-50`}
                            >
                                Entrar na Quest
                            </button>
                        </div>
                    ) : !isUpdating && progress.status === "COMPLETED" ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 py-6">
                            <CheckCircle className="mb-1 h-10 w-10 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                            <p className="text-center text-xl font-black text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                                Parabéns por finalizar!
                            </p>
                            <div className="mt-2 flex items-center gap-4">
                                <Link
                                    href={`/reviews`}
                                    className="rounded-full bg-green-500 px-5 py-2 text-sm font-black tracking-widest text-zinc-950 uppercase shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all hover:scale-105 hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                                >
                                    Fazer Review
                                </Link>
                                <button
                                    onClick={() => setIsUpdating(true)}
                                    className="text-sm font-bold text-green-500/80 underline transition-colors hover:text-green-400"
                                >
                                    Ajustar Progresso
                                </button>
                            </div>
                        </div>
                    ) : !isUpdating && progress.status === "DROPPED" ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 py-6">
                            <XCircle className="mb-1 h-10 w-10 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <p className="text-center text-xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                                Sem problemas, na próxima vai!
                            </p>
                            <button
                                onClick={() => setIsUpdating(true)}
                                className="mt-1 text-sm font-medium text-red-500/80 underline transition-colors hover:text-red-400"
                            >
                                Ajustar Progresso
                            </button>
                        </div>
                    ) : isUpdating ? (
                        <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-inner backdrop-blur-sm">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-bold tracking-wider text-zinc-400 uppercase">
                                    Ajustar Progresso
                                </span>
                                <span className={`text-3xl font-black ${theme.text}`}>
                                    {percentage}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={percentage}
                                onChange={(e) => setPercentage(Number(e.target.value))}
                                className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-zinc-950 accent-[#bd0df2] transition-colors hover:accent-[#d946ef]"
                            />
                            <div className="mt-4 flex gap-3">
                                <button
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await updateQuestProgress(game.id, percentage);
                                        if (!res.success) {
                                            alert(res.error || "Erro ao atualizar progresso.");
                                        } else {
                                            setIsUpdating(false);
                                            window.location.reload();
                                        }
                                        setIsLoading(false);
                                    }}
                                    className={`flex-1 ${theme.bg} rounded-xl py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.3)] transition-all hover:brightness-110 disabled:opacity-50`}
                                >
                                    Salvar
                                </button>
                                <button
                                    onClick={() => {
                                        setIsUpdating(false);
                                        setPercentage(progress?.progress_percentage || 0);
                                    }}
                                    className="rounded-xl bg-zinc-800 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-700"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsUpdating(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-700"
                            >
                                <RefreshCw className="h-5 w-5" />
                                ATUALIZAR PROGRESSO
                            </button>
                            <div className="flex gap-3">
                                <button
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await completeQuest(game.id);
                                        if (!res.success) {
                                            alert(res.error || "Erro ao completar a quest.");
                                        } else {
                                            window.location.reload();
                                        }
                                        setIsLoading(false);
                                    }}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/20 py-4 text-sm font-bold text-green-500 transition-all hover:bg-green-500/30 disabled:opacity-50"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    COMPLETAR
                                </button>
                                <button
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await dropQuest(game.id);
                                        if (!res.success) {
                                            alert(res.error || "Erro ao dropar a quest.");
                                        } else {
                                            window.location.reload();
                                        }
                                        setIsLoading(false);
                                    }}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 py-4 text-sm font-bold text-red-500 transition-all hover:bg-red-500/30 disabled:opacity-50"
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
