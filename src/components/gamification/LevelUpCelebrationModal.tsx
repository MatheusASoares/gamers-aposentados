"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Shield,
  Compass,
  Swords,
  Crown,
  Flame,
  Sparkles,
  Volume2,
  VolumeX,
  Check,
  ArrowRight,
  Award,
  Image as ImageIcon,
  Palette,
  Sparkle
} from "lucide-react";
import { getRankTierDetails } from "@/app/lib/xp-engine";
import { REWARDS_CATALOG, RewardItem, getNextRewardUnlock } from "@/lib/constants/rewards";
import { LevelUpParticles } from "./LevelUpParticles";
import { playLevelUpAudio } from "./LevelUpAudio";
import {
  equipTitle,
  equipFrame,
  equipBanner,
  equipTheme,
} from "@/app/lib/gamification-actions";

interface LevelUpCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  oldLevel?: number;
  userTheme?: string;
}

export function LevelUpCelebrationModal({
  isOpen,
  onClose,
  newLevel,
  oldLevel = Math.max(1, newLevel - 1),
  userTheme,
}: LevelUpCelebrationModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [activeTheme, setActiveTheme] = useState(userTheme || "cyberpunk");
  const [equippedMap, setEquippedMap] = useState<{ [key: string]: boolean }>({});
  const [isPending, startTransition] = useTransition();

  // Detect theme from DOM if not passed
  useEffect(() => {
    if (typeof document !== "undefined") {
      const domTheme = document.documentElement.getAttribute("data-theme") || "cyberpunk";
      setActiveTheme(userTheme || domTheme);
    }
  }, [userTheme, isOpen]);

  // Trigger Sound & Play Particles on Open
  useEffect(() => {
    if (isOpen) {
      playLevelUpAudio(activeTheme, isMuted);
    }
  }, [isOpen, activeTheme, isMuted]);

  if (!isOpen) return null;

  const tierDetails = getRankTierDetails(newLevel);

  // Unlocked items for this level range
  const unlockedRewards = REWARDS_CATALOG.filter(
    (item) => item.level > oldLevel && item.level <= newLevel
  );

  const nextReward = unlockedRewards.length === 0 ? getNextRewardUnlock(newLevel) : null;

  // Rank Tier Icons
  const renderTierIcon = (iconName: string) => {
    const props = { className: "h-12 w-12 md:h-16 md:w-16 animate-bounce" };
    switch (iconName) {
      case "shield":
        return <Shield {...props} className={`${props.className} text-amber-400`} />;
      case "compass":
        return <Compass {...props} className={`${props.className} text-emerald-400`} />;
      case "swords":
        return <Swords {...props} className={`${props.className} text-cyan-400`} />;
      case "crown":
        return <Crown {...props} className={`${props.className} text-[#bd0df2] drop-shadow-[0_0_20px_rgba(189,13,242,0.8)]`} />;
      case "flame":
        return <Flame {...props} className={`${props.className} text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)]`} />;
      default:
        return <Award {...props} className={`${props.className} text-primary`} />;
    }
  };

  const handleEquip = (item: RewardItem) => {
    startTransition(async () => {
      let res;
      if (item.type === "TITLE") {
        res = await equipTitle(item.name);
      } else if (item.type === "FRAME") {
        res = await equipFrame(item.assetUrl || null);
      } else if (item.type === "BANNER") {
        res = await equipBanner(item.id);
      } else if (item.type === "THEME") {
        res = await equipTheme(item.id);
      }

      if (res?.success) {
        setEquippedMap((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  };

  const cleanTheme = activeTheme.toLowerCase();
  const isMedieval = cleanTheme.includes("medieval");
  const isSpace = cleanTheme.includes("space");
  const isPixel = cleanTheme.includes("pixel");

  // Dynamic Theme Styling Tokens
  let modalBorder = "border-[#bd0df2]/50 shadow-[0_0_60px_rgba(189,13,242,0.35)]";
  let titleGlow = "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-400 drop-shadow-[0_0_25px_rgba(189,13,242,0.6)]";
  let btnPrimary = "bg-gradient-to-r from-[#bd0df2] to-[#06b6d4] hover:from-[#a00ad0] hover:to-[#0891b2] text-white shadow-[0_0_25px_rgba(189,13,242,0.5)]";
  let badgeThemeStyle = "border-[#bd0df2]/40 bg-[#bd0df2]/10 text-fuchsia-300";

  if (isMedieval) {
    modalBorder = "border-amber-600/80 shadow-[0_0_60px_rgba(217,119,6,0.45)]";
    titleGlow = "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]";
    btnPrimary = "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-100 shadow-[0_0_25px_rgba(217,119,6,0.5)] border border-amber-400/50";
    badgeThemeStyle = "border-amber-600/50 bg-amber-950/40 text-amber-300";
  } else if (isSpace) {
    modalBorder = "border-cyan-500/80 shadow-[0_0_60px_rgba(56,189,248,0.45)]";
    titleGlow = "text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]";
    btnPrimary = "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(56,189,248,0.5)] border border-sky-400/50";
    badgeThemeStyle = "border-sky-500/50 bg-sky-950/40 text-sky-300";
  } else if (isPixel) {
    modalBorder = "border-emerald-500 shadow-[0_0_40px_rgba(34,197,94,0.4)]";
    titleGlow = "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300";
    btnPrimary = "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] border-2 border-emerald-400";
    badgeThemeStyle = "border-emerald-500/60 bg-emerald-950/50 text-emerald-300";
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in">
      {/* Fullscreen Backdrop Blur */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Particle Canvas */}
      <LevelUpParticles theme={activeTheme} />

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border bg-zinc-950/95 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl transition-all ${modalBorder}`}
        data-testid="level-up-modal"
      >
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-gradient-to-b from-primary/30 to-transparent blur-[80px]" />

        {/* Audio Toggle in Corner */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white transition"
          title={isMuted ? "Ativar Áudio" : "Mutar Áudio"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-primary" />}
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Header Tag */}
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest ${badgeThemeStyle}`}>
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>Evolução de Gamer</span>
          </div>

          {/* Rank Tier Emblem Display */}
          <div className="relative flex items-center justify-center">
            {/* Halo pulse */}
            <div className="absolute h-28 w-28 rounded-full bg-primary/20 animate-ping opacity-75" />
            <div className="relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full border-2 border-white/15 bg-zinc-900/90 shadow-2xl">
              {renderTierIcon(tierDetails.iconName)}
            </div>
          </div>

          {/* Level Up Main Titles */}
          <div className="space-y-2">
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight ${titleGlow}`}>
              LEVEL UP!
            </h2>
            <div className="flex items-center justify-center gap-3 text-lg sm:text-xl font-bold text-zinc-300">
              <span className="text-zinc-500">Nível {oldLevel}</span>
              <ArrowRight className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-white text-2xl font-black px-3 py-0.5 rounded-lg bg-primary/20 border border-primary/40">
                Nível {newLevel}
              </span>
            </div>
            <p className="text-sm md:text-base font-semibold text-zinc-400 max-w-md mx-auto pt-1">
              Título da Guilda: <span className="text-white font-bold">{tierDetails.name}</span>
            </p>
          </div>

          {/* UNLOCKED REWARDS SHOWCASE */}
          <div className="w-full space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black tracking-wider text-zinc-400 uppercase">
                {unlockedRewards.length > 0 ? "🎁 Recompensas Desbloqueadas" : "🎯 Próximo Marco de Recompensa"}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {unlockedRewards.length > 0 ? `${unlockedRewards.length} item(ns)` : "Em breve"}
              </span>
            </div>

            {unlockedRewards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {unlockedRewards.map((item) => {
                  const isEquipped = equippedMap[item.id];
                  return (
                    <div
                      key={item.id}
                      className="group relative flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/80 p-3 text-left transition hover:border-primary/50 hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-950 text-primary">
                          {item.type === "TITLE" && <Award className="h-5 w-5" />}
                          {item.type === "FRAME" && <ImageIcon className="h-5 w-5" />}
                          {item.type === "BANNER" && <Sparkle className="h-5 w-5" />}
                          {item.type === "THEME" && <Palette className="h-5 w-5" />}
                          {item.type === "BADGE" && <Shield className="h-5 w-5" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{item.type}</p>
                        </div>
                      </div>

                      {item.type !== "BADGE" && (
                        <button
                          type="button"
                          disabled={isPending || isEquipped}
                          onClick={() => handleEquip(item)}
                          className={`ml-2 shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                            isEquipped
                              ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-300"
                              : "bg-white/10 hover:bg-primary hover:text-white text-zinc-200"
                          }`}
                        >
                          {isEquipped ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" /> Equipado
                            </span>
                          ) : (
                            "Equipar"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : nextReward ? (
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-950 text-amber-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Próximo Desbloqueio: {nextReward.name}</p>
                    <p className="text-[10px] text-zinc-400">Liberado no Nível {nextReward.level} ({nextReward.type})</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400/90 px-2 py-1 rounded bg-amber-950/40 border border-amber-600/30">
                  Nível {nextReward.level}
                </span>
              </div>
            ) : null}
          </div>

          {/* Action Button */}
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`w-full rounded-2xl py-3.5 text-sm sm:text-base font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 ${btnPrimary}`}
            >
              Continuar Jogando 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
