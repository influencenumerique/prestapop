# Tests pour les APIs Driver Feedback

## Setup

Pour tester ces APIs, vous aurez besoin de:
1. Un utilisateur avec Role.COMPANY
2. Un utilisateur avec Role.DRIVER (avec un DriverProfile)
3. Une mission (Job) créée par la Company
4. Un Booking en statut COMPLETED pour cette mission

## Test 1: Créer un feedback valide

### Prérequis
- Authentifié en tant que COMPANY
- Mission COMPLETED avec un driver assigné
- Pas de feedback existant pour cette mission

### Request
```bash
curl -X POST http://localhost:3000/api/drivers/{driverId}/feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "bookingId": "clx123...",
    "rating": 5,
    "tags": ["PUNCTUAL", "CAREFUL", "FAST"],
    "comment": "Excellent chauffeur, très professionnel !"
  }'
```

### Expected Response (201)
```json
{
  "id": "clx456...",
  "bookingId": "clx123...",
  "driverId": "clx789...",
  "companyId": "clx012...",
  "rating": 5,
  "tags": ["PUNCTUAL", "CAREFUL", "FAST"],
  "comment": "Excellent chauffeur, très professionnel !",
  "createdAt": "2026-01-09T12:00:00.000Z"
}
```

### Effets secondaires à vérifier
1. DriverTagStats mis à jour:
   - PUNCTUAL count +1
   - CAREFUL count +1
   - FAST count +1
   - Pourcentages recalculés
2. DriverProfile.rating mis à jour (moyenne)
3. DriverProfile.totalReviews incrémenté
4. Badges vérifiés et potentiellement attribués

---

## Test 2: Erreur - Mission non terminée

### Request
```bash
curl -X POST http://localhost:3000/api/drivers/{driverId}/feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "bookingId": "clx_mission_en_cours",
    "rating": 5,
    "tags": ["PUNCTUAL"]
  }'
```

### Expected Response (400)
```json
{
  "error": "Vous ne pouvez noter que les missions terminées"
}
```

---

## Test 3: Erreur - Feedback déjà créé

### Request
Même requête que Test 1, mais exécutée deux fois

### Expected Response (400)
```json
{
  "error": "Vous avez déjà laissé un feedback pour cette mission"
}
```

---

## Test 4: Erreur - Pas une entreprise

### Prérequis
- Authentifié en tant que DRIVER

### Expected Response (403)
```json
{
  "error": "Seules les entreprises peuvent laisser des feedbacks"
}
```

---

## Test 5: Récupérer les stats d'un chauffeur

### Request
```bash
curl http://localhost:3000/api/drivers/{driverId}/stats
```

### Expected Response (200)
```json
{
  "driver": {
    "id": "clx789...",
    "name": "Jean Dupont",
    "image": "https://...",
    "city": "Paris",
    "region": "Île-de-France",
    "bio": "Chauffeur professionnel depuis 10 ans",
    "vehicleTypes": ["VAN", "TRUCK"],
    "isVerified": true
  },
  "performance": {
    "rating": 4.85,
    "totalReviews": 42,
    "totalDeliveries": 156,
    "totalFeedbacks": 42
  },
  "topTags": [
    {
      "tag": "PUNCTUAL",
      "count": 38,
      "percentage": 90.5
    },
    {
      "tag": "CAREFUL",
      "count": 35,
      "percentage": 83.3
    },
    {
      "tag": "FAST",
      "count": 30,
      "percentage": 71.4
    }
  ],
  "badges": [
    {
      "type": "PUNCTUALITY_CHAMPION",
      "earnedAt": "2026-01-05T..."
    },
    {
      "type": "TOP_10_REGION",
      "earnedAt": "2026-01-08T..."
    }
  ],
  "ranking": {
    "regionalRank": 5,
    "region": "Île-de-France"
  },
  "recentFeedbacks": [...]
}
```

---

## Test 6: Classement régional

### Request
```bash
curl "http://localhost:3000/api/drivers/ranking?region=Paris&limit=5"
```

### Expected Response (200)
```json
{
  "region": "Paris",
  "totalDrivers": 5,
  "ranking": [
    {
      "rank": 1,
      "driver": {
        "id": "clx111...",
        "name": "Top Driver",
        "image": "https://...",
        "city": "Paris",
        "isVerified": true
      },
      "performance": {
        "rating": 4.95,
        "totalReviews": 100,
        "totalDeliveries": 250
      },
      "badges": ["TOP_3_REGION", "PUNCTUALITY_CHAMPION"],
      "topTags": [
        { "tag": "PUNCTUAL", "count": 90 },
        { "tag": "CAREFUL", "count": 85 }
      ]
    }
  ]
}
```

---

## Test 7: Validation des données

### Request avec données invalides
```bash
curl -X POST http://localhost:3000/api/drivers/{driverId}/feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "bookingId": "invalid_id",
    "rating": 6,
    "tags": ["INVALID_TAG"]
  }'
```

### Expected Response (400)
```json
{
  "error": "Données invalides",
  "details": [
    {
      "code": "invalid_type",
      "path": ["rating"],
      "message": "Number must be less than or equal to 5"
    }
  ]
}
```

---

## Scénario de test complet: Attribution de badges

### Étape 1: Chauffeur avec 0 feedback
```bash
curl http://localhost:3000/api/drivers/{driverId}/stats
# badges: []
```

### Étape 2: Ajouter 50 feedbacks avec tag PUNCTUAL
```bash
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/drivers/{driverId}/feedback \
    -H "Content-Type: application/json" \
    -d '{"bookingId": "booking_'$i'", "rating": 5, "tags": ["PUNCTUAL"]}'
done
```

### Étape 3: Vérifier l'attribution du badge
```bash
curl http://localhost:3000/api/drivers/{driverId}/stats
# badges: [{ "type": "PUNCTUALITY_CHAMPION", "earnedAt": "..." }]
```

### Étape 4: Vérifier le classement
```bash
curl "http://localhost:3000/api/drivers/ranking?region=Paris"
# Le chauffeur devrait apparaître dans le top 10 si sa note est suffisante
```

---

## Tests de performance

### Test de charge: Créer 100 feedbacks simultanés
```bash
# Utiliser un outil comme Apache Bench ou k6
ab -n 100 -c 10 -T 'application/json' \
  -p feedback.json \
  http://localhost:3000/api/drivers/{driverId}/feedback
```

### Vérifier que:
1. Les DriverTagStats sont correctement mis à jour
2. Les badges sont attribués de manière cohérente
3. Les pourcentages sont calculés correctement
4. Pas de race conditions

---

## Notes de débogage

### Vérifier l'état de la base de données

```sql
-- Compter les feedbacks d'un chauffeur
SELECT COUNT(*) FROM driver_feedbacks WHERE driver_id = 'clx789...';

-- Voir les stats de tags
SELECT * FROM driver_tag_stats WHERE driver_id = 'clx789...';

-- Voir les badges obtenus
SELECT * FROM driver_badges WHERE driver_id = 'clx789...';

-- Vérifier la cohérence rating
SELECT
  dp.rating,
  AVG(df.rating) as avg_from_feedbacks
FROM driver_profiles dp
LEFT JOIN driver_feedbacks df ON df.driver_id = dp.id
WHERE dp.id = 'clx789...'
GROUP BY dp.rating;
```
