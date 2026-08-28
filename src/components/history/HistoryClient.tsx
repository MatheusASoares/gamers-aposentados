"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Loader2,
    History,
    Shield,
    User,
    Trophy,
    Star,
    CheckCircle2,
    XCircle,
    Search,
    X,
    Filter,
    Calendar,
    SlidersHorizontal,
    Clock,
    Sparkles,
    Swords,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QuestHistoryCard } from "./QuestHistoryCard";
import { getQuestHistoryByYear, getUserPersonalQuestHistory, type PersonalQuestHistoryItem } from "@/app/lib/history-actions";
import type { QuestHistoryData } from "@/app/lib/history-actions";
import { AppDropdown, type AppDropdownOption } from "@/components/ui/app-dropdown";

type QuestTypeFilter = "ALL" | "MAIN" | "SIDE";

interface HistoryClientProps {
    availableYears: number[];
    initialYear: number;
    initialData: QuestHistoryData[];
    currentUserId: string;
}

const MONTH_OPTIONS: AppDropdownOption<number | "ALL">[] = [
    { value: "ALL", label: "🗓️ Todos os Meses" },
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
];

const GUILD_STATUS_OPTIONS: AppDropdownOption<"ALL" | "COMPLETED" | "ACTIVE" | "DROPPED" | "SPECIAL">[] = [
    { value: "ALL", label: "📌 Status: Todos" },
    { value: "COMPLETED", label: "🏆 Zerados" },
    { value: "ACTIVE", label: "⚔️ Jogando" },
    { value: "DROPPED", label: "💀 Dropados" },
    { value: "SPECIAL", label: "✦ Especiais" },
];

const GUILD_SORT_OPTIONS: AppDropdownOption<"RECENT" | "TITLE" | "ENTRIES">[] = [
    { value: "RECENT", label: "⚡ Mais Recentes" },
    { value: "TITLE", label: "🔤 Título (A-Z)" },
    { value: "ENTRIES", label: "🗳️ Mais Indicações" },
];

const PERSONAL_STATUS_OPTIONS: AppDropdownOption<"ALL" | "ACTIVE" | "COMPLETED" | "DROPPED">[] = [
    { value: "ALL", label: "📌 Status: Todos" },
    { value: "ACTIVE", label: "⚔️ Em Andamento" },
    { value: "COMPLETED", label: "🏆 Zerados" },
    { value: "DROPPED", label: "💀 Dropados" },
];

const PERSONAL_SORT_OPTIONS: AppDropdownOption<"RECENT" | "RATING" | "PROGRESS" | "TITLE">[] = [
    { value: "RECENT", label: "⚡ Mais Recentes" },
    { value: "RATING", label: "⭐ Maior Nota" },
    { value: "PROGRESS", label: "📊 Maior Progresso" },
    { value: "TITLE", label: "🔤 Título (A-Z)" },
];

