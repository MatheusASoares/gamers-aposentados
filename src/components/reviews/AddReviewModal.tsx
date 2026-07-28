"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ImagePlus, X, Sparkles } from "lucide-react";
import { createReview } from "@/app/lib/review-actions";
import { compressImage } from "@/lib/image-compressor";
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

const MAX_SCREENSHOTS = 4;

export function AddReviewModal({ games, trigger }: AddReviewModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [gameId, setGameId] = useState("");
    const [rating, setRating] = useState("10");
    const [difficulty, setDifficulty] = useState("3");
    const [hoursPlayed, setHoursPlayed] = useState("");
    const [reviewText, setReviewText] = useState("");

    // Screenshots state (local Files before upload or URLs)
    const [screenshots, setScreenshots] = useState<{ file: File; previewUrl: string; uploadedUrl?: string }[]>([]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (screenshots.length + files.length > MAX_SCREENSHOTS) {
            setError(`Você pode anexar no máximo ${MAX_SCREENSHOTS} screenshots por review.`);
            return;
        }

        setError(null);
        setUploadingImages(true);

        try {
            const newScreenshots = await Promise.all(
                files.map(async (rawFile) => {
                    // Compress Image client-side to WebP (1920x1080, 80% quality)
                    const compressed = await compressImage(rawFile);
                    const previewUrl = URL.createObjectURL(compressed);
                    return { file: compressed, previewUrl };
                })
            );

            setScreenshots((prev) => [...prev, ...newScreenshots].slice(0, MAX_SCREENSHOTS));
        } catch (err) {
            console.error("[AddReviewModal] Erro ao processar imagem:", err);
            setError("Erro ao processar imagem. Tente outro arquivo.");
        } finally {
            setUploadingImages(false);
        }
    };

    const handleRemoveScreenshot = (index: number) => {
        setScreenshots((prev) => {
            const item = prev[index];
            if (item?.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadAllScreenshots = async (): Promise<string[]> => {
        const urls: string[] = [];

        for (const item of screenshots) {
            if (item.uploadedUrl) {
                urls.push(item.uploadedUrl);
                continue;
            }

            const formData = new FormData();
            formData.append("file", item.file);
            formData.append("folder", "screenshots");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Falha ao enviar screenshot para a nuvem");
            }

            const data = await res.json();
            urls.push(data.url);
        }

        return urls;
    };

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
            // 1. Upload screenshots first
            const uploadedUrls = await uploadAllScreenshots();

            // 2. Create review with screenshots
            const res = await createReview({
                gameId,
                rating: parseInt(rating),
                difficulty: parseInt(difficulty),
                hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
                reviewText,
                screenshots: uploadedUrls,
            });

            if (res.success) {
                setOpen(false);
                // reset form
                setGameId("");
                setRating("10");
                setDifficulty("3");
                setHoursPlayed("");
                setReviewText("");
                setScreenshots([]);
                router.refresh();
            } else {
                setError(res.error || "Ocorreu um erro ao salvar a review.");
            }
        } catch (err: unknown) {
            console.error("[AddReviewModal] Erro ao submeter:", err);
            const msg = err instanceof Error ? err.message : "Erro de conexão ou falha no servidor.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Calculation of potential XP bonus
    const screenshotBonusCount = Math.min(screenshots.length, 3);
    const screenshotXP = screenshotBonusCount * 50;

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
            <DialogContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-primary text-2xl font-black tracking-wider uppercase flex items-center justify-between">
                        Nova Review
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Compartilhe sua sabedoria sobre o jogo e mostre suas melhores prints!
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {error && (
                        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-300 uppercase">Jogo</label>
                        {games.length === 0 ? (
                            <div className="w-full rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">
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
                            rows={3}
                            placeholder="Descreva sua experiência com o jogo..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="focus:border-primary w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-white transition-colors focus:outline-none"
                        ></textarea>
                    </div>

                    {/* Screenshot Upload Section */}
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                                Screenshots ({screenshots.length}/{MAX_SCREENSHOTS})
                            </label>
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <Sparkles className="h-3 w-3" />
                                {screenshots.length > 0 ? "+50 XP Bônus Ativo!" : "+50 XP Bônus ao anexar prints"}
                            </span>
                        </div>

                        {/* Dropzone & Preview list */}
                        <div className="grid grid-cols-4 gap-2">
                            {screenshots.map((item, idx) => (
                                <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                                    <img
                                        src={item.previewUrl}
                                        alt={`Screenshot ${idx + 1}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveScreenshot(idx)}
                                        className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-full opacity-90 hover:bg-red-600 transition-colors"
                                        title="Remover imagem"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}

                            {screenshots.length < MAX_SCREENSHOTS && (
                                <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-zinc-800 hover:border-primary/60 bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        disabled={uploadingImages || loading}
                                        className="hidden"
                                    />
                                    {uploadingImages ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    ) : (
                                        <>
                                            <ImagePlus className="h-5 w-5 text-zinc-400 group-hover:text-primary mb-1" />
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Adicionar</span>
                                        </>
                                    )}
                                </label>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploadingImages || games.length === 0}
                        className="bg-primary hover:bg-primary/90 mt-4 flex w-full items-center justify-center gap-2 rounded-lg p-3 font-bold tracking-wide text-white uppercase shadow-[0_0_15px_rgba(189,13,242,0.3)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publicar Review"}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
