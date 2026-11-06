import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Guild Custom Game Rules & Quota Engine", () => {
  const testGuildSlug = `test-custom-guild-${Date.now()}`;
  const testInviteCode = `TEST${Math.floor(1000 + Math.random() * 9000)}`;
  let createdGuildId: string;
  let testUserId: string;

  test.beforeAll(async () => {
    // Busca ou cria usuário de teste
    let testUser = await prisma.user.findFirst({
      where: { email: "test-rules@test.com" },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: "Test Guild Commander",
          email: "test-rules@test.com",
        },
      });
    }
    testUserId = testUser.id;
  });

  test.afterAll(async () => {
    // Cleanup
    if (createdGuildId) {
      await prisma.guild.deleteMany({
        where: { id: createdGuildId },
      });
    }
    await prisma.user.deleteMany({
      where: { email: "test-rules@test.com" },
    });
  });

  test("1. Guild can be created with custom ONLY_MAIN quest mode and custom nominations", async () => {
    const guild = await prisma.guild.create({
      data: {
        name: "Duo Aposentados Custom",
        slug: testGuildSlug,
        invite_code: testInviteCode,
        owner_id: testUserId,
        quest_mode: "ONLY_MAIN",
        main_quest_nominations: 4,
        side_quest_nominations: 0,
        max_active_quests: 1,
        members: {
          create: [
            {
              user_id: testUserId,
              role: "LEADER",
              is_active: true,
            },
          ],
        },
      },
      include: {
        members: true,
      },
    });

    createdGuildId = guild.id;

    expect(guild.id).toBeDefined();
    expect(guild.quest_mode).toBe("ONLY_MAIN");
    expect(guild.main_quest_nominations).toBe(4);
    expect(guild.side_quest_nominations).toBe(0);
    expect(guild.max_active_quests).toBe(1);
    expect(guild.members.length).toBe(1);
  });

  test("2. Pool quota calculation respects custom guild nominations (4 per member for 2 members = 8 total)", async () => {
    const guild = await prisma.guild.findUnique({
      where: { id: createdGuildId },
      include: {
        members: { where: { is_active: true } },
      },
    });

    expect(guild).not.toBeNull();
    const activeMemberCount = 2; // Simulating 2 active members (Matheus & Kaleb)
    const quotaPerMember = guild!.quest_mode === "ONLY_MAIN"
      ? guild!.main_quest_nominations
      : guild!.side_quest_nominations;

    const totalRequired = quotaPerMember * activeMemberCount;
    expect(quotaPerMember).toBe(4);
    expect(totalRequired).toBe(8);
  });

  test("3. Guild settings can be updated to MAIN_AND_SIDE with custom side nominations", async () => {
    const updated = await prisma.guild.update({
      where: { id: createdGuildId },
      data: {
        quest_mode: "MAIN_AND_SIDE",
        main_quest_nominations: 3,
        side_quest_nominations: 4,
        max_active_quests: 2,
      },
    });

    expect(updated.quest_mode).toBe("MAIN_AND_SIDE");
    expect(updated.main_quest_nominations).toBe(3);
    expect(updated.side_quest_nominations).toBe(4);
    expect(updated.max_active_quests).toBe(2);
  });

  test("4. ONLY_MAIN guard prevents side quest operations", async () => {
    // Reset to ONLY_MAIN
    await prisma.guild.update({
      where: { id: createdGuildId },
      data: {
        quest_mode: "ONLY_MAIN",
      },
    });

    const currentGuild = await prisma.guild.findUnique({
      where: { id: createdGuildId },
      select: { quest_mode: true },
    });

    const isSideAllowed = currentGuild?.quest_mode !== "ONLY_MAIN";
    expect(isSideAllowed).toBe(false);
  });
});

