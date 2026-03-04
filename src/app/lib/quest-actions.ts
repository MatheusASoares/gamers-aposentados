"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";

export async function updateQuestProgress(gameId: string, percentage: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const existingProgress = await prisma.gameProgress.findUnique({
            where: {
                user_id_game_id: {
                    user_id: session.user.id,
                    game_id: gameId,
                },
            },
        });

        const dataToUpdate: any = { progress_percentage: percentage };
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

        await prisma.gameProgress.upsert({
            where: {
                user_id_game_id: {
                    user_id: session.user.id,
                    game_id: gameId,
                },
            },
            update: dataToUpdate,
            create: {
                user_id: session.user.id,
                game_id: gameId,
                progress_percentage: percentage,
                status: percentage === 100 ? "COMPLETED" : "ACTIVE",
                start_date: new Date(),
                ...(percentage === 100 ? { end_date: new Date() } : {}),
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("Error updating progress:", e);
        return { success: false, error: e.message };
    }
}

export async function completeQuest(gameId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await prisma.gameProgress.upsert({
            where: {
                user_id_game_id: {
                    user_id: session.user.id,
                    game_id: gameId,
                },
            },
            update: {
                progress_percentage: 100,
                status: "COMPLETED",
                end_date: new Date(),
            },
            create: {
                user_id: session.user.id,
                game_id: gameId,
                progress_percentage: 100,
                status: "COMPLETED",
                start_date: new Date(),
                end_date: new Date(),
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("Error completing quest:", e);
        return { success: false, error: e.message };
    }
}

export async function dropQuest(gameId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await prisma.gameProgress.upsert({
            where: {
                user_id_game_id: {
                    user_id: session.user.id,
                    game_id: gameId,
                },
            },
            update: {
                status: "DROPPED",
                end_date: new Date(),
            },
            create: {
                user_id: session.user.id,
                game_id: gameId,
                status: "DROPPED",
                start_date: new Date(),
                end_date: new Date(),
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("Error dropping quest:", e);
        return { success: false, error: e.message };
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

export async function joinQuest(gameId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await prisma.gameProgress.create({
            data: {
                user_id: session.user.id,
                game_id: gameId,
                status: "ACTIVE",
                progress_percentage: 0,
                start_date: new Date(),
            },
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("Error joining quest:", e);
        return { success: false, error: "Este jogo já está na sua lista ou ocorreu um erro." };
    }
}
