import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, Edit, Share2, User, Trash2, Check } from "lucide-react";
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
}

export function ReviewCard({ review, currentUserId }: ReviewCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const formattedDate = format(new Date(review.created_at), "MMM dd, yyyy");
    const reviewerName = review.user.name || review.user.username || "Unknown Gamer";

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

    return (
        <div
            className={`group hover:border-primary/50 relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-300 ${isDeleting ? "pointer-events-none opacity-50" : ""}`}
        >
            <div className="relative aspect-video overflow-hidden bg-zinc-800">
                {review.game.cover_url ? (
                    <Image
                        src={review.game.cover_url}
                        alt={`Cover of ${review.game.title}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-600 transition-transform duration-500 group-hover:scale-110">
                        No Image
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                <div className="border-primary absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-zinc-900/80 shadow-[0_0_15px_rgba(189,13,242,0.3)] backdrop-blur-md">
                    <span className="text-lg font-black text-white">{review.rating}</span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex items-center gap-3">
                    <span className="bg-primary/20 text-primary rounded px-3 py-1 text-xs font-black tracking-widest uppercase">
                        {review.game.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest"}
                    </span>
                    {review.game.platform && (
                        <span className="rounded bg-zinc-800 px-3 py-1 text-xs font-black tracking-widest text-zinc-400 uppercase">
                            {review.game.platform}
                        </span>
                    )}
                </div>

                <h3 className="group-hover:text-primary mb-2 text-2xl leading-tight font-black text-white transition-colors">
                    {review.game.title}
                </h3>

                <div className="mb-5 flex items-center gap-2 text-sm font-medium text-zinc-400">
                    <User className="h-4 w-4 text-zinc-500" />
                    <span>
                        Review by{" "}
                        <strong className="text-zinc-200">
                            <UserLink
                                userId={review.user_id}
                                name={review.user.name}
                                username={review.user.username}
                            />
                        </strong>
                    </span>
                    <span className="mx-1.5 text-zinc-600">•</span>
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    <span>{formattedDate}</span>
                </div>

                <p
                    className={`mb-6 flex-1 text-base leading-relaxed text-zinc-300 transition-all ${isExpanded ? "" : "line-clamp-4"}`}
                >
                    {review.review_text || "No written review provided."}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-5">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-primary group/btn flex items-center gap-1.5 text-sm font-black tracking-widest uppercase transition-colors hover:text-white hover:underline"
                    >
                        {isExpanded ? "SHOW LESS" : "VIEW FULL REVIEW"}{" "}
                        <ArrowRight
                            className={`h-4 w-4 transition-transform ${isExpanded ? "-rotate-90 group-hover/btn:-translate-y-1" : "group-hover/btn:translate-x-1.5"}`}
                        />
                    </button>
                    <div className="flex items-center gap-4 text-zinc-400">
                        {currentUserId === review.user_id && (
                            <>
                                <EditReviewModal review={review as any} />
                                <button
                                    onClick={handleDelete}
                                    className="transition-colors hover:text-red-500"
                                    title="Delete Review"
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
                            className="hover:text-primary transition-colors"
                            title="Share Review"
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
