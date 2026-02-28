import { test, expect } from "@playwright/test";

test.describe("Dashboard Flow", () => {
    test("Public Dashboard rendering", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        // Ensure the Quests overview columns show up
        await expect(page.getByText("Side Quest").first()).toBeVisible();

        // The hero block should encourage creating a quest or playing randomly
        await expect(page.getByText("Nenhuma Quest Ativa").first()).toBeVisible();

        // There should be a link "Randomizer" in the main feed or sidebar
        const randomizerLink = page.getByRole("link", { name: /Randomizer/i }).first();
        await randomizerLink.waitFor({ state: "visible", timeout: 5000 });
        await expect(randomizerLink).toBeVisible();
    });
});
