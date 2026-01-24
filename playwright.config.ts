import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour PrestaPop
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Exécuter les tests en parallèle */
  fullyParallel: true,

  /* Échouer le build en CI si vous laissez accidentellement test.only */
  forbidOnly: !!process.env.CI,

  /* Réessayer uniquement en CI */
  retries: process.env.CI ? 2 : 0,

  /* Reporter à utiliser */
  reporter: 'html',

  /* Configuration partagée pour tous les projets */
  use: {
    /* URL de base pour utiliser des chemins relatifs lors des navigations, par ex. `await page.goto('/')` */
    baseURL: 'http://localhost:3000',

    /* Collecter des traces lors de la première tentative échouée */
    trace: 'on-first-retry',

    /* Capturer une capture d'écran uniquement lors de l'échec */
    screenshot: 'only-on-failure',
  },

  /* Configuration pour le serveur de développement web */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Configuration des différents navigateurs pour les tests */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Tests sur mobile */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
