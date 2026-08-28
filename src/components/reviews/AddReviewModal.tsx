"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Loader2,
    ImagePlus,
    X,
    Sparkles,
    Star,
    Flame,
    Clock,
    Gamepad2,
    Award,
    CheckCircle2,
    ShieldAlert,
} from "lucide-react";
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
import { AppDropdown, type AppDropdownOption } from "@/components/ui/app-dropdown";

export interface AddReviewModalProps {
    games: { id: string; title: string; cover_url?: string | null; platform?: string | null; quest_type?: string }[];
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

export function AddReviewModal({ games, trigger }: AddReviewModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [gameId, setGameId] = useState("");
    const [rating, setRating] = useState(10);
    const [difficulty, setDifficulty] = useState(3);
    const [hoursPlayed, setHoursPlayed] = useState("");
    const [reviewText, setReviewText] = useState("");

    const gameOptions = useMemo<AppDropdownOption<string>[]>(() => {
        return games.map((g) => ({
            value: g.id,
            label: g.title,
        }));
    }, [games]);

    // Screenshots state
    const [screenshots, setScreenshots] = useState<{ file: File; previewUrl: string }[]>([]);
    const screenshotsRef = useRef(screenshots);

    useEffect(() => {
        screenshotsRef.current = screenshots;
    }, [screenshots]);

    const cleanupBlobScreenshots = (items: { previewUrl: string }[]) => {
        items.forEach((item) => {
            if (item.previewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(item.previewUrl);
            }
        });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupBlobScreenshots(screenshotsRef.current);
        };
    }, []);

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            cleanupBlobScreenshots(screenshots);
            setScreenshots([]);
            setError(null);
        }
        setOpen(newOpen);
    };

    const selectedGame = useMemo(() => {
        return games.find((g) => g.id === gameId);
    }, [games, gameId]);

    // Live XP calculation
    const isDetailed = reviewText.trim().length >= 50;
    const hasScreenshots = screenshots.length > 0;
    const calculatedXP = (isDetailed ? 200 : 100) + (hasScreenshots ? 50 : 0);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (screenshots.length + files.length > MAX_SCREENSHOTS) {
            setError(`Você pode anexar no máximo ${MAX_SCREENSHOTS} screenshots.`);
            return;
        }

        setError(null);
        setUploadingImages(true);

        try {
            const processedFiles: { file: File; previewUrl: string }[] = [];

            for (const file of files) {
                // Compress client-side
                const compressed = await compressImage(file, 1920, 0.85);
                const previewUrl = URL.createObjectURL(compressed);
                processedFiles.push({ file: compressed, previewUrl });
            }

            setScreenshots((prev) => [...prev, ...processedFiles]);
        } catch (err) {
            console.error("Image compression error:", err);
            setError("Erro ao processar imagens. Tente novamente.");
        } finally {
            setUploadingImages(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleRemoveScreenshot = (index: number) => {
        setScreenshots((prev) => {
            const target = prev[index];
            if (target?.previewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const uploadAllScreenshots = async (): Promise<string[]> => {
        const uploadPromises = screenshots.map(async (item) => {
            if (!item.file) return null;

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
            return data.url as string;
        });

        const results = await Promise.all(uploadPromises);
        return results.filter((url): url is string => Boolean(url));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameId) {
            setError("Selecione um jogo para fazer a análise.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const uploadedUrls = await uploadAllScreenshots();

            const res = await createReview({
                gameId,
                rating,
                difficulty,
                hoursPlayed: hoursPlayed ? parseInt(hoursPlayed) : undefined,
                reviewText: reviewText.trim() || undefined,
                screenshots: uploadedUrls,
            });

            if (res.success) {
                cleanupBlobScreenshots(screenshots);
                setScreenshots([]);
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Erro ao salvar a review. Tente novamente.");
            }
        } catch (err) {
            console.error("Submit review error:", err);
            setError("Falha na comunicação com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    const coverUrl = selectedGame?.cover_url;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="bg-primary hover:bg-primary/90 group flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black tracking-wider text-white shadow-[0_0_20px_rgba(189,13,242,0.4)] transition-all active:scale-95 min-h-[44px]">
                        <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                        WRITE A REVIEW
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="border-zinc-800/90 bg-zinc-950/98 text-white w-[96vw] sm:max-w-4xl md:max-w-5xl max-h-[85vh] sm:max-h-[88vh] p-0 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl border flex flex-col md:flex-row rounded-2xl md:rounded-3xl">
                <DialogTitle className="sr-only font-bold">Criar Análise de Jogo</DialogTitle>
                <DialogDescription className="sr-only">Formulário para adicionar review de jogo</DialogDescription>
                
                {/* LEFT PANEL: Game Spotlight & Live Preview (Desktop Viewport) */}
                <div className="hidden md:flex w-72 lg:w-80 shrink-0 bg-gradient-to-b from-zinc-900/95 to-zinc-950 p-5 lg:p-6 border-r border-zinc-800/80 flex-col justify-between relative overflow-y-auto custom-scrollbar">
                    
                    {/* Ambient Blurred Background Cover */}
                    {coverUrl && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl pointer-events-none scale-125"
                            style={{ backgroundImage: `url(${coverUrl})` }}
                        />
                    )}

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-black tracking-widest text-primary uppercase">
                                Guild Review Studio
                            </span>
                        </div>

                        {/* Game Cover Display */}
                        {selectedGame ? (
                            <div className="space-y-2">
                                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-zinc-700/80 shadow-[0_0_25px_rgba(0,0,0,0.8)] group">
                                    {coverUrl ? (
                                        <img
                                            src={coverUrl}
                                            alt={selectedGame.title}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600">
                                            <Gamepad2 className="h-12 w-12 opacity-40" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
                                            Quest Completa
                                        </span>
                                        <h4 className="text-base font-black text-white leading-tight drop-shadow-md truncate">
                                            {selectedGame.title}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/40 flex flex-col items-center justify-center p-4 text-center text-zinc-500">
                                <Gamepad2 className="h-8 w-8 mb-2 opacity-30 text-primary" />
                                <p className="text-xs font-bold uppercase tracking-wider">
                                    Selecione um jogo para ver o preview
                                </p>
                            </div>
                        )}

                        {/* Live XP Calculator Card */}
                        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-zinc-900/80 p-3.5 space-y-2 shadow-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                                    <Award className="h-4 w-4" /> Recompensa de XP
                                </span>
                                <span className="text-base font-black text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                    +{calculatedXP} XP
                                </span>
                            </div>
                            <div className="space-y-1 text-[11px] text-zinc-400 font-medium">
                                <div className="flex justify-between">
                                    <span>Review Básica:</span>
                                    <span className="text-zinc-300 font-bold">+100 XP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Análise (≥50 chars):</span>
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

                    <div className="relative z-10 pt-3 text-[10px] font-bold tracking-wider uppercase text-zinc-600 text-center border-t border-zinc-800/60">
                        Gamers Aposentados • XP System
                    </div>
                </div>

                {/* RIGHT PANEL: Form Controls (Flex-Col with Sticky Header, Scrollable Body & Sticky Footer) */}
                <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 overflow-hidden">
                    
                    {/* Fixed Top Header (Nunca corta no topo) */}
                    <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800/80 bg-zinc-950/95 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                                Criar Análise <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-primary animate-bounce" />
                            </h2>
                            <p className="text-zinc-400 text-xs sm:text-sm font-medium">
                                Compartilhe sua nota, nível de desafio e momentos épicos do jogo.
                            </p>
                        </div>

                        {/* XP Badge no Mobile */}
                        <div className="md:hidden shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-center">
                            <span className="text-[10px] font-black uppercase text-amber-400 block">Recompensa</span>
                            <span className="text-xs font-black text-amber-300">+{calculatedXP} XP</span>
                        </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
                            {error && (
                                <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3.5 text-xs sm:text-sm font-bold text-red-400 flex items-center gap-2 animate-in fade-in">
                                    <ShieldAlert className="h-5 w-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Game Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center justify-between">
                                    <span>Jogo Concluído *</span>
                                    {games.length > 0 && (
                                        <span className="text-xs text-zinc-500 font-bold">
                                            {games.length} jogos prontos
                                        </span>
                                    )}
                                </label>
                                {games.length === 0 ? (
                                    <div className="w-full rounded-xl border border-red-500/40 bg-red-950/20 p-3.5 text-center text-xs sm:text-sm font-bold text-red-400">
                                        Nenhum jogo concluído pendente de review.
                                    </div>
                                ) : (
                                    <AppDropdown
                                        value={gameId}
                                        onChange={setGameId}
                                        options={gameOptions}
                                        placeholder="Escolha um jogo da sua lista de quests..."
                                        accentColor="purple"
                                    />
                                )}
                            </div>

                            {/* Rating Selector (0 to 10 Pills - Touch friendly) */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5">
                                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Nota Final (0 - 10) *
                                    </label>
                                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getRatingColor(rating).bg}`}>
                                        {rating}/10 — {getRatingColor(rating).label}
                                    </span>
                                </div>

                                <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 p-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70">
                                    {Array.from({ length: 11 }).map((_, i) => {
                                        const isSelected = rating === i;
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setRating(i)}
                                                className={`h-10 sm:h-11 rounded-lg font-black text-xs sm:text-sm transition-all duration-200 min-h-[40px] ${
                                                    isSelected
                                                        ? getRatingColor(i).bg + " scale-105 z-10"
                                                        : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                                }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Difficulty & Hours Grid (Dual-Paradigm 2x1 no desktop, 1 col no mobile) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                
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
                                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center min-h-[44px] ${
                                                        isSelected
                                                            ? `${lvl.color} border-2 font-black shadow-md scale-105`
                                                            : "border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                                    }`}
                                                >
                                                    <span className="text-sm sm:text-base">{lvl.icon}</span>
                                                    <span className="text-xs font-bold mt-0.5 tracking-tight">{lvl.value}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs font-bold text-zinc-400 text-center pt-0.5">
                                        Nível: <strong className="text-white">{DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.label}</strong>
                                    </div>
                                </div>

                                {/* Hours Played Input */}
                                <div className="space-y-2">
                                    <label htmlFor="add-review-hours-played" className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-1.5">
                                        <Clock className="h-4 w-4 text-cyan-400" /> Horas Jogadas
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="add-review-hours-played"
                                            type="number"
                                            aria-label="Horas jogadas"
                                            min="0"
                                            placeholder="ex: 45"
                                            value={hoursPlayed}
                                            onChange={(e) => setHoursPlayed(e.target.value)}
                                            className="focus:border-primary w-full rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 text-sm sm:text-base text-white font-bold transition-colors focus:outline-none pr-14 min-h-[44px]"
                                        />
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-500 uppercase">
                                            horas
                                        </span>
                                    </div>
                                    {/* Preset Buttons */}
                                    <div className="flex gap-1.5 pt-0.5">
                                        {[10, 25, 50, 100].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setHoursPlayed(preset.toString())}
                                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
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
                                    <span className={`text-xs font-bold ${isDetailed ? "text-emerald-400" : "text-zinc-500"}`}>
                                        {reviewText.trim().length} / 50 caracteres {isDetailed ? "(+100 XP Ativo ✓)" : "(para +100 XP bônus)"}
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    placeholder="O que achou da história, jogabilidade, gráficos e momentos marcantes? Conte para a guilda..."
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="focus:border-primary w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 text-xs sm:text-sm text-white transition-colors focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                                />
                            </div>

                            {/* Screenshots Upload Grid */}
                            <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black tracking-widest text-zinc-300 uppercase flex items-center gap-2">
                                        Capturas de Tela ({screenshots.length}/{MAX_SCREENSHOTS})
                                    </label>
                                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                        <Sparkles className="h-3 w-3" />
                                        {hasScreenshots ? "+50 XP Bônus Ativo!" : "+50 XP com prints"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                                        <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-zinc-800 hover:border-primary bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all group">
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
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <ImagePlus className="h-5 w-5 text-zinc-500 group-hover:text-primary transition-colors mb-1" />
                                                    <span className="text-xs font-black text-zinc-500 group-hover:text-white uppercase tracking-wider">
                                                        Anexar Print
                                                    </span>
                                                </>
                                            )}
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sticky Bottom Actions */}
                        <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-800/80 bg-zinc-950/95 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs sm:text-sm transition-colors uppercase tracking-wider min-h-[44px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || uploadingImages || games.length === 0}
                                className="bg-gradient-to-r from-[#bd0df2] to-purple-600 hover:from-[#bd0df2]/90 hover:to-purple-500 flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-black text-xs sm:text-sm tracking-wider text-white uppercase shadow-[0_0_25px_rgba(189,13,242,0.4)] transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Publicar Review (+{calculatedXP} XP)</span>
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
