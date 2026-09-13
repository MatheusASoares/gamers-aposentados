// src/app/api/deals/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { SteamStoreClient } from "@/services/deals/steamStoreClient";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const appIdParam = searchParams.get("appId");
        const appId = appIdParam ? Number(appIdParam) : null;

        if (!appId || isNaN(appId) || appId <= 0) {
            return NextResponse.json(
                { error: "Parâmetro appId válido é obrigatório." },
                { status: 400 },
            );
        }

        const [reviews, isFamilySharing] = await Promise.all([
            SteamStoreClient.getAppReviewsSummary(appId),
            SteamStoreClient.isFamilySharingSupported(appId),
        ]);

        return NextResponse.json({
            steamAppId: appId,
            reviews,
            isFamilySharing,
        });
    } catch (err) {
        console.error("[API /api/deals/reviews] Error:", err);
        return NextResponse.json(
            { error: "Falha ao buscar avaliações da Steam", details: String(err) },
            { status: 500 },
        );
    }
}
