// src/app/api/deals/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DealsService } from "@/services/deals/dealsService";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";

        if (!query.trim()) {
            return NextResponse.json({ results: [] });
        }

        const results = await DealsService.search(query);
        return NextResponse.json({ results });
    } catch (err) {
        console.error("[API /api/deals/search] Error:", err);
        return NextResponse.json(
            { error: "Failed to search games", details: String(err) },
            { status: 500 },
        );
    }
}
