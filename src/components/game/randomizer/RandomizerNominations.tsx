"use client";

import Image from "next/image";
import { Loader2, Save, Pencil, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameSearchResult, GameAutocomplete } from "@/components/ui/game-autocomplete";
import { HltbBadge } from "@/components/game/HltbBadge";
import { PoolEntryData } from "@/app/lib/pool-actions";
import { LocalCandidate, ActiveGuildContext, WinnerState } from "./types";

interface RandomizerNominationsProps {
    activeGuild?: ActiveGuildContext | null;
    currentUserId: string;
    currentUserName: string;
    otherUserName?: string;
    maxPerPerson: number;
    totalGames: number;
    requiredTotal: number;
    mySelections: LocalCandidate[];
    otherSelections: PoolEntryData[];
    canAddGames: boolean;
    winner: WinnerState;
    isEditing: boolean;
    addingGame: boolean;
    isSaving: boolean;
    isFetchingHltb: boolean;
    refreshingTitles: Set<string>;
    hltbTimes: Record<string, number | null>;
    mySelectionsAreSaved: boolean;
    savedSnapshot: LocalCandidate[];
    onStartEditing: () => void;
    onCancelEditing: () => void;
    onAddGame: (game: GameSearchResult) => void;
    onRemoveGame: (index: number) => void;
    onSaveSelections: () => void;
    onRefreshHltb: (title: string) => void;
    setAddingGame: (adding: boolean) => void;
    setIsEditing: (editing: boolean) => void;
}

