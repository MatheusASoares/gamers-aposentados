"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRandomizerPlayer, RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";
import { generateContractsForGame } from "@/services/notice-board-service";
import { recalculateUserXPAndLevel } from "@/app/lib/gamification-actions";
import { ensureUserContractProgress } from "@/services/notice-board-progression";

export { ensureUserContractProgress };

export async function generateNoticeBoardAction(gameId: string) {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: "Usuário não autenticado" };
    }

    if (!isRandomizerPlayer(session.user.email)) {
        return { success: false, error: "Acesso negado: apenas jogadores autorizados podem gerar o Notice Board" };
    }

    try {
        const game = await prisma.game.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "Jogo não encontrado" };
        }

        // Buscar contratos estruturados gerados via Gemini
        const generatedContracts = await generateContractsForGame({
            title: game.title,
            quest_type: game.quest_type,
            platform: game.platform,
            hltb_time: game.hltb_time,
        });

        // Buscar todos os jogadores ativos
        const activeUsers = await prisma.user.findMany({
            where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
        });

        await prisma.$transaction(async (tx) => {
            // 1. Limpar contratos antigos se houver (cascata deletará o progresso dos contratos)
            await tx.campaignContract.deleteMany({
                where: { game_id: gameId },
            });

            // 2. Criar os registros de definições dos contratos do jogo em lote (batching)
            const dbContracts = await tx.campaignContract.createManyAndReturn({
                data: generatedContracts.map((contract) => ({
                    game_id: gameId,
                    sequence_order: contract.sequence_order,
                    title: contract.title,
                    objective: contract.objective,
                    daily_atomic_quest: "",
                    progress_percentage: contract.progress_percentage,
                })),
            });

            // 3. Inicializar o progresso de contratos para cada usuário ativo
            const progressData = [];
            for (const user of activeUsers) {
                for (const contract of dbContracts) {
                    progressData.push({
                        user_id: user.id,
                        contract_id: contract.id,
                        status: contract.sequence_order === 1 ? ("AVAILABLE" as const) : ("LOCKED" as const),
                    });
                }
            }

            if (progressData.length > 0) {
                await tx.campaignContractProgress.createMany({
                    data: progressData,
                    skipDuplicates: true,
                });
            }
        });

        revalidatePath("/dashboard");
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error) {
        console.error("Erro em generateNoticeBoardAction:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Falha ao gerar Quadro de Avisos: " + errorMessage };
    }
}

export async function clearNoticeBoardAction(gameId: string) {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: "Usuário não autenticado" };
    }

    if (!isRandomizerPlayer(session.user.email)) {
        return { success: false, error: "Acesso negado: apenas jogadores autorizados podem limpar o Notice Board" };
    }

    try {
        await prisma.campaignContract.deleteMany({
            where: { game_id: gameId },
        });

        // Reset progress_percentage to 0 for this game
        await prisma.gameProgress.updateMany({
            where: { game_id: gameId },
            data: { progress_percentage: 0 },
        });

        revalidatePath("/dashboard");
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error) {
        console.error("Erro em clearNoticeBoardAction:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Falha ao limpar contratos: " + errorMessage };
    }
}


export async function completeContractAction(contractProgressId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Localizar o progresso do contrato do usuário
            const currentProgress = await tx.campaignContractProgress.findUnique({
                where: { id: contractProgressId },
                include: {
                    contract: true,
                },
            });

            if (!currentProgress) {
                throw new Error("Contrato não encontrado");
            }

            if (currentProgress.user_id !== userId) {
                throw new Error("Acesso negado: progresso de contrato pertence a outro usuário");
            }

            if (currentProgress.status !== "AVAILABLE") {
                throw new Error("Este contrato não está disponível para ser completado");
            }

            // 2. Marcar como completo
            await tx.campaignContractProgress.update({
                where: { id: contractProgressId },
                data: { status: "COMPLETED" },
            });

            const gameId = currentProgress.contract.game_id;
            const completedPercentage = currentProgress.contract.progress_percentage;

            // 3. Atualizar a porcentagem de progresso do jogo do usuário (GameProgress)
            const gameProgress = await tx.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: userId,
                        game_id: gameId,
                    },
                },
            });

            let isGameFinished = false;
            if (gameProgress) {
                isGameFinished = completedPercentage === 100;
                await tx.gameProgress.update({
                    where: { id: gameProgress.id },
                    data: {
                        progress_percentage: completedPercentage,
                        status: isGameFinished ? "COMPLETED" : undefined,
                        end_date: isGameFinished ? new Date() : undefined,
                    },
                });
            }

            // 4. Destravar o próximo contrato na sequência se existir
            const nextContract = await tx.campaignContract.findFirst({
                where: {
                    game_id: gameId,
                    sequence_order: currentProgress.contract.sequence_order + 1,
                },
            });

            if (nextContract) {
                await tx.campaignContractProgress.update({
                    where: {
                        user_id_contract_id: {
                            user_id: userId,
                            contract_id: nextContract.id,
                        },
                    },
                    data: { status: "AVAILABLE" },
                });
            }

            return { success: true, isGameFinished };
        });

        if (result.isGameFinished) {
            await recalculateUserXPAndLevel(userId);
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Erro em completeContractAction:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Falha ao completar contrato: " + errorMessage };
    }
}

