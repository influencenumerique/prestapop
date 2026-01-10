# Guide de test de l'authentification API

## Prérequis

1. Créer des utilisateurs de test dans la base de données:
   - Un utilisateur avec `Role.COMPANY` et un profil `Company`
   - Un utilisateur avec `Role.DRIVER` et un profil `DriverProfile`

## Tests avec curl/Postman

### 1. Test d'authentification de base

```bash
# Sans authentification (devrait retourner 401)
curl -X GET http://localhost:3000/api/jobs

# Avec authentification
curl -X GET http://localhost:3000/api/jobs \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### 2. Tests Role.COMPANY

#### Créer une mission (COMPANY seulement)
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN" \
  -d '{
    "title": "Livraison Paris 11e - Urgent",
    "description": "Tournée de livraison dans le 11e arrondissement",
    "typeMission": "DAY",
    "missionZoneType": "URBAN",
    "secteurLivraison": "Paris 11e, 12e",
    "packageSize": "MEDIUM",
    "nombreColis": 25,
    "startTime": "2026-01-15T08:00:00Z",
    "estimatedEndTime": "2026-01-15T18:00:00Z",
    "vehicleVolume": "CUBE_9M",
    "needsTailLift": false,
    "dayRate": 15000
  }'
```

#### Modifier sa propre mission (COMPANY propriétaire)
```bash
curl -X PATCH http://localhost:3000/api/jobs/JOB_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN" \
  -d '{
    "dayRate": 17000,
    "nombreColis": 30
  }'
```

#### Supprimer sa propre mission (COMPANY propriétaire, status OPEN)
```bash
curl -X DELETE http://localhost:3000/api/jobs/JOB_ID \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN"
```

#### Voir les candidatures (COMPANY)
```bash
curl -X GET http://localhost:3000/api/bookings \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN"
```

### 3. Tests Role.DRIVER

#### Consulter les missions disponibles (DRIVER)
```bash
curl -X GET "http://localhost:3000/api/jobs?secteur=Paris&vehicleVolume=CUBE_9M" \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN"
```

#### Postuler à une mission (DRIVER disponible)
```bash
curl -X POST http://localhost:3000/api/jobs/JOB_ID/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN" \
  -d '{
    "proposedPrice": 15000,
    "message": "Disponible immédiatement, 5 ans d'expérience"
  }'
```

#### Voir ses candidatures (DRIVER)
```bash
curl -X GET http://localhost:3000/api/bookings \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN"
```

#### Mettre à jour le statut d'une mission (DRIVER)
```bash
curl -X PATCH http://localhost:3000/api/bookings/BOOKING_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN" \
  -d '{
    "status": "IN_PROGRESS",
    "driverNotes": "Colis récupérés, départ en cours"
  }'
```

### 4. Tests d'erreurs attendues

#### DRIVER tente de créer une mission (403)
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN" \
  -d '{ ... }'
# Expected: {"error": "Accès réservé aux entreprises (Role.COMPANY)."}
```

#### COMPANY tente de postuler (403)
```bash
curl -X POST http://localhost:3000/api/jobs/JOB_ID/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN" \
  -d '{ ... }'
# Expected: {"error": "Accès réservé aux chauffeurs (Role.DRIVER)."}
```

#### COMPANY tente de modifier la mission d'un autre (403)
```bash
curl -X PATCH http://localhost:3000/api/jobs/OTHER_COMPANY_JOB_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=COMPANY_TOKEN" \
  -d '{ ... }'
# Expected: {"error": "Vous n'êtes pas autorisé à modifier cette mission"}
```

#### DRIVER tente de postuler deux fois (400)
```bash
curl -X POST http://localhost:3000/api/jobs/JOB_ID/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN" \
  -d '{ ... }'
# Expected: {"error": "Vous avez déjà postulé à cette mission"}
```

#### DRIVER non disponible tente de postuler (400)
```bash
# Mettre isAvailable = false dans DriverProfile
curl -X POST http://localhost:3000/api/jobs/JOB_ID/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=DRIVER_TOKEN" \
  -d '{ ... }'
# Expected: {"error": "Vous n'êtes pas disponible actuellement"}
```

---

## Tests avec Postman

### Configuration de l'environnement

1. Créer un environnement Postman avec:
   - `BASE_URL` = `http://localhost:3000`
   - `COMPANY_TOKEN` = votre token de session company
   - `DRIVER_TOKEN` = votre token de session driver

2. Importer la collection ci-dessous:

