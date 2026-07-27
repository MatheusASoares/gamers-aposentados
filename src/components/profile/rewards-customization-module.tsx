"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Trophy, Shield, Lock, Award, Image as ImageIcon, Check, Palette } from "lucide-react";
import { equipTitle, equipFrame, equipBanner, equipTheme } from "@/app/lib/gamification-actions";
import { REWARDS_CATALOG, RewardItem, getTitleBadgeStyle, isRewardUnlocked } from "@/lib/constants/rewards";
import { UserAvatar } from "@/components/ui/user-avatar";
import { renderTitleIcon } from "@/components/ui/title-badge";

interface RewardsCustomizationModuleProps {
  userLevel: number;
  userName: string | null;
  userImage: string | null;
  equippedTitle: string | null;
  equippedFrame: string | null;
  equippedBanner: string | null;
  equippedTheme: string | null;
  isOwner: boolean;
}

export function RewardsCustomizationModule({
  userLevel,
  userName,
  userImage,
  equippedTitle,
  equippedFrame,
  equippedBanner,
  equippedTheme,
  isOwner,
}: RewardsCustomizationModuleProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [activeTab, setActiveTab] = useState<"frames" | "titles" | "banners" | "themes">("frames");
  const [currentTitle, setCurrentTitle] = useState<string | null>(equippedTitle);
  const [currentFrame, setCurrentFrame] = useState<string | null>(equippedFrame);
  const [currentBanner, setCurrentBanner] = useState<string | null>(equippedBanner);
  const [currentTheme, setCurrentTheme] = useState<string | null>(equippedTheme || "cyberpunk");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filter items by type
  const titlesList = REWARDS_CATALOG.filter((item) => item.type === "TITLE");
  const framesList = REWARDS_CATALOG.filter((item) => item.type === "FRAME");
  const bannersList = REWARDS_CATALOG.filter((item) => item.type === "BANNER");
  const themesList = [
    {
      id: "cyberpunk",
      level: 1,
      name: "Cyberpunk Neon (Padrão)",
      description: "Visual futurista com vidro translúcido, roxo elétrico e plasma cyan.",
      rarity: "COMMON" as const,
      colors: ["#bd0df2", "#06b6d4", "#09090b"],
    },
    ...REWARDS_CATALOG.filter((item) => item.type === "THEME").map((item) => ({
      ...item,
      colors:
        item.id === "theme-medieval"
          ? ["#d97706", "#b91c1c", "#120e0b"]
          : item.id === "theme-space"
          ? ["#38bdf8", "#fbbf24", "#030712"]
          : ["#22c55e", "#f59e0b", "#050716"],
    })),
  ];

  const handleEquipTitle = async (title: string) => {
    if (!isOwner) return;
    setLoadingId(title);
    try {
      const res = await equipTitle(title);
      if (res.success) {
        setCurrentTitle(title);
        await updateSession({ equipped_title: title });
        router.refresh();
      } else {
        alert(res.error || "Falha ao equipar título.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleEquipFrame = async (frameUrl: string | null) => {
    if (!isOwner) return;
    setLoadingId(frameUrl || "none");
    try {
      const res = await equipFrame(frameUrl);
      if (res.success) {
        setCurrentFrame(frameUrl);
        await updateSession({ equipped_frame: frameUrl });
        router.refresh();
      } else {
        alert(res.error || "Falha ao equipar moldura.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleEquipBanner = async (bannerId: string | null) => {
    if (!isOwner) return;
    setLoadingId(bannerId || "none");
    try {
      const res = await equipBanner(bannerId);
      if (res.success) {
        setCurrentBanner(bannerId);
        await updateSession({ equipped_banner: bannerId });
        router.refresh();
      } else {
        alert(res.error || "Falha ao equipar banner.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleEquipTheme = async (themeId: string) => {
    if (!isOwner) return;
    setLoadingId(themeId);
    try {
      const res = await equipTheme(themeId);
      if (res.success) {
        setCurrentTheme(themeId);
        await updateSession({ equipped_theme: themeId });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", themeId);
        }
        router.refresh();
      } else {
        alert(res.error || "Falha ao equipar tema.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const getRarityBadge = (rarity: RewardItem["rarity"]) => {
    switch (rarity) {
      case "LEGENDARY":
        return "border-amber-400 bg-amber-500/20 text-amber-300 font-bold";
      case "EPIC":
        return "border-purple-500 bg-purple-500/20 text-purple-300 font-bold";
      case "RARE":
        return "border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold";
      case "UNCOMMON":
        return "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold";
      case "COMMON":
      default:
        return "border-zinc-700 bg-zinc-800 text-zinc-300 font-semibold";
    }
  };

  return (
    <div className="glass-card border border-theme bg-theme-card relative flex flex-col overflow-hidden rounded-[1.5rem] p-6 shadow-2xl backdrop-blur-md">
      {/* Header Row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <h3 className="text-base font-black tracking-widest text-white uppercase">
            Armário de Recompensas & Personalização
          </h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-zinc-900/60 p-1.5">
          <button
            onClick={() => setActiveTab("frames")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "frames"
                ? "bg-[#bd0df2] text-white shadow-[0_0_12px_rgba(189,13,242,0.5)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Bordas ({framesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("titles")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "titles"
                ? "bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Títulos ({titlesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "banners"
                ? "bg-cyan-500 text-zinc-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Banners ({bannersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("themes")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "themes"
                ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Temas ({themesList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BORDAS DE AVATAR */}
      {activeTab === "frames" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Opção Padrão sem borda */}
          <button
            onClick={() => handleEquipFrame(null)}
            disabled={!isOwner || loadingId === "none"}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all ${
              currentFrame === null
                ? "border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                : "border-white/5 bg-zinc-900/40 hover:border-white/20"
            }`}
          >
            <UserAvatar src={userImage} name={userName} size="lg" />
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-black text-white">Sem Moldura</span>
              <span className="text-xs font-semibold text-zinc-400">Visual Padrão</span>
            </div>
            {currentFrame === null && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 uppercase">
                <Check className="h-4 w-4" /> Equipado
              </span>
            )}
          </button>

          {/* Molduras do Catálogo */}
          {framesList.map((item) => {
            const isUnlocked = isRewardUnlocked(item.level, userLevel);
            const isEquipped = currentFrame === item.assetUrl;

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col items-center justify-between gap-3 rounded-2xl border p-5 transition-all ${
                  isEquipped
                    ? "border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                    : isUnlocked
                    ? "border-white/5 bg-zinc-900/40 hover:border-amber-400/40 hover:bg-zinc-900/80"
                    : "border-white/5 bg-zinc-950/40 opacity-50"
                }`}
              >
                <div className="absolute top-3 right-3">
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-black uppercase ${getRarityBadge(
                      item.rarity
                    )}`}
                  >
                    {item.rarity}
                  </span>
                </div>

                <div className="my-3">
                  <UserAvatar
                    src={userImage}
                    name={userName}
                    frameUrl={item.assetUrl}
                    cssFrameClass={!item.assetUrl ? item.cssClass : null}
                    size="lg"
                  />
                </div>

                <div className="flex w-full flex-col items-center gap-2 text-center">
                  <span className="text-sm font-black text-white">{item.name}</span>
                  <p className="line-clamp-2 text-xs font-medium text-zinc-400">
                    {item.description}
                  </p>

                  {isUnlocked ? (
                    <button
                      onClick={() => handleEquipFrame(item.assetUrl || null)}
                      disabled={!isOwner || loadingId === item.assetUrl}
                      className={`mt-2 w-full rounded-xl py-2 text-xs font-black uppercase transition-all ${
                        isEquipped
                          ? "bg-amber-400 text-zinc-950 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                          : "bg-white/10 text-white hover:bg-amber-400 hover:text-zinc-950"
                      }`}
                    >
                      {loadingId === item.assetUrl ? "Salvando..." : isEquipped ? "Equipado ✓" : "Equipar Moldura"}
                    </button>
                  ) : (
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 uppercase">
                      <Lock className="h-4 w-4" /> Desbloqueia no Lvl {item.level}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TÍTULOS */}
      {activeTab === "titles" && (
        <div className="flex flex-wrap gap-4">
          {titlesList.map((item) => {
            const isUnlocked = isRewardUnlocked(item.level, userLevel);
            const isEquipped = currentTitle === item.name;

            if (isUnlocked) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleEquipTitle(item.name)}
                  disabled={!isOwner || loadingId === item.name}
                  className={`flex items-center gap-3 rounded-xl px-5 py-3.5 text-xs font-black uppercase transition-all ${getTitleBadgeStyle(
                    item.name
                  )} ${isEquipped ? "scale-105 ring-2 ring-white/40 shadow-lg" : "opacity-80 hover:opacity-100"}`}
                >
                  {renderTitleIcon(item.name, "h-4 w-4 shrink-0")}
                  <span>{item.name}</span>
                  {isEquipped && <span className="ml-1.5 font-black text-white">✓</span>}
                </button>
              );
            }

            return (
              <div
                key={item.id}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-xl border border-white/5 bg-zinc-950/40 px-5 py-3.5 text-xs font-extrabold text-zinc-600 uppercase opacity-50"
                title={`Desbloqueia no Nível ${item.level}`}
              >
                <Lock className="h-4 w-4 shrink-0 text-zinc-600" />
                <span>{item.name}</span>
                <span className="text-xs font-bold text-zinc-600">(Lvl {item.level})</span>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: BANNERS */}
      {activeTab === "banners" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {bannersList.map((item) => {
            const isUnlocked = isRewardUnlocked(item.level, userLevel);
            const isEquipped = currentBanner === item.id;

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border p-5 transition-all ${
                  isEquipped
                    ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : isUnlocked
                    ? "border-white/5 bg-zinc-900/40 hover:border-cyan-400/40"
                    : "border-white/5 bg-zinc-950/40 opacity-50"
                }`}
              >
                <div className="relative h-32 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  {item.assetUrl ? (
                    <Image
                      src={item.assetUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-purple-900 to-zinc-900 text-xs font-bold text-zinc-400">
                      Preview Indisponível
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-white">{item.name}</span>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-black uppercase ${getRarityBadge(
                      item.rarity
                    )}`}
                  >
                    {item.rarity}
                  </span>
                </div>

                <p className="text-xs font-medium text-zinc-400">{item.description}</p>

                {isUnlocked ? (
                  <button
                    onClick={() => handleEquipBanner(item.id)}
                    disabled={!isOwner || loadingId === item.id}
                    className={`mt-2 w-full rounded-xl py-2.5 text-xs font-black uppercase transition-all ${
                      isEquipped
                        ? "bg-cyan-400 text-zinc-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        : "bg-white/10 text-white hover:bg-cyan-400 hover:text-zinc-950"
                    }`}
                  >
                    {loadingId === item.id ? "Salvando..." : isEquipped ? "Banner Equipado ✓" : "Equipar Banner"}
                  </button>
                ) : (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 uppercase">
                    <Lock className="h-4 w-4" /> Desbloqueia no Lvl {item.level}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: TEMAS DE INTERFACE */}
      {activeTab === "themes" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {themesList.map((item) => {
            const isUnlocked = isRewardUnlocked(item.level, userLevel);
            const isEquipped = currentTheme === item.id;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-all ${
                  isEquipped
                    ? "border-rose-400 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                    : isUnlocked
                    ? "border-white/5 bg-zinc-900/40 hover:border-rose-400/40"
                    : "border-white/5 bg-zinc-950/40 opacity-50"
                }`}
              >
                {/* Palette Swatch Preview */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-white">{item.name}</span>
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-black uppercase ${getRarityBadge(
                        item.rarity
                      )}`}
                    >
                      {item.rarity}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-xs font-medium text-zinc-400">
                    {item.description}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Paleta:</span>
                    <div className="flex items-center gap-1.5">
                      {item.colors.map((c, idx) => (
                        <div
                          key={idx}
                          className="h-5 w-5 rounded-full border border-white/20 shadow-md"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => handleEquipTheme(item.id)}
                    disabled={!isOwner || loadingId === item.id}
                    className={`w-full rounded-xl py-2.5 text-xs font-black uppercase transition-all ${
                      isEquipped
                        ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        : "bg-white/10 text-white hover:bg-rose-500 hover:text-white"
                    }`}
                  >
                    {loadingId === item.id ? "Aplicando..." : isEquipped ? "Tema Ativo ✓" : "Equipar Tema"}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 uppercase">
                    <Lock className="h-4 w-4" /> Desbloqueia no Lvl {item.level}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
