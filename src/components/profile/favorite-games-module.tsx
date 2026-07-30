"use client";

import { useState, useTransition } from "react";
import { Game } from "@prisma/client";
import { GameAutocomplete, GameSearchResult } from "@/components/ui/game-autocomplete";
import Image from "next/image";
import { Edit2, Check, X, Loader2, Gamepad2, Trophy } from "lucide-react";

interface FavoriteGamesModuleProps {
    title: string;
    initialFavorites: Game[];
    isOwner?: boolean;
    onSaveAction: (candidates: GameSearchResult[]) => Promise<{ success: boolean; error?: string }>;
}

export function FavoriteGamesModule({
    title,
    initialFavorites,
    isOwner = true,
    onSaveAction,
}: FavoriteGamesModuleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [favorites, setFavorites] = useState<GameSearchResult[]>(
        initialFavorites.map((g) => ({
            id: g.id,
            nome: g.title,
            imageUrl: g.cover_url || "",
        })),
    );
    const [prevInitialFavorites, setPrevInitialFavorites] = useState(initialFavorites);
    const [isSearching, setIsSearching] = useState(false);

    const initialHash = initialFavorites.map((g) => `${g.id}-${g.title}-${g.cover_url || ""}`).join("|");
    const prevHash = prevInitialFavorites.map((g) => `${g.id}-${g.title}-${g.cover_url || ""}`).join("|");

    if (initialHash !== prevHash) {
        setPrevInitialFavorites(initialFavorites);
        if (!isEditing) {
            setFavorites(
                initialFavorites.map((g) => ({
                    id: g.id,
                    nome: g.title,
                    imageUrl: g.cover_url || "",
                })),
            );
        }
    }

    const handleSave = () => {
        startTransition(async () => {
            const res = await onSaveAction(favorites);
            if (res.success) {
                setIsEditing(false);
            } else {
                alert(res.error || "Failed to save games.");
            }
        });
    };

    const handleAddGame = (game: GameSearchResult) => {
        if (favorites.length >= 3) return;
        if (favorites.find((f) => f.nome === game.nome)) return;
        setFavorites([...favorites, game]);
        setIsSearching(false);
    };

    const handleRemoveGame = (id: string, nome: string) => {
        setFavorites(favorites.filter((f) => f.id !== id && f.nome !== nome));
    };

    // Rank Medal & Styling Config
    const getRankStyling = (index: number) => {
        switch (index) {
            case 0:
                return {
                    label: "#1 GOLD",
                    medalEmoji: "🥇",
                    badgeClass: "border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)]",
                    cardBorder: "border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-950/80 to-zinc-950/90 hover:border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.1)]",
                    coverBorder: "border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]",
                };
            case 1:
                return {
                    label: "#2 SILVER",
                    medalEmoji: "🥈",
                    badgeClass: "border-slate-300/50 bg-slate-300/15 text-slate-200 shadow-[0_0_12px_rgba(203,213,225,0.2)]",
                    cardBorder: "border-slate-400/30 bg-gradient-to-r from-slate-900/30 via-zinc-950/80 to-zinc-950/90 hover:border-slate-300/50",
                    coverBorder: "border-slate-300/40 shadow-[0_0_10px_rgba(203,213,225,0.2)]",
                };
            case 2:
            default:
                return {
                    label: "#3 BRONZE",
                    medalEmoji: "🥉",
                    badgeClass: "border-amber-700/50 bg-amber-950/30 text-amber-400 shadow-[0_0_10px_rgba(180,83,9,0.2)]",
                    cardBorder: "border-amber-700/30 bg-gradient-to-r from-amber-950/15 via-zinc-950/80 to-zinc-950/90 hover:border-amber-700/50",
                    coverBorder: "border-amber-700/40 shadow-[0_0_10px_rgba(180,83,9,0.2)]",
                };
        }
    };

    return (
        <div
            className={`glass-card border border-theme bg-theme-card relative flex flex-col overflow-hidden rounded-[1.5rem] p-6 shadow-2xl backdrop-blur-md transition-colors ${
                isEditing ? "z-50" : "z-10"
            }`}
        >
            {/* Ambient Top Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#bd0df2]/10 blur-[100px]" />

            {/* Module Header */}
            <div className="mb-5 flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-xs font-black tracking-widest text-white uppercase drop-shadow-md">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    <span>{title}</span>
                </h2>

                {isOwner &&
                    (!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-zinc-900/60 px-3 py-1 text-xs font-bold text-zinc-400 transition-all hover:border-amber-500/40 hover:text-white"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setFavorites(
                                        initialFavorites.map((g) => ({
                                            id: g.id,
                                            nome: g.title,
                                            imageUrl: g.cover_url || "",
                                        })),
                                    );
                                    setIsEditing(false);
                                }}
                                className="rounded-xl border border-white/10 bg-zinc-900/60 p-2 text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                                disabled={isPending}
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleSave}
                                className="rounded-xl border border-amber-500/40 bg-amber-500/20 p-2 text-amber-300 transition-colors hover:bg-amber-500/35 hover:text-white disabled:opacity-50"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 font-black" />
                                )}
                            </button>
                        </div>
                    ))}
            </div>

            {/* List of 3 Favorites */}
            <div className="flex flex-col gap-3.5">
                {favorites.map((game, idx) => {
                    const style = getRankStyling(idx);
                    const coverUrl = game.imageUrl?.startsWith("//")
                        ? `https:${game.imageUrl}`
                        : game.imageUrl?.replace("t_cover_big", "t_1080p");

                    return (
                        <div
                            key={`${game.id}-${idx}`}
                            className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-3.5 backdrop-blur-md transition-all duration-300 ${style.cardBorder}`}
                        >
                            {/* Game Poster Cover */}
                            <div className={`relative h-24 w-16 shrink-0 overflow-hidden rounded-xl border bg-zinc-900 ${style.coverBorder}`}>
                                {coverUrl ? (
                                    <Image
                                        src={coverUrl}
                                        alt={game.nome}
                                        fill
                                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center p-2 opacity-30">
                                        <Gamepad2 className="h-6 w-6 text-amber-400" />
                                    </div>
                                )}
                                {isEditing && (
                                    <div
                                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                                        onClick={() => handleRemoveGame(game.id, game.nome)}
                                    >
                                        <X className="h-6 w-6 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,1)]" />
                                    </div>
                                )}
                            </div>

                            {/* Game Details & Rank Medal */}
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black uppercase ${style.badgeClass}`}>
                                        <span>{style.medalEmoji}</span>
                                        <span>{style.label}</span>
                                    </span>
                                </div>
                                <h3 className="line-clamp-2 text-base font-black tracking-tight text-white md:text-lg">
                                    {game.nome}
                                </h3>
                            </div>
                        </div>
                    );
                })}

                {favorites.length === 0 && !isEditing && (
                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/5 bg-zinc-950/30 py-10">
                        <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                            Nenhum jogo no Top 3 selecionado
                        </span>
                    </div>
                )}

                {isEditing && favorites.length < 3 && (
                    <div className="relative mt-2 text-sm">
                        {isSearching ? (
                            <div className="absolute top-0 left-0 z-50 w-full rounded-2xl border border-amber-500/30 bg-zinc-950 p-3 shadow-2xl">
                                <GameAutocomplete
                                    onSelect={handleAddGame}
                                    onCancel={() => setIsSearching(false)}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearching(true)}
                                className="w-full rounded-2xl border border-dashed border-white/10 py-4 text-xs font-black text-zinc-400 uppercase transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300"
                            >
                                + Adicionar Jogo ao Top 3
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
