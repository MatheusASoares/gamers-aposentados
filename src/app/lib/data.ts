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

export async function getGamesForReview() {
    try {
        // Ideally we only review ACTIVE or COMPLETED games, but let's allow all just in case
        const games = await prisma.game.findMany({
            orderBy: {
                title: 'asc'
            }
        });
        return games;
    } catch (error) {
        console.error("Error fetching games:", error);
        throw new Error("Failed to fetch games.");
    }
}
