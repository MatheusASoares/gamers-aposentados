"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ThemedProgressBarProps {
    value: number;
    label?: React.ReactNode;
    rightElement?: React.ReactNode;
    showValue?: boolean;
    showMilestones?: boolean;
    size?: "sm" | "md" | "lg";
    status?: "ACTIVE" | "COMPLETED" | "DROPPED" | "SUGGESTED";
    className?: string;
}

export function ThemedProgressBar({
    value,
    label,
    rightElement,
    showValue = true,
    showMilestones = false,
    size = "md",
    status = "ACTIVE",
    className,
}: ThemedProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

    const sizeClasses = {
        sm: "h-3",
        md: "h-4 sm:h-5",
        lg: "h-5 sm:h-6",
    };

    const isCompleted = status === "COMPLETED" || clampedValue >= 100;
    const isDropped = status === "DROPPED";

    return (
        <div className={cn("w-full space-y-1.5", className)}>
            {/* Header info with integrated right element (e.g. HLTB badge) */}
            {(label || showValue || rightElement) && (
                <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase">
                    <div className="flex items-center gap-1.5 text-zinc-300 min-w-0 truncate">
                        {label}
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        {showValue && (
                            <span
                                className={cn(
                                    "themed-progress-value font-black tabular-nums transition-colors text-xs sm:text-sm",
                                    isCompleted
                                        ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                                        : isDropped
                                          ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                                          : "text-theme-primary drop-shadow-[0_0_10px_var(--theme-glow)]"
                                )}
                            >
                                {clampedValue}%
                            </span>
                        )}
                        {rightElement}
                    </div>
                </div>
            )}

            {/* Themed Progress Track */}
            <div
                role="progressbar"
                aria-valuenow={clampedValue}
                aria-valuemin={0}
                aria-valuemax={100}
                className={cn(
                    "themed-progress-track relative w-full overflow-hidden transition-all duration-300",
                    sizeClasses[size]
                )}
            >
                {/* Themed Fill Bar */}
                <div
                    className={cn(
                        "themed-progress-fill h-full transition-all duration-1000 ease-out relative",
                        isCompleted && "themed-progress-completed",
                        isDropped && "themed-progress-dropped"
                    )}
                    style={{ width: `${clampedValue}%` }}
                >
                    {/* Glowing Leading Edge */}
                    {clampedValue > 0 && clampedValue < 100 && (
                        <div className="themed-progress-edge absolute top-0 right-0 bottom-0 w-1.5 shrink-0 pointer-events-none" />
                    )}
                </div>

                {/* Milestone Tick Marks (25%, 50%, 75%) */}
                {showMilestones && (
                    <div className="themed-progress-milestones pointer-events-none absolute inset-0 flex justify-between px-[25%] z-10 items-center">
                        <div className="themed-progress-milestone h-full w-[1px] bg-white/25 shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
                        <div className="themed-progress-milestone h-full w-[1px] bg-white/25 shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
                    </div>
                )}
            </div>
        </div>
    );
}
