import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Database Schema: Essential Performance Indexes (Audit 5.1)", () => {
    test("Verifies PostgreSQL catalog has the created indexes on games, game_progress, pools, and reviews", async () => {
        // Query pg_indexes to retrieve all indexes in the public schema
        const indexes = await prisma.$queryRaw<
            Array<{ tablename: string; indexname: string; indexdef: string }>
        >`
            SELECT tablename, indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
        `;

        const indexDefs = indexes.map((idx) => idx.indexdef.toLowerCase());

        // 1. Game indexes: title and created_at
        const hasGameTitleIndex = indexDefs.some(
            (def) => def.includes("games") && def.includes("title")
        );
        const hasGameCreatedAtIndex = indexDefs.some(
            (def) => def.includes("games") && def.includes("created_at")
        );
        expect(hasGameTitleIndex).toBe(true);
        expect(hasGameCreatedAtIndex).toBe(true);

        // 2. GameProgress composite indexes: [user_id, status] and [game_id, status]
        const hasProgressUserStatusIndex = indexDefs.some(
            (def) => def.includes("game_progress") && def.includes("user_id") && def.includes("status")
        );
        const hasProgressGameStatusIndex = indexDefs.some(
            (def) => def.includes("game_progress") && def.includes("game_id") && def.includes("status")
        );
        expect(hasProgressUserStatusIndex).toBe(true);
        expect(hasProgressGameStatusIndex).toBe(true);

        // 3. Pool composite index: [type, status, created_at]
        const hasPoolCompositeIndex = indexDefs.some(
            (def) =>
                def.includes("pools") &&
                def.includes("type") &&
                def.includes("status") &&
                def.includes("created_at")
        );
        expect(hasPoolCompositeIndex).toBe(true);

        // 4. Review index: created_at
        const hasReviewCreatedAtIndex = indexDefs.some(
            (def) => def.includes("reviews") && def.includes("created_at")
        );
        expect(hasReviewCreatedAtIndex).toBe(true);
    });

    test("Prisma Client queries execute successfully using the indexed fields", async () => {
        // 1. Query Game with title filter and created_at order
        const games = await prisma.game.findMany({
            where: {
                title: { contains: "Quest" },
            },
            orderBy: {
                created_at: "desc",
            },
            take: 5,
        });
        expect(Array.isArray(games)).toBe(true);

        // 2. Query GameProgress with composite [user_id, status]
        const userProgress = await prisma.gameProgress.findMany({
            where: {
                status: "ACTIVE",
            },
            take: 5,
        });
        expect(Array.isArray(userProgress)).toBe(true);

        // 3. Query Pool with composite [type, status, created_at]
        const activePool = await prisma.pool.findFirst({
            where: {
                type: "MAIN_QUEST",
                status: "OPEN",
            },
            orderBy: {
                created_at: "desc",
            },
        });
        // May be null or object depending on current DB state, but query must succeed
        expect(activePool === null || typeof activePool === "object").toBe(true);

        // 4. Query Review with created_at order
        const reviews = await prisma.review.findMany({
            orderBy: {
                created_at: "desc",
            },
            take: 5,
        });
        expect(Array.isArray(reviews)).toBe(true);
    });
});
