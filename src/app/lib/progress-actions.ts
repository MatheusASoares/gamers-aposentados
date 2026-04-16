"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateProgressPercentage(progressId: string, percentage: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Usuário não autenticado." };
        }

        // Validate percentage
        if (percentage < 0 || percentage > 100) {
            return { success: false, error: "Porcentagem inválida." };
        }

        // Ensure user owns this progress record
        const existingProgress = await prisma.gameProgress.findUnique({
            where: { id: progressId },
        });

        if (!existingProgress || existingProgress.user_id !== session.user.id) {
            return { success: false, error: "Acesso negado ou progresso não encontrado." };
        }

        // Auto-complete if 100%, or revert to ACTIVE if less than 100%
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dataToUpdate: any = { progress_percentage: percentage };
        if (percentage === 100) {
            dataToUpdate.status = "COMPLETED";
            dataToUpdate.end_date = new Date();
        } else if (
            existingProgress.status === "COMPLETED" ||
            existingProgress.status === "DROPPED"
        ) {
            dataToUpdate.status = "ACTIVE";
            dataToUpdate.end_date = null;
        }

        await prisma.gameProgress.update({
            where: { id: progressId },
            data: dataToUpdate,
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/reviews");
        return { success: true };
    } catch (error) {
        console.error("Failed to update progress percentage:", error);
        return { success: false, error: "Erro interno ao atualizar progresso." };
    }
}

export async function completeQuest(progressId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Usuário não autenticado." };
        }

        // Ensure user owns this progress record
        const existingProgress = await prisma.gameProgress.findUnique({
            where: { id: progressId },
        });

        if (!existingProgress || existingProgress.user_id !== session.user.id) {
            return { success: false, error: "Acesso negado." };
        }

        await prisma.gameProgress.update({
            where: { id: progressId },
            data: {
                status: "COMPLETED",
                progress_percentage: 100,
                end_date: new Date(),
            },
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/reviews");
        return { success: true };
    } catch (error) {
        console.error("Failed to complete quest:", error);
        return { success: false, error: "Erro interno ao completar a quest." };
    }
}

export async function dropQuest(progressId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Usuário não autenticado." };
        }

        // Ensure user owns this progress record
        const existingProgress = await prisma.gameProgress.findUnique({
            where: { id: progressId },
        });

        if (!existingProgress || existingProgress.user_id !== session.user.id) {
            return { success: false, error: "Acesso negado." };
        }

        await prisma.gameProgress.update({
            where: { id: progressId },
            data: {
                status: "DROPPED",
                end_date: new Date(),
            },
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        revalidatePath("/reviews");
        return { success: true };
    } catch (error) {
        console.error("Failed to drop quest:", error);
        return { success: false, error: "Erro interno ao dropar a quest." };
    }
}
