// src/app/api/deals/tracked/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DealsService } from "@/services/deals/dealsService";
import { TrackedDealsBatchRequest } from "@/types/deals";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json().catch(() => ({}))) as TrackedDealsBatchRequest;

        if (!body.items || !Array.isArray(body.items)) {
            return NextResponse.json(
                { items: [], hasAllTimeLow: false, allTimeLowCount: 0 },
                { status: 200 },
            );
        }

        const data = await DealsService.getTrackedDealsStatus(body.items);

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (err) {
        console.error("[API /api/deals/tracked] Error:", err);
        return NextResponse.json(
            { error: "Failed to resolve tracked deals", details: String(err) },
            { status: 500 },
        );
    }
}
