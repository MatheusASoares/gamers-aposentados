"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface HistoryCandidate {
    id: string;
    gameTitle: string;
    gameImageUrl: string | null;
    gameIgdbId: string;
    gameId?: string;
    nominatorId: string;
    nominatorName: string;
}

export interface PlayerProgress {
    userId: string;
    userName: string;
    status: string; // "COMPLETED", "DROPPED", "SUGGESTED", "ACTIVE"
    progress_percentage: number;
}

export interface QuestHistoryData {
    poolId: string;
    questType: "MAIN" | "SIDE";
    month: number | null;
    year: number | null;
    winnerId: string | null;
    winnerTitle: string | null;
    winnerImageUrl: string | null;
    winnerArtworkUrl: string | null;
    isSpecial?: boolean;
    isSpecialRelease?: boolean;
    candidates: HistoryCandidate[];
    progress: PlayerProgress[];
}

export async function getQuestHistoryByYear(
    year: number | "ALL",
    questType: "ALL" | "MAIN" | "SIDE" = "ALL",
    targetGuildId?: string
): Promise<QuestHistoryData[]> {
    const typeEnum = questType === "ALL" ? undefined : questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    try {
        let guildId = targetGuildId;
        if (!guildId) {
            try {
                const { getActiveGuild } = await import("@/app/lib/guild-actions");
                const activeGuild = await getActiveGuild();
                guildId = activeGuild?.id;
            } catch {
                // Fallback when executed outside Next.js request lifecycle
            }
        }

        let isFounderGuild = false;
        if (guildId) {
            const guildObj = await prisma.guild.findUnique({
                where: { id: guildId },
                select: { slug: true },
            });
            if (guildObj?.slug && ["fundadores", "aposentados"].includes(guildObj.slug)) {
                isFounderGuild = true;
            }
        }

        const whereClause: Prisma.PoolWhereInput = {
            status: "CLOSED",
            winner_game_id: { not: null },
            ...(guildId
                ? isFounderGuild
                    ? { OR: [{ guild_id: guildId }, { guild_id: null }] }
                    : { guild_id: guildId }
                : {}),
        };

        if (year !== "ALL") {
            whereClause.year = year;
        }
        if (typeEnum) {
            whereClause.type = typeEnum;
        }

        const pools = await prisma.pool.findMany({
            where: whereClause,
            orderBy: [
                { year: "desc" },
                { month: "desc" },
            ],
            include: {
                guild: {
                    include: {
                        members: {
                            select: { user_id: true },
                        },
                    },
                },
                winner_game: {
                    include: {
                        progress: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                entries: {
                    include: {
                        game: true,
                        user: true,
                    },
                },
            },
        });

        return pools.map((pool) => {
            const winner = pool.winner_game;
            
            let playerProgress: PlayerProgress[] = [];
            if (winner) {
                const guildMemberUserIds = new Set(pool.guild?.members.map((m) => m.user_id) || []);

                playerProgress = winner.progress
                    .filter((p) => {
                        // Se a pool possui guilda vinculada, filtra pelos membros daquela guilda
                        if (guildMemberUserIds.size > 0) {
                            return guildMemberUserIds.has(p.user_id);
                        }
                        // Quests legadas antigas sem guilda pertencem aos Fundadores (Aposentados)
                        return true;
                    })
                    .map((p) => ({
                        userId: p.user.id,
                        userName: p.user.name || p.user.username || "Unknown",
                        status: p.status,
                        progress_percentage: p.progress_percentage,
                    }));
            }

            return {
                poolId: pool.id,
                questType: pool.type === "MAIN_QUEST" ? "MAIN" : "SIDE",
                month: pool.month,
                year: pool.year,
                winnerId: winner?.id || null,
                winnerTitle: winner?.title || "Unknown",
                winnerImageUrl: winner?.cover_url || null,
                winnerArtworkUrl: winner?.artwork_url || null,
                isSpecial: pool.is_special,
                isSpecialRelease: winner?.is_special_release,
                candidates: pool.entries.map((e) => ({
                    id: e.id,
                    gameTitle: e.game.title,
                    gameImageUrl: e.game.cover_url,
                    gameIgdbId: e.game.igdb_id || e.game.id,
                    gameId: e.game.id,
                    nominatorId: e.user_id,
                    nominatorName: e.user.name || e.user.username || "Unknown",
                })),
                progress: playerProgress,
            };
        });
    } catch (error) {
        console.error("Error fetching quest history:", error);
        return [];
    }
}

export async function getAvailableYears(targetGuildId?: string): Promise<number[]> {
    try {
        let guildId = targetGuildId;
        if (!guildId) {
            try {
                const { getActiveGuild } = await import("@/app/lib/guild-actions");
                const activeGuild = await getActiveGuild();
                guildId = activeGuild?.id;
            } catch {
                // Fallback when executed outside Next.js request lifecycle
            }
        }

        let isFounderGuild = false;
        if (guildId) {
            const guildObj = await prisma.guild.findUnique({
                where: { id: guildId },
                select: { slug: true },
            });
            if (guildObj?.slug && ["fundadores", "aposentados"].includes(guildObj.slug)) {
                isFounderGuild = true;
            }
        }

        const pools = await prisma.pool.findMany({
            where: {
                status: "CLOSED",
                ...(guildId
                    ? isFounderGuild
                        ? { OR: [{ guild_id: guildId }, { guild_id: null }] }
                        : { guild_id: guildId }
                    : {}),
            },
            select: { year: true },
            distinct: ["year"],
            orderBy: { year: "desc" },
        });
        
        return pools.map(p => p.year).filter((y): y is number => y !== null);
    } catch (error) {
        console.error("Error fetching available years:", error);
        return [new Date().getFullYear()]; // Fallback
    }
}

export interface PersonalQuestHistoryItem {
    id: string;
    gameId: string;
    title: string;
    coverUrl: string | null;
    artworkUrl: string | null;
    questType: "MAIN_QUEST" | "SIDE_QUEST";
    status: string; // COMPLETED, DROPPED, ACTIVE
    progress_percentage: number;
    hltbTime: number | null;
    isPlatinum: boolean;
    startDate: Date | null;
    endDate: Date | null;
    reviewRating?: number | null;
}

export async function getUserPersonalQuestHistory(userId: string): Promise<PersonalQuestHistoryItem[]> {
    if (!userId) return [];
    try {
        const progresses = await prisma.gameProgress.findMany({
            where: {
                user_id: userId,
                status: { in: ["COMPLETED", "DROPPED", "ACTIVE"] },
            },
            include: {
                game: {
                    include: {
                        reviews: {
                            where: { user_id: userId },
                        },
                    },
                },
            },
            orderBy: { updated_at: "desc" },
        });

        return progresses.map((p) => ({
            id: p.id,
            gameId: p.game_id,
            title: p.game.title,
            coverUrl: p.game.cover_url,
            artworkUrl: p.game.artwork_url,
            questType: p.game.quest_type,
            status: p.status,
            progress_percentage: p.progress_percentage,
            hltbTime: p.game.hltb_time,
            isPlatinum: p.is_platinum,
            startDate: p.start_date,
            endDate: p.end_date,
            reviewRating: p.game.reviews[0]?.rating || null,
        }));
    } catch (error) {
        console.error("Error fetching personal quest history:", error);
        return [];
    }
}
