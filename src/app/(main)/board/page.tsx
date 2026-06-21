import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isRandomizerPlayer } from "@/lib/randomizer-players";
import { NoticeBoardMuralClient } from "@/components/contracts/NoticeBoardMuralClient";

export default async function ContractsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/");
    }

    const userId = session.user.id;
    const userEmail = session.user.email || "";
    const isPlayer = isRandomizerPlayer(userEmail);

    // Buscar os pools mais recentes ativos
    const [latestMainPool, latestSidePool] = await Promise.all([
        prisma.pool.findFirst({
            where: { type: "MAIN_QUEST", winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            include: { winner_game: true },
        }),
        prisma.pool.findFirst({
            where: { type: "SIDE_QUEST", winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
            include: { winner_game: true },
        }),
    ]);

    // Função auxiliar para buscar contratos com o progresso do usuário logado
    const fetchContractsForGame = async (gameId: string | undefined) => {
        if (!gameId) return null;
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
        fetchContractsForGame(latestMainPool?.winner_game_id ?? undefined),
        fetchContractsForGame(latestSidePool?.winner_game_id ?? undefined),
    ]);

    return (
        <NoticeBoardMuralClient
            isPlayer={isPlayer}
            mainGame={latestMainPool?.winner_game ?? null}
            sideGame={latestSidePool?.winner_game ?? null}
            mainContracts={mainContracts ?? []}
            sideContracts={sideContracts ?? []}
        />
    );
}
