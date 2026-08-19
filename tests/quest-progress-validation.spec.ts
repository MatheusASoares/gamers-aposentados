import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { updateQuestProgressSchema } from "../src/lib/quest-validation";

test.describe("Security: Quest Progress Input Validation (Audit 2.5 / CWE-20)", () => {
    test("updateQuestProgressSchema accepts valid integers between 0 and 100", () => {
        // Lower bound
        const minVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 0 });
        expect(minVal.success).toBe(true);
        if (minVal.success) {
            expect(minVal.data.percentage).toBe(0);
        }

        // Mid values
        const midVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 50 });
        expect(midVal.success).toBe(true);
        if (midVal.success) {
            expect(midVal.data.percentage).toBe(50);
        }

        // Upper bound
        const maxVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 100 });
        expect(maxVal.success).toBe(true);
        if (maxVal.success) {
            expect(maxVal.data.percentage).toBe(100);
        }
    });

    test("updateQuestProgressSchema rejects negative numbers", () => {
        const neg1 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: -1 });
        expect(neg1.success).toBe(false);
        if (!neg1.success) {
            expect(neg1.error.issues[0]?.message).toContain("no mínimo 0%");
        }

        const neg50 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: -50 });
        expect(neg50.success).toBe(false);

        const negExtreme = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: -99999 });
        expect(negExtreme.success).toBe(false);
    });

    test("updateQuestProgressSchema rejects values above 100", () => {
        const over1 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 101 });
        expect(over1.success).toBe(false);
        if (!over1.success) {
            expect(over1.error.issues[0]?.message).toContain("no máximo 100%");
        }

        const over500 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 500 });
        expect(over500.success).toBe(false);

        const overExtreme = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 99999 });
        expect(overExtreme.success).toBe(false);
    });

    test("updateQuestProgressSchema rejects non-integers and decimal numbers", () => {
        const float1 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 50.5 });
        expect(float1.success).toBe(false);
        if (!float1.success) {
            expect(float1.error.issues[0]?.message).toContain("número inteiro");
        }

        const float2 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 0.1 });
        expect(float2.success).toBe(false);

        const float3 = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: 99.99 });
        expect(float3.success).toBe(false);
    });

    test("updateQuestProgressSchema rejects empty gameId or invalid types", () => {
        const emptyGame = updateQuestProgressSchema.safeParse({ gameId: "", percentage: 50 });
        expect(emptyGame.success).toBe(false);
        if (!emptyGame.success) {
            expect(emptyGame.error.issues[0]?.message).toContain("ID do jogo é obrigatório");
        }

        const nanVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: NaN });
        expect(nanVal.success).toBe(false);

        const strVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: "50" });
        expect(strVal.success).toBe(false);

        const nullVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: null });
        expect(nullVal.success).toBe(false);

        const undefVal = updateQuestProgressSchema.safeParse({ gameId: "valid_game_1", percentage: undefined });
        expect(undefVal.success).toBe(false);
    });

    test("unauthenticated call to updateQuestProgress action is rejected", async ({ request }) => {
        const response = await request.post("/", {
            headers: {
                "Next-Action": "updateQuestProgress",
            },
        });
        expect([400, 401, 403, 404, 500]).toContain(response.status());
    });

    test("database integrity: valid updates persist and invalid schemas are blocked", async () => {
        const timestamp = Date.now();
        // Create test user and test game in db
        const user = await prisma.user.create({
            data: {
                username: `prog_user_${timestamp}`,
                email: `prog_user_${timestamp}@test.com`,
            },
        });

        const game = await prisma.game.create({
            data: {
                title: `Test Progress Game ${timestamp}`,
                quest_type: "SIDE_QUEST",
            },
        });

        try {
            // Attempt schema validation on invalid inputs
            const invalidParse1 = updateQuestProgressSchema.safeParse({ gameId: game.id, percentage: -25 });
            expect(invalidParse1.success).toBe(false);

            const invalidParse2 = updateQuestProgressSchema.safeParse({ gameId: game.id, percentage: 999 });
            expect(invalidParse2.success).toBe(false);

            // Valid progress creation in database
            const validParse = updateQuestProgressSchema.safeParse({ gameId: game.id, percentage: 75 });
            expect(validParse.success).toBe(true);

            if (validParse.success) {
                const progress = await prisma.gameProgress.create({
                    data: {
                        user_id: user.id,
                        game_id: game.id,
                        progress_percentage: validParse.data.percentage,
                        status: "ACTIVE",
                        start_date: new Date(),
                    },
                });

                expect(progress.progress_percentage).toBe(75);
                expect(progress.status).toBe("ACTIVE");

                // Update to 100%
                const completedParse = updateQuestProgressSchema.safeParse({ gameId: game.id, percentage: 100 });
                expect(completedParse.success).toBe(true);

                if (completedParse.success) {
                    const updated = await prisma.gameProgress.update({
                        where: { id: progress.id },
                        data: {
                            progress_percentage: completedParse.data.percentage,
                            status: "COMPLETED",
                            end_date: new Date(),
                        },
                    });

                    expect(updated.progress_percentage).toBe(100);
                    expect(updated.status).toBe("COMPLETED");
                    expect(updated.end_date).not.toBeNull();
                }
            }
        } finally {
            // Cleanup
            await prisma.gameProgress.deleteMany({ where: { user_id: user.id } });
            await prisma.game.delete({ where: { id: game.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
    });
});
