import { test, expect } from "@playwright/test";

test.describe("Reviews Flow", () => {
    test("Unauthenticated users are redirected to login", async ({ page }) => {
        // Navigate to the global reviews page
        await page.goto("/reviews", { waitUntil: "networkidle" });

        // Because this page is fully protected at the Next.js page level, it won't render
        // the community wall for guests. It will redirect to the SignIn page natively.
        await expect(page).toHaveURL(/.*\/login/);

        const logInPrompt = page.getByRole("button", { name: "Log in", exact: true }).first();
        await expect(logInPrompt).toBeVisible();
    });
});
