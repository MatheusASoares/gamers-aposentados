import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveGuild, getGuildStats } from "@/app/lib/guild-actions";
import { GuildHeader } from "@/components/guild/GuildHeader";
import { GuildRoster } from "@/components/guild/GuildRoster";
import { Shield } from "lucide-react";
import { Metadata } from "next";

import { GuildRewardsCustomizationModule } from "@/components/guild/GuildRewardsCustomizationModule";
import { GuildMascotCompanion } from "@/components/guild/GuildMascotCompanion";
import { GUILD_REWARDS_CATALOG } from "@/lib/constants/guild-rewards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
    title: "Sede da Guilda | Gamers Aposentados",
    description: "Quartel-general da guilda, membros, nível, convites e estatísticas consolidadas.",
};

export default async function GuildPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const activeGuild = await getActiveGuild();

    if (!activeGuild) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center select-none">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#bd0df2]/40 bg-[#bd0df2]/15 text-[#bd0df2] shadow-[0_0_30px_rgba(189,13,242,0.3)] mb-6">
                    <Shield className="h-10 w-10" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-2">
                    Nenhuma Guilda Selecionada
                </h1>
                <p className="text-sm text-zinc-400 max-w-md mb-8">
                    Você ainda não faz parte de nenhuma guilda ou nenhuma está ativa no momento. Crie um novo esquadrão ou entre com o código de convite dos seus amigos.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a
                        href="/"
                        className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                    >
                        Voltar ao Dashboard
                    </a>
                </div>
            </div>
        );
    }

    const stats = (await getGuildStats(activeGuild.id)) || {
        totalCompletedGames: 0,
        totalPools: 0,
        totalHoursPlayed: 0,
        totalMembers: activeGuild.memberCount,
    };

    const mascotItem = activeGuild.equippedMascot
        ? GUILD_REWARDS_CATALOG.find(
            (r) =>
                r.type === "MASCOT" &&
                (r.name.toLowerCase() === activeGuild.equippedMascot?.toLowerCase() ||
                    r.assetUrl === activeGuild.equippedMascot ||
                    r.id === activeGuild.equippedMascot ||
                    activeGuild.equippedMascot?.toLowerCase().includes(r.name.toLowerCase()) ||
                    r.name.toLowerCase().includes(activeGuild.equippedMascot?.toLowerCase() || ""))
        )
        : GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT" && r.level <= Math.max(2, activeGuild.level)) || GUILD_REWARDS_CATALOG.find((r) => r.type === "MASCOT") || null;

    return (
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6 sm:gap-8 px-1 sm:px-6 py-4 sm:py-8 md:px-8 lg:px-12 pb-24 select-none">
            {/* Top Page Header (Dual-Paradigm: Lado a Lado no Mobile & Desktop) */}
            <div className="relative flex flex-row items-center justify-between gap-3 sm:gap-6">
                <div className="space-y-0.5 sm:space-y-1.5 flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md truncate">
                        Sede da Guilda
                    </h2>
                    <p className="max-w-2xl text-xs sm:text-base md:text-lg font-medium text-zinc-400 hidden sm:block">
                        Quartel-general do esquadrão, evolução coletiva de nível e armário de prestígio.
                    </p>
                </div>

                {/* Mascote Companion no Topo Direito (Ao lado do Título) */}
                {mascotItem && (
                    <div className="shrink-0 flex items-center justify-end z-20">
                        <GuildMascotCompanion
                            key={`top-mascot-${mascotItem.id}-${activeGuild.equippedMascot || "none"}`}
                            mascot={mascotItem}
                            guildLevel={activeGuild.level}
                            size="md"
                            interactive={true}
                            bubblePosition="left"
                        />
                    </div>
                )}
            </div>

            {/* 1. HERO HEADER: 3-Column Guild Showcase (Proporção igualada com o Hall of Fame) */}
            <GuildHeader
                guild={activeGuild}
                stats={stats}
                currentUserId={session.user.id}
            />

            {/* 2. Armário de Recompensas e Customização de Prestígio (Estilo Hall of Fame) */}
            <GuildRewardsCustomizationModule
                guildLevel={activeGuild.level}
                guildName={activeGuild.name}
                isLeader={activeGuild.myRole === "LEADER"}
                equippedBanner={activeGuild.equippedBanner}
                equippedEmblem={activeGuild.equippedEmblem}
                equippedTitle={activeGuild.equippedTitle}
                equippedMascot={activeGuild.equippedMascot}
            />

            {/* 4. Quartel de Membros com Gerenciamento e Toggle Ativo/Inativo */}
            <GuildRoster
                guild={activeGuild}
                currentUserId={session.user.id}
            />
        </div>
    );
}
