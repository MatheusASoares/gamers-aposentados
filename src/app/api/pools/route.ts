import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { isRandomizerPlayer } from "@/lib/randomizer-players";
import { executeRoll } from "@/app/lib/pool-actions";

const mapPoolInput = (input: Partial<Prisma.PoolUncheckedCreateInput> & { type?: string }) => {
    const data: Partial<Prisma.PoolUncheckedCreateInput> = {};
    if (input.type !== undefined) data.type = input.type;
    if (input.month !== undefined) data.month = input.month ?? null;
    if (input.year !== undefined) data.year = input.year ?? null;
    if (input.status !== undefined) data.status = input.status;
    return data;
};

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (id) {
            const pool = await prisma.pool.findUnique({
                where: { id },
                include: { entries: { include: { game: true, user: true } }, winner_game: true },
            });
            if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });
            return NextResponse.json(pool);
        }

        const pools = await prisma.pool.findMany({
            orderBy: { created_at: "desc" },
            include: { entries: { include: { game: true, user: true } }, winner_game: true },
        });
        return NextResponse.json(pools);
    } catch (error) {
        console.error("GET /api/pools error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!isRandomizerPlayer(session.user.email)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { entries } = body; // optional

        if (!body.type) return NextResponse.json({ error: "type is required" }, { status: 400 });

        const data = mapPoolInput(body);

        const pool = await prisma.pool.create({
            data: {
                ...(data as Prisma.PoolUncheckedCreateInput),
                entries: entries
                    ? {
                          create: entries.map((e: { gameId: string; userId: string }) => ({
                              game_id: e.gameId,
                              user_id: e.userId,
                          })),
                      }
                    : undefined,
            },
            include: { entries: true },
        });

        return NextResponse.json(pool, { status: 201 });
    } catch (error) {
        console.error("POST /api/pools error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!isRandomizerPlayer(session.user.email)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { id, action } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        if (action === "draw") {
            const result = await executeRoll(id);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 400 });
            }
            return NextResponse.json(result);
        }

        // Generic update
        const data = mapPoolInput(body);
        const updated = await prisma.pool.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/pools error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Deletions via API are completely forbidden according to business rules
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch (error) {
        console.error("DELETE /api/pools error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
