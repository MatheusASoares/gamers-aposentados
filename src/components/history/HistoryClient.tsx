"use client";

import { useState, useEffect } from "react";
import { Loader2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestHistoryCard } from "./QuestHistoryCard";
import { getQuestHistoryByYear } from "@/app/lib/history-actions";
import type { QuestHistoryData } from "@/app/lib/history-actions";

type QuestType = "MAIN" | "SIDE";

interface HistoryClientProps {
    availableYears: number[];
    initialYear: number;
    initialData: QuestHistoryData[];
    currentUserId: string;
}

export function HistoryClient({
    availableYears,
    initialYear,
    initialData,
    currentUserId,
}: HistoryClientProps) {
    const [selectedYear, setSelectedYear] = useState<number>(initialYear);
    const [questType, setQuestType] = useState<QuestType>("MAIN");
    const [data, setData] = useState<QuestHistoryData[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch data when year or type changes
    useEffect(() => {
        // Skip first render if state matches initial props
        if (selectedYear === initialYear && questType === "MAIN") {
            setData(initialData);
            return;
        }

        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const newData = await getQuestHistoryByYear(selectedYear, questType);
                if (isMounted) setData(newData);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [selectedYear, questType, initialYear, initialData]);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/50" />
            <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-6 sm:gap-12 px-2 sm:px-6 py-4 sm:py-8 md:px-8 lg:px-12 lg:py-12">
                {/* Header Area */}
                <div className="flex flex-col justify-between gap-6 sm:gap-8 border-b border-white/5 pb-6 sm:pb-8 lg:flex-row lg:items-end">
                    <div>
                        <h1 className="text-shadow-glow mb-1.5 sm:mb-2 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                            QUESTS HISTORY
                        </h1>
                        <p className="text-sm sm:text-lg font-medium tracking-wide text-zinc-400">
                            Hall of fame and shame. See which games were conquered.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        {/* Quest Type Toggle */}
                        <div className="inline-flex rounded-2xl border border-white/5 bg-zinc-900/40 p-1.5 shadow-xl backdrop-blur-md">
                            <button
                                onClick={() => setQuestType("MAIN")}
                                className={cn(
                                    "rounded-xl px-6 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300",
                                    questType === "MAIN"
                                        ? "bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30"
                                        : "text-zinc-500 hover:text-white",
                                )}
                            >
                                Main Quest
                            </button>
                            <button
                                onClick={() => setQuestType("SIDE")}
                                className={cn(
                                    "rounded-xl px-6 py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300",
                                    questType === "SIDE"
                                        ? "bg-[#bd0df2]/10 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.15)] ring-1 ring-[#bd0df2]/30"
                                        : "text-zinc-500 hover:text-white",
                                )}
                            >
                                Side Quest
                            </button>
                        </div>

                        {/* Year Selector (Pills) */}
                        <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-1.5 shadow-xl backdrop-blur-md">
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className={cn(
                                        "rounded-xl px-4 py-2.5 text-xs font-bold tracking-widest transition-all duration-300",
                                        selectedYear === year
                                            ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] ring-1 ring-white/20"
                                            : "text-zinc-500 hover:text-zinc-300",
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
                        <Loader2 className="size-10 animate-spin text-[#bd0df2]" />
                        <span className="text-sm font-bold tracking-widest text-[#bd0df2] uppercase">
                            Carregando Arquivos...
                        </span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[3rem] border border-dashed border-white/10 bg-zinc-900/20 p-8 text-center backdrop-blur-sm">
                        <History className="mb-4 size-16 text-zinc-700" />
                        <h3 className="text-xl font-black tracking-widest text-zinc-500 uppercase">
                            Nenhuma Quest Encontrada
                        </h3>
                        <p className="mt-2 text-sm text-zinc-600">
                            Não há histórico registrado para{" "}
                            {questType === "MAIN" ? "Main Quests" : "Side Quests"} no ano de{" "}
                            {selectedYear}.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-12 lg:gap-16">
                        {data.map((item, index) => (
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
        </div>
    );
}
