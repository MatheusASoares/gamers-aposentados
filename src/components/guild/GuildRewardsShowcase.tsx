"use client";

import { Sparkles, Trophy, Lock, Shield, Scroll, Image as ImageIcon } from "lucide-react";
import { GUILD_REWARDS_CATALOG } from "@/lib/constants/guild-rewards";

interface GuildRewardsShowcaseProps {
  level: number;
  xpPoints: number;
}

export function GuildRewardsShowcase({ level, xpPoints }: GuildRewardsShowcaseProps) {
  const currentReward = GUILD_REWARDS_CATALOG.find((r) => r.level === level) || GUILD_REWARDS_CATALOG[0];
  const nextReward = GUILD_REWARDS_CATALOG.find((r) => r.level === level + 1);

  const getTierName = (lvl: number) => {
    if (lvl <= 5) return "Guilda de Garagem";
    if (lvl <= 10) return "Irmandade do Joystick";
    if (lvl <= 15) return "Bastião Cyberpunk";
    if (lvl <= 20) return "Sindicato Lendário";
    return "Panteão dos Aposentados";
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "EMBLEM":
        return <Shield className="h-5 w-5 text-theme-primary" />;
      case "BANNER":
        return <ImageIcon className="h-5 w-5 text-cyan-400" />;
      case "TITLE":
        return <Scroll className="h-5 w-5 text-amber-400" />;
      default:
        return <Trophy className="h-5 w-5 text-emerald-400" />;
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-theme bg-theme-card/90 p-5 sm:p-7 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme/20 pb-5 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              Evolução & Recompensas da Guilda
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 font-bold">
              Tier Atual: <span className="text-theme-primary uppercase">{getTierName(level)}</span> (Nv. {level}/25)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 bg-black/40 border border-theme/30 px-3.5 py-1.5 rounded-xl">
          <Sparkles className="h-4 w-4 text-theme-primary" />
          <span>{xpPoints.toLocaleString()} XP Acumulado</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current Level Unlock */}
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 backdrop-blur-sm shadow-md">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/50 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            {getRewardIcon(currentReward.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Última Conquista (Nv. {level})
              </span>
              {currentReward.gameTag && (
                <span className="text-xs font-bold text-zinc-400">
                  • {currentReward.gameTag}
                </span>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-black text-white truncate mt-1">
              {currentReward.name}
            </h4>
            <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5 italic">
              {currentReward.description}
            </p>
          </div>
        </div>

        {/* Next Level Unlock */}
        {nextReward ? (
          <div className="flex items-center gap-4 rounded-2xl border border-theme/30 bg-black/40 p-5 backdrop-blur-sm shadow-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-zinc-500">
              <Lock className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Próxima Recompensa (Nv. {level + 1})
                </span>
                {nextReward.gameTag && (
                  <span className="text-xs font-bold text-zinc-400">
                    • {nextReward.gameTag}
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-black text-zinc-200 truncate mt-1">
                {nextReward.name}
              </h4>
              <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 italic">
                {nextReward.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-amber-400/50 bg-amber-950/20 p-5 backdrop-blur-sm shadow-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Status Máximo
              </span>
              <h4 className="text-sm sm:text-base font-black text-amber-200 truncate mt-1">
                Panteão Supremo dos Aposentados
              </h4>
              <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5">
                Todas as 25 recompensas da guilda foram conquistadas com honra!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
