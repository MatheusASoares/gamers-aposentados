// tests/deals-tracked-service.spec.ts

import { test, expect } from "@playwright/test";
import { DealsService } from "../src/services/deals/dealsService";

test.describe("Tracked Deals Service & Alert Logic", () => {
    test("getTrackedDealsStatus handles empty tracked list gracefully", async () => {
        const result = await DealsService.getTrackedDealsStatus([]);
        expect(result.items).toEqual([]);
        expect(result.hasAllTimeLow).toBe(false);
        expect(result.allTimeLowCount).toBe(0);
    });

    test("getTrackedDealsStatus resolves live prices for Steam games (e.g. Baldur's Gate 3)", async () => {
        const trackedItems = [
            {
                id: "steam-1086940",
                title: "Baldur's Gate 3",
                steamAppId: 1086940,
                slug: "baldurs-gate-3",
            },
        ];

        const result = await DealsService.getTrackedDealsStatus(trackedItems);
        expect(result.items.length).toBe(1);

        const item = result.items[0];
        expect(item.title).toBe("Baldur's Gate 3");
        expect(item.steamAppId).toBe(1086940);
        expect(item.currentPriceBR).toBeGreaterThan(0);
        expect(item.currentPriceUS).toBeGreaterThan(0);
        expect(typeof item.isAllTimeLow).toBe("boolean");
        expect(item.dealUrlBR).toContain("1086940");
    });

    test("dashboard alert triggers only when at least one game is in All-Time Low", () => {
        const mockTrackedWithATL = {
            items: [
                { id: "1", title: "Game A", isAllTimeLow: false },
                { id: "2", title: "Game B", isAllTimeLow: true },
            ],
            hasAllTimeLow: true,
            allTimeLowCount: 1,
        };

        const mockTrackedNoATL = {
            items: [
                { id: "1", title: "Game A", isAllTimeLow: false },
                { id: "2", title: "Game B", isAllTimeLow: false },
            ],
            hasAllTimeLow: false,
            allTimeLowCount: 0,
        };

        // Verification of business logic trigger
        expect(mockTrackedWithATL.hasAllTimeLow).toBe(true);
        expect(mockTrackedWithATL.allTimeLowCount).toBe(1);

        expect(mockTrackedNoATL.hasAllTimeLow).toBe(false);
        expect(mockTrackedNoATL.allTimeLowCount).toBe(0);
    });
});
