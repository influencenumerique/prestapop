# Phase API_JOBS : Authentification basée sur les rôles

## Résumé des modifications

Cette phase a ajouté une authentification robuste basée sur les rôles `Role.COMPANY` et `Role.DRIVER` sur toutes les routes API `/api/jobs` et `/api/bookings`.

## Fichiers créés

### 1. `/src/lib/api-auth/index.ts`
Helper d'authentification et d'autorisation pour les routes API.

**Fonctionnalités:**
- `requireAuth()` - Vérifie l'authentification de base (retourne l'utilisateur ou une erreur 401)
- `requireRole(role)` - Vérifie qu'un utilisateur a un rôle spécifique (COMPANY, DRIVER, ADMIN)
- `requireAnyRole(roles[])` - Vérifie qu'un utilisateur a au moins un des rôles requis
- `isCompanyOwner(user, companyId)` - Vérifie si un utilisateur possède une entreprise
- `isDriver(user, driverId)` - Vérifie si un utilisateur est un chauffeur spécifique

**Types exportés:**
- `Role` - Type pour les rôles (COMPANY | DRIVER | ADMIN)
- `AuthenticatedUser` - Type enrichi avec rôle et profils (company, driverProfile)

**Erreurs standardisées:**
- 401 - Non authentifié
- 403 - Accès refusé (général, COMPANY only, DRIVER only)
- 404 - Utilisateur non trouvé

---

## Fichiers modifiés

### 2. `/src/app/api/jobs/route.ts`

#### GET `/api/jobs` - Liste des missions ouvertes
**Avant:** Publique (aucune authentification)
**Après:** Authentification obligatoire (DRIVER et COMPANY)

**Modifications:**
- Ajout de `requireAuth()` pour vérifier l'authentification
- Retour d'une erreur 401 si non authentifié
- Accessible aux deux rôles (DRIVER et COMPANY)

**Filtres disponibles:**
- `secteur` - Secteur de livraison
- `missionZoneType` - Type de zone (URBAN, CITY_TO_CITY)
- `vehicleVolume` - Volume requis (CUBE_6M à CUBE_20M)
- `typeMission` - Type de mission (DAY, HALF_DAY, WEEK)
- `needsTailLift` - Hayon élévateur requis (true/false)
- `page` et `limit` - Pagination

