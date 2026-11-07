// src/app/api/deals/owned/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OwnedDealItem } from "@/types/deals";
import { z } from "zod";

export const SyncItemSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    title: z.string().min(1, "Título é obrigatório").max(255),
    slug: z.string().optional().nullable(),
    steamAppId: z.union([z.string(), z.number()]).optional().nullable(),
    coverImage: z.string().optional().nullable(),
});

export const BatchSyncSchema = z.array(SyncItemSchema).max(100, "Limite máximo de 100 itens por lote");

export async function processOwnedSync(userId: string | undefined | null, syncItems: unknown) {
    if (!userId) {
        return {
            status: 401,
            body: { error: "Você precisa estar autenticado para marcar como possuído", isAuthenticated: false },
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

        await prisma.userOwnedDeal.createMany({
            data: Array.from(uniqueMap.values()),
            skipDuplicates: true,
        });
    }

    const allUserOwned = await prisma.userOwnedDeal.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
    });

    return {
        status: 200,
        body: {
            success: true,
            syncedCount: allUserOwned.length,
            items: allUserOwned.map((t) => ({
                id: t.deal_id,
                title: t.title,
                slug: t.slug,
                steamAppId: t.steam_app_id,
                coverImage: t.cover_image,
                addedAt: t.created_at.toISOString(),
            })),
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

        const dbOwned = await prisma.userOwnedDeal.findMany({
            where: { user_id: session.user.id },
            orderBy: { created_at: "desc" },
        });

        const items: OwnedDealItem[] = dbOwned.map((t) => ({
            id: t.deal_id,
            title: t.title,
            slug: t.slug,
            steamAppId: t.steam_app_id,
            coverImage: t.cover_image,
            addedAt: t.created_at.toISOString(),
        }));

        return NextResponse.json({
            items,
            isAuthenticated: true,
            totalCount: items.length,
        });
    } catch (err) {
        console.error("[API /api/deals/owned GET] Error:", err);
        return NextResponse.json(
            { error: "Erro ao buscar jogos possuídos", details: String(err) },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Você precisa estar autenticado para marcar como possuído", isAuthenticated: false },
                { status: 401 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const { dealId, title, steamAppId, slug, coverImage, syncItems } = body;

        // Batch Sync support (e.g. syncing localStorage items on first login)
        if ("syncItems" in body) {
            const result = await processOwnedSync(session.user.id, syncItems);
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

        // Check if deal is already marked as owned
        const existing = await prisma.userOwnedDeal.findFirst({
            where: {
                user_id: session.user.id,
                OR: [
                    { deal_id: cleanDealId },
                    ...(numSteamAppId ? [{ steam_app_id: numSteamAppId }, { deal_id: String(numSteamAppId) }] : []),
                ],
            },
        });

        if (existing) {
            // Delete / Unmark as owned
            await prisma.userOwnedDeal.delete({
                where: { id: existing.id },
            });

            const remainingCount = await prisma.userOwnedDeal.count({
                where: { user_id: session.user.id },
            });

            return NextResponse.json({
                isOwned: false,
                dealId: cleanDealId,
                totalCount: remainingCount,
                message: "Jogo desmarcado da sua biblioteca",
            });
        } else {
            // Create / Mark as owned
            await prisma.userOwnedDeal.create({
                data: {
                    user_id: session.user.id,
                    deal_id: cleanDealId,
                    title: String(title),
                    slug: slug || String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    steam_app_id: steamAppId ? Number(steamAppId) : null,
                    cover_image: coverImage || null,
                },
            });

            const totalCount = await prisma.userOwnedDeal.count({
                where: { user_id: session.user.id },
            });

            return NextResponse.json({
                isOwned: true,
                dealId: cleanDealId,
                totalCount,
                message: "Jogo marcado como possuído na sua biblioteca",
            });
        }
    } catch (err) {
        console.error("[API /api/deals/owned POST] Error:", err);
        return NextResponse.json(
            { error: "Erro ao atualizar status de jogo possuído", details: String(err) },
            { status: 500 },
        );
    }
}
