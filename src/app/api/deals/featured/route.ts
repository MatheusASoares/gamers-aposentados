// src/app/api/deals/featured/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DealsService } from "@/services/deals/dealsService";
import { DealFilterType, PriceCapFilterType } from "@/types/deals";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filterParam = searchParams.get("filter") as DealFilterType | null;
        const storeParam = (searchParams.get("store") || "all") as "all" | "steam" | "nuuvem";
        const regionParam = (searchParams.get("region") || "all") as "all" | "br" | "us";
        const priceCapParam = (searchParams.get("priceCap") || "all") as PriceCapFilterType;
        const validFilters: DealFilterType[] = [
            "historical_low",
            "highest_cut",
            "best_savings",
            "curated_specials",
            "steam_only",
        ];
        const filter = validFilters.includes(filterParam as DealFilterType)
            ? (filterParam as DealFilterType)
            : "historical_low";
        const validPriceCaps: PriceCapFilterType[] = ["all", "under_30", "under_60", "under_100"];
        const priceCap = validPriceCaps.includes(priceCapParam) ? priceCapParam : "all";
        const forceRefresh = searchParams.get("refresh") === "true";

        const data = await DealsService.getFeaturedDeals(
            filter,
            forceRefresh,
            storeParam,
            regionParam,
            priceCap,
        );
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
