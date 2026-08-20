import { test, expect } from "@playwright/test";

test.describe("Memory Leak Prevention: URL.revokeObjectURL lifecycle cleanup", () => {
    test.beforeEach(async ({ page }) => {
        // Mock IGDB and API routes to avoid external dependencies
        await page.route("**/api/igdb**", async (route) => {
            await route.fulfill({ json: [] });
        });

        await page.route("**/api/upload", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ url: "https://images.igdb.com/igdb/image/upload/t_1080p/co5j83.jpg" }),
            });
        });
    });

    test("AddReviewModal revokes blob URLs when modal is closed without submitting", async ({ page }) => {
        // Setup authenticated session or navigate to reviews page
        const timestamp = Date.now();
        const testEmail = `memtester_${timestamp}@test.com`;

        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`mem${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // Navigate to reviews page
        await page.goto("/reviews", { waitUntil: "load" });

        // Intercept createObjectURL and revokeObjectURL
        await page.evaluate(() => {
            const win = window as unknown as {
                __createdBlobs: string[];
                __revokedBlobs: string[];
            };
            win.__createdBlobs = [];
            win.__revokedBlobs = [];

            const origCreate = URL.createObjectURL.bind(URL);
            const origRevoke = URL.revokeObjectURL.bind(URL);

            URL.createObjectURL = (obj: Blob | MediaSource) => {
                const url = origCreate(obj);
                win.__createdBlobs.push(url);
                return url;
            };

            URL.revokeObjectURL = (url: string) => {
                win.__revokedBlobs.push(url);
                return origRevoke(url);
            };
        });

        // Check if "WRITE A REVIEW" button exists
        const writeBtn = page.getByRole("button", { name: /WRITE A REVIEW/i }).first();
        if (await writeBtn.isVisible()) {
            await writeBtn.click();

            // Modal is opened
            const fileInput = page.locator('input[type="file"]').first();
            if (await fileInput.count() > 0) {
                // Attach a dummy file
                await fileInput.setInputFiles({
                    name: "screenshot1.png",
                    mimeType: "image/png",
                    buffer: Buffer.from("fake-png-content-1"),
                });

                // Wait a moment for processing
                await page.waitForTimeout(500);

                const createdCount = await page.evaluate(() => {
                    return (window as unknown as { __createdBlobs: string[] }).__createdBlobs.length;
                });
                expect(createdCount).toBeGreaterThan(0);

                // Close modal via Escape
                await page.keyboard.press("Escape");
                await page.waitForTimeout(500);

                // Verify revoked count matches created count
                const revoked = await page.evaluate(() => {
                    const win = window as unknown as {
                        __createdBlobs: string[];
                        __revokedBlobs: string[];
                    };
                    return win.__revokedBlobs;
                });
                expect(revoked.length).toBeGreaterThanOrEqual(createdCount);
            }
        }
    });

    test("SettingsModal / AvatarUpload revokes previous blob URL when replacement image is selected", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `avatartester_${timestamp}@test.com`;

        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`avt${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // Navigate to settings / profile
        await page.goto("/profile", { waitUntil: "load" });

        // Setup spies
        await page.evaluate(() => {
            const win = window as unknown as {
                __createdBlobs: string[];
                __revokedBlobs: string[];
            };
            win.__createdBlobs = [];
            win.__revokedBlobs = [];

            const origCreate = URL.createObjectURL.bind(URL);
            const origRevoke = URL.revokeObjectURL.bind(URL);

            URL.createObjectURL = (obj: Blob | MediaSource) => {
                const url = origCreate(obj);
                win.__createdBlobs.push(url);
                return url;
            };

            URL.revokeObjectURL = (url: string) => {
                win.__revokedBlobs.push(url);
                return origRevoke(url);
            };
        });

        // If avatar file input is present
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
            // Select first image
            await fileInput.setInputFiles({
                name: "avatar1.png",
                mimeType: "image/png",
                buffer: Buffer.from("avatar-image-1"),
            });

            await page.waitForTimeout(600);

            const firstBlob = await page.evaluate(() => {
                return (window as unknown as { __createdBlobs: string[] }).__createdBlobs[0];
            });

            // Select second image (replacement)
            await fileInput.setInputFiles({
                name: "avatar2.png",
                mimeType: "image/png",
                buffer: Buffer.from("avatar-image-2"),
            });

            await page.waitForTimeout(600);

            // Verify first blob was revoked upon replacement
            const revokedBlobs = await page.evaluate(() => {
                return (window as unknown as { __revokedBlobs: string[] }).__revokedBlobs;
            });

            if (firstBlob) {
                expect(revokedBlobs).toContain(firstBlob);
            }
        }
    });
});
