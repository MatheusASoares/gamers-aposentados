import { useState } from "react";
import Image from "next/image";
import {
    ArrowRight,
    Calendar,
    Share2,
    User,
    Trash2,
    Check,
    Star,
    Camera,
    X,
    ChevronLeft,
    ChevronRight,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { deleteReview } from "@/app/lib/review-actions";
import { EditReviewModal } from "./EditReviewModal";
import { UserLink } from "@/components/ui/user-link";
import { useRouter } from "next/navigation";

const DIFFICULTY_MAP: Record<number, { label: string; icon: string; color: string }> = {
    1: { label: "Muito Fácil", icon: "🟢", color: "border-emerald-500/30 text-emerald-400 bg-emerald-950/40" },
    2: { label: "Tranquilo", icon: "🔵", color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/40" },
    3: { label: "Desafiador", icon: "🟡", color: "border-amber-500/30 text-amber-400 bg-amber-950/40" },
    4: { label: "Difícil", icon: "🟠", color: "border-orange-500/30 text-orange-400 bg-orange-950/40" },
    5: { label: "Extremo", icon: "🔴", color: "border-rose-500/30 text-rose-400 bg-rose-950/40" },
};

const getRatingStyle = (rating: number) => {
    if (rating === 10) {
        return {
            container: "border-amber-400/80 bg-gradient-to-b from-amber-400 to-amber-600 text-zinc-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] font-black",
            text: "text-2xl font-black drop-shadow-md leading-none",
            showStar: true,
        };
    }
    if (rating >= 8) {
        return {
            container: "border-emerald-500/60 bg-gradient-to-b from-emerald-500 to-emerald-700 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] font-black",
            text: "text-xl font-black drop-shadow-md",
            showStar: false,
        };
    }
    if (rating >= 6) {
        return {
            container: "border-cyan-500/60 bg-gradient-to-b from-cyan-500 to-cyan-700 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-black",
            text: "text-xl font-black drop-shadow-md",
            showStar: false,
        };
    }
    if (rating >= 4) {
        return {
            container: "border-amber-500/60 bg-gradient-to-b from-amber-500 to-amber-700 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-black",
            text: "text-xl font-black drop-shadow-md",
            showStar: false,
        };
    }
    return {
        container: "border-rose-500/60 bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] font-black",
        text: "text-xl font-black drop-shadow-md",
        showStar: false,
    };
};

export interface ReviewCardProps {
    review: {
        id: string;
        user_id: string;
        rating: number;
        difficulty?: number | null;
        hours_played?: number | null;
        review_text: string | null;
        screenshots?: string[];
        created_at: Date;
        user: {
            name: string | null;
            username: string | null;
            image?: string | null;
        };
        game: {
            title: string;
            cover_url: string | null;
            platform: string | null;
            quest_type: string;
        };
    };
    currentUserId?: string;
    layout?: "grid" | "list";
}

export function ReviewCard({ review, currentUserId, layout = "grid" }: ReviewCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [activeScreenshotIndex, setActiveScreenshotIndex] = useState<number | null>(null);

    const formattedDate = format(new Date(review.created_at), "MMM dd, yyyy");
    const screenshots = review.screenshots || [];
    const difficultyInfo = review.difficulty ? DIFFICULTY_MAP[review.difficulty] : null;

    const handleDelete = async () => {
        setIsDeleting(true);
        const res = await deleteReview(review.id);
        if (!res.success) {
            console.error(res.error || "Failed to delete review");
            setIsDeleting(false);
        } else {
            router.refresh();
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(
            `${review.game.title} - ${review.rating}/10\n\n"${review.review_text || ""}"`
        );
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Replace low res cover with high res if available
    const coverUrl = review.game.cover_url?.replace("t_cover_big", "t_1080p") || null;

    return (
        <>
            <div
                className={`glass-card group relative flex overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_35px_rgba(189,13,242,0.25)] ${
                    layout === "list" ? "h-auto flex-col md:h-auto md:flex-row" : "min-h-[480px] flex-col"
                } ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
            >
                {/* Game Cover Container */}
                <div
                    className={`relative flex items-center justify-center overflow-hidden bg-zinc-950 px-4 py-8 ${
                        layout === "list"
                            ? "aspect-video w-full shrink-0 md:aspect-3/4 md:w-72"
                            : "min-h-72 w-full"
                    }`}
                >
                    {coverUrl ? (
                        <>
                            <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
                                <Image
                                    src={coverUrl}
                                    alt={`${review.game.title} background`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="scale-125 object-cover blur-3xl transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                            <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                            <div className="relative z-10 aspect-3/4 h-full max-h-80 w-auto overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_35px_rgba(0,0,0,0.85)] transition-all duration-500 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(189,13,242,0.4)]">
                                <Image
                                    src={coverUrl}
                                    alt={`Cover of ${review.game.title}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="z-10 flex h-full w-full items-center justify-center bg-zinc-950">
                            <span className="text-xs font-black tracking-widest text-primary/50 uppercase">
                                No Image
                            </span>
                        </div>
                    )}
                    
                    <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                    {/* Rating Badge */}
                    {(() => {
                        const ratingStyle = getRatingStyle(review.rating);
                        return (
                            <div
                                className={`absolute top-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110 ${ratingStyle.container}`}
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <span className={ratingStyle.text}>{review.rating}</span>
                                    {ratingStyle.showStar && (
                                        <Star className="h-3 w-3 fill-zinc-950 text-zinc-950 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Content Panel */}
                <div className="z-10 flex flex-1 flex-col p-6 space-y-4">
                    
                    {/* Quest Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-black tracking-widest text-primary uppercase shadow-[0_0_10px_rgba(189,13,242,0.15)]">
                            {review.game.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest"}
                        </span>

                        {review.game.platform && (
                            <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-extrabold text-zinc-300 uppercase">
                                {review.game.platform}
                            </span>
                        )}

                        {difficultyInfo && (
                            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-extrabold uppercase flex items-center gap-1 ${difficultyInfo.color}`}>
                                <span>{difficultyInfo.icon}</span>
                                <span>{difficultyInfo.label}</span>
                            </span>
                        )}

                        {review.hours_played && (
                            <span className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-extrabold text-cyan-400 uppercase flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {review.hours_played}h
                            </span>
                        )}
                    </div>

                    {/* Game Title */}
                    <h3 className="text-2xl leading-tight font-black tracking-tight text-white transition-colors duration-300 group-hover:text-primary">
                        {review.game.title}
                    </h3>

                    {/* Author & Date Bar */}
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>
                            Por{" "}
                            <strong className="text-zinc-200 hover:text-primary transition-colors">
                                <UserLink
                                    userId={review.user_id}
                                    name={review.user.name}
                                    username={review.user.username}
                                />
                            </strong>
                        </span>
                        <span className="text-zinc-700">•</span>
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{formattedDate}</span>
                    </div>

                    {/* Review Text */}
                    <p
                        className={`flex-1 text-sm leading-relaxed text-zinc-300 font-medium transition-all duration-300 ${
                            isExpanded ? "" : "line-clamp-4"
                        } ${layout === "list" && !isExpanded ? "line-clamp-3" : ""}`}
                    >
                        {review.review_text || "O usuário não providenciou um texto para esta review."}
                    </p>

                    {/* Screenshot Thumbnails Gallery */}
                    {screenshots.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-zinc-800/60">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-emerald-400" /> Galeria ({screenshots.length} {screenshots.length === 1 ? "print" : "prints"})
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                                {screenshots.map((url, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setActiveScreenshotIndex(index)}
                                        className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500/80 bg-zinc-900 group/img transition-all hover:scale-105 shadow-md"
                                    >
                                        <img
                                            src={url}
                                            alt={`Screenshot ${index + 1} de ${review.game.title}`}
                                            className="w-full h-full object-cover transition-all group-hover/img:brightness-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[9px] font-black text-white uppercase bg-black/70 px-1.5 py-0.5 rounded">Ver</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="mt-auto flex items-center justify-between border-t border-zinc-800/80 pt-4">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="group/btn flex items-center gap-1.5 text-xs font-black tracking-widest text-primary uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.4)] transition-colors hover:text-white"
                        >
                            {isExpanded ? "Mostrar Menos" : "Review Completa"}{" "}
                            <ArrowRight
                                className={`h-3.5 w-3.5 transition-transform duration-300 ${
                                    isExpanded ? "-rotate-90 group-hover/btn:-translate-y-1" : "group-hover/btn:translate-x-1.5"
                                }`}
                            />
                        </button>

                        <div className="flex items-center gap-3 text-zinc-500">
                            {currentUserId === review.user_id && (
                                <>
                                    <EditReviewModal review={review} />
                                    <button
                                        onClick={handleDelete}
                                        className="transition-colors hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                        title="Excluir Review"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleShare}
                                className="transition-colors hover:text-primary hover:drop-shadow-[0_0_8px_rgba(189,13,242,0.5)]"
                                title="Compartilhar"
                            >
                                {isCopied ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox / Zoom Modal */}
            {activeScreenshotIndex !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-200"
                    onClick={() => setActiveScreenshotIndex(null)}
                >
                    <div
                        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex items-center justify-between text-white">
                            <span className="text-sm font-black tracking-wide flex items-center gap-2">
                                <Camera className="h-4 w-4 text-emerald-400" />
                                {review.game.title} — Screenshot ({activeScreenshotIndex + 1}/{screenshots.length})
                            </span>
                            <button
                                onClick={() => setActiveScreenshotIndex(null)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                title="Fechar (Esc)"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
                            <img
                                src={screenshots[activeScreenshotIndex]}
                                alt={`Screenshot ${activeScreenshotIndex + 1}`}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {screenshots.length > 1 && (
                            <>
                                <button
                                    onClick={() =>
                                        setActiveScreenshotIndex((prev) =>
                                            prev !== null ? (prev === 0 ? screenshots.length - 1 : prev - 1) : 0
                                        )
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10"
                                    title="Anterior"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={() =>
                                        setActiveScreenshotIndex((prev) =>
                                            prev !== null ? (prev === screenshots.length - 1 ? 0 : prev + 1) : 0
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors border border-white/10"
                                    title="Próxima"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
