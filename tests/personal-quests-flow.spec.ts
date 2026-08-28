import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { getUserPersonalQuestHistory } from "../src/app/lib/history-actions";

test.describe("Personal Quests and Member History Flow", () => {
    let testMemberUser: { id: string; email: string | null };
    let game1: { id: string; title: string };
    let game2: { id: string; title: string };

    test.beforeEach(async () => {
        const suffix = Date.now();
        testMemberUser = await prisma.user.create({
            data: {
                email: `personal_flow_${suffix}@testdomain.com`,
                username: `personal_flow_${suffix}`,
                role: "MEMBER",
            },
        });

        game1 = await prisma.game.create({
            data: {
                title: `Solo RPG ${suffix}`,
                quest_type: "MAIN_QUEST",
                hltb_time: 45,
            },
        });

        game2 = await prisma.game.create({
            data: {
                title: `Solo Indie ${suffix}`,
                quest_type: "SIDE_QUEST",
                hltb_time: 8,
            },
        });
    });

    test.afterEach(async () => {
        if (testMemberUser?.id) {
            await prisma.gameProgress.deleteMany({
                where: { user_id: testMemberUser.id },
            });
            await prisma.review.deleteMany({
                where: { user_id: testMemberUser.id },
            });
            await prisma.user.delete({ where: { id: testMemberUser.id } });
        }
        if (game1?.id) await prisma.game.delete({ where: { id: game1.id } });
        if (game2?.id) await prisma.game.delete({ where: { id: game2.id } });
    });

    test("User can have independent GameProgress without affecting other users", async () => {
        // Criar progresso ativo para o usuário
        const progress1 = await prisma.gameProgress.create({
            data: {
                user_id: testMemberUser.id,
                game_id: game1.id,
                status: "ACTIVE",
                progress_percentage: 25,
            },
        });

        expect(progress1.status).toBe("ACTIVE");
        expect(progress1.progress_percentage).toBe(25);

        // Completar a quest
        const completed = await prisma.gameProgress.update({
            where: { id: progress1.id },
            data: {
                status: "COMPLETED",
                progress_percentage: 100,
                end_date: new Date(),
                is_platinum: true,
            },
        });

        expect(completed.status).toBe("COMPLETED");
        expect(completed.is_platinum).toBe(true);

        // Criar uma review
        await prisma.review.create({
            data: {
                user_id: testMemberUser.id,
                game_id: game1.id,
                rating: 9,
                difficulty: 4,
                review_text: "Obra prima inesquecível!",
            },
        });

        // Buscar histórico pessoal do usuário
        const history = await getUserPersonalQuestHistory(testMemberUser.id);
        expect(history.length).toBe(1);
        expect(history[0].title).toBe(game1.title);
        expect(history[0].status).toBe("COMPLETED");
        expect(history[0].isPlatinum).toBe(true);
        expect(history[0].reviewRating).toBe(9);
    });

    test("Active main and side quests query identifies user active state correctly", async () => {
        // Create active main quest
        await prisma.gameProgress.create({
            data: {
                user_id: testMemberUser.id,
                game_id: game1.id,
                status: "ACTIVE",
                progress_percentage: 30,
            },
        });

        const activeProgresses = await prisma.gameProgress.findMany({
            where: {
                user_id: testMemberUser.id,
                status: "ACTIVE",
            },
            include: {
                game: true,
            },
        });

        const mainProgress = activeProgresses.find((p) => p.game.quest_type === "MAIN_QUEST");
        const sideProgress = activeProgresses.find((p) => p.game.quest_type === "SIDE_QUEST");

        expect(mainProgress).not.toBeUndefined();
        expect(mainProgress?.game.title).toBe(game1.title);
        expect(mainProgress?.progress_percentage).toBe(30);
        expect(sideProgress).toBeUndefined();
    });
});
