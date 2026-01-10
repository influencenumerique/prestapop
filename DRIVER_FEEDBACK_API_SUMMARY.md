# Résumé: APIs Driver Feedback & Ranking

## Objectif
Système complet de votes/feedback et classement des chauffeurs avec attribution automatique de badges.

---

## Fichiers créés

### 1. Routes API

#### `/src/app/api/drivers/[id]/feedback/route.ts`
**POST** - Permet à une entreprise de noter un chauffeur après une mission terminée

**Fonctionnalités:**
- Validation stricte: mission COMPLETED, pas de double vote, entreprise autorisée
- Enregistre le rating (1-5) et les tags sélectionnés
- Met à jour automatiquement les stats agrégées (DriverTagStats)
- Recalcule la note moyenne du chauffeur
- Vérifie et attribue/révoque les badges

**Champs attendus:**
```typescript
{
  bookingId: string (cuid)
  rating: number (1-5)
  tags: FeedbackTag[]
  comment?: string
}
```

**Champs renvoyés:**
```typescript
{
  id: string
  bookingId: string
  driverId: string
  companyId: string
  rating: number
  tags: FeedbackTag[]
  comment: string | null
  createdAt: Date
}
```

---

#### `/src/app/api/drivers/[id]/stats/route.ts`
**GET** - Retourne les statistiques complètes d'un chauffeur

