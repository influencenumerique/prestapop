# Tests Playwright - PrestaPop

Ce dossier contient les tests end-to-end (E2E) pour PrestaPop utilisant Playwright.

## Installation

Playwright est déjà installé dans le projet. Si vous devez réinstaller les navigateurs :

```bash
npx playwright install
```

## Commandes disponibles

```bash
# Lancer tous les tests en mode headless
npm test

# Lancer les tests en mode UI (interface interactive)
npm run test:ui

# Lancer les tests avec les navigateurs visibles
npm run test:headed

# Lancer les tests en mode debug
npm run test:debug

# Voir le rapport HTML des derniers tests
npm run test:report
```

## Structure des tests

- `homepage.spec.ts` - Tests de la page d'accueil
- `auth.spec.ts` - Tests d'authentification (connexion/inscription)

## Configuration

La configuration se trouve dans `playwright.config.ts` à la racine du projet.

### Points clés de configuration :

- **Base URL** : `http://localhost:3000`
- **Serveur web** : Démarre automatiquement `npm run dev` avant les tests
- **Navigateurs testés** : Chromium, Firefox, WebKit (Desktop et Mobile)
- **Rapports** : HTML (consultable avec `npm run test:report`)

## Bonnes pratiques

1. **Utiliser les sélecteurs par rôle ARIA** : Privilégiez `getByRole()`, `getByLabel()`, etc.
2. **Attendre les éléments** : Utilisez `await expect(element).toBeVisible()` plutôt que des timeouts fixes
3. **Tester le comportement utilisateur** : Simulez de vraies interactions (clics, saisie, navigation)
4. **Isoler les tests** : Chaque test doit être indépendant et ne pas dépendre d'un état partagé

## Exemples de tests

### Test simple de navigation

```typescript
test('devrait naviguer vers la page des jobs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /missions/i }).click();
  await expect(page).toHaveURL(/\/jobs/);
});
```

### Test de formulaire

```typescript
test('devrait soumettre le formulaire de connexion', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
  await page.getByLabel(/mot de passe/i).fill('password123');
  await page.getByRole('button', { name: /connexion/i }).click();

  await expect(page).toHaveURL('/dashboard');
});
```

## Ressources

- [Documentation Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
