import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ActiveQuestHero } from "@/components/dashboard/ActiveQuestHero";
import { SideQuestBar } from "@/components/dashboard/SideQuestBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentGames } from "@/components/dashboard/RecentGames";

export default async function DashboardPage() {
    const session = await auth();

    const userId = session?.user?.id || "";

    // Get the latest drawn pools
    const [latestMainPool, latestSidePool] = await Promise.all([
        prisma.pool.findFirst({
            where: { type: "MAIN_QUEST", winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            include: { winner_game: { include: { nominator: true } } },
        }),
        prisma.pool.findFirst({
            where: { type: "SIDE_QUEST", winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            include: { winner_game: { include: { nominator: true } } },
        }),
    ]);

    // Parallel data fetching for user progress based on current pools
    const [mainQuestProgress, sideQuestProgress, recentGames, lastReview] = await Promise.all([
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
        prisma.gameProgress.findMany({
            where: { user_id: userId },
            take: 4,
            orderBy: { updated_at: "desc" },
            include: { game: { include: { nominator: true } } },
        }),
        prisma.review.findFirst({
            orderBy: { created_at: "desc" },
            include: { game: true, user: true },
        }),
    ]);

    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-8 p-2">
            {/* Row 1: Active Quests */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ActiveQuestHero
                    activePool={latestMainPool}
                    progress={mainQuestProgress}
                    userName={session?.user?.name ?? "Comandante"}
                />
                <SideQuestBar 
                    activePool={latestSidePool}
                    progress={sideQuestProgress} 
                />
            </div>

            {/* Row 3: Stats Cards Grid */}
            <StatsGrid lastReview={lastReview} />

            {/* Row 4: Recent Activity */}
            <RecentGames games={recentGames} />
        </div>
    );
}
