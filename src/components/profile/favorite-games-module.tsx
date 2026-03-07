"use client";

import { useState, useTransition, useEffect } from "react";
import { Game } from "@prisma/client";
import { setFavoriteGames } from "@/app/lib/user-actions";
import { GameAutocomplete, GameSearchResult } from "@/components/ui/game-autocomplete";
import { Heart, Edit2, Check, X, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setFavorites(
                initialFavorites.map((g) => ({
                    id: g.id,
                    nome: g.title,
                    imageUrl: g.cover_url || "",
                })),
            );
        }
    }, [initialFavorites, isEditing]);

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

    return (
        <div
            className={`rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md transition-colors hover:border-white/10 ${isEditing ? "relative z-50" : "relative z-10"}`}
        >
            <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                    <Heart className="h-4 w-4 fill-[#bd0df2]/20" />
                    {title}
                </h2>
                {isOwner &&
                    (!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                            <Edit2 className="h-4 w-4" />
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
                                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                disabled={isPending}
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleSave}
                                className="rounded-lg p-1.5 text-[#bd0df2] transition-colors hover:bg-[#bd0df2]/10 hover:text-[#bd0df2] disabled:opacity-50"
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

            <div className="flex flex-col gap-4">
                {favorites.map((game, idx) => (
                    <div
                        key={`${game.id}-${idx}`}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/5 bg-zinc-950/50 p-3 shadow-inner transition-all duration-300 hover:border-[#bd0df2]/40 hover:bg-[#bd0df2]/5 hover:shadow-[0_0_20px_rgba(189,13,242,0.1)]"
                    >
                        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded border border-white/5 bg-zinc-900">
                            {game.imageUrl ? (
                                <img
                                    src={game.imageUrl}
                                    alt={game.nome}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center p-2 opacity-30">
                                    <Gamepad2 className="h-6 w-6 text-[#bd0df2]" />
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
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <span className="text-xs font-black tracking-widest text-[#bd0df2]/60 uppercase">
                                RANK #{idx + 1}
                            </span>
                            <span className="truncate text-base font-black tracking-wide text-white">
                                {game.nome}
                            </span>
                        </div>
                    </div>
                ))}

                {favorites.length === 0 && !isEditing && (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-white/5 bg-zinc-950/30 py-8">
                        <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
                            No games selected
                        </span>
                    </div>
                )}

                {isEditing && favorites.length < 3 && (
                    <div className="relative mt-2 text-sm">
                        {isSearching ? (
                            <div className="absolute top-0 left-0 z-50 w-full rounded-xl border border-[#bd0df2]/30 bg-zinc-950 p-2 shadow-2xl">
                                <GameAutocomplete
                                    onSelect={handleAddGame}
                                    onCancel={() => setIsSearching(false)}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearching(true)}
                                className="w-full rounded-xl border border-dashed border-white/10 py-4 text-sm font-bold text-white/40 transition-all hover:border-[#bd0df2]/40 hover:bg-[#bd0df2]/5 hover:text-[#bd0df2]/80"
                            >
                                + ADD GAME
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
