// src/app/api/deals/featured/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DealsService } from "@/services/deals/dealsService";
import { DealFilterType } from "@/types/deals";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filterParam = searchParams.get("filter") as DealFilterType | null;
        const validFilters: DealFilterType[] = ["best_savings", "historical_low", "highest_cut"];
        const filter = validFilters.includes(filterParam as DealFilterType)
            ? (filterParam as DealFilterType)
            : "best_savings";

        const data = await DealsService.getFeaturedDeals(filter);
        return NextResponse.json(data);
    } catch (err) {
        console.error("[API /api/deals/featured] Error:", err);
        return NextResponse.json(
            { error: "Failed to fetch featured deals", details: String(err) },
            { status: 500 },
        );
    }
}
