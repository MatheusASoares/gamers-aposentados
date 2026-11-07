// tests/deals-batch-payload-security.spec.ts

import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import {
    BatchSyncSchema,
    processFavoritesSync,
} from "../src/app/api/deals/favorites/route";
import {
    processOwnedSync,
} from "../src/app/api/deals/owned/route";

test.describe("Security & Batch Ingestion: Deals APIs (Audit Item 2.1)", () => {
    const timestamp = Date.now();
    let testUser: { id: string; email: string | null };

    test.beforeAll(async () => {
        testUser = await prisma.user.create({
            data: {
                username: `deals_sec_user_${timestamp}`,
                name: "Deals Security Tester",
                email: `deals-sec-${timestamp}@test.com`,
            },
        });
    });

    test.afterAll(async () => {
        if (testUser?.id) {
            await prisma.userTrackedDeal.deleteMany({ where: { user_id: testUser.id } });
            await prisma.userOwnedDeal.deleteMany({ where: { user_id: testUser.id } });
            await prisma.user.delete({ where: { id: testUser.id } });
        }
    });

    test.describe("Zod Validation & Batch Limit Constraints", () => {
        test("BatchSyncSchema accepts valid payload with up to 100 items", () => {
            const valid100 = Array.from({ length: 100 }, (_, i) => ({
                id: `deal-${i}`,
                title: `Game Title ${i}`,
                slug: `game-title-${i}`,
                steamAppId: 1000 + i,
                coverImage: `https://cdn.example.com/cover-${i}.jpg`,
            }));

            const result = BatchSyncSchema.safeParse(valid100);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBe(100);
            }
        });

        test("BatchSyncSchema strictly rejects payload exceeding 100 items (DDoS protection)", () => {
            const invalid101 = Array.from({ length: 101 }, (_, i) => ({
                id: `deal-${i}`,
                title: `Game Title ${i}`,
            }));

            const result = BatchSyncSchema.safeParse(invalid101);
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten();
                expect(JSON.stringify(errors)).toContain("100");
            }
        });

        test("BatchSyncSchema rejects items missing mandatory fields (id or title)", () => {
            const missingTitle = [{ id: "deal-1" }];
            expect(BatchSyncSchema.safeParse(missingTitle).success).toBe(false);

            const missingId = [{ title: "Game Without ID" }];
            expect(BatchSyncSchema.safeParse(missingId).success).toBe(false);
        });

        test("BatchSyncSchema coerces numeric IDs to string for consistency", () => {
            const numericIdPayload = [{ id: 1245620, title: "Elden Ring" }];
            const result = BatchSyncSchema.safeParse(numericIdPayload);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].id).toBe("1245620");
            }
        });
    });

    test.describe("API Unauthenticated Access Guards", () => {
        test("processFavoritesSync rejects unauthenticated call with HTTP 401", async () => {
            const res = await processFavoritesSync(undefined, [{ id: "1", title: "Game" }]);
            expect(res.status).toBe(401);
            expect((res.body as any).isAuthenticated).toBe(false);
        });

        test("processOwnedSync rejects unauthenticated call with HTTP 401", async () => {
            const res = await processOwnedSync(null, [{ id: "1", title: "Game" }]);
            expect(res.status).toBe(401);
            expect((res.body as any).isAuthenticated).toBe(false);
        });
    });

    test.describe("Favorites Batch Processing & createMany Optimization", () => {
        test("processFavoritesSync rejects payload > 100 items with HTTP 400", async () => {
            const oversized = Array.from({ length: 101 }, (_, i) => ({
                id: `fav-over-${i}`,
                title: `Oversized Game ${i}`,
            }));

            const response = await processFavoritesSync(testUser.id, oversized);
            expect(response.status).toBe(400);
            expect((response.body as any).error).toBe("Payload inválido para syncItems");
        });

        test("processFavoritesSync ingests batch atomically and supports skipDuplicates", async () => {
            const batch = [
                { id: `fav-1-${timestamp}`, title: "Hollow Knight", steamAppId: 367520 },
                { id: `fav-2-${timestamp}`, title: "Celeste", steamAppId: 504230 },
                { id: `fav-3-${timestamp}`, title: "Dead Cells", steamAppId: 588650 },
            ];

            const res1 = await processFavoritesSync(testUser.id, batch);
            expect(res1.status).toBe(200);
            expect((res1.body as any).syncedCount).toBe(3);

            // Payload with in-memory duplicates and existing database duplicates
            const batchWithDupes = [
                { id: `fav-1-${timestamp}`, title: "Hollow Knight" }, // duplicate from DB
                { id: `fav-4-${timestamp}`, title: "Hades", steamAppId: 1145360 }, // new item
                { id: `fav-4-${timestamp}`, title: "Hades Duplicated In Payload" }, // duplicated inside payload
            ];

            const res2 = await processFavoritesSync(testUser.id, batchWithDupes);
            expect(res2.status).toBe(200);
            // Total should be 4 (fav-1, fav-2, fav-3, fav-4)
            expect((res2.body as any).syncedCount).toBe(4);

            const dbDeals = await prisma.userTrackedDeal.findMany({
                where: { user_id: testUser.id },
            });
            expect(dbDeals.length).toBe(4);
        });
    });

    test.describe("Owned Deals Batch Processing & createMany Optimization", () => {
        test("processOwnedSync rejects payload > 100 items with HTTP 400", async () => {
            const oversized = Array.from({ length: 101 }, (_, i) => ({
                id: `own-over-${i}`,
                title: `Oversized Owned Game ${i}`,
            }));

            const response = await processOwnedSync(testUser.id, oversized);
            expect(response.status).toBe(400);
            expect((response.body as any).error).toBe("Payload inválido para syncItems");
        });

        test("processOwnedSync ingests batch atomically and handles duplicates gracefully", async () => {
            const batch = [
                { id: `own-1-${timestamp}`, title: "Sekiro", steamAppId: 814380 },
                { id: `own-2-${timestamp}`, title: "Bloodborne", steamAppId: null },
            ];

            const res1 = await processOwnedSync(testUser.id, batch);
            expect(res1.status).toBe(200);
            expect((res1.body as any).syncedCount).toBe(2);

            // Re-sync with overlapping items
            const batchReSync = [
                { id: `own-1-${timestamp}`, title: "Sekiro" },
                { id: `own-3-${timestamp}`, title: "Dark Souls 3", steamAppId: 374320 },
            ];

            const res2 = await processOwnedSync(testUser.id, batchReSync);
            expect(res2.status).toBe(200);
            expect((res2.body as any).syncedCount).toBe(3);

            const dbOwned = await prisma.userOwnedDeal.findMany({
                where: { user_id: testUser.id },
            });
            expect(dbOwned.length).toBe(3);
        });
    });
});
