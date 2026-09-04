// src/app/api/deals/favorites/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DealsService } from "@/services/deals/dealsService";

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
        if (Array.isArray(syncItems) && syncItems.length > 0) {
            for (const item of syncItems) {
                if (!item.id || !item.title) continue;
                await prisma.userTrackedDeal.upsert({
                    where: {
                        user_id_deal_id: {
                            user_id: session.user.id,
                            deal_id: String(item.id),
                        },
                    },
                    update: {},
                    create: {
                        user_id: session.user.id,
                        deal_id: String(item.id),
                        title: item.title,
                        slug: item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        steam_app_id: item.steamAppId ? Number(item.steamAppId) : null,
                        cover_image: item.coverImage || null,
                    },
                });
            }

            const allUserDeals = await prisma.userTrackedDeal.findMany({
                where: { user_id: session.user.id },
                orderBy: { created_at: "desc" },
            });

            return NextResponse.json({
                success: true,
                syncedCount: allUserDeals.length,
                items: allUserDeals,
            });
        }

        if (!dealId || !title) {
            return NextResponse.json(
                { error: "Parâmetros dealId e title são obrigatórios" },
                { status: 400 },
            );
        }

        const cleanDealId = String(dealId);

        // Check if deal is already tracked
        const existing = await prisma.userTrackedDeal.findUnique({
            where: {
                user_id_deal_id: {
                    user_id: session.user.id,
                    deal_id: cleanDealId,
                },
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
