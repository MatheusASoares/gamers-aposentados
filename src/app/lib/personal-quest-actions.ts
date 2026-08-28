"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { QuestType } from "@prisma/client";

export interface PersonalGameInput {
    title: string;
    igdb_id?: string | null;
    cover_url?: string | null;
    artwork_url?: string | null;
    quest_type: QuestType;
    hltb_time?: number | null;
    platform?: string | null;
}

export interface ActiveQuestDTO {
    gameId: string;
    title: string;
    coverUrl: string | null;
    artworkUrl: string | null;
    questType: QuestType;
    progressPercentage: number;
    hltbTime: number | null;
    status: string;
}

/**
 * Busca as quests ativas do usuário (Main e Side).
 */
export async function getUserPersonalActiveQuests(userId?: string): Promise<{
    activeMain: ActiveQuestDTO | null;
    activeSide: ActiveQuestDTO | null;
}> {
    let targetId = userId;
    if (!targetId) {
        const session = await auth();
        targetId = session?.user?.id;
    }
    if (!targetId) return { activeMain: null, activeSide: null };

    try {
        const activeProgresses = await prisma.gameProgress.findMany({
            where: {
                user_id: targetId,
                status: "ACTIVE",
            },
            orderBy: {
                updated_at: "desc",
            },
            include: {
                game: true,
            },
        });

        const mainProgress = activeProgresses.find((p) => p.game.quest_type === "MAIN_QUEST");
        const sideProgress = activeProgresses.find((p) => p.game.quest_type === "SIDE_QUEST");

        return {
            activeMain: mainProgress
                ? {
                      gameId: mainProgress.game.id,
                      title: mainProgress.game.title,
                      coverUrl: mainProgress.game.cover_url,
                      artworkUrl: mainProgress.game.artwork_url,
                      questType: "MAIN_QUEST",
                      progressPercentage: mainProgress.progress_percentage,
                      hltbTime: mainProgress.game.hltb_time,
                      status: mainProgress.status,
                  }
                : null,
            activeSide: sideProgress
                ? {
                      gameId: sideProgress.game.id,
                      title: sideProgress.game.title,
                      coverUrl: sideProgress.game.cover_url,
                      artworkUrl: sideProgress.game.artwork_url,
                      questType: "SIDE_QUEST",
                      progressPercentage: sideProgress.progress_percentage,
                      hltbTime: sideProgress.game.hltb_time,
                      status: sideProgress.status,
                  }
                : null,
        };
    } catch (error) {
        console.error("Erro ao buscar quests ativas do usuário:", error);
        return { activeMain: null, activeSide: null };
    }
}

/**
 * Ativa diretamente um jogo como Main Quest ou Side Quest pessoal para o usuário logado.
 * Possui trava estrita: rejeita se o usuário já tiver uma quest ativa na mesma categoria.
 */
