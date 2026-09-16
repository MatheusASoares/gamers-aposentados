"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestType } from "./types";

interface RandomizerHeaderProps {
    questType: QuestType;
    onQuestTypeChange: (type: QuestType) => void;
    saveStatus: { success?: boolean; message?: string } | null;
}

export function RandomizerHeader({
    questType,
    onQuestTypeChange,
    saveStatus,
}: RandomizerHeaderProps) {
    return (
        <>
            {/* Header Area (Padrão do Aplicativo) */}
            <div className="flex flex-col justify-between gap-5 sm:gap-6 border-b border-white/5 pb-6 sm:pb-8 md:flex-row md:items-end">
                <div className="space-y-1.5 sm:space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase drop-shadow-md sm:text-4xl md:text-5xl">
                        The Great Randomizer
                    </h2>
                    <p className="max-w-2xl text-sm sm:text-lg font-medium text-zinc-400">
                        May the RNG be in your favor, Commander.
                    </p>
                </div>
                <div className="relative flex w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-1.5 shadow-xl backdrop-blur-md sm:inline-flex sm:w-[400px]">
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
                        onClick={() => onQuestTypeChange("MAIN")}
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
                        onClick={() => onQuestTypeChange("SIDE")}
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
        </>
    );
}
