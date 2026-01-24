# Serveur MCP Playwright - Guide d'utilisation

Le serveur MCP (Model Context Protocol) Playwright permet à Claude Code d'interagir directement avec votre application web via Playwright pendant les conversations.

## Configuration

Le serveur MCP Playwright a été configuré dans votre projet PrestaPop. La configuration se trouve dans `~/.claude.json`.

## Activation

**IMPORTANT** : Pour activer le serveur MCP, vous devez **redémarrer Claude Code**.

1. Tapez `Ctrl+C` ou `Cmd+C` pour quitter Claude Code
2. Relancez Claude Code avec `claude`
3. Le serveur MCP Playwright sera maintenant disponible

## Vérification

Pour vérifier que le serveur MCP est actif, tapez :

```bash
/mcp
```

Vous devriez voir le serveur `playwright` dans la liste.

## Capacités du serveur MCP Playwright

Une fois activé, Claude pourra :

1. **Naviguer sur votre application**
   - Ouvrir des pages (`goto`)
   - Cliquer sur des éléments
   - Remplir des formulaires

2. **Extraire des informations**
   - Lire le contenu de la page
   - Récupérer des snapshots de l'arbre d'accessibilité
   - Analyser la structure DOM

3. **Prendre des captures d'écran**
   - Screenshots de la page complète
   - Screenshots d'éléments spécifiques

4. **Tester des interactions**
   - Vérifier que des éléments sont visibles
   - Valider le comportement de l'UI
   - Déboguer des problèmes frontend

## Exemples d'utilisation

### Navigation simple

```
User: Va sur la page d'accueil et dis-moi ce que tu vois
Claude: [utilise le serveur MCP pour ouvrir http://localhost:3000 et analyser le contenu]
```

### Test d'un formulaire

```
User: Teste le formulaire de connexion sur /login
Claude: [utilise MCP pour naviguer, remplir et soumettre le formulaire]
```

### Débogage

```
User: Prends une capture d'écran de la page /dashboard
Claude: [utilise MCP pour naviguer et capturer l'écran]
```

## Différence avec Playwright classique

| Playwright classique | MCP Playwright |
|---------------------|----------------|
| Tests automatisés scriptés | Interaction via conversation avec Claude |
| `npm test` | Demandes en langage naturel |
| Code dans `tests/` | Pas de code à écrire |
| CI/CD automation | Développement interactif |

## Utilisation conjointe

Vous pouvez utiliser **les deux** :

- **Playwright classique** (`npm test`) : Pour vos tests automatisés en CI/CD
- **MCP Playwright** : Pour l'exploration interactive, le débogage et les tests manuels guidés par Claude

## Ressources

- [Documentation officielle @playwright/mcp](https://www.npmjs.com/package/@playwright/mcp)
- [GitHub microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP Guide complet](https://testdino.com/blog/playwright-mcp/)

## Dépannage

Si le serveur MCP ne démarre pas :

1. Vérifiez que le package est installé : `npm ls @playwright/mcp`
2. Vérifiez la configuration dans `~/.claude.json`
3. Redémarrez complètement Claude Code
4. Consultez les logs avec `/doctor`

## Avantages pour PrestaPop

Avec le serveur MCP Playwright, vous pouvez :

- Tester rapidement les flows utilisateur (inscription, création de mission, paiement)
- Déboguer les problèmes d'UI en temps réel
- Valider le comportement des différents rôles (COMPANY, DRIVER, ADMIN)
- Vérifier l'accessibilité de votre application
- Générer automatiquement des scénarios de test
