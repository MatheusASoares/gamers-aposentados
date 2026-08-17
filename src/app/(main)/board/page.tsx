import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isRandomizerPlayer } from "@/lib/randomizer-players";
import { NoticeBoardMuralClient } from "@/components/contracts/NoticeBoardMuralClient";
import { ensureUserContractProgress } from "@/app/lib/notice-board-actions";

export default async function ContractsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/");
    }

    const userId = session.user.id;
    const userEmail = session.user.email || "";
    const isPlayer = isRandomizerPlayer(userEmail);

    // 1. Buscar se o usuário logado possui uma quest ativa (status === "ACTIVE") na categoria (ex: retomada de quest dropada)
    const [userActiveMainProgress, userActiveSideProgress] = await Promise.all([
        prisma.gameProgress.findFirst({
            where: {
                user_id: userId,
                status: "ACTIVE",
                game: { quest_type: "MAIN_QUEST" },
            },
            include: { game: true },
        }),
        prisma.gameProgress.findFirst({
            where: {
                user_id: userId,
                status: "ACTIVE",
                game: { quest_type: "SIDE_QUEST" },
            },
            include: { game: true },
        }),
    ]);

    // 2. Buscar os pools mais recentes ativos como fallback se o usuário não tiver quest ativa
    const [latestMainPool, latestSidePool] = await Promise.all([
        !userActiveMainProgress
            ? prisma.pool.findFirst({
                  where: { type: "MAIN_QUEST", winner_game_id: { not: null } },
                  orderBy: { created_at: "desc" },
                  include: { winner_game: true },
              })
            : null,
        !userActiveSideProgress
            ? prisma.pool.findFirst({
                  where: { type: "SIDE_QUEST", winner_game_id: { not: null } },
                  orderBy: { created_at: "desc" },
                  include: { winner_game: true },
              })
            : null,
    ]);

    const activeMainGame = userActiveMainProgress?.game || latestMainPool?.winner_game || null;
    const activeSideGame = userActiveSideProgress?.game || latestSidePool?.winner_game || null;

    // Função auxiliar para buscar contratos com o progresso do usuário logado
    const fetchContractsForGame = async (gameId: string | undefined) => {
        if (!gameId) return null;
        await ensureUserContractProgress(userId, gameId);
        return prisma.campaignContract.findMany({
            where: { game_id: gameId },
            orderBy: { sequence_order: "asc" },
            include: {
                user_progresses: {
                    where: { user_id: userId },
                },
            },
        });
    };

    const [mainContracts, sideContracts] = await Promise.all([
        fetchContractsForGame(activeMainGame?.id),
        fetchContractsForGame(activeSideGame?.id),
    ]);

    return (
        <NoticeBoardMuralClient
            isPlayer={isPlayer}
            currentUserId={userId}
            mainGame={activeMainGame}
            sideGame={activeSideGame}
            mainContracts={mainContracts ?? []}
            sideContracts={sideContracts ?? []}
        />
    );
}
