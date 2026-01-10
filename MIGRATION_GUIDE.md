# Guide de migration: Système de feedback des chauffeurs

## Étapes de déploiement

### 1. Vérifier le schéma Prisma

Le schéma doit contenir les modèles suivants (déjà ajoutés):
- `DriverFeedback`
- `DriverBadge`
- `DriverTagStats`
- Enums: `FeedbackTag`, `BadgeType`

### 2. Créer la migration

```bash
# Générer la migration
npx prisma migrate dev --name add_driver_feedback_system

# Ou en production
npx prisma migrate deploy
```

### 3. Générer le client Prisma

```bash
npx prisma generate
```

### 4. Vérifier la création des tables

```bash
# Ouvrir Prisma Studio pour vérifier
npx prisma studio

# Ou via SQL
psql $DATABASE_URL -c "\dt driver_*"
```

Tables attendues:
- `driver_feedbacks`
- `driver_badges`
- `driver_tag_stats`

---

## SQL de vérification

### Vérifier que les tables existent

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'driver_%';
```

### Vérifier les indexes

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('driver_feedbacks', 'driver_badges', 'driver_tag_stats');
```

---

## Données de test

### 1. Ajouter une région à un chauffeur existant

```sql
UPDATE driver_profiles
SET region = 'Île-de-France'
WHERE city LIKE '%Paris%';

UPDATE driver_profiles
SET region = 'Provence-Alpes-Côte d''Azur'
WHERE city LIKE '%Marseille%' OR city LIKE '%Nice%';
```

### 2. Créer des feedbacks de test

```typescript
// Script seed (ou dans Prisma Studio)
import { db } from './src/lib/db'
import { FeedbackTag } from '@prisma/client'

async function seedFeedbacks() {
  // Récupérer un booking COMPLETED
  const booking = await db.booking.findFirst({
    where: { status: 'COMPLETED' },
    include: { job: true }
  })

  if (!booking) {
    console.log('Pas de booking COMPLETED trouvé')
    return
  }

  // Créer un feedback
  await db.driverFeedback.create({
    data: {
      bookingId: booking.id,
      driverId: booking.driverId,
      companyId: booking.job.companyId,
      rating: 5,
      tags: [FeedbackTag.PUNCTUAL, FeedbackTag.CAREFUL],
      comment: 'Excellent travail !',
    },
  })

  console.log('Feedback créé!')
}

seedFeedbacks()
```

---

## Tests post-migration

### 1. Tester POST /api/drivers/[id]/feedback

```bash
# Récupérer un booking COMPLETED
BOOKING_ID=$(curl http://localhost:3000/api/bookings | jq -r '.bookings[] | select(.status=="COMPLETED") | .id' | head -1)

# Créer un feedback
curl -X POST http://localhost:3000/api/drivers/{driverId}/feedback \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "bookingId": "'$BOOKING_ID'",
    "rating": 5,
    "tags": ["PUNCTUAL", "CAREFUL"],
    "comment": "Test feedback"
  }'
```

### 2. Tester GET /api/drivers/[id]/stats

```bash
curl http://localhost:3000/api/drivers/{driverId}/stats | jq .
```

### 3. Tester GET /api/drivers/ranking

```bash
curl "http://localhost:3000/api/drivers/ranking?region=Île-de-France" | jq .
```

---

## Rollback (si nécessaire)

### Option 1: Migration Prisma

```bash
# Revenir à la migration précédente
npx prisma migrate resolve --rolled-back {migration_name}
```

### Option 2: SQL manuel

```sql
-- Supprimer les tables
DROP TABLE IF EXISTS driver_feedbacks CASCADE;
DROP TABLE IF EXISTS driver_badges CASCADE;
DROP TABLE IF EXISTS driver_tag_stats CASCADE;

-- Supprimer les enums
DROP TYPE IF EXISTS "FeedbackTag";
DROP TYPE IF EXISTS "BadgeType";

-- Supprimer la colonne region de driver_profiles (si nécessaire)
ALTER TABLE driver_profiles DROP COLUMN IF EXISTS region;
```

