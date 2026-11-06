"use client";

import Image from "next/image";
import Link from "next/link";
import { Radio, Shield, Gamepad2, ChevronRight } from "lucide-react";
import type { GuildRadarDTO } from "@/app/lib/guild-actions";

interface GuildRadarWidgetProps {
    guilds: GuildRadarDTO[];
}

export function GuildRadarWidget({ guilds }: GuildRadarWidgetProps) {
    if (!guilds || guilds.length === 0) {
        return null;
    }

    return (
        <section aria-label="Radar de Outras Guildas" className="w-full space-y-4">
            {/* Header da Seção */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme/20 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#bd0df2]/40 bg-[#bd0df2]/15 text-[#bd0df2] shadow-[0_0_15px_rgba(189,13,242,0.3)]">
                        <Radio className="h-4 w-4 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                            Radar das Guildas
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-[#bd0df2]/30 bg-[#bd0df2]/10 text-[#bd0df2] tracking-normal">
                                {guilds.length} {guilds.length === 1 ? "esquadrão" : "esquadrões"}
                            </span>
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Acompanhe as quests ativas e os membros de outras guildas da comunidade.
                        </p>
                    </div>
                </div>

                <Link
                    href="/quests"
                    className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                >
                    <span>Explorar Histórico de Quests</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Grid Responsivo Dual-Paradigm (Carrossel no Mobile, Grid 4x1 ou 3x1 no Desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {guilds.map((g) => {
                    const primaryGame = g.activeGames[0] || null;
                    const secondaryGame = g.activeGames[1] || null;

                    return (
                        <div
                            key={g.guildId}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-theme/30 bg-theme-card/80 hover:bg-theme-card/95 hover:border-[#bd0df2]/50 p-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(189,13,242,0.2)]"
                        >
                            {/* Topo do Card: Guilda & Nível */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-theme-primary/30 bg-theme-primary/10 text-theme-primary font-black text-xs">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-bold uppercase tracking-wider text-white truncate group-hover:text-theme-primary transition-colors">
                                            {g.guildName}
                                        </span>
                                        <span className="text-xs font-semibold text-zinc-400">
                                            Nv. {g.guildLevel} • {g.questMode === "ONLY_MAIN" ? "1 Quest" : "Main + Side"}
                                        </span>
                                    </div>
                                </div>

                                <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-white/5">
                                    {g.members.length} {g.members.length === 1 ? "membro" : "membros"}
                                </span>
                            </div>

                            {/* Conteúdo Principal: Jogo Ativo da Guilda */}
                            <div className="my-3 space-y-2">
                                {primaryGame ? (
                                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/60 p-2.5">
                                        {primaryGame.coverUrl ? (
                                            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg shadow-md border border-white/10">
                                                <Image
                                                    src={primaryGame.coverUrl}
                                                    alt={primaryGame.title}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                                                <Gamepad2 className="h-5 w-5" />
                                            </div>
                                        )}

                                        <div className="flex flex-col min-w-0 flex-1 justify-center">
                                            <span
                                                className={`inline-block w-fit text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                    primaryGame.questType === "MAIN"
                                                        ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                                                        : "bg-[#bd0df2]/20 text-[#bd0df2] border border-[#bd0df2]/30"
                                                } mb-1`}
                                            >
                                                {primaryGame.questType === "MAIN" ? "Main Quest" : "Side Quest"}
                                            </span>
                                            <span className="text-sm font-bold text-white line-clamp-2 leading-tight">
                                                {primaryGame.title}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-5 px-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
                                        <Gamepad2 className="h-6 w-6 text-zinc-600 mb-1" />
                                        <span className="text-xs font-bold text-zinc-400">
                                            Aguardando sorteio
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            Nenhum jogo ativo no momento
                                        </span>
                                    </div>
                                )}

                                {/* Jogo secundário se houver (Side Quest em paralelo) */}
                                {secondaryGame && (
                                    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/40 border border-white/5 text-xs">
                                        <span className="text-[#bd0df2] font-black text-xs uppercase tracking-wider">
                                            Side:
                                        </span>
                                        <span className="text-zinc-300 font-bold truncate flex-1">
                                            {secondaryGame.title}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Rodapé do Card: Membros do Esquadrão & Link para Histórico */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                {/* Stack de Avatares */}
                                <div className="flex items-center -space-x-2 overflow-hidden py-1">
                                    {g.members.slice(0, 4).map((m) => (
                                        <div
                                            key={m.id}
                                            className="relative h-7 w-7 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800 shrink-0"
                                            title={`${m.name} (Nv. ${m.level})`}
                                        >
                                            {m.image ? (
                                                <Image
                                                    src={m.image}
                                                    alt={m.name}
                                                    fill
                                                    sizes="28px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-black text-white bg-theme-primary/30">
                                                    {m.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {g.members.length > 4 && (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800 text-xs font-black text-zinc-400">
                                            +{g.members.length - 4}
                                        </div>
                                    )}
                                </div>

                                {/* Link Ver Histórico */}
                                <Link
                                    href={`/quests?guildId=${g.guildId}`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors group-hover:text-theme-primary"
                                >
                                    <span>Histórico</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

