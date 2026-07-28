"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

import { calculateLevelFromXP } from "./xp-engine";

const baseReviewSchema = z.object({
    rating: z.number().min(0, "A nota deve ser no mínimo 0").max(10, "A nota deve ser no máximo 10"),
    difficulty: z.number().min(1, "A dificuldade deve ser no mínimo 1").max(5, "A dificuldade deve ser no máximo 5").optional(),
    hoursPlayed: z.number().min(0, "Horas jogadas não podem ser negativas").optional(),
    reviewText: z.string().optional(),
    screenshots: z.array(z.string().url("URL de screenshot inválida")).optional(),
});

const createReviewSchema = baseReviewSchema.extend({
    gameId: z.string().min(1, "O ID do jogo é obrigatório"),
});

type CreateReviewParams = z.infer<typeof createReviewSchema>;

export async function createReview(params: CreateReviewParams) {
    try {
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
        const { gameId, rating, difficulty, hoursPlayed, reviewText, screenshots } = validation.data;

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

        const validScreenshots = screenshots || [];

        const review = await prisma.review.create({
            data: {
                rating,
                difficulty,
                hours_played: hoursPlayed,
                review_text: reviewText,
                screenshots: validScreenshots,
                game_id: gameId,
                user_id: userId,
            },
        });

        // Concede XP por escrever a review:
        // +100 XP rápida, +200 XP se tiver análise detalhada (>= 50 caracteres)
        // +50 XP bônus se incluir ao menos 1 screenshot
        const textXP = reviewText && reviewText.trim().length >= 50 ? 200 : 100;
        const screenshotXP = validScreenshots.length > 0 ? 50 : 0;
        const xpBonus = textXP + screenshotXP;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xp_points: { increment: xpBonus },
            },
            select: { xp_points: true },
        });

        // Recalcula o Nível do usuário
        const { level: newLevel } = calculateLevelFromXP(updatedUser.xp_points);
        await prisma.user.update({
            where: { id: userId },
            data: { level: newLevel },
        });

        revalidatePath("/dashboard/reviews");
        revalidatePath("/reviews");
        revalidatePath("/profile");
        revalidatePath("/");
        
        return { success: true, review, xpEarned: xpBonus };
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return { success: false, error: "Você já avaliou este jogo." };
        }
        console.error("[createReview] Erro catastrófico:", error);
        const errorMessage = error instanceof Error ? error.message : "Servidor indisponível";
        return { 
            success: false, 
            error: "Erro inesperado ao salvar review: " + errorMessage 
        };
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

        const textDeduct = review.review_text && review.review_text.trim().length >= 50 ? 200 : 100;
        const screenshotDeduct = (review.screenshots?.length || 0) > 0 ? 50 : 0;
        const xpDeduct = textDeduct + screenshotDeduct;

        await prisma.review.delete({
            where: { id: reviewId },
        });

        // Deduz o XP e recalcula o Nível do usuário
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                xp_points: { decrement: xpDeduct },
            },
            select: { xp_points: true },
        });

        const { level: newLevel } = calculateLevelFromXP(Math.max(0, updatedUser.xp_points));
        await prisma.user.update({
            where: { id: session.user.id },
            data: { level: newLevel },
        });

        revalidatePath("/dashboard/reviews");
        revalidatePath("/reviews");
        revalidatePath("/profile");
        revalidatePath("/");
        return { success: true };
    } catch (error: unknown) {
        console.error("Erro ao deletar review:", error);
        return { success: false, error: "Erro interno ao deletar a review" };
    }
}

const updateReviewSchema = baseReviewSchema.extend({
    reviewId: z.string().min(1, "O ID da review é obrigatório"),
});

type UpdateReviewParams = z.infer<typeof updateReviewSchema>;


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

    const { reviewId, rating, difficulty, hoursPlayed, reviewText, screenshots } = validation.data;

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

        const validScreenshots = screenshots || [];

        // Calcular ajuste de XP de screenshots se fotos forem adicionadas ou removidas na edição
        const oldScreenshotXP = (review.screenshots?.length || 0) > 0 ? 50 : 0;
        const newScreenshotXP = validScreenshots.length > 0 ? 50 : 0;
        const xpDifference = newScreenshotXP - oldScreenshotXP;

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating,
                difficulty,
                hours_played: hoursPlayed,
                review_text: reviewText,
                screenshots: validScreenshots,
            },
        });

        if (xpDifference !== 0) {
            const updatedUser = await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    xp_points: { increment: xpDifference },
                },
                select: { xp_points: true },
            });
            const { level: newLevel } = calculateLevelFromXP(Math.max(0, updatedUser.xp_points));
            await prisma.user.update({
                where: { id: session.user.id },
                data: { level: newLevel },
            });
        }

        revalidatePath("/dashboard/reviews");
        revalidatePath("/reviews");
        revalidatePath("/profile");
        revalidatePath("/");
        return { success: true, review: updatedReview };
    } catch (error: unknown) {
        console.error("Erro ao atualizar review:", error);
        return { success: false, error: "Erro interno ao atualizar a review" };
    }
}