---

## Monitoring post-déploiement

### 1. Vérifier les logs

```bash
# Surveiller les erreurs
tail -f logs/app.log | grep "Error creating feedback"
```

### 2. Vérifier les performances

```sql
-- Nombre de feedbacks créés aujourd'hui
SELECT COUNT(*)
FROM driver_feedbacks
WHERE created_at >= CURRENT_DATE;

-- Temps moyen de création
EXPLAIN ANALYZE
SELECT *
FROM driver_feedbacks
WHERE driver_id = 'some_id';

-- Nombre de badges attribués aujourd'hui
SELECT COUNT(*)
FROM driver_badges
WHERE earned_at >= CURRENT_DATE;
```

### 3. Vérifier la cohérence des données

```sql
-- Vérifier que les pourcentages sont corrects
SELECT
  dp.id,
  dp.rating,
  AVG(df.rating) as avg_from_feedbacks,
  COUNT(df.id) as feedbacks_count
FROM driver_profiles dp
LEFT JOIN driver_feedbacks df ON df.driver_id = dp.id
GROUP BY dp.id, dp.rating
HAVING COUNT(df.id) > 0 AND ABS(dp.rating - AVG(df.rating)) > 0.1;

-- Vérifier les stats de tags
SELECT
  dts.*,
  (SELECT COUNT(*) FROM driver_feedbacks WHERE driver_id = dts.driver_id) as total_feedbacks
FROM driver_tag_stats dts;
```

---

## Optimisations recommandées

### 1. Indexes supplémentaires (si volume élevé)

```sql
-- Index pour le ranking régional
CREATE INDEX idx_driver_region_rating
ON driver_profiles(region, rating DESC, total_reviews DESC);

-- Index pour les feedbacks récents
CREATE INDEX idx_feedback_created
ON driver_feedbacks(driver_id, created_at DESC);
```

### 2. Vue matérialisée pour le ranking

```sql
-- Si le ranking est très sollicité
CREATE MATERIALIZED VIEW driver_ranking AS
SELECT
  dp.id,
  dp.region,
  dp.rating,
  dp.total_reviews,
  dp.total_deliveries,
  ROW_NUMBER() OVER (PARTITION BY dp.region ORDER BY dp.rating DESC, dp.total_reviews DESC) as rank
FROM driver_profiles dp
WHERE dp.total_reviews >= 5;

-- Index sur la vue
CREATE INDEX idx_ranking_region_rank
ON driver_ranking(region, rank);

-- Rafraîchir régulièrement (via CRON)
REFRESH MATERIALIZED VIEW driver_ranking;
```

---

## Checklist de déploiement

- [ ] Schéma Prisma à jour
- [ ] Migration créée et testée en dev
- [ ] Client Prisma régénéré
- [ ] Tables créées en base de données
- [ ] Indexes vérifiés
- [ ] Données de test créées
- [ ] Tests API passés (3 routes)
- [ ] Région ajoutée aux chauffeurs existants
- [ ] Logs configurés
- [ ] Monitoring mis en place
- [ ] Documentation partagée avec l'équipe
- [ ] Plan de rollback préparé

---

## Support

En cas de problème:

1. Vérifier les logs: `tail -f logs/app.log`
2. Vérifier Prisma Studio: `npx prisma studio`
3. Vérifier les tables SQL directement
4. Consulter la documentation: `/src/app/api/drivers/README.md`
5. Exécuter les tests: `/src/app/api/drivers/__tests__/feedback.test.md`

---

## Contact

Pour toute question sur cette migration, consulter:
- Documentation API: `/src/app/api/drivers/README.md`
- Résumé complet: `/DRIVER_FEEDBACK_API_SUMMARY.md`
- Code source: `/src/app/api/drivers/` et `/src/lib/utils/badges.ts`
