"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRandomizerPlayer, RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";
import { isGuildMaster } from "@/lib/permissions";
import { generateContractsForGame } from "@/services/notice-board-service";
import { recalculateUserXPAndLevel } from "@/app/lib/gamification-actions";
import { ensureUserContractProgress } from "@/services/notice-board-progression";

export { ensureUserContractProgress };

export async function generateNoticeBoardAction(gameId: string) {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return { success: false, error: "Usuário não autenticado" };
    }

    try {
        const game = await prisma.game.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "Jogo não encontrado" };
        }

        // 1. VERIFICAÇÃO DE CACHE GLOBAL (Custo R$ 0,00 se o jogo já possui mural gerado no banco)
        const existingContracts = await prisma.campaignContract.findMany({
            where: { game_id: gameId },
            orderBy: { sequence_order: "asc" },
        });

        if (existingContracts.length > 0) {
            await ensureUserContractProgress(session.user.id, gameId);
            revalidatePath("/dashboard");
            revalidatePath("/board");
            revalidatePath(`/games/${gameId}`);
            return { success: true, cached: true };
        }

        // 2. VERIFICAÇÃO DE PERMISSÕES, TOKENS E COOLDOWN PARA MEMBROS
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { success: false, error: "Usuário não encontrado no sistema" };
        }

        const isGM = isGuildMaster(user);

        if (!isGM) {
            const now = new Date();
            let currentTokens = user.notice_board_tokens ?? 2;
            const lastReset = user.last_token_reset ? new Date(user.last_token_reset) : now;

            // Reset mensal automático de tokens
            if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
                currentTokens = 2;
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        notice_board_tokens: 2,
                        last_token_reset: now,
                    },
                });
            }

            // Checar se está em cooldown por abandono prematuro
            if (user.ai_cooldown_until && new Date(user.ai_cooldown_until) > now) {
                const diffDays = Math.ceil((new Date(user.ai_cooldown_until).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    success: false,
                    error: `Você está em cooldown por ter abandonado uma quest recentemente com pouco progresso. A geração por IA estará liberada em ${diffDays} dia(s). Você pode utilizar a Trilha Manual gratuitamente a qualquer momento!`,
                };
            }

            // Checar saldo de tokens
            if (currentTokens <= 0) {
                return {
                    success: false,
                    error: "Você atingiu seu limite de 2 tokens de geração de mural por IA deste mês. Seus tokens serão renovados no próximo mês. Você pode utilizar a Trilha Manual gratuitamente!",
                };
            }
        }

        // 3. GERAR CONTRATOS VIA GEMINI
        const generatedContracts = await generateContractsForGame({
            title: game.title,
            quest_type: game.quest_type,
            platform: game.platform,
            hltb_time: game.hltb_time,
        });

        // Buscar usuários fundadores caso o criador seja GM
        const activeUsers = isGM
            ? await prisma.user.findMany({
                  where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
              })
            : [user];

        await prisma.$transaction(async (tx) => {
            // Criar contratos
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

            // Inicializar o progresso de contratos para os usuários participantes
            const progressData = [];
            for (const u of activeUsers) {
                for (const contract of dbContracts) {
                    progressData.push({
                        user_id: u.id,
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

            // Se for MEMBER, consumir 1 token
            if (!isGM) {
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        notice_board_tokens: { decrement: 1 },
                    },
                });
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/board");
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error) {
        console.error("Erro em generateNoticeBoardAction:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Falha ao gerar Quadro de Avisos: " + errorMessage };
    }
}

/**
 * Cria uma trilha manual/clássica de 4 capítulos para qualquer jogo sem nenhum consumo de IA ou tokens.
 */
export async function generateManualNoticeBoardAction(gameId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    try {
        const game = await prisma.game.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "Jogo não encontrado" };
        }

        const existingContracts = await prisma.campaignContract.findMany({
            where: { game_id: gameId },
        });

        if (existingContracts.length > 0) {
            await ensureUserContractProgress(session.user.id, gameId);
            revalidatePath("/dashboard");
            revalidatePath("/board");
            return { success: true, cached: true };
        }

        const defaultMilestones = [
            { sequence_order: 1, title: "Capítulo 1: O Início da Jornada", objective: "Explorar a introdução do jogo e completar os primeiros 25% da campanha.", progress_percentage: 25 },
            { sequence_order: 2, title: "Capítulo 2: Enfrentando os Desafios", objective: "Avançar na história principal até atingir 50% de conclusão.", progress_percentage: 50 },
            { sequence_order: 3, title: "Capítulo 3: A Reta Final", objective: "Superar os grandes obstáculos e alcançar 75% da campanha.", progress_percentage: 75 },
            { sequence_order: 4, title: "Capítulo 4: O Clímax & Conclusão", objective: "Vencer o confronto final e concluir 100% da campanha principal.", progress_percentage: 100 },
        ];

        await prisma.$transaction(async (tx) => {
            const dbContracts = await tx.campaignContract.createManyAndReturn({
                data: defaultMilestones.map((m) => ({
                    game_id: gameId,
                    sequence_order: m.sequence_order,
                    title: m.title,
                    objective: m.objective,
                    daily_atomic_quest: "",
                    progress_percentage: m.progress_percentage,
                })),
            });

            const progressData = dbContracts.map((contract) => ({
                user_id: session.user.id,
                contract_id: contract.id,
                status: contract.sequence_order === 1 ? ("AVAILABLE" as const) : ("LOCKED" as const),
            }));

            await tx.campaignContractProgress.createMany({
                data: progressData,
                skipDuplicates: true,
            });
        });

        revalidatePath("/dashboard");
        revalidatePath("/board");
        revalidatePath(`/games/${gameId}`);
        return { success: true };
    } catch (error) {
        console.error("Erro em generateManualNoticeBoardAction:", error);
        return { success: false, error: "Falha ao criar trilha manual." };
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

