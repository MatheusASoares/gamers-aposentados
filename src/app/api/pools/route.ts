import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapPoolInput = (input: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
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
        const body = await request.json();
        const { entries } = body; // optional

        if (!body.type) return NextResponse.json({ error: "type is required" }, { status: 400 });

        const data = mapPoolInput(body);

        const pool = await prisma.pool.create({
            data: {
                ...data,
                entries: entries
                    ? {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          create: entries.map((e: any) => ({
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
        const body = await request.json();
        const { id, action } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        if (action === "draw") {
            // Run randomizer and close pool in a transaction
            const poolWithEntries = await prisma.pool.findUnique({
                where: { id },
                include: { entries: true },
            });
            if (!poolWithEntries)
                return NextResponse.json({ error: "Pool not found" }, { status: 404 });
            if (!poolWithEntries.entries || poolWithEntries.entries.length === 0)
                return NextResponse.json({ error: "No entries in pool" }, { status: 400 });

            const randomIndex = Math.floor(Math.random() * poolWithEntries.entries.length);
            const winnerEntry = poolWithEntries.entries[randomIndex];

            const now = new Date();

            const [updatedPool, updatedGame] = await prisma.$transaction([
                prisma.pool.update({
                    where: { id },
                    data: { winner_game_id: winnerEntry.game_id, status: "CLOSED" },
                }),
                prisma.gameProgress.updateMany({
                    where: { game_id: winnerEntry.game_id },
                    data: { status: "ACTIVE", start_date: now },
                }),
            ]);

            return NextResponse.json({ pool: updatedPool, winner: updatedGame });
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

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.poolEntry.deleteMany({ where: { pool_id: id } });
        await prisma.pool.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/pools error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
