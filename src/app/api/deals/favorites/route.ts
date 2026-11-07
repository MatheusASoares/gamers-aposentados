// src/app/api/deals/favorites/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DealsService } from "@/services/deals/dealsService";
import { z } from "zod";

export const SyncItemSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    title: z.string().min(1, "Título é obrigatório").max(255),
    slug: z.string().optional().nullable(),
    steamAppId: z.union([z.string(), z.number()]).optional().nullable(),
    coverImage: z.string().optional().nullable(),
});

export const BatchSyncSchema = z.array(SyncItemSchema).max(100, "Limite máximo de 100 itens por lote");

export async function processFavoritesSync(userId: string | undefined | null, syncItems: unknown) {
    if (!userId) {
        return {
            status: 401,
            body: { error: "Você precisa estar autenticado para favoritar", isAuthenticated: false },
        };
    }

    const parseResult = BatchSyncSchema.safeParse(syncItems);
    if (!parseResult.success) {
        return {
            status: 400,
            body: { error: "Payload inválido para syncItems", details: parseResult.error.flatten() },
        };
    }

    const items = parseResult.data;
    if (items.length > 0) {
        const uniqueMap = new Map<string, {
            user_id: string;
            deal_id: string;
            title: string;
            slug: string;
            steam_app_id: number | null;
            cover_image: string | null;
        }>();

        for (const item of items) {
            const cleanDealId = item.id;
            if (!uniqueMap.has(cleanDealId)) {
                uniqueMap.set(cleanDealId, {
                    user_id: userId,
                    deal_id: cleanDealId,
                    title: item.title,
                    slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    steam_app_id: item.steamAppId ? Number(item.steamAppId) : null,
                    cover_image: item.coverImage || null,
                });
            }
        }

        await prisma.userTrackedDeal.createMany({
            data: Array.from(uniqueMap.values()),
            skipDuplicates: true,
        });
    }

    const allUserDeals = await prisma.userTrackedDeal.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });

    return {
        status: 200,
        body: {
            success: true,
            syncedCount: allUserDeals.length,
            items: allUserDeals,
        },
    };
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({
                items: [],
                isAuthenticated: false,
                totalCount: 0,
            });
        }

        const dbTracked = await prisma.userTrackedDeal.findMany({
            where: { user_id: session.user.id },
            orderBy: { created_at: "desc" },
        });

        if (dbTracked.length === 0) {
            return NextResponse.json({
                items: [],
                isAuthenticated: true,
                totalCount: 0,
            });
        }

        const formatted = dbTracked.map((t) => ({
            id: t.deal_id,
            title: t.title,
            slug: t.slug,
            steamAppId: t.steam_app_id,
            coverImage: t.cover_image,
            addedAt: t.created_at.toISOString(),
        }));

        const statusData = await DealsService.getTrackedDealsStatus(formatted);

        return NextResponse.json({
            items: statusData.items,
            hasAllTimeLow: statusData.hasAllTimeLow,
            allTimeLowCount: statusData.allTimeLowCount,
            isAuthenticated: true,
            totalCount: dbTracked.length,
        });
    } catch (err) {
        console.error("[API /api/deals/favorites GET] Error:", err);
        return NextResponse.json(
            { error: "Erro ao buscar favoritos", details: String(err) },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Você precisa estar autenticado para favoritar", isAuthenticated: false },
                { status: 401 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const { dealId, title, steamAppId, slug, coverImage, syncItems } = body;

        // Batch Sync support (e.g. migrating localStorage to DB on first login)
        if ("syncItems" in body) {
            const result = await processFavoritesSync(session.user.id, syncItems);
            return NextResponse.json(result.body, { status: result.status });
        }

        if (!dealId || !title) {
            return NextResponse.json(
                { error: "Parâmetros dealId e title são obrigatórios" },
                { status: 400 },
            );
        }

        const cleanDealId = String(dealId);
        const numSteamAppId = steamAppId ? Number(steamAppId) : /^\d+$/.test(cleanDealId) ? Number(cleanDealId) : null;

        // Check if deal is already tracked
        const existing = await prisma.userTrackedDeal.findFirst({
            where: {
                user_id: session.user.id,
                OR: [
                    { deal_id: cleanDealId },
                    ...(numSteamAppId ? [{ steam_app_id: numSteamAppId }, { deal_id: String(numSteamAppId) }] : []),
                ],
            },
        });

        if (existing) {
            // Delete / Unfavorite
            await prisma.userTrackedDeal.delete({
                where: { id: existing.id },
            });

            const remainingCount = await prisma.userTrackedDeal.count({
                where: { user_id: session.user.id },
            });

            return NextResponse.json({
                isTracked: false,
                dealId: cleanDealId,
                totalCount: remainingCount,
                message: "Jogo removido dos favoritos",
            });
        } else {
            // Create / Favorite
            await prisma.userTrackedDeal.create({
                data: {
                    user_id: session.user.id,
                    deal_id: cleanDealId,
                    title: String(title),
                    slug: slug || String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    steam_app_id: steamAppId ? Number(steamAppId) : null,
                    cover_image: coverImage || null,
                },
            });

            const totalCount = await prisma.userTrackedDeal.count({
                where: { user_id: session.user.id },
            });

            return NextResponse.json({
                isTracked: true,
                dealId: cleanDealId,
                totalCount,
                message: "Jogo adicionado aos favoritos",
            });
        }
    } catch (err) {
        console.error("[API /api/deals/favorites POST] Error:", err);
        return NextResponse.json(
            { error: "Erro ao atualizar favorito", details: String(err) },
            { status: 500 },
        );
    }
}
