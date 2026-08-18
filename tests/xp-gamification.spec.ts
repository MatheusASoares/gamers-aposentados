import { test, expect } from "@playwright/test";
import { calculateReviewXP, calculateGameXP, calculateLevelFromXP, recalculateUserXPAndLevel } from "../src/app/lib/xp-engine";
import { prisma } from "../src/lib/prisma";

test.describe("XP and Gamification System", () => {
    test("calculateGameXP calculates base and bonus XP for quests", () => {
        expect(calculateGameXP({ hltbHours: 10, questType: "SIDE_QUEST" })).toBe(100);
        expect(calculateGameXP({ hltbHours: 20, questType: "MAIN_QUEST" })).toBe(300);
    });
    test("calculateReviewXP calculates appropriate XP rewards for reviews and screenshots", () => {
        // Quick review (< 50 chars, no screenshot)
        expect(calculateReviewXP({ reviewText: "Bom jogo", screenshots: [] })).toBe(100);
        expect(calculateReviewXP({ reviewText: null, screenshots: [] })).toBe(100);

        // Detailed review (>= 50 chars, no screenshot)
        const longText = "Este jogo é absolutamente incrível e desafiador do início ao fim com ótima trilha sonora!";
        expect(calculateReviewXP({ reviewText: longText, screenshots: [] })).toBe(200);

        // Quick review with screenshot
        expect(calculateReviewXP({ reviewText: "Zerei hoje!", screenshots: ["https://example.com/shot.webp"] })).toBe(150);

        // Detailed review with screenshot
        expect(calculateReviewXP({ reviewText: longText, screenshots: ["https://example.com/shot.webp"] })).toBe(250);
    });

    test("calculateLevelFromXP computes levels correctly based on progression curve", () => {
        expect(calculateLevelFromXP(0).level).toBe(1);
        expect(calculateLevelFromXP(100).level).toBe(2);
        expect(calculateLevelFromXP(300).level).toBe(3);
        expect(calculateLevelFromXP(600).level).toBe(4);
        expect(calculateLevelFromXP(1000).level).toBe(5);
    });

    test("recalculateUserXPAndLevel combines both completed games and all reviews XP", async () => {
        // Create isolated test user
        const testUser = await prisma.user.create({
            data: {
                email: `xp_tester_${Date.now()}@test.com`,
                name: "XP Tester",
            },
        });

        // Create test game
        const testGame = await prisma.game.create({
            data: {
                title: `XP Test Game ${Date.now()}`,
                quest_type: "SIDE_QUEST",
                hltb_time: 10,
            },
        });

        // 1. Mark game completed -> 10 * 10 = 100 XP
        await prisma.gameProgress.create({
            data: {
                user_id: testUser.id,
                game_id: testGame.id,
                status: "COMPLETED",
                progress_percentage: 100,
            },
        });

        // 2. Add review with screenshot -> 100 base + 50 screenshot = 150 XP
        await prisma.review.create({
            data: {
                user_id: testUser.id,
                game_id: testGame.id,
                rating: 10,
                review_text: "Excelente!",
                screenshots: ["https://example.com/proof.webp"],
            },
        });

        // Recalculate
        const { totalXP, level } = await recalculateUserXPAndLevel(testUser.id);

        // Total expected = 100 (game) + 150 (review with screenshot) = 250 XP
        expect(totalXP).toBe(250);
        expect(level).toBe(2);

        const updatedUser = await prisma.user.findUnique({
            where: { id: testUser.id },
            select: { xp_points: true, level: true },
        });

        expect(updatedUser?.xp_points).toBe(250);
        expect(updatedUser?.level).toBe(2);

        // Cleanup
        await prisma.review.deleteMany({ where: { user_id: testUser.id } });
        await prisma.gameProgress.deleteMany({ where: { user_id: testUser.id } });
        await prisma.game.delete({ where: { id: testGame.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
    });

    test("recalculates and removes XP when a completed quest is dropped", async () => {
        // 1. Create isolated test user
        const testUser = await prisma.user.create({
            data: {
                email: `xp_drop_tester_${Date.now()}@test.com`,
                name: "XP Drop Tester",
            },
        });

        // 2. Create test game (Main Quest, 20h = 300 XP)
        const testGame = await prisma.game.create({
            data: {
                title: `Drop Test Game ${Date.now()}`,
                quest_type: "MAIN_QUEST",
                hltb_time: 20,
            },
        });

        // 3. Mark game COMPLETED
        const progress = await prisma.gameProgress.create({
            data: {
                user_id: testUser.id,
                game_id: testGame.id,
                status: "COMPLETED",
                progress_percentage: 100,
            },
        });

        // 4. Initial XP recalculation after completion
        const initial = await recalculateUserXPAndLevel(testUser.id);
        expect(initial.totalXP).toBe(300);
        expect(initial.level).toBe(3);

        const userAfterComplete = await prisma.user.findUnique({
            where: { id: testUser.id },
            select: { xp_points: true, level: true },
        });
        expect(userAfterComplete?.xp_points).toBe(300);
        expect(userAfterComplete?.level).toBe(3);

        // 5. Simulate dropping the quest (change status to DROPPED and trigger recalculate)
        await prisma.gameProgress.update({
            where: { id: progress.id },
            data: {
                status: "DROPPED",
                end_date: new Date(),
            },
        });

        const afterDrop = await recalculateUserXPAndLevel(testUser.id);
        expect(afterDrop.totalXP).toBe(0);
        expect(afterDrop.level).toBe(1);

        const userAfterDrop = await prisma.user.findUnique({
            where: { id: testUser.id },
            select: { xp_points: true, level: true },
        });
        expect(userAfterDrop?.xp_points).toBe(0);
        expect(userAfterDrop?.level).toBe(1);

        // Cleanup
        await prisma.gameProgress.deleteMany({ where: { user_id: testUser.id } });
        await prisma.game.delete({ where: { id: testGame.id } });
        await prisma.user.delete({ where: { id: testUser.id } });
    });
});
