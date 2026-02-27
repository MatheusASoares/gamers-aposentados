import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ChevronRight, Gamepad2 } from "lucide-react";

interface RecentGame {
    id: string;
    status: string;
    updated_at: Date;
    game: {
        title: string;
        quest_type: string;
        cover_url: string | null;
        hltb_time: number | null;
        nominator: { name: string | null; username: string | null } | null;
    };
}

interface RecentGamesProps {
    games: RecentGame[];
}

function getStatusColor(status: string) {
    switch (status) {
        case "ACTIVE":
            return "bg-[#bd0df2]/20 text-[#bd0df2] border-[#bd0df2]/30";
        case "COMPLETED":
            return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        case "DROPPED":
            return "bg-red-500/20 text-red-400 border-red-500/30";
        case "SUGGESTED":
            return "bg-zinc-700/40 text-zinc-400 border-zinc-600/30";
        case "IN_POOL":
            return "bg-amber-500/20 text-amber-400 border-amber-500/30";
        default:
            return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case "ACTIVE":
            return "Ativo";
        case "COMPLETED":
            return "Zerado";
        case "DROPPED":
            return "Dropado";
        case "SUGGESTED":
            return "Sugerido";
        case "IN_POOL":
            return "No Pote";
        default:
            return status;
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
}

export function RecentGames({ games }: RecentGamesProps) {
    if (games.length === 0) {
        return null;
    }

    return (
        <div
            className="glass-card animate-fade-in-up overflow-hidden border border-zinc-800"
            style={{ animationDelay: "500ms" }}
        >
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
                <h3 className="flex items-center gap-2 text-base font-bold tracking-widest text-white uppercase">
                    <Clock className="h-5 w-5 text-[#bd0df2]" />
                    Atividade Recente
                </h3>
                <Link
                    href="/quests"
                    className="flex items-center gap-1 text-sm font-bold tracking-wider text-[#bd0df2] uppercase hover:underline"
                >
                    Ver Todas
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="divide-y divide-zinc-800/60">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-800/30"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                            {/* Quest Thumbnail */}
                            <div className="relative flex h-20 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-md transition-colors group-hover:border-[#bd0df2]/50">
                                {game.game.cover_url ? (
                                    <Image
                                        src={game.game.cover_url}
                                        alt={game.game.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Gamepad2 className="h-6 w-6 text-zinc-700" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="truncate text-base font-bold text-white">
                                        {game.game.title}
                                    </h4>
                                    <span
                                        className={`flex-shrink-0 rounded border px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${getStatusColor(game.status)}`}
                                    >
                                        {getStatusLabel(game.status)}
                                    </span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-4 text-zinc-400">
                                    {game.game.nominator && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium">
                                            <User className="h-3.5 w-3.5" />
                                            {game.game.nominator.name ??
                                                game.game.nominator.username ??
                                                "Anônimo"}
                                        </span>
                                    )}
                                    {game.game.hltb_time && (
                                        <span className="flex items-center gap-1.5 text-xs font-medium">
                                            <Clock className="h-3.5 w-3.5" />~{game.game.hltb_time}h
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <span className="flex-shrink-0 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                            {formatDate(game.updated_at)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
