import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ActiveQuestHero } from "@/components/dashboard/ActiveQuestHero";
import { SideQuestBar } from "@/components/dashboard/SideQuestBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentActivity, ActivityEvent } from "@/components/dashboard/RecentGames";
import { UserProfileWidget } from "@/components/dashboard/UserProfileWidget";
import { Leaderboard, PlayerStats } from "@/components/dashboard/Leaderboard";
import { RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";

export default async function DashboardPage() {
    const session = await auth();

    const userId = session?.user?.id || "";

    interface RawReview {
        id: string;
        rating: number;
        review_text: string | null;
        game_title: string;
        game_cover_url: string | null;
        user_id: string;
        user_name: string | null;
        user_username: string | null;
    }

    // --- Block 1: Independent Data Fetching (Parallel) ---
    const [
        latestMainPool,
        latestSidePool,
        rawRandomReviews,
        recentPools,
        recentReviews,
        recentProgress,
        recentNominations,
        completedProgresses,
        activeUsers,
    ] = await Promise.all([
        // Active Main Quest
        prisma.pool.findFirst({
            where: { type: "MAIN_QUEST", winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            include: { winner_game: { include: { nominator: true } } },
        }),
        // Active Side Quest
        prisma.pool.findFirst({
            where: { type: "SIDE_QUEST", winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            include: { winner_game: { include: { nominator: true } } },
        }),
        // Random Reviews (ORDER BY RANDOM)
        prisma.$queryRaw<RawReview[]>`
            SELECT 
                r.id, 
                r.rating, 
                r.review_text, 
                g.title as "game_title", 
                g.cover_url as "game_cover_url", 
                u.id as "user_id",
                u.name as "user_name", 
                u.username as "user_username" 
            FROM reviews r
            JOIN games g ON r.game_id = g.id
            JOIN users u ON r.user_id = u.id
            ORDER BY RANDOM() LIMIT 5
        `,
        // Recent Pools (Global Activity)
        prisma.pool.findMany({
            where: { winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            take: 5,
            include: { winner_game: true },
        }),
        // Recent Reviews (Global Activity)
        prisma.review.findMany({
            orderBy: { updated_at: "desc" },
            take: 5,
            include: { game: true, user: true },
        }),
        // Recent Progress (Global Activity)
        prisma.gameProgress.findMany({
            where: { status: { in: ["ACTIVE", "COMPLETED", "DROPPED"] } },
            orderBy: { updated_at: "desc" },
            take: 10,
            include: { game: true, user: true },
        }),
        // Recent Nominations (Global Activity)
        prisma.game.findMany({
            where: { nominated_by_id: { not: null } },
            orderBy: { created_at: "desc" },
            take: 5,
            include: { nominator: true },
        }),
        // Completed progress for medals count
        prisma.gameProgress.findMany({
            where: {
                status: "COMPLETED",
                user: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
            },
            include: {
                game: true,
                user: true,
            },
        }),
        // Fetch active players details
        prisma.user.findMany({
            where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
        }),
    ]);

    // --- Block 2: Dependent Data Fetching (Parallel) ---
    const [mainQuestProgress, sideQuestProgress] = await Promise.all([
        latestMainPool?.winner_game_id
            ? prisma.gameProgress.findUnique({
                  where: {
                      user_id_game_id: { user_id: userId, game_id: latestMainPool.winner_game_id },
                  },
                  include: { game: { include: { nominator: true } } },
              })
            : null,
        latestSidePool?.winner_game_id
            ? prisma.gameProgress.findUnique({
                  where: {
                      user_id_game_id: { user_id: userId, game_id: latestSidePool.winner_game_id },
                  },
                  include: { game: { include: { nominator: true } } },
              })
            : null,
    ]);

    // Format raw random reviews for StatsGrid component
    const randomReviewsForStats = rawRandomReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        game: {
            title: r.game_title,
            cover_url: r.game_cover_url,
        },
        user: {
            id: r.user_id,
            name: r.user_name,
            username: r.user_username,
        },
    }));

    // Build unified sorted event feed
    const rawEvents: ActivityEvent[] = [
        ...recentPools
            .filter((p) => p.winner_game !== null)
            .map((p) => ({
                kind: "RAFFLE" as const,
                date: p.created_at,
                game: {
                    id: p.winner_game!.id,
                    title: p.winner_game!.title,
                    cover_url: p.winner_game!.cover_url,
                    quest_type: p.type,
                },
                poolType: p.type,
            })),
        ...recentReviews.map((r) => ({
            kind: "REVIEW" as const,
            date: r.updated_at,
            game: {
                id: r.game.id,
                title: r.game.title,
                cover_url: r.game.cover_url,
                quest_type: r.game.quest_type,
            },
            user: { id: r.user.id, name: r.user.name, username: r.user.username },
            rating: r.rating,
        })),
        ...recentProgress
            .filter((p) => p.status === "COMPLETED")
            .map((p) => ({
                kind: "COMPLETED" as const,
                date: p.updated_at,
                game: {
                    id: p.game.id,
                    title: p.game.title,
                    cover_url: p.game.cover_url,
                    quest_type: p.game.quest_type,
                },
                user: { id: p.user.id, name: p.user.name, username: p.user.username },
            })),
        ...recentProgress
            .filter((p) => p.status === "ACTIVE")
            .map((p) => ({
                kind: "PROGRESS" as const,
                date: p.updated_at,
                game: {
                    id: p.game.id,
                    title: p.game.title,
                    cover_url: p.game.cover_url,
                    quest_type: p.game.quest_type,
                },
                user: { id: p.user.id, name: p.user.name, username: p.user.username },
                progress_percentage: p.progress_percentage,
            })),
        ...recentProgress
            .filter((p) => p.status === "DROPPED")
            .map((p) => ({
                kind: "DROPPED" as const,
                date: p.updated_at,
                game: {
                    id: p.game.id,
                    title: p.game.title,
                    cover_url: p.game.cover_url,
                    quest_type: p.game.quest_type,
                },
                user: { id: p.user.id, name: p.user.name, username: p.user.username },
            })),
        ...recentNominations.map((g) => ({
            kind: "SUGGESTED" as const,
            date: g.created_at,
            game: {
                id: g.id,
                title: g.title,
                cover_url: g.cover_url,
                quest_type: g.quest_type,
            },
            user: g.nominator
                ? { id: g.nominator.id, name: g.nominator.name, username: g.nominator.username }
                : { id: "", name: "Desconhecido", username: "desconhecido" },
        })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);

    // Build players stats for FilaDoInss leaderboard
    const playersStats: PlayerStats[] = RANDOMIZER_PLAYER_EMAILS.map((email) => {
        const user = activeUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        const name = user?.name || email.split("@")[0];
        const image = user?.image || null;

        const userCompleted = completedProgresses.filter((p) => p.user_id === user?.id);
        const goldMedals = userCompleted.filter((p) => p.game.quest_type === "MAIN_QUEST").length;
        const silverMedals = userCompleted.filter((p) => p.game.quest_type === "SIDE_QUEST").length;

        return {
            id: user?.id || "",
            name,
            email,
            image,
            goldMedals,
            silverMedals,
        };
    });

    // Fetch logged in user profile with gamification stats and last completed game
    const currentUserProfile = userId
        ? await prisma.user.findUnique({
              where: { id: userId },
              select: {
                  id: true,
                  name: true,
                  image: true,
                  level: true,
                  xp_points: true,
                  equipped_title: true,
                  gameProgress: {
                      where: { status: "COMPLETED" },
                      orderBy: { updated_at: "desc" },
                      include: { game: true },
                  },
              },
          })
        : null;

    const dbUserExtra = userId
        ? await prisma.$queryRaw<{ equipped_frame: string | null; equipped_banner: string | null }[]>`SELECT equipped_frame, equipped_banner FROM users WHERE id = ${userId}`
        : [];
    const equippedFrame = dbUserExtra?.[0]?.equipped_frame || null;
    const equippedBanner = dbUserExtra?.[0]?.equipped_banner || null;

    const lastCompleted = currentUserProfile?.gameProgress[0]?.game;

    const userWidgetData = currentUserProfile
        ? {
              name: currentUserProfile.name,
              image: currentUserProfile.image,
              level: currentUserProfile.level || 1,
              xpPoints: currentUserProfile.xp_points || 0,
              equippedTitle: currentUserProfile.equipped_title,
              equippedFrame: equippedFrame,
              equippedBanner: equippedBanner,
              completedGamesCount: currentUserProfile.gameProgress.length,
              platinumCount: currentUserProfile.gameProgress.filter((p) => p.is_platinum).length,
              lastCompletedGame: lastCompleted
                  ? {
                        title: lastCompleted.title,
                        coverUrl: lastCompleted.cover_url,
                    }
                  : null,
          }
        : null;

    return (
        <div className="mx-auto w-full max-w-[1920px] space-y-8 px-6 py-8 md:px-8 lg:px-12 lg:py-12">
            {/* Gamification Profile Banner */}
            {userWidgetData && (
                <div className="w-full">
                    <UserProfileWidget user={userWidgetData} />
                </div>
            )}

            {/* Row 1: Active Quests */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ActiveQuestHero
                    activePool={latestMainPool}
                    progress={mainQuestProgress}
                    userName={session?.user?.name ?? "Comandante"}
                />
                <SideQuestBar activePool={latestSidePool} progress={sideQuestProgress} />
            </div>

            {/* Row 3: Stats Cards Grid */}
            <StatsGrid reviews={randomReviewsForStats} />

            {/* Row 4: Recent Activity & Fila do INSS */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <RecentActivity events={rawEvents} />
                <Leaderboard players={playersStats} />
            </div>
        </div>
    );
}
