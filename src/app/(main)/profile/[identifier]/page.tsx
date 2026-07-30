import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Trophy, Sparkles, Award } from "lucide-react";
import Image from "next/image";
import { FavoriteGamesModule } from "@/components/profile/favorite-games-module";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { setFavoriteGames, setFavoriteGamesOfYear } from "@/app/lib/user-actions";
import { HallOfFameGallery, CompletedGameItem } from "@/components/profile/hall-of-fame-gallery";
import { RewardsCustomizationModule } from "@/components/profile/rewards-customization-module";
import { UserAvatar } from "@/components/ui/user-avatar";
import { TitleBadge } from "@/components/ui/title-badge";
import { calculateLevelFromXP, getRankTierDetails } from "@/app/lib/xp-engine";
import { REWARDS_CATALOG } from "@/lib/constants/rewards";

interface ProfilePageProps {
    params: Promise<{ identifier: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { identifier } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const currentUserId = session.user.id;

    // Fetch user with favorite games
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ id: identifier }, { username: identifier }],
        },
        include: {
            favoriteGames: true,
            favoriteGamesYear: true,
        },
    });

    if (!user) {
        notFound();
    }

    const isOwner = currentUserId === user.id;

    // Fetch equipped_frame, equipped_banner and equipped_theme via raw SQL to bypass stale Prisma Client JS definitions
    const dbUserExtra = await prisma.$queryRaw<{ equipped_frame: string | null; equipped_banner: string | null; equipped_theme: string | null }[]>`SELECT equipped_frame, equipped_banner, equipped_theme FROM users WHERE id = ${user.id}`;
    const equippedFrame = dbUserExtra?.[0]?.equipped_frame || null;
    const equippedBanner = dbUserExtra?.[0]?.equipped_banner || null;
    const equippedTheme = dbUserExtra?.[0]?.equipped_theme || "cyberpunk";

    const bannerItem = REWARDS_CATALOG.find((r) => r.type === "BANNER" && r.id === equippedBanner);

    // Fetch completed progress entries with game details
    const completedProgresses = await prisma.gameProgress.findMany({
        where: { user_id: user.id, status: "COMPLETED" },
        include: { game: true },
        orderBy: { updated_at: "desc" },
    });

    const completedGamesCount = completedProgresses.length;
    const platinumCount = completedProgresses.filter((p) => p.is_platinum).length;

    // Format for HallOfFameGallery
    const hallOfFameItems: CompletedGameItem[] = completedProgresses.map((p) => ({
        progressId: p.id,
        gameId: p.game_id,
        title: p.game.title,
        coverUrl: p.game.cover_url,
        questType: p.game.quest_type,
        hltbTime: p.game.hltb_time,
        completedAt: p.end_date || p.updated_at,
        isPlatinum: p.is_platinum,
        platinumAt: p.platinum_at,
    }));

    // Calculate level and rank tier details
    const xpPoints = user.xp_points || 0;
    const { level, currentLevelXP, nextLevelXP, progressPercentage } = calculateLevelFromXP(xpPoints);
    const tierDetails = getRankTierDetails(level);
    const equippedTitle = user.equipped_title || tierDetails.name;



    return (
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-8 px-6 py-8 md:px-8 lg:px-12">
            
            {/* Top Page Header (Padrão do Aplicativo) */}
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div className="space-y-3">
                    <h2 className="text-4xl font-black tracking-tight text-white uppercase drop-shadow-md md:text-5xl">
                        Hall of Fame
                    </h2>
                    <p className="max-w-2xl text-lg font-medium text-zinc-400">
                        Celebrate the legendary achievements, rank progress, and conquered games of the vanguard.
                    </p>
                </div>
            </div>

            {/* 1. HERO HEADER: 3-Column Profile Showcase */}
            <div className="glass-card border border-theme bg-theme-card relative flex flex-col overflow-hidden rounded-[2rem] p-6 shadow-2xl md:p-8 lg:p-10">
                {/* Ambient Neon Glows */}
                <div className={`pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-[120px] ${tierDetails.glowColor}`}></div>
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-500/10 blur-[100px]"></div>

                {/* EQUIPPED HEADER BANNER COVER IMAGE */}
                {bannerItem?.assetUrl && (
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                        <Image
                            src={bannerItem.assetUrl}
                            alt={bannerItem.name || "Banner de Perfil"}
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover object-center opacity-40 mix-blend-luminosity brightness-90 transition-opacity duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/40" />
                    </div>
                )}

                {/* 3-Column Grid: Left (Avatar + Name) | Center (Rank & XP) | Right (Stats) */}
                <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">

                    {/* COLUMN 1: LEFT - Avatar & Player Name (4 cols) */}
                    <div className="flex items-center gap-10 md:gap-12 border-b border-white/5 pb-6 lg:col-span-4 lg:border-b-0 lg:border-r lg:border-white/5 lg:pb-0 lg:pr-8">
                        <div className="relative shrink-0">
                            {isOwner ? (
                                <AvatarUpload
                                    currentImage={user.image || null}
                                    name={user.name || null}
                                    isOwner={isOwner}
                                    frameUrl={equippedFrame}
                                    className={`h-24 w-24 md:h-32 md:w-32 ${equippedFrame ? "" : `border-2 ${tierDetails.avatarBorder}`}`}
                                />
                            ) : (
                                <UserAvatar
                                    src={user.image || null}
                                    name={user.name || null}
                                    frameUrl={equippedFrame}
                                    size="2xl"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0">
                            <h1 className="truncate text-2xl font-black tracking-tight text-white drop-shadow-md md:text-3xl lg:text-4xl">
                                {user.name || "Gamer"}
                            </h1>
                            <p className="text-xs font-black tracking-widest text-theme-primary uppercase">
                                @{user.username || "user"}
                            </p>
                        </div>
                    </div>

                    {/* COLUMN 2: CENTER - Level, Rank Title & XP Progress Bar (5 cols) */}
                    <div className="flex flex-col justify-center gap-4 lg:col-span-5 lg:px-6">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300 uppercase shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                Lvl {level}
                            </span>

                            <TitleBadge title={equippedTitle} />
                        </div>

                        {/* XP Progress Card */}
                        <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-zinc-900/50 p-4 shadow-inner">
                            <div className="flex justify-between text-xs font-black tracking-widest uppercase">
                                <span className="text-zinc-400">Career XP</span>
                                <span className={tierDetails.titleColor}>
                                    {currentLevelXP} / {nextLevelXP} XP ({progressPercentage}%)
                                </span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-950 p-0.5 border border-white/5">
                                <div
                                    className="h-full rounded-full bg-theme-primary progress-glow transition-all duration-700"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-bold text-zinc-500">
                                <span>Total: {xpPoints} XP</span>
                                <span>Próximo nível em {nextLevelXP - currentLevelXP} XP</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 3: RIGHT - Stats Badges (3 cols) */}
                    <div className="flex flex-col justify-center gap-3 border-t border-white/5 pt-6 lg:col-span-3 lg:border-t-0 lg:border-l lg:border-white/5 lg:pt-0 lg:pl-8">
                        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-900/60 p-4 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                                <span className="text-xs font-black tracking-widest text-zinc-400 uppercase">Completed</span>
                            </div>
                            <span className="text-2xl font-black text-white">{completedGamesCount}</span>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <Award className="h-5 w-5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                                <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Platinas</span>
                            </div>
                            <span className="text-2xl font-black text-amber-300">{platinumCount} 🏆</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* 2. REWARDS & CUSTOMIZATION: Titles, Frames, Banners & Themes */}
            <RewardsCustomizationModule
                userLevel={level}
                userName={user.name || null}
                userImage={user.image || null}
                equippedTitle={equippedTitle}
                equippedFrame={equippedFrame}
                equippedBanner={equippedBanner}
                equippedTheme={equippedTheme}
                isOwner={isOwner}
            />

            {/* 3. TOP GAMES: All Time & Year (Side-by-Side 2-Column Grid) */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <FavoriteGamesModule
                    title="Top 3 Games (All Time)"
                    initialFavorites={user.favoriteGames}
                    isOwner={isOwner}
                    onSaveAction={setFavoriteGames}
                />

                <FavoriteGamesModule
                    title={`Top 3 Games of ${new Date().getFullYear()}`}
                    initialFavorites={user.favoriteGamesYear}
                    isOwner={isOwner}
                    onSaveAction={setFavoriteGamesOfYear}
                />
            </div>

            {/* 4. HALL OF FAME: Completed Games Gallery Grid & Platinum Claims */}
            <HallOfFameGallery
                completedGames={hallOfFameItems}
                isOwner={isOwner}
            />
        </div>
    );
}
