# Guide de test manuel - Boutons "Annuler" et "Voir les candidatures"

## Prérequis

Vous devez avoir dans votre base de données:
1. Au moins un compte COMPANY (entreprise)
2. Au moins un compte DRIVER (chauffeur)
3. Au moins une mission créée par l'entreprise

## Scénario 1: Annuler une mission

### Étape 1 - Connexion en tant qu'entreprise
1. Se connecter avec un compte entreprise
2. Naviguer vers le dashboard entreprise

### Étape 2 - Créer/Ouvrir une mission
1. Option A: Créer une nouvelle mission
   - Aller sur "Créer une mission"
   - Remplir le formulaire
   - Publier la mission (status = OPEN)

2. Option B: Ouvrir une mission existante
   - Aller dans la liste des missions
   - Cliquer sur une mission en statut OPEN

### Étape 3 - Vérifier l'affichage du bouton "Annuler"
1. Sur la page de détail de la mission (`/jobs/[id]`)
2. Dans la sidebar droite, vérifier la présence du bouton rouge "Annuler cette mission"
3. Le bouton doit avoir l'icône XCircle

### Étape 4 - Tester l'annulation
1. Cliquer sur "Annuler cette mission"
2. **Vérifier:** Une modale de confirmation s'ouvre
3. **Vérifier:** Le titre est "Annuler cette mission"
4. **Vérifier:** Le message explique que l'action est irréversible
5. Cliquer sur "Retour" pour annuler
6. **Vérifier:** La modale se ferme sans action
7. Cliquer à nouveau sur "Annuler cette mission"
8. Cliquer sur "Confirmer l'annulation"
9. **Vérifier:** Toast de chargement "Annulation de la mission..."
10. **Vérifier:** Spinner sur le bouton de confirmation
11. **Vérifier:** Toast de succès "Mission annulée avec succès"
12. **Vérifier:** La page se rafraîchit automatiquement
13. **Vérifier:** Le badge de statut affiche maintenant "Annulée" (rouge)
14. **Vérifier:** Le bouton "Annuler" n'apparaît plus

### Étape 5 - Vérifier les restrictions
1. Essayer d'annuler une mission en statut ASSIGNED
   - **Attendu:** Le bouton "Annuler" ne doit pas apparaître
2. Essayer d'annuler une mission en statut COMPLETED
   - **Attendu:** Le bouton "Annuler" ne doit pas apparaître

---

## Scénario 2: Voir et accepter des candidatures

### Étape 1 - Préparer une mission avec candidatures

#### A. En tant qu'entreprise
1. Se connecter avec le compte entreprise
2. Créer une nouvelle mission ou utiliser une mission OPEN existante
3. Noter l'ID de la mission

#### B. En tant que chauffeur
1. Se déconnecter
2. Se connecter avec un compte chauffeur
3. Naviguer vers la mission créée (`/jobs/[id]`)
4. Cliquer sur "Postuler à cette mission"
5. Remplir les informations de candidature
6. Confirmer la candidature
7. Se déconnecter

#### C. Optionnel: Créer plusieurs candidatures
1. Répéter l'étape B avec d'autres comptes chauffeurs
2. Objectif: avoir 2-3 candidatures pour la même mission

### Étape 2 - Vérifier l'affichage du bouton "Voir les candidatures"
1. Se reconnecter avec le compte entreprise
2. Naviguer vers la mission avec candidatures
3. Dans la sidebar droite, vérifier:
   - Bouton "Voir les candidatures" avec icône Users
   - Texte "X candidature(s) reçue(s)"
   - Bouton "Annuler cette mission" en dessous

### Étape 3 - Ouvrir la liste des candidatures
1. Cliquer sur "Voir les candidatures"
2. **Vérifier:** Une modale s'ouvre
3. **Vérifier:** Titre "Candidatures reçues"
4. **Vérifier:** Description explicative
5. **Vérifier:** Spinner de chargement pendant le fetch
6. **Vérifier:** Toast "Chargement des candidatures..."
7. Après chargement, vérifier pour chaque candidat:
   - Avatar du chauffeur
   - Nom du chauffeur
   - Email du chauffeur (optionnel selon design)
   - Ville du chauffeur (si disponible)
   - Badge "Vérifié" (si `isVerified = true`)
   - Badge du véhicule (type + volume, ex: "VUL - 12m³")
   - Badge "Hayon" (si disponible)
   - Immatriculation du véhicule
   - Rating + étoile jaune (si disponible)
   - Nombre de livraisons
   - Notes du chauffeur (si disponibles)
   - Date de candidature formatée
   - Bouton "Accepter" (si status PENDING)

### Étape 4 - Tester l'acceptation d'un candidat
1. Dans la liste, repérer un candidat avec status PENDING
2. Cliquer sur le bouton "Accepter"
3. **Vérifier:** Toast de chargement "Acceptation du candidat..."
4. **Vérifier:** Spinner sur le bouton "Accepter"
5. **Vérifier:** Tous les boutons sont désactivés
6. **Vérifier:** Toast de succès "[Nom du chauffeur] accepté avec succès"
7. **Vérifier:** La modale se ferme automatiquement
8. **Vérifier:** La page se rafraîchit
9. **Vérifier:** Le statut de la mission passe à "Attribuée" (bleu)
10. **Vérifier:** Un nouveau bouton "Lancer la mission" apparaît
11. **Vérifier:** Le nom du chauffeur accepté s'affiche

