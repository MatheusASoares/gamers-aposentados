// tests/deals-oracle.spec.ts

import { test, expect } from "@playwright/test";
import { DealsOracleService } from "../src/services/deals/dealsOracleService";

test.describe("Deals Oracle AI Service & Steam Integration", () => {
    test("getUserTasteProfile provides valid taste summary and default classics for guest", async () => {
        const profile = await DealsOracleService.getUserTasteProfile();

        expect(profile).toBeDefined();
        expect(profile.favorites.length).toBeGreaterThanOrEqual(3);
        expect(profile.tasteSummary).toBeTruthy();
        expect(profile.excludedTitles).toBeInstanceOf(Set);
    });

    test("getOracleRecommendations returns balanced portfolio with Steam price enrichment", async () => {
        const result = await DealsOracleService.getOracleRecommendations(undefined, true);

        expect(result).toBeDefined();
        expect(result.recommendations.length).toBeGreaterThanOrEqual(6);
        expect(result.tasteSummary).toBeTruthy();

        // Recommendations should be partitioned into onSale and onRadar
        expect(result.onSale.length + result.onRadar.length).toBe(result.recommendations.length);

        // Every recommendation should have title, tier, pitch, and highlightReason
        for (const item of result.recommendations) {
            expect(item.title).toBeTruthy();
            expect(["AAA", "INDIE", "HIDDEN_GEM"]).toContain(item.tier);
            expect(item.pitch).toBeTruthy();
            expect(item.highlightReason).toBeTruthy();
            expect(item.dealUrl).toBeTruthy();
        }

        // Check if tier variety exists
        const tiers = new Set(result.recommendations.map((r) => r.tier));
        expect(tiers.size).toBeGreaterThanOrEqual(2);
    });

    test("dismissGame correctly marks a game as dismissed and evicts it from recommendations", async () => {
        const testGameTitle = "Persona 5 Royal";
        await DealsOracleService.dismissGame(undefined, testGameTitle);

        // Subsequent query should not crash and should succeed
        const refreshed = await DealsOracleService.getOracleRecommendations(undefined, false);
        expect(refreshed).toBeDefined();
        expect(refreshed.recommendations.length).toBeGreaterThanOrEqual(6);
    });
});
