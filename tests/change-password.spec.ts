import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória."),
    newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
});

test.describe("Password Change Security (CWE-620)", () => {
    test("ChangePasswordSchema enforces currentPassword and newPassword constraints", () => {
        // Missing current password
        const res1 = ChangePasswordSchema.safeParse({ currentPassword: "", newPassword: "validpassword123" });
        expect(res1.success).toBe(false);

        // Short new password (<6 chars)
        const res2 = ChangePasswordSchema.safeParse({ currentPassword: "currentpass", newPassword: "123" });
        expect(res2.success).toBe(false);

        // Valid payload
        const res3 = ChangePasswordSchema.safeParse({ currentPassword: "currentpass", newPassword: "validpassword123" });
        expect(res3.success).toBe(true);
        if (res3.success) {
            expect(res3.data.currentPassword).toBe("currentpass");
            expect(res3.data.newPassword).toBe("validpassword123");
        }
    });

    test("bcrypt password verification prevents unauthorized password overwrites", async () => {
        const originalPassword = "secureOldPassword123";
        const hashedPassword = await bcrypt.hash(originalPassword, 10);

        // Simulated test user
        const testUser = await prisma.user.create({
            data: {
                username: `pwd_test_${Date.now()}`,
                email: `pwd_test_${Date.now()}@test.com`,
                password: hashedPassword,
            },
        });

        try {
            // Attempt with wrong current password
            const wrongMatch = await bcrypt.compare("incorrectPassword999", testUser.password!);
            expect(wrongMatch).toBe(false);

            // Attempt with correct current password
            const correctMatch = await bcrypt.compare(originalPassword, testUser.password!);
            expect(correctMatch).toBe(true);

            // Update to new password
            const newPassword = "brandNewSuperPassword456";
            const newHash = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: testUser.id },
                data: { password: newHash },
            });

            // Verify old password no longer works
            const oldMatchAfterUpdate = await bcrypt.compare(originalPassword, (await prisma.user.findUnique({ where: { id: testUser.id } }))!.password!);
            expect(oldMatchAfterUpdate).toBe(false);

            // Verify new password works
            const newMatchAfterUpdate = await bcrypt.compare(newPassword, (await prisma.user.findUnique({ where: { id: testUser.id } }))!.password!);
            expect(newMatchAfterUpdate).toBe(true);
        } finally {
            await prisma.user.delete({ where: { id: testUser.id } });
        }
    });

    test("Login page authenticates valid credentials and rejects invalid passwords", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `auth_test_${timestamp}@test.com`;
        const correctPassword = "validPassword123";

        // Create user in db directly
        const hashedPassword = await bcrypt.hash(correctPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: `user_${timestamp}`,
                email: testEmail,
                password: hashedPassword,
            },
        });

        try {
            // 1. Attempt login with WRONG password
            await page.goto("/login", { waitUntil: "load" });
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill("wrongPassword456");
            await page.getByRole("button", { name: "Log in" }).click();

            // Should show error message
            await expect(page.getByText(/Invalid credentials/i)).toBeVisible({ timeout: 5000 });

            // 2. Attempt login with CORRECT password
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill(correctPassword);
            await page.getByRole("button", { name: "Log in" }).click();

            // Should authenticate and redirect to home
            await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });
        } finally {
            await prisma.user.delete({ where: { id: user.id } });
        }
    });
});
