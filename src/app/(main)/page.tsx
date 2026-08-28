import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ActiveQuestHero } from "@/components/dashboard/ActiveQuestHero";
import { SideQuestBar } from "@/components/dashboard/SideQuestBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentActivity, ActivityEvent } from "@/components/dashboard/RecentGames";
import { UserProfileWidget } from "@/components/dashboard/UserProfileWidget";
import { Leaderboard, PlayerStats } from "@/components/dashboard/Leaderboard";
import { RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";
import { TrackedDealsAlert } from "@/components/dashboard/TrackedDealsAlert";
import { getPendingSpecialGameProposals } from "@/app/lib/special-game-actions";
import { ActivePauseVotingBanner } from "@/components/game/ActivePauseVotingBanner";
import { ActivePauseVotingToast } from "@/components/game/ActivePauseVotingToast";
import { GuildStatusCard } from "@/components/dashboard/GuildStatusCard";
import { isGuildMaster } from "@/lib/permissions";

export default async function DashboardPage() {
    const session = await auth();

    const userId = session?.user?.id || "";
    const isMaster = isGuildMaster(session?.user);

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
        pendingProposals,
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
        // [BY DESIGN]: Random Reviews (ORDER BY RANDOM) seleciona 5 reviews aleatórias de todo o histórico da comunidade.
        // O volume de dados é controlado (< centenas de linhas) com tempo de execução < 1ms, mantendo rotatividade histórica.
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
        // Fetch pending special game proposals for active pause voting
        getPendingSpecialGameProposals(),
    ]);

    // --- Block 2: Dependent Data Fetching (Parallel) ---
    // Busca se o usuário logado possui uma quest ativa (status === "ACTIVE") na categoria.
    // Se tiver, prioriza essa quest individual (ex: retomada de quest dropada).
    // Caso contrário, faz fallback para o progresso do jogo do último sorteio da categoria.
    const [userActiveMainProgress, userActiveSideProgress] = await Promise.all([
        userId
            ? prisma.gameProgress.findFirst({
                  where: {
                      user_id: userId,
                      status: "ACTIVE",
                      game: { quest_type: "MAIN_QUEST" },
                  },
                  orderBy: { updated_at: "desc" },
                  include: { game: { include: { nominator: true } } },
              })
            : null,
        userId
            ? prisma.gameProgress.findFirst({
                  where: {
                      user_id: userId,
                      status: "ACTIVE",
                      game: { quest_type: "SIDE_QUEST" },
                  },
                  orderBy: { updated_at: "desc" },
                  include: { game: { include: { nominator: true } } },
              })
            : null,
    ]);

    const [fallbackMainProgress, fallbackSideProgress] = await Promise.all([
        isMaster && !userActiveMainProgress && latestMainPool?.winner_game_id && userId
            ? prisma.gameProgress.findUnique({
                  where: {
                      user_id_game_id: { user_id: userId, game_id: latestMainPool.winner_game_id },
                  },
                  include: { game: { include: { nominator: true } } },
              })
            : null,
        isMaster && !userActiveSideProgress && latestSidePool?.winner_game_id && userId
            ? prisma.gameProgress.findUnique({
                  where: {
                      user_id_game_id: { user_id: userId, game_id: latestSidePool.winner_game_id },
                  },
                  include: { game: { include: { nominator: true } } },
              })
            : null,
    ]);

    const mainQuestProgress = userActiveMainProgress || fallbackMainProgress;
    const sideQuestProgress = userActiveSideProgress || fallbackSideProgress;

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
                    is_special_release: p.winner_game!.is_special_release,
                },
                poolType: p.type,
                is_special: p.is_special,
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
                  equipped_frame: true,
                  equipped_banner: true,
                  gameProgress: {
                      where: { status: "COMPLETED" },
                      orderBy: { updated_at: "desc" },
                      include: { game: true },
                  },
              },
          })
        : null;

    const lastCompleted = currentUserProfile?.gameProgress[0]?.game;

    const userWidgetData = currentUserProfile
        ? {
              name: currentUserProfile.name,
              image: currentUserProfile.image,
              level: currentUserProfile.level || 1,
              xpPoints: currentUserProfile.xp_points || 0,
              equippedTitle: currentUserProfile.equipped_title,
              equippedFrame: currentUserProfile.equipped_frame || null,
              equippedBanner: currentUserProfile.equipped_banner || null,
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

    // Compute all members for Global Leaderboard tab
    const allDbUsers = await prisma.user.findMany({
        include: {
            gameProgress: {
                where: { status: "COMPLETED" },
                include: { game: true },
            },
        },
        orderBy: { xp_points: "desc" },
    });

    const allMembersStats = allDbUsers.map((u) => {
        const gold = u.gameProgress.filter((p) => p.game.quest_type === "MAIN_QUEST").length;
        const silver = u.gameProgress.filter((p) => p.game.quest_type === "SIDE_QUEST").length;
        const platinums = u.gameProgress.filter((p) => p.is_platinum).length;
        return {
            id: u.id,
            name: u.name || u.username || "Gamer",
            username: u.username,
            image: u.image,
            level: u.level || 1,
            xp_points: u.xp_points || 0,
            goldMedals: gold,
            silverMedals: silver,
            platinumCount: platinums,
        };
    });

    // Build Guild Master status data
    const guildMainGame = latestMainPool?.winner_game
        ? {
              id: latestMainPool.winner_game.id,
              title: latestMainPool.winner_game.title,
              cover_url: latestMainPool.winner_game.cover_url,
              artwork_url: latestMainPool.winner_game.artwork_url,
              quest_type: "MAIN_QUEST" as const,
              hltb_time: latestMainPool.winner_game.hltb_time,
              playersProgress: activeUsers.map((u) => {
                  const prog = completedProgresses.find((p) => p.user_id === u.id && p.game_id === latestMainPool.winner_game!.id)
                      || recentProgress.find((p) => p.user_id === u.id && p.game_id === latestMainPool.winner_game!.id);
                  return {
                      name: u.name || u.email?.split("@")[0] || "Jogador",
                      progress_percentage: prog?.progress_percentage ?? 0,
                      status: prog?.status ?? "ACTIVE",
                  };
              }),
          }
        : null;

    const guildSideGame = latestSidePool?.winner_game
        ? {
              id: latestSidePool.winner_game.id,
              title: latestSidePool.winner_game.title,
              cover_url: latestSidePool.winner_game.cover_url,
              artwork_url: latestSidePool.winner_game.artwork_url,
              quest_type: "SIDE_QUEST" as const,
              hltb_time: latestSidePool.winner_game.hltb_time,
              playersProgress: activeUsers.map((u) => {
                  const prog = completedProgresses.find((p) => p.user_id === u.id && p.game_id === latestSidePool.winner_game!.id)
                      || recentProgress.find((p) => p.user_id === u.id && p.game_id === latestSidePool.winner_game!.id);
                  return {
                      name: u.name || u.email?.split("@")[0] || "Jogador",
                      progress_percentage: prog?.progress_percentage ?? 0,
                      status: prog?.status ?? "ACTIVE",
                  };
              }),
          }
        : null;

    return (
        <div className="mx-auto w-full max-w-[1920px] space-y-6 sm:space-y-8 px-2 sm:px-6 py-3 sm:py-8 md:px-8 lg:px-12 lg:py-12">
            {/* Active Pause Quorum Voting Banner */}
            <ActivePauseVotingBanner
                proposals={pendingProposals}
                currentUserId={userId}
                currentUserEmail={session?.user?.email || undefined}
            />

            {/* Active Pause Quorum Floating Toast Notification */}
            <ActivePauseVotingToast
                proposals={pendingProposals}
                currentUserId={userId}
            />

            {/* Deals Tracker Subtle All-Time Low Alert */}
            <TrackedDealsAlert />

            {/* Gamification Profile Banner */}
            {userWidgetData && (
                <div className="w-full">
                    <UserProfileWidget user={userWidgetData} />
                </div>
            )}

            {/* Row 1: Active Quests */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <ActiveQuestHero
                    activePool={isMaster ? latestMainPool : null}
                    progress={mainQuestProgress}
                    userName={session?.user?.name ?? "Comandante"}
                />
                <SideQuestBar
                    activePool={isMaster ? latestSidePool : null}
                    progress={sideQuestProgress}
                />
            </div>

            {/* Status da Guilda Oficial dos Fundadores */}
            <GuildStatusCard mainGame={guildMainGame} sideGame={guildSideGame} />

            {/* Row 3: Stats Cards Grid */}
            <StatsGrid reviews={randomReviewsForStats} />

            {/* Row 4: Recent Activity & Fila do INSS */}
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <RecentActivity events={rawEvents} />
                <Leaderboard players={playersStats} allMembers={allMembersStats} />
            </div>
        </div>
    );
}
