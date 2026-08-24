// src/app/api/deals/featured/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DealsService } from "@/services/deals/dealsService";
import { DealFilterType } from "@/types/deals";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filterParam = searchParams.get("filter") as DealFilterType | null;
        const storeParam = (searchParams.get("store") || "all") as "all" | "steam" | "nuuvem";
        const validFilters: DealFilterType[] = [
            "best_savings",
            "historical_low",
            "curated_specials",
            "steam_only",
            "highest_cut",
        ];
        const filter = validFilters.includes(filterParam as DealFilterType)
            ? (filterParam as DealFilterType)
            : "best_savings";
        const forceRefresh = searchParams.get("refresh") === "true";

        const data = await DealsService.getFeaturedDeals(filter, forceRefresh, storeParam);
        return NextResponse.json(data, {
            headers: forceRefresh
                ? {
                      "Cache-Control": "no-store, no-cache, must-revalidate",
                  }
                : undefined,
        });
    } catch (err) {
        console.error("[API /api/deals/featured] Error:", err);
        return NextResponse.json(
            { error: "Failed to fetch featured deals", details: String(err) },
            { status: 500 },
        );
    }
}