**Réponse:**
```json
{
  "jobs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### POST `/api/jobs` - Créer une mission
**Avant:** Vérification du profil Company uniquement
**Après:** Vérification explicite du `Role.COMPANY`

**Modifications:**
- Remplacement de `auth()` par `requireRole("COMPANY")`
- Erreur 403 si l'utilisateur n'est pas Role.COMPANY
- Erreur 400 si le profil Company n'existe pas

**Champs requis:**
```typescript
{
  title: string (5-100 caractères)
  typeMission: "DAY" | "HALF_DAY" | "WEEK"
  missionZoneType: "URBAN" | "CITY_TO_CITY"
  secteurLivraison: string (min 2 caractères)
  packageSize: "SMALL" | "MEDIUM" | "LARGE" | "MIXED"
  nombreColis: number (min 1)
  startTime: Date (ISO string)
  estimatedEndTime: Date (ISO string)
  vehicleVolume: "CUBE_6M" | "CUBE_9M" | "CUBE_12M" | "CUBE_15M" | "CUBE_20M"
  needsTailLift: boolean
  dayRate: number (en centimes, min 1000)
  description?: string (optionnel)
}
```

---

### 3. `/src/app/api/jobs/[id]/route.ts`

#### GET `/api/jobs/[id]` - Détail d'une mission
**Avant:** Publique (aucune authentification)
**Après:** Authentification obligatoire (DRIVER et COMPANY)

**Modifications:**
- Ajout de `requireAuth()` pour vérifier l'authentification
- Retour d'une erreur 401 si non authentifié
- Accessible aux deux rôles (DRIVER et COMPANY)

**Réponse:** Mission complète avec company, bookings et reviews

#### PATCH `/api/jobs/[id]` - Modifier une mission
**Avant:** Vérification de ownership via `userId`
**Après:** Vérification explicite du `Role.COMPANY` + ownership

**Modifications:**
- Remplacement de `auth()` par `requireRole("COMPANY")`
- Utilisation de `isCompanyOwner()` pour vérifier la propriété
- Erreur 403 si l'utilisateur n'est pas Role.COMPANY
- Erreur 403 si l'utilisateur ne possède pas la mission

**Champs modifiables:** Tous les champs de création (optionnels) + `status`

#### DELETE `/api/jobs/[id]` - Supprimer une mission
**Avant:** Vérification de ownership via `userId`
**Après:** Vérification explicite du `Role.COMPANY` + ownership

**Modifications:**
- Remplacement de `auth()` par `requireRole("COMPANY")`
- Utilisation de `isCompanyOwner()` pour vérifier la propriété
- Erreur 403 si l'utilisateur n'est pas Role.COMPANY
- Erreur 403 si l'utilisateur ne possède pas la mission
- Suppression autorisée uniquement si status = DRAFT ou OPEN

---

### 4. `/src/app/api/jobs/[id]/apply/route.ts`

#### POST `/api/jobs/[id]/apply` - Postuler à une mission
**Avant:** Vérification du profil DriverProfile uniquement
**Après:** Vérification explicite du `Role.DRIVER`

**Modifications:**
- Remplacement de `auth()` par `requireRole("DRIVER")`
- Erreur 403 si l'utilisateur n'est pas Role.DRIVER
- Erreur 400 si le profil DriverProfile n'existe pas
- Vérification de disponibilité (`isAvailable`)
- Vérification que la mission est OPEN
- Prévention des candidatures multiples

**Champs acceptés:**
```typescript
{
  proposedPrice?: number (optionnel, par défaut = job.dayRate)
  message?: string (optionnel, note du chauffeur)
}
```

**Réponse:** Booking créé avec status "ASSIGNED"

---

### 5. `/src/app/api/bookings/route.ts`

#### GET `/api/bookings` - Liste des réservations
**Avant:** Authentification + détection manuelle du rôle via profils
**Après:** Authentification + utilisation du champ `user.role`

**Modifications:**
- Remplacement de `auth()` par `requireAuth()`
- Utilisation de `user.role` au lieu du paramètre `?role=`
- Filtrage automatique selon le rôle:
  - `Role.DRIVER` → Bookings où `driverId = user.driverProfile.id`
  - `Role.COMPANY` → Bookings via `job.companyId = user.company.id`

**Filtres disponibles:**
- `status` - Statut de la réservation (ASSIGNED, IN_PROGRESS, etc.)

**Réponse:**
```json
{
  "bookings": [...]
}
```

---

### 6. `/src/app/api/bookings/[id]/route.ts`

#### GET `/api/bookings/[id]` - Détail d'une réservation
**Avant:** Authentification + vérification manuelle des profils
**Après:** Authentification + utilisation des helpers `isDriver()` et `isCompanyOwner()`

**Modifications:**
- Remplacement de `auth()` par `requireAuth()`
- Utilisation de `isDriver()` et `isCompanyOwner()` pour l'autorisation
- Erreur 403 si l'utilisateur n'est ni le driver concerné ni la company propriétaire

#### PATCH `/api/bookings/[id]` - Mettre à jour une réservation
**Avant:** Authentification + vérification manuelle des profils
**Après:** Authentification + utilisation des helpers `isDriver()` et `isCompanyOwner()`

**Modifications:**
- Remplacement de `auth()` par `requireAuth()`
- Utilisation de `isDriver()` et `isCompanyOwner()` pour l'autorisation
- Erreur 403 si l'utilisateur n'est ni le driver concerné ni la company propriétaire
- Gestion automatique des timestamps (pickedUpAt, deliveredAt)
- Synchronisation du statut avec le Job
- Incrémentation de `totalDeliveries` du driver si status = COMPLETED

**Champs modifiables:**
```typescript
{
  status?: "ASSIGNED" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED" | "CANCELLED"
  pickedUpAt?: Date (ISO string)
  deliveredAt?: Date (ISO string)
  proofOfDelivery?: string
  driverNotes?: string
  companyNotes?: string
}
```

---

## Matrice des autorisations

| Route | Méthode | Role.COMPANY | Role.DRIVER | Conditions supplémentaires |
|-------|---------|--------------|-------------|----------------------------|
| `/api/jobs` | GET | ✅ | ✅ | Authentifié |
| `/api/jobs` | POST | ✅ | ❌ | Profil Company requis |
| `/api/jobs/[id]` | GET | ✅ | ✅ | Authentifié |
| `/api/jobs/[id]` | PATCH | ✅ | ❌ | Propriétaire de la mission |
| `/api/jobs/[id]` | DELETE | ✅ | ❌ | Propriétaire + status DRAFT/OPEN |
| `/api/jobs/[id]/apply` | POST | ❌ | ✅ | Profil Driver + isAvailable |
| `/api/bookings` | GET | ✅ | ✅ | Filtré par rôle |
| `/api/bookings/[id]` | GET | ✅ | ✅ | Propriétaire ou driver concerné |
| `/api/bookings/[id]` | PATCH | ✅ | ✅ | Propriétaire ou driver concerné |

---

## Codes d'erreur retournés

### 401 - Non authentifié
Retourné quand:
- Aucune session active
- Token invalide ou expiré

Message: `"Non authentifié. Veuillez vous connecter."`

### 403 - Accès refusé
Retourné quand:
- L'utilisateur n'a pas le bon rôle (COMPANY/DRIVER)
- L'utilisateur n'est pas propriétaire de la ressource
- L'utilisateur tente une action non autorisée

Messages:
- `"Accès réservé aux entreprises (Role.COMPANY)."`
- `"Accès réservé aux chauffeurs (Role.DRIVER)."`
- `"Vous n'êtes pas autorisé à modifier cette mission"`
- `"Vous n'êtes pas autorisé à consulter cette réservation"`

### 400 - Requête invalide
Retourné quand:
- Données de validation Zod échouent
- Profil manquant (Company ou Driver)
- Chauffeur non disponible
- Mission déjà fermée
- Candidature en doublon

### 404 - Ressource non trouvée
Retourné quand:
- Mission introuvable
- Réservation introuvable
- Utilisateur introuvable

---

## Bonnes pratiques implémentées

1. **Séparation des préoccupations:** Logique d'auth centralisée dans `/src/lib/api-auth/`
2. **Typage fort:** Types TypeScript pour AuthenticatedUser et Role
3. **Erreurs standardisées:** Messages d'erreur cohérents et informatifs
4. **Validation des données:** Utilisation de Zod pour la validation des payloads
5. **Principe du moindre privilège:** Chaque route vérifie explicitement les permissions
6. **Ownership verification:** Les utilisateurs ne peuvent modifier que leurs propres ressources
7. **Codes HTTP appropriés:** 401 (auth), 403 (authz), 400 (validation), 404 (not found)

---

## Tests recommandés

### Tests d'authentification
- [ ] Accès sans token → 401
- [ ] Accès avec token invalide → 401
- [ ] Accès avec token expiré → 401

### Tests d'autorisation COMPANY
- [ ] Company peut créer une mission → 200
- [ ] Company peut modifier sa mission → 200
- [ ] Company ne peut pas modifier la mission d'un autre → 403
- [ ] Company peut supprimer sa mission (OPEN) → 200
- [ ] Company ne peut pas supprimer une mission IN_PROGRESS → 400
- [ ] Driver tente de créer une mission → 403

### Tests d'autorisation DRIVER
- [ ] Driver peut postuler à une mission → 200
- [ ] Driver disponible peut postuler → 200
- [ ] Driver non disponible ne peut pas postuler → 400
- [ ] Driver ne peut pas postuler deux fois → 400
- [ ] Company tente de postuler → 403

### Tests des bookings
- [ ] Driver voit ses propres bookings → 200
- [ ] Company voit les bookings de ses missions → 200
- [ ] Driver ne voit pas les bookings d'un autre driver → 403
- [ ] Company ne voit pas les bookings d'une autre company → 403
- [ ] Driver peut mettre à jour son booking → 200
- [ ] Company peut mettre à jour le booking de sa mission → 200

---

## Migration et déploiement

### Aucune modification du schéma Prisma
Cette phase n'a modifié aucun modèle de base de données. Aucune migration n'est nécessaire.

### Compatibilité descendante
Les routes API existantes continuent de fonctionner, mais nécessitent maintenant une authentification.

### Impact sur le frontend
Le frontend devra:
1. Envoyer le token d'authentification dans les headers
2. Gérer les erreurs 401 (redirection vers login)
3. Gérer les erreurs 403 (affichage d'un message d'erreur)
4. Supprimer le paramètre `?role=` de GET `/api/bookings` (détection automatique)

---

## Prochaines étapes suggérées

1. **Tests unitaires et d'intégration:** Implémenter les tests recommandés ci-dessus
2. **Rate limiting:** Ajouter un rate limiter sur les routes sensibles (création, candidature)
3. **Logs d'audit:** Logger les actions critiques (création, modification, suppression)
4. **Webhooks:** Notifier les entreprises quand un driver postule
5. **Cache:** Mettre en cache la liste des missions avec Redis
6. **Pagination améliorée:** Ajouter cursor-based pagination pour de meilleures performances
