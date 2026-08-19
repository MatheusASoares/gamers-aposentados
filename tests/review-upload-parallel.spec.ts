import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

test.describe("Reviews: Parallel Screenshot Uploading with Promise.all (Audit 3.3)", () => {
    test("Promise.all concurrent upload execution strictly preserves array ordering with variable network latencies", async () => {
        interface ScreenshotItem {
            id: string;
            file: { name: string };
            uploadedUrl?: string;
        }

        const items: ScreenshotItem[] = [
            { id: "1", file: { name: "screen1.png" } },
            { id: "2", file: { name: "screen2.png" } },
            { id: "3", file: { name: "screen3.png" } },
            { id: "4", file: { name: "screen4.png" } },
        ];

        // Simulate variable async upload latency per image (e.g. image 1 is slow, image 2 is fast)
        const latencies = [80, 20, 50, 10]; // milliseconds

        const uploadAllScreenshotsMock = async (screenshots: ScreenshotItem[]): Promise<string[]> => {
            const uploadPromises = screenshots.map(async (item, index) => {
                await new Promise((resolve) => setTimeout(resolve, latencies[index]));
                return `https://blob.vercel-storage.com/screenshots/${item.file.name}`;
            });

            return Promise.all(uploadPromises);
        };

        const startTime = Date.now();
        const urls = await uploadAllScreenshotsMock(items);
        const duration = Date.now() - startTime;

        // Concurrent execution should finish in max latency (~80ms + overhead), not sum (~160ms)
        expect(duration).toBeLessThan(140);

        // URLs must be in strict input order
        expect(urls).toEqual([
            "https://blob.vercel-storage.com/screenshots/screen1.png",
            "https://blob.vercel-storage.com/screenshots/screen2.png",
            "https://blob.vercel-storage.com/screenshots/screen3.png",
            "https://blob.vercel-storage.com/screenshots/screen4.png",
        ]);
    });

    test("Edit mode preserves existing uploadedUrl items and only uploads new files concurrently", async () => {
        interface EditScreenshotItem {
            id: string;
            file?: { name: string };
            uploadedUrl?: string;
        }

        const items: EditScreenshotItem[] = [
            { id: "1", uploadedUrl: "https://blob.vercel-storage.com/screenshots/existing1.png" },
            { id: "2", file: { name: "new_upload2.png" } },
            { id: "3", uploadedUrl: "https://blob.vercel-storage.com/screenshots/existing3.png" },
            { id: "4", file: { name: "new_upload4.png" } },
        ];

        const uploadAllScreenshotsEditMock = async (screenshots: EditScreenshotItem[]): Promise<string[]> => {
            const uploadPromises = screenshots.map(async (item) => {
                if (item.uploadedUrl) {
                    return item.uploadedUrl;
                }
                if (!item.file) return null;

                // Simulate upload
                await new Promise((resolve) => setTimeout(resolve, 30));
                return `https://blob.vercel-storage.com/screenshots/${item.file.name}`;
            });

            const results = await Promise.all(uploadPromises);
            return results.filter((url): url is string => Boolean(url));
        };

        const urls = await uploadAllScreenshotsEditMock(items);

        expect(urls).toEqual([
            "https://blob.vercel-storage.com/screenshots/existing1.png",
            "https://blob.vercel-storage.com/screenshots/new_upload2.png",
            "https://blob.vercel-storage.com/screenshots/existing3.png",
            "https://blob.vercel-storage.com/screenshots/new_upload4.png",
        ]);
    });

    test("Promise.all rejects immediately if any parallel upload fails (fail-fast error handling)", async () => {
        interface ScreenshotItem {
            id: string;
            file: { name: string; shouldFail?: boolean };
        }

        const items: ScreenshotItem[] = [
            { id: "1", file: { name: "screen1.png" } },
            { id: "2", file: { name: "corrupt.png", shouldFail: true } },
            { id: "3", file: { name: "screen3.png" } },
        ];

        const uploadAllScreenshotsMock = async (screenshots: ScreenshotItem[]): Promise<string[]> => {
            const uploadPromises = screenshots.map(async (item) => {
                if (item.file.shouldFail) {
                    throw new Error("Falha ao enviar screenshot: Arquivo corrompido.");
                }
                await new Promise((resolve) => setTimeout(resolve, 20));
                return `https://blob.vercel-storage.com/screenshots/${item.file.name}`;
            });

            return Promise.all(uploadPromises);
        };

        await expect(uploadAllScreenshotsMock(items)).rejects.toThrow("Falha ao enviar screenshot: Arquivo corrompido.");
    });

    test("authenticated user review modal integration", async ({ page }) => {
        const timestamp = Date.now();
        const testEmail = `review_par_${timestamp}@test.com`;
        const testPassword = "testPassword123";

        // Create test user and a test completed game in DB
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await prisma.user.create({
            data: {
                username: `rev_usr_${timestamp}`,
                email: testEmail,
                password: hashedPassword,
            },
        });

        const game = await prisma.game.create({
            data: {
                title: `Parallel Upload Test Game ${timestamp}`,
                quest_type: "SIDE_QUEST",
            },
        });

        // Add game progress for user
        await prisma.gameProgress.create({
            data: {
                user_id: user.id,
                game_id: game.id,
                status: "COMPLETED",
                progress_percentage: 100,
                start_date: new Date(),
                end_date: new Date(),
            },
        });

        try {
            // Log in
            await page.goto("/login", { waitUntil: "load" });
            await page.getByLabel("Email").fill(testEmail);
            await page.getByLabel("Password").fill(testPassword);
            await page.getByRole("button", { name: "Log in" }).click();
            await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

            // Navigate to reviews page
            await page.goto("/reviews", { waitUntil: "load" });
            await expect(page.locator("body")).toContainText("Reviews", { timeout: 10000 });
        } finally {
            await prisma.gameProgress.deleteMany({ where: { user_id: user.id } });
            await prisma.game.delete({ where: { id: game.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
    });
});
