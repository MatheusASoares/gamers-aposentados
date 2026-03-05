import Link from "next/link";
import Image from "next/image";
import { Clock, Star, TrendingUp, Trophy, Dices, Gamepad2, ChevronRight } from "lucide-react";
import { UserLink } from "@/components/ui/user-link";

// ---- Tipos de evento -----------------------------------------------------

interface GameInfo {
    id: string;
    title: string;
    cover_url: string | null;
    quest_type: string;
}

interface UserInfo {
    id: string;
    name: string | null;
    username: string | null;
}

export interface RaffleEvent {
    kind: "RAFFLE";
    date: Date;
    game: GameInfo;
    poolType: string; // "MAIN_QUEST" | "SIDE_QUEST"
}

export interface ReviewEvent {
    kind: "REVIEW";
    date: Date;
    game: GameInfo;
    user: UserInfo;
    rating: number;
}

export interface ProgressEvent {
    kind: "PROGRESS";
    date: Date;
    game: GameInfo;
    user: UserInfo;
    progress_percentage: number;
}

export interface CompletedEvent {
    kind: "COMPLETED";
    date: Date;
    game: GameInfo;
    user: UserInfo;
}

export type ActivityEvent = RaffleEvent | ReviewEvent | ProgressEvent | CompletedEvent;

// ---- Helpers -------------------------------------------------------------

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
}

function EventIcon({ kind }: { kind: ActivityEvent["kind"] }) {
    const config = {
        RAFFLE: {
            icon: <Dices className="h-4 w-4" />,
            className: "bg-amber-500/20 text-amber-400",
        },
        REVIEW: {
            icon: <Star className="h-4 w-4" />,
            className: "bg-blue-500/20 text-blue-400",
        },
        PROGRESS: {
            icon: <TrendingUp className="h-4 w-4" />,
            className: "bg-[#bd0df2]/20 text-[#bd0df2]",
        },
        COMPLETED: {
            icon: <Trophy className="h-4 w-4" />,
            className: "bg-emerald-500/20 text-emerald-400",
        },
    };
    const { icon, className } = config[kind];
    return (
        <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${className}`}
        >
            {icon}
        </div>
    );
}

function EventDescription({ event }: { event: ActivityEvent }) {
    switch (event.kind) {
        case "RAFFLE":
            return (
                <p className="text-sm text-zinc-300">
                    Sorteio realizado:{" "}
                    <span className="font-bold text-white">{event.game.title}</span>
                    <span className="ml-1.5 text-xs text-zinc-500">
                        ({event.poolType === "MAIN_QUEST" ? "Main Quest" : "Side Quest"})
                    </span>
                </p>
            );
        case "REVIEW":
            return (
                <p className="text-sm text-zinc-300">
                    <UserLink
                        userId={event.user.id}
                        name={event.user.name}
                        username={event.user.username}
                    />{" "}
                    avaliou <span className="font-bold text-white">{event.game.title}</span>
                    {" — "}
                    <span className="font-bold text-yellow-400">{event.rating}/10</span>
                </p>
            );
        case "PROGRESS":
            return (
                <p className="text-sm text-zinc-300">
                    <UserLink
                        userId={event.user.id}
                        name={event.user.name}
                        username={event.user.username}
                    />{" "}
                    atualizou progresso em{" "}
                    <span className="font-bold text-white">{event.game.title}</span>
                    {" — "}
                    <span className="font-bold text-[#bd0df2]">{event.progress_percentage}%</span>
                </p>
            );
        case "COMPLETED":
            return (
                <p className="text-sm text-zinc-300">
                    <UserLink
                        userId={event.user.id}
                        name={event.user.name}
                        username={event.user.username}
                    />{" "}
                    zerou <span className="font-bold text-white">{event.game.title}</span>
                    {" 🏆"}
                </p>
            );
    }
}

// ---- Componente principal ------------------------------------------------

interface RecentActivityProps {
    events: ActivityEvent[];
}

export function RecentActivity({ events }: RecentActivityProps) {
    if (events.length === 0) return null;

    return (
        <div
            className="glass-card animate-fade-in-up overflow-hidden border border-zinc-800"
            style={{ animationDelay: "500ms" }}
            data-testid="recent-activity"
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
                    Ver Quests
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="divide-y divide-zinc-800/60">
                {events.map((event, idx) => (
                    <div
                        key={idx}
                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-800/30"
                        data-testid={`activity-event-${event.kind.toLowerCase()}`}
                    >
                        {/* Thumbnail */}
                        <div className="relative flex h-12 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-800 bg-zinc-900 transition-colors group-hover:border-[#bd0df2]/40">
                            {event.game.cover_url ? (
                                <Image
                                    src={event.game.cover_url}
                                    alt={event.game.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <Gamepad2 className="h-4 w-4 text-zinc-700" />
                            )}
                        </div>

                        {/* Event type icon */}
                        <EventIcon kind={event.kind} />

                        {/* Description */}
                        <div className="min-w-0 flex-1">
                            <EventDescription event={event} />
                        </div>

                        {/* Date */}
                        <span className="flex-shrink-0 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                            {formatDate(event.date)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
