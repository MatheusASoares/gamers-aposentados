"use client";

import { useState } from "react";
import {
    Crown,
    Swords,
    Shield,
    Check,
    X,
    MoreVertical,
    UserMinus,
    ArrowUpCircle,
    ArrowDownCircle,
    Loader2,
    Sparkles,
} from "lucide-react";
import {
    toggleMemberActiveStatus,
    promoteMember,
    kickMember,
    type ActiveGuildDetailsDTO,
} from "@/app/lib/guild-actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GuildRosterProps {
    guild: ActiveGuildDetailsDTO;
    currentUserId: string;
}

interface MemberToKick {
    userId: string;
    name: string;
    image: string | null;
    role: string;
    level: number;
}

export function GuildRoster({ guild, currentUserId }: GuildRosterProps) {
    const router = useRouter();
    const isLeader = guild.myRole === "LEADER";
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
    const [memberToKick, setMemberToKick] = useState<MemberToKick | null>(null);
    const [isKicking, setIsKicking] = useState(false);

    const handleToggleActive = async (targetUserId: string, currentActive: boolean) => {
        if (!isLeader) return;
        setLoadingUserId(targetUserId);
        try {
            await toggleMemberActiveStatus(guild.id, targetUserId, !currentActive);
            router.refresh();
        } finally {
            setLoadingUserId(null);
        }
    };

    const handlePromote = async (targetUserId: string, newRole: "LEADER" | "MEMBER") => {
        setLoadingUserId(targetUserId);
        try {
            await promoteMember(guild.id, targetUserId, newRole);
            router.refresh();
        } finally {
            setLoadingUserId(null);
        }
    };

    const handleConfirmKick = async () => {
        if (!memberToKick) return;
        setIsKicking(true);
        setLoadingUserId(memberToKick.userId);
        try {
            await kickMember(guild.id, memberToKick.userId);
            setMemberToKick(null);
            router.refresh();
        } catch (error) {
            console.error("Erro ao expulsar membro:", error);
        } finally {
            setIsKicking(false);
            setLoadingUserId(null);
        }
    };

    return (
        <div className="rounded-2xl border border-theme bg-zinc-950/70 p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <Swords className="h-5 w-5 text-[#bd0df2]" />
                        Quartel de Membros ({guild.members.length})
                    </h2>
                    <p className="text-xs text-zinc-400">
                        {isLeader
                            ? "Como Líder, você pode gerenciar cargos e ativar/desativar membros nas cotas do Randomizer."
                            : "Membros do seu esquadrão."}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        {guild.activeMemberCount} Ativos no Randomizer
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-bold text-zinc-400">
                        {guild.members.length - guild.activeMemberCount} Espectadores
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {guild.members.map((m) => {
                    const isSelf = m.userId === currentUserId;
                    const isLoading = loadingUserId === m.userId;

                    return (
                        <div
                            key={m.id}
                            className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 sm:p-4 transition-all",
                                m.isActive
                                    ? "border-zinc-800/90 bg-zinc-900/60 hover:border-zinc-700"
                                    : "border-zinc-850 bg-zinc-950/40 opacity-75 hover:opacity-100"
                            )}
                        >
                            {/* Member Identity */}
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                                    {m.image ? (
                                        <Image
                                            src={m.image}
                                            alt={m.name}
                                            fill
                                            sizes="44px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm font-black text-zinc-400">
                                            {m.name.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-zinc-950/90 px-1 text-[8px] font-black text-amber-400 border-t border-l border-zinc-800">
                                        Nv{m.level}
                                    </div>
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white truncate">
                                            {m.name}
                                        </span>
                                        {isSelf && (
                                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-black text-zinc-400 uppercase">
                                                Você
                                            </span>
                                        )}
                                        {m.role === "LEADER" ? (
                                            <span className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                                                <Crown className="h-3 w-3" /> Líder
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                <Swords className="h-3 w-3 text-zinc-500" /> Membro
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        {m.equippedTitle ? (
                                            <span className="text-[11px] font-bold text-[#bd0df2]">
                                                {m.equippedTitle}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-zinc-500 font-mono">
                                                {m.xpPoints} XP
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span className="text-[10px] text-zinc-500">
                                            Desde {new Date(m.joinedAt).toLocaleDateString("pt-BR")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Actions Controls */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-zinc-800/50 pt-2.5 sm:border-0 sm:pt-0">
                                {/* Toggle Randomizer Status Button */}
                                {isLeader ? (
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => handleToggleActive(m.userId, m.isActive)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all active:scale-95",
                                            m.isActive
                                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                                        )}
                                        title="Clique para alternar entre Ativo no Randomizer e Espectador"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : m.isActive ? (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                                🟢 Ativo no Sorteio
                                            </>
                                        ) : (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                                                ⚪ Espectador
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <span
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
                                            m.isActive
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                                : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                                        )}
                                    >
                                        {m.isActive ? "🟢 Ativo no Sorteio" : "⚪ Espectador"}
                                    </span>
                                )}

                                {/* Leader Action Dropdown (Promote, Demote, Kick) */}
                                {isLeader && !isSelf && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={isLoading}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                                                title="Opções de Membro"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 border border-theme bg-zinc-950 p-1">
                                            {m.role === "MEMBER" ? (
                                                <DropdownMenuItem
                                                    onClick={() => handlePromote(m.userId, "LEADER")}
                                                    className="flex items-center gap-2 text-xs font-bold text-amber-400 cursor-pointer"
                                                >
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                    Promover a Líder
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={() => handlePromote(m.userId, "MEMBER")}
                                                    className="flex items-center gap-2 text-xs font-bold text-zinc-400 cursor-pointer"
                                                >
                                                    <ArrowDownCircle className="h-4 w-4" />
                                                    Rebaixar para Membro
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setMemberToKick({
                                                        userId: m.userId,
                                                        name: m.name,
                                                        image: m.image,
                                                        role: m.role,
                                                        level: m.level,
                                                    })
                                                }
                                                className="flex items-center gap-2 text-xs font-bold text-rose-400 focus:bg-rose-500/15 focus:text-rose-300 cursor-pointer"
                                            >
                                                <UserMinus className="h-4 w-4" />
                                                Expulsar da Guilda
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cyberpunk Modal de Confirmação de Expulsão */}
            <Dialog open={!!memberToKick} onOpenChange={(open) => !open && !isKicking && setMemberToKick(null)}>
                <DialogContent className="border border-rose-500/50 bg-zinc-950/95 p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] backdrop-blur-2xl sm:max-w-md">
                    <DialogHeader className="space-y-3 text-left">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]">
                                <UserMinus className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-wider text-white">
                                    Expulsar Membro
                                </DialogTitle>
                                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
                                    Ação Destrutiva Irreversível
                                </span>
                            </div>
                        </div>
                        <DialogDescription className="text-xs text-zinc-300 leading-relaxed pt-1">
                            Você está prestes a remover este jogador do esquadrão. Ele perderá o acesso imediato à sede da guilda, sorteios do Randomizer e histórico de conquistas compartilhadas.
                        </DialogDescription>
                    </DialogHeader>

                    {memberToKick && (
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-3.5 my-2">
                            <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                                {memberToKick.image ? (
                                    <Image
                                        src={memberToKick.image}
                                        alt={memberToKick.name}
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-sm font-black text-zinc-400">
                                        {memberToKick.name.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 bg-zinc-950/90 px-1 text-[8px] font-black text-amber-400 border-t border-l border-zinc-800">
                                    Nv{memberToKick.level}
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-white truncate">
                                    {memberToKick.name}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    Cargo Atual: {memberToKick.role === "LEADER" ? "Líder" : "Membro"}
                                </span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                        <button
                            type="button"
                            disabled={isKicking}
                            onClick={() => setMemberToKick(null)}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={isKicking}
                            onClick={handleConfirmKick}
                            className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/80 bg-rose-600/30 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-rose-200 hover:bg-rose-600 hover:text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isKicking ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Expulsando...
                                </>
                            ) : (
                                <>
                                    <UserMinus className="h-4 w-4" />
                                    Sim, Expulsar Membro
                                </>
                            )}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
