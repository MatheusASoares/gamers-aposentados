import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ActiveQuestHero } from "@/components/dashboard/ActiveQuestHero";
import { SideQuestBar } from "@/components/dashboard/SideQuestBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentActivity, ActivityEvent } from "@/components/dashboard/RecentGames";
import { shuffleArray } from "@/lib/utils";

export default async function DashboardPage() {
    const session = await auth();

    const userId = session?.user?.id || "";

    // --- Block 1: Independent Data Fetching (Parallel) ---
    const [
        latestMainPool,
        latestSidePool,
        randomReviewIds,
        recentPools,
        recentReviews,
        recentProgress,
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
        // Random Review IDs (JS Shuffle - Ideal for low volume)
        prisma.review.findMany({ select: { id: true } }).then((reviews) => {
            const shuffled = shuffleArray(reviews);
            return shuffled.slice(0, 5);
        }),
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
            where: { status: { in: ["ACTIVE", "COMPLETED"] } },
            orderBy: { updated_at: "desc" },
            take: 10,
            include: { game: true, user: true },
        }),
    ]);

    // --- Block 2: Dependent Data Fetching (Parallel) ---
    const idsToFetch = randomReviewIds.map((r) => r.id);

    const [mainQuestProgress, sideQuestProgress, randomReviewsForStats] = await Promise.all([
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
        idsToFetch.length > 0
            ? prisma.review.findMany({
                  where: { id: { in: idsToFetch } },
                  include: { game: true, user: true },
              })
            : [],
    ]);

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
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-8 p-2">
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

            {/* Row 4: Recent Activity */}
            <RecentActivity events={rawEvents} />
        </div>
    );
}
