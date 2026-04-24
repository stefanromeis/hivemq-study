import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the app name and a dashboard link (EN default)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'HiveMQ Study' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('switches to German via /de prefix', async ({ page }) => {
    await page.goto('/de');
    await expect(page.getByText(/Microfrontend-ready/i)).toBeVisible();
  });
});
