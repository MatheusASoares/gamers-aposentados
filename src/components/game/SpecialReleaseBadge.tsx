import { Sparkles, Zap } from "lucide-react";

interface SpecialReleaseBadgeProps {
    variant?: "hero" | "compact" | "subtle";
    className?: string;
    label?: string;
}

export function SpecialReleaseBadge({
    variant = "hero",
    className = "",
    label = "Special Release",
}: SpecialReleaseBadgeProps) {
    if (variant === "compact") {
        return (
            <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-[#bd0df2]/50 bg-[#bd0df2]/15 px-2.5 py-0.5 text-xs font-black tracking-wider text-[#bd0df2] uppercase shadow-[0_0_12px_rgba(189,13,242,0.35)] backdrop-blur-md ${className}`}
            >
                <Sparkles className="h-3 w-3 animate-pulse text-[#bd0df2]" />
                <span>{label}</span>
            </span>
        );
    }

    if (variant === "subtle") {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-md border border-[#bd0df2]/30 bg-[#bd0df2]/10 px-2 py-0.5 text-xs font-bold text-[#bd0df2] ${className}`}
            >
                <Zap className="h-3 w-3 text-[#bd0df2]" />
                <span>{label}</span>
            </span>
        );
    }

    // Default: hero variant (para ActiveQuestHero e SideQuestBar)
    return (
        <span
            className={`relative z-10 inline-flex cursor-default select-none items-center gap-1.5 sm:gap-2 rounded-full border border-[#bd0df2]/60 bg-[#bd0df2]/20 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-black tracking-widest text-white uppercase shadow-[0_0_20px_rgba(189,13,242,0.5)] ring-1 ring-[#bd0df2]/40 backdrop-blur-md animate-pulse ${className}`}
        >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#bd0df2]" />
            <span className="bg-gradient-to-r from-white via-fuchsia-200 to-[#bd0df2] bg-clip-text text-transparent">
                {label}
            </span>
        </span>
    );
}
