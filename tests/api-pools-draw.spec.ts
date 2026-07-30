import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("API Pools Draw Action Integration Tests", () => {
    let testUserId1: string;
    let testUserId2: string;

    test.beforeEach(async () => {
        // 1. Limpar pools, entradas, jogos e progressos de teste
        await prisma.gameProgress.deleteMany({
            where: { game: { title: { startsWith: "ApiTestGame" } } },
        });
        await prisma.poolEntry.deleteMany({
            where: { game: { title: { startsWith: "ApiTestGame" } } },
        });
        await prisma.pool.deleteMany({
            where: { entries: { some: { game: { title: { startsWith: "ApiTestGame" } } } } },
        });
        await prisma.game.deleteMany({
            where: { title: { startsWith: "ApiTestGame" } },
        });

        // 2. Garantir a existência dos usuários oficiais para o sorteio
        const user1 = await prisma.user.upsert({
            where: { email: "matheus31also@gmail.com" },
            update: {},
            create: {
                username: "matheus_api_test",
                email: "matheus31also@gmail.com",
            },
        });
        testUserId1 = user1.id;

        const user2 = await prisma.user.upsert({
            where: { email: "lucasedu17gomes@gmail.com" },
            update: {},
            create: {
                username: "lucas_api_test",
                email: "lucasedu17gomes@gmail.com",
            },
        });
        testUserId2 = user2.id;
    });

    test("PUT /api/pools (action === 'draw') encerra o pote, define vencedor e atualiza GameProgress", async ({ page }) => {
        // Criar 4 jogos de teste para compor um pote MAIN_QUEST completo (2 por pessoa)
        const game1 = await prisma.game.create({
            data: { title: "ApiTestGame 1", quest_type: "MAIN_QUEST" },
        });
        const game2 = await prisma.game.create({
            data: { title: "ApiTestGame 2", quest_type: "MAIN_QUEST" },
        });
        const game3 = await prisma.game.create({
            data: { title: "ApiTestGame 3", quest_type: "MAIN_QUEST" },
        });
        const game4 = await prisma.game.create({
            data: { title: "ApiTestGame 4", quest_type: "MAIN_QUEST" },
        });

        // Criar pote aberto
        const pool = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "OPEN",
                entries: {
                    create: [
                        { game_id: game1.id, user_id: testUserId1 },
                        { game_id: game2.id, user_id: testUserId1 },
                        { game_id: game3.id, user_id: testUserId2 },
                        { game_id: game4.id, user_id: testUserId2 },
                    ],
                },
            },
        });

        // Registrar e autenticar sessão para a rota da API
        const timestamp = Date.now();
        const testEmail = `draw_tester${timestamp}@test.com`;
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`tester${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // Executar a requisição API PUT /api/pools com action === "draw" através do contexto de página autenticada
        const response = await page.request.put("/api/pools", {
            data: {
                id: pool.id,
                action: "draw",
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.winnerId).toBeDefined();

        // Validar no banco de dados
        const updatedPool = await prisma.pool.findUnique({
            where: { id: pool.id },
        });
        expect(updatedPool?.status).toBe("CLOSED");
        expect(updatedPool?.winner_game_id).toBe(body.winnerId);
        expect(updatedPool?.month).toBe(new Date().getMonth() + 1);
        expect(updatedPool?.year).toBe(new Date().getFullYear());

        // Verificar que GameProgress foi ativado para o vencedor em status ACTIVE
        const winnerProgress = await prisma.gameProgress.findMany({
            where: { game_id: body.winnerId },
        });
        expect(winnerProgress.length).toBeGreaterThan(0);
        expect(winnerProgress.some((p) => p.status === "ACTIVE")).toBe(true);
    });

    test("PUT /api/pools (action === 'draw') em pote já CLOSED retorna erro 400", async ({ page }) => {
        const game1 = await prisma.game.create({
            data: { title: "ApiTestGame Closed 1", quest_type: "MAIN_QUEST" },
        });

        const pool = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "CLOSED",
                winner_game_id: game1.id,
            },
        });

        const timestamp = Date.now();
        const testEmail = `draw_tester${timestamp}@test.com`;
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`tester${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        const response = await page.request.put("/api/pools", {
            data: {
                id: pool.id,
                action: "draw",
            },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toContain("Pool já foi sorteada ou fechada");
    });

    test("PUT /api/pools (action === 'draw') em pote incompleto retorna erro 400", async ({ page }) => {
        const game1 = await prisma.game.create({
            data: { title: "ApiTestGame Incomplete 1", quest_type: "MAIN_QUEST" },
        });

        const pool = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "OPEN",
                entries: {
                    create: [{ game_id: game1.id, user_id: testUserId1 }],
                },
            },
        });

        const timestamp = Date.now();
        const testEmail = `draw_tester${timestamp}@test.com`;
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`tester${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        const response = await page.request.put("/api/pools", {
            data: {
                id: pool.id,
                action: "draw",
            },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toContain("Pool incompleta");
    });
});
