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
    isSpecial?: boolean;
    isSpecialRelease?: boolean;
    candidates: HistoryCandidate[];
    progress: PlayerProgress[];
}

export async function getQuestHistoryByYear(
    year: number | "ALL",
    questType: "ALL" | "MAIN" | "SIDE" = "ALL"
): Promise<QuestHistoryData[]> {
    const typeEnum = questType === "ALL" ? undefined : questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    try {
        const whereClause: {
            status: "CLOSED";
            year?: number;
            type?: "MAIN_QUEST" | "SIDE_QUEST";
            winner_game_id: { not: null };
        } = {
            status: "CLOSED",
            winner_game_id: { not: null },
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
