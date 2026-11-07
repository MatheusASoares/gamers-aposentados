import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { getRandomizerStatus } from "../src/app/lib/quest-actions";

test.describe("Multi-Tenancy: Randomizer Guild Isolation (Audit Bug 1.2)", () => {
    const timestamp = Date.now();
    let userA1Id: string;
    let userA2Id: string;
    let userB1Id: string;
    let guildAId: string;
    let guildBId: string;
    let guildEmptyId: string;
    let gameAId: string;
    let gameBId: string;
    let poolAId: string;
    let poolBId: string;

    test.beforeAll(async () => {
        // 1. Criar usuários de teste
        const userA1 = await prisma.user.create({
            data: {
                username: `userA1_${timestamp}`,
                name: `Jogador Alfa 1`,
                email: `user-a1-${timestamp}@test.com`,
            },
        });
        userA1Id = userA1.id;

        const userA2 = await prisma.user.create({
            data: {
                username: `userA2_${timestamp}`,
                name: `Jogador Alfa 2`,
                email: `user-a2-${timestamp}@test.com`,
            },
        });
        userA2Id = userA2.id;

        const userB1 = await prisma.user.create({
            data: {
                username: `userB1_${timestamp}`,
                name: `Jogador Beta 1`,
                email: `user-b1-${timestamp}@test.com`,
            },
        });
        userB1Id = userB1.id;

        // 2. Criar Guilda A (com membros ativos A1 e A2)
        const guildA = await prisma.guild.create({
            data: {
                name: `Guilda Alfa ${timestamp}`,
                slug: `guilda-alfa-${timestamp}`,
                invite_code: `GLDA${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userA1Id,
                members: {
                    create: [
                        { user_id: userA1Id, role: "LEADER", is_active: true },
                        { user_id: userA2Id, role: "MEMBER", is_active: true },
                    ],
                },
            },
        });
        guildAId = guildA.id;

        // 3. Criar Guilda B (com membro ativo B1)
        const guildB = await prisma.guild.create({
            data: {
                name: `Guilda Beta ${timestamp}`,
                slug: `guilda-beta-${timestamp}`,
                invite_code: `GLDB${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userB1Id,
                members: {
                    create: [
                        { user_id: userB1Id, role: "LEADER", is_active: true },
                    ],
                },
            },
        });
        guildBId = guildB.id;

        // 4. Criar Guilda Vazia (sem membros)
        const guildEmpty = await prisma.guild.create({
            data: {
                name: `Guilda Vazia ${timestamp}`,
                slug: `guilda-vazia-${timestamp}`,
                invite_code: `GLDE${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userA1Id,
            },
        });
        guildEmptyId = guildEmpty.id;

        // 5. Criar jogos
        const gameA = await prisma.game.create({
            data: {
                title: `Game Alfa ${timestamp}`,
                quest_type: "MAIN_QUEST",
            },
        });
        gameAId = gameA.id;

        const gameB = await prisma.game.create({
            data: {
                title: `Game Beta ${timestamp}`,
                quest_type: "MAIN_QUEST",
            },
        });
        gameBId = gameB.id;

        // 6. Criar Pools Fechadas com vencedores
        const poolA = await prisma.pool.create({
            data: {
                guild_id: guildAId,
                type: "MAIN_QUEST",
                status: "CLOSED",
                winner_game_id: gameAId,
            },
        });
        poolAId = poolA.id;

        const poolB = await prisma.pool.create({
            data: {
                guild_id: guildBId,
                type: "MAIN_QUEST",
                status: "CLOSED",
                winner_game_id: gameBId,
            },
        });
        poolBId = poolB.id;
    });

    test.afterAll(async () => {
        // Limpeza completa
        await prisma.gameProgress.deleteMany({
            where: { game_id: { in: [gameAId, gameBId] } },
        });
        await prisma.pool.deleteMany({
            where: { id: { in: [poolAId, poolBId] } },
        });
        await prisma.game.deleteMany({
            where: { id: { in: [gameAId, gameBId] } },
        });
        await prisma.guildMember.deleteMany({
            where: { guild_id: { in: [guildAId, guildBId, guildEmptyId] } },
        });
        await prisma.guild.deleteMany({
            where: { id: { in: [guildAId, guildBId, guildEmptyId] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [userA1Id, userA2Id, userB1Id] } },
        });
    });

    test("1. Isolamento Total: Quest ativa na Guilda A trava A, mas NÃO trava a Guilda B", async () => {
        // Inicializar gameA como ACTIVE para userA1 na Guilda A
        await prisma.gameProgress.upsert({
            where: { user_id_game_id: { user_id: userA1Id, game_id: gameAId } },
            create: { user_id: userA1Id, game_id: gameAId, status: "ACTIVE" },
            update: { status: "ACTIVE" },
        });

        // Inicializar gameB como COMPLETED para userB1 na Guilda B
        await prisma.gameProgress.upsert({
            where: { user_id_game_id: { user_id: userB1Id, game_id: gameBId } },
            create: { user_id: userB1Id, game_id: gameBId, status: "COMPLETED" },
            update: { status: "COMPLETED" },
        });

        // Guilda A deve estar TRAVADA
        const statusA = await getRandomizerStatus("MAIN_QUEST", guildAId);
        expect(statusA.locked).toBe(true);
        expect(statusA.message).toContain("Jogador Alfa 1");

        // Guilda B deve estar LIVRE (zero contaminação cruzada)
        const statusB = await getRandomizerStatus("MAIN_QUEST", guildBId);
        expect(statusB.locked).toBe(false);
    });

    test("2. Ausência de Fallback para Fundadores: Guilda vazia retorna locked: false", async () => {
        // Sem membros na Guilda Vazia, o Randomizer não consulta os fundadores e fica livre
        const statusEmpty = await getRandomizerStatus("MAIN_QUEST", guildEmptyId);
        expect(statusEmpty.locked).toBe(false);
    });

    test("3. Destravamento da Guilda A após conclusão ou abandono (Drop)", async () => {
        // userA1 completa a quest
        await prisma.gameProgress.update({
            where: { user_id_game_id: { user_id: userA1Id, game_id: gameAId } },
            data: { status: "COMPLETED", progress_percentage: 100 },
        });

        // Agora Guilda A deve destravar
        const statusA = await getRandomizerStatus("MAIN_QUEST", guildAId);
        expect(statusA.locked).toBe(false);
    });

    test("4. Membros Inativos (is_active: false) NÃO travam o Randomizer", async () => {
        // Definir userA2 como inativo
        await prisma.guildMember.update({
            where: { guild_id_user_id: { guild_id: guildAId, user_id: userA2Id } },
            data: { is_active: false },
        });

        // userA2 fica com o jogo em andamento (ACTIVE)
        await prisma.gameProgress.upsert({
            where: { user_id_game_id: { user_id: userA2Id, game_id: gameAId } },
            create: { user_id: userA2Id, game_id: gameAId, status: "ACTIVE" },
            update: { status: "ACTIVE" },
        });

        // Guilda A continua LIVRE porque userA2 é espectador/inativo
        const statusA = await getRandomizerStatus("MAIN_QUEST", guildAId);
        expect(statusA.locked).toBe(false);
    });

    test("5. Chamada sem targetGuildId quando não há guilda ativa retorna locked: false sem travar", async () => {
        // Chamada fora de contexto de sessão/cookie não deve recorrer aos Fundadores
        const statusNoGuild = await getRandomizerStatus("MAIN_QUEST", undefined);
        expect(statusNoGuild.locked).toBe(false);
    });
});

