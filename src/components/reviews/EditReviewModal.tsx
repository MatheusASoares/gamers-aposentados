"use client";

import { useState } from "react";
import { Loader2, Edit } from "lucide-react";
import { updateReview } from "@/app/lib/review-actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export interface EditReviewModalProps {
    review: {
        id: string;
        rating: number;
        difficulty: number | null;
        hours_played: number | null;
        review_text: string | null;
        game: {
            title: string;
        };
    };
    trigger?: React.ReactNode;
}

export function EditReviewModal({ review, trigger }: EditReviewModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state initialized with existing review data
    const [rating, setRating] = useState(review.rating.toString());
    const [difficulty, setDifficulty] = useState(review.difficulty?.toString() || "3");
    const [hoursPlayed, setHoursPlayed] = useState(review.hours_played?.toString() || "");
    const [reviewText, setReviewText] = useState(review.review_text || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const res = await updateReview({
            reviewId: review.id,
            rating: parseInt(rating),
            difficulty: parseInt(difficulty),
            hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
            reviewText,
        });

        setLoading(false);

        if (res.success) {
            setOpen(false);
        } else {
            setError(res.error || "Ocorreu um erro ao atualizar a review.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="hover:text-amber-500 transition-colors" title="Edit Review">
                        <Edit className="w-4 h-4" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-primary uppercase tracking-wider">Editar Review</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Atualizando análise de {review.game.title}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300 uppercase">Nota (0-10)</label>
                            <input
                                type="number"
                                min="0" max="10" step="1"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors font-bold text-xl text-center"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300 uppercase">Dificuldade (1-5)</label>
                            <input
                                type="number"
                                min="1" max="5" step="1"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors font-bold text-xl text-center"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">Horas Jogadas</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="ex: 45"
                            value={hoursPlayed}
                            onChange={(e) => setHoursPlayed(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">Sua Análise (Opcional)</label>
                        <textarea
                            rows={4}
                            placeholder="Descreva sua experiência com o jogo..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 p-3 rounded-lg font-black tracking-wide transition-all uppercase shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Alterações"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
