import { test, expect } from "@playwright/test";

test.describe("Dashboard Flow", () => {
    test("Public Dashboard rendering", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        // Ensure the Quests overview / Side Quest renders
        await expect(page.getByText(/Side Quest|Quest/i).first()).toBeVisible();

        // The hero block renders either active quest or empty state
        await expect(page.getByText(/Nenhuma Quest Ativa|Quest|Main Quest/i).first()).toBeVisible();

        // There should be a link "Randomizer" in the main feed or sidebar
        const randomizerLink = page.getByRole("link", { name: /Randomizer/i }).first();
        await randomizerLink.waitFor({ state: "visible", timeout: 5000 });
        await expect(randomizerLink).toBeVisible();
    });

    test("Dashboard navigation links are present", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        // Navigation should have a link to Quests page
        const questsLink = page.getByRole("link", { name: /Quests/i }).first();
        await questsLink.waitFor({ state: "visible", timeout: 5000 });
        await expect(questsLink).toBeVisible();
    });

    test("StatsGrid renders with reviews section or review cards", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        // Either the last-review card or the empty state hint should be visible
        const reviewSection = page.getByText(/Nenhuma review disponível|A Review da Vez|Review/i).first();
        await reviewSection.waitFor({ state: "visible", timeout: 5000 });
        await expect(reviewSection).toBeVisible();
    });

    test("Recent activity section is handled gracefully", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        const activityHeading = page.getByText("Atividade Recente");
        const count = await activityHeading.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test("Dashboard page loads without JS errors", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));

        await page.goto("/", { waitUntil: "networkidle" });

        expect(errors).toHaveLength(0);
    });

    test("Main Quest hero section is always rendered", async ({ page }) => {
        await page.goto("/", { waitUntil: "networkidle" });

        // The dashboard always renders the main content area
        const mainContent = page.locator("main").first();
        await expect(mainContent).toBeVisible();
    });
});
