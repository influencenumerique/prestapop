# Guide de test - API Jobs Candidatures et Annulation

## Prérequis

1. Avoir une base de données avec des données de test
2. Avoir au moins un compte COMPANY et un compte DRIVER
3. Avoir au moins une mission créée
4. Avoir au moins une candidature (booking) sur la mission

## Configuration des variables d'environnement

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## 1. Test de la route GET /api/jobs/[id]/candidatures

### Scénario 1: Accès réussi (Company propriétaire)

```bash
# 1. Se connecter en tant que Company
# 2. Récupérer le jobId d'une mission que vous avez créée
# 3. Tester la route

curl -X GET \
  http://localhost:3000/api/jobs/[JOB_ID]/candidatures \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (200):**
```json
{
  "jobId": "clxxx...",
  "jobTitle": "Livraison Paris 12e",
  "candidatures": [
    {
      "bookingId": "clxxx...",
      "driverId": "clxxx...",
      "driverName": "John Doe",
      "driverProfilePicture": "https://...",
      "vehicle": ["VAN"],
      "rating": 4.5,
      "totalDeliveries": 42,
      "appliedAt": "2026-01-14T10:30:00.000Z",
      "status": "PENDING",
      "agreedPrice": 12000,
      "driverNotes": "Je suis disponible !",
      "stripePaymentStatus": "pending_company_payment",
      "driverCity": "Paris",
      "driverIsVerified": true,
      "driverIsAvailable": true
    }
  ],
  "total": 1
}
```

### Scénario 2: Accès refusé (Company non propriétaire)

```bash
# 1. Se connecter avec un compte COMPANY différent
# 2. Essayer d'accéder aux candidatures d'une mission d'une autre company

curl -X GET \
  http://localhost:3000/api/jobs/[OTHER_COMPANY_JOB_ID]/candidatures \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (403):**
```json
{
  "error": "Vous n'êtes pas autorisé à voir les candidatures de cette mission"
}
```

### Scénario 3: Accès refusé (Driver)

```bash
# 1. Se connecter avec un compte DRIVER
# 2. Essayer d'accéder aux candidatures

curl -X GET \
  http://localhost:3000/api/jobs/[JOB_ID]/candidatures \
  -H "Cookie: next-auth.session-token=YOUR_DRIVER_SESSION_TOKEN"
```

**Réponse attendue (403):**
```json
{
  "error": "Accès réservé aux entreprises (Role.COMPANY)."
}
```

### Scénario 4: Mission inexistante

```bash
curl -X GET \
  http://localhost:3000/api/jobs/invalid-id/candidatures \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (404):**
```json
{
  "error": "Mission non trouvée"
}
```

### Scénario 5: Non authentifié

```bash
curl -X GET \
  http://localhost:3000/api/jobs/[JOB_ID]/candidatures
```

**Réponse attendue (401):**
```json
{
  "error": "Non authentifié. Veuillez vous connecter."
}
```

---

## 2. Test de la route PATCH /api/jobs/[id]/cancel

### Scénario 1: Annulation réussie (status OPEN)

```bash
# 1. Créer une mission avec status OPEN
# 2. Se connecter en tant que Company propriétaire
# 3. Annuler la mission

curl -X PATCH \
  http://localhost:3000/api/jobs/[JOB_ID]/cancel \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue (200):**
```json
{
  "success": true,
  "message": "Mission annulée avec succès",
  "job": {
    "id": "clxxx...",
    "status": "CANCELLED",
    "title": "Livraison Paris 12e",
    // ... autres champs
  },
  "pendingBookingsCount": 2
}
```

### Scénario 2: Annulation réussie (status DRAFT)

```bash
# Même requête avec une mission en DRAFT
curl -X PATCH \
  http://localhost:3000/api/jobs/[DRAFT_JOB_ID]/cancel \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (200):**
```json
{
  "success": true,
  "message": "Mission annulée avec succès",
  "job": { ... },
  "pendingBookingsCount": 0
}
```

### Scénario 3: Annulation refusée (status ASSIGNED)

```bash
# Mission déjà assignée à un chauffeur
curl -X PATCH \
  http://localhost:3000/api/jobs/[ASSIGNED_JOB_ID]/cancel \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (400):**
```json
{
  "error": "Impossible d'annuler une mission avec le statut \"ASSIGNED\". Seules les missions en \"DRAFT\" ou \"OPEN\" peuvent être annulées.",
  "currentStatus": "ASSIGNED",
  "allowedStatuses": ["DRAFT", "OPEN"]
}
```

