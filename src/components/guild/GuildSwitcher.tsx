"use client";

import { useState } from "react";
import {
    Shield,
    ChevronDown,
    Plus,
    Link2,
    Check,
    Users,
    Sparkles,
    Landmark,
    Crown,
    Swords,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type GuildSummaryDTO, switchActiveGuild } from "@/app/lib/guild-actions";
import { GUILD_REWARDS_CATALOG } from "@/lib/constants/guild-rewards";
import { CreateGuildModal } from "./CreateGuildModal";
import { JoinGuildModal } from "./JoinGuildModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GuildSwitcherProps {
    activeGuild: GuildSummaryDTO | null;
    userGuilds: GuildSummaryDTO[];
}

export function GuildSwitcher({ activeGuild, userGuilds }: GuildSwitcherProps) {
    const router = useRouter();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);

    const emblemReward = activeGuild?.equippedEmblem
        ? GUILD_REWARDS_CATALOG.find(
              (r) =>
                  r.type === "EMBLEM" &&
                  (r.name === activeGuild.equippedEmblem ||
                      r.assetUrl === activeGuild.equippedEmblem ||
                      r.id === activeGuild.equippedEmblem)
          )
        : GUILD_REWARDS_CATALOG.find(
              (r) => r.type === "EMBLEM" && r.level <= Math.max(1, activeGuild?.level ?? 1)
          ) || null;

    const emblemAssetUrl =
        emblemReward?.assetUrl ||
        (activeGuild?.equippedEmblem?.startsWith("/") ? activeGuild.equippedEmblem : null);

    const handleSwitch = async (guildId: string) => {
        if (activeGuild?.id === guildId) return;
        setIsSwitching(true);
        try {
            const res = await switchActiveGuild(guildId);
            if (res.success) {
                router.refresh();
            }
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        disabled={isSwitching}
                        className={cn(
                            "flex items-center justify-between gap-2 sm:gap-2.5 rounded-xl border border-white/10 bg-theme-card/90 px-2.5 sm:px-3.5 py-1.5 backdrop-blur-md transition-all hover:border-theme-primary/60 hover:bg-theme-card active:scale-95 focus:outline-none shadow-lg w-full max-w-[200px] sm:max-w-[280px] md:max-w-[340px]",
                            activeGuild ? "shadow-[0_0_20px_rgba(0,0,0,0.6)]" : "border-dashed border-zinc-700 text-zinc-400"
                        )}
                        title="Alternar Guilda Ativa"
                    >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                            {/* Miniature Guild Emblem Crest Box */}
                            <div className="relative flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg border border-theme-primary/40 bg-theme-card text-theme-primary shadow-[0_0_10px_var(--theme-glow)] overflow-hidden">
                                {emblemAssetUrl ? (
                                    <Image
                                        src={emblemAssetUrl}
                                        alt="Brasão da Guilda"
                                        fill
                                        unoptimized
                                        sizes="28px"
                                        className="object-contain p-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                    />
                                ) : (
                                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 drop-shadow-[0_0_8px_var(--theme-glow)]" />
                                )}
                            </div>

                            {activeGuild ? (
                                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate max-w-full">
                                        {activeGuild.name}
                                    </span>
                                    <span className="hidden sm:flex text-[11px] font-bold text-zinc-300 uppercase tracking-wider items-center gap-1.5 mt-0.5">
                                        {activeGuild.myRole === "LEADER" ? (
                                            <span className="text-amber-400 font-black flex items-center gap-1">
                                                <Crown className="h-3 w-3 inline" /> Líder
                                            </span>
                                        ) : (
                                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                                                <Swords className="h-3 w-3 inline" /> Membro
                                            </span>
                                        )}
                                        <span className="text-zinc-500">•</span>
                                        <span>{activeGuild.memberCount} {activeGuild.memberCount === 1 ? "membro" : "membros"}</span>
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs sm:text-sm font-bold text-zinc-300 uppercase tracking-wider truncate">
                                    Criar / Entrar
                                </span>
                            )}
                        </div>

                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-zinc-400 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="center"
                    sideOffset={8}
                    className="w-[calc(100vw-24px)] max-w-sm border border-theme bg-theme-card p-2.5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] shadow-[0_0_25px_var(--theme-glow)] z-[70] rounded-2xl animate-fade-in"
                >
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                        <span>Minhas Guildas</span>
                        <span className="font-mono text-amber-400 font-bold">({userGuilds.length})</span>
                    </DropdownMenuLabel>

                    <div className="max-h-64 overflow-y-auto space-y-1.5 p-1">
                        {userGuilds.map((g) => {
                            const isCurrent = g.id === activeGuild?.id;
                            return (
                                <DropdownMenuItem
                                    key={g.id}
                                    onClick={() => handleSwitch(g.id)}
                                    className={cn(
                                        "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all",
                                        isCurrent
                                            ? "bg-theme-primary/20 border border-theme-primary/50 text-white font-bold shadow-[0_0_15px_var(--theme-glow)]"
                                            : "text-zinc-300 hover:bg-theme-primary/10 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                                            isCurrent ? "border-theme-primary bg-theme-primary/20 text-theme-primary" : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                        )}>
                                            <Shield className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs sm:text-sm font-black uppercase truncate">{g.name}</span>
                                            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                                                <span className="text-amber-400 font-bold">Nv {g.level}</span> • {g.memberCount} membros {g.myRole === "LEADER" && "• 👑 Líder"}
                                            </span>
                                        </div>
                                    </div>
                                    {isCurrent && <Check className="h-4 w-4 shrink-0 text-cyan-400 font-black" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </div>

                    <DropdownMenuSeparator className="bg-zinc-800/80 my-1.5" />

                    {/* Quick Access to Guild HQ */}
                    {activeGuild && (
                        <DropdownMenuItem asChild>
                            <Link
                                href="/guild"
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-theme-primary hover:bg-theme-primary/15 hover:text-white transition-all cursor-pointer"
                            >
                                <Landmark className="h-4 w-4" />
                                <span>Acessar Sede da Guilda</span>
                            </Link>
                        </DropdownMenuItem>
                    )}

                    {/* Action buttons to Join / Create */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 pt-1.5 border-t border-zinc-800/80 mt-1">
                        <button
                            type="button"
                            onClick={() => setIsJoinOpen(true)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-theme-primary hover:text-white transition-all active:scale-95"
                        >
                            <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                            Entrar
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-theme-primary/50 bg-theme-primary/20 px-2.5 py-2 text-xs font-black uppercase text-theme-primary hover:bg-theme-primary/30 hover:text-white transition-all active:scale-95 shadow-[0_0_12px_var(--theme-glow)]"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Criar
                        </button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Modals */}
            <CreateGuildModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
            <JoinGuildModal
                isOpen={isJoinOpen}
                onClose={() => setIsJoinOpen(false)}
            />
        </>
    );
}
