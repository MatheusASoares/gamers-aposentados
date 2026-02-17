import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ActiveQuestHero } from '@/components/dashboard/ActiveQuestHero';
import { SideQuestBar } from '@/components/dashboard/SideQuestBar';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentGames } from '@/components/dashboard/RecentGames';

export default async function DashboardPage() {
  const session = await auth();

  // Parallel data fetching (vercel best practice: async-parallel)
  const [
    activeMainQuest,
    activeSideQuest,
    totalGames,
    completedGames,
    recentGames,
    lastReview,
  ] = await Promise.all([
    prisma.game.findFirst({
      where: { status: 'ACTIVE', quest_type: 'MAIN_QUEST' },
      include: { nominator: true },
    }),
    prisma.game.findFirst({
      where: { status: 'ACTIVE', quest_type: 'SIDE_QUEST' },
      include: { nominator: true },
    }),
    prisma.game.count(),
    prisma.game.count({ where: { status: 'COMPLETED' } }),
    prisma.game.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { nominator: true },
    }),
    prisma.review.findFirst({
      orderBy: { created_at: 'desc' },
      include: { game: true, user: true },
    }),
  ]);

  const suggestedGames = await prisma.game.count({ where: { status: 'SUGGESTED' } });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Row 1: Active Main Quest Hero Card */}
      <ActiveQuestHero
        game={activeMainQuest}
        userName={session?.user?.name ?? 'Comandante'}
      />

      {/* Row 2: Side Quest Bar */}
      <SideQuestBar game={activeSideQuest} />

      {/* Row 3: Stats Cards Grid */}
      <StatsGrid
        totalGames={totalGames}
        completedGames={completedGames}
        suggestedGames={suggestedGames}
        lastReview={lastReview}
      />

      {/* Row 4: Recent Activity */}
      <RecentGames games={recentGames} />
    </div>
  );
}