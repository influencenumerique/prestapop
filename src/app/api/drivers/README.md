# APIs Driver Feedback & Ranking

Ce module gère le système de votes/feedback et de classement des chauffeurs.

## Routes disponibles

### 1. POST /api/drivers/[id]/feedback

Permet à une entreprise de noter un chauffeur après une mission terminée.

**Authentification**: Requise (Role: COMPANY)

**Paramètres URL**:
- `id` (string): ID du chauffeur

**Body**:
```json
{
  "bookingId": "cuid",
  "rating": 1-5,
  "tags": ["PUNCTUAL", "CAREFUL", "FAST"],
  "comment": "Excellent travail !" // optionnel
}
```

**Validations**:
- L'utilisateur doit être une entreprise
- La mission doit être COMPLETED
- L'entreprise ne doit pas avoir déjà voté pour cette mission
- Le chauffeur doit être assigné à cette mission
- La mission doit appartenir à l'entreprise

**Effets**:
1. Crée un DriverFeedback
2. Met à jour les DriverTagStats (compte + pourcentage)
3. Recalcule la note moyenne du chauffeur
4. Vérifie et attribue/révoque les badges automatiquement

**Réponse**: 201 Created
```json
{
  "id": "cuid",
  "bookingId": "cuid",
  "driverId": "cuid",
  "companyId": "cuid",
  "rating": 5,
  "tags": ["PUNCTUAL", "CAREFUL"],
  "comment": "Excellent travail !",
  "createdAt": "2026-01-09T..."
}
```

**Erreurs**:
- 401: Non authentifié
- 403: Pas une entreprise ou mission non autorisée
- 400: Mission pas terminée ou déjà voté
- 404: Chauffeur ou mission non trouvé

---

### 2. GET /api/drivers/[id]/stats

Retourne les statistiques complètes d'un chauffeur.

**Authentification**: Non requise (lecture publique)

**Paramètres URL**:
- `id` (string): ID du chauffeur

**Réponse**: 200 OK
```json
{
  "driver": {
    "id": "cuid",
    "name": "Jean Dupont",
    "image": "https://...",
    "city": "Paris",
    "region": "Île-de-France",
    "bio": "...",
    "vehicleTypes": ["VAN", "TRUCK"],
    "isVerified": true
  },
  "performance": {
    "rating": 4.8,
    "totalReviews": 45,
    "totalDeliveries": 120,
    "totalFeedbacks": 45
  },
  "topTags": [
    {
      "tag": "PUNCTUAL",
      "count": 40,
      "percentage": 88.9
    },
    {
      "tag": "CAREFUL",
      "count": 35,
      "percentage": 77.8
    }
  ],
  "badges": [
    {
      "type": "PUNCTUALITY_CHAMPION",
      "earnedAt": "2026-01-01T..."
    }
  ],
  "ranking": {
    "regionalRank": 3,
    "region": "Île-de-France"
  },
  "recentFeedbacks": [
    {
      "rating": 5,
      "tags": ["PUNCTUAL", "CAREFUL"],
      "comment": "Super pro !",
      "createdAt": "2026-01-09T...",
      "company": {
        "companyName": "TransportExpress",
        "logo": "https://..."
      }
    }
  ]
}
```

**Erreurs**:
- 404: Chauffeur non trouvé

---

### 3. GET /api/drivers/ranking

Retourne le classement des chauffeurs par région.

**Authentification**: Non requise (lecture publique)

**Query params**:
- `region` (string, requis): Région (ex: "Paris", "Île-de-France")
- `limit` (number, optionnel): Nombre de résultats (défaut: 10, max: 100)

**Exemple**: `/api/drivers/ranking?region=Paris&limit=20`

**Réponse**: 200 OK
```json
{
  "region": "Paris",
  "totalDrivers": 10,
  "ranking": [
    {
      "rank": 1,
      "driver": {
        "id": "cuid",
        "name": "Jean Dupont",
        "image": "https://...",
        "city": "Paris",
        "isVerified": true
      },
      "performance": {
        "rating": 4.95,
        "totalReviews": 120,
        "totalDeliveries": 250
      },
      "badges": ["TOP_3_REGION", "PUNCTUALITY_CHAMPION"],
      "topTags": [
        {
          "tag": "PUNCTUAL",
          "count": 100
        },
        {
          "tag": "CAREFUL",
          "count": 95
        }
      ]
    }
  ]
}
```

**Erreurs**:
- 400: Paramètre 'region' manquant

---

## Enums

