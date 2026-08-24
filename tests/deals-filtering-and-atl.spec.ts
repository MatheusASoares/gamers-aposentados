// tests/deals-filtering-and-atl.spec.ts

import { test, expect } from "@playwright/test";
import { DealComparator } from "../src/services/deals/dealComparator";
import { FeaturedDealItem, CurrencyRate } from "../src/types/deals";

const mockCurrencyRate: CurrencyRate = {
    code: "USD",
    codein: "BRL",
    rate: 5.0, // 1 USD = 5.00 BRL
    high: 5.05,
    low: 4.95,
    pctChange: 0.1,
    updatedAt: new Date().toISOString(),
};

const mockDeals: FeaturedDealItem[] = [
    {
        id: "game-1",
        title: "Deal with Huge BR Savings",
        slug: "huge-br-savings",
        steamAppId: 1001,
        discountPercent: 50,
        priceUS: 60.0, // In USD
        priceBR: 150.0, // 150 BRL = 30 USD -> 50% savings in BR!
        convertedBRInUSD: 0,
        winningRegion: "EQUAL",
        savingsPercent: 0,
        storeUS: "Steam",
        storeBR: "Steam",
        isAllTimeLow: false,
    },
    {
        id: "game-2",
        title: "All Time Low Record Game",
        slug: "all-time-low-game",
        steamAppId: 1002,
        discountPercent: 75,
        priceUS: 40.0,
        priceBR: 120.0, // 120 BRL = 24 USD -> 40% savings in BR
        convertedBRInUSD: 0,
        winningRegion: "EQUAL",
        savingsPercent: 0,
        storeUS: "Steam",
        storeBR: "Nuuvem",
        isAllTimeLow: true,
    },
    {
        id: "game-3",
        title: "Moderate Deal Not ATL",
        slug: "moderate-deal",
        steamAppId: 1003,
        discountPercent: 20,
        priceUS: 50.0,
        priceBR: 200.0, // 200 BRL = 40 USD -> 20% savings in BR
        convertedBRInUSD: 0,
        winningRegion: "EQUAL",
        savingsPercent: 0,
        storeUS: "Steam",
        storeBR: "Steam",
        isAllTimeLow: false,
    },
    {
        id: "game-4",
        title: "US Winner Deal",
        slug: "us-winner-deal",
        steamAppId: 1004,
        discountPercent: 60,
        priceUS: 10.0, // 10 USD
        priceBR: 75.0, // 75 BRL = 15 USD -> US is 33% cheaper than BR!
        convertedBRInUSD: 0,
        winningRegion: "EQUAL",
        savingsPercent: 0,
        storeUS: "Steam",
        storeBR: "Nuuvem",
        isAllTimeLow: true,
    },
];

test.describe("Deals Filtering, Normalization and ATL Logic", () => {
    test("best_savings filter orders by highest regional savings percentage", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "all",
        );

        expect(result.length).toBe(4);
        // First item should have the highest savingsPercent (50%)
        expect(result[0].id).toBe("game-1");
        expect(result[0].savingsPercent).toBe(50);
        expect(result[0].winningRegion).toBe("BR");

        // Verify descending order
        for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].savingsPercent).toBeGreaterThanOrEqual(result[i + 1].savingsPercent);
        }
    });

    test("historical_low filter strictly keeps ONLY All-Time Low items", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "historical_low",
            "all",
        );

        // In mockDeals, only game-2 and game-4 have isAllTimeLow = true
        expect(result.length).toBe(2);
        expect(result.every((item) => item.isAllTimeLow)).toBe(true);
        expect(result.map((i) => i.id)).toContain("game-2");
        expect(result.map((i) => i.id)).toContain("game-4");
        expect(result.map((i) => i.id)).not.toContain("game-3");
    });

    test("storeFilter 'steam' includes only Steam store deals", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "steam",
        );

        expect(result.every((i) => i.storeBR.toLowerCase().includes("steam") || i.storeUS.toLowerCase().includes("steam"))).toBe(true);
    });

    test("storeFilter 'nuuvem' includes only Nuuvem deals", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "nuuvem",
        );

        expect(result.length).toBeGreaterThan(0);
        expect(result.every((i) => i.storeBR.toLowerCase().includes("nuuvem") || i.storeUS.toLowerCase().includes("nuuvem"))).toBe(true);
    });

    test("filters out meme and shovelware titles", () => {
        const listWithMemes: FeaturedDealItem[] = [
            ...mockDeals,
            {
                id: "meme-1",
                title: "Hentai Waifu Puzzle 2024",
                slug: "hentai-waifu-puzzle",
                steamAppId: 9999,
                discountPercent: 90,
                priceUS: 0.99,
                priceBR: 2.0,
                convertedBRInUSD: 0,
                winningRegion: "EQUAL",
                savingsPercent: 50,
                storeUS: "Steam",
                storeBR: "Steam",
                isAllTimeLow: true,
            },
            {
                id: "meme-2",
                title: "Anime Girl Clicker Simulator",
                slug: "anime-girl-clicker",
                steamAppId: 9998,
                discountPercent: 95,
                priceUS: 0.49,
                priceBR: 1.5,
                convertedBRInUSD: 0,
                winningRegion: "EQUAL",
                savingsPercent: 40,
                storeUS: "Steam",
                storeBR: "Steam",
                isAllTimeLow: true,
            },
        ];

        const result = DealComparator.normalizeFeaturedDeals(
            listWithMemes,
            mockCurrencyRate,
            "historical_low",
            "all",
        );

        expect(result.some((i) => i.title.toLowerCase().includes("hentai"))).toBe(false);
        expect(result.some((i) => i.title.toLowerCase().includes("clicker"))).toBe(false);
    });

    test("deduplicates identical games by title or steamAppId", () => {
        const duplicateList: FeaturedDealItem[] = [
            ...mockDeals,
            { ...mockDeals[0], id: "game-1-duplicate" },
        ];

        const result = DealComparator.normalizeFeaturedDeals(
            duplicateList,
            mockCurrencyRate,
            "best_savings",
            "all",
        );

        expect(result.length).toBe(mockDeals.length);
    });

    test("regionFilter 'br' keeps only BR winners and 'us' keeps only US winners", () => {
        const brResult = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "all",
            "br",
        );

        expect(brResult.length).toBeGreaterThan(0);
        expect(brResult.every((i) => i.winningRegion === "BR")).toBe(true);

        const usResult = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "all",
            "us",
        );

        expect(usResult.length).toBe(1);
        expect(usResult[0].id).toBe("game-4");
        expect(usResult[0].winningRegion).toBe("US");
    });
});
