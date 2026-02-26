import { prisma } from "@/lib/prisma";

export async function getReviews() {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        username: true,
                        image: true,
                    }
                },
                game: {
                    select: {
                        title: true,
                        cover_url: true,
                        platform: true,
                        quest_type: true,
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        return reviews;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw new Error("Failed to fetch reviews.");
    }
}

import { auth } from "@/auth";

export async function getGamesForReview() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Buscamos apenas jogos que o usuário tem um GameProgress como COMPLETED
        const progressRecords = await prisma.gameProgress.findMany({
            where: {
                user_id: session.user.id,
                status: 'COMPLETED'
            },
            include: {
                game: true
            }
        });

        // Extrai apenas os jogos do progresso
        const games = progressRecords.map(record => record.game).sort((a, b) => a.title.localeCompare(b.title));
        
        return games;
    } catch (error) {
        console.error("Error fetching games:", error);
        throw new Error("Failed to fetch games.");
    }
}
