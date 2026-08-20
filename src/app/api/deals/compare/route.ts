// src/app/api/deals/compare/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DealsService } from "@/services/deals/dealsService";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get("title") || "";
        const gameId = searchParams.get("gameId") || undefined;
        const steamAppIdParam = searchParams.get("steamAppId");
        const steamAppId = steamAppIdParam ? parseInt(steamAppIdParam, 10) : undefined;

        if (!title.trim() && !gameId && !steamAppId) {
            return NextResponse.json(
                { error: "Title, gameId, or steamAppId is required" },
                { status: 400 },
            );
        }

        const forceRefresh = searchParams.get("refresh") === "true";

        const comparison = await DealsService.compareGame(
            {
                title,
                gameId,
                steamAppId,
            },
            forceRefresh,
        );

        if (!comparison) {
            return NextResponse.json(
                { error: "Game pricing could not be found for comparison" },
                { status: 404 },
            );
        }

        return NextResponse.json(comparison, {
            headers: forceRefresh
                ? {
                      "Cache-Control": "no-store, no-cache, must-revalidate",
                  }
                : undefined,
        });
    } catch (err) {
        console.error("[API /api/deals/compare] Error:", err);
        return NextResponse.json(
            { error: "Failed to compare game deals", details: String(err) },
            { status: 500 },
        );
    }
}
