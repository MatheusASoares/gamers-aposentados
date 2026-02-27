"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2, Trophy, History } from "lucide-react";
import { GameSearchResult } from "@/components/ui/game-autocomplete";
import { GameAutocomplete } from "@/components/ui/game-autocomplete";
import { saveRandomizerRoll } from "@/app/lib/randomizer-actions";
import { getRandomizerStatus } from "@/app/lib/quest-actions";
import { cn } from "@/lib/utils";

type QuestType = "MAIN" | "SIDE";

interface Candidate extends GameSearchResult {
    nominator: string;
}

export function RandomizerClient() {
    const [questType, setQuestType] = useState<QuestType>("SIDE");

    const [lucasCandidates, setLucasCandidates] = useState<Candidate[]>([]);
    const [matheusCandidates, setMatheusCandidates] = useState<Candidate[]>([]);
    const [addingTo, setAddingTo] = useState<"Lucas" | "Matheus" | null>(null);
    const [lockStatus, setLockStatus] = useState<{ locked: boolean; message?: string }>({
        locked: false,
    });

    const [isRolling, setIsRolling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [winner, setWinner] = useState<Candidate | null>(null);
    const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(
        null,
    );

    const maxPerPerson = questType === "MAIN" ? 2 : 3;

    useEffect(() => {
        // Clear candidates when switching types
        setLucasCandidates([]);
        setMatheusCandidates([]);
        setWinner(null);
        setSaveStatus(null);

        // Fetch lock status
        getRandomizerStatus(questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST").then((res) => {
            setLockStatus(res as any);
        });
    }, [questType]);

    const handleAddGame = (game: GameSearchResult) => {
        if (!addingTo) return;

        if (addingTo === "Lucas") {
            setLucasCandidates((prev) =>
                prev.find((c) => c.id === game.id)
                    ? prev
                    : [...prev, { ...game, nominator: "Lucas" }],
            );
        } else {
            setMatheusCandidates((prev) =>
                prev.find((c) => c.id === game.id)
                    ? prev
                    : [...prev, { ...game, nominator: "Matheus" }],
            );
        }

        setAddingTo(null);
    };

    const handleQuestTypeChange = (type: QuestType) => {
        setQuestType(type);
    };

    // Very basic rolling animation
    const handleRoll = async () => {
        const allCandidates = [...lucasCandidates, ...matheusCandidates];
        if (
            allCandidates.length !== maxPerPerson * 2 ||
            isRolling ||
            isSaving ||
            lockStatus.locked ||
            winner
        )
            return;

        setIsRolling(true);
        setWinner(null);
        setSaveStatus(null);

        // Simulating the dice roll time
        setTimeout(async () => {
            const randomIndex = Math.floor(Math.random() * allCandidates.length);
            const luckyWinner = allCandidates[randomIndex];
            setWinner(luckyWinner);
            setIsRolling(false);

            // Now save to database
            setIsSaving(true);
            try {
                const response = await saveRandomizerRoll({
                    questType,
                    candidates: allCandidates.map((c) => ({
                        id: c.id,
                        nome: c.nome,
                        imageUrl: c.imageUrl,
                        nominator: c.nominator,
                    })),
                    winnerId: luckyWinner.id,
                });

                if (response.success) {
                    setSaveStatus({ success: true, message: "Resultado salvo no Cofre!" });
                } else {
                    setSaveStatus({ success: false, message: response.error || "Erro ao salvar." });
                }
            } catch (err) {
                console.error(err);
                setSaveStatus({ success: false, message: "Erro fatal ao conectar ao servidor." });
            } finally {
                setIsSaving(false);
            }
        }, 3000); // 3 seconds roll
    };

    return (
        <div className="flex w-full flex-col gap-8">
            {/* Header Area extracted from stitch HTML */}
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

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
                {/* Left Column: Candidates Pool */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold tracking-widest text-white/80 uppercase">
                            Candidates Pool
                        </h3>
                        <span className="text-primary text-sm font-bold">
                            {lucasCandidates.length + matheusCandidates.length}/{maxPerPerson * 2}{" "}
                            SELECTED
                        </span>
                    </div>

                    {/* Lucas's Choices */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                                Lucas's Choices
                            </span>
                            <span className="text-sm text-zinc-500">
                                {lucasCandidates.length}/{maxPerPerson}
                            </span>
                        </div>
                        {lucasCandidates.map((c) => (
                            <div
                                key={c.id}
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
                                <button
                                    onClick={() =>
                                        !winner &&
                                        setLucasCandidates((prev) =>
                                            prev.filter((cand) => cand.id !== c.id),
                                        )
                                    }
                                    className={cn(
                                        "p-2 text-zinc-500 hover:text-red-400",
                                        winner && "cursor-not-allowed opacity-20",
                                    )}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                        {lucasCandidates.length < maxPerPerson &&
                            !winner &&
                            (addingTo === "Lucas" ? (
                                <div className="mt-3">
                                    <GameAutocomplete
                                        onSelect={handleAddGame}
                                        onCancel={() => setAddingTo(null)}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingTo("Lucas")}
                                    className="w-full rounded-xl border border-dashed border-white/10 py-4 text-sm font-bold text-white/40 transition-all hover:border-white/30 hover:text-white/80"
                                >
                                    + ADD GAME
                                </button>
                            ))}
                    </div>

                    {/* Matheus's Choices */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
                                Matheus's Choices
                            </span>
                            <span className="text-sm text-zinc-500">
                                {matheusCandidates.length}/{maxPerPerson}
                            </span>
                        </div>
                        {matheusCandidates.map((c) => (
                            <div
                                key={c.id}
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
                                <button
                                    onClick={() =>
                                        !winner &&
                                        setMatheusCandidates((prev) =>
                                            prev.filter((cand) => cand.id !== c.id),
                                        )
                                    }
                                    className={cn(
                                        "p-2 text-zinc-500 hover:text-red-400",
                                        winner && "cursor-not-allowed opacity-20",
                                    )}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                        {matheusCandidates.length < maxPerPerson &&
                            !winner &&
                            (addingTo === "Matheus" ? (
                                <div className="mt-3">
                                    <GameAutocomplete
                                        onSelect={handleAddGame}
                                        onCancel={() => setAddingTo(null)}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingTo("Matheus")}
                                    className="w-full rounded-xl border border-dashed border-white/10 py-4 text-sm font-bold text-white/40 transition-all hover:border-white/30 hover:text-white/80"
                                >
                                    + ADD GAME
                                </button>
                            ))}
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
                                                            alt={winner.nome}
                                                            className="border-primary relative z-10 h-56 w-40 rounded-2xl border-2 object-cover shadow-[0_0_40px_rgba(189,13,242,0.6)]"
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-shadow-glow text-4xl leading-tight font-black tracking-tighter text-white uppercase md:text-6xl">
                                                    {winner.nome}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-primary text-4xl leading-tight font-black tracking-tighter uppercase opacity-50 md:text-5xl lg:text-6xl">
                                                {lucasCandidates.length === maxPerPerson &&
                                                matheusCandidates.length === maxPerPerson
                                                    ? "READY TO SPIN"
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
                                    onClick={() => {
                                        setLucasCandidates([]);
                                        setMatheusCandidates([]);
                                        setWinner(null);
                                        setSaveStatus(null);
                                    }}
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
                                        lucasCandidates.length < maxPerPerson ||
                                        matheusCandidates.length < maxPerPerson ||
                                        isRolling ||
                                        isSaving
                                    }
                                    className={cn(
                                        "mx-auto flex w-full max-w-sm items-center justify-center gap-4 rounded-2xl px-12 py-5 transition-all",
                                        lucasCandidates.length === maxPerPerson &&
                                            matheusCandidates.length === maxPerPerson &&
                                            !isRolling &&
                                            !isSaving &&
                                            !winner
                                            ? "bg-primary text-white shadow-[0_10px_40px_rgba(189,13,242,0.4)] hover:scale-105 active:scale-95"
                                            : "cursor-not-allowed bg-zinc-800 text-zinc-500",
                                    )}
                                >
                                    <Trophy
                                        className={cn(
                                            "h-10 w-10",
                                            (isRolling || isSaving) && "animate-spin",
                                        )}
                                    />
                                    <span className="text-3xl font-black tracking-tighter uppercase">
                                        {isSaving ? "Saving..." : "Roll the Dice"}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
