// src/app/api/deals/oracle/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DealsOracleService } from "@/services/deals/dealsOracleService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get("forceRefresh") === "true";

        const oracleData = await DealsOracleService.getOracleRecommendations(userId, forceRefresh);

        return NextResponse.json({
            success: true,
            ...oracleData,
        });
    } catch (error) {
        console.error("[API /api/deals/oracle] GET Error:", error);
        return NextResponse.json(
            { success: false, error: "Falha ao obter recomendações do Oráculo" },
            { status: 500 },
        );
    }
}

export async function POST() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const oracleData = await DealsOracleService.getOracleRecommendations(userId, true);

        return NextResponse.json({
            success: true,
            ...oracleData,
        });
    } catch (error) {
        console.error("[API /api/deals/oracle] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "Falha ao atualizar o Oráculo" },
            { status: 500 },
        );
    }
}
