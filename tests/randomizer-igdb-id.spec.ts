import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Randomizer IGDB ID Consistency", () => {
    test.beforeEach(async () => {
        // Clean up test data
        await prisma.gameProgress.deleteMany({
            where: {
                game: {
                    title: { startsWith: "IGDB-Test" },
                },
            },
        });
        await prisma.poolEntry.deleteMany({
            where: {
                game: {
                    title: { startsWith: "IGDB-Test" },
                },
            },
        });
        await prisma.pool.deleteMany({
            where: {
                entries: {
                    some: {
                        game: {
                            title: { startsWith: "IGDB-Test" },
                        },
                    },
                },
            },
        });
        await prisma.game.deleteMany({
            where: {
                title: { startsWith: "IGDB-Test" },
            },
        });
    });

    test("should preserve real IGDB IDs across save, getOpenPool, and re-save cycles", async ({ page }) => {
        test.setTimeout(60000);

        // Mock IGDB API with distinct external IDs
        await page.route("**/api/igdb", async (route) => {
            const json = [
                {
                    id: "99001",
                    nome: "IGDB-Test Game Alpha",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co496b.jpg",
                },
                {
                    id: "99002",
                    nome: "IGDB-Test Game Beta",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8v.jpg",
                },
                {
                    id: "99003",
                    nome: "IGDB-Test Game Gamma",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8f.jpg",
                },
                {
                    id: "99004",
                    nome: "IGDB-Test Game Delta",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8e.jpg",
                },
                {
                    id: "99005",
                    nome: "IGDB-Test Game Epsilon",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8d.jpg",
                },
                {
                    id: "99006",
                    nome: "IGDB-Test Game Zeta",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8c.jpg",
                },
                {
                    id: "99007",
                    nome: "IGDB-Test Game Omega",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8b.jpg",
                },
            ];
            await route.fulfill({ json });
        });

        // Mock the AI HLTB API
        await page.route("**/api/ai/hltb", async (route) => {
            const json = {
                results: [
                    { title: "IGDB-Test Game Alpha", mainStory: 12 },
                    { title: "IGDB-Test Game Beta", mainStory: 14 },
                    { title: "IGDB-Test Game Gamma", mainStory: 16 },
                    { title: "IGDB-Test Game Delta", mainStory: 18 },
                    { title: "IGDB-Test Game Epsilon", mainStory: 20 },
                    { title: "IGDB-Test Game Zeta", mainStory: 22 },
                    { title: "IGDB-Test Game Omega", mainStory: 24 },
                ],
            };
            await route.fulfill({ json });
        });

        // Register and login test user
        const timestamp = Date.now();
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`igdb_user_${timestamp}`);
        await page.getByLabel("Email").fill(`igdb_${timestamp}@test.com`);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(`igdb_${timestamp}@test.com`);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();

        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });
        await page.goto("/randomizer", { waitUntil: "load" });

        // Add 6 games to the pool (test user requires 6 for Side Quest)
        const gameTitles = [
            "IGDB-Test Game Alpha",
            "IGDB-Test Game Beta",
            "IGDB-Test Game Gamma",
            "IGDB-Test Game Delta",
            "IGDB-Test Game Epsilon",
            "IGDB-Test Game Zeta",
        ];

        for (let i = 0; i < 6; i++) {
            const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
            await addBtn.click();
            const input = page.locator('input[placeholder*="IGDB"]');
            await input.fill("IGDB-Test");
            await page.waitForResponse("**/api/igdb");
            const suggestion = page.locator(`button:has-text("${gameTitles[i]}")`).first();
            await suggestion.click();
            await page.waitForTimeout(400);
        }

        // Save initial selections
        const saveBtn = page.getByRole("button", { name: /Salvar Seleções/i });
        await saveBtn.click();
        await page.waitForTimeout(1500);

        // Verify that games in database have correct igdb_id values
        const dbAlpha = await prisma.game.findFirst({
            where: { title: "IGDB-Test Game Alpha" },
        });
        expect(dbAlpha).not.toBeNull();
        expect(dbAlpha?.igdb_id).toBe("99001");
        expect(dbAlpha?.igdb_id).not.toBe(dbAlpha?.id); // Must NOT be UUID

        // Verify pool entries in DB link to the game with real IGDB ID
        const openPool = await prisma.pool.findFirst({
            where: { type: "SIDE_QUEST", status: "OPEN" },
            include: { entries: { include: { game: true } } },
        });
        expect(openPool).not.toBeNull();
        const alphaEntry = openPool?.entries.find((e) => e.game.title === "IGDB-Test Game Alpha");
        expect(alphaEntry).toBeDefined();
        expect(alphaEntry?.game.igdb_id).toBe("99001");
        expect(alphaEntry?.game_id).toBe(dbAlpha?.id);

        // Re-edit selections in UI
        const editBtn = page.getByRole("button", { name: /Editar Seleções/i });
        await editBtn.click();
        await page.waitForTimeout(500);

        // Remove Zeta (last one) and add Omega ("99007")
        const deleteBtn = page.locator("button").filter({ has: page.locator("svg.lucide-x") }).last();
        await deleteBtn.click();
        await page.waitForTimeout(400);

        // Add Omega
        const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
        await addBtn.click();
        const input = page.locator('input[placeholder*="IGDB"]');
        await input.fill("IGDB-Test");
        await page.waitForResponse("**/api/igdb");
        const suggestionOmega = page.locator(`button:has-text("IGDB-Test Game Omega")`).first();
        await suggestionOmega.click();
        await page.waitForTimeout(400);

        // Re-save selections
        const reSaveBtn = page.getByRole("button", { name: /Salvar Seleções/i });
        await reSaveBtn.click();
        await page.waitForTimeout(1500);

        // Verify that existing games still have valid igdb_ids and new game was added
        const dbAlphaAfterReSave = await prisma.game.findFirst({
            where: { title: "IGDB-Test Game Alpha" },
        });
        expect(dbAlphaAfterReSave?.igdb_id).toBe("99001");

        const dbOmega = await prisma.game.findFirst({
            where: { title: "IGDB-Test Game Omega" },
        });
        expect(dbOmega?.igdb_id).toBe("99007");

        // Verify total games created in DB for this test is 7 (no duplicate corrupted records created)
        const totalTestGames = await prisma.game.count({
            where: { title: { startsWith: "IGDB-Test" } },
        });
        expect(totalTestGames).toBe(7);
    });
});
