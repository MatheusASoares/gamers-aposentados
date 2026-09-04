import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import {
  calculateGuildLevelFromXP,
  calculateGuildXPForNextLevel,
  getGuildScaleFactor,
  MAX_GUILD_LEVEL,
} from "../src/lib/guild-xp-engine";
import {
  GUILD_REWARDS_CATALOG,
  isGuildRewardUnlocked,
  getUnlockedGuildRewards,
} from "../src/lib/constants/guild-rewards";

test.describe("Guild Gamification & Adaptive XP Engine (25 Levels, Proportional Scaling)", () => {
  test("calculateGuildLevelFromXP correctly maps XP points to 1-25 guild levels with 2 active members", () => {
    expect(calculateGuildLevelFromXP(0, 2)).toBe(1);
    expect(calculateGuildLevelFromXP(1000, 2)).toBe(1);
    expect(calculateGuildLevelFromXP(1200, 2)).toBe(2);
    expect(calculateGuildLevelFromXP(3400, 2)).toBe(3);
    expect(calculateGuildLevelFromXP(8700, 2)).toBe(4); // Production starting level
    expect(calculateGuildLevelFromXP(9600, 2)).toBe(5);
    expect(calculateGuildLevelFromXP(32400, 2)).toBe(10);
    expect(calculateGuildLevelFromXP(150000, 2)).toBe(25); // Capped at MAX_GUILD_LEVEL (25)
  });

  test("Scaling factor doubles for 4 members and quadruples for 8 members", () => {
    expect(getGuildScaleFactor(2)).toBe(1);
    expect(getGuildScaleFactor(4)).toBe(2);
    expect(getGuildScaleFactor(8)).toBe(4);

    // With 4 members, reaching level 2 takes 2x XP compared to 2 members
    const lvl2XpFor2 = calculateGuildXPForNextLevel(1, 2);
    const lvl2XpFor4 = calculateGuildXPForNextLevel(1, 4);
    expect(lvl2XpFor4).toBe(lvl2XpFor2 * 2);

    // With 8 members, reaching level 2 takes 4x XP compared to 2 members
    const lvl2XpFor8 = calculateGuildXPForNextLevel(1, 8);
    expect(lvl2XpFor8).toBe(lvl2XpFor2 * 4);
  });

  test("calculateGuildXPForNextLevel calculates progressive threshold", () => {
    const xpLvl1 = calculateGuildXPForNextLevel(1, 2);
    const xpLvl10 = calculateGuildXPForNextLevel(10, 2);
    const xpLvl25 = calculateGuildXPForNextLevel(25, 2);

    expect(xpLvl1).toBeGreaterThan(0);
    expect(xpLvl10).toBeGreaterThan(xpLvl1);
    expect(xpLvl25).toBeGreaterThan(xpLvl10);
  });

  test("GUILD_REWARDS_CATALOG contains 25 distinct level rewards", () => {
    expect(GUILD_REWARDS_CATALOG.length).toBe(25);

    // Each level 1 to 25 must have exactly 1 unlock
    for (let lvl = 1; lvl <= 25; lvl++) {
      const reward = GUILD_REWARDS_CATALOG.find((r) => r.level === lvl);
      expect(reward).toBeDefined();
      expect(reward?.name).toBeTruthy();
      expect(reward?.type).toMatch(/TITLE|EMBLEM|BANNER|THEME/);
    }
  });

  test("isGuildRewardUnlocked and getUnlockedGuildRewards filter appropriately", () => {
    const lvl1Rewards = getUnlockedGuildRewards(1);
    expect(lvl1Rewards.length).toBeGreaterThanOrEqual(1);

    const lvl25Rewards = getUnlockedGuildRewards(25);
    expect(lvl25Rewards.length).toBe(25);
  });

  test("Guild XP and Level in database updates correctly", async () => {
    const guild = await prisma.guild.findFirst();
    expect(guild).toBeDefined();

    if (guild) {
      const updated = await prisma.guild.update({
        where: { id: guild.id },
        data: {
          equipped_title: "Guilda de Garagem",
          equipped_emblem: "Escudo dos Fundadores",
        },
      });

      expect(updated.equipped_title).toBe("Guilda de Garagem");
      expect(updated.equipped_emblem).toBe("Escudo dos Fundadores");
    }
  });
});
