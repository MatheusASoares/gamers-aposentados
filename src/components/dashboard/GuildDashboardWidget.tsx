"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Shield,
    Crown,
    ChevronRight,
    Sparkles,
    Swords,
    Gamepad2,
    ShieldCheck,
    Flame,
    Skull,
    Radio,
    Moon,
    Hourglass,
    Compass,
    Atom,
    Sun,
    Scroll,
    Users,
} from "lucide-react";
import { type ActiveGuildDetailsDTO } from "@/app/lib/guild-actions";
import { getGuildLevelProgress } from "@/lib/guild-xp-engine";
import { GUILD_REWARDS_CATALOG } from "@/lib/constants/guild-rewards";
import { BannerFxOverlay } from "@/components/profile/banner-fx-overlay";
import { GuildMascotCompanion } from "@/components/guild/GuildMascotCompanion";
import { cn } from "@/lib/utils";

export interface GuildDashboardWidgetProps {
    guild: ActiveGuildDetailsDTO;
    stats?: {
        totalCompletedGames: number;
        totalPools: number;
        totalHoursPlayed: number;
        totalMembers: number;
    } | null;
}

export function GuildDashboardWidget({ guild, stats }: GuildDashboardWidgetProps) {
    const [bannerError, setBannerError] = useState(false);

    // XP calculation via guild engine (adapted to active members)
    const activeMembers = Math.max(2, guild.members?.filter((m) => m.isActive).length || guild.activeMemberCount || 2);
    const { currentLevelXP, nextLevelXP, progressPercentage } = getGuildLevelProgress(
        guild.xpPoints,
        guild.level,
        activeMembers
    );

    // Find equipped cosmetics with reliable fallback
    const bannerItem = guild.equippedBanner
        ? GUILD_REWARDS_CATALOG.find(
              (r) =>
                  r.type === "BANNER" &&
                  (r.name === guild.equippedBanner ||
                      r.assetUrl === guild.equippedBanner ||
                      r.id === guild.equippedBanner)
          )
        : GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER" && r.level <= Math.max(3, guild.level)) ||
          GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER");

    const emblemItem = guild.equippedEmblem
        ? GUILD_REWARDS_CATALOG.find(
              (r) => r.type === "EMBLEM" && (r.name === guild.equippedEmblem || r.id === guild.equippedEmblem)
          )
        : null;

    const mascotItem = guild.equippedMascot
        ? GUILD_REWARDS_CATALOG.find(
              (r) =>
                  r.type === "MASCOT" &&
                  (r.name.toLowerCase() === guild.equippedMascot?.toLowerCase() ||
                      r.assetUrl === guild.equippedMascot ||
                      r.id === guild.equippedMascot ||
                      guild.equippedMascot?.toLowerCase().includes(r.name.toLowerCase()) ||
                      r.name.toLowerCase().includes(guild.equippedMascot?.toLowerCase() || ""))
          )
        : GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT" && r.level <= Math.max(2, guild.level)) ||
          GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT") ||
          null;

    const titleItem = guild.equippedTitle
        ? GUILD_REWARDS_CATALOG.find(
              (r) => r.type === "TITLE" && (r.name === guild.equippedTitle || r.id === guild.equippedTitle)
          )
        : null;

    const renderTitleIcon = (iconName?: string, className = "h-4 w-4") => {
        switch (iconName) {
            case "Radio":
                return <Radio className={cn(className, "text-emerald-400 shrink-0 animate-pulse")} />;
            case "Moon":
                return <Moon className={cn(className, "text-rose-400 shrink-0")} />;
            case "Hourglass":
                return <Hourglass className={cn(className, "text-cyan-400 shrink-0")} />;
            case "Flame":
                return <Flame className={cn(className, "text-orange-400 shrink-0")} />;
            case "Compass":
                return <Compass className={cn(className, "text-amber-400 shrink-0")} />;
            case "Atom":
                return <Atom className={cn(className, "text-cyan-400 shrink-0 animate-pulse")} />;
            case "Sun":
                return <Sun className={cn(className, "text-amber-400 shrink-0 animate-pulse")} />;
            default:
                return <Scroll className={cn(className, "text-amber-400 shrink-0")} />;
        }
    };

    const renderEmblemIcon = (iconName?: string, className = "h-10 w-10 sm:h-12 sm:w-12") => {
        switch (iconName) {
            case "Shield":
                return <Shield className={cn(className, "drop-shadow-[0_0_12px_#bd0df2]")} />;
            case "Swords":
                return <Swords className={cn(className, "drop-shadow-[0_0_12px_#bd0df2]")} />;
            case "Gamepad2":
                return <Gamepad2 className={cn(className, "drop-shadow-[0_0_12px_#f59e0b]")} />;
            case "ShieldCheck":
                return <ShieldCheck className={cn(className, "drop-shadow-[0_0_12px_#06b6d4]")} />;
            case "Flame":
                return <Flame className={cn(className, "drop-shadow-[0_0_12px_#f43f5e]")} />;
            case "Crown":
                return <Crown className={cn(className, "drop-shadow-[0_0_12px_#fbbf24]")} />;
            case "Skull":
                return <Skull className={cn(className, "drop-shadow-[0_0_12px_#a855f7]")} />;
            default:
                return <Shield className={cn(className, "drop-shadow-[0_0_12px_#bd0df2]")} />;
        }
    };

    return (
        <div
            className={cn(
                "glass-card animate-fade-in-up relative flex flex-col justify-center min-h-[260px] md:min-h-[320px] lg:min-h-[340px] overflow-hidden rounded-[1.5rem] border border-white/15 shadow-2xl p-4 sm:p-6 md:p-8",
                !bannerItem?.assetUrl && "bg-zinc-950/80"
            )}
            data-testid="guild-dashboard-widget"
        >
            {/* Dynamic Ambient Glows matching Cyber Neon Brand (#bd0df2 / Cyan) */}
            <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[120px] bg-[#bd0df2]/20" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-[120px] bg-cyan-500/15" />

            {/* EQUIPPED HEADER BANNER COVER IMAGE */}
            {bannerItem?.assetUrl && !bannerError && (
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <Image
                        src={bannerItem.assetUrl}
                        alt={bannerItem.name || "Banner da Guilda"}
                        fill
                        priority
                        unoptimized
                        onError={() => setBannerError(true)}
                        sizes="100vw"
                        className="object-cover object-center opacity-95 transition-all duration-700 hover:scale-105"
                    />
                    {/* Luminous Cinematic Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-black/20 to-black/30" />
                    {/* Dynamic Animated FX Overlay */}
                    <BannerFxOverlay effectType={bannerItem.effectType} bannerId={bannerItem.id} />
                </div>
            )}

            {/* Balanced 3-Column Layout (5 - 4 - 3 Grid matching UserProfileWidget) */}
            <div className="relative z-10 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-center">
                {/* Column 1: Guild Emblem & Identity (5 cols) in Frosted Glass Capsule */}
                <div className="flex items-center gap-3.5 sm:gap-6 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 sm:p-5 backdrop-blur-md shadow-xl lg:col-span-5 min-w-0">
                    <div className="relative shrink-0">
                        {emblemItem?.assetUrl ? (
                            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 shrink-0 items-center justify-center transition-transform hover:scale-105">
                                <div
                                    className={cn(
                                        "pointer-events-none absolute inset-0 rounded-full blur-xl animate-pulse",
                                        emblemItem.id === "guild-emblem-5" ? "bg-cyan-500/35" : "bg-amber-500/30"
                                    )}
                                />
                                <Image
                                    src={emblemItem.assetUrl}
                                    alt={emblemItem.name}
                                    fill
                                    unoptimized
                                    sizes="96px"
                                    className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]"
                                />
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-amber-400/80 bg-zinc-950/95 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-amber-400 shadow-xl z-10 backdrop-blur-md">
                                    <Crown className="h-2.5 w-2.5 text-amber-400" /> Nv {guild.level}
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "relative flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black text-[#bd0df2] shadow-2xl backdrop-blur-md",
                                    emblemItem?.cssClass ||
                                        "border-[#bd0df2]/60 text-[#bd0df2] shadow-[0_0_25px_rgba(189,13,242,0.4)]"
                                )}
                            >
                                {renderEmblemIcon(emblemItem?.icon, "h-8 w-8 sm:h-10 sm:w-10")}
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-amber-400/60 bg-zinc-950 px-1.5 py-0.5 text-[9px] font-black text-amber-400 shadow-md z-10">
                                    <Crown className="h-2.5 w-2.5" /> Nv {guild.level}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 sm:gap-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h2 className="truncate text-xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] sm:text-2xl md:text-3xl uppercase">
                                {guild.name}
                            </h2>
                            <span className="inline-flex items-center gap-1 shrink-0 rounded-full border border-[#bd0df2]/50 bg-[#bd0df2]/20 px-2 py-0.5 text-[10px] sm:text-xs font-black text-[#bd0df2] uppercase shadow-[0_0_12px_rgba(189,13,242,0.3)]">
                                <Shield className="h-3 w-3 text-[#bd0df2]" />
                                Guilda
                            </span>
                        </div>

                        {guild.equippedTitle && (
                            <div className="pt-0.5 max-w-full">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-lg backdrop-blur-md transition-all duration-300 max-w-full truncate",
                                        titleItem?.cssClass ||
                                            "border-[#bd0df2]/60 bg-[#bd0df2]/25 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.35)]"
                                    )}
                                >
                                    {renderTitleIcon(titleItem?.icon, "h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0")}
                                    <span className="drop-shadow-sm truncate">{guild.equippedTitle}</span>
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 pt-0.5">
                            <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>
                                {guild.memberCount} membros{" "}
                                <span className="text-zinc-500 font-normal">
                                    ({guild.activeMemberCount} ativos no sorteio)
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Featured Guild Mascot Showcase Card (4 cols) in Frosted Glass Capsule */}
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-3.5 sm:p-4 shadow-xl backdrop-blur-md lg:col-span-4 relative overflow-visible">
                    <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-sm">
                        <Sparkles className="h-4 w-4 text-[#bd0df2] shrink-0 animate-pulse" />
                        <span>Mascote da Sede</span>
                        {mascotItem?.gameTag && (
                            <span className="rounded-full border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                                {mascotItem.gameTag}
                            </span>
                        )}
                    </div>

                    <div className="group relative flex aspect-[3/4] h-44 sm:h-48 w-auto flex-col items-center justify-center rounded-2xl border border-[#bd0df2]/30 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 shadow-[0_0_25px_rgba(189,13,242,0.2)] p-3 overflow-visible">
                        {/* Ambient Pedestal Glow */}
                        <div className="pointer-events-none absolute bottom-4 h-12 w-28 rounded-full bg-[#bd0df2]/25 blur-xl group-hover:bg-[#bd0df2]/40 transition-all" />

                        {/* Interactive Mascot Companion */}
                        {mascotItem ? (
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <GuildMascotCompanion
                                    mascot={mascotItem}
                                    guildLevel={guild.level}
                                    size="sm"
                                    interactive={true}
                                    bubblePosition="top"
                                />
                                <div className="mt-2 flex flex-col items-center">
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow-md text-center">
                                        {mascotItem.name}
                                    </span>
                                    <span className="text-[10px] font-medium text-zinc-400 text-center">
                                        Clique para interagir 🐾
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex aspect-[3/4] h-44 w-auto items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/40 p-4 text-xs font-bold text-zinc-400 uppercase">
                                Nenhum mascote equipado
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Stats Summary & Guild XP Progress (3 cols) in Frosted Glass Capsule */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 shadow-xl backdrop-blur-md lg:col-span-3">
                    {/* Guild XP Progress */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-black tracking-widest uppercase">
                            <span className="text-zinc-300">XP da Guilda</span>
                            <span className="text-[#bd0df2] font-black font-mono">
                                {currentLevelXP.toLocaleString("pt-BR")} / {nextLevelXP.toLocaleString("pt-BR")} XP
                            </span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-950 p-0.5 border border-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-[#bd0df2] shadow-[0_0_12px_rgba(189,13,242,0.6)] transition-all duration-700"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 p-2 text-center shadow-sm">
                            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                                Zerados
                            </span>
                            <span className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                                {stats?.totalCompletedGames ?? 0}
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-xl border border-[#bd0df2]/30 bg-black/40 p-2 text-center shadow-sm">
                            <span className="text-[10px] font-black tracking-widest text-[#bd0df2] uppercase">
                                Potes
                            </span>
                            <span className="text-lg sm:text-xl font-black text-purple-200 drop-shadow-md">
                                {stats?.totalPools ?? 0} 🎲
                            </span>
                        </div>
                    </div>

                    {/* Guild HQ Action Button */}
                    <Link
                        href="/guild"
                        className="group flex items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/40 bg-gradient-to-r from-[#bd0df2]/20 via-[#bd0df2]/10 to-[#bd0df2]/20 py-2.5 px-4 text-xs font-black tracking-widest text-purple-200 uppercase shadow-[0_0_20px_rgba(189,13,242,0.2)] transition-all duration-300 hover:border-[#bd0df2] hover:bg-[#bd0df2]/30 hover:text-white hover:shadow-[0_0_30px_rgba(189,13,242,0.4)] active:scale-95"
                    >
                        <Shield className="h-3.5 w-3.5 text-[#bd0df2] transition-transform duration-300 group-hover:scale-110" />
                        <span>Sede da Guilda</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
