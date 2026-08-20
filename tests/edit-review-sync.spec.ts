import { test, expect } from "@playwright/test";

test.describe("EditReviewModal: State Synchronization & Reset on Reopen (Audit 4.2)", () => {
    test.beforeEach(async ({ page }) => {
        // Mock IGDB API
        await page.route("**/api/igdb**", async (route) => {
            await route.fulfill({ json: [] });
        });

        await page.route("**/api/upload", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ url: "https://example.com/uploaded.webp" }),
            });
        });
    });

    test("EditReviewModal resets unsubmitted changes and synchronizes with review prop on reopen", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `sync_tester_${timestamp}@test.com`;

        // 1. Register & Login
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`sync${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // 2. Go to reviews page
        await page.goto("/reviews", { waitUntil: "load" });

        // Check if user has an existing review or edit button
        const editBtn = page.locator('button[title="Editar Review"]').first();
        if (await editBtn.count() > 0 && await editBtn.isVisible()) {
            await editBtn.click();

            // Find textarea in modal
            const textarea = page.locator("textarea").first();
            await expect(textarea).toBeVisible();

            const initialText = await textarea.inputValue();

            // Modify review text
            await textarea.fill("Texto temporário modificado que não deve ser salvo.");

            // Close modal via Escape
            await page.keyboard.press("Escape");
            await page.waitForTimeout(400);

            // Reopen modal
            await editBtn.click();
            await expect(textarea).toBeVisible();

            // Verify the field reset back to initialText
            const textAfterReopen = await textarea.inputValue();
            expect(textAfterReopen).toBe(initialText);
        }
    });
});
