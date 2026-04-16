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
    games: { id: string; title: string; cover_url: string | null }[];
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

        try {
            const res = await createReview({
                gameId,
                rating: parseInt(rating),
                difficulty: parseInt(difficulty),
                hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
                reviewText,
            });

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
        } catch (err: any) {
            console.error("[AddReviewModal] Erro ao submeter:", err);
            setError("Erro de conexão ou falha no servidor. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="bg-primary hover:bg-primary/90 group flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold tracking-wide text-white shadow-[0_0_15px_rgba(189,13,242,0.3)] transition-all active:scale-95">
                        <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                        WRITE A REVIEW
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-primary text-2xl font-black tracking-wider uppercase">
                        Nova Review
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Compartilhe sua sabedoria sobre o jogo.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">Jogo</label>
                        {games.length === 0 ? (
                            <div className="w-full rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-500 text-sm text-center font-medium">
                                Nenhuma quest completa disponível para review.
                            </div>
                        ) : (
                            <select
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value)}
                                className="focus:border-primary w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-white transition-colors focus:outline-none"
                                required
                            >
                                <option value="" disabled>
                                    Selecione um jogo já jogado...
                                </option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {game.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300 uppercase">
                                Nota (0-10)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                step="1"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                className="focus:border-primary w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center text-xl font-bold text-white transition-colors focus:outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-300 uppercase">
                                Dificuldade (1-5)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                step="1"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="focus:border-primary w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center text-xl font-bold text-white transition-colors focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">
                            Horas Jogadas
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="ex: 45"
                            value={hoursPlayed}
                            onChange={(e) => setHoursPlayed(e.target.value)}
                            className="focus:border-primary w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-white transition-colors focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">
                            Sua Análise (Opcional)
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Descreva sua experiência com o jogo..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="focus:border-primary w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-white transition-colors focus:outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || games.length === 0}
                        className="bg-primary hover:bg-primary/90 mt-4 flex w-full items-center justify-center gap-2 rounded-lg p-3 font-bold tracking-wide text-white uppercase shadow-[0_0_15px_rgba(189,13,242,0.3)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar Review"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
