import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

test.describe("AI HLTB: Batch Updates & Intelligent Case-Insensitive Cache (Audit 3.2)", () => {
    test("unauthenticated request to /api/ai/hltb returns 401 Unauthorized", async ({ request }) => {
        const res = await request.post("/api/ai/hltb", {
            data: { titles: ["Zelda"] },
        });
        expect(res.status()).toBe(401);
        const data = await res.json();
        expect(data.error).toBe("Unauthorized");
    });

    test("invalid request body validation (empty, missing or > 6 titles) returns 400 Bad Request", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `hltb_val_${timestamp}@test.com`;
        const testPassword = "testPassword123";

        // Create test user
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: `hltb_val_${timestamp}`,
                email: testEmail,
                password: hashedPassword,
            },
        });

        try {
            // Log in
            await page.goto("/login", { waitUntil: "load" });
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill(testPassword);
            await page.getByRole("button", { name: "Log in" }).click();
            await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

            // 1. Missing titles array
            const resNoTitles = await page.evaluate(async () => {
                const res = await fetch("/api/ai/hltb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                return { status: res.status, body: await res.json() };
            });
            expect(resNoTitles.status).toBe(400);

            // 2. Empty titles array
            const resEmptyTitles = await page.evaluate(async () => {
                const res = await fetch("/api/ai/hltb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ titles: [] }),
                });
                return { status: res.status, body: await res.json() };
            });
            expect(resEmptyTitles.status).toBe(400);

            // 3. More than 6 titles
            const resTooMany = await page.evaluate(async () => {
                const res = await fetch("/api/ai/hltb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        titles: ["G1", "G2", "G3", "G4", "G5", "G6", "G7"],
                    }),
                });
                return { status: res.status, body: await res.json() };
            });
            expect(resTooMany.status).toBe(400);
            expect(resTooMany.body.error).toContain("Maximum of 6 titles");
        } finally {
            await prisma.user.delete({ where: { id: user.id } });
        }
    });

    test("case-insensitive cache and deduplication returns instant results without calling AI (token savings)", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `hltb_cache_${timestamp}@test.com`;
        const testPassword = "testPassword123";

        // Create test user and cached games in DB
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: `hltb_cache_${timestamp}`,
                email: testEmail,
                password: hashedPassword,
            },
        });

        const game1 = await prisma.game.create({
            data: {
                title: `Chrono Trigger Special ${timestamp}`,
                quest_type: "MAIN_QUEST",
                hltb_time: 23,
            },
        });

        const game2 = await prisma.game.create({
            data: {
                title: `Final Fantasy VI Special ${timestamp}`,
                quest_type: "MAIN_QUEST",
                hltb_time: 35,
            },
        });

        try {
            // Log in
            await page.goto("/login", { waitUntil: "load" });
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill(testPassword);
            await page.getByRole("button", { name: "Log in" }).click();
            await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

            // Request with lowercase, uppercase and trailing spaces + duplicates
            const cacheResult = await page.evaluate(async (params) => {
                const res = await fetch("/api/ai/hltb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        titles: [
                            params.title1.toLowerCase(),
                            `  ${params.title1}  `,
                            params.title2.toUpperCase(),
                        ],
                    }),
                });
                return { status: res.status, body: await res.json() };
            }, {
                title1: `Chrono Trigger Special ${timestamp}`,
                title2: `Final Fantasy VI Special ${timestamp}`,
            });

            expect(cacheResult.status).toBe(200);
            expect(cacheResult.body.results).toBeDefined();
            expect(Array.isArray(cacheResult.body.results)).toBe(true);

            // Deduplication should result in exactly 2 distinct titles
            expect(cacheResult.body.results.length).toBe(2);

            const r1 = cacheResult.body.results.find((r: { title: string }) =>
                r.title.toLowerCase().includes("chrono trigger special")
            );
            expect(r1).toBeDefined();
            expect(r1.mainStory).toBe(23);

            const r2 = cacheResult.body.results.find((r: { title: string }) =>
                r.title.toLowerCase().includes("final fantasy vi special")
            );
            expect(r2).toBeDefined();
            expect(r2.mainStory).toBe(35);
        } finally {
            await prisma.game.deleteMany({
                where: { id: { in: [game1.id, game2.id] } },
            });
            await prisma.user.delete({ where: { id: user.id } });
        }
    });

    test("batch update transaction applies atomic updates to multiple games in DB", async () => {
        const timestamp = Date.now();
        // Create 3 games without HLTB time
        const g1 = await prisma.game.create({
            data: { title: `Batch Game One ${timestamp}`, quest_type: "SIDE_QUEST" },
        });
        const g2 = await prisma.game.create({
            data: { title: `Batch Game Two ${timestamp}`, quest_type: "SIDE_QUEST" },
        });
        const g3 = await prisma.game.create({
            data: { title: `Batch Game Three ${timestamp}`, quest_type: "SIDE_QUEST" },
        });

        try {
            // Simulate the batch transaction logic from route.ts
            const simulatedAiResults = [
                { title: `batch game one ${timestamp}`, mainStory: 8 },
                { title: `Batch Game Two ${timestamp}`, mainStory: 14 },
                { title: `BATCH GAME THREE ${timestamp}`, mainStory: 3 },
            ];

            const updateOperations = simulatedAiResults.map((r) =>
                prisma.game.updateMany({
                    where: {
                        title: {
                            equals: r.title.trim(),
                            mode: "insensitive",
                        },
                    },
                    data: { hltb_time: r.mainStory },
                })
            );

            const txResults = await prisma.$transaction(updateOperations);
            expect(txResults.length).toBe(3);

            // Verify in DB that all were updated
            const updated1 = await prisma.game.findUnique({ where: { id: g1.id } });
            const updated2 = await prisma.game.findUnique({ where: { id: g2.id } });
            const updated3 = await prisma.game.findUnique({ where: { id: g3.id } });

            expect(updated1?.hltb_time).toBe(8);
            expect(updated2?.hltb_time).toBe(14);
            expect(updated3?.hltb_time).toBe(3);
        } finally {
            await prisma.game.deleteMany({
                where: { id: { in: [g1.id, g2.id, g3.id] } },
            });
        }
    });
});
