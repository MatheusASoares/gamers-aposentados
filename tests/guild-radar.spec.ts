import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Guild Multiverse Radar & Cross-Guild History", () => {
    const timestamp = Date.now();
    let guildAId: string;
    let guildBId: string;
    let userAId: string;
    let userBId: string;
    let userInactiveId: string;
    let gameAId: string;
    let gameBId: string;
    let poolAId: string;
    let poolBId: string;

    test.beforeAll(async () => {
        // 1. Create test users
        const userA = await prisma.user.create({
            data: {
                name: `Radar Tester A ${timestamp}`,
                email: `radar-a-${timestamp}@test.com`,
                level: 5,
            },
        });
        userAId = userA.id;

        const userB = await prisma.user.create({
            data: {
                name: `Radar Tester B ${timestamp}`,
                email: `radar-b-${timestamp}@test.com`,
                level: 3,
            },
        });
        userBId = userB.id;

        const userInactive = await prisma.user.create({
            data: {
                name: `Inactive Member ${timestamp}`,
                email: `inactive-${timestamp}@test.com`,
                level: 1,
            },
        });
        userInactiveId = userInactive.id;

        // 2. Create Guild A (e.g. Aposentados - Dual Quest mode)
        const guildA = await prisma.guild.create({
            data: {
                name: `Guild Alpha ${timestamp}`,
                slug: `guild-alpha-${timestamp}`,
                invite_code: `RAD1${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userAId,
                level: 10,
                quest_mode: "MAIN_AND_SIDE",
                members: {
                    create: [
                        { user_id: userAId, role: "LEADER", is_active: true },
                        { user_id: userInactiveId, role: "MEMBER", is_active: false },
                    ],
                },
            },
        });
        guildAId = guildA.id;

        // 3. Create Guild B (e.g. Legendarios - Only Main Quest mode)
        const guildB = await prisma.guild.create({
            data: {
                name: `Guild Beta ${timestamp}`,
                slug: `guild-beta-${timestamp}`,
                invite_code: `RAD2${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userBId,
                level: 4,
                quest_mode: "ONLY_MAIN",
                members: {
                    create: [
                        { user_id: userBId, role: "LEADER", is_active: true },
                    ],
                },
            },
        });
        guildBId = guildB.id;

        // 4. Create Games & Winning Pools for Guild A and B
        const gameA = await prisma.game.create({
            data: {
                title: `Chrono Odyssey Alpha ${timestamp}`,
                quest_type: "MAIN_QUEST",
            },
        });
        gameAId = gameA.id;

        const poolA = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                guild_id: guildAId,
                winner_game_id: gameAId,
                created_at: new Date(),
            },
        });
        poolAId = poolA.id;

        const gameB = await prisma.game.create({
            data: {
                title: `Metroid Vanguard Beta ${timestamp}`,
                quest_type: "MAIN_QUEST",
            },
        });
        gameBId = gameB.id;

        const poolB = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                guild_id: guildBId,
                winner_game_id: gameBId,
                created_at: new Date(),
            },
        });
        poolBId = poolB.id;
    });

    test.afterAll(async () => {
        // Cleanup test data
        const poolIds = [poolAId, poolBId].filter(Boolean);
        if (poolIds.length > 0) {
            await prisma.pool.deleteMany({
                where: { id: { in: poolIds } },
            });
        }

        const gameIds = [gameAId, gameBId].filter(Boolean);
        if (gameIds.length > 0) {
            await prisma.game.deleteMany({
                where: { id: { in: gameIds } },
            });
        }

        const guildIds = [guildAId, guildBId].filter(Boolean);
        if (guildIds.length > 0) {
            await prisma.guild.deleteMany({
                where: { id: { in: guildIds } },
            });
        }

        const userIds = [userAId, userBId, userInactiveId].filter(Boolean);
        if (userIds.length > 0) {
            await prisma.user.deleteMany({
                where: { id: { in: userIds } },
            });
        }
    });

    test("1. Cross-guild radar query excludes current active guild and isolates other guilds", async () => {
        const otherGuilds = await prisma.guild.findMany({
            where: { id: { not: guildAId } },
            include: {
                members: { where: { is_active: true } },
                pools: { where: { winner_game_id: { not: null } } },
            },
        });

        const hasGuildA = otherGuilds.some((g) => g.id === guildAId);
        const hasGuildB = otherGuilds.some((g) => g.id === guildBId);

        expect(hasGuildA).toBe(false);
        expect(hasGuildB).toBe(true);
    });

    test("2. Radar accurately maps winning games and honors ONLY_MAIN quest mode", async () => {
        const guildBData = await prisma.guild.findUnique({
            where: { id: guildBId },
            include: {
                pools: {
                    where: { winner_game_id: { not: null } },
                    include: { winner_game: true },
                },
            },
        });

        expect(guildBData).toBeDefined();
        expect(guildBData?.quest_mode).toBe("ONLY_MAIN");

        const winningGame = guildBData?.pools.find((p) => p.type === "MAIN_QUEST")?.winner_game;
        expect(winningGame).toBeDefined();
        expect(winningGame?.id).toBe(gameBId);
        expect(winningGame?.title).toBe(`Metroid Vanguard Beta ${timestamp}`);
    });

    test("3. Radar includes only active members (is_active: true)", async () => {
        const guildAData = await prisma.guild.findUnique({
            where: { id: guildAId },
            include: {
                members: {
                    where: { is_active: true },
                    include: { user: true },
                },
            },
        });

        const activeMemberIds = guildAData?.members.map((m) => m.user_id);
        expect(activeMemberIds).toContain(userAId);
        expect(activeMemberIds).not.toContain(userInactiveId);
    });

    test("4. Guild selector query returns both guilds with id, name, slug, level", async () => {
        const guilds = await prisma.guild.findMany({
            select: { id: true, name: true, slug: true, level: true },
            where: { id: { in: [guildAId, guildBId] } },
            orderBy: { name: "asc" },
        });

        expect(guilds.length).toBe(2);
        const slugs = guilds.map((g) => g.slug);
        expect(slugs).toContain(`guild-alpha-${timestamp}`);
        expect(slugs).toContain(`guild-beta-${timestamp}`);
    });

    test("5. Quest history query strictly filters by targetGuildId", async () => {
        const poolsGuildA = await prisma.pool.findMany({
            where: {
                guild_id: guildAId,
                winner_game_id: { not: null },
            },
            include: { winner_game: true },
        });

        const poolsGuildB = await prisma.pool.findMany({
            where: {
                guild_id: guildBId,
                winner_game_id: { not: null },
            },
            include: { winner_game: true },
        });

        const gameTitlesA = poolsGuildA.map((p) => p.winner_game?.title);
        const gameTitlesB = poolsGuildB.map((p) => p.winner_game?.title);

        expect(gameTitlesA).toContain(`Chrono Odyssey Alpha ${timestamp}`);
        expect(gameTitlesA).not.toContain(`Metroid Vanguard Beta ${timestamp}`);

        expect(gameTitlesB).toContain(`Metroid Vanguard Beta ${timestamp}`);
        expect(gameTitlesB).not.toContain(`Chrono Odyssey Alpha ${timestamp}`);
    });
});
