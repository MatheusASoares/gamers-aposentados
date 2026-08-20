import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Database Referential Integrity: Cascade Deletion (Audit 5.2)", () => {
    test("Deleting a User cascades and removes related Reviews and PoolEntries without foreign key error", async () => {
        const timestamp = Date.now();

        // 1. Create a test User
        const user = await prisma.user.create({
            data: {
                username: `cascade_usr_${timestamp}`,
                email: `cascade_usr_${timestamp}@test.com`,
            },
        });

        // 2. Create a test Game
        const game = await prisma.game.create({
            data: {
                title: `Cascade Test Game ${timestamp}`,
                quest_type: "MAIN_QUEST",
            },
        });

        // 3. Create a test Pool
        const pool = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "OPEN",
            },
        });

        // 4. Create a Review linked to the User and Game
        const review = await prisma.review.create({
            data: {
                user_id: user.id,
                game_id: game.id,
                rating: 9,
                review_text: "Great game!",
            },
        });

        // 5. Create a PoolEntry linked to the Pool, Game, and User
        const poolEntry = await prisma.poolEntry.create({
            data: {
                pool_id: pool.id,
                game_id: game.id,
                user_id: user.id,
            },
        });

        // 6. Delete the User
        await prisma.user.delete({
            where: { id: user.id },
        });

        // 7. Verify the user is deleted
        const deletedUser = await prisma.user.findUnique({
            where: { id: user.id },
        });
        expect(deletedUser).toBeNull();

        // 8. Verify Review was automatically deleted in cascade
        const remainingReview = await prisma.review.findUnique({
            where: { id: review.id },
        });
        expect(remainingReview).toBeNull();

        // 9. Verify PoolEntry was automatically deleted in cascade
        const remainingPoolEntry = await prisma.poolEntry.findUnique({
            where: { id: poolEntry.id },
        });
        expect(remainingPoolEntry).toBeNull();

        // 10. Verify Game and Pool are still intact
        const remainingGame = await prisma.game.findUnique({
            where: { id: game.id },
        });
        expect(remainingGame).not.toBeNull();

        const remainingPool = await prisma.pool.findUnique({
            where: { id: pool.id },
        });
        expect(remainingPool).not.toBeNull();

        // Cleanup
        await prisma.pool.delete({ where: { id: pool.id } });
        await prisma.game.delete({ where: { id: game.id } });
    });

    test("Deleting a Pool cascades and removes all related PoolEntries without foreign key error", async () => {
        const timestamp = Date.now();

        // 1. Create a test User
        const user = await prisma.user.create({
            data: {
                username: `pool_cascade_usr_${timestamp}`,
                email: `pool_cascade_usr_${timestamp}@test.com`,
            },
        });

        // 2. Create a test Game
        const game = await prisma.game.create({
            data: {
                title: `Pool Cascade Test Game ${timestamp}`,
                quest_type: "SIDE_QUEST",
            },
        });

        // 3. Create a test Pool
        const pool = await prisma.pool.create({
            data: {
                type: "SIDE_QUEST",
                month: 8,
                year: 2026,
                status: "OPEN",
            },
        });

        // 4. Create a PoolEntry linked to the Pool, Game, and User
        const poolEntry = await prisma.poolEntry.create({
            data: {
                pool_id: pool.id,
                game_id: game.id,
                user_id: user.id,
            },
        });

        // 5. Delete the Pool
        await prisma.pool.delete({
            where: { id: pool.id },
        });

        // 6. Verify Pool was deleted
        const deletedPool = await prisma.pool.findUnique({
            where: { id: pool.id },
        });
        expect(deletedPool).toBeNull();

        // 7. Verify PoolEntry was automatically deleted in cascade
        const remainingPoolEntry = await prisma.poolEntry.findUnique({
            where: { id: poolEntry.id },
        });
        expect(remainingPoolEntry).toBeNull();

        // 8. Verify User and Game are still intact
        const remainingUser = await prisma.user.findUnique({
            where: { id: user.id },
        });
        expect(remainingUser).not.toBeNull();

        const remainingGame = await prisma.game.findUnique({
            where: { id: game.id },
        });
        expect(remainingGame).not.toBeNull();

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.game.delete({ where: { id: game.id } });
    });
});
