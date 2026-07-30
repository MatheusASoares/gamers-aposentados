import { test, expect } from "@playwright/test";

test.describe("WCAG Accessibility Input Labels Integration Tests", () => {
    test.beforeEach(async ({ page }) => {
        // Mock IGDB API
        await page.route("**/api/igdb", async (route) => {
            await route.fulfill({ json: [] });
        });

        // Registrar e autenticar usuário de teste para acessar as páginas protegidas
        const timestamp = Date.now();
        const testEmail = `label_tester${timestamp}@test.com`;
        await page.goto("/register", { waitUntil: "load" });
        await page.getByLabel("Username").fill(`lbl${timestamp}`);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Register" }).click();

        await page.waitForURL(/.*\/login/);
        await page.getByLabel("Email").fill(testEmail);
        await page.getByLabel("Password").fill("testpass123");
        await page.getByRole("button", { name: "Log in" }).click();
        await expect(page.locator("body")).toContainText("Quest", { timeout: 15000 });
    });

    test("Randomizer game autocomplete input has accessible label", async ({ page }) => {
        await page.goto("/randomizer", { waitUntil: "load" });

        // Abrir modal ou modo de adição de jogo para renderizar o autocomplete
        const addBtn = page.getByRole("button", { name: "+ ADD GAME" }).first();
        await addBtn.click();

        // Validar que o input do autocomplete possui o nome acessível configurado por aria-label
        const autocompleteInput = page.getByRole("textbox", {
            name: "Buscar jogo no banco de dados IGDB",
        });
        await expect(autocompleteInput).toBeVisible();
    });

    test("Reviews page search input has accessible label", async ({ page }) => {
        await page.goto("/reviews", { waitUntil: "load" });

        const searchInput = page.getByRole("textbox", {
            name: "Buscar por jogo, usuário ou palavra-chave",
        });
        await expect(searchInput).toBeVisible();
    });
});
