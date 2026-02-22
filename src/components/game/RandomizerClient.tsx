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
    const [lockStatus, setLockStatus] = useState<{ locked: boolean; message?: string }>({ locked: false });

    const [isRolling, setIsRolling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [winner, setWinner] = useState<Candidate | null>(null);
    const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);

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
            setLucasCandidates(prev => prev.find(c => c.id === game.id) ? prev : [...prev, { ...game, nominator: "Lucas" }]);
        } else {
            setMatheusCandidates(prev => prev.find(c => c.id === game.id) ? prev : [...prev, { ...game, nominator: "Matheus" }]);
        }

        setAddingTo(null);
    };

    const handleQuestTypeChange = (type: QuestType) => {
        setQuestType(type);
    };

    // Very basic rolling animation
    const handleRoll = async () => {
        const allCandidates = [...lucasCandidates, ...matheusCandidates];
        if (allCandidates.length !== (maxPerPerson * 2) || isRolling || isSaving || lockStatus.locked) return;

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
                    candidates: allCandidates.map(c => ({
                        id: c.id,
                        nome: c.nome,
                        imageUrl: c.imageUrl,
                        nominator: c.nominator
                    })),
                    winnerId: luckyWinner.id
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
        <div className="w-full flex flex-col gap-8">
            {/* Header Area extracted from stitch HTML */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-white text-4xl lg:text-5xl font-black tracking-tight mb-2">THE GREAT RANDOMIZER</h1>
                    <p className="text-white/60 italic text-lg">May the RNG be in your favor, Commander.</p>
                </div>
                <div className="inline-flex p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                    <button
                        onClick={() => handleQuestTypeChange("MAIN")}
                        className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            questType === "MAIN"
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-white/50 hover:text-white"
                        )}
                    >
                        Main Quest <span className={cn("font-normal ml-1", questType === "MAIN" ? "text-white/60" : "text-white/40")}>(3m)</span>
                    </button>
                    <button
                        onClick={() => handleQuestTypeChange("SIDE")}
                        className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            questType === "SIDE"
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-white/50 hover:text-white"
                        )}
                    >
                        Side Quest <span className={cn("font-normal ml-1", questType === "SIDE" ? "text-white/60" : "text-white/40")}>(1m)</span>
                    </button>
                </div>
            </div>

            {/* Alert Notification */}
            {saveStatus && (
                <div className={cn(
                    "px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border",
                    saveStatus.success
                        ? "bg-primary/10 border-primary/50 text-white"
                        : "bg-red-500/10 border-red-500/50 text-red-400"
                )}>
                    <Trophy className={cn("h-5 w-5", saveStatus.success ? "text-primary" : "text-red-400")} />
                    <p className="font-bold text-sm">
                        {saveStatus.message}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Candidates Pool */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white/80 font-bold uppercase tracking-widest text-xs">Candidates Pool</h3>
                        <span className="text-primary text-xs font-bold">{lucasCandidates.length + matheusCandidates.length}/{maxPerPerson * 2} SELECTED</span>
                    </div>

                    {/* Lucas's Choices */}
                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Lucas's Choices</span>
                            <span className="text-zinc-500 text-xs">{lucasCandidates.length}/{maxPerPerson}</span>
                        </div>
                        {lucasCandidates.map(c => (
                            <div key={c.id} className="group relative bg-zinc-800/80 rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all flex items-center p-2">
                                <div className="size-10 rounded-lg bg-zinc-700 shrink-0 overflow-hidden mr-3">
                                    {c.imageUrl && <img src={c.imageUrl} alt={c.nome} className="w-full h-full object-cover" />}
                                </div>
                                <h4 className="text-white font-bold text-xs truncate flex-1">{c.nome}</h4>
                                <button onClick={() => setLucasCandidates(prev => prev.filter(cand => cand.id !== c.id))} className="text-zinc-500 hover:text-red-400 p-2">x</button>
                            </div>
                        ))}
                        {lucasCandidates.length < maxPerPerson && (addingTo === "Lucas" ? (
                            <div className="mt-2"><GameAutocomplete onSelect={handleAddGame} onCancel={() => setAddingTo(null)} /></div>
                        ) : (
                            <button onClick={() => setAddingTo("Lucas")} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/30 text-xs font-bold hover:text-white/60 hover:border-white/20 transition-all">
                                + ADD GAME
                            </button>
                        ))}
                    </div>

                    {/* Matheus's Choices */}
                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Matheus's Choices</span>
                            <span className="text-zinc-500 text-xs">{matheusCandidates.length}/{maxPerPerson}</span>
                        </div>
                        {matheusCandidates.map(c => (
                            <div key={c.id} className="group relative bg-zinc-800/80 rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all flex items-center p-2">
                                <div className="size-10 rounded-lg bg-zinc-700 shrink-0 overflow-hidden mr-3">
                                    {c.imageUrl && <img src={c.imageUrl} alt={c.nome} className="w-full h-full object-cover" />}
                                </div>
                                <h4 className="text-white font-bold text-xs truncate flex-1">{c.nome}</h4>
                                <button onClick={() => setMatheusCandidates(prev => prev.filter(cand => cand.id !== c.id))} className="text-zinc-500 hover:text-red-400 p-2">x</button>
                            </div>
                        ))}
                        {matheusCandidates.length < maxPerPerson && (addingTo === "Matheus" ? (
                            <div className="mt-2"><GameAutocomplete onSelect={handleAddGame} onCancel={() => setAddingTo(null)} /></div>
                        ) : (
                            <button onClick={() => setAddingTo("Matheus")} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-white/30 text-xs font-bold hover:text-white/60 hover:border-white/20 transition-all">
                                + ADD GAME
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Randomizer Tool Area */}
                <div className="lg:col-span-8">
                    <div className="bg-zinc-900/30 rounded-3xl border border-white/10 p-8 lg:p-12 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden group">

                        {/* Glow effect */}
                        <div className="absolute -top-24 -right-24 size-64 bg-primary/20 blur-[100px] rounded-full"></div>

                        <div className="relative w-full max-w-lg flex flex-col items-center gap-8 z-10">

                            {/* Display Box */}
                            <div className="w-full flex flex-col items-center gap-4">
                                <div className="w-full py-10 px-6 bg-zinc-950/80 border-2 border-primary rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(189,13,242,0.2)]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
                                    <div className="relative z-10 min-h-16 flex items-center justify-center overflow-hidden w-full text-center">
                                        {isRolling ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                <span className="text-primary font-black text-3xl tracking-tighter uppercase animate-pulse">ROLLING...</span>
                                            </div>
                                        ) : winner ? (
                                            <div className="flex flex-col items-center gap-4 animate-in zoom-in spin-in-2duration-500">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                                    {winner.imageUrl && (
                                                        <img src={winner.imageUrl} alt={winner.nome} className="w-32 h-40 object-cover rounded-xl border-2 border-primary shadow-[0_0_30px_rgba(189,13,242,0.5)] relative z-10" />
                                                    )}
                                                </div>
                                                <span className="text-white font-black text-3xl md:text-5xl tracking-tighter uppercase leading-tight text-shadow-glow">
                                                    {winner.nome}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-primary font-black text-3xl md:text-5xl lg:text-6xl tracking-tighter uppercase leading-tight opacity-50">
                                                {(lucasCandidates.length === maxPerPerson && matheusCandidates.length === maxPerPerson) ? "READY TO SPIN" : "ADD GAMES FIRST"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Roll Button */}
                            {lockStatus.locked ? (
                                <div className="px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center max-w-sm w-full mx-auto">
                                    <p className="text-red-400 font-bold text-sm leading-relaxed uppercase tracking-wide">
                                        ❌ SORTEIO BLOQUEADO
                                    </p>
                                    <p className="text-red-300/80 text-xs mt-1">
                                        {lockStatus.message}
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRoll}
                                    disabled={lucasCandidates.length < maxPerPerson || matheusCandidates.length < maxPerPerson || isRolling || isSaving}
                                    className={cn(
                                        "px-12 py-5 rounded-2xl flex items-center justify-center gap-4 transition-all w-full max-w-sm mx-auto",
                                        (lucasCandidates.length === maxPerPerson && matheusCandidates.length === maxPerPerson) && !isRolling && !isSaving
                                            ? "bg-primary text-white hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(189,13,242,0.4)]"
                                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    )}
                                >
                                    <Trophy className={cn("h-8 w-8", (isRolling || isSaving) && "animate-spin")} />
                                    <span className="text-2xl font-black tracking-tighter uppercase">
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
