"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Trophy,
    Skull,
    Swords,
    Sword,
    Flag,
    Crown,
    History,
    CheckCircle,
    RefreshCw,
    RotateCcw,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestHistoryData } from "@/app/lib/history-actions";
import { completeQuest, updateQuestProgress, resumeDroppedQuest } from "@/app/lib/quest-actions";

interface QuestHistoryCardProps {
    data: QuestHistoryData;
    currentUserId: string;
    priority?: boolean;
}

const MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

function getStatusDisplay(status: string) {
    switch (status) {
        case "COMPLETED":
            return {
                label: "Zerou",
                icon: Trophy,
                colors: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                bg: "bg-amber-400/10 border-amber-400/30",
            };
        case "DROPPED":
            return {
                label: "Dropou",
                icon: Skull,
                colors: "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]",
                bg: "bg-red-500/10 border-red-500/30",
            };
        case "ACTIVE":
            return {
                label: "Jogando",
                icon: Swords,
                colors: "text-[#bd0df2] drop-shadow-[0_0_8px_rgba(189,13,242,0.6)]",
                bg: "bg-[#bd0df2]/10 border-[#bd0df2]/30",
            };
        default:
            return {
                label: "Na Fila",
                icon: History,
                colors: "text-zinc-500",
                bg: "bg-zinc-800/30 border-white/5",
            };
    }
}

