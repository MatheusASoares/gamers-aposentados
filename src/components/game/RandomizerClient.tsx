"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Loader2, Trophy, History, Save, Pencil, X, Check } from "lucide-react";
import { GameSearchResult } from "@/components/ui/game-autocomplete";
import { GameAutocomplete } from "@/components/ui/game-autocomplete";
import { getRandomizerStatus } from "@/app/lib/quest-actions";
import {
    getOpenPool,
    saveSelections,
    executeRoll,
    GameSelection,
    PoolEntryData,
} from "@/app/lib/pool-actions";
import { cn } from "@/lib/utils";

type QuestType = "MAIN" | "SIDE";

interface LocalCandidate extends GameSearchResult {
    nominator: string;
    entryId?: string; // From DB if already saved
}

export function RandomizerClient({
    currentUserId,
    currentUserName,
    currentUserEmail,
    canAddGames,
    otherPlayerName: defaultOtherName,
}: {
    currentUserId: string;
    currentUserName: string;
    currentUserEmail: string;
    canAddGames: boolean;
    otherPlayerName: string;
}) {
    const [questType, setQuestType] = useState<QuestType>("SIDE");

    // Pool state
    const [poolId, setPoolId] = useState<string | null>(null);
    const [mySelections, setMySelections] = useState<LocalCandidate[]>([]);
    const [otherSelections, setOtherSelections] = useState<PoolEntryData[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [addingGame, setAddingGame] = useState(false);

    // Saved snapshot for cancel
    const [savedSnapshot, setSavedSnapshot] = useState<LocalCandidate[]>([]);

    const [lockStatus, setLockStatus] = useState<{ locked: boolean; message?: string }>({
        locked: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [winner, setWinner] = useState<{ title: string; imageUrl?: string | null } | null>(null);
    const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    const maxPerPerson = questType === "MAIN" ? 2 : 3;

    // Determine the "other" user's name from pool entries or from the prop
    const otherUserName = otherSelections.length > 0
        ? otherSelections[0].userName
        : defaultOtherName;

    const loadPool = useCallback(async (type: QuestType) => {
        setIsLoading(true);
        try {
            const pool = await getOpenPool(type);
            if (pool) {
                setPoolId(pool.poolId);

                // Split entries: mine vs others
                const mine = pool.entries
                    .filter((e) => e.userId === currentUserId)
                    .map((e) => ({
                        id: e.gameIgdbId,
                        nome: e.gameTitle,
                        imageUrl: e.gameImageUrl,
                        nominator: currentUserName,
                        entryId: e.id,
                    }));
                const others = pool.entries.filter((e) => e.userId !== currentUserId);

                setMySelections(mine);
                setSavedSnapshot(mine);
                setOtherSelections(others);
            } else {
                setPoolId(null);
                setMySelections([]);
                setSavedSnapshot([]);
                setOtherSelections([]);
            }
        } catch (err) {
            console.error("Error loading pool:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId, currentUserName]);

    useEffect(() => {
        setWinner(null);
        setSaveStatus(null);
        setIsEditing(false);
        setAddingGame(false);

        // Fetch lock status
        getRandomizerStatus(questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST").then((res) => {
            setLockStatus(res as any);
        });

        loadPool(questType);
    }, [questType, loadPool]);

    // --- Handlers ---

    const handleAddGame = (game: GameSearchResult) => {
        if (mySelections.length >= maxPerPerson) return;
        if (mySelections.find((c) => c.nome === game.nome)) return;

        setMySelections((prev) => [
            ...prev,
            { ...game, nominator: currentUserName },
        ]);
        setAddingGame(false);
    };

    const handleRemoveGame = (index: number) => {
        setMySelections((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSaveSelections = async () => {
        setIsSaving(true);
        setSaveStatus(null);

        try {
            const games: GameSelection[] = mySelections.map((c) => ({
                igdbId: c.id,
                nome: c.nome,
                imageUrl: c.imageUrl,
            }));

            const response = await saveSelections(questType, games);

            if (response.success) {
                setSaveStatus({ success: true, message: "Seleções salvas!" });
                setIsEditing(false);
                // Reload pool to get fresh entry IDs
                await loadPool(questType);
            } else {
                setSaveStatus({ success: false, message: response.error || "Erro ao salvar." });
            }
        } catch (err) {
            console.error(err);
            setSaveStatus({ success: false, message: "Erro ao conectar ao servidor." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartEditing = () => {
        setSavedSnapshot([...mySelections]);
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setMySelections(savedSnapshot);
        setIsEditing(false);
        setAddingGame(false);
    };

    const handleRoll = async () => {
        if (!poolId || isRolling || isSaving || lockStatus.locked || winner) return;

        const totalGames = mySelections.length + otherSelections.length;
        const requiredTotal = maxPerPerson * 2;
        if (totalGames < requiredTotal) return;

        setIsRolling(true);
        setWinner(null);
        setSaveStatus(null);

        try {
            // Wait for animation
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const response = await executeRoll(poolId);

            if (response.success) {
                const result = response as { success: true; winnerId: string; winnerTitle: string; winnerImageUrl: string | null };
                setWinner({
                    title: result.winnerTitle,
                    imageUrl: result.winnerImageUrl,
                });
                setSaveStatus({ success: true, message: "Resultado salvo no Cofre!" });
            } else {
                setSaveStatus({ success: false, message: response.error || "Erro no sorteio." });
            }
        } catch (err) {
            console.error(err);
            setSaveStatus({ success: false, message: "Erro fatal ao conectar ao servidor." });
        } finally {
            setIsRolling(false);
        }
    };

    const handleQuestTypeChange = (type: QuestType) => {
        setQuestType(type);
    };

    const handleClearBoard = async () => {
        setWinner(null);
        setSaveStatus(null);
        await loadPool(questType);
    };

    // --- Computed ---
    const totalGames = mySelections.length + otherSelections.length;
    const requiredTotal = maxPerPerson * 2;
    const poolIsComplete = totalGames >= requiredTotal;
    const mySelectionsAreSaved = !isEditing && savedSnapshot.length === mySelections.length &&
        savedSnapshot.every((s, i) => s.nome === mySelections[i]?.nome);
    const hasUnsavedChanges = isEditing || (
        mySelections.length > 0 && (
            savedSnapshot.length !== mySelections.length ||
            !savedSnapshot.every((s, i) => s.nome === mySelections[i]?.nome)
        )
    );

    return (
        <div className="flex w-full flex-col gap-8">
            {/* Header Area */}
            <div className="flex flex-col justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-black tracking-tight text-white lg:text-5xl">
                        THE GREAT RANDOMIZER
                    </h1>
                    <p className="text-lg text-white/60 italic">
                        May the RNG be in your favor, Commander.
                    </p>
                </div>
                <div className="inline-flex rounded-xl border border-white/5 bg-zinc-900/50 p-1">
                    <button
                        onClick={() => handleQuestTypeChange("MAIN")}
                        className={cn(
                            "rounded-lg px-6 py-2 text-sm font-bold transition-all",
                            questType === "MAIN"
                                ? "bg-primary shadow-primary/20 text-white shadow-lg"
                                : "text-white/50 hover:text-white",
                        )}
                    >
                        Main Quest{" "}
                        <span
                            className={cn(
                                "ml-1 font-normal",
                                questType === "MAIN" ? "text-white/60" : "text-white/40",
                            )}
                        >
                            (3m)
                        </span>
                    </button>
                    <button
                        onClick={() => handleQuestTypeChange("SIDE")}
                        className={cn(
                            "rounded-lg px-6 py-2 text-sm font-bold transition-all",
                            questType === "SIDE"
                                ? "bg-primary shadow-primary/20 text-white shadow-lg"
                                : "text-white/50 hover:text-white",
                        )}
                    >
                        Side Quest{" "}
                        <span
                            className={cn(
                                "ml-1 font-normal",
                                questType === "SIDE" ? "text-white/60" : "text-white/40",
                            )}
                        >
                            (1m)
                        </span>
                    </button>
                </div>
            </div>

            {/* Alert Notification */}
            {saveStatus && (
                <div
                    className={cn(
                        "animate-in fade-in slide-in-from-top-4 flex items-center gap-3 rounded-xl border px-4 py-3",
                        saveStatus.success
                            ? "bg-primary/10 border-primary/50 text-white"
                            : "border-red-500/50 bg-red-500/10 text-red-400",
                    )}
                >
                    <Trophy
                        className={cn(
                            "h-5 w-5",
                            saveStatus.success ? "text-primary" : "text-red-400",
                        )}
                    />
                    <p className="text-sm font-bold">{saveStatus.message}</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="text-primary h-10 w-10 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
                    {/* Left Column: Candidates Pool */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold tracking-widest text-white/80 uppercase">
                                Candidates Pool
                            </h3>
                            <span className="text-primary text-sm font-bold">
                                {totalGames}/{requiredTotal} SELECTED
                            </span>
                        </div>

                        {/* MY Choices */}
                        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                                    {currentUserName}&apos;s Choices
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-500">
                                        {mySelections.length}/{maxPerPerson}
                                    </span>
                                    {canAddGames && !winner && (
                                        <>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={handleCancelEditing}
                                                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                                                        title="Cancelar"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : mySelections.length > 0 ? (
                                                <button
                                                    onClick={handleStartEditing}
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
                                    className="group hover:border-primary/50 relative flex items-center overflow-hidden rounded-xl border border-white/5 bg-zinc-800/80 p-2 transition-all"
                                >
                                    <div className="mr-4 size-12 shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                                        {c.imageUrl && (
                                            <img
                                                src={c.imageUrl}
                                                alt={c.nome}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <h4 className="flex-1 truncate text-sm font-bold text-white lg:text-base">
                                        {c.nome}
                                    </h4>
                                    {isEditing && (
                                        <button
                                            onClick={() => handleRemoveGame(index)}
                                            className="p-2 text-zinc-500 hover:text-red-400"
                                        >
                                            <X className="h-4 w-4" />
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
                                            onSelect={handleAddGame}
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
                            {canAddGames && (isEditing || (savedSnapshot.length === 0 && mySelections.length > 0)) && (
                                <button
                                    onClick={handleSaveSelections}
                                    disabled={isSaving}
                                    className={cn(
                                        "mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                                        isSaving
                                            ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                                            : "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30 border",
                                    )}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isSaving ? "Salvando..." : mySelections.length === 0 ? "Limpar Seleções" : "Salvar Seleções"}
                                </button>
                            )}
                        </div>

                        {/* OTHER USER's Choices */}
                        <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                                    {otherUserName}&apos;s Choices
                                </span>
                                <span className="text-sm text-zinc-500">
                                    {otherSelections.length}/{maxPerPerson}
                                </span>
                            </div>

                            {otherSelections.length === 0 ? (
                                <div className="flex items-center justify-center rounded-xl border border-dashed border-white/5 py-6">
                                    <span className="text-sm text-zinc-600 italic">
                                        Aguardando {otherUserName} selecionar jogos...
                                    </span>
                                </div>
                            ) : (
                                otherSelections.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="group hover:border-primary/50 relative flex items-center overflow-hidden rounded-xl border border-white/5 bg-zinc-800/80 p-2 transition-all"
                                    >
                                        <div className="mr-4 size-12 shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                                            {entry.gameImageUrl && (
                                                <img
                                                    src={entry.gameImageUrl}
                                                    alt={entry.gameTitle}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <h4 className="flex-1 truncate text-sm font-bold text-white lg:text-base">
                                            {entry.gameTitle}
                                        </h4>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Randomizer Tool Area */}
                    <div>
                        <div className="group relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/30 p-8 lg:p-12">
                            {/* Glow effect */}
                            <div className="bg-primary/20 absolute -top-24 -right-24 size-64 rounded-full blur-[100px]"></div>

                            <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
                                {/* Display Box */}
                                <div className="flex w-full flex-col items-center gap-4">
                                    <div className="border-primary relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 bg-zinc-950/80 px-6 py-10 shadow-[0_0_40px_rgba(189,13,242,0.2)]">
                                        <div className="from-primary/5 absolute inset-0 bg-gradient-to-t to-transparent"></div>
                                        <div className="relative z-10 flex min-h-16 w-full items-center justify-center overflow-hidden text-center">
                                            {isRolling ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                                    <span className="text-primary animate-pulse text-3xl font-black tracking-tighter uppercase">
                                                        ROLLING...
                                                    </span>
                                                </div>
                                            ) : winner ? (
                                                <div className="animate-in zoom-in spin-in-2 flex flex-col items-center gap-4 duration-500">
                                                    <div className="relative">
                                                        <div className="bg-primary/20 absolute inset-0 rounded-full blur-xl"></div>
                                                        {winner.imageUrl && (
                                                            <img
                                                                src={winner.imageUrl}
                                                                alt={winner.title}
                                                                className="border-primary relative z-10 h-56 w-40 rounded-2xl border-2 object-cover shadow-[0_0_40px_rgba(189,13,242,0.6)]"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-shadow-glow text-4xl leading-tight font-black tracking-tighter text-white uppercase md:text-6xl">
                                                        {winner.title}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-primary text-4xl leading-tight font-black tracking-tighter uppercase opacity-50 md:text-5xl lg:text-6xl">
                                                    {poolIsComplete && !hasUnsavedChanges
                                                        ? "READY TO SPIN"
                                                        : hasUnsavedChanges
                                                          ? "SAVE FIRST"
                                                          : "ADD GAMES FIRST"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Roll Button */}
                                {lockStatus.locked ? (
                                    <div className="mx-auto w-full max-w-sm rounded-2xl border-[1.5px] border-red-500/30 bg-red-500/10 px-8 py-5 text-center">
                                        <p className="text-base leading-relaxed font-black tracking-widest text-red-400 uppercase drop-shadow-[0_0_5px_rgba(248,113,113,0.5)] md:text-lg">
                                            ❌ SORTEIO BLOQUEADO
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-red-300/90">
                                            {lockStatus.message}
                                        </p>
                                    </div>
                                ) : winner ? (
                                    <button
                                        onClick={handleClearBoard}
                                        className="mx-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-zinc-800 px-8 py-4 text-white transition-all hover:scale-105 hover:bg-zinc-700 active:scale-95"
                                    >
                                        <History className="h-6 w-6" />
                                        <span className="text-xl font-bold tracking-tighter uppercase">
                                            Limpar Quadro
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRoll}
                                        disabled={
                                            !poolIsComplete ||
                                            hasUnsavedChanges ||
                                            isRolling ||
                                            isSaving ||
                                            !poolId
                                        }
                                        className={cn(
                                            "mx-auto flex w-full max-w-sm items-center justify-center gap-4 rounded-2xl px-12 py-5 transition-all",
                                            poolIsComplete &&
                                                !hasUnsavedChanges &&
                                                !isRolling &&
                                                !isSaving &&
                                                poolId
                                                ? "bg-primary text-white shadow-[0_10px_40px_rgba(189,13,242,0.4)] hover:scale-105 active:scale-95"
                                                : "cursor-not-allowed bg-zinc-800 text-zinc-500",
                                        )}
                                    >
                                        <Trophy
                                            className={cn(
                                                "h-10 w-10",
                                                isRolling && "animate-spin",
                                            )}
                                        />
                                        <span className="text-3xl font-black tracking-tighter uppercase">
                                            {isRolling ? "Rolling..." : "Roll the Dice"}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
