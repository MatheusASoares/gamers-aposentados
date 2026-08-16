import { test, expect } from "@playwright/test";
import { getRankTierDetails } from "../src/app/lib/xp-engine";
import { REWARDS_CATALOG, getUnlockedRewardsForLevel } from "../src/lib/constants/rewards";

test.describe("Level Up Celebration & Theming System", () => {
    test("getRankTierDetails returns appropriate tier details for each level bracket", () => {
        const tier1 = getRankTierDetails(1);
        expect(tier1.id).toBe("rookie");
        expect(tier1.name).toBe("Aposentado Novato");

        const tier4 = getRankTierDetails(4);
        expect(tier4.id).toBe("adventurer");
        expect(tier4.name).toBe("Limpador de Poeira");

        const tier7 = getRankTierDetails(7);
        expect(tier7.id).toBe("adventurer");

        const tier9 = getRankTierDetails(9);
        expect(tier9.id).toBe("veteran");
        expect(tier9.name).toBe("Caçador de Backlog");

        const tier14 = getRankTierDetails(14);
        expect(tier14.id).toBe("master");
        expect(tier14.name).toBe("Veterano dos Controles");

        const tier20 = getRankTierDetails(20);
        expect(tier20.id).toBe("legend");
        expect(tier20.name).toBe("Mestre da Guilda Aposentada");
    });

    test("Rewards catalog has valid rewards associated with level tiers", () => {
        const lvl5Rewards = getUnlockedRewardsForLevel(5);
        expect(lvl5Rewards.length).toBeGreaterThan(0);
        expect(lvl5Rewards.some((r) => r.level === 5)).toBe(true);

        const lvl7Rewards = getUnlockedRewardsForLevel(7);
        expect(lvl7Rewards.length).toBeGreaterThanOrEqual(lvl5Rewards.length);
    });
});
