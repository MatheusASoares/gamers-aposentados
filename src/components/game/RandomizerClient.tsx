"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { GameSearchResult } from "@/components/ui/game-autocomplete";
import { getRandomizerStatus } from "@/app/lib/quest-actions";
import {
    getOpenPool,
    saveSelections,
    executeRoll,
    GameSelection,
    PoolEntryData,
    getPastIncompleteGames,
} from "@/app/lib/pool-actions";
import {
    proposeSpecialGame,
    getPendingSpecialGameProposals,
    SpecialProposalDTO,
} from "@/app/lib/special-game-actions";
import { HltbAiResponse, HltbAiResult } from "@/types/api";
import { PersonalQuestHub } from "@/components/game/PersonalQuestHub";

import {
    QuestType,
    LocalCandidate,
    ActiveGuildContext,
    WinnerState,
    LockStatus,
} from "./randomizer/types";
import { RandomizerHeader } from "./randomizer/RandomizerHeader";
import { RandomizerNominations } from "./randomizer/RandomizerNominations";
import { RandomizerSpecialGameCard } from "./randomizer/RandomizerSpecialGameCard";
import { RandomizerDisplayBox } from "./randomizer/RandomizerDisplayBox";
import { RandomizerRollOverlay } from "./randomizer/RandomizerRollOverlay";

export type { ActiveGuildContext, QuestType, LocalCandidate };

