import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await page.goto('/login');

    // Vérifier que les champs de connexion sont présents
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByLabel(/mot de passe|password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('devrait afficher un lien vers l\'inscription', async ({ page }) => {
    await page.goto('/login');

    // Vérifier qu'il y a un lien vers la page d'inscription
    const registerLink = page.getByRole('link', { name: /inscription|s'inscrire|créer un compte/i });
    await expect(registerLink).toBeVisible();
  });

  test('devrait valider les champs obligatoires', async ({ page }) => {
    await page.goto('/login');

    // Essayer de soumettre le formulaire vide
    const submitButton = page.getByRole('button', { name: /connexion|se connecter/i });
    await submitButton.click();

    // Vérifier que la validation HTML5 empêche la soumission
    // ou qu'un message d'erreur s'affiche
    const emailInput = page.getByRole('textbox', { name: /email/i });
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });

    expect(isInvalid).toBe(true);
  });
});
