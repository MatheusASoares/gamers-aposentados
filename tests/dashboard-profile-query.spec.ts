import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

test.describe("Dashboard: Single-Query User Profile & Gamification Consolidation (Audit 3.4)", () => {
    test("prisma.user.findUnique consolidates equipped_frame and equipped_banner in a single round-trip", async () => {
        const timestamp = Date.now();
        const testEmail = `dash_profile_${timestamp}@test.com`;

        const user = await prisma.user.create({
            data: {
                username: `dash_user_${timestamp}`,
                name: "Cyber Knight",
                email: testEmail,
                level: 25,
                xp_points: 4850,
                equipped_title: "Lord of Cyberpunk",
                equipped_frame: "frame-neon-purple",
                equipped_banner: "banner-retro-wave",
            },
        });

        try {
            // Test the single consolidated query exactly as written in page.tsx
            const profile = await prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    level: true,
                    xp_points: true,
                    equipped_title: true,
                    equipped_frame: true,
                    equipped_banner: true,
                    gameProgress: {
                        where: { status: "COMPLETED" },
                        orderBy: { updated_at: "desc" },
                        include: { game: true },
                    },
                },
            });

            expect(profile).not.toBeNull();
            expect(profile?.name).toBe("Cyber Knight");
            expect(profile?.level).toBe(25);
            expect(profile?.xp_points).toBe(4850);
            expect(profile?.equipped_title).toBe("Lord of Cyberpunk");
            expect(profile?.equipped_frame).toBe("frame-neon-purple");
            expect(profile?.equipped_banner).toBe("banner-retro-wave");
            expect(Array.isArray(profile?.gameProgress)).toBe(true);
        } finally {
            await prisma.user.delete({ where: { id: user.id } });
        }
    });

    test("authenticated dashboard loads seamlessly and renders consolidated gamification widget", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `dash_e2e_${timestamp}@test.com`;
        const testPassword = "testPassword123";

        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: `dash_e2e_${timestamp}`,
                name: `Master Player ${timestamp}`,
                email: testEmail,
                password: hashedPassword,
                level: 30,
                xp_points: 7200,
                equipped_title: "Lenda dos Cartuchos",
            },
        });

        try {
            // Log in
            await page.goto("/login", { waitUntil: "load" });
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill(testPassword);
            await page.getByRole("button", { name: "Log in" }).click();

            // Should navigate to dashboard
            await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });
            await expect(page.locator("body")).toContainText(`Master Player ${timestamp}`, { timeout: 10000 });
            await expect(page.locator("body")).toContainText("Lenda dos Cartuchos", { timeout: 10000 });
        } finally {
            await prisma.user.delete({ where: { id: user.id } });
        }
    });
});
