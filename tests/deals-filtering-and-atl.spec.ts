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
        steamReviews: {
            reviewScoreDesc: "Extremamente positivas",
            positivePercent: 96,
            totalReviews: 50000,
        },
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
        steamReviews: {
            reviewScoreDesc: "Muito positivas",
            positivePercent: 88,
            totalReviews: 14000,
        },
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
        steamReviews: {
            reviewScoreDesc: "Neutras",
            positivePercent: 55,
            totalReviews: 800,
        },
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
        steamReviews: {
            reviewScoreDesc: "Ligeiramente positivas",
            positivePercent: 72,
            totalReviews: 1200,
        },
    },
    {
        id: "game-5",
        title: "Cheap Indie Masterpiece",
        slug: "cheap-indie",
        steamAppId: 1005,
        discountPercent: 80,
        priceUS: 5.0,
        priceBR: 24.9, // Under R$ 30
        convertedBRInUSD: 0,
        winningRegion: "EQUAL",
        savingsPercent: 0,
        storeUS: "Steam",
        storeBR: "Steam",
        isAllTimeLow: true,
        steamReviews: {
            reviewScoreDesc: "Extremamente positivas",
            positivePercent: 98,
            totalReviews: 32000,
        },
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

        expect(result.length).toBe(mockDeals.length);
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

        // In mockDeals, game-2, game-4 and game-5 have isAllTimeLow = true
        expect(result.length).toBe(3);
        expect(result.every((item) => item.isAllTimeLow)).toBe(true);
        expect(result.map((i) => i.id)).toContain("game-2");
        expect(result.map((i) => i.id)).toContain("game-4");
        expect(result.map((i) => i.id)).toContain("game-5");
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

    test("steam_acclaimed filter keeps only highly rated games and sorts by rating descending", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "steam_acclaimed",
            "all",
        );

        // game-5 (98%), game-1 (96%), game-2 (88%) should qualify (>= 75%)
        // game-3 (55%) and game-4 (72%) should be excluded
        expect(result.length).toBe(3);
        expect(result[0].id).toBe("game-5"); // 98%
        expect(result[1].id).toBe("game-1"); // 96%
        expect(result[2].id).toBe("game-2"); // 88%
        expect(result.every((item) => (item.steamReviews?.positivePercent ?? 0) >= 75)).toBe(true);
    });

    test("highest_cut filter orders strictly by discountPercent descending", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "highest_cut",
            "all",
        );

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].id).toBe("game-5"); // 80% discount
        expect(result[1].id).toBe("game-2"); // 75% discount

        for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].discountPercent).toBeGreaterThanOrEqual(result[i + 1].discountPercent);
        }
    });

    test("priceCap filter 'under_30' limits results to games with priceBR <= 30", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "all",
            "all",
            "under_30",
        );

        expect(result.length).toBe(1);
        expect(result[0].id).toBe("game-5"); // 24.90 BRL
        expect(result[0].priceBR).toBeLessThanOrEqual(30);
    });

    test("priceCap filter 'under_100' limits results to games with priceBR <= 100", () => {
        const result = DealComparator.normalizeFeaturedDeals(
            mockDeals,
            mockCurrencyRate,
            "best_savings",
            "all",
            "all",
            "under_100",
        );

        // game-5 (24.90) and game-4 (75.0) are <= 100 BRL
        expect(result.length).toBe(2);
        expect(result.every((i) => i.priceBR <= 100)).toBe(true);
    });
});
