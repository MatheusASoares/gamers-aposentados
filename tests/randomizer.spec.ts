import { test, expect } from '@playwright/test';

test.describe('Randomizer Flow', () => {

  test('Adding games and rolling the dice', async ({ page }) => {
    // Navigate to randomizer route
    await page.goto('/randomizer', { waitUntil: 'networkidle' });

    // Validate page loaded
    const pageTitle = page.getByRole('heading', { name: /O que vamos jogar/i });
    await expect(pageTitle).toBeVisible();

    // 1. Add Games Flow
    const inputField = page.getByPlaceholder('Ex: The Witcher 3...');
    const addBtn = page.getByRole('button', { name: 'Add' });

    await inputField.fill('Elden Ring');
    await addBtn.click();
    
    await inputField.fill('Stardew Valley');
    await addBtn.click();

    await inputField.fill('Dark Souls');
    await addBtn.click();

    // We should see three games in the candidate pool list items
    const eldenRing = page.getByText('Elden Ring', { exact: true });
    await expect(eldenRing).toBeVisible();

    // 2. Roll the Dice
    const rollBtn = page.getByRole('button', { name: /Roll the Dice/i });
    await rollBtn.click();

    // Ensure state locks effectively and UI feedback spins
    await expect(rollBtn).toBeDisabled();
    
    // Wait for the resulting Winner modal or heading
    const winnerHeading = page.locator('h3:has-text("WINNER")').first();
    await winnerHeading.waitFor({ state: 'visible', timeout: 5000 });
    await expect(winnerHeading).toBeVisible();
    
    // Buttons for "Salvar como Favorito" should appear underneath
    const saveBtn = page.getByRole('button', { name: /Save as Favorite/i });
    await expect(saveBtn).toBeVisible();
  });

});
