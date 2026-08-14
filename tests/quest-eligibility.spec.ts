import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { RANDOMIZER_PLAYER_EMAILS } from "../src/lib/randomizer-players";

test.describe("Quest Eligibility and Concurrency Rules", () => {
    test.beforeEach(async () => {
        // Limpar progressos de teste de execuções anteriores, se houver
        await prisma.gameProgress.deleteMany({
            where: {
                game: {
                    title: { startsWith: "Test Game Eligibility" },
                },
            },
        });
        await prisma.game.deleteMany({
            where: {
                title: { startsWith: "Test Game Eligibility" },
            },
        });
    });

    test("Should reject adding a game that is COMPLETED by at least one official player", async ({ page }) => {
        // 1. Criar jogo de teste no banco
        const title = "Test Game Eligibility Completed";
        const game = await prisma.game.create({
            data: {
                title,
                quest_type: "SIDE_QUEST",
            },
        });

        // 2. Garantir que o usuário oficial Matheus exista
        const matheusEmail = RANDOMIZER_PLAYER_EMAILS[0];
        const matheusUser = await prisma.user.upsert({
            where: { email: matheusEmail },
            update: {},
            create: {
                email: matheusEmail,
                username: "matheus_test",
                name: "Matheus Test",
            },
        });

        // 3. Registrar o progresso como COMPLETED para o Matheus
        await prisma.gameProgress.create({
            data: {
                user_id: matheusUser.id,
                game_id: game.id,
                status: "COMPLETED",
                progress_percentage: 100,
            },
        });

        // 4. Mock da API IGDB para retornar o jogo de teste
        await page.route("**/api/igdb", async (route) => {
            const json = [
                {
                    id: "igdb-completed-test",
                    nome: title,
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co496b.jpg",
                },
            ];
            await route.fulfill({ json });
        });

        // 5. Registrar e logar um usuário com email terminando em @test.com via UI
        const timestamp = Date.now();
        const testUserEmail = `tester${timestamp}@test.com`;

        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`tester${timestamp}`);
        await page.getByLabel("Email").fill(testUserEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testUserEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // 6. Navegar para o Randomizer e tentar adicionar o jogo
        await page.goto("/randomizer", { waitUntil: "load" });
        const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
        await addBtn.click();

        const input = page.locator('input[placeholder*="IGDB"]');
        await input.fill("Test Game Eligibility");
        await page.waitForResponse("**/api/igdb");

        const suggestion = page.locator(`button:has-text("${title}")`).first();
        await suggestion.click();
        await page.waitForTimeout(500);

        // Salvar seleções e esperar a resposta com erro
        const saveBtn = page.getByRole("button", { name: /Salvar Seleções/i });
        await saveBtn.click();

        // Validar que o toast de erro com a mensagem de bloqueio é exibido
        await expect(page.locator("body")).toContainText("Este jogo já foi completado", { timeout: 15000 });
    });

    test("Should ALLOW adding a game that was previously only SUGGESTED in the database", async ({ page }) => {
        // 1. Criar jogo de teste no banco
        const title = "Test Game Eligibility Suggested";
        const game = await prisma.game.create({
            data: {
                title,
                quest_type: "SIDE_QUEST",
            },
        });

        // 2. Garantir que os usuários oficiais existam
        for (const email of RANDOMIZER_PLAYER_EMAILS) {
            const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    username: email.split("@")[0],
                    name: email.split("@")[0],
                },
            });

            // Registrar progresso como SUGGESTED (ex: após um sorteio anterior onde ele não ganhou)
            await prisma.gameProgress.create({
                data: {
                    user_id: user.id,
                    game_id: game.id,
                    status: "SUGGESTED",
                    progress_percentage: 0,
                },
            });
        }

        // 3. Mock da API IGDB
        await page.route("**/api/igdb", async (route) => {
            const json = [
                {
                    id: "igdb-suggested-test",
                    nome: title,
                    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co496b.jpg",
                },
            ];
            await route.fulfill({ json });
        });

        // 4. Registrar e logar usuário tester
        const timestamp = Date.now();
        const testUserEmail = `tester${timestamp}@test.com`;

        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`tester${timestamp}`);
        await page.getByLabel("Email").fill(testUserEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testUserEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });

        // 5. Adicionar o jogo no pote
        await page.goto("/randomizer", { waitUntil: "load" });
        const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
        await addBtn.click();

        const input = page.locator('input[placeholder*="IGDB"]');
        await input.fill("Test Game Eligibility Suggested");
        await page.waitForResponse("**/api/igdb");

        const suggestion = page.locator(`button:has-text("${title}")`).first();
        await suggestion.click();
        await page.waitForTimeout(500);

        // Salvar seleções e verificar que NÃO dá erro de progresso registrado
        const saveBtn = page.getByRole("button", { name: /Salvar Seleções/i });
        await saveBtn.click();

        await expect(page.locator("body")).not.toContainText("Este jogo possui progresso registrado", { timeout: 10000 });
    });
});
