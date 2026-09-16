"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameSearchResult, GameAutocomplete } from "@/components/ui/game-autocomplete";
import { SpecialProposalDTO } from "@/app/lib/special-game-actions";
import { ActivePauseVotingBanner } from "@/components/game/ActivePauseVotingBanner";
import { QuestType, LockStatus } from "./types";

interface PastGame {
    id: string;
    title: string;
    cover_url: string | null;
    igdb_id: string | null;
}

interface RandomizerSpecialGameCardProps {
    questType: QuestType;
    pendingProposals: SpecialProposalDTO[];
    currentUserId: string;
    currentUserEmail: string;
    lockStatus: LockStatus;
    pastIncompleteGames: PastGame[];
    onFetchPastGames: () => Promise<void>;
    onInsertSpecialGame: (game: {
        id?: string;
        igdbId?: string | null;
        nome: string;
        imageUrl?: string | null;
    }) => Promise<boolean>;
    isInsertingSpecial: boolean;
}

export function RandomizerSpecialGameCard({
    questType,
    pendingProposals,
    currentUserId,
    currentUserEmail,
    lockStatus,
    pastIncompleteGames,
    onFetchPastGames,
    onInsertSpecialGame,
    isInsertingSpecial,
}: RandomizerSpecialGameCardProps) {
    const [specialGameSearchOpen, setSpecialGameSearchOpen] = useState(false);
    const [selectedSearchedGame, setSelectedSearchedGame] = useState<GameSearchResult | null>(null);
    const [selectedPastGameId, setSelectedPastGameId] = useState<string>("");
    const [isPastDropdownOpen, setIsPastDropdownOpen] = useState(false);

    // Reset local selection when questType changes
    useEffect(() => {
        setSelectedPastGameId("");
        setSelectedSearchedGame(null);
        setSpecialGameSearchOpen(false);
        setIsPastDropdownOpen(false);
    }, [questType]);

    const handleProposeSearchGame = async () => {
        if (!selectedSearchedGame) return;
        const success = await onInsertSpecialGame({
            igdbId: selectedSearchedGame.id,
            nome: selectedSearchedGame.nome,
            imageUrl: selectedSearchedGame.imageUrl,
        });
        if (success) {
            setSelectedSearchedGame(null);
            setSpecialGameSearchOpen(false);
        }
    };

    const handleProposePastGame = async () => {
        const game = pastIncompleteGames.find((g) => g.id === selectedPastGameId);
        if (!game) return;
        const success = await onInsertSpecialGame({
            id: game.id,
            igdbId: game.igdb_id,
            nome: game.title,
            imageUrl: game.cover_url,
        });
        if (success) {
            setSelectedPastGameId("");
            setIsPastDropdownOpen(false);
        }
    };

    return (
        <div className="glass-card border border-theme bg-theme-card flex flex-col gap-4 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-2">
                <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                    Pausa Ativa / Special Release ({questType === "MAIN" ? "Main Quest" : "Side Quest"})
                </span>
                <p className="mt-1 text-xs text-zinc-400">
                    Proponha um jogo especial fora do sorteio tradicional. Requer aprovação mútua (Quórum 2/2) para se tornar a Quest Ativa.
                </p>
            </div>

            {/* Active Voting Proposals */}
            {pendingProposals.length > 0 && (
                <div className="my-1">
                    <ActivePauseVotingBanner
                        proposals={pendingProposals}
                        currentUserId={currentUserId}
                        currentUserEmail={currentUserEmail}
                    />
                </div>
            )}

            {lockStatus.locked ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                    <p className="text-xs font-black tracking-wider text-red-400 uppercase">
                        Pausa Bloqueada
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                        {lockStatus.message || "Já existe um jogo ativo para esta quest."}
                    </p>
                </div>
            ) : (
                <>
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                setSpecialGameSearchOpen(false);
                                if (pastIncompleteGames.length === 0) {
                                    onFetchPastGames();
                                }
                            }}
                            className={cn(
                                "rounded-xl border py-3.5 text-xs font-black tracking-widest uppercase transition-all duration-300",
                                !specialGameSearchOpen
                                    ? "border-[#bd0df2]/50 bg-[#bd0df2]/20 text-white shadow-[0_0_15px_rgba(189,13,242,0.25)]"
                                    : "border-white/5 bg-zinc-950/30 text-zinc-400 hover:text-white",
                            )}
                        >
                            Jogos Incompletos
                        </button>
                        <button
                            onClick={() => {
                                setSpecialGameSearchOpen(true);
                                setSelectedPastGameId("");
                            }}
                            className={cn(
                                "rounded-xl border py-3.5 text-xs font-black tracking-widest uppercase transition-all duration-300",
                                specialGameSearchOpen
                                    ? "border-[#bd0df2]/50 bg-[#bd0df2]/20 text-white shadow-[0_0_15px_rgba(189,13,242,0.25)]"
                                    : "border-white/5 bg-zinc-950/30 text-zinc-400 hover:text-white",
                            )}
                        >
                            Buscar Novo (IGDB)
                        </button>
                    </div>

                    {/* Dynamic content */}
                    {specialGameSearchOpen ? (
                        <div className="mt-2 flex flex-col gap-3">
                            {!selectedSearchedGame ? (
                                <GameAutocomplete
                                    onSelect={(game) => {
                                        setSelectedSearchedGame(game);
                                    }}
                                    onCancel={() => {
                                        setSpecialGameSearchOpen(false);
                                        setSelectedSearchedGame(null);
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center rounded-xl border border-white/5 bg-zinc-950/50 p-3">
                                        <div className="relative mr-4 h-16 w-12 shrink-0 overflow-hidden rounded border border-white/5 bg-zinc-900">
                                            {selectedSearchedGame.imageUrl && (
                                                <Image
                                                    src={selectedSearchedGame.imageUrl}
                                                    alt={selectedSearchedGame.nome}
                                                    fill
                                                    sizes="48px"
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <h4 className="flex-1 truncate text-sm font-black tracking-wide text-white">
                                            {selectedSearchedGame.nome}
                                        </h4>
                                        <button
                                            onClick={() => setSelectedSearchedGame(null)}
                                            className="p-1 text-zinc-500 hover:text-white"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleProposeSearchGame}
                                        disabled={isInsertingSpecial || lockStatus?.locked}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/60 bg-[#bd0df2] py-3.5 text-xs sm:text-sm font-black tracking-widest text-white uppercase shadow-[0_0_20px_rgba(189,13,242,0.4)] hover:bg-[#bd0df2]/90 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
                                    >
                                        {isInsertingSpecial ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Enviando Proposta...
                                            </>
                                        ) : (
                                            "Propor Pausa Ativa (Votação 2/2)"
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-2 flex flex-col gap-3">
                            {pastIncompleteGames.length === 0 ? (
                                <button
                                    onClick={onFetchPastGames}
                                    className="w-full rounded-xl border border-dashed border-white/10 py-3 text-xs font-bold text-zinc-500 hover:text-zinc-300"
                                >
                                    Carregar Jogos Passados Dropados/Incompletos
                                </button>
                            ) : (
                                <div className="relative flex flex-col gap-3">
                                    {/* Custom dropdown trigger */}
                                    <button
                                        type="button"
                                        onClick={() => setIsPastDropdownOpen(!isPastDropdownOpen)}
                                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-3 text-left text-sm font-bold text-white outline-hidden focus:border-[#bd0df2]"
                                    >
                                        <span>
                                            {selectedPastGameId
                                                ? pastIncompleteGames.find((g) => g.id === selectedPastGameId)?.title
                                                : "-- Selecione um Jogo --"}
                                        </span>
                                        <span className="ml-2 text-xs text-zinc-500">▼</span>
                                    </button>

                                    {isPastDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40 bg-transparent"
                                                onClick={() => setIsPastDropdownOpen(false)}
                                            />
                                            <div className="custom-scrollbar absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-2xl">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPastGameId("");
                                                        setIsPastDropdownOpen(false);
                                                    }}
                                                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-zinc-500 hover:bg-zinc-900 hover:text-white"
                                                >
                                                    -- Selecione um Jogo --
                                                </button>
                                                {pastIncompleteGames.map((game) => (
                                                    <button
                                                        key={game.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPastGameId(game.id);
                                                            setIsPastDropdownOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white hover:bg-zinc-900",
                                                            selectedPastGameId === game.id &&
                                                                "bg-[#bd0df2]/20 text-[#bd0df2]",
                                                        )}
                                                    >
                                                        {game.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {selectedPastGameId && (
                                        <button
                                            onClick={handleProposePastGame}
                                            disabled={isInsertingSpecial || lockStatus?.locked}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/60 bg-[#bd0df2] py-3.5 text-xs sm:text-sm font-black tracking-widest text-white uppercase shadow-[0_0_20px_rgba(189,13,242,0.4)] hover:bg-[#bd0df2]/90 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
                                        >
                                            {isInsertingSpecial ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Enviando Proposta...
                                                </>
                                            ) : (
                                                "Propor Jogo Passado (Votação 2/2)"
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
