// src/app/api/deals/oracle/dismiss/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DealsOracleService } from "@/services/deals/dealsOracleService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Você precisa estar autenticado para dispensar recomendações", isAuthenticated: false },
                { status: 401 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const { title, steamAppId, reason } = body;

        if (!title || typeof title !== "string") {
            return NextResponse.json(
                { success: false, error: "Título do jogo é obrigatório" },
                { status: 400 },
            );
        }

        const validReason = reason === "not_interested" ? "not_interested" : "already_played";

        await DealsOracleService.dismissGame(
            userId,
            title,
            steamAppId ? Number(steamAppId) : undefined,
            validReason,
        );

        return NextResponse.json({
            success: true,
            dismissed: title,
            reason: validReason,
        });
    } catch (error) {
        console.error("[API /api/deals/oracle/dismiss] POST Error:", error);
        return NextResponse.json(
            { success: false, error: "Falha ao registrar jogo descartado" },
            { status: 500 },
        );
    }
}
