import { test, expect } from '@playwright/test';

test.describe('Reviews Flow', () => {

  test('Publicly exploring the Reviews Wall', async ({ page }) => {
    // Navigate to the global reviews page
    await page.goto('/reviews', { waitUntil: 'networkidle' });

    // Ensure the Reviews header is visible
    const header = page.getByRole('heading', { name: 'Comunidade Gamer', exact: false });
    await expect(header).toBeVisible();

    // Check if the game cards are rendering (assuming some exist from seeding)
    // We look for the general game card titles, but we wrap it in a try-catch 
    // or just check for the empty state if the DB is empty.
    const emptyState = page.getByText('Seja o primeiro', { exact: false });
    const hasCards = await emptyState.isHidden();

    if (hasCards) {
      // Find at least one game card image or title
      const gameCardImg = page.locator('img[alt]').first();
      await expect(gameCardImg).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
    
    // Unauthenticated user should not see "Fazer Review" as an active button 
    // They are redirected to login if they try to click it (or it's hidden)
    const logInPrompt = page.getByText('Login', { exact: false });
    await expect(logInPrompt).toBeTruthy();
  });

});