export function HistoryClient({
    availableYears,
    initialYear,
    initialData,
    currentUserId,
}: HistoryClientProps) {
    const [activeTab, setActiveTab] = useState<"GUILD" | "PERSONAL">("GUILD");

    // Guild History State & Filters
    const [guildData, setGuildData] = useState<QuestHistoryData[]>(initialData);
    const [isLoadingGuild, setIsLoadingGuild] = useState(false);
    const [guildSearchQuery, setGuildSearchQuery] = useState("");
    const [guildQuestType, setGuildQuestType] = useState<QuestTypeFilter>("ALL");
    const [guildYearFilter, setGuildYearFilter] = useState<number | "ALL">(initialYear);
    const [guildMonthFilter, setGuildMonthFilter] = useState<number | "ALL">("ALL");
    const [guildStatusFilter, setGuildStatusFilter] = useState<"ALL" | "COMPLETED" | "ACTIVE" | "DROPPED" | "SPECIAL">("ALL");
    const [guildSort, setGuildSort] = useState<"RECENT" | "TITLE" | "ENTRIES">("RECENT");

    // Personal History State & Filters
    const [personalHistory, setPersonalHistory] = useState<PersonalQuestHistoryItem[]>([]);
    const [isLoadingPersonal, setIsLoadingPersonal] = useState(false);
    const [personalSearchQuery, setPersonalSearchQuery] = useState("");
    const [personalTypeFilter, setPersonalTypeFilter] = useState<"ALL" | "MAIN_QUEST" | "SIDE_QUEST">("ALL");
    const [personalStatusFilter, setPersonalStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "DROPPED">("ALL");
    const [personalYearFilter, setPersonalYearFilter] = useState<number | "ALL">("ALL");
    const [personalMonthFilter, setPersonalMonthFilter] = useState<number | "ALL">("ALL");
    const [personalSort, setPersonalSort] = useState<"RECENT" | "RATING" | "PROGRESS" | "TITLE">("RECENT");

    // Fetch Guild data when year or type changes
    useEffect(() => {
        if (activeTab !== "GUILD") return;

        let isMounted = true;
        const fetchData = async () => {
            setIsLoadingGuild(true);
            try {
                const newData = await getQuestHistoryByYear(guildYearFilter, guildQuestType);
                if (isMounted) setGuildData(newData);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                if (isMounted) setIsLoadingGuild(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [guildYearFilter, guildQuestType, activeTab]);

    // Fetch Personal history when switching to PERSONAL tab
    useEffect(() => {
        if (activeTab !== "PERSONAL") return;

        let isMounted = true;
        const fetchPersonal = async () => {
            setIsLoadingPersonal(true);
            try {
                const pData = await getUserPersonalQuestHistory(currentUserId);
                if (isMounted) setPersonalHistory(pData);
            } catch (err) {
                console.error("Failed to fetch personal history:", err);
            } finally {
                if (isMounted) setIsLoadingPersonal(false);
            }
        };

        fetchPersonal();

        return () => {
            isMounted = false;
        };
    }, [activeTab, currentUserId]);

    // Year Dropdown Options for Guild
    const guildYearOptions = useMemo<AppDropdownOption<number | "ALL">[]>(() => {
        const list: AppDropdownOption<number | "ALL">[] = [
            { value: "ALL", label: "📅 Todos os Anos" },
        ];
        availableYears.forEach((y) => {
            list.push({ value: y, label: `Ano ${y}` });
        });
        return list;
    }, [availableYears]);

    // Unique Years for Personal Filter
    const personalYearOptions = useMemo<AppDropdownOption<number | "ALL">[]>(() => {
        const yearsSet = new Set<number>();
        personalHistory.forEach((item) => {
            if (item.startDate) yearsSet.add(new Date(item.startDate).getFullYear());
            if (item.endDate) yearsSet.add(new Date(item.endDate).getFullYear());
        });
        availableYears.forEach((y) => yearsSet.add(y));
        const sorted = Array.from(yearsSet).sort((a, b) => b - a);

        const list: AppDropdownOption<number | "ALL">[] = [
            { value: "ALL", label: "📅 Todos os Anos" },
        ];
        sorted.forEach((y) => {
            list.push({ value: y, label: `Ano ${y}` });
        });
        return list;
    }, [personalHistory, availableYears]);

    // Filtered Guild History
    const filteredGuildHistory = useMemo(() => {
        return guildData
            .filter((item) => {
                // Search query
                if (guildSearchQuery.trim()) {
                    const q = guildSearchQuery.toLowerCase();
                    const matchWinner = item.winnerTitle?.toLowerCase().includes(q);
                    const matchCandidates = item.candidates.some(
                        (c) => c.gameTitle.toLowerCase().includes(q) || c.nominatorName.toLowerCase().includes(q)
                    );
                    if (!matchWinner && !matchCandidates) return false;
                }

                // Month filter
                if (guildMonthFilter !== "ALL") {
                    if (item.month !== guildMonthFilter) return false;
                }

                // Status filter
                if (guildStatusFilter !== "ALL") {
                    if (guildStatusFilter === "SPECIAL") {
                        if (!item.isSpecial && !item.isSpecialRelease) return false;
                    } else {
                        const hasStatus = item.progress.some((p) => p.status === guildStatusFilter);
                        if (!hasStatus) return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                if (guildSort === "TITLE") {
                    return (a.winnerTitle || "").localeCompare(b.winnerTitle || "");
                }
                if (guildSort === "ENTRIES") {
                    return b.candidates.length - a.candidates.length;
                }
                // Default: RECENT
                const yearA = a.year || 0;
                const yearB = b.year || 0;
                if (yearA !== yearB) return yearB - yearA;
                return (b.month || 0) - (a.month || 0);
            });
    }, [guildData, guildSearchQuery, guildMonthFilter, guildStatusFilter, guildSort]);

    // Filtered Personal History
    const filteredPersonalHistory = useMemo(() => {
        return personalHistory
            .filter((item) => {
                // Search query
                if (personalSearchQuery.trim()) {
                    const query = personalSearchQuery.toLowerCase();
                    if (!item.title.toLowerCase().includes(query)) return false;
                }

                // Quest Type Filter
                if (personalTypeFilter !== "ALL") {
                    if (item.questType !== personalTypeFilter) return false;
                }

                // Status Filter
                if (personalStatusFilter !== "ALL") {
                    if (item.status !== personalStatusFilter) return false;
                }

                // Year Filter
                if (personalYearFilter !== "ALL") {
                    const itemYearStart = item.startDate ? new Date(item.startDate).getFullYear() : null;
                    const itemYearEnd = item.endDate ? new Date(item.endDate).getFullYear() : null;
                    if (itemYearStart !== personalYearFilter && itemYearEnd !== personalYearFilter) {
                        return false;
                    }
                }

                // Month Filter
                if (personalMonthFilter !== "ALL") {
                    const itemMonthStart = item.startDate ? new Date(item.startDate).getMonth() + 1 : null;
                    const itemMonthEnd = item.endDate ? new Date(item.endDate).getMonth() + 1 : null;
                    if (itemMonthStart !== personalMonthFilter && itemMonthEnd !== personalMonthFilter) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                if (personalSort === "RATING") {
                    return (b.reviewRating || 0) - (a.reviewRating || 0);
                }
                if (personalSort === "PROGRESS") {
                    return b.progress_percentage - a.progress_percentage;
                }
                if (personalSort === "TITLE") {
                    return a.title.localeCompare(b.title);
                }
                // Default: RECENT
                const dateA = a.endDate ? new Date(a.endDate).getTime() : a.startDate ? new Date(a.startDate).getTime() : 0;
                const dateB = b.endDate ? new Date(b.endDate).getTime() : b.startDate ? new Date(b.startDate).getTime() : 0;
                return dateB - dateA;
            });
    }, [
        personalHistory,
        personalSearchQuery,
        personalTypeFilter,
        personalStatusFilter,
        personalYearFilter,
        personalMonthFilter,
        personalSort,
    ]);

    const hasActiveGuildFilters =
        guildSearchQuery.trim() !== "" ||
        guildQuestType !== "ALL" ||
        guildYearFilter !== initialYear ||
        guildMonthFilter !== "ALL" ||
        guildStatusFilter !== "ALL" ||
        guildSort !== "RECENT";

    const clearGuildFilters = () => {
        setGuildSearchQuery("");
        setGuildQuestType("ALL");
        setGuildYearFilter(initialYear);
        setGuildMonthFilter("ALL");
        setGuildStatusFilter("ALL");
        setGuildSort("RECENT");
    };

    const hasActivePersonalFilters =
        personalSearchQuery.trim() !== "" ||
        personalTypeFilter !== "ALL" ||
        personalStatusFilter !== "ALL" ||
        personalYearFilter !== "ALL" ||
        personalMonthFilter !== "ALL" ||
        personalSort !== "RECENT";

    const clearPersonalFilters = () => {
        setPersonalSearchQuery("");
        setPersonalTypeFilter("ALL");
        setPersonalStatusFilter("ALL");
        setPersonalYearFilter("ALL");
        setPersonalMonthFilter("ALL");
        setPersonalSort("RECENT");
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-6 sm:gap-8 px-3 sm:px-6 py-4 sm:py-8 md:px-8 lg:px-12 lg:py-12">
                {/* Header Area com Seletor de Abas Principais */}
                <div className="flex flex-col justify-between gap-6 sm:gap-8 border-b border-white/5 pb-6 sm:pb-8 lg:flex-row lg:items-end">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {/* Abas Principais: Guilda Oficial vs Minhas Quests */}
                            <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("GUILD")}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all min-h-[44px]",
                                        activeTab === "GUILD"
                                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-black"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <Shield className="h-4 w-4" />
                                    Potes da Guilda Oficial
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("PERSONAL")}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all min-h-[44px]",
                                        activeTab === "PERSONAL"
                                            ? "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/40 shadow-[0_0_12px_rgba(189,13,242,0.25)] font-black"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <User className="h-4 w-4" />
                                    Minhas Quests & Backlog
                                </button>
                            </div>
                        </div>

                        <h1 className="text-shadow-glow text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
                            {activeTab === "GUILD" ? "Histórico da Guilda" : "Meu Histórico Pessoal"}
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base font-bold tracking-wide text-zinc-400 max-w-2xl">
                            {activeTab === "GUILD"
                                ? "Registro auditável dos sorteios, indicações e campanhas conquistadas pela dupla oficial (Matheus & Lucas)."
                                : "Acompanhe todos os jogos que você iniciou, completou ou dropou na sua jornada pessoal."}
                        </p>
                    </div>
                </div>

                {/* Conteúdo Aba 1: Potes da Guilda Oficial */}
                {activeTab === "GUILD" && (
                    <div className="space-y-6 sm:space-y-8">
                        {/* TOOLBAR DE FILTROS DA GUILDA (Dual-Paradigm: Desktop 4x1 Streamlined vs Mobile 2x2 Grid) */}
                        <div className="flex flex-col gap-3.5 sm:gap-4 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-950/85 p-3.5 sm:p-5 backdrop-blur-xl shadow-xl">
                            
                            {/* Desktop View: Linha Única Contínua (4x1) */}
                            <div className="hidden lg:flex items-center justify-between gap-3.5 flex-wrap">
                                {/* Search Input */}
                                <div className="relative flex-1 min-w-[240px] max-w-xs">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar jogo ou membro..."
                                        value={guildSearchQuery}
                                        onChange={(e) => setGuildSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-9 py-2.5 text-sm font-bold text-white placeholder-zinc-500 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[44px]"
                                    />
                                    {guildSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setGuildSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                            title="Limpar busca"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Segmented Type Control */}
                                <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setGuildQuestType("ALL")}
                                        className={cn(
                                            "rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider transition-all min-h-[38px]",
                                            guildQuestType === "ALL"
                                                ? "bg-zinc-800 text-white shadow font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGuildQuestType("MAIN")}
                                        className={cn(
                                            "rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider transition-all min-h-[38px]",
                                            guildQuestType === "MAIN"
                                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Main Quest
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGuildQuestType("SIDE")}
                                        className={cn(
                                            "rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider transition-all min-h-[38px]",
                                            guildQuestType === "SIDE"
                                                ? "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/40 shadow-[0_0_10px_rgba(189,13,242,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Side Quest
                                    </button>
                                </div>

                                {/* Status AppDropdown */}
                                <div className="w-48 shrink-0">
                                    <AppDropdown
                                        value={guildStatusFilter}
                                        onChange={setGuildStatusFilter}
                                        options={GUILD_STATUS_OPTIONS}
                                        accentColor="amber"
                                    />
                                </div>

                                {/* Sort AppDropdown */}
                                <div className="w-44 shrink-0">
                                    <AppDropdown
                                        value={guildSort}
                                        onChange={setGuildSort}
                                        options={GUILD_SORT_OPTIONS}
                                        accentColor="amber"
                                    />
                                </div>

                                {/* Year AppDropdown */}
                                <div className="w-38 shrink-0">
                                    <AppDropdown
                                        value={guildYearFilter}
                                        onChange={setGuildYearFilter}
                                        options={guildYearOptions}
                                        accentColor="amber"
                                    />
                                </div>

                                {/* Month AppDropdown */}
                                <div className="w-44 shrink-0">
                                    <AppDropdown
                                        value={guildMonthFilter}
                                        onChange={setGuildMonthFilter}
                                        options={MONTH_OPTIONS}
                                        accentColor="amber"
                                    />
                                </div>
                            </div>

                            {/* Mobile View: Layout Tátil com 2x2 Dropdowns */}
                            <div className="flex lg:hidden flex-col gap-3">
                                {/* Search Bar Mobile */}
                                <div className="relative w-full">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar jogo ou membro..."
                                        value={guildSearchQuery}
                                        onChange={(e) => setGuildSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-9 py-2.5 text-sm font-bold text-white placeholder-zinc-500 transition-colors focus:border-amber-500 focus:outline-none min-h-[44px]"
                                    />
                                    {guildSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setGuildSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                            title="Limpar busca"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Segmented Type Control Mobile */}
                                <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 w-full">
                                    <button
                                        type="button"
                                        onClick={() => setGuildQuestType("ALL")}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] text-center",
                                            guildQuestType === "ALL"
                                                ? "bg-zinc-800 text-white shadow font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGuildQuestType("MAIN")}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] text-center",
                                            guildQuestType === "MAIN"
                                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Main
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGuildQuestType("SIDE")}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] text-center",
                                            guildQuestType === "SIDE"
                                                ? "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/40 shadow-[0_0_10px_rgba(189,13,242,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Side
                                    </button>
                                </div>

                                {/* Mobile 2x2 Grid of Dropdowns */}
                                <div className="grid grid-cols-2 gap-2">
                                    <AppDropdown
                                        value={guildStatusFilter}
                                        onChange={setGuildStatusFilter}
                                        options={GUILD_STATUS_OPTIONS}
                                        accentColor="amber"
                                    />
                                    <AppDropdown
                                        value={guildSort}
                                        onChange={setGuildSort}
                                        options={GUILD_SORT_OPTIONS}
                                        accentColor="amber"
                                    />
                                    <AppDropdown
                                        value={guildYearFilter}
                                        onChange={setGuildYearFilter}
                                        options={guildYearOptions}
                                        accentColor="amber"
                                    />
                                    <AppDropdown
                                        value={guildMonthFilter}
                                        onChange={setGuildMonthFilter}
                                        options={MONTH_OPTIONS}
                                        accentColor="amber"
                                    />
                                </div>
                            </div>

                            {/* Linha de Rodapé do Toolbar: Limpar Filtros & Contador */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                                {hasActiveGuildFilters ? (
                                    <button
                                        type="button"
                                        onClick={clearGuildFilters}
                                        className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors min-h-[38px]"
                                    >
                                        <X className="h-4 w-4" />
                                        Limpar Filtros
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <div className="text-xs sm:text-sm font-bold text-zinc-400">
                                    Exibindo{" "}
                                    <strong className="text-white font-black">
                                        {filteredGuildHistory.length}
                                    </strong>{" "}
                                    de {guildData.length} potes da guilda
                                </div>
                            </div>
                        </div>

                        {/* Listagem de Cards da Guilda */}
                        {isLoadingGuild ? (
                            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
                                <Loader2 className="size-10 animate-spin text-[#bd0df2]" />
                                <span className="text-sm font-bold tracking-widest text-[#bd0df2] uppercase">
                                    Carregando Arquivos...
                                </span>
                            </div>
                        ) : guildData.length === 0 ? (
                            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 bg-zinc-900/20 p-8 text-center backdrop-blur-sm">
                                <History className="mb-4 size-16 text-zinc-700" />
                                <h3 className="text-lg sm:text-xl font-black tracking-widest text-zinc-400 uppercase">
                                    Nenhuma Quest Encontrada
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-zinc-500 font-bold">
                                    Não há histórico registrado para os parâmetros selecionados.
                                </p>
                            </div>
                        ) : filteredGuildHistory.length === 0 ? (
                            <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center backdrop-blur-sm gap-3">
                                <Filter className="size-12 text-zinc-700" />
                                <h3 className="text-base sm:text-lg font-black tracking-wider text-zinc-300 uppercase">
                                    Nenhum pote encontrado com os filtros selecionados
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-500 font-bold">
                                    Tente alterar a busca, tipo de quest, status ou mês/ano.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearGuildFilters}
                                    className="mt-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-black uppercase text-white hover:bg-zinc-700 transition-colors min-h-[44px]"
                                >
                                    Resetar Filtros
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-12 lg:gap-16">
                                {filteredGuildHistory.map((item, index) => (
                                    <div
                                        key={item.poolId}
                                        className="animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                                        style={{
                                            animationDelay: `${index * 150}ms`,
                                            animationDuration: "700ms",
                                        }}
                                    >
                                        <QuestHistoryCard data={item} currentUserId={currentUserId} priority={index === 0} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Conteúdo Aba 2: Minhas Quests Pessoais */}
                {activeTab === "PERSONAL" && (
                    <div className="space-y-6 sm:space-y-8">
                        
                        {/* TOOLBAR DE FILTROS DA ABA PESSOAL (Dual-Paradigm: Desktop 4x1 Streamlined vs Mobile 2x2 Grid) */}
                        <div className="flex flex-col gap-3.5 sm:gap-4 rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-zinc-950/85 p-3.5 sm:p-5 backdrop-blur-xl shadow-xl">
                            
                            {/* Desktop View: Linha Única Contínua (4x1) */}
                            <div className="hidden lg:flex items-center justify-between gap-3.5 flex-wrap">
                                {/* Search Input */}
                                <div className="relative flex-1 min-w-[240px] max-w-xs">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar no histórico pessoal..."
                                        value={personalSearchQuery}
                                        onChange={(e) => setPersonalSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-9 py-2.5 text-sm font-bold text-white placeholder-zinc-500 transition-colors focus:border-[#bd0df2] focus:outline-none focus:ring-1 focus:ring-[#bd0df2] min-h-[44px]"
                                    />
                                    {personalSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setPersonalSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                            title="Limpar busca"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Segmented Type Control */}
                                <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setPersonalTypeFilter("ALL")}
                                        className={cn(
                                            "rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider transition-all min-h-[38px]",
                                            personalTypeFilter === "ALL"
                                                ? "bg-zinc-800 text-white shadow font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPersonalTypeFilter("MAIN_QUEST")}
                                        className={cn(
                                            "rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider transition-all min-h-[38px]",
                                            personalTypeFilter === "MAIN_QUEST"
                                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Main Quest
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPersonalTypeFilter("SIDE_QUEST")}
                                        className={cn(
                                            "rounded-lg px-3.5 py-2 text-sm font-bold uppercase tracking-wider transition-all min-h-[38px]",
                                            personalTypeFilter === "SIDE_QUEST"
                                                ? "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/40 shadow-[0_0_10px_rgba(189,13,242,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Side Quest
                                    </button>
                                </div>

                                {/* Status AppDropdown */}
                                <div className="w-48 shrink-0">
                                    <AppDropdown
                                        value={personalStatusFilter}
                                        onChange={setPersonalStatusFilter}
                                        options={PERSONAL_STATUS_OPTIONS}
                                        accentColor="purple"
                                    />
                                </div>

                                {/* Sort AppDropdown */}
                                <div className="w-44 shrink-0">
                                    <AppDropdown
                                        value={personalSort}
                                        onChange={setPersonalSort}
                                        options={PERSONAL_SORT_OPTIONS}
                                        accentColor="purple"
                                    />
                                </div>

                                {/* Year AppDropdown */}
                                <div className="w-38 shrink-0">
                                    <AppDropdown
                                        value={personalYearFilter}
                                        onChange={setPersonalYearFilter}
                                        options={personalYearOptions}
                                        accentColor="purple"
                                    />
                                </div>

                                {/* Month AppDropdown */}
                                <div className="w-44 shrink-0">
                                    <AppDropdown
                                        value={personalMonthFilter}
                                        onChange={setPersonalMonthFilter}
                                        options={MONTH_OPTIONS}
                                        accentColor="purple"
                                    />
                                </div>
                            </div>

                            {/* Mobile View: Layout Tátil com 2x2 Dropdowns */}
                            <div className="flex lg:hidden flex-col gap-3">
                                {/* Search Bar Mobile */}
                                <div className="relative w-full">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Buscar no histórico pessoal..."
                                        value={personalSearchQuery}
                                        onChange={(e) => setPersonalSearchQuery(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-9 py-2.5 text-sm font-bold text-white placeholder-zinc-500 transition-colors focus:border-[#bd0df2] focus:outline-none min-h-[44px]"
                                    />
                                    {personalSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setPersonalSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                            title="Limpar busca"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Segmented Type Control Mobile */}
                                <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 w-full">
                                    <button
                                        type="button"
                                        onClick={() => setPersonalTypeFilter("ALL")}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] text-center",
                                            personalTypeFilter === "ALL"
                                                ? "bg-zinc-800 text-white shadow font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Todas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPersonalTypeFilter("MAIN_QUEST")}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] text-center",
                                            personalTypeFilter === "MAIN_QUEST"
                                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Main
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPersonalTypeFilter("SIDE_QUEST")}
                                        className={cn(
                                            "rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] text-center",
                                            personalTypeFilter === "SIDE_QUEST"
                                                ? "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/40 shadow-[0_0_10px_rgba(189,13,242,0.2)] font-black"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        Side
                                    </button>
                                </div>

                                {/* Mobile 2x2 Grid of Dropdowns */}
                                <div className="grid grid-cols-2 gap-2">
                                    <AppDropdown
                                        value={personalStatusFilter}
                                        onChange={setPersonalStatusFilter}
                                        options={PERSONAL_STATUS_OPTIONS}
                                        accentColor="purple"
                                    />
                                    <AppDropdown
                                        value={personalSort}
                                        onChange={setPersonalSort}
                                        options={PERSONAL_SORT_OPTIONS}
                                        accentColor="purple"
                                    />
                                    <AppDropdown
                                        value={personalYearFilter}
                                        onChange={setPersonalYearFilter}
                                        options={personalYearOptions}
                                        accentColor="purple"
                                    />
                                    <AppDropdown
                                        value={personalMonthFilter}
                                        onChange={setPersonalMonthFilter}
                                        options={MONTH_OPTIONS}
                                        accentColor="purple"
                                    />
                                </div>
                            </div>

                            {/* Linha de Rodapé do Toolbar: Limpar Filtros & Contador */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                                {hasActivePersonalFilters ? (
                                    <button
                                        type="button"
                                        onClick={clearPersonalFilters}
                                        className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors min-h-[38px]"
                                    >
                                        <X className="h-4 w-4" />
                                        Limpar Filtros
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <div className="text-xs sm:text-sm font-bold text-zinc-400">
                                    Exibindo{" "}
                                    <strong className="text-white font-black">
                                        {filteredPersonalHistory.length}
                                    </strong>{" "}
                                    de {personalHistory.length} quests pessoais
                                </div>
                            </div>
                        </div>

                        {/* Listagem de Cards Pessoais */}
                        {isLoadingPersonal ? (
                            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
                                <Loader2 className="size-10 animate-spin text-[#bd0df2]" />
                                <span className="text-sm font-bold tracking-widest text-[#bd0df2] uppercase">
                                    Carregando Suas Quests...
                                </span>
                            </div>
                        ) : personalHistory.length === 0 ? (
                            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center backdrop-blur-sm gap-4">
                                <Trophy className="size-16 text-zinc-700" />
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black tracking-wider text-zinc-300 uppercase">
                                        Nenhuma Quest Pessoal Registrada
                                    </h3>
                                    <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-bold">
                                        Você ainda não iniciou nenhuma quest pessoal. Acesse o menu de Quests para escolher seu jogo!
                                    </p>
                                </div>
                                <Link
                                    href="/randomizer"
                                    className="rounded-xl bg-[#bd0df2] px-6 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(189,13,242,0.4)] hover:bg-[#bd0df2]/90 transition-all min-h-[44px] inline-flex items-center justify-center"
                                >
                                    Escolher Jogo
                                </Link>
                            </div>
                        ) : filteredPersonalHistory.length === 0 ? (
                            <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center backdrop-blur-sm gap-3">
                                <Filter className="size-12 text-zinc-700" />
                                <h3 className="text-base sm:text-lg font-black tracking-wider text-zinc-300 uppercase">
                                    Nenhum jogo encontrado com os filtros selecionados
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-500 font-bold">
                                    Tente alterar os termos da busca, filtros de tipo, status ou ano/mês.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearPersonalFilters}
                                    className="mt-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-black uppercase text-white hover:bg-zinc-700 transition-colors min-h-[44px]"
                                >
                                    Resetar Filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredPersonalHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-xl hover:border-theme transition-all duration-300 backdrop-blur-md"
                                    >
                                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 mb-3">
                                            <Image
                                                src={item.coverUrl || "/placeholder-game.jpg"}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 768px) 100vw, 25vw"
                                            />

                                            {/* Status Badge */}
                                            <div className="absolute top-2 left-2">
                                                {item.status === "COMPLETED" ? (
                                                    <span className="flex items-center gap-1 rounded-md bg-emerald-950/90 border border-emerald-500/60 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-300 backdrop-blur-sm">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                                        Zerado
                                                    </span>
                                                ) : item.status === "ACTIVE" ? (
                                                    <span className="flex items-center gap-1 rounded-md bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-amber-300 backdrop-blur-sm animate-pulse">
                                                        Em Andamento
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 rounded-md bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-zinc-400 backdrop-blur-sm">
                                                        <XCircle className="h-3.5 w-3.5 text-zinc-500" />
                                                        Dropado
                                                    </span>
                                                )}
                                            </div>

                                            {/* Platinum Badge */}
                                            {item.isPlatinum && (
                                                <div className="absolute top-2 right-2 rounded-full bg-cyan-950/90 border border-cyan-400 p-1 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                                                    <Trophy className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                                    <span>{item.questType === "MAIN_QUEST" ? "Main Quest" : "Side Quest"}</span>
                                                    {item.hltbTime && <span>{item.hltbTime}h HLTB</span>}
                                                </div>
                                                <h3 className="text-sm sm:text-base font-black text-white truncate">
                                                    {item.title}
                                                </h3>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-zinc-900 pt-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 sm:w-20 bg-zinc-800 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full",
                                                                item.status === "COMPLETED" ? "bg-emerald-400" : "bg-amber-400"
                                                            )}
                                                            style={{ width: `${item.progress_percentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-zinc-300">
                                                        {item.progress_percentage}%
                                                    </span>
                                                </div>

                                                {item.reviewRating !== null && item.reviewRating !== undefined && (
                                                    <span className="flex items-center gap-1 text-xs sm:text-sm font-black text-amber-400">
                                                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                        {item.reviewRating}/10
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
