import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { getPastIncompleteGames } from "../src/app/lib/pool-actions";

test.describe("Multi-Tenancy: Past Incomplete Games Guild Isolation (Audit Bug 1.4)", () => {
    const timestamp = Date.now();
    let userAId: string;
    let userBId: string;
    let guildAId: string;
    let guildBId: string;
    let guildEmptyId: string;
    let game1Id: string;
    let game2Id: string;
    let game3Id: string;

    test.beforeAll(async () => {
        // 1. Criar usuários
        const userA = await prisma.user.create({
            data: {
                username: `matheus_inc_${timestamp}`,
                name: `Matheus`,
                email: `matheus-inc-${timestamp}@test.com`,
            },
        });
        userAId = userA.id;

        const userB = await prisma.user.create({
            data: {
                username: `kaleb_inc_${timestamp}`,
                name: `Kaleb Pereira`,
                email: `kaleb-inc-${timestamp}@test.com`,
            },
        });
        userBId = userB.id;

        // 2. Criar Guildas
        const guildA = await prisma.guild.create({
            data: {
                name: `Guilda Aposentados Inc ${timestamp}`,
                slug: `aposentados-inc-${timestamp}`,
                invite_code: `API${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userAId,
                members: {
                    create: [{ user_id: userAId, role: "LEADER", is_active: true }],
                },
            },
        });
        guildAId = guildA.id;

        const guildB = await prisma.guild.create({
            data: {
                name: `Guilda Legendarios Inc ${timestamp}`,
                slug: `legendarios-inc-${timestamp}`,
                invite_code: `LGI${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userBId,
                members: {
                    create: [{ user_id: userBId, role: "LEADER", is_active: true }],
                },
            },
        });
        guildBId = guildB.id;

        const guildEmpty = await prisma.guild.create({
            data: {
                name: `Guilda Vazia Inc ${timestamp}`,
                slug: `vazia-inc-${timestamp}`,
                invite_code: `VZI${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userAId,
            },
        });
        guildEmptyId = guildEmpty.id;

        // 3. Criar Jogos
        const g1 = await prisma.game.create({
            data: { title: `Game Aposentados Dropped ${timestamp}`, quest_type: "MAIN_QUEST" },
        });
        game1Id = g1.id;

        const g2 = await prisma.game.create({
            data: { title: `Game Legendarios Dropped ${timestamp}`, quest_type: "MAIN_QUEST" },
        });
        game2Id = g2.id;

        const g3 = await prisma.game.create({
            data: { title: `Game Cross Guild Compartilhado ${timestamp}`, quest_type: "MAIN_QUEST" },
        });
        game3Id = g3.id;

        // 4. Configurar Progressos:
        // Game 1: Abandonado por User A (Aposentados)
        await prisma.gameProgress.create({
            data: { user_id: userAId, game_id: game1Id, status: "DROPPED" },
        });

        // Game 2: Abandonado por User B (Legendários)
        await prisma.gameProgress.create({
            data: { user_id: userBId, game_id: game2Id, status: "DROPPED" },
        });

        // Game 3: Zerado por User A (Aposentados), mas Abandonado por User B (Legendários)
        await prisma.gameProgress.create({
            data: { user_id: userAId, game_id: game3Id, status: "COMPLETED" },
        });
        await prisma.gameProgress.create({
            data: { user_id: userBId, game_id: game3Id, status: "DROPPED" },
        });
    });

    test.afterAll(async () => {
        // Limpeza
        await prisma.gameProgress.deleteMany({
            where: { game_id: { in: [game1Id, game2Id, game3Id] } },
        });
        await prisma.game.deleteMany({
            where: { id: { in: [game1Id, game2Id, game3Id] } },
        });
        await prisma.guildMember.deleteMany({
            where: { guild_id: { in: [guildAId, guildBId, guildEmptyId] } },
        });
        await prisma.guild.deleteMany({
            where: { id: { in: [guildAId, guildBId, guildEmptyId] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [userAId, userBId] } },
        });
    });

    test("1. Isolamento de Jogos Incompletos: Cada guilda enxerga apenas seus jogos abandonados", async () => {
        const resA = await getPastIncompleteGames(guildAId);
        expect(resA.success).toBe(true);
        expect(resA.games).toBeDefined();

        const gamesA = resA.games!;
        // Guilda A enxerga Game 1
        expect(gamesA.some((g) => g.id === game1Id)).toBe(true);
        // Guilda A NÃO enxerga Game 2 (abandonado por Legendários)
        expect(gamesA.some((g) => g.id === game2Id)).toBe(false);

        const resB = await getPastIncompleteGames(guildBId);
        expect(resB.success).toBe(true);
        expect(resB.games).toBeDefined();

        const gamesB = resB.games!;
        // Guilda B enxerga Game 2
        expect(gamesB.some((g) => g.id === game2Id)).toBe(true);
        // Guilda B NÃO enxerga Game 1 (abandonado por Aposentados)
        expect(gamesB.some((g) => g.id === game1Id)).toBe(false);
    });

    test("2. Independência entre Guildas: Jogo concluído na Guilda A ainda pode ser resgatado na Guilda B", async () => {
        // Game 3 foi completado por Matheus (Aposentados), mas foi abandonado por Kaleb (Legendários)
        const resB = await getPastIncompleteGames(guildBId);
        expect(resB.success).toBe(true);
        // Guilda B DEVE enxergar Game 3 como elegível para resgate
        expect(resB.games!.some((g) => g.id === game3Id)).toBe(true);

        const resA = await getPastIncompleteGames(guildAId);
        expect(resA.success).toBe(true);
        // Guilda A NÃO enxerga Game 3 (já zerado pelos membros de A)
        expect(resA.games!.some((g) => g.id === game3Id)).toBe(false);
    });

    test("3. Conclusão na Mesma Guilda: Quando membro da guilda completa, jogo sai de incompletos", async () => {
        // Kaleb completa o Game 2 na Guilda B
        await prisma.gameProgress.update({
            where: { user_id_game_id: { user_id: userBId, game_id: game2Id } },
            data: { status: "COMPLETED" },
        });

        const resB = await getPastIncompleteGames(guildBId);
        expect(resB.success).toBe(true);
        // Game 2 não deve mais constar em incompletos na Guilda B
        expect(resB.games!.some((g) => g.id === game2Id)).toBe(false);
    });

    test("4. Guilda Vazia retorna lista vazia sem erros", async () => {
        const resEmpty = await getPastIncompleteGames(guildEmptyId);
        expect(resEmpty.success).toBe(true);
        expect(resEmpty.games).toEqual([]);
    });
});

