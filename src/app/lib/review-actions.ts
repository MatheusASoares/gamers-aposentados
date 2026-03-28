"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const baseReviewSchema = z.object({
    rating: z.number().min(0, "A nota deve ser no mínimo 0").max(10, "A nota deve ser no máximo 10"),
    difficulty: z.number().min(1, "A dificuldade deve ser no mínimo 1").max(5, "A dificuldade deve ser no máximo 5").optional(),
    hoursPlayed: z.number().min(0, "Horas jogadas não podem ser negativas").optional(),
    reviewText: z.string().optional(),
});

export const createReviewSchema = baseReviewSchema.extend({
    gameId: z.string().min(1, "O ID do jogo é obrigatório"),
});

export type CreateReviewParams = z.infer<typeof createReviewSchema>;

export async function createReview(params: CreateReviewParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const validation = createReviewSchema.safeParse(params);
    if (!validation.success) {
        return {
            success: false,
            error: validation.error.issues[0]?.message || "Dados inválidos."
        };
    }

    const userId = session.user.id;
    const { gameId, rating, difficulty, hoursPlayed, reviewText } = validation.data;

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

export const updateReviewSchema = baseReviewSchema.extend({
    reviewId: z.string().min(1, "O ID da review é obrigatório"),
});

export type UpdateReviewParams = z.infer<typeof updateReviewSchema>;


export async function updateReview(params: UpdateReviewParams) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado" };
    }

    const validation = updateReviewSchema.safeParse(params);
    if (!validation.success) {
        return {
            success: false,
            error: validation.error.issues[0]?.message || "Dados inválidos."
        };
    }

    const { reviewId, rating, difficulty, hoursPlayed, reviewText } = validation.data;

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
