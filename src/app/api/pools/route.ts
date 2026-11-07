// src/app/api/pools/route.ts

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { getFounderGuildSlugs } from "@/lib/randomizer-players";
import { executeRoll } from "@/app/lib/pool-actions";

const mapPoolInput = (input: Partial<Prisma.PoolUncheckedCreateInput> & { type?: string }) => {
    const data: Partial<Prisma.PoolUncheckedCreateInput> = {};
    if (input.type !== undefined) data.type = input.type as Prisma.PoolCreateInput["type"];
    if (input.month !== undefined) data.month = input.month ?? null;
    if (input.year !== undefined) data.year = input.year ?? null;
    if (input.status !== undefined) data.status = input.status;
    return data;
};

export async function resolveUserActiveGuild(userId: string) {
    try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const activeGuildId = cookieStore.get("active_guild_id")?.value;
        if (activeGuildId) {
            const membership = await prisma.guildMember.findUnique({
                where: { guild_id_user_id: { guild_id: activeGuildId, user_id: userId } },
                include: { guild: true },
            });
            if (membership?.guild && membership.is_active) {
                return membership.guild;
            }
        }
    } catch {
        // Outside Next.js request store (e.g. tests or worker scripts)
    }

    // Fallback: active membership in any guild
    const activeMembership = await prisma.guildMember.findFirst({
        where: { user_id: userId, is_active: true },
        include: { guild: true },
        orderBy: { joined_at: "asc" },
    });
    return activeMembership?.guild || null;
}

export async function getUserPools(userId: string | undefined | null, poolId?: string | null) {
    if (!userId) {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    const activeGuild = await resolveUserActiveGuild(userId);
    if (!activeGuild) {
        return { status: 200, body: poolId ? { error: "Pool not found" } : [] };
    }

    const founderSlugs = getFounderGuildSlugs();
    const isFounder = founderSlugs.includes(activeGuild.slug.toLowerCase());
    const guildFilter = isFounder
        ? { OR: [{ guild_id: activeGuild.id }, { guild_id: null }] }
        : { guild_id: activeGuild.id };

    if (poolId) {
        const pool = await prisma.pool.findFirst({
            where: {
                id: poolId,
                ...guildFilter,
            },
            include: { entries: { include: { game: true, user: true } }, winner_game: true },
        });

        if (!pool) {
            return { status: 404, body: { error: "Pool not found" } };
        }
        return { status: 200, body: pool };
    }

    const pools = await prisma.pool.findMany({
        where: guildFilter,
        orderBy: { created_at: "desc" },
        include: { entries: { include: { game: true, user: true } }, winner_game: true },
    });

    return { status: 200, body: pools };
}

export async function createUserPool(userId: string | undefined | null, body: any) {
    if (!userId) {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    const activeGuild = await resolveUserActiveGuild(userId);
    if (!activeGuild) {
        return { status: 400, body: { error: "No active guild found for user" } };
    }

    // Role check: Only LEADER or ADMIN can create pools
    const membership = await prisma.guildMember.findUnique({
        where: {
            guild_id_user_id: {
                guild_id: activeGuild.id,
                user_id: userId,
            },
        },
    });

    if (!membership || !membership.is_active || !["LEADER", "ADMIN"].includes(membership.role)) {
        return { status: 403, body: { error: "Forbidden" } };
    }

    if (!body?.type) {
        return { status: 400, body: { error: "type is required" } };
    }

    const data = mapPoolInput(body);

    const pool = await prisma.pool.create({
        data: {
            ...(data as Prisma.PoolUncheckedCreateInput),
            guild_id: activeGuild.id,
            entries: body.entries
                ? {
                      create: body.entries.map((e: { gameId: string; userId: string }) => ({
                          game_id: e.gameId,
                          user_id: e.userId,
                      })),
                  }
                : undefined,
        },
        include: { entries: true },
    });

    return { status: 201, body: pool };
}

export async function updateUserPool(userId: string | undefined | null, body: any) {
    if (!userId) {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    const { id, action } = body || {};
    if (!id) {
        return { status: 400, body: { error: "ID is required" } };
    }

    const pool = await prisma.pool.findUnique({
        where: { id },
        select: { id: true, guild_id: true },
    });

    if (!pool) {
        return { status: 404, body: { error: "Pool not found" } };
    }

    let targetGuildId = pool.guild_id;
    if (!targetGuildId) {
        const founderSlugs = getFounderGuildSlugs();
        const founderGuild = await prisma.guild.findFirst({
            where: { slug: { in: founderSlugs } },
            select: { id: true },
        });
        targetGuildId = founderGuild?.id || null;
    }

    if (!targetGuildId) {
        return { status: 403, body: { error: "Forbidden" } };
    }

    // Role check: Only LEADER or ADMIN of target guild can update or draw
    const membership = await prisma.guildMember.findUnique({
        where: {
            guild_id_user_id: {
                guild_id: targetGuildId,
                user_id: userId,
            },
        },
    });

    if (!membership || !membership.is_active || !["LEADER", "ADMIN"].includes(membership.role)) {
        return { status: 403, body: { error: "Forbidden" } };
    }

    if (action === "draw") {
        const result = await executeRoll(id);
        if (!result.success) {
            return { status: 400, body: { error: result.error } };
        }
        return { status: 200, body: result };
    }

    // Generic update
    const data = mapPoolInput(body);
    const updated = await prisma.pool.update({ where: { id }, data });
    return { status: 200, body: updated };
}

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const res = await getUserPools(session.user.id, id);
        return NextResponse.json(res.body, { status: res.status });
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

        const body = await request.json().catch(() => ({}));
        const res = await createUserPool(session.user.id, body);
        return NextResponse.json(res.body, { status: res.status });
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

        const body = await request.json().catch(() => ({}));
        const res = await updateUserPool(session.user.id, body);
        return NextResponse.json(res.body, { status: res.status });
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
