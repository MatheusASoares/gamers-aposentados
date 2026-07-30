"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  ChevronRight,
  Sparkles,
  Gamepad2,
  CheckCircle2,
} from "lucide-react";
import { calculateLevelFromXP, getRankTierDetails } from "@/app/lib/xp-engine";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TitleBadge } from "@/components/ui/title-badge";
import { REWARDS_CATALOG } from "@/lib/constants/rewards";

export interface UserProfileWidgetProps {
  user: {
    name?: string | null;
    image?: string | null;
    level: number;
    xpPoints: number;
    equippedTitle?: string | null;
    equippedFrame?: string | null;
    equippedBanner?: string | null;
    completedGamesCount: number;
    platinumCount: number;
    lastCompletedGame?: {
      title: string;
      coverUrl: string | null;
    } | null;
  };
}

export function UserProfileWidget({ user }: UserProfileWidgetProps) {
  const { level, currentLevelXP, nextLevelXP, progressPercentage } = calculateLevelFromXP(user.xpPoints);
  const tierDetails = getRankTierDetails(level);
  const title = user.equippedTitle || tierDetails.name;
  const lastGame = user.lastCompletedGame;
  const bannerItem = REWARDS_CATALOG.find((r) => r.type === "BANNER" && r.id === user.equippedBanner);



  return (
    <div
      className="glass-card animate-fade-in-up relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/5 bg-zinc-950/80 shadow-2xl p-6 md:p-8"
      data-testid="user-profile-widget"
    >
      {/* Dynamic Ambient Glow matching the unlocked Rank Tier */}
      <div className={`pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[120px] ${tierDetails.glowColor}`} />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      {/* EQUIPPED HEADER BANNER COVER IMAGE */}
      {bannerItem?.assetUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <Image
            src={bannerItem.assetUrl}
            alt={bannerItem.name || "Banner de Perfil"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-35 mix-blend-luminosity brightness-90 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/40" />
        </div>
      )}

      {/* Balanced 3-Column Layout (4 - 4 - 4 Grid) */}
      <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">

        {/* Column 1: Player Profile & Level Progress (4 cols) */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-4 lg:border-r lg:border-white/5 lg:pr-6">
          {/* Avatar & Player Info */}
          <div className="flex items-center gap-10 md:gap-12">
            <div className="relative shrink-0">
              <UserAvatar
                src={user.image || null}
                name={user.name || null}
                frameUrl={user.equippedFrame}
                size="2xl"
              />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {user.name || "Gamer"}
                </h2>
                {/* Level Pill */}
                <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-black text-amber-300 uppercase shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Lvl {level}
                </span>
              </div>

              {/* Dynamic Rank Title with custom color theme & icon */}
              <TitleBadge title={title} />
            </div>
          </div>

          {/* XP Progress Card */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-zinc-950/60 p-4 shadow-inner">
            <div className="flex items-center justify-between text-xs font-black tracking-widest uppercase">
              <span className="text-zinc-400">Career XP</span>
              <span className={tierDetails.titleColor}>
                {currentLevelXP} / {nextLevelXP} XP ({progressPercentage}%)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-900 p-0.5 border border-white/5">
              <div
                className="h-full rounded-full bg-theme-primary progress-glow transition-all duration-700"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-zinc-500">
              <span>Total: {user.xpPoints} XP</span>
              <span>Próximo nível em {nextLevelXP - currentLevelXP} XP</span>
            </div>
          </div>
        </div>

        {/* Column 2: Featured Last Completed Game Showcase Card (4 cols) */}
        <div className="flex flex-col items-center justify-center gap-2.5 lg:col-span-4">
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Último Jogo Zerado</span>
          </div>

          {lastGame ? (
            <div className="group relative aspect-[3/4] h-52 sm:h-56 w-auto overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-900 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              {lastGame.coverUrl ? (
                <Image
                  src={lastGame.coverUrl.startsWith("//") ? `https:${lastGame.coverUrl}` : lastGame.coverUrl}
                  alt={lastGame.title}
                  fill
                  unoptimized
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-emerald-400">
                  <Gamepad2 className="h-10 w-10" />
                </div>
              )}

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

              {/* Game Title Overlay at Bottom */}
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <h3 className="line-clamp-2 text-sm font-black tracking-tight text-white drop-shadow-md md:text-base">
                  {lastGame.title}
                </h3>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[3/4] h-52 w-auto items-center justify-center rounded-2xl border border-dashed border-white/5 bg-zinc-900/40 p-4 text-xs font-bold text-zinc-500 uppercase">
              Nenhum jogo zerado
            </div>
          )}
        </div>

        {/* Column 3: Stats Summary & Main CTA (4 cols) */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-4 lg:border-l lg:border-white/5 lg:pl-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-zinc-950/60 p-4 text-center">
              <span className="text-xs font-black tracking-widest text-zinc-400 uppercase">Completed</span>
              <span className="text-2xl font-black text-white md:text-3xl">{user.completedGamesCount}</span>
              <span className="text-xs font-bold text-zinc-500">Jogos Zerados</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Platinas</span>
              <span className="text-2xl font-black text-amber-300 md:text-3xl">{user.platinumCount} 🏆</span>
              <span className="text-xs font-bold text-amber-400/80">100% Concluído</span>
            </div>
          </div>

          {/* Hall of Fame Action Button */}
          <Link
            href="/profile"
            className="group flex items-center justify-center gap-2.5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 py-3.5 px-5 text-xs font-black tracking-widest text-amber-300 uppercase shadow-[0_0_20px_rgba(251,191,36,0.15)] transition-all duration-300 hover:border-amber-500 hover:bg-amber-500/30 hover:text-white hover:shadow-[0_0_30px_rgba(251,191,36,0.35)] hover:scale-[1.02]"
          >
            <Trophy className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-12" />
            <span>Acessar Hall of Fame</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </div>
  );
}
