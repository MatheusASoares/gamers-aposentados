import { test, expect } from "@playwright/test";

test.describe("GameAutocomplete: Error Handling & Type Guard (Audit 4.3)", () => {
    test.beforeEach(async ({ page }) => {
        // Register & Authenticate user
        const timestamp = Date.now();
        const testEmail = `guard_${timestamp}@test.com`;

        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`grd${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });
    });

    test("handles API error object responses gracefully without crashing with TypeError", async ({ page }) => {
        // 1. Mock /api/igdb to return an error object instead of an array
        await page.route("**/api/igdb", async (route) => {
            await route.fulfill({
                status: 401,
                contentType: "application/json",
                body: JSON.stringify({ error: "Unauthorized" }),
            });
        });

        // 2. Navigate to randomizer page
        await page.goto("/randomizer", { waitUntil: "load" });

        // 3. Open autocomplete by clicking "+ ADD GAME"
        const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
        await addBtn.click();

        // 4. Type search query in autocomplete
        const input = page.getByRole("textbox", { name: "Buscar jogo no banco de dados IGDB" });
        await expect(input).toBeVisible();

        let pageErrorOccurred = false;
        page.on("pageerror", (err) => {
            if (err.message.includes("map is not a function") || err.message.includes("TypeError")) {
                pageErrorOccurred = true;
            }
        });

        await input.fill("Zelda");
        await page.waitForTimeout(1000);

        // Verify that no unhandled TypeError occurred
        expect(pageErrorOccurred).toBe(false);
        // Input should still be responsive
        await expect(input).toBeVisible();
    });

    test("renders results properly when API returns a valid array", async ({ page }) => {
        // 1. Mock /api/igdb with a valid array
        await page.route("**/api/igdb", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    {
                        id: "999",
                        nome: "The Legend of Zelda: Tears of the Kingdom",
                        imageUrl: "",
                        tempoMainStory: 50,
                        tempoCompletionist: 120,
                    },
                ]),
            });
        });

        // 2. Navigate to randomizer page
        await page.goto("/randomizer", { waitUntil: "load" });

        // 3. Open autocomplete
        const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
        await addBtn.click();

        const input = page.getByRole("textbox", { name: "Buscar jogo no banco de dados IGDB" });
        await input.fill("Zelda");

        // 4. Verify result appears in dropdown
        await expect(
            page.getByText("The Legend of Zelda: Tears of the Kingdom")
        ).toBeVisible({ timeout: 10000 });
    });
});
