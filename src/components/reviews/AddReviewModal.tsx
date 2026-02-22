"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createReview } from "@/app/lib/review-actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export interface AddReviewModalProps {
    games: { id: string; title: string; cover_url: string | null; }[];
    trigger?: React.ReactNode;
}

export function AddReviewModal({ games, trigger }: AddReviewModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [gameId, setGameId] = useState("");
    const [rating, setRating] = useState("10");
    const [difficulty, setDifficulty] = useState("3");
    const [hoursPlayed, setHoursPlayed] = useState("");
    const [reviewText, setReviewText] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!gameId) {
            setError("Selecione um jogo.");
            setLoading(false);
            return;
        }

        const res = await createReview({
            gameId,
            rating: parseInt(rating),
            difficulty: parseInt(difficulty),
            hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
            reviewText,
        });

        setLoading(false);

        if (res.success) {
            setOpen(false);
            // reset form
            setGameId("");
            setRating("10");
            setDifficulty("3");
            setHoursPlayed("");
            setReviewText("");
        } else {
            setError(res.error || "Ocorreu um erro ao salvar a review.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(189,13,242,0.3)] active:scale-95 group">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        WRITE A REVIEW
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-primary uppercase tracking-wider">Nova Review</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Compartilhe sua sabedoria sobre o jogo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">Jogo</label>
                        <select
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                            required
                        >
                            <option value="" disabled>Selecione um jogo já jogado...</option>
                            {games.map(game => (
                                <option key={game.id} value={game.id}>{game.title}</option>
                            ))}
                        </select>
                    </div>

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
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white p-3 rounded-lg font-bold tracking-wide transition-all uppercase shadow-[0_0_15px_rgba(189,13,242,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publicar Review"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