export function RandomizerClient({
    currentUserId,
    currentUserName,
    currentUserEmail,
    canAddGames,
    isLeader = false,
    otherPlayerName: defaultOtherName,
    activeGuild,
}: {
    currentUserId: string;
    currentUserName: string;
    currentUserEmail: string;
    canAddGames: boolean;
    isLeader?: boolean;
    otherPlayerName?: string;
    activeGuild?: ActiveGuildContext | null;
}) {
    const { data: session } = useSession();
    const equippedTheme = session?.user?.equipped_theme || "cyberpunk";

    const [questType, setQuestType] = useState<QuestType>("SIDE");

    // Pool state
    const [poolId, setPoolId] = useState<string | null>(null);
    const [mySelections, setMySelections] = useState<LocalCandidate[]>([]);
    const [otherSelections, setOtherSelections] = useState<PoolEntryData[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [addingGame, setAddingGame] = useState(false);
    const [savedSnapshot, setSavedSnapshot] = useState<LocalCandidate[]>([]);

    const [lockStatus, setLockStatus] = useState<LockStatus>({ locked: false });

    // Special break state
    const [pastIncompleteGames, setPastIncompleteGames] = useState<
        { id: string; title: string; cover_url: string | null; igdb_id: string | null }[]
    >([]);
    const [isInsertingSpecial, setIsInsertingSpecial] = useState(false);
    const [pendingProposals, setPendingProposals] = useState<SpecialProposalDTO[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [winner, setWinner] = useState<WinnerState>(null);
    const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(
        null,
    );
    const [hltbTimes, setHltbTimes] = useState<Record<string, number | null>>({});
    const [isFetchingHltb, setIsFetchingHltb] = useState(false);
    const [refreshingTitles, setRefreshingTitles] = useState<Set<string>>(new Set());

    const [cycleText, setCycleText] = useState<string>("");
    const cycleIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (cycleIntervalRef.current) {
                clearInterval(cycleIntervalRef.current);
            }
        };
    }, []);

    const isTestUser =
        (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") &&
        currentUserEmail.endsWith("@test.com");
    const activeMemberCount = activeGuild?.activeMembers?.length || 2;
    const requiredTotal = isTestUser
        ? questType === "MAIN"
            ? 4
            : 6
        : (questType === "MAIN" ? 2 : 3) * activeMemberCount;
    const maxPerPerson = isTestUser ? requiredTotal : questType === "MAIN" ? 2 : 3;

    // Determine the "other" user's name from pool entries or from the prop
    const otherUserName =
        otherSelections.length > 0 ? otherSelections[0].userName : defaultOtherName;

    const loadPool = useCallback(
        async (type: QuestType, silent: boolean = false) => {
            if (!silent) setIsLoading(true);
            try {
                const pool = await getOpenPool(type, activeGuild?.id);
                if (pool) {
                    setPoolId(pool.poolId);

                    const mine = pool.entries
                        .filter((e) => e.userId === currentUserId)
                        .map((e) => ({
                            id: e.gameIgdbId,
                            nome: e.gameTitle,
                            imageUrl: e.gameImageUrl,
                            nominator: e.userName,
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

                    // Check for winner
                    if (pool.winnerId && pool.winnerTitle) {
                        setWinner({
                            title: pool.winnerTitle,
                            imageUrl: pool.winnerImageUrl,
                        });
                    } else {
                        setWinner(null);
                    }
                } else {
                    setPoolId(null);
                    setMySelections([]);
                    setSavedSnapshot([]);
                    setOtherSelections([]);
                    setWinner(null);
                }

                // Check lock status
                const status = await getRandomizerStatus(
                    type === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST",
                    activeGuild?.id,
                );
                setLockStatus(status);

                // Fetch active pause pending proposals
                const proposals = await getPendingSpecialGameProposals(type);
                setPendingProposals(proposals);
            } catch (err) {
                console.error("Error loading pool:", err);
            } finally {
                if (!silent) setIsLoading(false);
            }
        },
        [currentUserId, activeGuild?.id],
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
                const aiData: HltbAiResponse = await aiRes.json();
                setHltbTimes((prev) => {
                    const next = { ...prev };
                    aiData.results.forEach((r: HltbAiResult) => {
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

    const fetchPastIncompleteGames = async () => {
        const res = await getPastIncompleteGames();
        if (res.success && res.games) {
            setPastIncompleteGames(res.games);
        }
    };

    // Load initial data on mount and on questType change
    useEffect(() => {
        setIsEditing(false);
        setSaveStatus(null);
        loadPool(questType);

        fetchPastIncompleteGames();

        getPendingSpecialGameProposals(questType).then((proposals) => {
            setPendingProposals(proposals);
        });
    }, [questType, loadPool]);

    const handleInsertSpecialGame = async (gameToInsert: {
        id?: string;
        igdbId?: string | null;
        nome: string;
        imageUrl?: string | null;
    }): Promise<boolean> => {
        setIsInsertingSpecial(true);
        setSaveStatus(null);
        try {
            const res = await proposeSpecialGame(questType, gameToInsert);
            if (res.success) {
                setSaveStatus({
                    success: true,
                    message:
                        res.message ||
                        `Proposta de Pausa Ativa enviada para "${gameToInsert.nome}". Aguardando confirmação do outro jogador.`,
                });
                const proposals = await getPendingSpecialGameProposals(questType);
                setPendingProposals(proposals);
                return true;
            } else {
                setSaveStatus({
                    success: false,
                    message: res.error || "Erro ao propor jogo especial.",
                });
                return false;
            }
        } catch (err) {
            console.error("Error proposing special game:", err);
            setSaveStatus({ success: false, message: "Erro de conexão ao servidor." });
            return false;
        } finally {
            setIsInsertingSpecial(false);
        }
    };

    // --- Core Computed States ---
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
        if (poolIsComplete || isRolling || hasUnsavedChanges || addingGame || isSaving || winner) {
            return;
        }

        const intervalId = setInterval(() => {
            loadPool(questType, true);
        }, 15000);

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

            const response = await saveSelections(questType, games, activeGuild?.id);

            if (response.success) {
                setIsEditing(false);
                await loadPool(questType);

                const titlesNeedingHltb = games
                    .map((g) => g.nome)
                    .filter((nome) => hltbTimes[nome] === undefined || hltbTimes[nome] === null);

                if (titlesNeedingHltb.length > 0) {
                    setSaveStatus({
                        success: true,
                        message: "Seleções salvas! Consultando HLTB...",
                    });
                    setIsFetchingHltb(true);
                    try {
                        const aiRes = await fetch("/api/ai/hltb", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ titles: titlesNeedingHltb }),
                        });

                        if (aiRes.ok) {
                            const aiData: HltbAiResponse = await aiRes.json();
                            setHltbTimes((prev) => {
                                const next = { ...prev };
                                aiData.results.forEach((r: HltbAiResult) => {
                                    next[r.title] = r.mainStory || null;
                                });
                                return next;
                            });
                            setSaveStatus({
                                success: true,
                                message: "Seleções salvas com sucesso!",
                            });
                        } else {
                            setSaveStatus({
                                success: true,
                                message: "Seleções salvas (Falha no HLTB)",
                            });
                        }
                    } catch (err) {
                        console.error("AI fetch failed", err);
                        setSaveStatus({
                            success: true,
                            message: "Seleções salvas (Erro no HLTB)",
                        });
                    } finally {
                        setIsFetchingHltb(false);
                    }
                } else {
                    setSaveStatus({
                        success: true,
                        message: "Seleções salvas com sucesso!",
                    });
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

    const handleRoll = async (forceEmergency: boolean = false) => {
        if (!poolId || isRolling || isSaving || lockStatus.locked || winner) return;

        const count = mySelections.length + otherSelections.length;
        if (!forceEmergency && count < requiredTotal) return;
        if (forceEmergency && count < 1) return;

        if (forceEmergency) {
            if (
                !confirm(
                    `⚡ ATENÇÃO (LÍDER): Deseja sortear antecipadamente entre as ${count} indicações dos membros presentes?`,
                )
            )
                return;
        }

        setIsRolling(true);
        setWinner(null);
        setSaveStatus(null);

        try {
            const allCandidates = [
                ...mySelections.map((c) => c.nome),
                ...otherSelections.map((c) => c.gameTitle),
            ];

            if (allCandidates.length > 0) {
                let currentIndex = 0;
                cycleIntervalRef.current = setInterval(() => {
                    setCycleText(allCandidates[currentIndex]);
                    currentIndex = (currentIndex + 1) % allCandidates.length;
                }, 100);
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));

            if (cycleIntervalRef.current) {
                clearInterval(cycleIntervalRef.current);
                cycleIntervalRef.current = null;
            }

            const response = await executeRoll(poolId, { forceEmergency });

            if (response.success) {
                const result = response as {
                    success: true;
                    winnerId: string;
                    winnerTitle: string;
                    winnerImageUrl: string | null;
                };
                const cinematicImg =
                    result.winnerImageUrl?.replace("t_cover_big", "t_1080p") || null;
                setWinner({
                    title: result.winnerTitle,
                    imageUrl: cinematicImg,
                });
                setSaveStatus({ success: true, message: "Resultado salvo no Cofre da Guilda!" });
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

    if (!canAddGames) {
        return (
            <PersonalQuestHub
                currentUserId={currentUserId}
                currentUserName={currentUserName}
            />
        );
    }

    return (
        <div className="relative mx-auto min-h-screen w-full px-2 sm:px-6 py-4 sm:py-8">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 flex w-full flex-col gap-6 sm:gap-8">
                {/* Header Area */}
                <RandomizerHeader
                    questType={questType}
                    onQuestTypeChange={(t) => setQuestType(t)}
                    saveStatus={saveStatus}
                />

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="text-primary h-10 w-10 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
                        {/* Left Column: Candidates Pool & Special Break */}
                        <div className="flex flex-col gap-6">
                            <RandomizerNominations
                                activeGuild={activeGuild}
                                currentUserId={currentUserId}
                                currentUserName={currentUserName}
                                otherUserName={otherUserName}
                                maxPerPerson={maxPerPerson}
                                totalGames={totalGames}
                                requiredTotal={requiredTotal}
                                mySelections={mySelections}
                                otherSelections={otherSelections}
                                canAddGames={canAddGames}
                                winner={winner}
                                isEditing={isEditing}
                                addingGame={addingGame}
                                isSaving={isSaving}
                                isFetchingHltb={isFetchingHltb}
                                refreshingTitles={refreshingTitles}
                                hltbTimes={hltbTimes}
                                mySelectionsAreSaved={mySelectionsAreSaved}
                                savedSnapshot={savedSnapshot}
                                onStartEditing={handleStartEditing}
                                onCancelEditing={handleCancelEditing}
                                onAddGame={handleAddGame}
                                onRemoveGame={handleRemoveGame}
                                onSaveSelections={handleSaveSelections}
                                onRefreshHltb={handleRefreshHltb}
                                setAddingGame={setAddingGame}
                                setIsEditing={setIsEditing}
                            />

                            <RandomizerSpecialGameCard
                                questType={questType}
                                pendingProposals={pendingProposals}
                                currentUserId={currentUserId}
                                currentUserEmail={currentUserEmail}
                                lockStatus={lockStatus}
                                pastIncompleteGames={pastIncompleteGames}
                                onFetchPastGames={fetchPastIncompleteGames}
                                onInsertSpecialGame={handleInsertSpecialGame}
                                isInsertingSpecial={isInsertingSpecial}
                            />
                        </div>

                        {/* Right Column: Randomizer Tool Area */}
                        <RandomizerDisplayBox
                            winner={winner}
                            isRolling={isRolling}
                            cycleText={cycleText}
                            poolIsComplete={poolIsComplete}
                            hasUnsavedChanges={hasUnsavedChanges}
                            lockStatus={lockStatus}
                            isSaving={isSaving}
                            poolId={poolId}
                            isLeader={isLeader}
                            totalGames={totalGames}
                            requiredTotal={requiredTotal}
                            onClearBoard={handleClearBoard}
                            onRoll={handleRoll}
                            onTestRoll={handleTestRoll}
                        />
                    </div>
                )}
            </div>

            {/* Themed Full-screen Roll Animation Overlay */}
            <RandomizerRollOverlay
                isRolling={isRolling}
                equippedTheme={equippedTheme}
                cycleText={cycleText}
            />
        </div>
    );
}
