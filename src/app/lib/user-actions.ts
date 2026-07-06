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

async function setFavoriteGamesBase(
    candidates: GameSearchResult[],
    field: "favoriteGames" | "favoriteGamesYear",
    baseErrorMessage: string,
) {
    const session = await auth();

    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!Array.isArray(candidates) || candidates.length > 3) {
        console.error(`[${field}] Invalid candidates array`, candidates);
        return { success: false, error: baseErrorMessage };
    }

    // Deduplicate candidates to avoid duplicates in the same request
    const uniqueCandidates: GameSearchResult[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    for (const candidate of candidates) {
        if (!candidate.id || !candidate.nome) continue;
        if (seenIds.has(candidate.id) || seenNames.has(candidate.nome)) continue;
        seenIds.add(candidate.id);
        seenNames.add(candidate.nome);
        uniqueCandidates.push(candidate);
    }

    try {
        const games = [];
        for (const candidate of uniqueCandidates) {
            let game = await prisma.game.findFirst({
                where: {
                    OR: [{ igdb_id: candidate.id }, { title: candidate.nome }],
                },
            });

            if (!game) {
                try {
                    game = await prisma.game.create({
                        data: {
                            igdb_id: candidate.id,
                            title: candidate.nome,
                            cover_url: candidate.imageUrl,
                            quest_type: "SIDE_QUEST", // Default tier for generic imports
                            nominated_by_id: session.user.id,
                        },
                    });
                } catch (createError: unknown) {
                    // Handle concurrent insert by another request (Unique constraint violation P2002)
                    if (
                        createError &&
                        typeof createError === "object" &&
                        "code" in createError &&
                        createError.code === "P2002"
                    ) {
                        game = await prisma.game.findFirst({
                            where: {
                                OR: [{ igdb_id: candidate.id }, { title: candidate.nome }],
                            },
                        });
                        if (!game) {
                            throw createError; // Re-throw if it still doesn't exist
                        }
                    } else {
                        throw createError;
                    }
                }
            } else if (!game.igdb_id || (!game.cover_url && candidate.imageUrl)) {
                // Update igdb_id and/or cover if missing
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: {
                        igdb_id: game.igdb_id ? undefined : candidate.id,
                        cover_url: !game.cover_url ? candidate.imageUrl : undefined,
                    },
                });
            }

            games.push({ id: game.id });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                [field]: {
                    set: games,
                },
            },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error(`Failed to set ${field}`, error);
        return { success: false, error: `Failed to set ${field}` };
    }
}

export async function setFavoriteGames(candidates: GameSearchResult[]) {
    return setFavoriteGamesBase(
        candidates,
        "favoriteGames",
        "You can select up to 3 favorite games maximum.",
    );
}

export async function setFavoriteGamesOfYear(candidates: GameSearchResult[]) {
    return setFavoriteGamesBase(
        candidates,
        "favoriteGamesYear",
        "You can select up to 3 favorite games maximum for the year.",
    );
}
