import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil PrestaPop', () => {
  test('devrait charger la page d\'accueil', async ({ page }) => {
    await page.goto('/');

    // Vérifier que la page se charge correctement
    await expect(page).toHaveTitle(/PrestaPop/i);
  });

  test('devrait afficher le lien vers la page des missions', async ({ page }) => {
    await page.goto('/');

    // Vérifier qu'il y a un lien vers /jobs
    const jobsLink = page.getByRole('link', { name: /missions/i });
    await expect(jobsLink).toBeVisible();
  });

  test('devrait permettre de naviguer vers la page de connexion', async ({ page }) => {
    await page.goto('/');

    // Cliquer sur le bouton de connexion
    const loginButton = page.getByRole('link', { name: /connexion|se connecter/i });
    await loginButton.click();

    // Vérifier qu'on est sur la page de connexion
    await expect(page).toHaveURL(/\/login/);
  });
});
