import Image from "next/image";
import { Trophy, Skull, Swords, Sword, Flag, Crown, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestHistoryData } from "@/app/lib/history-actions";

interface QuestHistoryCardProps {
    data: QuestHistoryData;
}

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
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

export function QuestHistoryCard({ data }: QuestHistoryCardProps) {
    const isMainQuest = data.questType === "MAIN";
    const monthName = data.month ? MONTHS[data.month - 1] : "";
    const title = isMainQuest 
        ? `${data.year} — Quarter Winner` 
        : `${monthName} de ${data.year}`;

    // Filter out the winner from candidates to show the "Defeated" games
    const defeatedCandidates = data.candidates.filter(c => c.gameIgdbId !== data.winnerId);
    const unanimous = defeatedCandidates.length === 0;

    // Use the official IGDB artwork/screenshot if available, fallback to cover upscale
    const coverUrl = data.winnerArtworkUrl || data.winnerImageUrl?.replace("t_cover_big", "t_1080p") || null;

    return (
        <div className="group relative z-10 mx-auto w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-2xl transition-all duration-700 hover:border-[#bd0df2]/30 hover:shadow-[0_0_40px_rgba(189,13,242,0.15)]">
            {/* Background Blur Overlay for intense contrast */}
            {coverUrl && (
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen transition-opacity duration-700 group-hover:opacity-40">
                    <Image
                        src={coverUrl}
                        alt="Background Art"
                        fill
                        unoptimized
                        className="scale-125 object-cover blur-[60px]"
                    />
                </div>
            )}
            <div className="absolute inset-0 z-0 bg-linear-to-b from-transparent via-zinc-950/80 to-zinc-950" />
            
            <div className="relative z-10 flex flex-col items-stretch lg:flex-row">
                {/* Left Side: The Winner */}
                <div className="flex w-full flex-col justify-between p-6 lg:w-1/2 lg:border-r lg:border-white/5 lg:p-8">
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <span className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase shadow-lg backdrop-blur-md",
                                isMainQuest 
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500" 
                                    : "border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2]"
                            )}>
                                {isMainQuest ? <Crown className="size-3" /> : <Sword className="size-3" />}
                                {isMainQuest ? "Main Quest" : "Side Quest"}
                            </span>
                            <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                {title}
                            </span>
                        </div>
                        
                        <h2 className="text-shadow-glow mb-4 text-3xl leading-none font-black tracking-tighter text-white uppercase sm:text-4xl lg:text-5xl">
                            {data.winnerTitle}
                        </h2>
                    </div>

                    <div className="mt-6 relative aspect-[2/1] w-full flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-[1.02]">
                        <div className="absolute inset-0 z-0 bg-zinc-950"></div>
                        
                        {coverUrl ? (
                            <Image 
                                src={coverUrl} 
                                alt={data.winnerTitle || "Winner"} 
                                fill 
                                unoptimized 
                                className="z-10 object-contain scale-100 p-2 sm:p-4"
                            />
                        ) : (
                            <div className="z-10 flex h-full w-full items-center justify-center bg-zinc-900">
                                <span className="font-bold text-zinc-700 uppercase">Sem Arte</span>
                            </div>
                        )}
                        <div className="absolute inset-0 z-20 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 rounded-lg bg-zinc-950/80 px-3 py-1.5 backdrop-blur-md">
                            <Trophy className="size-4 text-amber-400" />
                            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Winner</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Players & Losers */}
                <div className="flex w-full flex-col bg-zinc-950/40 p-6 lg:w-1/2 lg:p-8">
                    
                    {/* Players Progress Status */}
                    <div className="mb-6">
                        <h3 className="mb-4 flex items-center gap-2 text-[11px] font-black tracking-widest text-zinc-400 uppercase">
                            <Flag className="size-4 text-[#bd0df2]" /> Status da Missão
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {data.progress.length > 0 ? (
                                data.progress.map((p) => {
                                    const statusObj = getStatusDisplay(p.status);
                                    const StatusIcon = statusObj.icon;
                                    return (
                                        <div 
                                            key={p.userId} 
                                            className={cn(
                                                "relative flex flex-col overflow-hidden rounded-xl border p-3 backdrop-blur-sm transition-all duration-300",
                                                statusObj.bg
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("flex size-8 items-center justify-center rounded-full bg-zinc-950 shadow-inner", statusObj.colors)}>
                                                        <StatusIcon className="size-4" />
                                                    </div>
                                                    <span className="text-xs font-black tracking-wide text-white">
                                                        {p.userName}
                                                    </span>
                                                </div>
                                                <span className={cn("text-xs font-black tracking-widest uppercase", statusObj.colors)}>
                                                    {statusObj.label}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-1">
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-950/50 ring-1 ring-white/5">
                                                    <div 
                                                        className={cn(
                                                            "h-full transition-all duration-1000", 
                                                            p.status === "COMPLETED" ? "bg-amber-500" : 
                                                            p.status === "DROPPED" ? "bg-red-500" : "bg-[#bd0df2]"
                                                        )} 
                                                        style={{ width: `${p.progress_percentage}%` }}
                                                    />
                                                </div>
                                                <div className="mt-1 flex justify-between px-0.5">
                                                    <span className="text-[10px] font-bold text-zinc-500/80 uppercase tracking-widest">Progresso</span>
                                                    <span className={cn("text-xs font-black", statusObj.colors)}>
                                                        {p.progress_percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:col-span-2">
                                    <span className="text-xs font-bold text-zinc-500">Progresso não registrado.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Defeated Candidates Table */}
                    <div className="mt-auto">
                        <h3 className="mb-3 text-[11px] font-black tracking-widest text-zinc-500 uppercase">
                            Mesa de Indicações
                        </h3>
                        
                        {unanimous ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/30 py-8 text-center backdrop-blur-sm">
                                <Crown className="mb-2 size-8 text-amber-400/50" />
                                <span className="text-sm font-bold tracking-widest text-[#bd0df2] uppercase">
                                    Escolha Unânime
                                </span>
                                <span className="mt-1 text-xs font-medium text-zinc-500">
                                    Não houve sorteio neste mês.
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                                {defeatedCandidates.map((cand) => (
                                    <div 
                                        key={cand.id} 
                                        className="group/cand relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-zinc-900/50 transition-colors hover:border-red-500/30 hover:bg-red-500/10"
                                    >
                                        <div className="relative aspect-3/4 w-full bg-zinc-950 opacity-50 grayscale transition-all duration-300 group-hover/cand:opacity-100 group-hover/cand:grayscale-0">
                                            {cand.gameImageUrl ? (
                                                <Image 
                                                    src={cand.gameImageUrl} 
                                                    alt={cand.gameTitle} 
                                                    fill 
                                                    unoptimized
                                                    className="object-cover" 
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <span className="text-[10px] font-bold text-zinc-700">Sem Capa</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                                        
                                        <div className="absolute bottom-0 left-0 flex w-full flex-col p-2">
                                            <span className="truncate text-[10px] font-black text-white">
                                                {cand.gameTitle}
                                            </span>
                                            <span className="truncate text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
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
        </div>
    );
}
