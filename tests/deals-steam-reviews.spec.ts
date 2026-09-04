// tests/deals-steam-reviews.spec.ts

import { test, expect } from "@playwright/test";
import { SteamStoreClient } from "../src/services/deals/steamStoreClient";

test.describe("Steam Community Reviews Integration", () => {
    test("getAppReviewsSummary fetches live review summary for Baldur's Gate 3", async () => {
        // Baldur's Gate 3 Steam AppId = 1086940
        const reviews = await SteamStoreClient.getAppReviewsSummary(1086940);

        expect(reviews).not.toBeNull();
        if (reviews) {
            expect(reviews.totalReviews).toBeGreaterThan(10000);
            expect(reviews.positivePercent).toBeGreaterThanOrEqual(90);
            expect(typeof reviews.reviewScoreDesc).toBe("string");
            expect(reviews.reviewScoreDesc.length).toBeGreaterThan(0);
        }
    });

    test("getAppReviewsSummary handles invalid AppId gracefully without throwing", async () => {
        const reviews = await SteamStoreClient.getAppReviewsSummary(999999999);
        // Should return null or empty reviews, but not throw an unhandled rejection
        expect(reviews === null || reviews.totalReviews === 0).toBe(true);
    });
});
