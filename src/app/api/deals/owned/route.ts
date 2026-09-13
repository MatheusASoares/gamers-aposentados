// src/app/api/deals/owned/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OwnedDealItem } from "@/types/deals";

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
        if (Array.isArray(syncItems) && syncItems.length > 0) {
            for (const item of syncItems) {
                if (!item.id || !item.title) continue;
                await prisma.userOwnedDeal.upsert({
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

            const allUserOwned = await prisma.userOwnedDeal.findMany({
                where: { user_id: session.user.id },
                orderBy: { created_at: "desc" },
            });

            return NextResponse.json({
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
            });
        }

        if (!dealId || !title) {
            return NextResponse.json(
                { error: "Parâmetros dealId e title são obrigatórios" },
                { status: 400 },
            );
        }

        const cleanDealId = String(dealId);

        // Check if deal is already marked as owned
        const existing = await prisma.userOwnedDeal.findUnique({
            where: {
                user_id_deal_id: {
                    user_id: session.user.id,
                    deal_id: cleanDealId,
                },
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
