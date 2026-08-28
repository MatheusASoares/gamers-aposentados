import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

test.describe("Resume Dropped Quest Integration Tests", () => {
    let matheusUser: { id: string; email: string | null; username: string | null };

    test.beforeEach(async () => {
        // Limpar dados de teste
        await prisma.gameProgress.deleteMany({
            where: { game: { title: { startsWith: "ResumeTestGame" } } },
        });
        await prisma.poolEntry.deleteMany({
            where: { game: { title: { startsWith: "ResumeTestGame" } } },
        });
        await prisma.pool.deleteMany({
            where: { entries: { some: { game: { title: { startsWith: "ResumeTestGame" } } } } },
        });
        await prisma.game.deleteMany({
            where: { title: { startsWith: "ResumeTestGame" } },
        });

        // Garantir o usuário oficial Matheus com senha hash conhecida
        const hashedPassword = await bcrypt.hash("testpass123", 10);
        matheusUser = await prisma.user.upsert({
            where: { email: "matheus31also@gmail.com" },
            update: { password: hashedPassword },
            create: {
                username: "matheus_resume_test",
                email: "matheus31also@gmail.com",
                password: hashedPassword,
                name: "Matheus Test",
            },
        });

        // Limpar apenas progressos de jogos de teste
        await prisma.gameProgress.deleteMany({
            where: {
                user_id: matheusUser.id,
                game: { title: { startsWith: "ResumeTestGame" } },
            },
        });
    });

    test("Permite retomar quest com status DROPPED no histórico e mantém porcentagem", async ({ page }) => {
        const game = await prisma.game.create({
            data: {
                title: "ResumeTestGame Guitar Hero",
                quest_type: "MAIN_QUEST",
            },
        });

        // Registrar o jogo como DROPPED com 45% de progresso
        await prisma.gameProgress.create({
            data: {
                user_id: matheusUser.id,
                game_id: game.id,
                status: "DROPPED",
                progress_percentage: 45,
                end_date: new Date("2026-02-10"),
            },
        });

        // Criar uma pool fechada com esse jogo para aparecer no Histórico
        await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                year: new Date().getFullYear(),
                month: 2,
                winner_game_id: game.id,
            },
        });

        // Logar diretamente com o usuário oficial
        await page.goto("/login", { waitUntil: "load" });
        await page.getByLabel("Email").fill("matheus31also@gmail.com");
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // Ir para o Histórico de Quests
        await page.goto("/quests", { waitUntil: "load" });
        await expect(page.locator("body")).toContainText("ResumeTestGame Guitar Hero", { timeout: 15000 });

        // Localizar o botão Retomar Quest
        const resumeBtn = page.getByRole("button", { name: /Retomar Quest/i }).first();
        await expect(resumeBtn).toBeVisible();
        await resumeBtn.click();

        // Aguardar atualização e validar que o status no banco foi alterado para ACTIVE e manteve 45%
        await page.waitForTimeout(1000);

        const updatedProgress = await prisma.gameProgress.findUnique({
            where: {
                user_id_game_id: {
                    user_id: matheusUser.id,
                    game_id: game.id,
                },
            },
        });

        expect(updatedProgress?.status).toBe("ACTIVE");
        expect(updatedProgress?.progress_percentage).toBe(45);
        expect(updatedProgress?.end_date).toBeNull();
        expect(updatedProgress?.start_date).not.toBeNull();
    });

    test("Bloqueia retomar quest dropada se o usuário já tiver outra quest ACTIVE na mesma categoria", async ({ page }) => {
        // Criar jogo 1 atualmente ACTIVE
        const activeGame = await prisma.game.create({
            data: {
                title: "ResumeTestGame Bravery and Greed",
                quest_type: "MAIN_QUEST",
            },
        });
        await prisma.gameProgress.create({
            data: {
                user_id: matheusUser.id,
                game_id: activeGame.id,
                status: "ACTIVE",
                progress_percentage: 20,
            },
        });

        // Criar jogo 2 que foi DROPPED
        const droppedGame = await prisma.game.create({
            data: {
                title: "ResumeTestGame Guitar Hero 3",
                quest_type: "MAIN_QUEST",
            },
        });
        await prisma.gameProgress.create({
            data: {
                user_id: matheusUser.id,
                game_id: droppedGame.id,
                status: "DROPPED",
                progress_percentage: 50,
            },
        });

        // Criar pool fechada para o jogo dropado
        await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                year: new Date().getFullYear(),
                month: 1,
                winner_game_id: droppedGame.id,
            },
        });

        // Login
        await page.goto("/login", { waitUntil: "load" });
        await page.getByLabel("Email").fill("matheus31also@gmail.com");
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // Ir para /quests e tentar clicar em Retomar
        await page.goto("/quests", { waitUntil: "load" });
        await expect(page.locator("body")).toContainText("ResumeTestGame Guitar Hero 3", { timeout: 15000 });

        // Monitorar dialog de alerta
        let dialogMessage = "";
        page.on("dialog", async (dialog) => {
            dialogMessage = dialog.message();
            await dialog.accept();
        });

        const resumeBtn = page.getByRole("button", { name: /Retomar Quest/i }).first();
        await resumeBtn.click();
        await page.waitForTimeout(1000);

        expect(dialogMessage).toContain("já possui a Main Quest");

        // Validar que o status continua DROPPED no banco
        const progress = await prisma.gameProgress.findUnique({
            where: {
                user_id_game_id: {
                    user_id: matheusUser.id,
                    game_id: droppedGame.id,
                },
            },
        });
        expect(progress?.status).toBe("DROPPED");
    });
});
