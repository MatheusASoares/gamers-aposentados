"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRandomizerPlayer, RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";

// ---------- Types ----------

export interface PoolEntryData {
    id: string; // PoolEntry ID (from DB)
    gameTitle: string;
    gameImageUrl: string;
    gameIgdbId: string; // ID from IGDB search
    userId: string;
    userName: string;
    hltb_time?: number | null;
}

export interface PoolData {
    poolId: string;
    questType: "MAIN" | "SIDE";
    status: import("@prisma/client").$Enums.PoolStatus;
    entries: PoolEntryData[];
    winnerId?: string | null;
    winnerTitle?: string | null;
    winnerImageUrl?: string | null;
}

// ---------- Get or Create Open Pool ----------

export async function getOpenPool(questType: "MAIN" | "SIDE"): Promise<PoolData | null> {
    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    try {
        const pool = await prisma.pool.findFirst({
            where: { type: typeEnum, status: "OPEN" },
            include: {
                entries: {
                    include: {
                        game: true,
                        user: true,
                    },
                },
                winner_game: true,
            },
        });

        if (!pool) return null;

        return {
            poolId: pool.id,
            questType,
            status: pool.status,
            entries: pool.entries.map((e) => ({
                id: e.id,
                gameTitle: e.game.title,
                gameImageUrl: e.game.cover_url || "",
                gameIgdbId: e.game_id,
                userId: e.user_id,
                userName: e.user.name || e.user.username || "Unknown",
                hltb_time: e.game.hltb_time,
            })),
            winnerId: pool.winner_game_id,
            winnerTitle: pool.winner_game?.title,
            winnerImageUrl: pool.winner_game?.cover_url,
        };
    } catch (error) {
        console.error("Error fetching open pool:", error);
        return null;
    }
}

// ---------- Save Selections (Batch) ----------

export interface GameSelection {
    igdbId: string;
    nome: string;
    imageUrl: string;
}

export async function saveSelections(questType: "MAIN" | "SIDE", games: GameSelection[]) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!isRandomizerPlayer(userEmail)) {
        return {
            success: false,
            error: "Você não tem permissão para adicionar jogos ao Randomizer",
        };
    }

    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";
    const maxPerPerson = questType === "MAIN" ? 2 : 3;

    if (games.length > maxPerPerson) {
        return {
            success: false,
            error: `Máximo de ${maxPerPerson} jogos por pessoa para ${questType} Quest`,
        };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create the OPEN pool for this quest type
            let pool = await tx.pool.findFirst({
                where: { type: typeEnum, status: "OPEN" },
            });

            if (!pool) {
                pool = await tx.pool.create({
                    data: {
                        type: typeEnum,
                        status: "OPEN",
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                    },
                });
            }

            // 2. LOCK PESSIMISTA: Previne que outros usuários modifiquem este pote simultaneamente
            // e garante que o pote não seja sorteado (fechado) enquanto salvamos.
            await tx.$executeRaw`SELECT * FROM pools WHERE id = ${pool.id} FOR UPDATE`;

            // Double Check: O pote ainda está aberto após obtermos o lock?
            const freshPool = await tx.pool.findUnique({ where: { id: pool.id } });
            if (!freshPool || freshPool.status !== "OPEN") {
                throw new Error("Este pote foi fechado por outro usuário enquanto você salvava.");
            }

            // 3. Remove existing entries from THIS user in THIS pool
            await tx.poolEntry.deleteMany({
                where: {
                    pool_id: pool.id,
                    user_id: userId,
                },
            });

            // 3. Create or find each game and create pool entries
            for (const game of games) {
                // Check if game already exists by title or igdb id
                let dbGame = await tx.game.findFirst({
                    where: {
                        OR: [{ igdb_id: game.igdbId }, { title: game.nome }],
                    },
                });

                if (!dbGame) {
                    dbGame = await tx.game.create({
                        data: {
                            igdb_id: game.igdbId,
                            title: game.nome,
                            cover_url: game.imageUrl,
                            quest_type: typeEnum,
                            nominated_by_id: userId,
                        },
                    });
                } else if (!dbGame.igdb_id || (!dbGame.cover_url && game.imageUrl)) {
                    dbGame = await tx.game.update({
                        where: { id: dbGame.id },
                        data: {
                            igdb_id: dbGame.igdb_id ? undefined : game.igdbId,
                            cover_url: !dbGame.cover_url ? game.imageUrl : undefined,
                        },
                    });
                }

                // Create pool entry
                await tx.poolEntry.create({
                    data: {
                        pool_id: pool.id,
                        game_id: dbGame.id,
                        user_id: userId,
                    },
                });
            }

            return pool.id;
        });

        revalidatePath("/randomizer");
        return { success: true, poolId: result };
    } catch (error: unknown) {
        console.error("Error saving selections:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return {
            success: false,
            error: "Erro ao salvar seleções: " + errorMessage,
        };
    }
}

