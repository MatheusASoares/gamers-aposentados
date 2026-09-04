"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Shield,
    Crown,
    Copy,
    Check,
    Settings,
    LogOut,
    Sparkles,
    Trophy,
    Dices,
    Users,
    Gamepad2,
    Swords,
    ShieldCheck,
    Flame,
    Skull,
    Radio,
    Moon,
    Hourglass,
    Compass,
    Atom,
    Scroll,
} from "lucide-react";
import { type ActiveGuildDetailsDTO, leaveGuild } from "@/app/lib/guild-actions";
import { GuildSettingsModal } from "./GuildSettingsModal";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getGuildLevelProgress } from "@/lib/guild-xp-engine";
import { GUILD_REWARDS_CATALOG } from "@/lib/constants/guild-rewards";
import { BannerFxOverlay } from "@/components/profile/banner-fx-overlay";
import { GuildMascotCompanion } from "./GuildMascotCompanion";

interface GuildHeaderProps {
    guild: ActiveGuildDetailsDTO;
    stats: {
        totalCompletedGames: number;
        totalPools: number;
        totalHoursPlayed: number;
        totalMembers: number;
    };
    currentUserId: string;
}

export function GuildHeader({ guild, stats, currentUserId }: GuildHeaderProps) {
    const router = useRouter();
    const isLeader = guild.myRole === "LEADER";
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [bannerError, setBannerError] = useState(false);

    // XP calculation via guild engine (adapted to active members)
    const activeMembers = Math.max(2, guild.members.filter((m) => m.isActive).length);
    const { nextLevelXP, progressPercentage } = getGuildLevelProgress(guild.xpPoints, guild.level, activeMembers);

    // Find equipped cosmetics with reliable fallback
    const bannerItem = guild.equippedBanner
        ? GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER" && (r.name === guild.equippedBanner || r.assetUrl === guild.equippedBanner || r.id === guild.equippedBanner))
        : GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER" && r.level <= Math.max(3, guild.level)) || GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER");

    const emblemItem = guild.equippedEmblem
        ? GUILD_REWARDS_CATALOG.find((r) => r.type === "EMBLEM" && (r.name === guild.equippedEmblem || r.id === guild.equippedEmblem))
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
        : GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT" && r.level <= Math.max(2, guild.level)) || GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT") || null;

    const titleItem = guild.equippedTitle
        ? GUILD_REWARDS_CATALOG.find((r) => r.type === "TITLE" && (r.name === guild.equippedTitle || r.id === guild.equippedTitle))
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

    const handleCopyInvite = () => {
        const url = `${window.location.origin}/invite/${guild.inviteCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleLeave = async () => {
        if (!confirm("Tem certeza que deseja sair desta guilda?")) return;
        setIsLeaving(true);
        try {
            const res = await leaveGuild(guild.id);
            if (res.success) {
                router.push("/");
                router.refresh();
            } else {
                alert(res.error || "Erro ao sair da guilda.");
            }
        } finally {
            setIsLeaving(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* 1. HERO CARD: 3-Column Guild Showcase (Proporção igualada com o Hall of Fame) */}
            <div
                className={cn(
                    "glass-card animate-fade-in-up relative flex flex-col justify-center min-h-[260px] md:min-h-[320px] lg:min-h-[340px] overflow-hidden rounded-[1.5rem] border border-white/15 shadow-2xl p-4 sm:p-6 md:p-8",
                    !bannerItem?.assetUrl && "bg-zinc-950/80"
                )}
                data-testid="guild-hq-hero"
            >
                {/* Equipped Ambient Banner Image with Live Particle Overlays */}
                {bannerItem?.assetUrl && !bannerError && (
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                        <Image
                            src={bannerItem.assetUrl}
                            alt={bannerItem.name || "Banner da Sede"}
                            fill
                            priority
                            unoptimized
                            onError={() => setBannerError(true)}
                            sizes="100vw"
                            className="object-cover object-center opacity-95 transition-all duration-700 hover:scale-105"
                        />
                        {/* Luminous Cinematic Vignette (Subtle edge darkening while keeping central art crystal clear) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-black/20 to-black/30" />
                        <BannerFxOverlay effectType={bannerItem.effectType} bannerId={bannerItem.id} />
                    </div>
                )}

                {/* Ambient Glow Orbs */}
                <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#bd0df2]/20 blur-[120px]" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-[100px]" />

                {/* 3-Column Grid: Left (Crest + Guild Name) | Center (Guild XP & Level) | Right (Invite, Mascot & Actions) */}
                <div className="relative z-10 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:items-center">
                    
                    {/* COLUMN 1: LEFT - Guild Crest & Name (5 cols) in Frosted Glass Capsule */}
                    <div className="flex items-center gap-3 sm:gap-5 lg:gap-6 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 sm:p-5 backdrop-blur-md shadow-xl lg:col-span-5 min-w-0">
                        {/* Emblem Crest - Freestanding 3D Shield / Crossed Swords */}
                        {emblemItem?.assetUrl ? (
                            <div className="relative flex h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 shrink-0 items-center justify-center transition-transform hover:scale-105">
                                <div className={cn(
                                    "pointer-events-none absolute inset-0 rounded-full blur-xl sm:blur-2xl animate-pulse",
                                    emblemItem.id === "guild-emblem-5" ? "bg-cyan-500/35" : "bg-amber-500/30"
                                )} />
                                <Image
                                    src={emblemItem.assetUrl}
                                    alt={emblemItem.name}
                                    fill
                                    unoptimized
                                    sizes="(max-width: 640px) 64px, (max-width: 1024px) 96px, 128px"
                                    className={cn(
                                        "object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]",
                                        emblemItem.id === "guild-emblem-5"
                                            ? "drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                                            : "drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]"
                                    )}
                                />
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-amber-400/80 bg-zinc-950/95 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-xs font-black text-amber-400 shadow-xl z-10 backdrop-blur-md">
                                    <Crown className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> Nv {guild.level}
                                </div>
                            </div>
                        ) : (
                            <div className={cn(
                                "relative flex h-16 w-16 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black text-[#bd0df2] shadow-2xl backdrop-blur-md",
                                emblemItem?.cssClass || "border-[#bd0df2]/60 text-[#bd0df2] shadow-[0_0_25px_rgba(189,13,242,0.4)]"
                            )}>
                                {renderEmblemIcon(emblemItem?.icon, "h-8 w-8 sm:h-12 sm:w-12")}
                                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-amber-400/60 bg-zinc-950 px-1.5 py-0.5 text-[9px] sm:text-xs font-black text-amber-400 shadow-md z-10">
                                    <Crown className="h-2.5 w-2.5" /> Nv {guild.level}
                                </div>
                            </div>
                        )}

                        {/* Guild Title & Description */}
                        <div className="flex flex-col gap-1 sm:gap-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,1)] uppercase break-words leading-tight">
                                    {guild.name}
                                </h1>
                            </div>

                            {guild.equippedTitle && (
                                <div className="pt-0.5 max-w-full">
                                    <span className={cn(
                                        "inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider shadow-lg backdrop-blur-md transition-all duration-300 max-w-full truncate",
                                        titleItem?.cssClass || "border-[#bd0df2]/60 bg-[#bd0df2]/25 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.35)]"
                                    )}>
                                        {renderTitleIcon(titleItem?.icon, "h-3 w-3 sm:h-4 sm:w-4 shrink-0")}
                                        <span className="drop-shadow-sm truncate">{guild.equippedTitle}</span>
                                    </span>
                                </div>
                            )}

                            {guild.description && (
                                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed pt-0.5">
                                    {guild.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 2: CENTER - Guild XP Progress Card (4 cols) */}
                    <div className="flex flex-col justify-center gap-3 lg:col-span-4">
                        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 sm:p-5 shadow-xl backdrop-blur-md">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-black tracking-wider uppercase">
                                <span className="text-zinc-300 drop-shadow-sm flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-[#bd0df2]" />
                                    Progresso da Guilda
                                </span>
                                <span className="text-[#bd0df2] font-black drop-shadow-sm font-mono">
                                    {guild.xpPoints.toLocaleString()} / {nextLevelXP.toLocaleString()} XP ({progressPercentage}%)
                                </span>
                            </div>
                            <div className="h-3.5 w-full overflow-hidden rounded-full bg-zinc-950 p-0.5 border border-white/10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#bd0df2] via-purple-500 to-cyan-400 shadow-[0_0_12px_#bd0df2] transition-all duration-700"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-zinc-400">
                                <span>Total: {guild.xpPoints.toLocaleString()} XP</span>
                                <span>Próximo nível em {Math.max(0, nextLevelXP - guild.xpPoints).toLocaleString()} XP</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 3: RIGHT - Invite Widget & Actions (3 cols) */}
                    <div className="flex flex-col justify-center gap-3 lg:col-span-3">
                        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 shadow-xl backdrop-blur-md">
                            {/* Invite Code Row */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                                        Código de Convite
                                    </span>
                                    <span className="font-mono text-sm sm:text-base font-black text-amber-400 tracking-wider">
                                        {guild.inviteCode}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyInvite}
                                    className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/90 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-[#bd0df2] hover:text-white transition-all active:scale-95 shadow-sm"
                                    title="Copiar link de convite"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            <span>Copiar</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Actions Buttons */}
                            {isLeader ? (
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/50 bg-[#bd0df2]/25 py-2 px-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#bd0df2]/40 transition-all shadow-[0_0_15px_rgba(189,13,242,0.3)] active:scale-95"
                                >
                                    <Settings className="h-3.5 w-3.5 text-[#bd0df2]" />
                                    <span>Editar Informações</span>
                                </button>
                            ) : (
                                !guild.isOwner && (
                                    <button
                                        type="button"
                                        disabled={isLeaving}
                                        onClick={handleLeave}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 py-2 px-3 text-xs font-black uppercase tracking-wider text-red-300 hover:bg-red-900/60 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>{isLeaving ? "Saindo..." : "Sair da Guilda"}</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CONSOLIDATED STATS GRID (Dual-Paradigm: 4x1 Desktop, 2x2 Mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Stat 1: Games Completed */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 sm:p-6 backdrop-blur-md flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-all">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.25)]">
                        <Gamepad2 className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                            Jogos Zerados
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white">
                            {stats.totalCompletedGames}
                        </span>
                    </div>
                </div>

                {/* Stat 2: Pools Closed */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 sm:p-6 backdrop-blur-md flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-all">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-[#bd0df2]/40 bg-[#bd0df2]/15 text-[#bd0df2] shadow-[0_0_18px_rgba(189,13,242,0.25)]">
                        <Dices className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                            Potes da Guilda
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white">
                            {stats.totalPools}
                        </span>
                    </div>
                </div>

                {/* Stat 3: Members Active */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 sm:p-6 backdrop-blur-md flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-all">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.25)]">
                        <Users className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                            Membros Ativos
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white">
                            {guild.activeMemberCount} <span className="text-sm font-normal text-zinc-500">/ {guild.memberCount}</span>
                        </span>
                    </div>
                </div>

                {/* Stat 4: Total Platinums */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 sm:p-6 backdrop-blur-md flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-all">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)]">
                        <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                            Platinas do Grupo
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-white">
                            {stats.totalHoursPlayed} 🏆
                        </span>
                    </div>
                </div>
            </div>

            {/* Guild Settings Modal */}
            <GuildSettingsModal
                guild={guild}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}
