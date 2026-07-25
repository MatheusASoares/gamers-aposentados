"use client";

import { useState } from "react";
import { Trophy, Shield, Lock, Compass, Swords, Crown, Flame } from "lucide-react";
import { equipTitle } from "@/app/lib/gamification-actions";
import { RANK_TIERS, RankTier } from "@/app/lib/xp-engine";

interface RankTitlesSwitcherProps {
    userLevel: number;
    equippedTitle: string | null;
    isOwner: boolean;
}

export function RankTitlesSwitcher({
    userLevel,
    equippedTitle,
    isOwner,
}: RankTitlesSwitcherProps) {
    const [currentEquippedTitle, setCurrentEquippedTitle] = useState<string>(
        equippedTitle || RANK_TIERS[0].name
    );

    const handleEquipTitle = async (newTitle: string) => {
        if (!isOwner) return;
        try {
            const res = await equipTitle(newTitle);
            if (res.success) {
                setCurrentEquippedTitle(newTitle);
            } else {
                alert(res.error || "Failed to equip title.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderRankIcon = (iconName: string, className: string) => {
        switch (iconName) {
            case "compass":
                return <Compass className={className} />;
            case "swords":
                return <Swords className={className} />;
            case "crown":
                return <Crown className={className} />;
            case "flame":
                return <Flame className={className} />;
            case "shield":
            default:
                return <Shield className={className} />;
        }
    };

    return (
        <div className="glass-card relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/5 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase">
                        Rank Titles Desbloqueados
                    </h3>
                </div>
                <span className="text-xs font-bold text-zinc-400">
                    Equipado: <strong className="text-amber-300">{currentEquippedTitle}</strong>
                </span>
            </div>

            {/* Render ALL Rank Tiers (Unlocked & Locked) */}
            <div className="flex flex-wrap gap-3">
                {RANK_TIERS.map((tier: RankTier) => {
                    const isUnlocked = userLevel >= tier.minLevel;
                    const isSelected = tier.name === currentEquippedTitle;

                    if (isUnlocked) {
                        return (
                            <button
                                key={tier.id}
                                onClick={() => handleEquipTitle(tier.name)}
                                disabled={!isOwner}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase transition-all ${
                                    isSelected
                                        ? "scale-105 border border-amber-400 bg-amber-500/25 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.35)]"
                                        : `${tier.badgeClass} hover:scale-102 hover:brightness-125`
                                }`}
                            >
                                {renderRankIcon(tier.iconName, "h-4 w-4")}
                                <span>{tier.name}</span>
                                {isSelected && (
                                    <span className="ml-1 font-black text-amber-300">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    }

                    {/* Locked Rank Titles */}
                    return (
                        <div
                            key={tier.id}
                            className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/5 bg-zinc-950/40 px-4 py-2.5 text-xs font-extrabold text-zinc-600 uppercase opacity-50"
                            title={`Desbloqueia no Nível ${tier.minLevel}`}
                        >
                            <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            <span>{tier.name}</span>
                            <span className="text-xs font-bold text-zinc-600">
                                (Lvl {tier.minLevel})
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
