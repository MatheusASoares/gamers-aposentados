"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Trophy, History, Save, Pencil, X, Shield, Swords, Compass, Sparkles, Gamepad2, Flame } from "lucide-react";
import { GiSwordsEmblem, GiDragonHead, GiSpaceship, GiPortal, GiRetroController, GiCyberEye } from "react-icons/gi";
import Image from "next/image";
import { GameSearchResult } from "@/components/ui/game-autocomplete";
import { GameAutocomplete } from "@/components/ui/game-autocomplete";
import { HltbBadge } from "@/components/game/HltbBadge";
import { getRandomizerStatus } from "@/app/lib/quest-actions";
import {
    getOpenPool,
    saveSelections,
    executeRoll,
    GameSelection,
    PoolEntryData,
    getPastIncompleteGames,
    insertSpecialGame,
} from "@/app/lib/pool-actions";
import { cn } from "@/lib/utils";

type QuestType = "MAIN" | "SIDE";

interface LocalCandidate extends GameSearchResult {
    nominator: string;
    entryId?: string; // From DB if already saved
}

function ThemedEmblemIcon({ theme }: { theme: string }) {
    if (theme === "theme-medieval") {
        return (
            <div className="relative flex items-center justify-center">
                <GiSwordsEmblem className="h-24 w-24 text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.95)] animate-pulse" />
                <GiDragonHead className="absolute -top-4 h-12 w-12 text-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-bounce" />
            </div>
        );
    }

    if (theme === "theme-space") {
        return (
            <div className="relative flex items-center justify-center">
                <GiPortal className="h-24 w-24 text-sky-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.95)] animate-spin-slow" />
                <GiSpaceship className="absolute h-12 w-12 text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-pulse" />
            </div>
        );
    }

    if (theme === "theme-pixel") {
        return (
            <div className="relative flex items-center justify-center">
                <GiRetroController className="h-24 w-24 text-emerald-400 drop-shadow-[4px_4px_0px_#000] animate-bounce" />
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center">
            <GiCyberEye className="h-24 w-24 text-[#bd0df2] drop-shadow-[0_0_35px_rgba(189,13,242,0.95)] animate-pulse" />
            <Sparkles className="absolute h-12 w-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-spin-slow" />
        </div>
    );
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
    const { data: session } = useSession();
    const equippedTheme = (session?.user as any)?.equipped_theme || "cyberpunk";

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

    // Special break state
    const [pastIncompleteGames, setPastIncompleteGames] = useState<
        { id: string; title: string; cover_url: string | null; igdb_id: string | null }[]
    >([]);
    const [selectedPastGameId, setSelectedPastGameId] = useState<string>("");
    const [isPastDropdownOpen, setIsPastDropdownOpen] = useState(false);
    const [isInsertingSpecial, setIsInsertingSpecial] = useState(false);
    const [specialGameSearchOpen, setSpecialGameSearchOpen] = useState(false);
    const [selectedSearchedGame, setSelectedSearchedGame] = useState<GameSearchResult | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [winner, setWinner] = useState<{ title: string; imageUrl?: string | null } | null>(null);
    const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(
        null,
    );
    const [hltbTimes, setHltbTimes] = useState<Record<string, number | null>>({});
    const [isFetchingHltb, setIsFetchingHltb] = useState(false);
    const [refreshingTitles, setRefreshingTitles] = useState<Set<string>>(new Set());

    const isTestUser = currentUserEmail.endsWith("@test.com");
    const requiredTotal = questType === "MAIN" ? 4 : 6;
    const maxPerPerson = isTestUser ? requiredTotal : (questType === "MAIN" ? 2 : 3);

    // Determine the "other" user's name from pool entries or from the prop
    const otherUserName =
        otherSelections.length > 0 ? otherSelections[0].userName : defaultOtherName;

    const loadPool = useCallback(
        async (type: QuestType, silent: boolean = false) => {
            if (!silent) setIsLoading(true);
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

                    // Update HLTB times from pool data
                    setHltbTimes((prev) => {
                        const next = { ...prev };
                        pool.entries.forEach((e) => {
                            if (e.hltb_time !== undefined && e.hltb_time !== null) {
                                next[e.gameTitle] = e.hltb_time;
                            }
                        });
                        return next;
                    });

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
                if (!silent) setIsLoading(false);
            }
        },
        [currentUserId, currentUserName],
    );

    const handleRefreshHltb = async (title: string) => {
        if (refreshingTitles.has(title)) return;

        setRefreshingTitles((prev) => {
            const next = new Set(prev);
            next.add(title);
            return next;
        });

        try {
            const aiRes = await fetch("/api/ai/hltb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ titles: [title] }),
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                setHltbTimes((prev) => {
                    const next = { ...prev };
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    aiData.results.forEach((r: any) => {
                        next[r.title] = r.mainStory || null;
                    });
                    return next;
                });
            }
        } catch (err) {
            console.error("Manual AI fetch failed", err);
        } finally {
            setRefreshingTitles((prev) => {
                const next = new Set(prev);
                next.delete(title);
                return next;
            });
        }
    };

    useEffect(() => {
        setWinner(null);
        setSaveStatus(null);
        setIsEditing(false);
        setAddingGame(false);

        // Fetch lock status
        getRandomizerStatus(questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST").then((res) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setLockStatus(res as any);
        });

        loadPool(questType);

        // Fetch past incomplete games on load
        getPastIncompleteGames().then((res) => {
            if (res.success && res.games) {
                setPastIncompleteGames(res.games);
            }
        });
    }, [questType, loadPool]);

    const handleInsertSpecialGame = async (gameToInsert: {
        id?: string;
        igdbId?: string | null;
        nome: string;
        imageUrl?: string | null;
    }) => {
        setIsInsertingSpecial(true);
        setSaveStatus(null);
        try {
            const res = await insertSpecialGame(questType, gameToInsert);
            if (res.success) {
                setSaveStatus({
                    success: true,
                    message: `Pausa ativa! Jogo "${gameToInsert.nome}" inserido com sucesso.`,
                });
                setWinner({
                    title: gameToInsert.nome,
                    imageUrl: gameToInsert.imageUrl?.replace("t_cover_big", "t_1080p") || null,
                });
                await loadPool(questType);
                setSelectedPastGameId("");
                setSpecialGameSearchOpen(false);
            } else {
                setSaveStatus({
                    success: false,
                    message: res.error || "Erro ao inserir jogo especial.",
                });
            }
        } catch (err) {
            console.error("Error inserting special game:", err);
            setSaveStatus({ success: false, message: "Erro de conexão ao servidor." });
        } finally {
            setIsInsertingSpecial(false);
        }
    };

    // --- Core Computed States (needed for polling dependencies) ---
    const totalGames = mySelections.length + otherSelections.length;
    const poolIsComplete = totalGames >= requiredTotal;
    const mySelectionsAreSaved =
        !isEditing &&
        savedSnapshot.length === mySelections.length &&
        savedSnapshot.every((s, i) => s.nome === mySelections[i]?.nome);
    const hasUnsavedChanges =
        isEditing ||
        (mySelections.length > 0 &&
            (savedSnapshot.length !== mySelections.length ||
                !savedSnapshot.every((s, i) => s.nome === mySelections[i]?.nome)));

    // --- Background Polling (Real-time Illusion) ---
    useEffect(() => {
        // Stop polling if the pool is full, someone is rolling, or user is tinkering with selections
        if (poolIsComplete || isRolling || hasUnsavedChanges || addingGame || isSaving || winner) {
            return;
        }

        const intervalId = setInterval(() => {
            loadPool(questType, true); // True to keep the UI from completely refreshing into a Loading state
        }, 15000); // 15 seconds

        return () => clearInterval(intervalId);
    }, [
        questType,
        loadPool,
        poolIsComplete,
        isRolling,
        hasUnsavedChanges,
        addingGame,
        isSaving,
        winner,
    ]);

    // --- Handlers ---

    const handleAddGame = (game: GameSearchResult) => {
        if (mySelections.length >= maxPerPerson) return;
        if (mySelections.find((c) => c.nome === game.nome)) return;

        setMySelections((prev) => [...prev, { ...game, nominator: currentUserName }]);
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
                setSaveStatus({
                    success: true,
                    message: "Seleções salvas! Consultando AI Agent (HLTB)...",
                });
                setIsEditing(false);
                // Reload pool to get fresh entry IDs
                await loadPool(questType);

                // Fetch AI Times
                setIsFetchingHltb(true);
                try {
                    const aiRes = await fetch("/api/ai/hltb", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ titles: games.map((g) => g.nome) }),
                    });

                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        const newTimes = { ...hltbTimes };
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        aiData.results.forEach((r: any) => {
                            newTimes[r.title] = r.mainStory || null;
                        });
                        setHltbTimes(newTimes);
                        setSaveStatus({
                            success: true,
                            message: "Seleções salvas com sucesso!",
                        });
                    } else {
                        setSaveStatus({
                            success: true,
                            message: "Seleções salvas (Falha no AI)",
                        });
                    }
                } catch (err) {
                    console.error("AI fetch failed", err);
                    setSaveStatus({
                        success: true,
                        message: "Seleções salvas (Erro no AI)",
                    });
                } finally {
                    setIsFetchingHltb(false);
                }
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

    const [cycleText, setCycleText] = useState<string>("");
    const cycleIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (cycleIntervalRef.current) {
                clearInterval(cycleIntervalRef.current);
            }
        };
    }, []);

    const handleRoll = async () => {
        if (!poolId || isRolling || isSaving || lockStatus.locked || winner) return;

        const totalGames = mySelections.length + otherSelections.length;
        if (totalGames < requiredTotal) return;

        setIsRolling(true);
        setWinner(null);
        setSaveStatus(null);

        try {
            // Setup Fast Cycling Animation
            const allCandidates = [
                ...mySelections.map((c) => c.nome),
                ...otherSelections.map((c) => c.gameTitle),
            ];

            if (allCandidates.length > 0) {
                let currentIndex = 0;
                cycleIntervalRef.current = setInterval(() => {
                    setCycleText(allCandidates[currentIndex]);
                    currentIndex = (currentIndex + 1) % allCandidates.length;
                }, 100); // changes every 100ms
            }

            // Wait for animation
            await new Promise((resolve) => setTimeout(resolve, 3000));

            if (cycleIntervalRef.current) {
                clearInterval(cycleIntervalRef.current);
                cycleIntervalRef.current = null;
            }

            const response = await executeRoll(poolId);

            if (response.success) {
                const result = response as {
                    success: true;
                    winnerId: string;
                    winnerTitle: string;
                    winnerImageUrl: string | null;
                };
                // Fetch high res cover similar to reviews/dashboard for cinematic view
                const cinematicImg =
                    result.winnerImageUrl?.replace("t_cover_big", "t_1080p") || null;
                setWinner({
                    title: result.winnerTitle,
                    imageUrl: cinematicImg,
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
            setCycleText("");
        }
    };

    const handleQuestTypeChange = (type: QuestType) => {
        setQuestType(type);
    };

    const handleTestRoll = () => {
        if (isRolling) return;
        setIsRolling(true);
        const sampleGames = [
            "Dead Cells",
            "Elden Ring",
            "Hollow Knight",
            "Chrono Trigger",
            "The Witcher 3: Wild Hunt",
            "Starfield",
            "Final Fantasy VII",
        ];
        let idx = 0;
        cycleIntervalRef.current = setInterval(() => {
            setCycleText(sampleGames[idx]);
            idx = (idx + 1) % sampleGames.length;
        }, 120);

        setTimeout(() => {
            if (cycleIntervalRef.current) {
                clearInterval(cycleIntervalRef.current);
                cycleIntervalRef.current = null;
            }
            setIsRolling(false);
            setCycleText("");
        }, 4000);
    };

    const handleClearBoard = async () => {
        setWinner(null);
        setSaveStatus(null);
        await loadPool(questType);
    };

    // --- Handlers ---

    return (
        <div className="relative mx-auto min-h-screen w-full px-6 py-8">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 flex w-full flex-col gap-8">
                {/* Header Area (Padrão do Aplicativo) */}
                <div className="flex flex-col justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
                    <div className="space-y-3">
                        <h2 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-md md:text-5xl">
                            The Great Randomizer
                        </h2>
                        <p className="max-w-2xl text-lg font-medium text-zinc-400">
                            May the RNG be in your favor, Commander.
                        </p>
                    </div>
                    <div className="relative flex w-full max-w-[380px] flex-shrink-0 rounded-2xl border border-white/5 bg-zinc-900/40 p-1.5 shadow-xl backdrop-blur-md sm:inline-flex sm:w-[400px]">
                        <div
                            className={cn(
                                "ease-spring absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded-xl transition-all duration-500",
                                questType === "MAIN"
                                    ? "translate-x-0 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                                    : "translate-x-full bg-[#bd0df2]/20 shadow-[0_0_20px_rgba(189,13,242,0.2)]",
                            )}
                        />
                        <div
                            className={cn(
                                "ease-spring absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded-xl border border-white/10 transition-all duration-500",
                                questType === "MAIN"
                                    ? "translate-x-0 border-amber-400/50"
                                    : "translate-x-full border-[#bd0df2]/50",
                            )}
                        />
                        <button
                            onClick={() => handleQuestTypeChange("MAIN")}
                            className={cn(
                                "relative z-10 w-1/2 py-3 text-center text-xs font-black tracking-wider uppercase transition-all duration-500 sm:text-sm sm:tracking-widest",
                                questType === "MAIN"
                                    ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                    : "text-zinc-500 hover:text-zinc-300",
                            )}
                        >
                            Main Quest{" "}
                            <span
                                className={cn(
                                    "ml-0.5 font-normal sm:ml-1",
                                    questType === "MAIN" ? "text-amber-400/60" : "text-zinc-600",
                                )}
                            >
                                (3m)
                            </span>
                        </button>
                        <button
                            onClick={() => handleQuestTypeChange("SIDE")}
                            className={cn(
                                "relative z-10 w-1/2 py-3 text-center text-xs font-black tracking-wider uppercase transition-all duration-500 sm:text-sm sm:tracking-widest",
                                questType === "SIDE"
                                    ? "text-[#bd0df2] drop-shadow-[0_0_10px_rgba(189,13,242,0.5)]"
                                    : "text-zinc-500 hover:text-zinc-300",
                            )}
                        >
                            Side Quest{" "}
                            <span
                                className={cn(
                                    "ml-1 font-normal",
                                    questType === "SIDE" ? "text-[#bd0df2]/60" : "text-zinc-600",
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
                                            onRefresh={() => handleRefreshHltb(c.nome)}
                                            className="mr-2"
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={() => handleRemoveGame(index)}
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
                                {canAddGames &&
                                    (isEditing ||
                                        (savedSnapshot.length === 0 &&
                                            mySelections.length > 0)) && (
                                        <button
                                            onClick={handleSaveSelections}
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

                            {/* OTHER USER's Choices */}
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
                                                onRefresh={() => handleRefreshHltb(entry.gameTitle)}
                                                className="mr-2"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Special Break Card (Month 6/12 Pause) */}
                            {questType === "SIDE" && (
                                <div className="glass-card border border-theme bg-theme-card flex flex-col gap-4 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                                    <div className="mb-2">
                                        <span className="text-sm font-black tracking-widest text-amber-400 uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                                            Pausa da Side Quest
                                        </span>
                                        <p className="mt-1 text-xs text-zinc-400">
                                            Insira manualmente o jogo escolhido para o mês de pausa,
                                            pulando a votação.
                                        </p>
                                    </div>

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
                                                        // Load past games if empty
                                                        if (pastIncompleteGames.length === 0) {
                                                            getPastIncompleteGames().then((res) => {
                                                                if (res.success && res.games) {
                                                                    setPastIncompleteGames(res.games);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "rounded-xl border py-3.5 text-xs font-black tracking-widest uppercase transition-all duration-300",
                                                        !specialGameSearchOpen
                                                            ? "border-amber-400/40 bg-amber-400/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
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
                                                            ? "border-amber-400/40 bg-amber-400/20 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
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
                                                                onClick={() => {
                                                                    handleInsertSpecialGame({
                                                                        igdbId: selectedSearchedGame.id,
                                                                        nome: selectedSearchedGame.nome,
                                                                        imageUrl: selectedSearchedGame.imageUrl,
                                                                    });
                                                                    setSelectedSearchedGame(null);
                                                                }}
                                                                disabled={isInsertingSpecial || lockStatus?.locked}
                                                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/20 py-3.5 text-xs font-black tracking-widest text-amber-400 uppercase shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:bg-amber-400/30 disabled:opacity-50"
                                                            >
                                                                {isInsertingSpecial ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Ativando...
                                                                    </>
                                                                ) : (
                                                                    "Confirmar e Ativar Jogo do Mês"
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mt-2 flex flex-col gap-3">
                                                    {pastIncompleteGames.length === 0 ? (
                                                        <button
                                                            onClick={async () => {
                                                                const res = await getPastIncompleteGames();
                                                                if (res.success && res.games) {
                                                                    setPastIncompleteGames(res.games);
                                                                }
                                                            }}
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
                                                                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-950 p-3 text-left text-sm font-bold text-white outline-hidden focus:border-amber-400"
                                                            >
                                                                <span>
                                                                    {selectedPastGameId 
                                                                        ? pastIncompleteGames.find(g => g.id === selectedPastGameId)?.title 
                                                                        : "-- Selecione um Jogo --"}
                                                                </span>
                                                                <span className="ml-2 text-xs text-zinc-500">▼</span>
                                                            </button>

                                                            {isPastDropdownOpen && (
                                                                <>
                                                                    {/* Overlay to close the dropdown on click outside */}
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
                                                                                    selectedPastGameId === game.id && "bg-[#bd0df2]/20 text-[#bd0df2]"
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
                                                                    onClick={() => {
                                                                        const game =
                                                                            pastIncompleteGames.find(
                                                                                (g) =>
                                                                                    g.id ===
                                                                                    selectedPastGameId,
                                                                            );
                                                                        if (game) {
                                                                            handleInsertSpecialGame({
                                                                                id: game.id,
                                                                                igdbId: game.igdb_id,
                                                                                nome: game.title,
                                                                                imageUrl: game.cover_url,
                                                                            });
                                                                        }
                                                                    }}
                                                                    disabled={isInsertingSpecial || lockStatus?.locked}
                                                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/20 py-3.5 text-xs font-black tracking-widest text-amber-400 uppercase shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:bg-amber-400/30 disabled:opacity-50"
                                                                >
                                                                    {isInsertingSpecial ? (
                                                                        <>
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                            Ativando...
                                                                        </>
                                                                    ) : (
                                                                        "Ativar como Jogo do Mês"
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
                            )}
                        </div>

                        {/* Right Column: Randomizer Tool Area */}
                        <div>
                            <div className="glass-card border border-theme bg-theme-card group relative flex min-h-125 flex-col items-center justify-center overflow-hidden rounded-3xl p-8 shadow-2xl backdrop-blur-md lg:p-12">
                                {/* Glow effect */}
                                <div className="absolute -top-24 -right-24 size-64 rounded-full bg-[#bd0df2]/20 blur-[100px]"></div>

                                <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
                                    {/* Display Box */}
                                    <div className="flex w-full flex-col items-center gap-4">
                                        <div className="relative flex min-h-100 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#bd0df2]/30 bg-zinc-950/80 px-4 py-8 shadow-[0_0_40px_rgba(189,13,242,0.15)] backdrop-blur-sm">
                                            <div className="absolute inset-0 bg-linear-to-t from-[#bd0df2]/10 to-transparent opacity-50"></div>

                                            {winner && winner.imageUrl && (
                                                <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
                                                    <Image
                                                        src={winner.imageUrl}
                                                        alt="Winner background"
                                                        fill
                                                        sizes="100vw"
                                                        unoptimized
                                                        className="scale-125 object-cover blur-3xl"
                                                    />
                                                </div>
                                            )}

                                            <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
                                                {isRolling ? (
                                                    <div className="flex flex-col items-center gap-6">
                                                        <Loader2 className="h-12 w-12 animate-spin text-[#bd0df2]" />
                                                        <div className="min-h-20">
                                                            <span className="text-shadow-glow animate-pulse text-4xl font-black tracking-tighter text-white uppercase md:text-5xl">
                                                                {cycleText || "ROLLING..."}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : winner ? (
                                                    <div className="animate-in zoom-in spin-in-2 flex flex-col items-center gap-6 duration-700">
                                                        <div className="relative aspect-3/4 w-48 overflow-hidden rounded-2xl border-2 border-[#bd0df2]/50 shadow-[0_0_40px_rgba(189,13,242,0.6)]">
                                                            <div className="absolute inset-0 bg-[#bd0df2]/20 blur-xl"></div>
                                                            {winner.imageUrl ? (
                                                                <Image
                                                                    src={winner.imageUrl}
                                                                    alt={winner.title}
                                                                    fill
                                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                                    unoptimized
                                                                    className="relative z-10 object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                                                                    <span className="font-bold text-[#bd0df2]/50 uppercase">
                                                                        No Image
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-shadow-glow text-4xl leading-tight font-black tracking-tighter text-white uppercase md:text-5xl">
                                                            {winner.title}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="animate-pulse text-4xl leading-tight font-black tracking-tighter text-[#bd0df2] uppercase opacity-50 md:text-5xl lg:text-5xl">
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
                                        <div className="mx-auto flex flex-col items-center justify-center gap-4 w-full max-w-xl sm:flex-row">
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
                                                    "flex-1 flex items-center justify-center gap-3 rounded-2xl border px-8 py-4 transition-all duration-300 w-full",
                                                    poolIsComplete &&
                                                        !hasUnsavedChanges &&
                                                        !isRolling &&
                                                        !isSaving &&
                                                        poolId
                                                        ? "border-theme-primary/50 bg-theme-primary/20 text-theme-primary shadow-[0_10px_40px_var(--theme-glow)] hover:scale-[1.03] hover:bg-theme-primary/30 active:scale-[0.97]"
                                                        : "cursor-not-allowed border-white/5 bg-zinc-900 text-zinc-600",
                                                )}
                                            >
                                                <Trophy
                                                    className={cn(
                                                        "h-8 w-8",
                                                        isRolling && "animate-spin",
                                                    )}
                                                />
                                                <span className="text-xl font-black tracking-tighter whitespace-nowrap uppercase lg:text-2xl">
                                                    {isRolling ? "Rolling..." : "Roll the Dice"}
                                                </span>
                                            </button>
                                            <button
                                                onClick={handleTestRoll}
                                                disabled={isRolling}
                                                className="flex items-center justify-center gap-2 rounded-2xl border border-theme-primary/30 bg-theme-primary/10 px-6 py-4 text-xs font-black tracking-widest text-theme-primary uppercase transition-all duration-300 hover:border-theme-primary/60 hover:bg-theme-primary/20 hover:scale-[1.03] active:scale-95 w-full sm:w-auto"
                                            >
                                                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                                                <span>Testar Animação 🎲</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FULL-SCREEN THEMED ROLL ANIMATION OVERLAY */}
            {isRolling && (
                <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-2xl">
                    {/* Ambient Particle & Sound Wave Backdrops */}
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/80 to-black" />
                        
                        {/* Theme Specific Ambient Motion Background */}
                        {equippedTheme === "theme-medieval" ? (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_70%)] animate-pulse" />
                        ) : equippedTheme === "theme-space" ? (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25)_0%,transparent_70%)] animate-pulse" />
                        ) : equippedTheme === "theme-pixel" ? (
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_6px] opacity-60" />
                        ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(189,13,242,0.25)_0%,transparent_70%)] animate-pulse" />
                        )}
                    </div>

                    <div className="relative z-10 flex max-w-2xl flex-col items-center justify-center gap-8 text-center">
                        {/* THEMED EMBLEM CONTAINER */}
                        <div className="relative flex h-52 w-52 items-center justify-center perspective-[1000px]">
                            {equippedTheme === "theme-medieval" ? (
                                /* MEDIEVAL FLAMING RUNE EMBLEM */
                                <div className="relative flex h-44 w-44 items-center justify-center rounded-3xl border-4 border-amber-500 bg-gradient-to-br from-amber-950 via-stone-900 to-black p-4 shadow-[0_0_90px_rgba(245,158,11,0.9),inset_0_0_35px_rgba(245,158,11,0.5)] animate-bounce">
                                    <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-amber-400/50 animate-spin" />
                                    <ThemedEmblemIcon theme="theme-medieval" />
                                    <Flame className="absolute -bottom-3 -left-3 h-10 w-10 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
                                </div>
                            ) : equippedTheme === "theme-space" ? (
                                /* SPACE QUANTUM GYROSCOPE EMBLEM */
                                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-sky-400 bg-gradient-to-br from-slate-950 via-sky-950 to-black p-4 shadow-[0_0_90px_rgba(56,189,248,0.9),inset_0_0_35px_rgba(56,189,248,0.5)] animate-pulse">
                                    <div className="absolute inset-0 rounded-full border-2 border-cyan-300/70 animate-spin" />
                                    <div className="absolute inset-2 rounded-full border border-dashed border-amber-400/60 animate-spin" />
                                    <ThemedEmblemIcon theme="theme-space" />
                                </div>
                            ) : equippedTheme === "theme-pixel" ? (
                                /* PIXEL ART 16-BIT RETRO EMBLEM */
                                <div className="relative flex h-44 w-44 items-center justify-center rounded-2xl border-4 border-amber-400 bg-indigo-950 p-4 shadow-[0_0_90px_rgba(34,197,94,0.9),inset_0_0_0_3px_#06b6d4] animate-bounce">
                                    <ThemedEmblemIcon theme="theme-pixel" />
                                </div>
                            ) : (
                                /* CYBERPUNK NEON HOLO EMBLEM */
                                <div className="relative flex h-44 w-44 items-center justify-center rounded-3xl border-4 border-[#bd0df2] border-l-4 border-l-[#06b6d4] bg-gradient-to-br from-purple-950 via-zinc-950 to-black p-4 shadow-[0_0_90px_rgba(189,13,242,0.9),0_0_40px_rgba(6,182,212,0.6)] animate-pulse">
                                    <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/50 animate-spin" />
                                    <ThemedEmblemIcon theme="cyberpunk" />
                                </div>
                            )}
                        </div>

                        {/* STATUS BANNER & SLOT-MACHINE CYCLING TEXT */}
                        <div className="flex w-full flex-col items-center gap-4">
                            <span
                                className={cn(
                                    "text-xs font-black tracking-widest uppercase",
                                    equippedTheme === "theme-medieval"
                                        ? "font-serif text-amber-400"
                                        : equippedTheme === "theme-space"
                                        ? "font-mono text-sky-400"
                                        : equippedTheme === "theme-pixel"
                                        ? "font-mono text-emerald-400"
                                        : "font-mono text-[#bd0df2]",
                                )}
                            >
                                {equippedTheme === "theme-medieval"
                                    ? "⚔️ O Oráculo das Runas está invocando o Destino..."
                                    : equippedTheme === "theme-space"
                                    ? "🛰️ Calculando Trajetória Quântica Estelar..."
                                    : equippedTheme === "theme-pixel"
                                    ? "🕹️ 16-BIT RETRO ROULETTE SPINNING..."
                                    : "👾 NETRUNNER PROTOCOL: EXECUTING HOLO-ROULETTE..."}
                            </span>

                            <div className="glass-card border border-theme bg-theme-card relative w-full overflow-hidden rounded-2xl px-8 py-6 shadow-2xl backdrop-blur-xl">
                                <span
                                    className={cn(
                                        "block truncate text-3xl font-black tracking-wide drop-shadow-lg md:text-4xl lg:text-5xl",
                                        equippedTheme === "theme-medieval"
                                            ? "font-serif text-amber-300"
                                            : equippedTheme === "theme-space"
                                            ? "font-mono text-sky-300 uppercase"
                                            : equippedTheme === "theme-pixel"
                                            ? "font-mono text-emerald-400 uppercase"
                                            : "text-cyan-300 uppercase",
                                    )}
                                >
                                    {cycleText || "SORTEANDO NOME..."}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-widest uppercase">
                                <Loader2 className="text-theme-primary h-4 w-4 animate-spin" />
                                <span>Aguarde o veredito do RNG...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
