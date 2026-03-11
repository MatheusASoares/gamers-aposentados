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
                game_id: gameId,
            },
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
            },
        });

        revalidatePath("/dashboard/reviews");
        revalidatePath("/reviews");
        revalidatePath("/");
        return { success: true, review };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao salvar review:", error);
        return { success: false, error: "Erro interno: " + (error?.message || "Desconhecido") };
    }
}

export async function deleteReview(reviewId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    try {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            return { success: false, error: "Review não encontrada." };
        }

        if (review.user_id !== session.user.id) {
            return { success: false, error: "Você não tem permissão para deletar esta review." };
        }

        await prisma.review.delete({
            where: { id: reviewId },
        });

        revalidatePath("/dashboard/reviews");
        revalidatePath("/reviews");
        return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao deletar review:", error);
        return { success: false, error: "Erro interno ao deletar a review" };
    }
}

export interface UpdateReviewParams {
    reviewId: string;
    rating: number;
    difficulty?: number;
    hoursPlayed?: number;
    reviewText?: string;
}

export async function updateReview(params: UpdateReviewParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const { reviewId, rating, difficulty, hoursPlayed, reviewText } = params;

    try {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            return { success: false, error: "Review não encontrada." };
        }

        if (review.user_id !== session.user.id) {
            return { success: false, error: "Você não tem permissão para editar esta review." };
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating,
                difficulty,
                hours_played: hoursPlayed,
                review_text: reviewText,
            },
        });

        revalidatePath("/dashboard/reviews");
        revalidatePath("/reviews");
        revalidatePath("/");
        return { success: true, review: updatedReview };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Erro ao atualizar review:", error);
        return { success: false, error: "Erro interno ao atualizar a review" };
    }
}
