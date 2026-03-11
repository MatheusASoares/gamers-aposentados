import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, Share2, User, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { deleteReview } from "@/app/lib/review-actions";
import { EditReviewModal } from "./EditReviewModal";
import { UserLink } from "@/components/ui/user-link";

export interface ReviewCardProps {
    review: {
        id: string;
        user_id: string; // added to match standard prisma returns
        rating: number;
        review_text: string | null;
        created_at: Date;
        user: {
            name: string | null;
            username: string | null;
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const formattedDate = format(new Date(review.created_at), "MMM dd, yyyy");

    const handleDelete = async () => {
        setIsDeleting(true);
        const res = await deleteReview(review.id);
        if (!res.success) {
            console.error(res.error || "Failed to delete review");
            setIsDeleting(false);
        } else {
            window.location.reload();
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(
            `${review.game.title} - ${review.rating}/10\n\n"${review.review_text || ""}"`,
        );
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Replace the low res cover with high res if available
    const coverUrl = review.game.cover_url?.replace("t_cover_big", "t_1080p") || null;

    return (
        <div
            className={`group relative flex overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 shadow-xl backdrop-blur-sm transition-all duration-500 hover:border-[#bd0df2]/30 hover:bg-zinc-900/80 hover:shadow-[0_0_30px_rgba(189,13,242,0.15)] ${layout === "list" ? "h-auto flex-col md:h-[300px] md:flex-row" : "min-h-[450px] flex-col"} ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
        >
            <div
                className={`relative flex items-center justify-center overflow-hidden bg-zinc-950 px-4 py-8 ${layout === "list" ? "aspect-video w-full shrink-0 md:aspect-[3/4] md:w-[280px]" : "min-h-[300px] w-full"}`}
            >
                {coverUrl ? (
                    <>
                        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
                            <Image
                                src={coverUrl}
                                alt={`${review.game.title} background`}
                                fill
                                className="scale-125 object-cover blur-3xl transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                        <div className="relative z-10 aspect-[3/4] h-full max-h-[320px] w-auto overflow-hidden rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-all duration-500 group-hover:scale-105 group-hover:border-[#bd0df2]/40 group-hover:shadow-[0_0_30px_rgba(189,13,242,0.3)]">
                            <Image
                                src={coverUrl}
                                alt={`Cover of ${review.game.title}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </>
                ) : (
                    <div className="z-10 flex h-full w-full items-center justify-center bg-zinc-950">
                        <span className="text-xs font-bold tracking-widest text-[#bd0df2]/50 uppercase">
                            No Image
                        </span>
                    </div>
                )}
                {/* Dark overlay behind rating for readability */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                <div className="absolute top-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-xl border border-[#bd0df2]/30 bg-zinc-950/80 shadow-[0_0_20px_rgba(189,13,242,0.4)] backdrop-blur-xl transition-all duration-500 group-hover:scale-110 group-hover:border-[#bd0df2]/60">
                    <span className="text-xl font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                        {review.rating}
                    </span>
                </div>
            </div>

            <div className="z-10 flex flex-1 flex-col p-6">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-md border border-[#bd0df2]/20 bg-[#bd0df2]/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-[#bd0df2] uppercase shadow-[0_0_10px_rgba(189,13,242,0.1)]">
                        {review.game.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest"}
                    </span>
                    {review.game.platform && (
                        <span className="rounded-md border border-white/10 bg-zinc-800/50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-zinc-300 uppercase">
                            {review.game.platform}
                        </span>
                    )}
                </div>

                <h3 className="mb-2 text-2xl leading-tight font-black tracking-tight text-zinc-100 transition-colors duration-300 group-hover:text-white">
                    {review.game.title}
                </h3>

                <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider text-zinc-500 uppercase">
                    <User className="h-3 w-3 text-[#bd0df2]" />
                    <span>
                        Por{" "}
                        <strong className="text-zinc-300 transition-colors hover:text-[#bd0df2]">
                            <UserLink
                                userId={review.user_id}
                                name={review.user.name}
                                username={review.user.username}
                            />
                        </strong>
                    </span>
                    <span className="mx-1 text-zinc-700">•</span>
                    <Calendar className="h-3 w-3 text-[#bd0df2]" />
                    <span>{formattedDate}</span>
                </div>

                <p
                    className={`mb-6 flex-1 text-sm leading-relaxed text-zinc-300 transition-all duration-300 ${isExpanded ? "" : "line-clamp-4"} ${layout === "list" && !isExpanded ? "line-clamp-3" : ""}`}
                >
                    {review.review_text || "O usuário não providenciou um texto para esta review."}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-5">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group/btn flex items-center gap-2 text-[10px] font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_5px_rgba(189,13,242,0.3)] transition-colors hover:text-white"
                    >
                        {isExpanded ? "Mostrar Menos" : "Review Completa"}{" "}
                        <ArrowRight
                            className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? "-rotate-90 group-hover/btn:-translate-y-1" : "group-hover/btn:translate-x-1.5"}`}
                        />
                    </button>
                    <div className="flex items-center gap-4 text-zinc-500">
                        {currentUserId === review.user_id && (
                            <>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <EditReviewModal review={review as any} />
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
                            className="transition-colors hover:text-[#bd0df2] hover:drop-shadow-[0_0_8px_rgba(189,13,242,0.5)]"
                            title="Compartilhar"
                        >
                            {isCopied ? (
                                <Check className="h-4 w-4 text-green-400" />
                            ) : (
                                <Share2 className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
