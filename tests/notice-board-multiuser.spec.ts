import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { ensureUserContractProgress } from "../src/services/notice-board-progression";

test.describe("Notice Board Multi-user and Lazy Initialization Tests", () => {
    let testGameId: string;
    let userAId: string;
    let userBId: string;
    let contract1Id: string;
    let contract2Id: string;

    test.beforeEach(async () => {
        // 1. Limpar dados de teste anteriores
        await prisma.campaignContractProgress.deleteMany({
            where: { contract: { game: { title: { startsWith: "NoticeBoardMultiTest" } } } },
        });
        await prisma.campaignContract.deleteMany({
            where: { game: { title: { startsWith: "NoticeBoardMultiTest" } } },
        });
        await prisma.gameProgress.deleteMany({
            where: { game: { title: { startsWith: "NoticeBoardMultiTest" } } },
        });
        await prisma.game.deleteMany({
            where: { title: { startsWith: "NoticeBoardMultiTest" } },
        });

        // 2. Criar dois usuários isolados de teste
        const suffix = Date.now();
        const userA = await prisma.user.create({
            data: {
                username: `user_a_${suffix}`,
                email: `usera_${suffix}@test.com`,
            },
        });
        userAId = userA.id;

        const userB = await prisma.user.create({
            data: {
                username: `user_b_${suffix}`,
                email: `userb_${suffix}@test.com`,
            },
        });
        userBId = userB.id;

        // 3. Criar jogo com 3 contratos sequenciais
        const game = await prisma.game.create({
            data: {
                title: `NoticeBoardMultiTest ${suffix}`,
                quest_type: "MAIN_QUEST",
                hltb_time: 15,
            },
        });
        testGameId = game.id;

        const c1 = await prisma.campaignContract.create({
            data: {
                game_id: testGameId,
                sequence_order: 1,
                title: "Contrato 1 - Chegada",
                objective: "Completar o Ato 1",
                daily_atomic_quest: "",
                progress_percentage: 33,
            },
        });
        contract1Id = c1.id;

        const c2 = await prisma.campaignContract.create({
            data: {
                game_id: testGameId,
                sequence_order: 2,
                title: "Contrato 2 - Conflito",
                objective: "Completar o Ato 2",
                daily_atomic_quest: "",
                progress_percentage: 66,
            },
        });
        contract2Id = c2.id;

        await prisma.campaignContract.create({
            data: {
                game_id: testGameId,
                sequence_order: 3,
                title: "Contrato 3 - Clímax",
                objective: "Derrotar o chefe final",
                daily_atomic_quest: "",
                progress_percentage: 100,
            },
        });
    });

    test.afterEach(async () => {
        // Limpar dados criados nos testes
        if (testGameId) {
            await prisma.campaignContractProgress.deleteMany({
                where: { contract: { game_id: testGameId } },
            });
            await prisma.campaignContract.deleteMany({
                where: { game_id: testGameId },
            });
            await prisma.gameProgress.deleteMany({
                where: { game_id: testGameId },
            });
            await prisma.game.deleteMany({
                where: { id: testGameId },
            });
        }
        if (userAId) {
            await prisma.user.deleteMany({ where: { id: userAId } });
        }
        if (userBId) {
            await prisma.user.deleteMany({ where: { id: userBId } });
        }
    });

    test("ensureUserContractProgress inicializa contratos para novo usuário com ordem 1 AVAILABLE e demais LOCKED", async () => {
        // Usuário A ainda não possui nenhum progresso no banco
        const initialProgresses = await prisma.campaignContractProgress.findMany({
            where: { user_id: userAId, contract: { game_id: testGameId } },
        });
        expect(initialProgresses.length).toBe(0);

        // Chamar ensureUserContractProgress
        await ensureUserContractProgress(userAId, testGameId);

        // Verificar se os 3 progressos foram criados
        const createdProgresses = await prisma.campaignContractProgress.findMany({
            where: { user_id: userAId, contract: { game_id: testGameId } },
            include: { contract: true },
            orderBy: { contract: { sequence_order: "asc" } },
        });

        expect(createdProgresses.length).toBe(3);
        expect(createdProgresses[0].contract.sequence_order).toBe(1);
        expect(createdProgresses[0].status).toBe("AVAILABLE");

        expect(createdProgresses[1].contract.sequence_order).toBe(2);
        expect(createdProgresses[1].status).toBe("LOCKED");

        expect(createdProgresses[2].contract.sequence_order).toBe(3);
        expect(createdProgresses[2].status).toBe("LOCKED");
    });

    test("ensureUserContractProgress é idempotente e não reseta nem duplica progresso existente", async () => {
        await ensureUserContractProgress(userAId, testGameId);

        // Simular que o User A completou o contrato 1 e destravou o contrato 2
        const p1 = await prisma.campaignContractProgress.findUnique({
            where: { user_id_contract_id: { user_id: userAId, contract_id: contract1Id } },
        });
        await prisma.campaignContractProgress.update({
            where: { id: p1!.id },
            data: { status: "COMPLETED" },
        });
        const p2 = await prisma.campaignContractProgress.findUnique({
            where: { user_id_contract_id: { user_id: userAId, contract_id: contract2Id } },
        });
        await prisma.campaignContractProgress.update({
            where: { id: p2!.id },
            data: { status: "AVAILABLE" },
        });

        // Chamar ensureUserContractProgress novamente
        await ensureUserContractProgress(userAId, testGameId);

        const currentProgresses = await prisma.campaignContractProgress.findMany({
            where: { user_id: userAId, contract: { game_id: testGameId } },
            include: { contract: true },
            orderBy: { contract: { sequence_order: "asc" } },
        });

        expect(currentProgresses.length).toBe(3);
        expect(currentProgresses[0].status).toBe("COMPLETED");
        expect(currentProgresses[1].status).toBe("AVAILABLE");
        expect(currentProgresses[2].status).toBe("LOCKED");
    });

    test("Isolamento estrito entre múltiplos usuários: User A avançando não afeta User B", async () => {
        // Inicializar ambos os usuários
        await ensureUserContractProgress(userAId, testGameId);
        await ensureUserContractProgress(userBId, testGameId);

        // User A completa o Contrato 1
        const progressA1 = await prisma.campaignContractProgress.findUnique({
            where: { user_id_contract_id: { user_id: userAId, contract_id: contract1Id } },
        });
        await prisma.campaignContractProgress.update({
            where: { id: progressA1!.id },
            data: { status: "COMPLETED" },
        });
        const progressA2 = await prisma.campaignContractProgress.findUnique({
            where: { user_id_contract_id: { user_id: userAId, contract_id: contract2Id } },
        });
        await prisma.campaignContractProgress.update({
            where: { id: progressA2!.id },
            data: { status: "AVAILABLE" },
        });

        // Buscar contratos e progressos do User A
        const userAProgresses = await prisma.campaignContractProgress.findMany({
            where: { user_id: userAId, contract: { game_id: testGameId } },
            include: { contract: true },
            orderBy: { contract: { sequence_order: "asc" } },
        });
        expect(userAProgresses[0].status).toBe("COMPLETED");
        expect(userAProgresses[1].status).toBe("AVAILABLE");

        // Buscar contratos e progressos do User B (deve permanecer totalmente inalterado)
        const userBProgresses = await prisma.campaignContractProgress.findMany({
            where: { user_id: userBId, contract: { game_id: testGameId } },
            include: { contract: true },
            orderBy: { contract: { sequence_order: "asc" } },
        });
        expect(userBProgresses.length).toBe(3);
        expect(userBProgresses[0].status).toBe("AVAILABLE");
        expect(userBProgresses[1].status).toBe("LOCKED");
        expect(userBProgresses[2].status).toBe("LOCKED");
    });
});
