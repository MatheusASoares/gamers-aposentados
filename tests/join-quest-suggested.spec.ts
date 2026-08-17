import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { RANDOMIZER_PLAYER_EMAILS } from "../src/lib/randomizer-players";
import bcrypt from "bcryptjs";

test.describe("Join Quest - SUGGESTED and Eligibility Status Transitions", () => {
    let testUserEmail: string;
    let testUserId: string;

    test.beforeEach(async () => {
        // 1. Limpar progressos e jogos de teste anteriores
        await prisma.gameProgress.deleteMany({
            where: { game: { title: { startsWith: "Test Game Join" } } },
        });
        await prisma.poolEntry.deleteMany({
            where: { game: { title: { startsWith: "Test Game Join" } } },
        });
        await prisma.pool.deleteMany({
            where: { winner_game: { title: { startsWith: "Test Game Join" } } },
        });
        await prisma.game.deleteMany({
            where: { title: { startsWith: "Test Game Join" } },
        });

        // 2. Criar usuário de teste
        const timestamp = Date.now();
        testUserEmail = `join_tester_${timestamp}@test.com`;
        const hashedPassword = await bcrypt.hash("testpass123", 10);

        const user = await prisma.user.create({
            data: {
                username: `jointester_${timestamp}`,
                email: testUserEmail,
                password: hashedPassword,
                name: "Join Tester",
            },
        });
        testUserId = user.id;

        // Garantir que os jogadores oficiais existam
        for (const email of RANDOMIZER_PLAYER_EMAILS) {
            await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    username: email.split("@")[0],
                    name: email.split("@")[0],
                },
            });
        }
    });

    test("Should ALLOW a user with SUGGESTED status to click 'Entrar na Quest' and transition to ACTIVE", async ({ page }) => {
        const title = "Test Game Join Suggested";

        // 1. Criar o jogo de teste
        const game = await prisma.game.create({
            data: {
                title,
                quest_type: "MAIN_QUEST",
                hltb_time: 15,
            },
        });

        // 2. Criar um Pool com este jogo como winner_game ativo
        await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                winner_game_id: game.id,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
            },
        });

        // 3. Criar registro inicial de GameProgress como SUGGESTED para o usuário
        const initialProgress = await prisma.gameProgress.create({
            data: {
                user_id: testUserId,
                game_id: game.id,
                status: "SUGGESTED",
                progress_percentage: 0,
            },
        });

        expect(initialProgress.status).toBe("SUGGESTED");

        // 4. Logar com o usuário de teste
        await page.goto("/login", { waitUntil: "load" });
        await page.getByLabel("Email").fill(testUserEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // 5. Na Dashboard, deve exibir o jogo e o botão 'Entrar na Quest'
        await page.goto("/", { waitUntil: "load" });
        await expect(page.locator("body")).toContainText(title, { timeout: 10000 });

        // Encontrar o botão 'Entrar na Quest'
        const joinButton = page.getByRole("button", { name: "Entrar na Quest" }).first();
        await expect(joinButton).toBeVisible();

        // 6. Clicar no botão 'Entrar na Quest'
        await joinButton.click();

        // 7. Validar que o progresso no banco de dados agora é ACTIVE
        await expect(async () => {
            const updated = await prisma.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: testUserId,
                        game_id: game.id,
                    },
                },
            });
            expect(updated?.status).toBe("ACTIVE");
            expect(updated?.start_date).not.toBeNull();
        }).toPass({ timeout: 10000 });

        // A página deve atualizar e mostrar a barra de progresso em vez do botão
        await expect(page.getByText("Progresso Atual")).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole("button", { name: "ATUALIZAR PROGRESSO" })).toBeVisible({ timeout: 10000 });
    });

    test("Should ALLOW a user with NO prior progress record to click 'Entrar na Quest' and create ACTIVE progress", async ({ page }) => {
        const title = "Test Game Join Clean";

        // 1. Criar o jogo de teste
        const game = await prisma.game.create({
            data: {
                title,
                quest_type: "MAIN_QUEST",
                hltb_time: 20,
            },
        });

        // 2. Criar um Pool com este jogo como winner_game ativo
        await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                winner_game_id: game.id,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
            },
        });

        // 3. Logar com o usuário de teste (sem nenhum progresso prévio registrado)
        await page.goto("/login", { waitUntil: "load" });
        await page.getByLabel("Email").fill(testUserEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // 4. Na Dashboard, verificar botão 'Entrar na Quest'
        await page.goto("/", { waitUntil: "load" });
        await expect(page.locator("body")).toContainText(title, { timeout: 10000 });

        const joinButton = page.getByRole("button", { name: "Entrar na Quest" }).first();
        await expect(joinButton).toBeVisible();

        // 5. Clicar em 'Entrar na Quest'
        await joinButton.click();

        // 6. Validar que o registro ACTIVE foi criado no banco
        await expect(async () => {
            const created = await prisma.gameProgress.findUnique({
                where: {
                    user_id_game_id: {
                        user_id: testUserId,
                        game_id: game.id,
                    },
                },
            });
            expect(created?.status).toBe("ACTIVE");
            expect(created?.progress_percentage).toBe(0);
        }).toPass({ timeout: 10000 });

        // Verificar atualização visual na dashboard
        await expect(page.getByText("Progresso Atual")).toBeVisible({ timeout: 10000 });
    });
});
