"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";

import { recalculateUserXPAndLevel } from "@/app/lib/gamification-actions";

export async function updateQuestProgress(
    gameId: string,
    percentage: number,
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const existingProgress = await tx.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: session.user.id,
                        game_id: gameId,
                    },
                },
            });

            const dataToUpdate: Prisma.GameProgressUpdateInput = { progress_percentage: percentage };
            if (percentage === 100) {
                dataToUpdate.status = "COMPLETED";
                dataToUpdate.end_date = new Date();
            } else if (
                existingProgress &&
                (existingProgress.status === "COMPLETED" || existingProgress.status === "DROPPED")
            ) {
                dataToUpdate.status = "ACTIVE";
                dataToUpdate.end_date = null;
            }

            if (existingProgress) {
                await tx.gameProgress.update({
                    where: { id: existingProgress.id },
                    data: dataToUpdate,
                });
            } else {
                await tx.gameProgress.create({
                    data: {
                        user_id: session.user.id,
                        game_id: gameId,
                        progress_percentage: percentage,
                        status: percentage === 100 ? "COMPLETED" : "ACTIVE",
                        start_date: new Date(),
                        ...(percentage === 100 ? { end_date: new Date() } : {}),
                    },
                });
            }
            return { success: true };
        });

        await recalculateUserXPAndLevel(session.user.id);

        revalidatePath("/");
        revalidatePath("/quests");
        revalidatePath("/dashboard");
        revalidatePath("/reviews");
        return result;
    } catch (e: unknown) {
        console.error("Error updating progress:", e);
        return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
}

export async function completeQuest(gameId: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: session.user.id,
                        game_id: gameId,
                    },
                },
            });

            if (existing) {
                if (existing.status === "COMPLETED") {
                    return { success: true };
                }
                await tx.gameProgress.update({
                    where: { id: existing.id },
                    data: {
                        progress_percentage: 100,
                        status: "COMPLETED",
                        end_date: new Date(),
                    },
                });
            } else {
                await tx.gameProgress.create({
                    data: {
                        user_id: session.user.id,
                        game_id: gameId,
                        progress_percentage: 100,
                        status: "COMPLETED",
                        start_date: new Date(),
                        end_date: new Date(),
                    },
                });
            }
            return { success: true };
        });

        await recalculateUserXPAndLevel(session.user.id);

        revalidatePath("/");
        revalidatePath("/quests");
        revalidatePath("/dashboard");
        revalidatePath("/reviews");
        return result;
    } catch (e: unknown) {
        console.error("Error completing quest:", e);
        return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
}

export async function dropQuest(gameId: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: session.user.id,
                        game_id: gameId,
                    },
                },
            });

            if (existing) {
                if (existing.status === "DROPPED") {
                    return { success: true };
                }
                await tx.gameProgress.update({
                    where: { id: existing.id },
                    data: {
                        status: "DROPPED",
                        end_date: new Date(),
                    },
                });
            } else {
                await tx.gameProgress.create({
                    data: {
                        user_id: session.user.id,
                        game_id: gameId,
                        status: "DROPPED",
                        start_date: new Date(),
                        end_date: new Date(),
                    },
                });
            }
            return { success: true };
        });

        revalidatePath("/");
        revalidatePath("/quests");
        revalidatePath("/dashboard");
        revalidatePath("/reviews");
        return result;
    } catch (e: unknown) {
        console.error("Error dropping quest:", e);
        return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
}

// Verifica se podemos sortear de novo (Regra 2 da Pool: Só pode rolar se nenhum deles tiver a quest aberta)
export async function getRandomizerStatus(questType: "MAIN_QUEST" | "SIDE_QUEST") {
    try {
        // Acha qual é o jogo atual da quest type selecionada (pegamos da pool ativa mais recente)
        const lastPool = await prisma.pool.findFirst({
            where: { type: questType, winner_game_id: { not: null } },
            orderBy: { created_at: "desc" },
        });

        if (!lastPool || !lastPool.winner_game_id) {
            return { locked: false };
        }

        const activeGameId = lastPool.winner_game_id;

        // Verifica se algum usuário ainda está com esse jogo ACTIVE
        // Agora filtra apenas pelos jogadores oficiais do Randomizer (Matheus e Lucas)
        const activeProgresses = await prisma.gameProgress.findMany({
            where: {
                game_id: activeGameId,
                status: "ACTIVE",
                user: {
                    email: {
                        in: RANDOMIZER_PLAYER_EMAILS,
                    },
                },
            },
            include: { user: true },
        });

        if (activeProgresses.length > 0) {
            const usersPending = activeProgresses
                .map((p) => p.user.name || p.user.username || "Alguém")
                .join(" e ");

            return {
                locked: true,
                message: `O jogo atual da quest ainda está aberto para: ${usersPending}. Eles precisam Drop ou Completar antes de um novo sorteio.`,
            };
        }

        return { locked: false };
    } catch (e) {
        console.error("Erro ao validar status do Randomizer:", e);
        return { locked: true, message: "Erro de validação do banco." };
    }
}

export async function joinQuest(gameId: string): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: session.user.id,
                        game_id: gameId,
                    },
                },
            });

            if (existing) {
                // Clique duplo concorrente: se já for active, considera sucesso sem duplicar
                if (existing.status === "ACTIVE") {
                    return { success: true };
                }

                // Regra 2: "Se o jogo for completed por 1 player ele nao pode participar de quest novamente"
                if (existing.status === "COMPLETED") {
                    return { success: false, error: "Este jogo já foi concluído e não pode ser jogado novamente." };
                }

                // Regra 2.1: "se ele for dropped pelos 2 players, pode participar novamente"
                const activeUsers = await tx.user.findMany({
                    where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
                    select: { id: true },
                });
                const activeUserIds = activeUsers.map((u) => u.id);

                const allProgresses = await tx.gameProgress.findMany({
                    where: {
                        game_id: gameId,
                        user_id: { in: activeUserIds },
                    },
                });

                const droppedCount = allProgresses.filter((p) => p.status === "DROPPED").length;
                if (droppedCount >= activeUserIds.length) {
                    await tx.gameProgress.update({
                        where: { id: existing.id },
                        data: {
                            status: "ACTIVE",
                            progress_percentage: 0,
                            start_date: new Date(),
                            end_date: null,
                        },
                    });
                    return { success: true };
                } else {
                    return {
                        success: false,
                        error: "Este jogo não pode ser iniciado porque não foi abandonado (dropped) por ambos os jogadores oficiais.",
                    };
                }
            }

            await tx.gameProgress.create({
                data: {
                    user_id: session.user.id,
                    game_id: gameId,
                    status: "ACTIVE",
                    progress_percentage: 0,
                    start_date: new Date(),
                },
            });
            return { success: true };
        });

        revalidatePath("/");
        return result;
    } catch (e: unknown) {
        console.error("Error joining quest:", e);
        return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
}