export function RandomizerNominations({
    activeGuild,
    currentUserId,
    currentUserName,
    otherUserName,
    maxPerPerson,
    totalGames,
    requiredTotal,
    mySelections,
    otherSelections,
    canAddGames,
    winner,
    isEditing,
    addingGame,
    isSaving,
    isFetchingHltb,
    refreshingTitles,
    hltbTimes,
    mySelectionsAreSaved,
    savedSnapshot,
    onStartEditing,
    onCancelEditing,
    onAddGame,
    onRemoveGame,
    onSaveSelections,
    onRefreshHltb,
    setAddingGame,
    setIsEditing,
}: RandomizerNominationsProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* Active Guild Badge Info */}
            {activeGuild && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-theme/40 bg-theme-card/85 p-3.5 sm:px-5 sm:py-3.5 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-theme-primary/50 bg-theme-primary/20 text-theme-primary shadow-[0_0_12px_var(--theme-glow)]">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                                {activeGuild.name}
                            </span>
                            <span className="rounded-lg border border-amber-400/50 bg-amber-950/50 px-2 py-0.5 text-xs font-black text-amber-300 shadow-sm">
                                Nv {activeGuild.level}
                            </span>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-300 bg-black/40 border border-theme/30 px-3 py-1.5 rounded-xl">
                        👥 {activeGuild.activeMembers.length}{" "}
                        {activeGuild.activeMembers.length === 1 ? "membro ativo" : "membros ativos"} •{" "}
                        {maxPerPerson} indicações/membro
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-widest text-[#bd0df2]/80 uppercase">
                    Candidates Pool
                </h3>
                <span className="text-sm font-black tracking-widest text-[#bd0df2] drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                    {totalGames}/{requiredTotal} SELECTED
                </span>
            </div>

            {/* MY Choices */}
            <div
                className={`glass-card border border-theme bg-theme-card flex flex-col gap-4 rounded-2xl p-6 shadow-2xl backdrop-blur-md transition-colors ${addingGame ? "relative z-50" : "relative z-10"}`}
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                        {currentUserName}&apos;s Choices
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-500">
                            {mySelections.length}/{maxPerPerson}
                        </span>
                        {canAddGames && !winner && (
                            <>
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={onCancelEditing}
                                            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                                            title="Cancelar"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : mySelections.length > 0 ? (
                                    <button
                                        onClick={onStartEditing}
                                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                                        title="Editar seleções"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>

                {mySelections.map((c, index) => (
                    <div
                        key={c.id + "-" + index}
                        className="group relative flex items-center overflow-hidden rounded-xl border border-white/5 bg-zinc-950/50 p-3 shadow-inner transition-all duration-300 hover:border-[#bd0df2]/40 hover:bg-[#bd0df2]/5 hover:shadow-[0_0_20px_rgba(189,13,242,0.1)]"
                    >
                        <div className="relative mr-4 h-16 w-12 shrink-0 overflow-hidden rounded border border-white/5 bg-zinc-900">
                            {c.imageUrl && (
                                <Image
                                    src={c.imageUrl}
                                    alt={c.nome}
                                    fill
                                    sizes="48px"
                                    unoptimized
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <h4 className="flex-1 truncate text-sm font-black tracking-wide text-white lg:text-base">
                            {c.nome}
                        </h4>
                        <HltbBadge
                            hours={hltbTimes[c.nome]}
                            isLoading={
                                (isFetchingHltb && mySelectionsAreSaved) ||
                                refreshingTitles.has(c.nome)
                            }
                            onRefresh={() => onRefreshHltb(c.nome)}
                            className="mr-2"
                        />
                        {isEditing && (
                            <button
                                onClick={() => onRemoveGame(index)}
                                className="p-2 text-zinc-500 transition-colors hover:text-red-400"
                                title="Remover jogo"
                                aria-label="Remover jogo"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                ))}

                {/* Add game (only in edit mode or when no selections saved yet) */}
                {canAddGames &&
                    (isEditing || savedSnapshot.length === 0) &&
                    mySelections.length < maxPerPerson &&
                    !winner &&
                    (addingGame ? (
                        <div className="mt-3">
                            <GameAutocomplete
                                onSelect={onAddGame}
                                onCancel={() => setAddingGame(false)}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                if (!isEditing && savedSnapshot.length === 0) {
                                    setIsEditing(true);
                                }
                                setAddingGame(true);
                            }}
                            className="w-full rounded-xl border border-dashed border-white/10 py-4 text-sm font-bold text-white/40 transition-all hover:border-white/30 hover:text-white/80"
                        >
                            + ADD GAME
                        </button>
                    ))}

                {/* Save button */}
                {canAddGames &&
                    (isEditing ||
                        (savedSnapshot.length === 0 && mySelections.length > 0)) && (
                        <button
                            onClick={onSaveSelections}
                            disabled={isSaving}
                            className={cn(
                                "mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black tracking-widest uppercase transition-all duration-300",
                                isSaving
                                    ? "cursor-not-allowed border border-white/5 bg-zinc-900 text-zinc-500"
                                    : "border border-[#bd0df2]/40 bg-[#bd0df2]/20 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.2)] hover:border-[#bd0df2]/60 hover:bg-[#bd0df2]/30 hover:shadow-[0_0_25px_rgba(189,13,242,0.4)]",
                            )}
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving
                                ? "Salvando..."
                                : mySelections.length === 0
                                  ? "Limpar Seleções"
                                  : "Salvar Seleções"}
                        </button>
                    )}
            </div>

            {/* OTHER USERS' Choices (Multi-Guild Active Members) */}
            {activeGuild &&
            activeGuild.activeMembers.filter((m) => m.userId !== currentUserId).length > 0 ? (
                activeGuild.activeMembers
                    .filter((m) => m.userId !== currentUserId)
                    .map((member) => {
                        const memberEntries = otherSelections.filter(
                            (e) => e.userId === member.userId,
                        );
                        return (
                            <div
                                key={member.userId}
                                className="glass-card border border-theme bg-theme-card flex flex-col gap-4 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                                            {member.name}&apos;s Choices
                                        </span>
                                        {member.role === "LEADER" && (
                                            <span className="text-xs font-black text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 rounded">
                                                👑 Líder
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-zinc-500">
                                        {memberEntries.length}/{maxPerPerson}
                                    </span>
                                </div>

                                {memberEntries.length === 0 ? (
                                    <div className="flex items-center justify-center rounded-xl border border-dashed border-white/5 bg-zinc-950/30 py-8">
                                        <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
                                            Aguardando {member.name} selecionar...
                                        </span>
                                    </div>
                                ) : (
                                    memberEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="group relative flex items-center overflow-hidden rounded-xl border border-white/5 bg-zinc-950/50 p-3 shadow-inner transition-all duration-300 hover:border-[#bd0df2]/40 hover:bg-[#bd0df2]/5 hover:shadow-[0_0_20px_rgba(189,13,242,0.1)]"
                                        >
                                            <div className="relative mr-4 h-16 w-12 shrink-0 overflow-hidden rounded border border-white/5 bg-zinc-900">
                                                {entry.gameImageUrl && (
                                                    <Image
                                                        src={entry.gameImageUrl}
                                                        alt={entry.gameTitle}
                                                        fill
                                                        sizes="48px"
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <h4 className="flex-1 truncate text-sm font-black tracking-wide text-white lg:text-base">
                                                {entry.gameTitle}
                                            </h4>
                                            <HltbBadge
                                                hours={hltbTimes[entry.gameTitle]}
                                                isLoading={
                                                    (isFetchingHltb && !isEditing) ||
                                                    refreshingTitles.has(entry.gameTitle)
                                                }
                                                onRefresh={() => onRefreshHltb(entry.gameTitle)}
                                                className="mr-2"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        );
                    })
            ) : (
                <div className="glass-card border border-theme bg-theme-card flex flex-col gap-4 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                            {otherUserName}&apos;s Choices
                        </span>
                        <span className="text-sm font-bold text-zinc-500">
                            {otherSelections.length}/{maxPerPerson}
                        </span>
                    </div>

                    {otherSelections.length === 0 ? (
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-white/5 bg-zinc-950/30 py-8">
                            <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
                                Aguardando {otherUserName} selecionar...
                            </span>
                        </div>
                    ) : (
                        otherSelections.map((entry) => (
                            <div
                                key={entry.id}
                                className="group relative flex items-center overflow-hidden rounded-xl border border-white/5 bg-zinc-950/50 p-3 shadow-inner transition-all duration-300 hover:border-[#bd0df2]/40 hover:bg-[#bd0df2]/5 hover:shadow-[0_0_20px_rgba(189,13,242,0.1)]"
                            >
                                <div className="relative mr-4 h-16 w-12 shrink-0 overflow-hidden rounded border border-white/5 bg-zinc-900">
                                    {entry.gameImageUrl && (
                                        <Image
                                            src={entry.gameImageUrl}
                                            alt={entry.gameTitle}
                                            fill
                                            sizes="48px"
                                            unoptimized
                                            className="object-cover"
                                        />
                                    )}
                                </div>
                                <h4 className="flex-1 truncate text-sm font-black tracking-wide text-white lg:text-base">
                                    {entry.gameTitle}
                                </h4>
                                <HltbBadge
                                    hours={hltbTimes[entry.gameTitle]}
                                    isLoading={
                                        (isFetchingHltb && !isEditing) ||
                                        refreshingTitles.has(entry.gameTitle)
                                    }
                                    onRefresh={() => onRefreshHltb(entry.gameTitle)}
                                    className="mr-2"
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