### Scénario 4: Annulation refusée (Company non propriétaire)

```bash
# Se connecter avec une autre company
curl -X PATCH \
  http://localhost:3000/api/jobs/[OTHER_COMPANY_JOB_ID]/cancel \
  -H "Cookie: next-auth.session-token=OTHER_COMPANY_SESSION_TOKEN"
```

**Réponse attendue (403):**
```json
{
  "error": "Vous n'êtes pas autorisé à annuler cette mission"
}
```

### Scénario 5: Annulation refusée (Driver)

```bash
# Se connecter avec un compte DRIVER
curl -X PATCH \
  http://localhost:3000/api/jobs/[JOB_ID]/cancel \
  -H "Cookie: next-auth.session-token=YOUR_DRIVER_SESSION_TOKEN"
```

**Réponse attendue (403):**
```json
{
  "error": "Accès réservé aux entreprises (Role.COMPANY)."
}
```

### Scénario 6: Mission inexistante

```bash
curl -X PATCH \
  http://localhost:3000/api/jobs/invalid-id/cancel \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (404):**
```json
{
  "error": "Mission non trouvée"
}
```

---

## 3. Tests depuis le navigateur (via Console)

### Test GET candidatures

```javascript
// Ouvrir DevTools Console sur http://localhost:3000
// S'assurer d'être connecté en tant que COMPANY

const jobId = 'clxxx...' // Remplacer par un vrai ID

fetch(`/api/jobs/${jobId}/candidatures`)
  .then(res => res.json())
  .then(data => console.log('Candidatures:', data))
  .catch(err => console.error('Error:', err))
```

### Test PATCH cancel

```javascript
// Ouvrir DevTools Console sur http://localhost:3000
// S'assurer d'être connecté en tant que COMPANY

const jobId = 'clxxx...' // Remplacer par un vrai ID

fetch(`/api/jobs/${jobId}/cancel`, {
  method: 'PATCH',
})
  .then(res => res.json())
  .then(data => console.log('Annulation:', data))
  .catch(err => console.error('Error:', err))
```

---

## 4. Tests d'intégration avec la base de données

### Préparer les données de test

```sql
-- 1. Créer une mission de test
INSERT INTO jobs (
  id,
  company_id,
  title,
  status,
  secteur_livraison,
  nombre_colis,
  start_time,
  estimated_end_time,
  vehicle_volume,
  day_rate
) VALUES (
  'test-job-001',
  '[COMPANY_ID]',
  'Mission de test - Candidatures',
  'OPEN',
  'Paris 12e',
  10,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '8 hours',
  'CUBE_9M',
  15000
);

-- 2. Créer des candidatures (bookings)
INSERT INTO bookings (
  id,
  job_id,
  driver_id,
  status,
  agreed_price,
  driver_notes,
  stripe_payment_status
) VALUES
(
  'test-booking-001',
  'test-job-001',
  '[DRIVER_ID_1]',
  'PENDING',
  15000,
  'Je suis disponible et motivé !',
  'pending_company_payment'
),
(
  'test-booking-002',
  'test-job-001',
  '[DRIVER_ID_2]',
  'PENDING',
  15000,
  'Véhicule conforme, prêt à démarrer',
  'pending_company_payment'
);
```

### Vérifier les résultats après annulation

```sql
-- Vérifier que le statut de la mission est bien CANCELLED
SELECT id, title, status, updated_at
FROM jobs
WHERE id = 'test-job-001';

-- Les bookings doivent toujours exister (pas supprimés)
SELECT id, job_id, driver_id, status
FROM bookings
WHERE job_id = 'test-job-001';
```

---

## 5. Tests avec Postman ou Insomnia

### Collection Postman

```json
{
  "info": {
    "name": "Jobs API - Candidatures & Cancel",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Candidatures",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/jobs/{{job_id}}/candidatures",
          "host": ["{{base_url}}"],
          "path": ["api", "jobs", "{{job_id}}", "candidatures"]
        }
      }
    },
    {
      "name": "Cancel Job",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/jobs/{{job_id}}/cancel",
          "host": ["{{base_url}}"],
          "path": ["api", "jobs", "{{job_id}}", "cancel"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "job_id",
      "value": "clxxx..."
    }
  ]
}
```

---

## 6. Tests automatisés (Jest/Vitest)

### Exemple de test unitaire

```typescript
// __tests__/api/jobs/candidatures.test.ts

