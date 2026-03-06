"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    username: z.string().min(3, "Username must be at least 3 characters."),
});

export async function updateProfileImage(imageUrl: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (!imageUrl.startsWith("https://")) return { success: false, error: "Invalid image URL" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl },
        });
        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[updateProfileImage] Error:", msg);
        return { success: false, error: `DB error: ${msg}` };
    }
}

export async function updateProfile(data: z.infer<typeof UpdateProfileSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validatedFields = UpdateProfileSchema.safeParse(data);
    if (!validatedFields.success) return { success: false, error: "Invalid fields" };

    const { name, username } = validatedFields.data;

    try {
        // Check if username is taken by a different user
        const existingUser = await prisma.user.findFirst({
            where: {
                username,
                id: { not: session.user.id },
            },
        });

        if (existingUser) return { success: false, error: "Username is already taken" };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { name, username },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile", error);
        return { success: false, error: "Failed to update profile" };
    }
}

const ChangePasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters."),
});

export async function changePassword(data: z.infer<typeof ChangePasswordSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const validatedFields = ChangePasswordSchema.safeParse(data);
    if (!validatedFields.success) return { success: false, error: "Invalid password format" };

    const { newPassword } = validatedFields.data;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to change password", error);
        return { success: false, error: "Failed to change password" };
    }
}

import { GameSearchResult } from "@/components/ui/game-autocomplete";

export async function setFavoriteGames(candidates: GameSearchResult[]) {
    const session = await auth();
    console.log("[setFavoriteGames] Received candidates:", JSON.stringify(candidates, null, 2));

    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!Array.isArray(candidates) || candidates.length > 3) {
        console.error("[setFavoriteGames] Invalid candidates array", candidates);
        return { success: false, error: "You can select up to 3 favorite games maximum." };
    }

    try {
        const gameIds = [];
        for (const candidate of candidates) {
            let game = await prisma.game.findFirst({
                where: { title: candidate.nome },
            });

            if (!game) {
                game = await prisma.game.create({
                    data: {
                        title: candidate.nome,
                        cover_url: candidate.imageUrl,
                        quest_type: "SIDE_QUEST", // Default tier for generic imports
                        nominated_by_id: session.user.id,
                    },
                });
            } else if (!game.cover_url && candidate.imageUrl) {
                // Update cover if it was missing
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: { cover_url: candidate.imageUrl },
                });
            }

            gameIds.push({ id: game.id });
        }

        console.log("Saving favorite games for user:", session.user.id, "Games:", gameIds);

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                favoriteGames: {
                    set: gameIds,
                },
            },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Failed to set favorite games", error);
        return { success: false, error: "Failed to set favorite games" };
    }
}
