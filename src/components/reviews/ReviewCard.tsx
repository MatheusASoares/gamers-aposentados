import Image from "next/image";
import { ArrowRight, Calendar, Edit, Share2, User } from "lucide-react";
import { format } from "date-fns";

export interface ReviewCardProps {
    review: {
        id: string;
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
}

export function ReviewCard({ review }: ReviewCardProps) {
    const formattedDate = format(new Date(review.created_at), "MMM dd, yyyy");
    const reviewerName = review.user.name || review.user.username || "Unknown Gamer";

    return (
        <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col">
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
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-wider">
                        {review.game.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest"}
                    </span>
                    {review.game.platform && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                            {review.game.platform}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">
                    {review.game.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                    <User className="w-3.5 h-3.5" />
                    <span>Review by <strong className="text-zinc-300">{reviewerName}</strong></span>
                    <span className="mx-1">•</span>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                    {review.review_text || "No written review provided."}
                </p>

                <div className="mt-auto pt-6 border-t border-zinc-800 flex items-center justify-between">
                    <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group/btn">
                        VIEW FULL REVIEW <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3 text-zinc-500">
                        <button className="hover:text-primary transition-colors"><Share2 className="w-4 h-4" /></button>
                        <button className="hover:text-primary transition-colors"><Edit className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
