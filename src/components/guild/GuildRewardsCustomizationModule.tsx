"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Shield,
  Scroll,
  Image as ImageIcon,
  Check,
  Lock,
  Sparkles,
  Swords,
  Crown,
  Gamepad2,
  ShieldCheck,
  Flame,
  Skull,
  Loader2,
  Maximize2,
  X,
  Trophy,
  Cat,
  Radio,
  Moon,
  Hourglass,
  Compass,
  Atom,
  Sun,
} from "lucide-react";
import {
  GUILD_REWARDS_CATALOG,
  GuildRewardItem,
  GuildRewardType,
  isGuildRewardUnlocked,
} from "@/lib/constants/guild-rewards";
import { equipGuildCosmeticsAction } from "@/app/lib/guild-gamification-actions";
import { BannerFxOverlay } from "@/components/profile/banner-fx-overlay";
import { GuildMascotCompanion } from "./GuildMascotCompanion";
import { cn } from "@/lib/utils";

interface GuildRewardsCustomizationModuleProps {
  guildLevel: number;
  guildName: string;
  isLeader: boolean;
  equippedBanner: string | null;
  equippedEmblem: string | null;
  equippedTitle: string | null;
  equippedMascot?: string | null;
}

export function GuildRewardsCustomizationModule({
  guildLevel,
  guildName,
  isLeader,
  equippedBanner,
  equippedEmblem,
  equippedTitle,
  equippedMascot,
}: GuildRewardsCustomizationModuleProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GuildRewardType>("MASCOT");
  
  // Current active state
  const [currentEmblem, setCurrentEmblem] = useState<string | null>(equippedEmblem);
  const [currentBanner, setCurrentBanner] = useState<string | null>(equippedBanner);
  const [currentTitle, setCurrentTitle] = useState<string | null>(equippedTitle);
  const [currentMascot, setCurrentMascot] = useState<string | null>(equippedMascot ?? null);

  // Fullscreen inspect modal for banners
  const [inspectBanner, setInspectBanner] = useState<GuildRewardItem | null>(null);

  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const emblemsList = GUILD_REWARDS_CATALOG.filter((i) => i.type === "EMBLEM");
  const bannersList = GUILD_REWARDS_CATALOG.filter((i) => i.type === "BANNER");
  const titlesList = GUILD_REWARDS_CATALOG.filter((i) => i.type === "TITLE");
  const mascotsList = GUILD_REWARDS_CATALOG.filter((i) => i.type === "MASCOT");

  const getRarityStyle = (rarity: GuildRewardItem["rarity"]) => {
    switch (rarity) {
      case "COMMON":
        return "border-zinc-700 bg-zinc-800/80 text-zinc-300";
      case "UNCOMMON":
        return "border-emerald-500/40 bg-emerald-950/40 text-emerald-300";
      case "RARE":
        return "border-cyan-500/40 bg-cyan-950/40 text-cyan-300";
      case "EPIC":
        return "border-[#bd0df2]/50 bg-[#bd0df2]/15 text-[#bd0df2]";
      case "LEGENDARY":
        return "border-amber-400/60 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]";
      case "MYTHIC":
        return "border-rose-400/80 bg-gradient-to-r from-rose-950/60 to-purple-950/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse";
    }
  };

  const renderEmblemIcon = (iconName?: string, className = "h-8 w-8") => {
    switch (iconName) {
      case "Shield":
        return <Shield className={className} />;
      case "Swords":
        return <Swords className={className} />;
      case "Gamepad2":
        return <Gamepad2 className={className} />;
      case "ShieldCheck":
        return <ShieldCheck className={className} />;
      case "Flame":
        return <Flame className={className} />;
      case "Crown":
        return <Crown className={className} />;
      case "Skull":
        return <Skull className={className} />;
      default:
        return <Shield className={className} />;
    }
  };

  const renderTitleIcon = (iconName?: string, className = "h-5 w-5") => {
    switch (iconName) {
      case "Radio":
        return <Radio className={cn(className, "text-emerald-400 shrink-0")} />;
      case "Moon":
        return <Moon className={cn(className, "text-rose-400 shrink-0")} />;
      case "Hourglass":
        return <Hourglass className={cn(className, "text-cyan-400 shrink-0")} />;
      case "Flame":
        return <Flame className={cn(className, "text-orange-400 shrink-0")} />;
      case "Compass":
        return <Compass className={cn(className, "text-amber-400 shrink-0")} />;
      case "Atom":
        return <Atom className={cn(className, "text-cyan-400 shrink-0")} />;
      case "Sun":
        return <Sun className={cn(className, "text-amber-400 shrink-0")} />;
      default:
        return <Scroll className={cn(className, "text-amber-400 shrink-0")} />;
    }
  };

  const handleDirectEquip = (item: GuildRewardItem) => {
    if (!isLeader) return;
    setLoadingName(item.name);
    startTransition(async () => {
      let payload: { banner?: string | null; emblem?: string | null; title?: string | null; mascot?: string | null } = {};
      if (item.type === "BANNER") {
        payload.banner = item.name;
      } else if (item.type === "EMBLEM") {
        payload.emblem = item.name;
      } else if (item.type === "TITLE") {
        payload.title = item.name;
      } else if (item.type === "MASCOT") {
        payload.mascot = item.name;
      }

      const res = await equipGuildCosmeticsAction(payload);
      if (res.success) {
        if (item.type === "BANNER") setCurrentBanner(item.name);
        if (item.type === "EMBLEM") setCurrentEmblem(item.name);
        if (item.type === "TITLE") setCurrentTitle(item.name);
        if (item.type === "MASCOT") setCurrentMascot(item.name);
        router.refresh();
      } else {
        alert(res.error || "Erro ao equipar recompensa.");
      }
      setLoadingName(null);
    });
  };

  return (
    <div
      className="glass-card animate-fade-in-up relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950/90 shadow-2xl p-5 sm:p-7 md:p-8"
      data-testid="guild-rewards-wardrobe"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#bd0df2]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-[100px]" />

      {/* Header Info com Pill Tabs (4 Categorias) */}
      <div className="relative z-10 flex flex-col gap-5 border-b border-white/10 pb-6 mb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.25)]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
              Armário de Recompensas
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              Mascotes vivos, banners cinematográficos, brasões e títulos da guilda.
            </p>
          </div>
        </div>

        {/* Responsive Dual-Paradigm Tabs Navigation (Symmetrical 2x2 on Mobile, Sleek 4x1 on Desktop) */}
        <div className="grid grid-cols-2 gap-1.5 w-full rounded-2xl border border-white/10 bg-zinc-900/90 p-1.5 backdrop-blur-md md:flex md:w-auto md:items-center md:rounded-full">
          <button
            onClick={() => setActiveTab("MASCOT")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl md:rounded-full px-3 sm:px-4 md:px-5 py-2.5 md:py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95",
              activeTab === "MASCOT"
                ? "bg-[#bd0df2] text-white shadow-[0_0_15px_rgba(189,13,242,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Cat className="h-4 w-4 shrink-0" />
            <span>Mascotes ({mascotsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("BANNER")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl md:rounded-full px-3 sm:px-4 md:px-5 py-2.5 md:py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95",
              activeTab === "BANNER"
                ? "bg-[#bd0df2] text-white shadow-[0_0_15px_rgba(189,13,242,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span>Banners ({bannersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("EMBLEM")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl md:rounded-full px-3 sm:px-4 md:px-5 py-2.5 md:py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95",
              activeTab === "EMBLEM"
                ? "bg-[#bd0df2] text-white shadow-[0_0_15px_rgba(189,13,242,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Brasões ({emblemsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("TITLE")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl md:rounded-full px-3 sm:px-4 md:px-5 py-2.5 md:py-2 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95",
              activeTab === "TITLE"
                ? "bg-[#bd0df2] text-white shadow-[0_0_15px_rgba(189,13,242,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Scroll className="h-4 w-4 shrink-0" />
            <span>Títulos ({titlesList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASCOTES DA GUILDA (VIVOS & INTERATIVOS) */}
      {activeTab === "MASCOT" && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mascotsList.map((item) => {
            const isUnlocked = isGuildRewardUnlocked(item.level, guildLevel);
            const isEquipped = currentMascot === item.name || currentMascot === item.assetUrl;
            const isLoading = loadingName === item.name && isPending;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                  !isUnlocked
                    ? "border-zinc-800/40 bg-zinc-900/20 opacity-60"
                    : isEquipped
                    ? "border-[#bd0df2] bg-[#bd0df2]/15 shadow-[0_0_30px_rgba(189,13,242,0.3)] ring-1 ring-[#bd0df2]/60"
                    : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
                )}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", getRarityStyle(item.rarity))}>
                        {item.rarity}
                      </span>
                      {item.gameTag && (
                        <span className="rounded-md border border-[#bd0df2]/40 bg-[#bd0df2]/20 px-2 py-0.5 text-xs font-bold text-[#bd0df2]">
                          🎮 {item.gameTag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Nv. {item.level}
                    </span>
                  </div>

                  {/* Clean Mascot Preview Stage */}
                  <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-zinc-950/70 py-6 px-4 shadow-inner relative">
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-[#bd0df2]/5 to-transparent" />
                    <GuildMascotCompanion
                      key={`wardrobe-mascot-${item.id}`}
                      mascot={item}
                      guildLevel={guildLevel}
                      size="md"
                      interactive={false}
                      animated={false}
                    />
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-white text-center mt-2 truncate">
                    {item.name}
                  </h4>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-2">
                  {!isUnlocked ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-zinc-500 w-full">
                      <Lock className="h-4 w-4" />
                      Bloqueado (Requer Nível {item.level})
                    </div>
                  ) : isEquipped ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/50 bg-[#bd0df2]/20 py-2.5 text-xs font-black uppercase tracking-wider text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.3)] w-full">
                      <Check className="h-4 w-4" />
                      Equipado na Sede
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isLeader || isLoading}
                      onClick={() => handleDirectEquip(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#bd0df2] py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-[#a60cd5] transition-all shadow-[0_0_15px_rgba(189,13,242,0.3)] disabled:opacity-50 w-full"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLeader ? "Equipar Mascote" : "Apenas Líder"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: BANNERS PANORÂMICOS (4:1 Aspect Ratio) */}
      {activeTab === "BANNER" && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bannersList.map((item) => {
            const isUnlocked = isGuildRewardUnlocked(item.level, guildLevel);
            const isEquipped = currentBanner === item.name || currentBanner === item.assetUrl;
            const isLoading = loadingName === item.name && isPending;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300",
                  !isUnlocked
                    ? "border-zinc-800/40 bg-zinc-900/20 opacity-60"
                    : isEquipped
                    ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50"
                    : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
                )}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", getRarityStyle(item.rarity))}>
                        {item.rarity}
                      </span>
                      {item.gameTag && (
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-950/40 px-2 py-0.5 text-xs font-bold text-cyan-300">
                          🎮 {item.gameTag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Nv. {item.level}
                    </span>
                  </div>

                  {/* Panoramic 4:1 Banner Card */}
                  <div className="group relative aspect-[4/1] w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 my-2 shadow-inner">
                    {item.assetUrl ? (
                      <>
                        <Image
                          src={item.assetUrl}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <BannerFxOverlay effectType={item.effectType} bannerId={item.id} />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500">
                        <ImageIcon className="h-8 w-8 opacity-40" />
                      </div>
                    )}

                    {/* Zoom / Fullscreen HD Inspector Button */}
                    <button
                      type="button"
                      onClick={() => setInspectBanner(item)}
                      className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md hover:bg-black/80"
                      title="Visualizar em Tela Cheia"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>HD</span>
                    </button>

                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <span className="text-sm font-black uppercase tracking-wider text-white drop-shadow-md">
                        {item.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                  {!isUnlocked ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-zinc-500 w-full">
                      <Lock className="h-4 w-4" />
                      Bloqueado (Requer Nível {item.level})
                    </div>
                  ) : isEquipped ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-950/40 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] w-full">
                      <Check className="h-4 w-4" />
                      Equipado na Sede
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isLeader || isLoading}
                      onClick={() => handleDirectEquip(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#bd0df2] py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-[#a60cd5] transition-all shadow-[0_0_15px_rgba(189,13,242,0.3)] disabled:opacity-50 w-full"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLeader ? "Equipar na Sede" : "Apenas Líder"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: BRASÕES DE HONRA (EMBLEMS) */}
      {activeTab === "EMBLEM" && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {emblemsList.map((item) => {
            const isUnlocked = isGuildRewardUnlocked(item.level, guildLevel);
            const isEquipped = currentEmblem === item.name;
            const isLoading = loadingName === item.name && isPending;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300",
                  !isUnlocked
                    ? "border-zinc-800/40 bg-zinc-900/20 opacity-60"
                    : isEquipped
                    ? "border-[#bd0df2] bg-[#bd0df2]/15 shadow-[0_0_25px_rgba(189,13,242,0.25)] ring-1 ring-[#bd0df2]/50"
                    : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", getRarityStyle(item.rarity))}>
                        {item.rarity}
                      </span>
                      {item.gameTag && (
                        <span className="rounded-md border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-300">
                          🎮 {item.gameTag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Nv. {item.level}
                    </span>
                  </div>

                  {/* Emblem Showcase Frame */}
                  <div className="my-4 flex items-center justify-center min-h-[140px]">
                    {item.assetUrl ? (
                      <div className="relative h-28 w-28 sm:h-32 sm:w-32 transition-transform duration-300 hover:scale-110">
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-amber-500/25 blur-2xl animate-pulse" />
                        <Image
                          src={item.assetUrl}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="140px"
                          className="object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.9)] drop-shadow-[0_0_18px_rgba(245,158,11,0.45)]"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl border-2 bg-zinc-950 shadow-xl transition-transform hover:scale-105 overflow-hidden",
                          item.cssClass || "border-zinc-700 text-zinc-300"
                        )}
                      >
                        {renderEmblemIcon(item.icon, "h-12 w-12 sm:h-14 sm:w-14")}
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white text-center mt-2 truncate">
                    {item.name}
                  </h4>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                  {!isUnlocked ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-zinc-500 w-full">
                      <Lock className="h-4 w-4" />
                      Bloqueado (Requer Nível {item.level})
                    </div>
                  ) : isEquipped ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-[#bd0df2]/50 bg-[#bd0df2]/20 py-2.5 text-xs font-black uppercase tracking-wider text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.3)] w-full">
                      <Check className="h-4 w-4" />
                      Equipado na Sede
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isLeader || isLoading}
                      onClick={() => handleDirectEquip(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#bd0df2] py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-[#a60cd5] transition-all shadow-[0_0_15px_rgba(189,13,242,0.3)] disabled:opacity-50 w-full"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLeader ? "Equipar na Sede" : "Apenas Líder"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: TÍTULOS DE HONRA (TITLES) */}
      {activeTab === "TITLE" && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {titlesList.map((item) => {
            const isUnlocked = isGuildRewardUnlocked(item.level, guildLevel);
            const isEquipped = currentTitle === item.name;
            const isLoading = loadingName === item.name && isPending;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300",
                  !isUnlocked
                    ? "border-zinc-800/40 bg-zinc-900/20 opacity-60"
                    : isEquipped
                    ? "border-white/40 bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.15)] ring-1 ring-white/30"
                    : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", getRarityStyle(item.rarity))}>
                        {item.rarity}
                      </span>
                      {item.gameTag && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-bold text-zinc-300">
                          🎮 {item.gameTag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300">
                      Nv. {item.level}
                    </span>
                  </div>

                  {/* Title Custom Game-Authentic Showcase Badge */}
                  <div className="my-5 flex flex-col items-center justify-center min-h-[100px] rounded-2xl border border-white/5 bg-zinc-950/70 p-4 shadow-inner relative overflow-hidden">
                    <div className={cn(
                      "inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-black uppercase tracking-wider backdrop-blur-md transition-all duration-300 hover:scale-105 text-center",
                      item.cssClass || "border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    )}>
                      {renderTitleIcon(item.icon, "h-5 w-5")}
                      <span className="drop-shadow-md">{item.name}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                  {!isUnlocked ? (
                    <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-zinc-500 w-full">
                      <Lock className="h-4 w-4" />
                      Bloqueado (Requer Nível {item.level})
                    </div>
                  ) : isEquipped ? (
                    <div className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black uppercase tracking-wider shadow-lg w-full",
                      item.cssClass || "border-amber-400/50 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    )}>
                      <Check className="h-4 w-4" />
                      Equipado na Sede
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isLeader || isLoading}
                      onClick={() => handleDirectEquip(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 py-2.5 px-4 text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-md disabled:opacity-50 w-full"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-950" /> : isLeader ? "Equipar na Sede" : "Apenas Líder"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN HD BANNER INSPECTION MODAL */}
      {inspectBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-zinc-950 shadow-2xl shadow-[#bd0df2]/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", getRarityStyle(inspectBanner.rarity))}>
                  {inspectBanner.rarity}
                </span>
                {inspectBanner.gameTag && (
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-950/40 px-2 py-0.5 text-xs font-bold text-cyan-300">
                    🎮 {inspectBanner.gameTag}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-black uppercase text-white">
                  {inspectBanner.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectBanner(null)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal 4:1 Cinematic Preview with Live Particles */}
            <div className="relative aspect-[4/1] w-full overflow-hidden bg-black">
              {inspectBanner.assetUrl && (
                <>
                  <Image
                    src={inspectBanner.assetUrl}
                    alt={inspectBanner.name}
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                  <BannerFxOverlay
                    effectType={inspectBanner.effectType}
                    bannerId={inspectBanner.id}
                  />
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/10 bg-zinc-900/90 p-6">
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-mono font-bold text-zinc-400">
                  Desbloqueado no Nível {inspectBanner.level} da Guilda
                </span>
                <p className="text-xs sm:text-sm text-zinc-200 italic">
                  {inspectBanner.description}
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setInspectBanner(null)}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition-all"
                >
                  Fechar
                </button>
                {isLeader && isGuildRewardUnlocked(inspectBanner.level, guildLevel) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDirectEquip(inspectBanner);
                      setInspectBanner(null);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#bd0df2] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(189,13,242,0.4)] hover:bg-[#a60cd5] transition-all"
                  >
                    <Check className="h-4 w-4" />
                    Equipar na Sede
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