export async function setPersonalActiveQuest(data: PersonalGameInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado." };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Trava estrita: Se o usuário já tiver uma quest ACTIVE da mesma categoria, bloquear nova seleção
            const currentActive = await tx.gameProgress.findFirst({
                where: {
                    user_id: session.user.id,
                    status: "ACTIVE",
                    game: { quest_type: data.quest_type },
                },
                include: { game: true },
            });

            if (currentActive) {
                throw new Error(
                    `Você já possui uma ${data.quest_type === "MAIN_QUEST" ? "Main Quest" : "Side Quest"} ativa ("${currentActive.game.title}"). Complete ou drope a quest atual antes de selecionar um novo jogo.`
                );
            }

            // 2. Localizar ou criar o registro do jogo
            let game = null;
            if (data.igdb_id) {
                game = await tx.game.findUnique({
                    where: { igdb_id: String(data.igdb_id) },
                });
            }

            if (!game) {
                game = await tx.game.findFirst({
                    where: { title: { equals: data.title, mode: "insensitive" } },
                });
            }

            if (!game) {
                game = await tx.game.create({
                    data: {
                        title: data.title,
                        igdb_id: data.igdb_id ? String(data.igdb_id) : null,
                        cover_url: data.cover_url || null,
                        artwork_url: data.artwork_url || null,
                        quest_type: data.quest_type,
                        hltb_time: data.hltb_time || null,
                        platform: data.platform || "PC",
                        nominated_by_id: session.user.id,
                    },
                });
            }

            // 3. Criar ou atualizar o GameProgress deste jogo para ACTIVE
            const userProgress = await tx.gameProgress.upsert({
                where: {
                    user_id_game_id: {
                        user_id: session.user.id,
                        game_id: game.id,
                    },
                },
                update: {
                    status: "ACTIVE",
                    end_date: null,
                },
                create: {
                    user_id: session.user.id,
                    game_id: game.id,
                    status: "ACTIVE",
                    progress_percentage: 0,
                    start_date: new Date(),
                },
            });

            return { success: true, game, userProgress };
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/randomizer");
        revalidatePath("/board");
        revalidatePath("/quests");
        return result;
    } catch (error) {
        console.error("Erro ao definir quest pessoal:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Falha ao definir quest ativa.",
        };
    }
}

/**
 * Realiza um sorteio solo entre os jogos indicados pelo usuário e ativa o vencedor como sua quest pessoal.
 * Possui trava estrita: rejeita se o usuário já tiver uma quest ativa na mesma categoria.
 */
export async function rollPersonalQuest(
    candidates: PersonalGameInput[],
    questType: QuestType,
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado." };
    }

    if (!candidates || candidates.length < 2) {
        return { success: false, error: "São necessários pelo menos 2 jogos para sortear." };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Trava estrita: Se o usuário já tiver uma quest ACTIVE da mesma categoria, bloquear novo sorteio
            const currentActive = await tx.gameProgress.findFirst({
                where: {
                    user_id: session.user.id,
                    status: "ACTIVE",
                    game: { quest_type: questType },
                },
                include: { game: true },
            });

            if (currentActive) {
                throw new Error(
                    `Você já possui uma ${questType === "MAIN_QUEST" ? "Main Quest" : "Side Quest"} ativa ("${currentActive.game.title}"). Complete ou drope a quest atual antes de realizar um novo sorteio.`
                );
            }

            // 2. Sortear um vencedor aleatório
            const randomIndex = Math.floor(Math.random() * candidates.length);
            const picked = candidates[randomIndex];

            // 3. Localizar ou criar o jogo vencedor
            let game = null;
            if (picked.igdb_id) {
                game = await tx.game.findUnique({
                    where: { igdb_id: String(picked.igdb_id) },
                });
            }

            if (!game) {
                game = await tx.game.findFirst({
                    where: { title: { equals: picked.title, mode: "insensitive" } },
                });
            }

            if (!game) {
                game = await tx.game.create({
                    data: {
                        title: picked.title,
                        igdb_id: picked.igdb_id ? String(picked.igdb_id) : null,
                        cover_url: picked.cover_url || null,
                        artwork_url: picked.artwork_url || null,
                        quest_type: questType,
                        hltb_time: picked.hltb_time || null,
                        platform: picked.platform || "PC",
                        nominated_by_id: session.user.id,
                    },
                });
            }

            // 4. Salvar progresso ACTIVE
            const userProgress = await tx.gameProgress.upsert({
                where: {
                    user_id_game_id: {
                        user_id: session.user.id,
                        game_id: game.id,
                    },
                },
                update: {
                    status: "ACTIVE",
                    end_date: null,
                },
                create: {
                    user_id: session.user.id,
                    game_id: game.id,
                    status: "ACTIVE",
                    progress_percentage: 0,
                    start_date: new Date(),
                },
            });

            return { success: true, game, userProgress };
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/randomizer");
        revalidatePath("/board");
        revalidatePath("/quests");
        return result;
    } catch (error) {
        console.error("Erro ao sortear quest pessoal:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Falha ao realizar sorteio.",
        };
    }
}
