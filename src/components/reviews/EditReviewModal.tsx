"use client";

import { useState } from "react";
import { Loader2, Edit, ImagePlus, X, Sparkles, Star, Flame, Clock, Gamepad2, Award, CheckCircle2, ShieldAlert } from "lucide-react";
import { updateReview } from "@/app/lib/review-actions";
import { compressImage } from "@/lib/image-compressor";
import { useRouter } from "next/navigation";
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
        difficulty?: number | null;
        hours_played?: number | null;
        review_text: string | null;
        screenshots?: string[];
        game: {
            title: string;
            cover_url?: string | null;
        };
    };
    trigger?: React.ReactNode;
}

const MAX_SCREENSHOTS = 4;

const DIFFICULTY_LEVELS = [
    { value: 1, label: "Muito Fácil", color: "border-emerald-500/40 text-emerald-400 bg-emerald-950/30", icon: "🟢" },
    { value: 2, label: "Tranquilo", color: "border-cyan-500/40 text-cyan-400 bg-cyan-950/30", icon: "🔵" },
    { value: 3, label: "Desafiador", color: "border-amber-500/40 text-amber-400 bg-amber-950/30", icon: "🟡" },
    { value: 4, label: "Difícil", color: "border-orange-500/40 text-orange-400 bg-orange-950/30", icon: "🟠" },
    { value: 5, label: "Extremo", color: "border-rose-500/40 text-rose-400 bg-rose-950/30", icon: "🔴" },
];

const getRatingColor = (val: number) => {
    if (val === 10) return { bg: "bg-amber-400 text-zinc-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]", label: "Masterpiece ★" };
    if (val >= 8) return { bg: "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]", label: "Excelente" };
    if (val >= 6) return { bg: "bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]", label: "Bom" };
    if (val >= 4) return { bg: "bg-amber-500/80 text-zinc-950 border-amber-400", label: "Mediano" };
    return { bg: "bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]", label: "Ruim" };
};

