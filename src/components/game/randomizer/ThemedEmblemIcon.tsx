"use client";

import { Sparkles } from "lucide-react";
import {
    GiSwordsEmblem,
    GiDragonHead,
    GiSpaceship,
    GiPortal,
    GiRetroController,
    GiCyberEye,
} from "react-icons/gi";

export function ThemedEmblemIcon({ theme }: { theme: string }) {
    if (theme === "theme-medieval") {
        return (
            <div className="relative flex items-center justify-center">
                <GiSwordsEmblem className="h-24 w-24 text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.95)] animate-pulse" />
                <GiDragonHead className="absolute -top-4 h-12 w-12 text-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-bounce" />
            </div>
        );
    }

    if (theme === "theme-space") {
        return (
            <div className="relative flex items-center justify-center">
                <GiPortal className="h-24 w-24 text-sky-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.95)] animate-spin-slow" />
                <GiSpaceship className="absolute h-12 w-12 text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-pulse" />
            </div>
        );
    }

    if (theme === "theme-pixel") {
        return (
            <div className="relative flex items-center justify-center">
                <GiRetroController className="h-24 w-24 text-emerald-400 drop-shadow-[4px_4px_0px_#000] animate-bounce" />
            </div>
        );
    }

    return (
        <div className="relative flex items-center justify-center">
            <GiCyberEye className="h-24 w-24 text-[#bd0df2] drop-shadow-[0_0_35px_rgba(189,13,242,0.95)] animate-pulse" />
            <Sparkles className="absolute h-12 w-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-spin-slow" />
        </div>
    );
}
