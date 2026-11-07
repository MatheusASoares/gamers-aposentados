import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { getQuestHistoryByYear } from "../src/app/lib/history-actions";

test.describe("Multi-Tenancy: Quest History Guild Isolation (Audit Bug 1.3)", () => {
    const timestamp = Date.now();
    let userAId: string;
    let userBId: string;
    let guildAId: string;
    let guildBId: string;
    let gameId: string;
    let poolAId: string;
    let poolBId: string;
    let legacyPoolId: string;

    test.beforeAll(async () => {
        // 1. Criar usuários: User A (Aposentados) e User B (Legendários - Kaleb)
        const userA = await prisma.user.create({
            data: {
                username: `matheus_${timestamp}`,
                name: `Matheus`,
                email: `matheus-${timestamp}@test.com`,
            },
        });
        userAId = userA.id;

        const userB = await prisma.user.create({
            data: {
                username: `kaleb_${timestamp}`,
                name: `Kaleb Pereira`,
                email: `kaleb-${timestamp}@test.com`,
            },
        });
        userBId = userB.id;

        // 2. Criar Guilda A (Aposentados)
        const guildA = await prisma.guild.create({
            data: {
                name: `Aposentados Mock ${timestamp}`,
                slug: `aposentados-mock-${timestamp}`,
                invite_code: `APO${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userAId,
                members: {
                    create: [{ user_id: userAId, role: "LEADER", is_active: true }],
                },
            },
        });
        guildAId = guildA.id;

        // 3. Criar Guilda B (Legendários)
        const guildB = await prisma.guild.create({
            data: {
                name: `Legendarios Mock ${timestamp}`,
                slug: `legendarios-mock-${timestamp}`,
                invite_code: `LGD${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userBId,
                members: {
                    create: [{ user_id: userBId, role: "LEADER", is_active: true }],
                },
            },
        });
        guildBId = guildB.id;

        // 4. Criar Jogo (Elden Ring)
        const game = await prisma.game.create({
            data: {
                title: `Elden Ring ${timestamp}`,
                quest_type: "MAIN_QUEST",
            },
        });
        gameId = game.id;

        // 5. Criar progresso individual de cada jogador no jogo
        await prisma.gameProgress.create({
            data: {
                user_id: userAId,
                game_id: gameId,
                status: "ACTIVE",
                progress_percentage: 45,
            },
        });

        await prisma.gameProgress.create({
            data: {
                user_id: userBId,
                game_id: gameId,
                status: "COMPLETED",
                progress_percentage: 100,
            },
        });

        // 6. Criar Pools Fechadas
        const poolA = await prisma.pool.create({
            data: {
                guild_id: guildAId,
                type: "MAIN_QUEST",
                status: "CLOSED",
                year: 2026,
                month: 11,
                winner_game_id: gameId,
            },
        });
        poolAId = poolA.id;

        const poolB = await prisma.pool.create({
            data: {
                guild_id: guildBId,
                type: "MAIN_QUEST",
                status: "CLOSED",
                year: 2026,
                month: 11,
                winner_game_id: gameId,
            },
        });
        poolBId = poolB.id;

        // 7. Criar Pool Legada (sem guilda associada)
        const legacyPool = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                year: 2025,
                month: 6,
                winner_game_id: gameId,
            },
        });
        legacyPoolId = legacyPool.id;
    });

    test.afterAll(async () => {
        // Limpeza completa
        await prisma.gameProgress.deleteMany({
            where: { game_id: gameId },
        });
        await prisma.pool.deleteMany({
            where: { id: { in: [poolAId, poolBId, legacyPoolId] } },
        });
        await prisma.game.deleteMany({
            where: { id: gameId },
        });
        await prisma.guildMember.deleteMany({
            where: { guild_id: { in: [guildAId, guildBId] } },
        });
        await prisma.guild.deleteMany({
            where: { id: { in: [guildAId, guildBId] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [userAId, userBId] } },
        });
    });

    test("1. Membros de outras guildas (Legendários / Kaleb) aparecem no progresso do histórico", async () => {
        // Consultar histórico da Guilda B (Legendários)
        const historyB = await getQuestHistoryByYear(2026, "MAIN", guildBId);
        expect(historyB.length).toBeGreaterThan(0);

        const targetPool = historyB.find((p) => p.poolId === poolBId);
        expect(targetPool).toBeDefined();

        // O progresso de Kaleb DEVE estar presente (não mais ocultado pelo filtro antigo de nomes)
        expect(targetPool!.progress.length).toBe(1);
        expect(targetPool!.progress[0].userId).toBe(userBId);
        expect(targetPool!.progress[0].userName).toBe("Kaleb Pereira");
        expect(targetPool!.progress[0].status).toBe("COMPLETED");
        expect(targetPool!.progress[0].progress_percentage).toBe(100);
    });

    test("2. Isolamento Total: Histórico de uma guilda não vaza membros de outra guilda", async () => {
        // Consultar histórico da Guilda A (Aposentados)
        const historyA = await getQuestHistoryByYear(2026, "MAIN", guildAId);
        const targetPoolA = historyA.find((p) => p.poolId === poolAId);

        expect(targetPoolA).toBeDefined();
        expect(targetPoolA!.progress.length).toBe(1);
        expect(targetPoolA!.progress[0].userId).toBe(userAId);
        expect(targetPoolA!.progress[0].userName).toBe("Matheus");

        // Kaleb NÃO pode aparecer na Guilda A
        expect(targetPoolA!.progress.some((p) => p.userId === userBId)).toBe(false);
    });

    test("3. Quests Legadas sem guilda preservam histórico sem quebrar", async () => {
        const legacyHistory = await getQuestHistoryByYear(2025, "MAIN", undefined);
        const legacyTarget = legacyHistory.find((p) => p.poolId === legacyPoolId);

        expect(legacyTarget).toBeDefined();
        // Em quests legadas sem guilda, exibe os jogadores que participaram
        expect(legacyTarget!.progress.length).toBeGreaterThan(0);
    });
});

