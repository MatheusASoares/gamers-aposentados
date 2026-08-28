"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Sparkles,
    Dices,
    Plus,
    Trash2,
    CheckCircle2,
    ArrowRight,
    ShieldAlert,
    Compass,
    Swords,
    Lock,
    XCircle,
    Scroll,
    Loader2,
} from "lucide-react";
import { GameAutocomplete, GameSearchResult } from "@/components/ui/game-autocomplete";
import {
    setPersonalActiveQuest,
    rollPersonalQuest,
    getUserPersonalActiveQuests,
    type ActiveQuestDTO,
} from "@/app/lib/personal-quest-actions";
import { completeQuest, dropQuest } from "@/app/lib/quest-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

type QuestType = "MAIN" | "SIDE";

interface PersonalQuestHubProps {
    currentUserId: string;
    currentUserName: string;
}

export function PersonalQuestHub({ currentUserId, currentUserName }: PersonalQuestHubProps) {
    const router = useRouter();
    const { data: session } = useSession();

    const [questType, setQuestType] = useState<QuestType>("MAIN");
    const [mode, setMode] = useState<"DIRECT" | "ROULETTE">("DIRECT");

    // Quests Ativas do Usuário
    const [activeQuests, setActiveQuests] = useState<{
        activeMain: ActiveQuestDTO | null;
        activeSide: ActiveQuestDTO | null;
    }>({ activeMain: null, activeSide: null });
    const [isLoadingActive, setIsLoadingActive] = useState(true);

    // Seleção direta
    const [directGame, setDirectGame] = useState<GameSearchResult | null>(null);
    const [isActivatingDirect, setIsActivatingDirect] = useState(false);

    // Roleta Solo
    const [soloCandidates, setSoloCandidates] = useState<GameSearchResult[]>([]);
    const [isRolling, setIsRolling] = useState(false);
    const [winner, setWinner] = useState<GameSearchResult | null>(null);

    // Modal de Drop / Abandono
    const [isDropModalOpen, setIsDropModalOpen] = useState(false);
    const [isDropping, setIsDropping] = useState(false);

    // Feedback
    const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

    // Carregar quests ativas
    const reloadActiveQuests = async () => {
        setIsLoadingActive(true);
        try {
            const data = await getUserPersonalActiveQuests(currentUserId);
            setActiveQuests(data);
        } catch (err) {
            console.error("Erro ao carregar quests ativas:", err);
        } finally {
            setIsLoadingActive(false);
        }
    };

    useEffect(() => {
        reloadActiveQuests();
    }, [currentUserId]);

    const activeQuest = questType === "MAIN" ? activeQuests.activeMain : activeQuests.activeSide;

    const handleSelectDirectGame = (game: GameSearchResult) => {
        setDirectGame(game);
        setFeedback(null);
    };

    const handleAddSoloCandidate = (game: GameSearchResult) => {
        if (soloCandidates.length >= 4) {
            setFeedback({ success: false, message: "Máximo de 4 jogos no sorteio solo." });
            return;
        }
        if (soloCandidates.some((c) => c.nome.toLowerCase() === game.nome.toLowerCase())) {
            setFeedback({ success: false, message: "Este jogo já está na sua lista de sorteio." });
            return;
        }
        setSoloCandidates((prev) => [...prev, game]);
        setFeedback(null);
    };

    const handleRemoveSoloCandidate = (index: number) => {
        setSoloCandidates((prev) => prev.filter((_, i) => i !== index));
    };

    const handleActivateDirect = async () => {
        if (!directGame) return;
        setIsActivatingDirect(true);
        setFeedback(null);

        try {
            const res = await setPersonalActiveQuest({
                title: directGame.nome,
                igdb_id: directGame.id ? String(directGame.id) : undefined,
                cover_url: directGame.imageUrl,
                quest_type: questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST",
            });

            if (res.success) {
                setFeedback({
                    success: true,
                    message: `"${directGame.nome}" agora é sua ${questType === "MAIN" ? "Main Quest" : "Side Quest"} ativa!`,
                });
                setDirectGame(null);
                await reloadActiveQuests();
                router.refresh();
            } else {
                const errMsg = "error" in res && typeof res.error === "string" ? res.error : "Falha ao ativar quest.";
                setFeedback({ success: false, message: errMsg });
            }
        } catch {
            setFeedback({ success: false, message: "Erro inesperado ao ativar quest." });
        } finally {
            setIsActivatingDirect(false);
        }
    };

    const handleRollSolo = async () => {
        if (soloCandidates.length < 2) {
            setFeedback({ success: false, message: "Adicione pelo menos 2 jogos para sortear." });
            return;
        }

        setIsRolling(true);
        setFeedback(null);
        setWinner(null);

        // Animação de roleta
        let counter = 0;
        const totalSpins = 20;
        const interval = setInterval(() => {
            const randomPick = soloCandidates[Math.floor(Math.random() * soloCandidates.length)];
            setWinner(randomPick);
            counter++;

            if (counter >= totalSpins) {
                clearInterval(interval);
                finalizeRoll();
            }
        }, 120);

        const finalizeRoll = async () => {
            const candidatesPayload = soloCandidates.map((c) => ({
                title: c.nome,
                igdb_id: c.id ? String(c.id) : undefined,
                cover_url: c.imageUrl,
                quest_type: questType === "MAIN" ? ("MAIN_QUEST" as const) : ("SIDE_QUEST" as const),
            }));

            try {
                const res = await rollPersonalQuest(
                    candidatesPayload,
                    questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST"
                );

                if (res.success && "game" in res && res.game) {
                    const winGame = res.game;
                    setWinner({
                        id: winGame.igdb_id || winGame.id,
                        nome: winGame.title,
                        imageUrl: winGame.cover_url || "/placeholder-game.jpg",
                    });
                    setFeedback({
                        success: true,
                        message: `🎲 Sorteado! "${winGame.title}" foi definido como sua quest ativa!`,
                    });
                    setSoloCandidates([]);
                    await reloadActiveQuests();
                    router.refresh();
                } else {
                    const errMsg = "error" in res && typeof res.error === "string" ? res.error : "Falha no sorteio.";
                    setFeedback({ success: false, message: errMsg });
                }
            } catch {
                setFeedback({ success: false, message: "Erro inesperado ao sortear." });
            } finally {
                setIsRolling(false);
            }
        };
    };

    const handleCompleteCurrentQuest = async () => {
        if (!activeQuest) return;
        try {
            const res = await completeQuest(activeQuest.gameId);
            if (res.success) {
                setFeedback({ success: true, message: `🏆 Parabéns! "${activeQuest.title}" foi marcado como Concluído!` });
                await reloadActiveQuests();
                router.refresh();
            } else {
                setFeedback({ success: false, message: res.error || "Erro ao concluir quest." });
            }
        } catch {
            setFeedback({ success: false, message: "Erro inesperado ao concluir quest." });
        }
    };

    const handleConfirmDrop = async () => {
        if (!activeQuest) return;
        setIsDropping(true);
        try {
            const res = await dropQuest(activeQuest.gameId);
            if (res.success) {
                setFeedback({
                    success: true,
                    message: `"${activeQuest.title}" foi abandonado. O slot está livre para uma nova quest.`,
                });
                setIsDropModalOpen(false);
                await reloadActiveQuests();
                router.refresh();
            } else {
                setFeedback({ success: false, message: res.error || "Erro ao dropar quest." });
            }
        } catch {
            setFeedback({ success: false, message: "Erro inesperado ao dropar quest." });
        } finally {
            setIsDropping(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1920px] mx-auto">
            {/* Header com Estética Cyberpunk */}
            <div className="relative overflow-hidden rounded-2xl border border-theme/40 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#bd0df2]/15 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                            <span className="rounded-md border border-[#bd0df2]/50 bg-[#bd0df2]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#bd0df2]">
                                Hub de Quests Pessoais
                            </span>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                • Jogador: {currentUserName}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
                            {activeQuest ? "Quest Ativa em Andamento" : "Escolha sua Próxima Aventura"}
                        </h1>
                        <p className="text-xs sm:text-base text-zinc-400 max-w-2xl font-medium">
                            {activeQuest
                                ? `Você possui uma ${questType === "MAIN" ? "Main Quest" : "Side Quest"} ativa. Conclua ou drope a quest atual para liberar este slot.`
                                : "Selecione o jogo que você está jogando ou monte um sorteio solo para vencer a paralisia do backlog. Ganhe XP, avance nos contratos e conquiste troféus!"}
                        </p>
                    </div>

                    {/* Switcher Main Quest vs Side Quest (Dual-Paradigm 2x1) */}
                    <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/90 p-1.5 shadow-inner shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setQuestType("MAIN");
                                setFeedback(null);
                            }}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all min-h-[44px]",
                                questType === "MAIN"
                                    ? "border border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                                    : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            <Swords className="h-4 w-4" />
                            Main Quest {activeQuests.activeMain && <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setQuestType("SIDE");
                                setFeedback(null);
                            }}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all min-h-[44px]",
                                questType === "SIDE"
                                    ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                                    : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            <Compass className="h-4 w-4" />
                            Side Quest {activeQuests.activeSide && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
                        </button>
                    </div>
                </div>

                {/* Sub-abas apenas quando o slot NÃO estiver ocupado */}
                {!activeQuest && (
                    <div className="mt-6 flex gap-3 border-t border-zinc-800/80 pt-6">
                        <button
                            type="button"
                            onClick={() => setMode("DIRECT")}
                            className={cn(
                                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all min-h-[44px]",
                                mode === "DIRECT"
                                    ? "border border-[#bd0df2] bg-[#bd0df2]/20 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.3)]"
                                    : "border border-transparent text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Sparkles className="h-4 w-4" />
                            Seleção Direta (1 Clique)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("ROULETTE")}
                            className={cn(
                                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all min-h-[44px]",
                                mode === "ROULETTE"
                                    ? "border border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                    : "border border-transparent text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Dices className="h-4 w-4" />
                            Roleta de Sorteio Solo
                        </button>
                    </div>
                )}
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div
                    className={cn(
                        "flex items-center justify-between rounded-xl border p-4 backdrop-blur-md animate-fade-in",
                        feedback.success
                            ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "border-red-500/60 bg-red-950/30 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {feedback.success ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        ) : (
                            <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
                        )}
                        <span className="text-xs sm:text-sm font-bold">{feedback.message}</span>
                    </div>

                    {feedback.success && (
                        <Link
                            href="/"
                            className="flex items-center gap-2 rounded-lg bg-emerald-600/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200 hover:bg-emerald-600/50 transition-colors"
                        >
                            Ir para o Hub
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>
            )}

            {/* CASO 1: Slot Bloqueado por Quest Ativa */}
            {activeQuest ? (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8 backdrop-blur-xl">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5 min-w-0">
                            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                                <Image
                                    src={activeQuest.coverUrl || "/placeholder-game.jpg"}
                                    alt={activeQuest.title}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                                <div className="absolute top-1.5 left-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-400 border border-amber-400/40">
                                    Ativo
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-400">
                                        <Lock className="h-3.5 w-3.5" />
                                        Slot Ocupado ({questType === "MAIN" ? "Main Quest" : "Side Quest"})
                                    </span>
                                    {activeQuest.hltbTime && (
                                        <span className="text-xs font-bold text-zinc-500 font-mono">
                                            • {activeQuest.hltbTime}h HLTB
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                                    {activeQuest.title}
                                </h2>

                                <div className="flex items-center gap-3">
                                    <div className="w-40 bg-zinc-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                                            style={{ width: `${activeQuest.progressPercentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-zinc-300">
                                        {activeQuest.progressPercentage}% concluído
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ações de Quests Ativa */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <Link
                                href="/board"
                                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition-all min-h-[48px]"
                            >
                                <Scroll className="h-4 w-4 text-[#bd0df2]" />
                                Mural de Contratos
                            </Link>

                            <Button
                                type="button"
                                onClick={handleCompleteCurrentQuest}
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all min-h-[48px]"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Concluir Quest (100%)
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDropModalOpen(true)}
                                className="flex items-center gap-2 rounded-xl border-red-500/40 bg-red-950/30 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-300 hover:bg-red-950/60 hover:border-red-500/80 transition-all min-h-[48px]"
                            >
                                <XCircle className="h-4 w-4 text-red-400" />
                                Dropar Quest
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* CASO 2: Modo Seleção Direta */}
                    {mode === "DIRECT" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-7 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur-xl">
                                <div className="space-y-1">
                                    <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-200">
                                        Buscar Jogo na IGDB
                                    </h2>
                                    <p className="text-xs text-zinc-400">
                                        Digite o nome do jogo que você vai jogar para vinculá-lo imediatamente como sua {questType === "MAIN" ? "Main Quest" : "Side Quest"}.
                                    </p>
                                </div>

                                <div className="relative z-30 pt-2">
                                    <GameAutocomplete
                                        onSelect={handleSelectDirectGame}
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-5 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur-xl">
                                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-200">
                                    Jogo Selecionado
                                </h2>

                                {directGame ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4 items-center bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                                            <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
                                                <Image
                                                    src={directGame.imageUrl || "/placeholder-game.jpg"}
                                                    alt={directGame.nome}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <h3 className="text-base font-black text-white truncate">
                                                    {directGame.nome}
                                                </h3>
                                                <span className="text-xs font-bold text-theme-primary uppercase">
                                                    {questType === "MAIN" ? "Campanha Principal" : "Campanha Secundária"}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleActivateDirect}
                                            disabled={isActivatingDirect}
                                            className="w-full h-12 bg-gradient-to-r from-[#bd0df2] to-purple-700 hover:from-[#bd0df2]/90 hover:to-purple-600 text-white font-black uppercase tracking-wider text-xs sm:text-sm shadow-[0_0_20px_rgba(189,13,242,0.4)] transition-all active:scale-98"
                                        >
                                            {isActivatingDirect ? "Ativando Quest..." : `Ativar como Minha ${questType === "MAIN" ? "Main Quest" : "Side Quest"}`}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-zinc-800 rounded-xl">
                                        <Sparkles className="h-8 w-8 text-zinc-600" />
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                                            Nenhum jogo selecionado ainda
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CASO 3: Modo Roleta Solo */}
                    {mode === "ROULETTE" && (
                        <div className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 backdrop-blur-xl space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide text-zinc-200">
                                            Adicionar Jogos ao Pote Solo ({soloCandidates.length}/4)
                                        </h2>
                                        <p className="text-xs text-zinc-400">
                                            Adicione de 2 a 4 opções de backlog e deixe o destino escolher seu próximo jogo.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handleRollSolo}
                                        disabled={soloCandidates.length < 2 || isRolling}
                                        className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-98"
                                    >
                                        <Dices className="h-4 w-4 mr-2" />
                                        {isRolling ? "Sorteando..." : "Girar Roleta Solo"}
                                    </Button>
                                </div>

                                {soloCandidates.length < 4 && (
                                    <div className="relative z-30 pt-2">
                                        <GameAutocomplete
                                            onSelect={handleAddSoloCandidate}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Grid de Candidatos (Dual-Paradigm 4x1 no Desktop, 2x2 no Mobile) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {soloCandidates.map((candidate, index) => (
                                    <div
                                        key={candidate.id || index}
                                        className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-700 transition-all"
                                    >
                                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-800 border border-zinc-800">
                                            <Image
                                                src={candidate.imageUrl || "/placeholder-game.jpg"}
                                                alt={candidate.nome}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSoloCandidate(index)}
                                                className="absolute right-2 top-2 rounded-full bg-black/80 p-1.5 text-zinc-400 hover:text-red-400 hover:bg-black transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <span className="mt-2 text-xs font-bold text-zinc-200 truncate">
                                            {candidate.nome}
                                        </span>
                                    </div>
                                ))}

                                {/* Slots Vazios até 4 */}
                                {Array.from({ length: Math.max(0, 4 - soloCandidates.length) }).map((_, i) => (
                                    <div
                                        key={`empty-${i}`}
                                        className="flex flex-col items-center justify-center aspect-[3/4] rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center p-4"
                                    >
                                        <Plus className="h-6 w-6 text-zinc-700 mb-2" />
                                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                                            Slot Vazio
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Confirmação para Dropar Quest */}
            <Dialog open={isDropModalOpen} onOpenChange={setIsDropModalOpen}>
                <DialogContent className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:max-w-md">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-lg font-black text-white uppercase">
                            Tem certeza que deseja dropar esta quest?
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-zinc-400">
                            {activeQuest && activeQuest.progressPercentage < 20 ? (
                                <span className="text-amber-300 font-bold block">
                                    ⚠️ Seu progresso atual é de apenas {activeQuest.progressPercentage}%. Abandonar quests precocemente aplicará uma penalidade de 7 dias de cooldown para novas gerações via IA.
                                </span>
                            ) : (
                                "O jogo será movido para seu histórico como Dropado e o slot será liberado imediatamente para você escolher outra aventura."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex flex-row justify-end gap-2.5">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDropModalOpen(false)}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDrop}
                            disabled={isDropping}
                            className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                        >
                            {isDropping ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Dropando...
                                </>
                            ) : (
                                "Confirmar Drop"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
