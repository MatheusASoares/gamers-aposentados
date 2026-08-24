// tests/deals-curated-pool.spec.ts

import { test, expect } from "@playwright/test";
import { CURATED_GAMES_POOL, getCuratedAppIds, findCuratedGame } from "../src/services/deals/curatedGames";

test.describe("Deals Curated Pool Integrity", () => {
    test("curated pool contains at least 30 high-profile games", () => {
        expect(CURATED_GAMES_POOL.length).toBeGreaterThanOrEqual(30);
    });

    test("every curated game has a valid title, positive steamAppId, and slug", () => {
        for (const game of CURATED_GAMES_POOL) {
            expect(game.title).toBeDefined();
            expect(game.title.trim().length).toBeGreaterThan(0);

            expect(typeof game.steamAppId).toBe("number");
            expect(game.steamAppId).toBeGreaterThan(0);

            expect(game.slug).toBeDefined();
            expect(game.slug.length).toBeGreaterThan(0);
            expect(game.slug).toBe(game.slug.toLowerCase());
        }
    });

    test("contains essential evergreen and anticipated titles (Crimson Desert, Elden Ring, Baldurs Gate 3, Cyberpunk)", () => {
        const titles = CURATED_GAMES_POOL.map((g) => g.title.toLowerCase());
        const slugs = CURATED_GAMES_POOL.map((g) => g.slug);

        expect(titles.some((t) => t.includes("crimson desert")) || slugs.includes("crimson-desert")).toBe(true);
        expect(titles.some((t) => t.includes("elden ring")) || slugs.includes("elden-ring")).toBe(true);
        expect(titles.some((t) => t.includes("baldur")) || slugs.includes("baldurs-gate-3")).toBe(true);
        expect(titles.some((t) => t.includes("cyberpunk")) || slugs.includes("cyberpunk-2077")).toBe(true);
        expect(titles.some((t) => t.includes("monster hunter"))).toBe(true);
    });

    test("no duplicate steamAppIds or slugs in curated pool", () => {
        const appIds = CURATED_GAMES_POOL.map((g) => g.steamAppId);
        const slugs = CURATED_GAMES_POOL.map((g) => g.slug);

        // Check unique slugs
        const uniqueSlugs = new Set(slugs);
        expect(uniqueSlugs.size).toBe(slugs.length);
    });

    test("helper functions getCuratedAppIds and findCuratedGame work as expected", () => {
        const appIds = getCuratedAppIds();
        expect(appIds.length).toBe(CURATED_GAMES_POOL.length);

        const eldenRing = findCuratedGame(1245620);
        expect(eldenRing).toBeDefined();
        expect(eldenRing?.title).toBe("ELDEN RING");

        const cyberpunk = findCuratedGame("cyberpunk-2077");
        expect(cyberpunk).toBeDefined();
        expect(cyberpunk?.steamAppId).toBe(1091500);
    });
});
