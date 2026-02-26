import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Calendar, Edit, Share2, User, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { deleteReview } from "@/app/lib/review-actions";
import { EditReviewModal } from "./EditReviewModal";

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
        navigator.clipboard.writeText(`${review.game.title} - ${review.rating}/10\n\n"${review.review_text || ''}"`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={`group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="relative aspect-video overflow-hidden bg-zinc-800">
                {review.game.cover_url ? (
                    <Image
                        src={review.game.cover_url}
                        alt={`Cover of ${review.game.title}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800 group-hover:scale-110 transition-transform duration-500">
                        No Image
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-zinc-900/80 backdrop-blur-md border-2 border-primary flex items-center justify-center shadow-[0_0_15px_rgba(189,13,242,0.3)]">
                    <span className="text-lg font-black text-white">{review.rating}</span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded text-xs font-black bg-primary/20 text-primary uppercase tracking-widest">
                        {review.game.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest"}
                    </span>
                    {review.game.platform && (
                        <span className="px-3 py-1 rounded text-xs font-black bg-zinc-800 text-zinc-400 uppercase tracking-widest">
                            {review.game.platform}
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                    {review.game.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium mb-5">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span>Review by <strong className="text-zinc-200">{reviewerName}</strong></span>
                    <span className="mx-1.5 text-zinc-600">•</span>
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span>{formattedDate}</span>
                </div>

                <p className={`text-zinc-300 text-base leading-relaxed mb-6 flex-1 transition-all ${isExpanded ? "" : "line-clamp-4"}`}>
                    {review.review_text || "No written review provided."}
                </p>

                <div className="mt-auto pt-5 border-t border-zinc-800 flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-black text-primary hover:text-white hover:underline flex items-center gap-1.5 group/btn uppercase tracking-widest transition-colors"
                    >
                        {isExpanded ? "SHOW LESS" : "VIEW FULL REVIEW"} <ArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? "-rotate-90 group-hover/btn:-translate-y-1" : "group-hover/btn:translate-x-1.5"}`} />
                    </button>
                    <div className="flex items-center gap-4 text-zinc-400">
                        {currentUserId === review.user_id && (
                            <>
                                <EditReviewModal review={review as any} />
                                <button
                                    onClick={handleDelete}
                                    className="hover:text-red-500 transition-colors"
                                    title="Delete Review"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </>
                        )}
                        <button onClick={handleShare} className="hover:text-primary transition-colors" title="Share Review">
                            {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
