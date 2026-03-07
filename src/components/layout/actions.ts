"use server";

import { prisma } from "@/lib/prisma";

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function resolveBreadcrumbLabel(segment: string): Promise<string> {
    if (!UUID_REGEX.test(segment)) {
        return segment;
    }

    try {
        // Find if it's a User
        const user = await prisma.user.findUnique({
            where: { id: segment },
            select: { username: true, name: true },
        });

        if (user) {
            return user.username || user.name || segment;
        }

        // Find if it's a Game
        const game = await prisma.game.findUnique({
            where: { id: segment },
            select: { title: true },
        });

        if (game) {
            return game.title;
        }

        // Fallback
        return segment;
    } catch (error) {
        console.error("Failed to resolve breadcrumb label:", error);
        return segment;
    }
}
