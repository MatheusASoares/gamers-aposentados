import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {

  test('Should show Login Modal on protected route redirects', async ({ page }) => {
    // Navigate and wait for the app to hydrate
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // AuthButtons Component returns a normal Button with text "Entrar"
    const loginBtn = page.getByRole('button', { name: 'Entrar', exact: true }).first();
    
    // Wait up to 5s for the button to appear in the DOM
    await loginBtn.waitFor({ state: 'visible', timeout: 5000 });
    await expect(loginBtn).toBeVisible();

    // Opening Modal
    await loginBtn.click();
    
    // Check if the modal contains expected Auth Title inside Dialog Title
    const modalTitle = page.getByRole('heading', { name: /Login|Entrar/i, level: 2 }).first();
    await modalTitle.waitFor({ state: 'visible', timeout: 5000 });
    await expect(modalTitle).toBeVisible();
  });

  test('Homepage is publicly accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Look for the Dashboard Sidebar main link containing "Gamers Aposentados"
    // sidebar h2 has split text with <br/> inside, so "GamersAposentados" roughly matches the bounding role.
    const brandLink = page.getByRole('link', { name: /Gamers.*Aposentados/i }).first();
    
    await brandLink.waitFor({ state: 'visible', timeout: 5000 });
    await expect(brandLink).toBeVisible();
  });

});