### Étape 5 - Vérifier le rejet automatique des autres candidats
1. Après avoir accepté un candidat
2. Ouvrir à nouveau "Voir les candidatures"
3. **Vérifier:** Seul le candidat accepté est montré avec badge "Accepté"
4. **Vérifier:** Les autres candidats ne sont plus dans la liste (ou ont status REJECTED)

### Étape 6 - Vérifier les restrictions
1. Ouvrir une mission sans candidature
   - **Attendu:** Le bouton "Voir les candidatures" ne doit pas apparaître
   - **Attendu:** Le texte affiche "0 candidature(s) reçue(s)"

2. En tant que chauffeur, ouvrir une mission OPEN
   - **Attendu:** Le bouton "Voir les candidatures" ne doit pas apparaître
   - **Attendu:** Seul le bouton "Postuler" est visible

3. En tant que visiteur non connecté
   - **Attendu:** Aucun bouton d'action n'apparaît
   - **Attendu:** Seul le bouton "Connectez-vous pour postuler" est visible

---

## Scénario 3: Tests d'erreur

### Test 1 - Perte de connexion
1. Ouvrir une mission en tant qu'entreprise
2. Couper la connexion internet
3. Cliquer sur "Annuler cette mission"
4. Confirmer l'annulation
5. **Attendu:** Toast d'erreur après timeout
6. **Attendu:** La modale reste ouverte
7. Restaurer la connexion et réessayer

### Test 2 - Mission déjà traitée
1. Ouvrir deux onglets avec la même mission
2. Dans l'onglet 1: Annuler la mission
3. Dans l'onglet 2: Essayer d'annuler ou d'accepter un candidat
4. **Attendu:** Message d'erreur approprié
5. **Attendu:** Refresh recommandé

### Test 3 - Candidature déjà acceptée
1. Ouvrir deux onglets en tant qu'entreprise
2. Ouvrir la liste des candidatures dans les deux onglets
3. Dans l'onglet 1: Accepter un candidat
4. Dans l'onglet 2: Essayer d'accepter un autre candidat
5. **Attendu:** Message d'erreur "Cette mission n'est plus disponible"

---

## Checklist UX

### Visuels
- [ ] Les boutons ont les bonnes couleurs (rouge pour Annuler, bleu/neutre pour Voir)
- [ ] Les icônes sont présentes et alignées
- [ ] Les spinners sont visibles pendant les chargements
- [ ] Les badges de statut ont les bonnes couleurs

### Interactions
- [ ] Les boutons réagissent au hover
- [ ] Les boutons sont désactivés pendant les requêtes
- [ ] Les modales s'ouvrent et se ferment correctement
- [ ] Le scroll fonctionne dans la liste des candidatures (si > 3 candidats)

### Feedback
- [ ] Toast de chargement avant chaque action
- [ ] Toast de succès après chaque action réussie
- [ ] Toast d'erreur en cas d'échec
- [ ] Messages d'erreur clairs et explicites

### Performance
- [ ] Le chargement des candidatures est rapide (< 1s)
- [ ] Le refresh de page après action est fluide
- [ ] Pas de clignotement ou flash de contenu

---

## Tests API directs (optionnel)

### Test 1 - Lister les candidatures
```bash
curl -X GET "http://localhost:3000/api/jobs/[JOB_ID]/candidatures" \
  -H "Cookie: [SESSION_COOKIE]"
```

**Attendu:**
- Status 200
- JSON avec `jobId`, `jobTitle`, `candidatures[]`, `total`

### Test 2 - Annuler une mission
```bash
curl -X PATCH "http://localhost:3000/api/jobs/[JOB_ID]/cancel" \
  -H "Cookie: [SESSION_COOKIE]"
```

**Attendu:**
- Status 200
- JSON avec `success: true`, `message`, `job`, `pendingBookingsCount`

### Test 3 - Accepter un candidat
```bash
curl -X PATCH "http://localhost:3000/api/bookings/[BOOKING_ID]/accept" \
  -H "Cookie: [SESSION_COOKIE]"
```

**Attendu:**
- Status 200
- JSON avec `success: true`, `message`, `booking`

---

## Problèmes connus et solutions

### Problème 1: La modale ne s'ouvre pas
**Solution:** Vérifier que `@/components/ui/dialog` est bien installé

### Problème 2: Les candidatures ne se chargent pas
**Solutions:**
- Vérifier la console pour les erreurs réseau
- Vérifier que l'utilisateur est bien connecté en tant que COMPANY
- Vérifier que la mission a bien des bookings

### Problème 3: Le refresh ne fonctionne pas après action
**Solution:** Vérifier que `useRouter().refresh()` est bien appelé après succès

### Problème 4: Toast ne s'affiche pas
**Solution:** Vérifier que `sonner` est bien configuré dans le layout principal

---

## Notes pour le développement

1. **Logs utiles à activer:**
   - Console logs dans les composants pour suivre les états
   - Network tab pour voir les requêtes API
   - React DevTools pour inspecter les props

2. **Points de breakpoint recommandés:**
   - Avant l'appel API
   - Après la réponse API (succès/erreur)
   - Dans les gestionnaires onClick

3. **Metrics à surveiller:**
   - Temps de chargement des candidatures
   - Taux de succès des actions
   - Nombre de refresh nécessaires
