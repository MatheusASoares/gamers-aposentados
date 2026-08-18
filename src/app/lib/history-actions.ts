"use server";

import { prisma } from "@/lib/prisma";

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
    candidates: HistoryCandidate[];
    progress: PlayerProgress[];
}

export async function getQuestHistoryByYear(
    year: number,
    questType: "MAIN" | "SIDE"
): Promise<QuestHistoryData[]> {
    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    try {
        const pools = await prisma.pool.findMany({
            where: {
                year: year,
                type: typeEnum,
                status: "CLOSED",
            },
            orderBy: {
                month: "desc", // Latest month first
            },
            include: {
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
            
            // Only tracking progress for Lucas and Matheus (the primary players)
            let playerProgress: PlayerProgress[] = [];
            if (winner) {
                playerProgress = winner.progress
                    .filter(p => {
                        const name = (p.user.name || p.user.username || "").toLowerCase();
                        return name.includes("lucas") || name.includes("matheus");
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
                questType,
                month: pool.month,
                year: pool.year,
                winnerId: winner?.id || null,
                winnerTitle: winner?.title || "Unknown",
                winnerImageUrl: winner?.cover_url || null,
                winnerArtworkUrl: winner?.artwork_url || null,
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

export async function getAvailableYears(): Promise<number[]> {
    try {
        const pools = await prisma.pool.findMany({
            where: { status: "CLOSED" },
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
