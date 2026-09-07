"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getRandomizerStatus } from "./quest-actions";
import { getActiveGuild } from "./guild-actions";

// ---------- Types ----------

export interface PoolEntryData {
    id: string; // PoolEntry ID (from DB)
    gameTitle: string;
    gameImageUrl: string;
    gameIgdbId: string; // ID from IGDB search (or fallback to DB id)
    gameId?: string; // Internal DB game_id
    userId: string;
    userName: string;
    hltb_time?: number | null;
}

export interface PoolData {
    poolId: string;
    guildId?: string | null;
    questType: "MAIN" | "SIDE";
    status: import("@prisma/client").$Enums.PoolStatus;
    entries: PoolEntryData[];
    winnerId?: string | null;
    winnerTitle?: string | null;
    winnerImageUrl?: string | null;
}

/**
 * Valida se um jogo é elegível para entrar em uma pool da Guilda.
 * Regras:
 * 1. Não pode estar completo (COMPLETED) por nenhum membro ativo da guilda.
 * 2. Não pode estar ativo (ACTIVE) por nenhum membro ativo da guilda.
 * 3. Se possuir progresso, só pode entrar se TODOS os membros ativos que jogaram tiverem status DROPPED.
 */
export async function validateGameEligibilityForPool(
    tx: Prisma.TransactionClient,
    gameId: string,
    guildId?: string
): Promise<{ eligible: boolean; error?: string }> {
    let activeUserIds: string[] = [];

    if (guildId) {
        const activeMembers = await tx.guildMember.findMany({
            where: { guild_id: guildId, is_active: true },
            select: { user_id: true },
        });
        activeUserIds = activeMembers.map((m) => m.user_id);
    }

    // Fallback: se não tiver guildId, busca da guilda padrão ou ignora
    if (activeUserIds.length === 0) {
        const founderGuild = await tx.guild.findFirst({
            where: { slug: { in: ["fundadores", "aposentados"] } },
            include: { members: { where: { is_active: true } } },
        });
        if (founderGuild) {
            activeUserIds = founderGuild.members.map((m) => m.user_id);
        }
    }

    if (activeUserIds.length === 0) {
        return { eligible: true };
    }

    const progresses = await tx.gameProgress.findMany({
        where: {
            game_id: gameId,
            user_id: { in: activeUserIds },
        },
    });

    if (progresses.length === 0) {
        return { eligible: true };
    }

    // Regra 1: Se o jogo for completed por 1 player ativo ele não pode participar de quest novamente
    const hasCompleted = progresses.some((p) => p.status === "COMPLETED" || p.progress_percentage === 100);
    if (hasCompleted) {
        return {
            eligible: false,
            error: "Este jogo já foi completado por pelo menos um dos membros da guilda e não pode participar novamente.",
        };
    }

    // Regra 2: Se estiver ativo para algum jogador
    const hasActive = progresses.some((p) => p.status === "ACTIVE");
    if (hasActive) {
        return {
            eligible: false,
            error: "Este jogo já está ativo em uma quest em andamento para um dos membros da guilda.",
        };
    }

    // Regra 3: Se algum jogador dropou o jogo, só pode entrar se todos que jogaram tiverem status DROPPED
    const hasDropped = progresses.some((p) => p.status === "DROPPED");
    if (hasDropped) {
        const droppedCount = progresses.filter((p) => p.status === "DROPPED").length;
        if (droppedCount < progresses.length) {
            return {
                eligible: false,
                error: "Este jogo possui progresso não abandonado (dropped) por todos os membros que o iniciaram.",
            };
        }
    }

    return { eligible: true };
}

// ---------- Get or Create Open Pool ----------