export function EditReviewModal({ review, trigger }: EditReviewModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state initialized with existing review data
    const [rating, setRating] = useState(review.rating);
    const [difficulty, setDifficulty] = useState(review.difficulty || 3);
    const [hoursPlayed, setHoursPlayed] = useState(review.hours_played?.toString() || "");
    const [reviewText, setReviewText] = useState(review.review_text || "");

    // Screenshots state
    const [screenshots, setScreenshots] = useState<{ file?: File; previewUrl: string; uploadedUrl?: string }[]>(
        (review.screenshots || []).map((url) => ({ previewUrl: url, uploadedUrl: url }))
    );

    // Live XP calculation
    const isDetailed = reviewText.trim().length >= 50;
    const hasScreenshots = screenshots.length > 0;
    const calculatedXP = (isDetailed ? 200 : 100) + (hasScreenshots ? 50 : 0);

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
                    const compressed = await compressImage(rawFile);
                    const previewUrl = URL.createObjectURL(compressed);
                    return { file: compressed, previewUrl };
                })
            );

            setScreenshots((prev) => [...prev, ...newScreenshots].slice(0, MAX_SCREENSHOTS));
        } catch (err) {
            console.error("[EditReviewModal] Erro ao processar imagem:", err);
            setError("Erro ao processar imagem. Tente outro arquivo.");
        } finally {
            setUploadingImages(false);
        }
    };

    const handleRemoveScreenshot = (index: number) => {
        setScreenshots((prev) => {
            const item = prev[index];
            if (item?.file && item.previewUrl) {
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

            if (!item.file) continue;

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

        try {
            const uploadedUrls = await uploadAllScreenshots();

            const res = await updateReview({
                reviewId: review.id,
                rating,
                difficulty,
                hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
                reviewText,
                screenshots: uploadedUrls,
            });

            setLoading(false);

            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Ocorreu um erro ao atualizar a review.");
            }
        } catch (err: unknown) {
            console.error("[EditReviewModal] Erro ao submeter:", err);
            const msg = err instanceof Error ? err.message : "Erro ao salvar alterações.";
            setError(msg);
            setLoading(false);
        }
    };

    const coverUrl = review.game.cover_url?.replace("t_cover_big", "t_1080p") || null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="transition-colors hover:text-amber-400" title="Editar Review">
                        <Edit className="h-4 w-4" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-zinc-950/95 text-white sm:max-w-4xl md:max-w-5xl p-0 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl border flex flex-col md:flex-row max-h-[92vh]">
                <DialogTitle className="sr-only font-bold">Editar Review</DialogTitle>
                <DialogDescription className="sr-only">Formulário para editar review de jogo</DialogDescription>
                
                {/* LEFT PANEL: Game Spotlight */}
                <div className="w-full md:w-80 shrink-0 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col justify-between relative overflow-hidden">
                    
                    {coverUrl && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl pointer-events-none scale-125"
                            style={{ backgroundImage: `url(${coverUrl})` }}
                        />
                    )}

                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                                Edição de Review
                            </span>
                        </div>

                        {/* Game Display */}
                        <div className="space-y-3">
                            <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl border border-zinc-700/80 shadow-[0_0_25px_rgba(0,0,0,0.8)] group">
                                {coverUrl ? (
                                    <img
                                        src={coverUrl}
                                        alt={review.game.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600">
                                        <Gamepad2 className="h-12 w-12 opacity-40" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-70" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className="text-xs font-bold text-amber-400/90 block uppercase tracking-wider">
                                        Editando Análise
                                    </span>
                                    <h4 className="text-lg font-black text-white leading-tight drop-shadow-md">
                                        {review.game.title}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* XP Status Card */}
                        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-zinc-900/80 p-4 space-y-2 shadow-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                                    <Award className="h-4 w-4" /> XP da Análise
                                </span>
                                <span className="text-lg font-black text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                    +{calculatedXP} XP
                                </span>
                            </div>
                            <div className="space-y-1 text-[11px] text-zinc-400 font-medium">
                                <div className="flex justify-between">
                                    <span>Review Básica:</span>
                                    <span className="text-zinc-300 font-bold">+100 XP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Análise (≥50 caracteres):</span>
                                    <span className={isDetailed ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                                        {isDetailed ? "+100 XP ✓" : "+0 XP"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Com Screenshots:</span>
                                    <span className={hasScreenshots ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                                        {hasScreenshots ? "+50 XP ✓" : "+0 XP"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-4 text-[11px] text-zinc-500 text-center border-t border-zinc-800/60">
                        Gamers Aposentados • XP System
                    </div>
                </div>

                {/* RIGHT PANEL: Form Controls */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[92vh] space-y-6">
                    <DialogHeader className="p-0 space-y-1">
                        <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                            Editar Review <Sparkles className="h-5 w-5 text-amber-400" />
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm">
                            Atualize sua nota, impressões e imagens de {review.game.title}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm font-medium text-red-400 flex items-center gap-2 animate-in fade-in">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Rating Selector (0 to 10 Pills) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5">
                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Nota Final (0 - 10) *
                                </label>
                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${getRatingColor(rating).bg}`}>
                                    {rating}/10 — {getRatingColor(rating).label}
                                </span>
                            </div>

                            <div className="grid grid-cols-11 gap-1.5 p-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70">
                                {Array.from({ length: 11 }).map((_, i) => {
                                    const isSelected = rating === i;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setRating(i)}
                                            className={`h-11 rounded-lg font-black text-sm transition-all duration-200 ${
                                                isSelected
                                                    ? getRatingColor(i).bg + " scale-110 z-10"
                                                    : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                            }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Difficulty & Hours Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Difficulty Card Picker */}
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5">
                                    <Flame className="h-4 w-4 text-orange-500" /> Dificuldade
                                </label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {DIFFICULTY_LEVELS.map((lvl) => {
                                        const isSelected = difficulty === lvl.value;
                                        return (
                                            <button
                                                key={lvl.value}
                                                type="button"
                                                onClick={() => setDifficulty(lvl.value)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center ${
                                                    isSelected
                                                        ? `${lvl.color} border-2 font-black shadow-md scale-105`
                                                        : "border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                                }`}
                                            >
                                                <span className="text-base">{lvl.icon}</span>
                                                <span className="text-[10px] font-bold mt-1 tracking-tight">{lvl.value}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="text-[11px] font-semibold text-zinc-400 text-center pt-0.5">
                                    Nível: <strong className="text-white">{DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.label}</strong>
                                </div>
                            </div>

                            {/* Hours Played Input */}
                            <div className="space-y-2">
                                <label htmlFor="edit-review-hours-played" className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-cyan-400" /> Horas Jogadas
                                </label>
                                <div className="relative">
                                    <input
                                        id="edit-review-hours-played"
                                        type="number"
                                        aria-label="Horas jogadas"
                                        min="0"
                                        placeholder="ex: 45"
                                        value={hoursPlayed}
                                        onChange={(e) => setHoursPlayed(e.target.value)}
                                        className="focus:border-amber-500 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-white font-bold transition-colors focus:outline-none pr-12"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 uppercase">
                                        horas
                                    </span>
                                </div>
                                {/* Preset Buttons */}
                                <div className="flex gap-1.5 pt-1">
                                    {[10, 25, 50, 100].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setHoursPlayed(preset.toString())}
                                            className="px-2 py-1 text-[10px] font-bold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                                        >
                                            +{preset}h
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Review Textarea */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black tracking-widest text-zinc-300 uppercase">
                                    Sua Análise Escrita
                                </label>
                                <span className={`text-[11px] font-bold ${isDetailed ? "text-emerald-400" : "text-zinc-500"}`}>
                                    {reviewText.trim().length} / 50 caracteres {isDetailed ? "(+100 XP Garanti)" : "(para +100 XP bônus)"}
                                </span>
                            </div>
                            <textarea
                                rows={4}
                                placeholder="Descreva sua experiência com o jogo..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                className="focus:border-amber-500 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 text-sm text-white transition-colors focus:outline-none leading-relaxed"
                            />
                        </div>

                        {/* Screenshots Upload Grid */}
                        <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-2">
                                    Capturas de Tela ({screenshots.length}/{MAX_SCREENSHOTS})
                                </label>
                                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                                    <Sparkles className="h-3 w-3" />
                                    {hasScreenshots ? "+50 XP Bônus Ativo!" : "+50 XP Bônus"}
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {screenshots.map((item, idx) => (
                                    <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-md">
                                        <img
                                            src={item.previewUrl}
                                            alt={`Screenshot ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveScreenshot(idx)}
                                            className="absolute top-1.5 right-1.5 p-1 bg-black/80 text-white rounded-full opacity-90 hover:bg-red-600 transition-colors shadow"
                                            title="Remover imagem"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {screenshots.length < MAX_SCREENSHOTS && (
                                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-zinc-800 hover:border-amber-500 bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all group">
                                        <input
                                            type="file"
                                            aria-label="Upload de screenshots do jogo"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            disabled={uploadingImages || loading}
                                            className="hidden"
                                        />
                                        {uploadingImages ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                                        ) : (
                                            <>
                                                <ImagePlus className="h-6 w-6 text-zinc-500 group-hover:text-amber-500 transition-colors mb-1" />
                                                <span className="text-[10px] font-black text-zinc-500 group-hover:text-white uppercase tracking-wider">
                                                    Adicionar
                                                </span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-6 py-3.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white font-bold text-sm transition-colors uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || uploadingImages}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 flex items-center justify-center gap-2 rounded-xl py-3.5 font-black text-sm tracking-wider text-zinc-950 uppercase shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Salvar Alterações (+{calculatedXP} XP)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
