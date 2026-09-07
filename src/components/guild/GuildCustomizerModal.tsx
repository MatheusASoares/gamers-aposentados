"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { X, Shield, Scroll, Image as ImageIcon, Check, Lock, Sparkles, Loader2, Swords, Gamepad2, ShieldCheck, Flame, Crown, Skull } from "lucide-react";
import {
  GUILD_REWARDS_CATALOG,
  GuildRewardItem,
  GuildRewardType,
  isGuildRewardUnlocked,
} from "@/lib/constants/guild-rewards";
import { equipGuildCosmeticsAction } from "@/app/lib/guild-gamification-actions";
import { BannerFxOverlay } from "@/components/profile/banner-fx-overlay";
import { useRouter } from "next/navigation";

interface GuildCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildLevel: number;
  currentBanner: string | null;
  currentEmblem: string | null;
  currentTitle: string | null;
}

export function GuildCustomizerModal({
  isOpen,
  onClose,
  guildLevel,
  currentBanner,
  currentEmblem,
  currentTitle,
}: GuildCustomizerModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GuildRewardType>("BANNER");
  const [selectedBanner, setSelectedBanner] = useState<string | null>(currentBanner);
  const [selectedEmblem, setSelectedEmblem] = useState<string | null>(currentEmblem);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(currentTitle);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRewards = GUILD_REWARDS_CATALOG.filter((r) => r.type === activeTab);

  const getRarityBadge = (rarity: GuildRewardItem["rarity"]) => {
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
        return "border-rose-400/80 bg-gradient-to-r from-rose-950/60 to-purple-950/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]";
    }
  };

  const renderIcon = (type: GuildRewardType, iconName?: string) => {
    if (type === "BANNER") return <ImageIcon className="h-5 w-5 text-cyan-400" />;
    if (type === "TITLE") return <Scroll className="h-5 w-5 text-amber-400" />;

    switch (iconName) {
      case "Shield":
        return <Shield className="h-5 w-5 text-[#bd0df2]" />;
      case "Swords":
        return <Swords className="h-5 w-5 text-[#bd0df2]" />;
      case "Gamepad2":
        return <Gamepad2 className="h-5 w-5 text-amber-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-cyan-400" />;
      case "Flame":
        return <Flame className="h-5 w-5 text-rose-400" />;
      case "Crown":
        return <Crown className="h-5 w-5 text-amber-300" />;
      case "Skull":
        return <Skull className="h-5 w-5 text-purple-400" />;
      default:
        return <Shield className="h-5 w-5 text-[#bd0df2]" />;
    }
  };

  const isSelected = (item: GuildRewardItem) => {
    if (item.type === "EMBLEM") return selectedEmblem === item.name;
    if (item.type === "BANNER") return selectedBanner === item.name || selectedBanner === item.assetUrl;
    if (item.type === "TITLE") return selectedTitle === item.name;
    return false;
  };

  const handleSelectItem = (item: GuildRewardItem) => {
    if (!isGuildRewardUnlocked(item.level, guildLevel)) return;

    if (item.type === "EMBLEM") {
      setSelectedEmblem(selectedEmblem === item.name ? null : item.name);
    } else if (item.type === "BANNER") {
      setSelectedBanner(selectedBanner === item.name ? null : item.name);
    } else if (item.type === "TITLE") {
      setSelectedTitle(selectedTitle === item.name ? null : item.name);
    }
  };

  const handleSave = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await equipGuildCosmeticsAction({
        banner: selectedBanner,
        emblem: selectedEmblem,
        title: selectedTitle,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao salvar customizações.");
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-[#bd0df2]/15">
        {/* Glow Header */}
        <div className="relative flex items-center justify-between border-b border-white/10 bg-zinc-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#bd0df2]/40 bg-[#bd0df2]/15 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.25)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                Armário de Cosméticos da Sede
              </h2>
              <p className="text-xs text-zinc-300 font-medium">
                Personalize a identidade visual e o lema da sua guilda •{" "}
                <span className="font-bold text-amber-400">Nível {guildLevel}/25</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-zinc-900/40 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("BANNER")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "BANNER"
                ? "border-[#bd0df2] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ImageIcon className="h-4 w-4 text-cyan-400" />
            Banners ({GUILD_REWARDS_CATALOG.filter((r) => r.type === "BANNER").length})
          </button>
          <button
            onClick={() => setActiveTab("EMBLEM")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "EMBLEM"
                ? "border-[#bd0df2] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Shield className="h-4 w-4 text-[#bd0df2]" />
            Brasões ({GUILD_REWARDS_CATALOG.filter((r) => r.type === "EMBLEM").length})
          </button>
          <button
            onClick={() => setActiveTab("TITLE")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "TITLE"
                ? "border-[#bd0df2] text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Scroll className="h-4 w-4 text-amber-400" />
            Títulos ({GUILD_REWARDS_CATALOG.filter((r) => r.type === "TITLE").length})
          </button>
        </div>

        {/* Rewards Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map((item) => {
              const unlocked = isGuildRewardUnlocked(item.level, guildLevel);
              const selected = isSelected(item);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                    !unlocked
                      ? "cursor-not-allowed border-zinc-800/40 bg-zinc-900/20 opacity-50"
                      : selected
                      ? "cursor-pointer border-[#bd0df2] bg-[#bd0df2]/15 shadow-[0_0_20px_rgba(189,13,242,0.25)] ring-1 ring-[#bd0df2]/50"
                      : "cursor-pointer border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/90"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getRarityBadge(item.rarity)}`}>
                          {item.rarity}
                        </span>
                        {item.gameTag && (
                          <span className="rounded-md border border-white/10 bg-zinc-800/80 px-1.5 py-0.5 text-xs font-bold text-zinc-300 truncate max-w-[120px]">
                            {item.gameTag}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400 shrink-0">
                        Nv. {item.level}
                      </span>
                    </div>

                    {/* Preview 4:1 Thumbnail */}
                    {item.type === "BANNER" && item.assetUrl ? (
                      <div className="relative aspect-[4/1] w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 my-1">
                        <Image src={item.assetUrl} alt={item.name} fill unoptimized sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <BannerFxOverlay effectType={item.effectType} bannerId={item.id} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-[#bd0df2] shadow-sm">
                          {renderIcon(item.type, item.icon)}
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#bd0df2] transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                      </div>
                    )}

                    {item.type === "BANNER" && (
                      <h4 className="text-sm font-bold text-white group-hover:text-[#bd0df2] transition-colors line-clamp-1">
                        {item.name}
                      </h4>
                    )}

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 italic">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs font-bold">
                    {!unlocked ? (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Lock className="h-3.5 w-3.5" /> Bloqueado (Nv. {item.level})
                      </span>
                    ) : selected ? (
                      <span className="flex items-center gap-1 text-[#bd0df2] font-black uppercase">
                        <Check className="h-4 w-4" /> Selecionado
                      </span>
                    ) : (
                      <span className="text-zinc-400 group-hover:text-zinc-200">
                        Clique para Equipar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-white/10 bg-zinc-900/80 px-6 py-4 gap-3">
          <div className="text-xs text-zinc-300 truncate">
            {selectedBanner && <span className="mr-3">🌌 {selectedBanner}</span>}
            {selectedEmblem && <span className="mr-3">🛡️ {selectedEmblem}</span>}
            {selectedTitle && <span>📜 {selectedTitle}</span>}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[#bd0df2] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(189,13,242,0.4)] hover:bg-[#a60cd5] transition-all disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
