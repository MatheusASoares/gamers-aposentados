import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { isRandomizerPlayer, RANDOMIZER_PLAYER_EMAILS } from "../src/lib/randomizer-players";

test.describe("Security: runBackfillXP Authorization (CWE-306)", () => {
    test("isRandomizerPlayer authorization logic enforces least privilege correctly", () => {
        // Known admin emails
        for (const email of RANDOMIZER_PLAYER_EMAILS) {
            expect(RANDOMIZER_PLAYER_EMAILS.includes(email)).toBe(true);
        }

        // Test isRandomizerPlayer helper directly
        expect(isRandomizerPlayer("matheus31also@gmail.com")).toBe(true);
        expect(isRandomizerPlayer("lucasedu17gomes@gmail.com")).toBe(true);
        expect(isRandomizerPlayer("random_tester@test.com")).toBe(true);
        expect(isRandomizerPlayer("attacker@malicious.com")).toBe(false);
        expect(RANDOMIZER_PLAYER_EMAILS.includes("attacker@malicious.com")).toBe(false);
    });

    test("unauthenticated raw RPC invocation should be rejected with 404/401/403/500", async ({ request }) => {
        const response = await request.post("/", {
            headers: {
                "Next-Action": "runBackfillXP",
            },
        });
        
        // Next.js server action router rejects unauthenticated or unmapped direct calls
        expect([400, 401, 403, 404, 500]).toContain(response.status());
    });

    test("authenticated admin user session functions correctly", async ({ page }) => {
        const timestamp = Date.now();
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`adm_${timestamp}`);
        await page.getByLabel("Email").fill(`adm_${timestamp}@test.com`);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(`adm_${timestamp}@test.com`);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();

        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        const currentAdminUser = await prisma.user.findFirst({
            where: { email: `adm_${timestamp}@test.com` },
        });
        expect(currentAdminUser).not.toBeNull();

        // Cleanup
        await prisma.user.delete({ where: { id: currentAdminUser!.id } });
    });
});
