import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Randomizer Flow", () => {
    test.beforeEach(async () => {
        // Limpar progressos dos jogos de mock para que sejam 100% elegíveis
        await prisma.gameProgress.deleteMany({
            where: {
                game: {
                    title: { startsWith: "Mock" },
                },
            },
        });
        await prisma.game.deleteMany({
            where: {
                title: { startsWith: "Mock" },
            },
        });

        // Limpar pools e entradas anteriores para isolar o teste
        await prisma.poolEntry.deleteMany({});
        await prisma.pool.deleteMany({});
    });

    test("Adding games and rolling the dice", async ({ page }) => {
        test.setTimeout(60000);

        // Mock the IGDB API
        await page.route("**/api/igdb", async (route) => {
            const json = [
                {
                    id: "g1",
                    nome: "Mock 1",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co496b.jpg",
                },
                {
                    id: "g2",
                    nome: "Mock 2",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8v.jpg",
                },
                {
                    id: "g3",
                    nome: "Mock 3",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8f.jpg",
                },
                {
                    id: "g4",
                    nome: "Mock 4",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8e.jpg",
                },
                {
                    id: "g5",
                    nome: "Mock 5",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8d.jpg",
                },
                {
                    id: "g6",
                    nome: "Mock 6",
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8c.jpg",
                },
            ];
            await route.fulfill({ json });
        });

        const timestamp = Date.now();
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`t${timestamp}`);
        await page.getByLabel("Email").fill(`t${timestamp}@test.com`);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(`t${timestamp}@test.com`);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();

        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });
        await page.goto("/randomizer", { waitUntil: "load" });

        for (let i = 0; i < 6; i++) {
            const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
            await addBtn.click();
            const input = page.locator('input[placeholder*="IGDB"]');
            await input.fill("Mock");
            await page.waitForResponse("**/api/igdb");
            const suggestion = page.locator(`button:has-text("Mock ${i + 1}")`).first();
            await suggestion.click();
            await page.waitForTimeout(500);
        }

        console.log("--- Saving Selections ---");
        const saveBtn = page.getByRole("button", { name: /Salvar Seleções/i });
        await saveBtn.click();
        await page.waitForTimeout(1500); // Wait for action to complete and UI state to update

        console.log("--- Rolling ---");
        const rollBtn = page.getByRole("button", { name: /Roll the Dice/i });
        await expect(rollBtn).toBeEnabled({ timeout: 10000 });
        await rollBtn.click();

        console.log("--- Success Check ---");
        // Check for either the winner name or the reset button
        await expect(page.getByRole("button", { name: /Limpar Quadro/i })).toBeVisible({
            timeout: 20000,
        });

        console.log("--- TEST SUCCESS ---");
    });
});
