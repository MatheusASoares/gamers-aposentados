import Image from "next/image";
import { Clock, Star, TrendingUp, Trophy, Dices, Gamepad2, Moon, PlusCircle } from "lucide-react";
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

export interface DroppedEvent {
    kind: "DROPPED";
    date: Date;
    game: GameInfo;
    user: UserInfo;
}

export interface SuggestedEvent {
    kind: "SUGGESTED";
    date: Date;
    game: GameInfo;
    user: UserInfo;
}

export type ActivityEvent = RaffleEvent | ReviewEvent | ProgressEvent | CompletedEvent | DroppedEvent | SuggestedEvent;

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
        DROPPED: {
            icon: <Moon className="h-4 w-4" />,
            className: "bg-rose-500/20 text-rose-400",
        },
        SUGGESTED: {
            icon: <PlusCircle className="h-4 w-4" />,
            className: "bg-sky-500/20 text-sky-400",
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

function getRatingColor(rating: number) {
    if (rating === 10) return "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]";
    if (rating >= 8) return "text-emerald-400";
    if (rating >= 6) return "text-sky-400";
    if (rating >= 4) return "text-amber-500";
    return "text-rose-500";
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
                    <span className={`font-bold ${getRatingColor(event.rating)}`}>{event.rating}/10</span>
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
        case "DROPPED":
            return (
                <p className="text-sm text-zinc-300">
                    <UserLink
                        userId={event.user.id}
                        name={event.user.name}
                        username={event.user.username}
                    />{" "}
                    se aposentou de <span className="font-bold text-white">{event.game.title}</span>
                    <span className="ml-1 text-xs text-zinc-500">(Dropado)</span> 💤
                </p>
            );
        case "SUGGESTED":
            return (
                <p className="text-sm text-zinc-300">
                    <UserLink
                        userId={event.user.id}
                        name={event.user.name}
                        username={event.user.username}
                    />{" "}
                    indicou <span className="font-bold text-white">{event.game.title}</span> ao backlog! 🎮
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
            className="glass-card border border-theme bg-theme-card animate-fade-in-up relative flex flex-col overflow-hidden rounded-[1.5rem] shadow-2xl"
            style={{ animationDelay: "500ms" }}
            data-testid="recent-activity"
        >
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-[#12001a]" />
            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: "url('/noise.svg')" }}
            />

            <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-zinc-950/40 px-5 py-4 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 text-base font-black tracking-widest text-white uppercase drop-shadow-sm">
                    <Clock className="h-5 w-5 text-[#bd0df2]" />
                    Histórico do Asilo
                </h3>
            </div>

            <div className="relative z-10 divide-y divide-white/5 bg-zinc-950/60 backdrop-blur-md flex-1">
                {events.map((event, idx) => (
                    <div
                        key={idx}
                        className="group flex items-center gap-5 px-5 py-3.5 transition-all duration-300 hover:bg-zinc-800/40 hover:pl-6"
                        data-testid={`activity-event-${event.kind.toLowerCase()}`}
                    >
                        {/* Thumbnail */}
                        <div className="relative flex h-12 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110 group-hover:border-[#bd0df2]/50 group-hover:shadow-[0_0_20px_rgba(189,13,242,0.3)]">
                            {event.game.cover_url ? (
                                <Image
                                    src={event.game.cover_url}
                                    alt={event.game.title}
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                />
                            ) : (
                                <Gamepad2 className="h-4 w-4 text-zinc-700" />
                            )}
                        </div>

                        {/* Event type icon */}
                        <EventIcon kind={event.kind} />

                        {/* Description */}
                        <div className="min-w-0 flex-1 pl-1">
                            <EventDescription event={event} />
                        </div>

                        {/* Date */}
                        <span className="flex-shrink-0 text-xs font-black tracking-widest text-zinc-500 uppercase transition-colors group-hover:text-zinc-400">
                            {formatDate(event.date)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer Humorous Subtext */}
            <div className="relative z-10 border-t border-white/5 bg-zinc-950/40 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-xs font-black tracking-widest text-zinc-600 uppercase">
                    Nenhuma artrose foi prejudicada na atualização deste feed.
                </p>
            </div>
        </div>
    );
}