export async function getOpenPool(
    questType: "MAIN" | "SIDE",
    targetGuildId?: string
): Promise<PoolData | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    let guildId = targetGuildId;
    if (!guildId) {
        const activeGuild = await getActiveGuild();
        guildId = activeGuild?.id;
    }

    if (!guildId) return null;

    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    try {
        const pool = await prisma.pool.findFirst({
            where: {
                guild_id: guildId,
                type: typeEnum,
                status: "OPEN",
            },
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
            guildId: pool.guild_id,
            questType,
            status: pool.status,
            entries: pool.entries.map((e) => ({
                id: e.id,
                gameTitle: e.game.title,
                gameImageUrl: e.game.cover_url || "",
                gameIgdbId: e.game.igdb_id || e.game.id,
                gameId: e.game.id,
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

export async function saveSelections(
    questType: "MAIN" | "SIDE",
    games: GameSelection[],
    targetGuildId?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;

    let guildId = targetGuildId;
    if (!guildId) {
        const activeGuild = await getActiveGuild();
        guildId = activeGuild?.id;
    }

    if (!guildId) {
        return { success: false, error: "Selecione uma guilda para adicionar indicações." };
    }

    // Validar se o usuário é membro ativo da guilda
    const membership = await prisma.guildMember.findUnique({
        where: {
            guild_id_user_id: {
                guild_id: guildId,
                user_id: userId,
            },
        },
    });

    if (!membership) {
        return {
            success: false,
            error: "Você não é membro desta guilda.",
        };
    }

    const isTestUser = session.user.email?.toLowerCase().endsWith("@test.com");
    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";
    const maxPerPerson = isTestUser ? (questType === "MAIN" ? 4 : 6) : (questType === "MAIN" ? 2 : 3);

    if (games.length > maxPerPerson) {
        return {
            success: false,
            error: `Máximo de ${maxPerPerson} jogos por pessoa para ${questType} Quest`,
        };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create the OPEN pool for this quest type in this guild
            let pool = await tx.pool.findFirst({
                where: {
                    guild_id: guildId,
                    type: typeEnum,
                    status: "OPEN",
                },
            });

            if (!pool) {
                pool = await tx.pool.create({
                    data: {
                        guild_id: guildId,
                        type: typeEnum,
                        status: "OPEN",
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                    },
                });
            }

            // 2. LOCK PESSIMISTA
            await tx.$executeRaw`SELECT * FROM pools WHERE id = ${pool.id} FOR UPDATE`;

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

            // 4. Create or find each game and create pool entries
            for (const game of games) {
                let dbGame = await tx.game.findFirst({
                    where: {
                        OR: [
                            { igdb_id: game.igdbId },
                            { id: game.igdbId },
                            { title: game.nome },
                        ],
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
                } else {
                    const eligibility = await validateGameEligibilityForPool(tx, dbGame.id, guildId);
                    if (!eligibility.eligible) {
                        throw new Error(`Jogo "${dbGame.title}" inválido: ${eligibility.error}`);
                    }

                    const hasValidNewIgdbId = game.igdbId && game.igdbId !== dbGame.id;
                    if ((!dbGame.igdb_id && hasValidNewIgdbId) || (!dbGame.cover_url && game.imageUrl)) {
                        dbGame = await tx.game.update({
                            where: { id: dbGame.id },
                            data: {
                                igdb_id: !dbGame.igdb_id && hasValidNewIgdbId ? game.igdbId : undefined,
                                cover_url: !dbGame.cover_url ? game.imageUrl : undefined,
                            },
                        });
                    }
                }

                // Verificar se o jogo já está no pote
                const existingEntry = await tx.poolEntry.findFirst({
                    where: {
                        pool_id: pool.id,
                        game_id: dbGame.id,
                    },
                });

                if (existingEntry) {
                    throw new Error(`O jogo "${dbGame.title}" já foi indicado neste sorteio.`);
                }

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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return {
                success: false,
                error: "Este jogo já foi indicado neste sorteio.",
            };
        }
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

// ---------- Execute Roll (Server-Side) with Emergency Support ----------

export async function executeRoll(
    poolId: string,
    options?: { forceEmergency?: boolean }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;

    try {
        const poolBefore = await prisma.pool.findUnique({
            where: { id: poolId },
            include: { guild: { include: { members: { where: { is_active: true } } } } },
        });

        if (!poolBefore) return { success: false, error: "Pote não encontrado." };

        const guildId = poolBefore.guild_id;
        const activeMembers = poolBefore.guild?.members || [];
        const isLeader = activeMembers.some((m) => m.user_id === userId && m.role === "LEADER");

        // Se for sorteio de emergência (forçar com os presentes), apenas líderes podem acionar
        if (options?.forceEmergency && !isLeader) {
            return {
                success: false,
                error: "Apenas líderes da guilda podem realizar o sorteio de emergência antecipado.",
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. LOCK PESSIMISTA
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
            if (!pool.entries || pool.entries.length === 0) throw new Error("O pote está vazio. É necessário pelo menos 1 indicação.");

            const typeEnum = pool.type;
            const isTestUser = session.user.email?.toLowerCase().endsWith("@test.com");
            const maxPerPerson = typeEnum === "MAIN_QUEST" ? 2 : 3;
            const activeMemberCount = activeMembers.length > 0 ? activeMembers.length : 2;
            const totalRequired = isTestUser
                ? (typeEnum === "MAIN_QUEST" ? 4 : 6)
                : maxPerPerson * activeMemberCount;

            // Se NÃO for sorteio forçado de emergência, exige a cota cheia proporcional
            if (!options?.forceEmergency && pool.entries.length < totalRequired) {
                throw new Error(`Pool incompleta: ${pool.entries.length}/${totalRequired} jogos indicados pelos membros ativos.`);
            }

            // SERVER-SIDE RANDOM - Proporcional e transparente
            const randomIndex = Math.floor(Math.random() * pool.entries.length);
            const winnerEntry = pool.entries[randomIndex];

            // Fechar o pote com o vencedor e atualizar mês/ano do sorteio
            await tx.pool.update({
                where: { id: poolId },
                data: {
                    status: "CLOSED",
                    winner_game_id: winnerEntry.game_id,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                },
            });

            // Determinar os usuários alvo para criação e ativação do progresso
            const targetUserIds =
                activeMembers.length > 0
                    ? activeMembers.map((m) => m.user_id)
                    : Array.from(new Set(pool.entries.map((e) => e.user_id)));

            // Criar GameProgress para todos os membros alvo
            const progressData = [];
            for (const entry of pool.entries) {
                for (const uId of targetUserIds) {
                    progressData.push({
                        user_id: uId,
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

            // Definir o jogo vencedor como ACTIVE para os membros alvo
            await tx.gameProgress.updateMany({
                where: {
                    game_id: winnerEntry.game_id,
                    user_id: { in: targetUserIds },
                    status: { in: ["SUGGESTED", "DROPPED"] },
                },
                data: {
                    status: "ACTIVE",
                    start_date: new Date(),
                    end_date: null,
                    progress_percentage: 0,
                },
            });

            return {
                winnerId: winnerEntry.game_id,
                winnerTitle: winnerEntry.game.title,
                winnerImageUrl: winnerEntry.game.cover_url,
                isEmergency: !!options?.forceEmergency,
            };
        });

        revalidatePath("/randomizer");
        revalidatePath("/");
        revalidatePath("/quests");
        revalidatePath("/dashboard");
        revalidatePath("/board");
        return { success: true, ...result };
    } catch (error: unknown) {
        console.error("Error executing roll:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Erro no sorteio: " + errorMessage };
    }
}

// ---------- Fetch Past Incomplete Games ----------

export async function getPastIncompleteGames() {
    try {
        const games = await prisma.game.findMany({
            where: {
                progress: {
                    some: {
                        status: { in: ["DROPPED", "SUGGESTED"] },
                    },
                    none: {
                        status: "COMPLETED",
                    },
                },
            },
            select: {
                id: true,
                title: true,
                cover_url: true,
                igdb_id: true,
            },
            orderBy: {
                title: "asc",
            },
        });
        return { success: true, games };
    } catch (error) {
        console.error("Error fetching past incomplete games:", error);
        return { success: false, error: "Erro ao buscar jogos incompletos" };
    }
}

// ---------- Insert Special Game Override ----------

export async function insertSpecialGame(
    questType: "MAIN" | "SIDE",
    game: { id?: string; igdbId?: string | null; nome: string; imageUrl?: string | null },
    targetGuildId?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;

    let guildId = targetGuildId;
    if (!guildId) {
        const activeGuild = await getActiveGuild();
        guildId = activeGuild?.id;
    }

    if (!guildId) {
        return { success: false, error: "Selecione uma guilda." };
    }

    // Validar se o usuário é líder da guilda
    const membership = await prisma.guildMember.findUnique({
        where: {
            guild_id_user_id: {
                guild_id: guildId,
                user_id: userId,
            },
        },
    });

    if (!membership || membership.role !== "LEADER") {
        return {
            success: false,
            error: "Apenas líderes da guilda podem inserir um jogo especial diretamente.",
        };
    }

    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    // Validar se já existe um jogo ativo (travado)
    const status = await getRandomizerStatus(typeEnum, guildId);
    if (status.locked) {
        return {
            success: false,
            error: status.message || "Já existe um jogo ativo para esta quest.",
        };
    }

    try {
        const activeMembers = await prisma.guildMember.findMany({
            where: { guild_id: guildId, is_active: true },
        });

        const result = await prisma.$transaction(async (tx) => {
            let dbGame;
            if (game.id) {
                dbGame = await tx.game.findUnique({ where: { id: game.id } });
            } else {
                dbGame = await tx.game.findFirst({
                    where: {
                        OR: [
                            game.igdbId ? { igdb_id: game.igdbId } : undefined,
                            { title: game.nome },
                        ].filter(Boolean) as Prisma.GameWhereInput[],
                    },
                });
            }

            if (!dbGame) {
                dbGame = await tx.game.create({
                    data: {
                        igdb_id: game.igdbId || null,
                        title: game.nome,
                        cover_url: game.imageUrl || null,
                        quest_type: typeEnum,
                        nominated_by_id: userId,
                    },
                });
            } else {
                const eligibility = await validateGameEligibilityForPool(tx, dbGame.id, guildId);
                if (!eligibility.eligible) {
                    throw new Error(`Jogo "${dbGame.title}" inválido: ${eligibility.error}`);
                }

                dbGame = await tx.game.update({
                    where: { id: dbGame.id },
                    data: {
                        igdb_id: dbGame.igdb_id || game.igdbId || null,
                        cover_url: dbGame.cover_url || game.imageUrl || null,
                    },
                });
            }

            let pool = await tx.pool.findFirst({
                where: { guild_id: guildId, type: typeEnum, status: "OPEN" },
            });

            if (pool) {
                pool = await tx.pool.update({
                    where: { id: pool.id },
                    data: {
                        status: "CLOSED",
                        winner_game_id: dbGame.id,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                    },
                });
            } else {
                pool = await tx.pool.create({
                    data: {
                        guild_id: guildId,
                        type: typeEnum,
                        status: "CLOSED",
                        winner_game_id: dbGame.id,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                    },
                });
            }

            const entryExists = await tx.poolEntry.findFirst({
                where: { pool_id: pool.id, game_id: dbGame.id },
            });

            if (!entryExists) {
                await tx.poolEntry.create({
                    data: {
                        pool_id: pool.id,
                        game_id: dbGame.id,
                        user_id: userId,
                    },
                });
            }

            for (const member of activeMembers) {
                await tx.gameProgress.upsert({
                    where: {
                        user_id_game_id: {
                            user_id: member.user_id,
                            game_id: dbGame.id,
                        },
                    },
                    update: {
                        status: "ACTIVE",
                        start_date: new Date(),
                        end_date: null,
                    },
                    create: {
                        user_id: member.user_id,
                        game_id: dbGame.id,
                        status: "ACTIVE",
                        progress_percentage: 0,
                        start_date: new Date(),
                    },
                });
            }

            return {
                poolId: pool.id,
                winnerId: dbGame.id,
                winnerTitle: dbGame.title,
                winnerImageUrl: dbGame.cover_url,
            };
        });

        revalidatePath("/randomizer");
        revalidatePath("/");
        revalidatePath("/dashboard");
        return { success: true, ...result };
    } catch (error: unknown) {
        console.error("Error inserting special game:", error);
        const errorMessage = error instanceof Error ? error.message : "Desconhecido";
        return { success: false, error: "Erro ao inserir jogo especial: " + errorMessage };
    }
}