**Fonctionnalités:**
- Profil du chauffeur
- Performance (rating, nombre d'avis, livraisons)
- Top 5 tags avec pourcentages
- Badges obtenus
- Position dans le classement régional
- 10 derniers feedbacks avec détails des entreprises

**Champs renvoyés:**
```typescript
{
  driver: {
    id, name, image, city, region, bio, vehicleTypes, isVerified
  }
  performance: {
    rating, totalReviews, totalDeliveries, totalFeedbacks
  }
  topTags: Array<{ tag, count, percentage }>
  badges: Array<{ type, earnedAt }>
  ranking: { regionalRank, region }
  recentFeedbacks: Array<{ rating, tags, comment, createdAt, company }>
}
```

---

#### `/src/app/api/drivers/ranking/route.ts`
**GET** - Retourne le classement des chauffeurs par région

**Fonctionnalités:**
- Filtrage par région (requis)
- Limite configurable (défaut: 10)
- Tri par rating > totalReviews > totalDeliveries
- Minimum 5 avis pour être classé

**Query params:**
- `region` (string, requis): ex: "Paris", "Île-de-France"
- `limit` (number, optionnel): défaut 10

**Champs renvoyés:**
```typescript
{
  region: string
  totalDrivers: number
  ranking: Array<{
    rank: number
    driver: { id, name, image, city, isVerified }
    performance: { rating, totalReviews, totalDeliveries }
    badges: BadgeType[]
    topTags: Array<{ tag, count }>
  }>
}
```

---

### 2. Fonctions utilitaires

#### `/src/lib/utils/badges.ts`

**`updateDriverBadges(driverId: string)`**
- Recalcule et met à jour tous les badges d'un chauffeur
- Vérifie chaque règle de badge (10 types différents)
- Attribue automatiquement les nouveaux badges
- Révoque les badges dont les conditions ne sont plus remplies

**`updateDriverTagStats(driverId: string, tags: FeedbackTag[])`**
- Incrémente le count pour chaque tag
- Recalcule les pourcentages basés sur le nombre total de feedbacks
- Upsert automatique (crée ou met à jour)

**`getDriverRegionalRank(driverId: string)`**
- Calcule la position du chauffeur dans sa région
- Retourne un nombre (1-indexed) ou null si pas de région

---

### 3. Types TypeScript

#### `/src/lib/types/driver-feedback.ts`
- `CreateFeedbackRequest`: Body pour POST feedback
- `CreateFeedbackResponse`: Réponse après création
- `DriverStatsResponse`: Réponse complète des stats
- `DriverRankingRequest`: Query params pour ranking
- `DriverRankingResponse`: Réponse du classement
- `BADGE_DESCRIPTIONS`: Descriptions des badges
- `TAG_DESCRIPTIONS`: Descriptions des tags
- `FeedbackErrorResponse`: Format d'erreur

---

### 4. Documentation

#### `/src/app/api/drivers/README.md`
Documentation complète avec:
- Exemples de requêtes/réponses pour chaque route
- Liste des enums (FeedbackTag, BadgeType)
- Règles d'attribution des badges
- Structure de la base de données
- Exemples d'utilisation en TypeScript

#### `/src/app/api/drivers/__tests__/feedback.test.md`
Guide de tests avec:
- 7 scénarios de test différents
- Scénario complet d'attribution de badges
- Tests de validation des données
- Tests de performance
- Requêtes SQL pour le débogage

---

## Système de badges

### Types de badges (10)

1. **PUNCTUALITY_CHAMPION**: 50+ votes "PUNCTUAL"
2. **CAREFUL_EXPERT**: 50+ votes "CAREFUL"
3. **SPEED_DEMON**: 50+ votes "FAST"
4. **COMMUNICATION_STAR**: 50+ votes "COMMUNICATIVE"
5. **TOP_10_REGION**: Top 10 de sa région (min. 5 avis)
6. **TOP_3_REGION**: Top 3 de sa région (min. 10 avis)
7. **FIRST_100_DELIVERIES**: 100 livraisons effectuées
8. **FIRST_500_DELIVERIES**: 500 livraisons effectuées
9. **PERFECT_RATING**: Note moyenne 5.0 avec 20+ avis
10. **RISING_STAR**: 5-15 avis avec note >= 4.5

### Attribution automatique
- Déclenchée après chaque nouveau feedback
- Vérifie TOUTES les règles
- Attribue les badges manquants
- Révoque les badges obsolètes
- Transactionnel (rollback en cas d'erreur)

---

## Tags de feedback (10)

1. **PUNCTUAL**: Ponctuel
2. **CAREFUL**: Soigneux
3. **COMMUNICATIVE**: Communicatif
4. **FAST**: Rapide
5. **PRECISE**: Précis
6. **FRIENDLY**: Souriant/Aimable
7. **RESOURCEFUL**: Débrouillard
8. **RESPONSIVE**: Réactif
9. **PROFESSIONAL**: Professionnel
10. **RELIABLE**: Fiable

---

## Validations et sécurité

### POST /api/drivers/[id]/feedback
✅ Authentification requise (Role.COMPANY)
✅ Vérification que la mission est COMPLETED
✅ Vérification pas de double vote (bookingId unique)
✅ Vérification que la mission appartient à l'entreprise
✅ Vérification que le chauffeur est assigné à cette mission
✅ Validation Zod du payload (rating 1-5, tags valides)

### GET /api/drivers/[id]/stats
✅ Lecture publique (pas d'auth requise)
✅ 404 si chauffeur non trouvé

### GET /api/drivers/ranking
✅ Lecture publique (pas d'auth requise)
✅ Paramètre 'region' obligatoire
✅ Limite max recommandée: 100

---

## Architecture

### Flow de création d'un feedback

```
1. Company POST /api/drivers/{id}/feedback
   └─ Validation auth + données
   └─ Vérifications mission/booking
   └─ Création DriverFeedback
   └─ updateDriverTagStats()
      └─ Upsert counts
      └─ Recalcul pourcentages
   └─ Recalcul note moyenne
   └─ Update DriverProfile
   └─ updateDriverBadges()
      └─ Pour chaque règle:
         └─ Vérifier condition
         └─ Attribuer ou révoquer
   └─ Return feedback créé
```

### Tables Prisma utilisées

```
DriverFeedback (votes)
  ├─ bookingId (unique)
  ├─ driverId
  ├─ companyId
  ├─ rating (1-5)
  ├─ tags (array)
  └─ comment

DriverTagStats (stats agrégées)
  ├─ driverId
  ├─ tag (unique avec driverId)
  ├─ count
  └─ percentage

DriverBadge (badges obtenus)
  ├─ driverId
  ├─ badge (unique avec driverId)
  └─ earnedAt

DriverProfile
  ├─ rating (moyenne)
  ├─ totalReviews
  ├─ totalDeliveries
  └─ region (pour classement)
```

---

## Exemples d'utilisation

### 1. Noter un chauffeur
```typescript
const response = await fetch('/api/drivers/driver123/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: 'booking456',
    rating: 5,
    tags: ['PUNCTUAL', 'CAREFUL', 'PROFESSIONAL'],
    comment: 'Excellent travail, très professionnel !',
  }),
})
```

### 2. Afficher les stats d'un chauffeur
```typescript
const response = await fetch('/api/drivers/driver123/stats')
const stats = await response.json()

console.log(`Note: ${stats.performance.rating}/5`)
console.log(`Classement régional: #${stats.ranking.regionalRank}`)
console.log(`Badges: ${stats.badges.length}`)
```

### 3. Afficher le classement
```typescript
const response = await fetch('/api/drivers/ranking?region=Paris&limit=10')
const { ranking } = await response.json()

ranking.forEach(entry => {
  console.log(`#${entry.rank}: ${entry.driver.name} - ${entry.performance.rating}/5`)
})
```

---

## Points d'attention

### Performance
- Les stats de tags sont pré-calculées (pas de COUNT en temps réel)
- Le classement régional utilise des index sur `region`, `rating`, `totalReviews`
- Limite recommandée pour le ranking: 100 max

### Cohérence des données
- Les pourcentages sont recalculés à chaque nouveau feedback
- Les badges sont vérifiés à chaque nouveau feedback
- La note moyenne est recalculée de manière incrémentale

### Évolutivité
- Facile d'ajouter de nouveaux tags (modifier l'enum)
- Facile d'ajouter de nouveaux badges (ajouter une règle dans badges.ts)
- Les règles de badges sont modulaires et testables

---

## Prochaines étapes possibles

1. **Cache Redis**: Mettre en cache les stats et le ranking
2. **Job queue**: Déplacer l'update des badges dans un job asynchrone
3. **Webhooks**: Notifier le chauffeur quand il obtient un badge
4. **Analytics**: Dashboard pour analyser les tendances des feedbacks
5. **Gamification**: Points, niveaux, récompenses additionnelles
6. **Modération**: Système de signalement des feedbacks abusifs

---

## Fichiers modifiés (schéma Prisma)

Le schéma Prisma a été complété avec:
- Enum `FeedbackTag` (10 valeurs)
- Enum `BadgeType` (10 valeurs)
- Model `DriverFeedback`
- Model `DriverBadge`
- Model `DriverTagStats`
- Relations dans `DriverProfile`, `Company`, `Booking`
- Champ `region` dans `DriverProfile` (pour classement)
- Relation `driverFeedback` dans `Booking`

---

## Compatibilité

### Avec l'existant
✅ Compatible avec le système de Review existant (`/api/bookings/[id]/review`)
✅ Ne modifie pas les autres routes API
✅ Utilise les mêmes mécanismes d'authentification
✅ Réutilise les imports db et auth

### Migration
Une migration Prisma sera nécessaire pour créer les nouvelles tables:
```bash
npx prisma migrate dev --name add_driver_feedback_system
npx prisma generate
```

---

## Résumé des routes créées

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/api/drivers/[id]/feedback` | POST | Company | Noter un chauffeur |
| `/api/drivers/[id]/stats` | GET | Public | Stats du chauffeur |
| `/api/drivers/ranking` | GET | Public | Classement régional |

---

Toutes les routes respectent le modèle Prisma et utilisent les champs définis dans le schéma. Le système est complet, documenté et prêt à l'emploi.
