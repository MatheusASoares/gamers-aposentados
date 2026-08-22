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
import { BannerFxOverlay } from "@/components/profile/banner-fx-overlay";

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
  const activeBannerId = user.equippedBanner || null;
  const bannerItem = activeBannerId ? REWARDS_CATALOG.find((r) => r.type === "BANNER" && r.id === activeBannerId) : null;



  return (
    <div
      className="glass-card animate-fade-in-up relative flex flex-col justify-center min-h-[260px] md:min-h-[320px] lg:min-h-[340px] overflow-hidden rounded-[1.5rem] border border-white/5 bg-zinc-950/80 shadow-2xl p-4 sm:p-6 md:p-8"
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
            unoptimized
            sizes="100vw"
            className="object-cover object-center opacity-90 transition-all duration-700 hover:scale-105"
          />
          {/* Smooth Vignette Scrim for High-Definition Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
          {/* Dynamic Animated FX Overlay */}
          <BannerFxOverlay effectType={bannerItem.effectType} bannerId={bannerItem.id} />
        </div>
      )}

      {/* Balanced 3-Column Layout (5 - 4 - 3 Grid) */}
      <div className="relative z-10 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12 lg:items-center">

        {/* Column 1: Player Profile & Info (5 cols) */}
        <div className="flex items-center gap-3.5 sm:gap-6 min-w-0 lg:col-span-5 lg:border-r lg:border-white/10 lg:pr-6">
          <div className="relative shrink-0">
            <UserAvatar
              src={user.image || null}
              name={user.name || null}
              frameUrl={user.equippedFrame}
              size="xl"
              className="sm:h-20 sm:w-20"
            />
          </div>

          <div className="flex flex-col gap-1 sm:gap-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="truncate text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:text-2xl md:text-3xl">
                {user.name || "Gamer"}
              </h2>
              <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-black text-amber-300 uppercase shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                Lvl {level}
              </span>
            </div>

            <div className="pt-0.5 max-w-full">
              <TitleBadge title={title} />
            </div>
          </div>
        </div>

        {/* Column 2: Featured Last Completed Game Showcase Card (4 cols) */}
        <div className="flex flex-col items-center justify-center gap-2 lg:col-span-4">
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-emerald-400 uppercase drop-shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Último Jogo Zerado</span>
          </div>

          {lastGame ? (
            <div className="group relative aspect-[3/4] h-48 sm:h-52 w-auto overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
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
            <div className="flex aspect-[3/4] h-48 w-auto items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/60 p-4 text-xs font-bold text-zinc-400 uppercase backdrop-blur-md">
              Nenhum jogo zerado
            </div>
          )}
        </div>

        {/* Column 3: Stats Summary & Career XP (3 cols) */}
        <div className="flex flex-col justify-between gap-3 lg:col-span-3 lg:border-l lg:border-white/10 lg:pl-6">
          {/* XP Progress - Sleek Glass */}
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/60 p-3.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-black tracking-widest uppercase">
              <span className="text-zinc-300">Career XP</span>
              <span className={`${tierDetails.titleColor} font-black`}>
                {currentLevelXP}/{nextLevelXP} XP
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-950 p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-theme-primary progress-glow transition-all duration-700"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/60 p-2.5 text-center shadow-xl backdrop-blur-md">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Zerados</span>
              <span className="text-xl font-black text-white drop-shadow-md">{user.completedGamesCount}</span>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-amber-500/30 bg-black/60 p-2.5 text-center shadow-xl backdrop-blur-md">
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Platinas</span>
              <span className="text-xl font-black text-amber-300 drop-shadow-md">{user.platinumCount} 🏆</span>
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
