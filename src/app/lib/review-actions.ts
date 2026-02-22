"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface CreateReviewParams {
    gameId: string;
    rating: number; // 0-10
    difficulty?: number; // 1-5
    hoursPlayed?: number;
    reviewText?: string;
}

export async function createReview(params: CreateReviewParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const userId = session.user.id;
    const { gameId, rating, difficulty, hoursPlayed, reviewText } = params;

    try {
        // Verifica se o usuário já fez review deste jogo (regra de negócio opcional, mas boa)
        const existingReview = await prisma.review.findFirst({
            where: {
                user_id: userId,
                game_id: gameId
            }
        });

        if (existingReview) {
            return { success: false, error: "Você já avaliou este jogo." };
        }

        const review = await prisma.review.create({
            data: {
                rating,
                difficulty,
                hours_played: hoursPlayed,
                review_text: reviewText,
                game_id: gameId,
                user_id: userId,
            }
        });

        revalidatePath("/dashboard/reviews");
        return { success: true, review };
    } catch (error: any) {
        console.error("Erro ao salvar review:", error);
        return { success: false, error: "Erro interno: " + (error?.message || "Desconhecido") };
    }
}
