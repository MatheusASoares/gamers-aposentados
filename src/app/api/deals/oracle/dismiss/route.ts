// src/app/api/deals/oracle/dismiss/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DealsOracleService } from "@/services/deals/dealsOracleService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const body = await request.json().catch(() => ({}));
        const { title, steamAppId } = body;

        if (!title || typeof title !== "string") {
            return NextResponse.json(
                { success: false, error: "Título do jogo é obrigatório" },
                { status: 400 },
            );
        }

        await DealsOracleService.dismissGame(
            userId,
            title,
            steamAppId ? Number(steamAppId) : undefined,
        );

        return NextResponse.json({
            success: true,
            dismissed: title,
        });
    } catch (error) {
        console.error("[API /api/deals/oracle/dismiss] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "Falha ao registrar jogo descartado" },
            { status: 500 },
        );
    }
}