// ---------- Remove a Single Entry ----------

export async function removeEntry(entryId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    try {
        // Only allow user to remove their own entries
        const entry = await prisma.poolEntry.findUnique({
            where: { id: entryId },
        });

        if (!entry) {
            return { success: false, error: "Entrada não encontrada" };
        }

        if (entry.user_id !== session.user.id) {
            return { success: false, error: "Você só pode remover seus próprios jogos" };
        }

        await prisma.poolEntry.delete({ where: { id: entryId } });

        revalidatePath("/randomizer");
        return { success: true };
    } catch (error: unknown) {
        console.error("Error removing entry:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Erro ao remover: " + errorMessage };
    }
}

// ---------- Execute Roll (Server-Side) ----------

export async function executeRoll(poolId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    try {
        // Pré-busca apenas os usuários ativos (Lucas e Matheus) fora da transação
        // Isso evita segurar o lock do banco em operações de leitura lentas
        const activeUsers = await prisma.user.findMany({
            where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
        });

        const result = await prisma.$transaction(async (tx) => {
            // 1. LOCK PESSIMISTA: Trava o pote para evitar que novos jogos sejam adicionados durante o sorteio
            await tx.$executeRaw`SELECT * FROM pools WHERE id = ${poolId} FOR UPDATE`;

            const pool = await tx.pool.findUnique({
                where: { id: poolId },
                include: {
                    entries: {
                        include: { game: true },
                    },
                },
            });

            if (!pool) throw new Error("Pool não encontrada");
            if (pool.status !== "OPEN") throw new Error("Pool já foi sorteada ou fechada");
            if (!pool.entries || pool.entries.length === 0) throw new Error("Pool vazia");

            // Verify pool is complete
            const typeEnum = pool.type;
            const maxPerPerson = typeEnum === "MAIN_QUEST" ? 2 : 3;
            const totalRequired = maxPerPerson * 2;

            if (pool.entries.length < totalRequired) {
                throw new Error(`Pool incompleta: ${pool.entries.length}/${totalRequired} jogos`);
            }

            // SERVER-SIDE RANDOM - transparent and unbiased
            const randomIndex = Math.floor(Math.random() * pool.entries.length);
            const winnerEntry = pool.entries[randomIndex];

            // Close pool with winner
            await tx.pool.update({
                where: { id: poolId },
                data: {
                    status: "CLOSED",
                    winner_game_id: winnerEntry.game_id,
                },
            });

            // Ensure all pool games have GameProgress for active users
            const progressData = [];
            for (const entry of pool.entries) {
                for (const user of activeUsers) {
                    progressData.push({
                        user_id: user.id,
                        game_id: entry.game_id,
                        status: "SUGGESTED" as const,
                    });
                }
            }

            if (progressData.length > 0) {
                await tx.gameProgress.createMany({
                    data: progressData,
                    skipDuplicates: true,
                });
            }

            // Set winner game to ACTIVE for all users
            await tx.gameProgress.updateMany({
                where: { game_id: winnerEntry.game_id },
                data: {
                    status: "ACTIVE",
                    start_date: new Date(),
                },
            });

            return {
                winnerId: winnerEntry.game_id,
                winnerTitle: winnerEntry.game.title,
                winnerImageUrl: winnerEntry.game.cover_url,
            };
        });

        revalidatePath("/randomizer");
        revalidatePath("/");
        return { success: true, ...result };
    } catch (error: unknown) {
        console.error("Error executing roll:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Erro no sorteio: " + errorMessage };
    }
}
