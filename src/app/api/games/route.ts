import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { auth } from "@/auth";
import { Prisma, $Enums } from "@prisma/client";

const mapInputToDb = (
    input: Partial<Prisma.GameUncheckedCreateInput> & {
        coverUrl?: string;
        hltbTime?: number;
        questType?: $Enums.QuestType;
        nominatedById?: string;
    },
) => {
    const data: Partial<Prisma.GameUncheckedCreateInput> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.platform !== undefined) data.platform = input.platform;
    if (input.coverUrl !== undefined) data.cover_url = input.coverUrl;
    if (input.hltbTime !== undefined) data.hltb_time = Number(input.hltbTime) || null;
    if (input.questType !== undefined) data.quest_type = input.questType;
    if (input.nominatedById !== undefined) data.nominated_by_id = input.nominatedById;
    return data;
};

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (id) {
            const game = await prisma.game.findUnique({ where: { id } });
            if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
            return NextResponse.json(game);
        }

        const games = await prisma.game.findMany({ orderBy: { created_at: "desc" } });
        return NextResponse.json(games);
    } catch (error) {
        console.error("GET /api/games error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, nominatedById } = body;

        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
        if (!nominatedById)
            return NextResponse.json({ error: "nominatedById is required" }, { status: 400 });

        const data = mapInputToDb(body);

        const game = await prisma.game.create({ data: data as Prisma.GameUncheckedCreateInput });

        return NextResponse.json(game, { status: 201 });
    } catch (error) {
        console.error("POST /api/games error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...rest } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const game = await prisma.game.findUnique({ where: { id } });
        if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
        if (game.nominated_by_id !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const data = mapInputToDb(rest);

        const updated = await prisma.game.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/games error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const game = await prisma.game.findUnique({ where: { id } });
        if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
        if (game.nominated_by_id !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Apenas desvincula o indicador para preservar as informações do jogo no banco
        await prisma.game.update({
            where: { id },
            data: { nominated_by_id: null }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/games error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