import { GET } from '@/app/api/jobs/[id]/candidatures/route'
import { requireRole, isCompanyOwner } from '@/lib/api-auth'
import { db } from '@/lib/db'

jest.mock('@/lib/api-auth')
jest.mock('@/lib/db')

describe('GET /api/jobs/[id]/candidatures', () => {
  it('should return candidatures for company owner', async () => {
    // Mock auth
    (requireRole as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        company: { id: 'company-1' }
      }
    })

    // Mock isCompanyOwner
    (isCompanyOwner as jest.Mock).mockReturnValue(true)

    // Mock database
    (db.job.findUnique as jest.Mock).mockResolvedValue({
      id: 'job-1',
      companyId: 'company-1',
      title: 'Test Job'
    })

    (db.booking.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'booking-1',
        jobId: 'job-1',
        driverId: 'driver-1',
        status: 'PENDING',
        driver: {
          id: 'driver-1',
          rating: 4.5,
          user: { name: 'Test Driver' }
        }
      }
    ])

    const req = new Request('http://localhost:3000/api/jobs/job-1/candidatures')
    const params = Promise.resolve({ id: 'job-1' })

    const response = await GET(req, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.candidatures).toHaveLength(1)
    expect(data.candidatures[0].driverName).toBe('Test Driver')
  })

  it('should return 403 for non-owner company', async () => {
    (requireRole as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-2',
        company: { id: 'company-2' }
      }
    })

    (isCompanyOwner as jest.Mock).mockReturnValue(false)

    (db.job.findUnique as jest.Mock).mockResolvedValue({
      id: 'job-1',
      companyId: 'company-1'
    })

    const req = new Request('http://localhost:3000/api/jobs/job-1/candidatures')
    const params = Promise.resolve({ id: 'job-1' })

    const response = await GET(req, { params })

    expect(response.status).toBe(403)
  })
})
```

---

## 7. Checklist de test complète

### Route GET /api/jobs/[id]/candidatures

- [ ] Accès autorisé pour company propriétaire (200)
- [ ] Accès refusé pour company non propriétaire (403)
- [ ] Accès refusé pour driver (403)
- [ ] Accès refusé sans authentification (401)
- [ ] Mission inexistante (404)
- [ ] Mission sans candidatures (200 avec tableau vide)
- [ ] Mission avec plusieurs candidatures (200 avec liste)
- [ ] Candidature avec toutes les infos du chauffeur
- [ ] Vérification du tri par date (plus récent d'abord)

### Route PATCH /api/jobs/[id]/cancel

- [ ] Annulation réussie pour mission DRAFT (200)
- [ ] Annulation réussie pour mission OPEN (200)
- [ ] Annulation refusée pour mission ASSIGNED (400)
- [ ] Annulation refusée pour mission IN_PROGRESS (400)
- [ ] Annulation refusée pour mission COMPLETED (400)
- [ ] Accès refusé pour company non propriétaire (403)
- [ ] Accès refusé pour driver (403)
- [ ] Accès refusé sans authentification (401)
- [ ] Mission inexistante (404)
- [ ] Vérification que le statut passe bien à CANCELLED
- [ ] Vérification que updated_at est mis à jour
- [ ] Vérification du comptage des candidatures affectées

---

## 8. Monitoring en production

### Métriques à surveiller

```typescript
// Exemple avec un service de monitoring
analytics.track('job_candidatures_viewed', {
  jobId: string,
  companyId: string,
  candidaturesCount: number,
  timestamp: Date
})

analytics.track('job_cancelled', {
  jobId: string,
  companyId: string,
  previousStatus: string,
  pendingBookingsCount: number,
  timestamp: Date
})
```

### Logs à surveiller

```
[INFO] GET /api/jobs/[id]/candidatures - Company: company-1, Job: job-1, Candidatures: 3
[INFO] PATCH /api/jobs/[id]/cancel - Company: company-1, Job: job-1, Status: OPEN -> CANCELLED
[WARN] PATCH /api/jobs/[id]/cancel - Attempted cancellation of ASSIGNED job by company-1
[ERROR] GET /api/jobs/[id]/candidatures - Unauthorized access attempt by driver-1
```

---

## Résumé

Les deux nouvelles routes sont maintenant prêtes à être testées. Utilisez ce guide pour valider:

1. La sécurité et les autorisations RBAC
2. La logique métier (annulation selon le statut)
3. Les réponses et codes HTTP appropriés
4. L'intégrité des données dans la base

N'oubliez pas de tester aussi les cas limites et les erreurs inattendues.