export function QuestHistoryCard({ data, currentUserId, priority = false }: QuestHistoryCardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [percentage, setPercentage] = useState(0);

    const isMainQuest = data.questType === "MAIN";
    const monthName = data.month ? MONTHS[data.month - 1] : "";
    const title = isMainQuest ? `${data.year} — Quarter Winner` : `${monthName} de ${data.year}`;

    // Filter out the winner from candidates to show the "Defeated" games
    const defeatedCandidates = data.candidates.filter((c) => c.gameIgdbId !== data.winnerId);
    const unanimous = defeatedCandidates.length === 0;

    // Use the official IGDB artwork/screenshot for the ambient background if available
    const bgUrl =
        data.winnerArtworkUrl || data.winnerImageUrl?.replace("t_cover_big", "t_1080p") || null;

    // Always use the cover_url (which is a vertical poster) for the main image to prevent bad cropping
    const posterUrl = data.winnerImageUrl?.replace("t_cover_big", "t_1080p") || null;

    return (
        <div className="group relative z-10 mx-auto w-full overflow-hidden rounded-[2.5rem] glass-card border border-theme shadow-2xl transition-all duration-700 hover:border-theme-primary/30 hover:shadow-[0_0_50px_var(--theme-glow)]">
            {/* Background Blur Overlay for intense contrast */}
            {bgUrl && (
                <div className="pointer-events-none absolute inset-0 z-0 opacity-15 mix-blend-screen transition-opacity duration-700 group-hover:opacity-30">
                    <Image
                        src={bgUrl}
                        alt="Background Art"
                        fill
                        sizes="100vw"
                        unoptimized
                        className="scale-110 object-cover blur-[80px]"
                    />
                </div>
            )}
            <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-transparent via-zinc-950/90 to-zinc-950" />

            <div className="relative z-10 flex flex-col gap-10 p-6 sm:p-8 lg:gap-12 lg:p-10">
                {/* 1. SEÇÃO PRINCIPAL: Poster Gigante + Info */}
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:gap-12">
                    {/* ESQUERDA: Capa do Jogo (Ganha mais espaço e destaque) */}
                    <div className="mx-auto flex w-full max-w-sm shrink-0 flex-col sm:w-[60%] lg:mx-0 lg:w-[35%] xl:w-[30%]">
                        {/* Título Mobile */}
                        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
                            <div className="mb-4 flex items-center justify-center gap-2">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-black tracking-[0.2em] uppercase shadow-lg backdrop-blur-md",
                                        isMainQuest
                                            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                            : "border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2]",
                                    )}
                                >
                                    {isMainQuest ? (
                                        <Crown className="size-3.5" />
                                    ) : (
                                        <Sword className="size-3.5" />
                                    )}
                                    {isMainQuest ? "Main Quest" : "Side Quest"}
                                </span>
                            </div>
                            <h2 className="text-shadow-glow text-3xl leading-[1.1] font-black tracking-tighter text-white uppercase sm:text-4xl">
                                {data.winnerTitle}
                            </h2>
                            <p className="mt-3 text-sm font-bold tracking-widest text-zinc-400 uppercase">
                                {title}
                            </p>
                        </div>

                        <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-[1.02]">
                            <div className="absolute inset-0 z-0 bg-zinc-900"></div>

                            {posterUrl ? (
                                <Image
                                    src={posterUrl}
                                    alt={data.winnerTitle || "Winner"}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 45vw"
                                    unoptimized
                                    priority={priority}
                                    className="z-10 object-cover"
                                />
                            ) : (
                                <div className="z-10 flex h-full w-full items-center justify-center bg-zinc-900">
                                    <span className="font-bold tracking-widest text-zinc-700 uppercase">
                                        Sem Arte
                                    </span>
                                </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-5 left-5 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-2 backdrop-blur-md">
                                <Trophy className="size-5 text-amber-400" />
                                <span className="text-sm font-black tracking-widest text-amber-400 uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                    Winner
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* DIREITA: Título Desktop + Status de Progresso */}
                    <div className="flex w-full flex-col justify-center lg:w-[65%] xl:w-[70%]">
                        {/* Título Desktop */}
                        <div className="mb-10 hidden flex-col items-start lg:flex">
                            <div className="mb-5 flex flex-wrap items-center gap-4">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-black tracking-[0.2em] uppercase shadow-lg backdrop-blur-md",
                                        isMainQuest
                                            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                            : "border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2]",
                                    )}
                                >
                                    {isMainQuest ? (
                                        <Crown className="size-3.5" />
                                    ) : (
                                        <Sword className="size-3.5" />
                                    )}
                                    {isMainQuest ? "Main Quest" : "Side Quest"}
                                </span>
                                <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                                    {title}
                                </span>
                            </div>

                            <h2 className="text-shadow-glow text-4xl leading-[1.1] font-black tracking-tighter text-white uppercase xl:text-5xl 2xl:text-6xl">
                                {data.winnerTitle}
                            </h2>
                        </div>

                        {/* Box de Progresso dos Players */}
                        <div className="flex w-full flex-col gap-6 rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
                            <div className="flex items-center gap-3">
                                <Flag className="size-6 text-[#bd0df2]" />
                                <h3 className="text-base font-black tracking-widest text-zinc-300 uppercase">
                                    Status da Missão
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {data.progress.length > 0 ? (
                                    data.progress.map((p) => {
                                        const statusObj = getStatusDisplay(p.status);
                                        const StatusIcon = statusObj.icon;
                                        return (
                                            <div
                                                key={p.userId}
                                                className={cn(
                                                    "relative flex flex-col overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all duration-300",
                                                    statusObj.bg,
                                                )}
                                            >
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "flex size-12 items-center justify-center rounded-full bg-zinc-950 shadow-inner",
                                                                statusObj.colors,
                                                            )}
                                                        >
                                                            <StatusIcon className="size-5" />
                                                        </div>
                                                        <span className="text-base font-black tracking-wide text-white">
                                                            {p.userName}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-xs font-black tracking-widest uppercase",
                                                            statusObj.colors,
                                                        )}
                                                    >
                                                        {statusObj.label}
                                                    </span>
                                                </div>

                                                {/* Barra de Progresso */}
                                                <div className="mt-1">
                                                    <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-950/60 ring-1 ring-white/5">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all duration-1000",
                                                                p.status === "COMPLETED"
                                                                    ? "bg-amber-500"
                                                                    : p.status === "DROPPED"
                                                                      ? "bg-red-500"
                                                                      : "bg-[#bd0df2]",
                                                            )}
                                                            style={{
                                                                width: `${p.progress_percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="mt-3 flex justify-between px-1">
                                                        <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                                            Progresso
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-sm font-black",
                                                                statusObj.colors,
                                                            )}
                                                        >
                                                            {p.progress_percentage}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Ações para o Usuário Logado */}
                                                {p.userId === currentUserId && (
                                                    <div className="mt-5 flex flex-col gap-2">
                                                        {!isUpdating ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {p.status === "DROPPED" && (
                                                                    <button
                                                                        disabled={isLoading}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setIsLoading(true);
                                                                            const res = await resumeDroppedQuest(
                                                                                data.winnerId || "",
                                                                            );
                                                                            if (!res.success)
                                                                                alert(res.error || "Erro ao retomar quest.");
                                                                            else
                                                                                router.refresh();
                                                                            setIsLoading(false);
                                                                        }}
                                                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/30 bg-[#bd0df2]/15 py-3 text-xs font-black tracking-widest text-[#bd0df2] uppercase transition-all hover:bg-[#bd0df2]/25 hover:shadow-[0_0_15px_rgba(189,13,242,0.3)] disabled:opacity-50"
                                                                    >
                                                                        <RotateCcw className="size-4" />
                                                                        Retomar Quest
                                                                    </button>
                                                                )}
                                                                {p.status !== "COMPLETED" && p.status !== "DROPPED" && (
                                                                    <button
                                                                        disabled={isLoading}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setIsLoading(true);
                                                                            const res =
                                                                                await completeQuest(
                                                                                    data.winnerId ||
                                                                                        "",
                                                                                );
                                                                            if (!res.success)
                                                                                alert(res.error);
                                                                            else
                                                                                router.refresh();
                                                                            setIsLoading(false);
                                                                        }}
                                                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 py-3 text-xs font-black tracking-widest text-green-500 uppercase transition-all hover:bg-green-500/20 disabled:opacity-50"
                                                                    >
                                                                        <CheckCircle className="size-4" />
                                                                        Zerou?
                                                                    </button>
                                                                )}
                                                                <button
                                                                    disabled={isLoading}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPercentage(
                                                                            p.progress_percentage,
                                                                        );
                                                                        setIsUpdating(true);
                                                                    }}
                                                                    className={cn(
                                                                        "flex items-center justify-center gap-2 rounded-xl border transition-all disabled:opacity-50",
                                                                        p.status === "COMPLETED"
                                                                            ? "flex-1 border-white/10 bg-zinc-900/80 py-3 text-xs font-black tracking-widest text-zinc-400 uppercase hover:bg-zinc-800"
                                                                            : "border-white/10 bg-zinc-900/80 px-4 py-3 text-xs font-black tracking-widest text-zinc-400 uppercase hover:bg-zinc-800",
                                                                    )}
                                                                >
                                                                    <RefreshCw
                                                                        className={cn(
                                                                            "size-4",
                                                                            isLoading &&
                                                                                "animate-spin",
                                                                        )}
                                                                    />
                                                                    {p.status === "COMPLETED" &&
                                                                        "Editar Progresso"}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-950 p-4 shadow-inner">
                                                                <div className="flex items-center justify-between px-1">
                                                                    <span className="text-xs font-black text-zinc-400 uppercase">
                                                                        Ajustar:{" "}
                                                                        <span className="text-[#bd0df2]">
                                                                            {percentage}%
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    aria-label="Ajustar porcentagem de progresso do jogo"
                                                                    aria-valuenow={percentage}
                                                                    min="0"
                                                                    max="100"
                                                                    value={percentage}
                                                                    onChange={(e) =>
                                                                        setPercentage(
                                                                            parseInt(
                                                                                e.target.value,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-900 accent-[#bd0df2]"
                                                                />
                                                                <div className="mt-2 flex gap-2">
                                                                    <button
                                                                        disabled={isLoading}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setIsLoading(true);
                                                                            const res =
                                                                                await updateQuestProgress(
                                                                                    data.winnerId ||
                                                                                        "",
                                                                                    percentage,
                                                                                );
                                                                            if (!res.success)
                                                                                alert(res.error);
                                                                            else
                                                                                setIsUpdating(
                                                                                    false,
                                                                                );
                                                                            setIsLoading(false);
                                                                        }}
                                                                        className="flex-1 rounded-lg bg-[#bd0df2] py-3 text-xs font-black text-white uppercase transition-all hover:brightness-110 disabled:opacity-50"
                                                                    >
                                                                        Salvar
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsUpdating(false);
                                                                        }}
                                                                        className="flex items-center justify-center rounded-lg bg-zinc-800 px-5 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white"
                                                                    >
                                                                        <X className="size-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-1 flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center xl:col-span-2">
                                        <span className="text-sm font-bold tracking-widest text-zinc-500 uppercase">
                                            Progresso não registrado.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SEÇÃO INFERIOR: Mesa de Indicações (Fica Embaixo para não espremer a Capa) */}
                <div className="mt-2 w-full border-t border-white/5 pt-8">
                    <div className="mb-6 flex items-center gap-2">
                        <History className="size-4 text-zinc-500" />
                        <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase">
                            Mesa de Indicações
                        </h3>
                    </div>

                    {unanimous ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/30 py-10 text-center backdrop-blur-sm">
                            <Crown className="mb-3 size-10 text-amber-400/50 drop-shadow-md" />
                            <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.4)]">
                                Escolha Unânime
                            </span>
                            <span className="mt-2 text-xs font-bold tracking-wider text-zinc-500">
                                Não houve sorteio neste mês.
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {defeatedCandidates.map((cand) => (
                                <div
                                    key={cand.id}
                                    className="group/cand relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 transition-all hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                                >
                                    <div className="relative aspect-[3/4] w-full bg-zinc-950 opacity-60 grayscale transition-all duration-500 group-hover/cand:opacity-100 group-hover/cand:grayscale-0">
                                        {cand.gameImageUrl ? (
                                            <Image
                                                src={cand.gameImageUrl}
                                                alt={cand.gameTitle}
                                                fill
                                                sizes="(max-width: 768px) 50vw, 20vw"
                                                unoptimized
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <span className="text-xs font-bold tracking-widest text-zinc-700 uppercase">
                                                    Sem Capa
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                                    <div className="absolute bottom-0 left-0 flex w-full flex-col p-3 transition-transform duration-300 group-hover/cand:-translate-y-1">
                                        <span className="truncate text-xs font-black text-white">
                                            {cand.gameTitle}
                                        </span>
                                        <span className="mt-0.5 truncate text-xs font-bold tracking-wider text-red-400 uppercase">
                                            por {cand.nominatorName}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