export async function uncompleteContractAction(contractProgressId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Localizar o progresso do contrato do usuário
            const currentProgress = await tx.campaignContractProgress.findUnique({
                where: { id: contractProgressId },
                include: {
                    contract: true,
                },
            });

            if (!currentProgress) {
                throw new Error("Contrato não encontrado");
            }

            if (currentProgress.user_id !== userId) {
                throw new Error("Acesso negado: progresso de contrato pertence a outro usuário");
            }

            if (currentProgress.status !== "COMPLETED") {
                throw new Error("Este contrato não está concluído para ser desfeito");
            }

            const gameId = currentProgress.contract.game_id;
            const currentOrder = currentProgress.contract.sequence_order;

            // 2. Colocar o contrato atual de volta como "AVAILABLE"
            await tx.campaignContractProgress.update({
                where: { id: contractProgressId },
                data: { status: "AVAILABLE" },
            });

            // 3. Buscar outros contratos COMPLETED deste jogo para este usuário
            const otherCompletedProgresses = await tx.campaignContractProgress.findMany({
                where: {
                    user_id: userId,
                    status: "COMPLETED",
                    contract: {
                        game_id: gameId,
                    },
                },
                include: {
                    contract: true,
                },
                orderBy: {
                    contract: {
                        sequence_order: "desc",
                    },
                },
            });

            // Calcular nova porcentagem baseada no maior contrato ainda concluído
            const newPercentage = otherCompletedProgresses.length > 0
                ? otherCompletedProgresses[0].contract.progress_percentage
                : 0;

            // 4. Atualizar o progresso do jogo (GameProgress)
            const gameProgress = await tx.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: userId,
                        game_id: gameId,
                    },
                },
            });

            let isStillFinished = false;
            if (gameProgress) {
                isStillFinished = newPercentage === 100;
                await tx.gameProgress.update({
                    where: { id: gameProgress.id },
                    data: {
                        progress_percentage: newPercentage,
                        status: isStillFinished ? "COMPLETED" : "ACTIVE",
                        end_date: isStillFinished ? gameProgress.end_date : null,
                    },
                });
            }

            // 5. Bloquear (LOCKED) o próximo contrato se ele estiver como "AVAILABLE" e não concluído
            const nextContract = await tx.campaignContract.findFirst({
                where: {
                    game_id: gameId,
                    sequence_order: currentOrder + 1,
                },
            });

            if (nextContract) {
                const nextProgress = await tx.campaignContractProgress.findUnique({
                    where: {
                        user_id_contract_id: {
                            user_id: userId,
                            contract_id: nextContract.id,
                        },
                    },
                });

                if (nextProgress && nextProgress.status === "AVAILABLE") {
                    await tx.campaignContractProgress.update({
                        where: { id: nextProgress.id },
                        data: { status: "LOCKED" },
                    });
                }
            }

            const wasCompleted = gameProgress?.status === "COMPLETED";
            return { success: true, isStillFinished, wasCompleted };
        });

        if (result.wasCompleted && !result.isStillFinished) {
            await recalculateUserXPAndLevel(userId);
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Erro em uncompleteContractAction:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Falha ao desfazer compleção: " + errorMessage };
    }
}