```json
{
  "info": {
    "name": "Prestapop API - Auth Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Jobs",
      "item": [
        {
          "name": "Get Jobs (Authenticated)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Cookie",
                "value": "next-auth.session-token={{COMPANY_TOKEN}}",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{BASE_URL}}/api/jobs",
              "host": ["{{BASE_URL}}"],
              "path": ["api", "jobs"]
            }
          }
        },
        {
          "name": "Create Job (COMPANY)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Cookie",
                "value": "next-auth.session-token={{COMPANY_TOKEN}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Livraison Paris 11e\",\n  \"typeMission\": \"DAY\",\n  \"missionZoneType\": \"URBAN\",\n  \"secteurLivraison\": \"Paris 11e\",\n  \"packageSize\": \"MEDIUM\",\n  \"nombreColis\": 25,\n  \"startTime\": \"2026-01-15T08:00:00Z\",\n  \"estimatedEndTime\": \"2026-01-15T18:00:00Z\",\n  \"vehicleVolume\": \"CUBE_9M\",\n  \"needsTailLift\": false,\n  \"dayRate\": 15000\n}"
            },
            "url": {
              "raw": "{{BASE_URL}}/api/jobs",
              "host": ["{{BASE_URL}}"],
              "path": ["api", "jobs"]
            }
          }
        },
        {
          "name": "Apply to Job (DRIVER)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Cookie",
                "value": "next-auth.session-token={{DRIVER_TOKEN}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"proposedPrice\": 15000,\n  \"message\": \"Disponible immédiatement\"\n}"
            },
            "url": {
              "raw": "{{BASE_URL}}/api/jobs/:id/apply",
              "host": ["{{BASE_URL}}"],
              "path": ["api", "jobs", ":id", "apply"],
              "variable": [
                {
                  "key": "id",
                  "value": "JOB_ID"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Bookings",
      "item": [
        {
          "name": "Get My Bookings (DRIVER)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Cookie",
                "value": "next-auth.session-token={{DRIVER_TOKEN}}"
              }
            ],
            "url": {
              "raw": "{{BASE_URL}}/api/bookings",
              "host": ["{{BASE_URL}}"],
              "path": ["api", "bookings"]
            }
          }
        },
        {
          "name": "Update Booking Status (DRIVER)",
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Cookie",
                "value": "next-auth.session-token={{DRIVER_TOKEN}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"IN_PROGRESS\"\n}"
            },
            "url": {
              "raw": "{{BASE_URL}}/api/bookings/:id",
              "host": ["{{BASE_URL}}"],
              "path": ["api", "bookings", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "BOOKING_ID"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Tests automatisés avec Jest

Créer un fichier `tests/api/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals'

describe('API Authentication Tests', () => {
  let companyToken: string
  let driverToken: string
  let jobId: string

  beforeAll(async () => {
    // Setup: Créer des utilisateurs de test et obtenir leurs tokens
    // companyToken = await createTestCompany()
    // driverToken = await createTestDriver()
  })

  describe('GET /api/jobs', () => {
    it('devrait retourner 401 sans authentification', async () => {
      const res = await fetch('http://localhost:3000/api/jobs')
      expect(res.status).toBe(401)
    })

    it('devrait retourner 200 pour un utilisateur authentifié', async () => {
      const res = await fetch('http://localhost:3000/api/jobs', {
        headers: { Cookie: \`next-auth.session-token=\${companyToken}\` }
      })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/jobs', () => {
    it('devrait permettre à COMPANY de créer une mission', async () => {
      const res = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: \`next-auth.session-token=\${companyToken}\`
        },
        body: JSON.stringify({
          title: 'Test Mission',
          typeMission: 'DAY',
          missionZoneType: 'URBAN',
          secteurLivraison: 'Paris',
          packageSize: 'MEDIUM',
          nombreColis: 10,
          startTime: new Date().toISOString(),
          estimatedEndTime: new Date().toISOString(),
          vehicleVolume: 'CUBE_9M',
          needsTailLift: false,
          dayRate: 10000
        })
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      jobId = data.id
    })

    it('devrait bloquer DRIVER de créer une mission', async () => {
      const res = await fetch('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: \`next-auth.session-token=\${driverToken}\`
        },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/jobs/:id/apply', () => {
    it('devrait permettre à DRIVER de postuler', async () => {
      const res = await fetch(\`http://localhost:3000/api/jobs/\${jobId}/apply\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: \`next-auth.session-token=\${driverToken}\`
        },
        body: JSON.stringify({ message: 'Disponible' })
      })
      expect(res.status).toBe(200)
    })

    it('devrait bloquer COMPANY de postuler', async () => {
      const res = await fetch(\`http://localhost:3000/api/jobs/\${jobId}/apply\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: \`next-auth.session-token=\${companyToken}\`
        },
        body: JSON.stringify({})
      })
      expect(res.status).toBe(403)
    })
  })
})
```

---

## Checklist de validation

### Authentification de base
- [ ] Sans token → 401
- [ ] Token invalide → 401
- [ ] Token valide → 200

### Autorisations COMPANY
- [ ] Créer mission → 200
- [ ] Modifier sa mission → 200
- [ ] Supprimer sa mission → 200
- [ ] Modifier mission d'un autre → 403
- [ ] Voir ses bookings → 200
- [ ] Postuler à mission → 403

### Autorisations DRIVER
- [ ] Voir missions → 200
- [ ] Postuler à mission → 200
- [ ] Postuler deux fois → 400
- [ ] Voir ses bookings → 200
- [ ] Mettre à jour son booking → 200
- [ ] Créer mission → 403

### Validations métier
- [ ] Driver non disponible ne peut pas postuler → 400
- [ ] Mission OPEN peut être supprimée → 200
- [ ] Mission IN_PROGRESS ne peut pas être supprimée → 400
- [ ] Status booking se synchronise avec Job → OK
- [ ] totalDeliveries s'incrémente quand COMPLETED → OK
