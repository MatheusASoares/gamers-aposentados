"use client";

import { useState, useTransition, useEffect } from "react";
import { Game } from "@prisma/client";
import { setFavoriteGames } from "@/app/lib/user-actions";
import { GameAutocomplete, GameSearchResult } from "@/components/ui/game-autocomplete";
import { Heart, Edit2, Check, X, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteGamesModuleProps {
    initialFavorites: Game[];
}

export function FavoriteGamesModule({ initialFavorites }: FavoriteGamesModuleProps) {
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
            const res = await setFavoriteGames(favorites);
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
        <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Heart className="text-primary fill-primary h-5 w-5" />
                    Top 3 Games
                </h2>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-zinc-500 transition-colors hover:text-white"
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
                            className="p-1 text-zinc-500 hover:text-red-400 disabled:opacity-50"
                            disabled={isPending}
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleSave}
                            className="text-primary p-1 hover:text-white disabled:opacity-50"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Check className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {favorites.map((game, idx) => (
                    <div
                        key={`${game.id}-${idx}`}
                        className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/5 bg-zinc-950 p-2"
                    >
                        <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                            {game.imageUrl ? (
                                <img
                                    src={game.imageUrl}
                                    alt={game.nome}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Gamepad2 className="h-4 w-4 text-zinc-600" />
                                </div>
                            )}
                            {isEditing && (
                                <div
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => handleRemoveGame(game.id, game.nome)}
                                >
                                    <X className="h-5 w-5 text-red-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col">
                            <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
                                #{idx + 1}
                            </span>
                            <span className="truncate text-sm font-bold text-white">
                                {game.nome}
                            </span>
                        </div>
                    </div>
                ))}

                {favorites.length === 0 && !isEditing && (
                    <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-zinc-600">
                        No favorite games selected.
                    </div>
                )}

                {isEditing && favorites.length < 3 && (
                    <div className="relative mt-2 text-sm">
                        {isSearching ? (
                            <div className="absolute top-0 left-0 z-50 w-full">
                                <GameAutocomplete
                                    onSelect={handleAddGame}
                                    onCancel={() => setIsSearching(false)}
                                />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full border-dashed border-white/10 bg-transparent text-zinc-400 hover:bg-white/5"
                                onClick={() => setIsSearching(true)}
                            >
                                + Add Game
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
