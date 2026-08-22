"use client";

import {
  Shield,
  Sparkles,
  Swords,
  Compass,
  Gamepad2,
  Crown,
  Flame,
  Trophy,
} from "lucide-react";
import { getTitleBadgeStyle } from "@/lib/constants/rewards";
import { cn } from "@/lib/utils";

interface TitleBadgeProps {
  title: string | null;
  className?: string;
  iconClassName?: string;
}

export function renderTitleIcon(titleName: string | null, className: string = "h-4 w-4 shrink-0") {
  switch (titleName) {
    case "Limpador de Poeira":
      return <Sparkles className={cn("text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]", className)} />;
    case "Caçador de Backlog":
      return <Swords className={cn("text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]", className)} />;
    case "Destruidor de Pendências":
      return <Compass className={cn("text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]", className)} />;
    case "Veterano dos Controles":
      return <Gamepad2 className={cn("text-purple-300 drop-shadow-[0_0_6px_rgba(189,13,242,0.6)]", className)} />;
    case "Lenda do Retrogaming":
      return <Crown className={cn("text-pink-300 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]", className)} />;
    case "Mestre da Guilda Aposentada":
      return <Flame className={cn("text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]", className)} />;
    case "Imortal do Backlog Zero":
      return <Trophy className={cn("text-orange-400 drop-shadow-[0_0_10px_rgba(234,88,12,0.9)]", className)} />;
    case "Aposentado Novato":
    default:
      return <Shield className={cn("text-zinc-400", className)} />;
  }
}

export function TitleBadge({ title, className, iconClassName }: TitleBadgeProps) {
  const displayTitle = title || "Aposentado Novato";
  const badgeStyle = getTitleBadgeStyle(displayTitle);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all",
        badgeStyle,
        className
      )}
    >
      {renderTitleIcon(displayTitle, iconClassName)}
      <span className="truncate">{displayTitle}</span>
    </div>
  );
}
