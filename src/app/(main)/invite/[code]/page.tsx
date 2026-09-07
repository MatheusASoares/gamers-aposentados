import { auth } from "@/auth";
import { getGuildByInviteCode } from "@/app/lib/guild-actions";
import { AcceptInviteButton } from "@/components/guild/AcceptInviteButton";
import { Shield, Users, Dices, Crown, ArrowLeft, Swords, Gamepad2, ShieldCheck, Flame, Skull } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { GUILD_REWARDS_CATALOG } from "@/lib/constants/guild-rewards";
import { BannerFxOverlay } from "@/components/profile/banner-fx-overlay";
import { cn } from "@/lib/utils";

interface InvitePageProps {
    params: Promise<{
        code: string;
    }>;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
    const { code } = await params;
    const guild = await getGuildByInviteCode(code);
    return {
        title: guild ? `Convite para ${guild.name} | Gamers Aposentados` : "Convite de Guilda",
        description: guild?.description || "Você foi convidado para participar de uma guilda no Gamers Aposentados.",
    };
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { code } = await params;
    const session = await auth();
    const isLoggedIn = !!session?.user?.id;

    const guild = await getGuildByInviteCode(code);

    if (!guild) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center select-none">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/40 bg-red-500/10 text-red-400 mb-6">
                    <Shield className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
                    Convite Inválido ou Expirado
                </h1>
                <p className="text-xs text-zinc-400 max-w-sm mb-6">
                    Não encontramos nenhuma guilda ativa com o código <span className="font-mono text-amber-400 font-bold">{code}</span>.
                </p>
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition-all"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Ir para a Página Inicial
                </Link>
            </div>
        );
    }

    const bannerItem = guild.equippedBanner
        ? GUILD_REWARDS_CATALOG.find((r) => r.type === "BANNER" && (r.name === guild.equippedBanner || r.assetUrl === guild.equippedBanner))
        : null;

    const emblemItem = guild.equippedEmblem
        ? GUILD_REWARDS_CATALOG.find((r) => r.type === "EMBLEM" && (r.name === guild.equippedEmblem || r.id === guild.equippedEmblem))
        : null;

    const renderEmblemIcon = (iconName?: string) => {
        switch (iconName) {
            case "Shield":
                return <Shield className="h-12 w-12 drop-shadow-[0_0_10px_#bd0df2]" />;
            case "Swords":
                return <Swords className="h-12 w-12 drop-shadow-[0_0_10px_#bd0df2]" />;
            case "Gamepad2":
                return <Gamepad2 className="h-12 w-12 drop-shadow-[0_0_10px_#f59e0b]" />;
            case "ShieldCheck":
                return <ShieldCheck className="h-12 w-12 drop-shadow-[0_0_10px_#06b6d4]" />;
            case "Flame":
                return <Flame className="h-12 w-12 drop-shadow-[0_0_10px_#f43f5e]" />;
            case "Crown":
                return <Crown className="h-12 w-12 drop-shadow-[0_0_10px_#fbbf24]" />;
            case "Skull":
                return <Skull className="h-12 w-12 drop-shadow-[0_0_10px_#a855f7]" />;
            default:
                return <Shield className="h-12 w-12 drop-shadow-[0_0_10px_#bd0df2]" />;
        }
    };

    return (
        <div className="flex min-h-[75vh] flex-col items-center justify-center p-4 sm:p-6 select-none">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(189,13,242,0.2)] text-center space-y-6">
                {/* Equipped Banner Background */}
                {bannerItem?.assetUrl && (
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                        <Image
                            src={bannerItem.assetUrl}
                            alt="Banner da Guilda"
                            fill
                            unoptimized
                            className="object-cover opacity-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
                        <BannerFxOverlay effectType={bannerItem.effectType} bannerId={bannerItem.id} />
                    </div>
                )}

                {/* Ambient glow effects */}
                <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-[#bd0df2]/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

                {/* Crest */}
                <div className={cn(
                    "relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border-2 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-[#bd0df2] shadow-xl",
                    emblemItem?.cssClass || "border-[#bd0df2]/60 text-[#bd0df2] shadow-[0_0_25px_rgba(189,13,242,0.4)]"
                )}>
                    {renderEmblemIcon(emblemItem?.icon)}
                    <div className="absolute -bottom-2 flex items-center gap-1 rounded-full border border-amber-400/50 bg-zinc-950 px-2.5 py-0.5 text-xs font-black text-amber-400 shadow-md">
                        <Crown className="h-3.5 w-3.5" /> Nv {guild.level}
                    </div>
                </div>

                {/* Title and details */}
                <div className="relative z-10 space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-[#bd0df2]">
                        Convite de Esquadrão
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow-md">
                        {guild.name}
                    </h1>
                    {guild.equippedTitle && (
                        <p className="text-xs font-black uppercase tracking-wider text-amber-400">
                            📜 {guild.equippedTitle}
                        </p>
                    )}
                    {guild.description && (
                        <p className="text-xs sm:text-sm text-zinc-300 pt-1 leading-relaxed max-w-sm mx-auto">
                            &ldquo;{guild.description}&rdquo;
                        </p>
                    )}
                </div>

                {/* Stats mini-grid */}
                <div className="relative z-10 grid grid-cols-2 gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-cyan-400" /> Membros
                        </span>
                        <span className="text-base sm:text-lg font-black text-white">{guild.memberCount}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                            <Dices className="h-4 w-4 text-fuchsia-400" /> Potes
                        </span>
                        <span className="text-base sm:text-lg font-black text-white">{guild.poolsCount}</span>
                    </div>
                </div>

                {/* Action button */}
                <div className="relative z-10 pt-2 flex justify-center">
                    <AcceptInviteButton
                        inviteCode={guild.inviteCode}
                        isLoggedIn={isLoggedIn}
                    />
                </div>
            </div>
        </div>
    );
}
