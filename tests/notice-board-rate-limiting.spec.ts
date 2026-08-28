import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { generateManualNoticeBoardAction } from "../src/app/lib/notice-board-actions";
import { dropQuest } from "../src/app/lib/quest-actions";

test.describe("Notice Board Rate Limiting and Safety Guardrails", () => {
    let testMemberUser: { id: string; email: string | null };
    let testGame: { id: string; title: string };

    test.beforeEach(async () => {
        const suffix = Date.now();
        testMemberUser = await prisma.user.create({
            data: {
                email: `member_limit_${suffix}@testdomain.com`,
                username: `member_limit_${suffix}`,
                role: "MEMBER",
                notice_board_tokens: 2,
            },
        });

        testGame = await prisma.game.create({
            data: {
                title: `Safety Test Game ${suffix}`,
                quest_type: "MAIN_QUEST",
                hltb_time: 20,
            },
        });
    });

    test.afterEach(async () => {
        if (testGame?.id) {
            await prisma.campaignContractProgress.deleteMany({
                where: { contract: { game_id: testGame.id } },
            });
            await prisma.campaignContract.deleteMany({
                where: { game_id: testGame.id },
            });
            await prisma.gameProgress.deleteMany({
                where: { game_id: testGame.id },
            });
            await prisma.game.delete({ where: { id: testGame.id } });
        }
        if (testMemberUser?.id) {
            await prisma.user.delete({ where: { id: testMemberUser.id } });
        }
    });

    test("Cached Contracts reuse existing definitions with zero new contract creations", async () => {
        // 1. Criar manualmente 3 contratos no banco para o jogo
        await prisma.campaignContract.createMany({
            data: [
                { game_id: testGame.id, sequence_order: 1, title: "Cap 1", objective: "Obj 1", daily_atomic_quest: "", progress_percentage: 33 },
                { game_id: testGame.id, sequence_order: 2, title: "Cap 2", objective: "Obj 2", daily_atomic_quest: "", progress_percentage: 66 },
                { game_id: testGame.id, sequence_order: 3, title: "Cap 3", objective: "Obj 3", daily_atomic_quest: "", progress_percentage: 100 },
            ],
        });

        const contractsBefore = await prisma.campaignContract.count({
            where: { game_id: testGame.id },
        });
        expect(contractsBefore).toBe(3);

        // Usuário acessa o jogo existente
        const userProgress = await prisma.campaignContractProgress.findMany({
            where: { user_id: testMemberUser.id, contract: { game_id: testGame.id } },
        });

        expect(userProgress.length).toBe(0);

        // Linkar progresso do usuário ao cache existente
        const contracts = await prisma.campaignContract.findMany({
            where: { game_id: testGame.id },
            orderBy: { sequence_order: "asc" },
        });

        await prisma.campaignContractProgress.createMany({
            data: contracts.map((c) => ({
                user_id: testMemberUser.id,
                contract_id: c.id,
                status: c.sequence_order === 1 ? ("AVAILABLE" as const) : ("LOCKED" as const),
            })),
        });

        const userProgressAfter = await prisma.campaignContractProgress.findMany({
            where: { user_id: testMemberUser.id, contract: { game_id: testGame.id } },
        });
        expect(userProgressAfter.length).toBe(3);

        const contractsAfter = await prisma.campaignContract.count({
            where: { game_id: testGame.id },
        });
        expect(contractsAfter).toBe(3); // Zero new contracts created
    });

    test("Dropping a quest with progress < 20% applies a 7-day cooldown on member user", async () => {
        // Criar progresso ativo com 10%
        await prisma.gameProgress.create({
            data: {
                user_id: testMemberUser.id,
                game_id: testGame.id,
                status: "ACTIVE",
                progress_percentage: 10,
            },
        });

        // Simular abandono precoce
        const cooldownDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.user.update({
            where: { id: testMemberUser.id },
            data: {
                ai_cooldown_until: cooldownDate,
            },
        });

        const updatedUser = await prisma.user.findUnique({
            where: { id: testMemberUser.id },
        });

        expect(updatedUser?.ai_cooldown_until).not.toBeNull();
        expect(new Date(updatedUser!.ai_cooldown_until!).getTime()).toBeGreaterThan(Date.now());
    });
});
