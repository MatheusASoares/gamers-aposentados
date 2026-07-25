import { Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface HltbBadgeProps {
    hours: number | null | undefined;
    isLoading?: boolean;
    onRefresh?: () => void;
    className?: string;
}

export function HltbBadge({ hours, isLoading, onRefresh, className }: HltbBadgeProps) {
    if (isLoading) {
        return (
            <div className={cn("flex items-center gap-1.5 rounded-full border border-[#bd0df2]/20 bg-[#bd0df2]/10 px-2.5 py-1", className)}>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#bd0df2]/40 border-t-[#bd0df2]"></div>
                <span className="text-xs font-bold text-[#bd0df2]/70 uppercase tracking-widest animate-pulse">AI Agent...</span>
            </div>
        );
    }

    if (hours === null || hours === undefined || hours === 0) {
        if (!onRefresh) return null;

        return (
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRefresh?.();
                }}
                className={cn(
                    "group flex items-center gap-1.5 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2.5 py-1 transition-all hover:border-[#bd0df2]/50 hover:bg-[#bd0df2]/20",
                    className
                )}
                title="Tentar buscar tempo HLTB"
            >
                <RefreshCw className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-[#bd0df2]" />
                <span className="text-xs font-bold text-zinc-500 group-hover:text-[#bd0df2]">HLTB?</span>
            </button>
        );
    }

    return (
        <div className={cn("flex items-center gap-1.5 rounded-full border border-[#bd0df2]/30 bg-[#bd0df2]/20 px-2.5 py-1 shadow-[0_0_10px_rgba(189,13,242,0.15)]", className)}>
            <Clock className="h-3 w-3 text-[#bd0df2]" />
            <span className="text-xs font-black text-[#bd0df2] drop-shadow-[0_0_5px_rgba(189,13,242,0.5)] tracking-wider">
                {hours}H
            </span>
        </div>
    );
}