### FeedbackTag
- `PUNCTUAL`: Ponctuel
- `CAREFUL`: Soigneux
- `COMMUNICATIVE`: Communicatif
- `FAST`: Rapide
- `PRECISE`: Précis
- `FRIENDLY`: Souriant/Aimable
- `RESOURCEFUL`: Débrouillard
- `RESPONSIVE`: Réactif
- `PROFESSIONAL`: Professionnel
- `RELIABLE`: Fiable

### BadgeType
- `PUNCTUALITY_CHAMPION`: 50+ votes "Ponctuel"
- `CAREFUL_EXPERT`: 50+ votes "Soigneux"
- `SPEED_DEMON`: 50+ votes "Rapide"
- `COMMUNICATION_STAR`: 50+ votes "Communicatif"
- `TOP_10_REGION`: Top 10 de sa région
- `TOP_3_REGION`: Top 3 de sa région
- `FIRST_100_DELIVERIES`: 100 livraisons effectuées
- `FIRST_500_DELIVERIES`: 500 livraisons effectuées
- `PERFECT_RATING`: Note moyenne 5.0 avec 20+ avis
- `RISING_STAR`: Nouveau chauffeur prometteur (5-15 avis, note >= 4.5)

---

## Système de badges

Les badges sont automatiquement attribués/révoqués lors de chaque nouveau feedback via la fonction `updateDriverBadges()`.

### Règles d'attribution

Chaque badge a une condition spécifique:

1. **PUNCTUALITY_CHAMPION**: >= 50 votes "PUNCTUAL"
2. **CAREFUL_EXPERT**: >= 50 votes "CAREFUL"
3. **SPEED_DEMON**: >= 50 votes "FAST"
4. **COMMUNICATION_STAR**: >= 50 votes "COMMUNICATIVE"
5. **TOP_10_REGION**: Dans le top 10 de sa région (min. 5 avis)
6. **TOP_3_REGION**: Dans le top 3 de sa région (min. 10 avis)
7. **FIRST_100_DELIVERIES**: >= 100 livraisons
8. **FIRST_500_DELIVERIES**: >= 500 livraisons
9. **PERFECT_RATING**: Note moyenne = 5.0 avec >= 20 avis
10. **RISING_STAR**: 5-15 avis avec note >= 4.5

### Révocation automatique

Si un chauffeur ne remplit plus les conditions d'un badge (par exemple, sa note descend sous 5.0 pour PERFECT_RATING), le badge est automatiquement révoqué.

---

## Fonctions utilitaires

### `updateDriverBadges(driverId: string)`
Recalcule et met à jour tous les badges d'un chauffeur.

### `updateDriverTagStats(driverId: string, tags: FeedbackTag[])`
Met à jour les statistiques de tags (count + percentage).

### `getDriverRegionalRank(driverId: string)`
Retourne la position du chauffeur dans le classement régional.

---

## Base de données

### Tables utilisées
- `DriverFeedback`: Votes/feedbacks
- `DriverBadge`: Badges obtenus
- `DriverTagStats`: Stats agrégées par tag
- `DriverProfile`: Profil avec note moyenne
- `Booking`: Missions (statut COMPLETED requis)

### Relations
```
DriverProfile
  ├── feedbacks: DriverFeedback[]
  ├── badges: DriverBadge[]
  └── tagStats: DriverTagStats[]

DriverFeedback
  ├── driver: DriverProfile
  ├── company: Company
  └── booking: Booking (unique)
```

---

## Exemple d'utilisation

### 1. Noter un chauffeur après une mission

```typescript
const response = await fetch('/api/drivers/driver123/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bookingId: 'booking456',
    rating: 5,
    tags: ['PUNCTUAL', 'CAREFUL', 'FAST'],
    comment: 'Excellent chauffeur, très professionnel !',
  }),
})

if (response.ok) {
  const feedback = await response.json()
  console.log('Feedback créé:', feedback)
}
```

### 2. Récupérer les stats d'un chauffeur

```typescript
const response = await fetch('/api/drivers/driver123/stats')
const stats = await response.json()

console.log(`Note moyenne: ${stats.performance.rating}`)
console.log(`Position régionale: #${stats.ranking.regionalRank}`)
console.log(`Badges obtenus: ${stats.badges.length}`)
```

### 3. Afficher le classement régional

```typescript
const response = await fetch('/api/drivers/ranking?region=Paris&limit=10')
const { ranking } = await response.json()

ranking.forEach((entry, index) => {
  console.log(`#${entry.rank}: ${entry.driver.name} - ${entry.performance.rating}/5`)
})
```
