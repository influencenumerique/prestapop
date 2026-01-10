# Résumé des Routes API - PrestaPop Transport

## Routes Stripe (Paiements)

### 1. POST /api/stripe/checkout
Crée une session Stripe Checkout pour payer une mission.

**Authentification :** Company uniquement
**Body :**
```json
{
  "bookingId": "string"
}
```

**Response 200 :**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Erreurs :**
- 401 : Non autorisé
- 403 : Pas le propriétaire de la mission
- 404 : Réservation non trouvée
- 400 : Mission pas livrée ou déjà payée

---

### 2. POST /api/stripe/payment-intent
Crée un PaymentIntent pour paiement via Stripe Elements.

**Authentification :** Company uniquement
**Body :**
```json
{
  "bookingId": "string"
}
```

**Response 200 :**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

---

### 3. GET /api/stripe/payment-intent?bookingId=xxx
Récupère le statut d'un paiement.

**Authentification :** Company ou Driver
**Query params :**
- `bookingId` (required)

**Response 200 :**
```json
{
  "status": "succeeded",
  "amount": 15000,
  "currency": "eur",
  "created": 1234567890,
  "paidAt": "2026-01-09T12:00:00Z"
}
```

---

### 4. POST /api/stripe/refund
Crée un remboursement.

**Authentification :** Company uniquement
**Body :**
```json
{
  "bookingId": "string",
  "reason": "requested_by_customer" // optional
}
```

**Response 200 :**
```json
{
  "success": true,
  "refundId": "re_xxx",
  "amount": 15000,
  "status": "succeeded",
  "message": "Remboursement effectué avec succès"
}
```

---

### 5. GET /api/stripe/refund?bookingId=xxx
Récupère les informations de remboursement.

**Authentification :** Company ou Driver
**Query params :**
- `bookingId` (required)

**Response 200 :**
```json
{
  "refunded": true,
  "refunds": [
    {
      "id": "re_xxx",
      "amount": 15000,
      "currency": "eur",
      "status": "succeeded",
      "reason": "requested_by_customer",
      "created": 1234567890
    }
  ]
}
```

---

### 6. POST /api/stripe/webhook
Webhook Stripe (interne, appelé par Stripe).

**Événements gérés :**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`

---

## Routes Jobs (Missions)

### 7. GET /api/jobs
Liste les missions ouvertes.

**Authentification :** Optionnelle
**Query params :**
- `status` (optional) : OPEN, ASSIGNED, etc.
- `city` (optional)
- `typeMission` (optional) : DAY, HALF_DAY, WEEK
- `missionZoneType` (optional) : URBAN, CITY_TO_CITY

**Response 200 :**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "typeMission": "DAY",
    "missionZoneType": "URBAN",
    "secteurLivraison": "Paris 11e, 12e",
    "packageSize": "MIXED",
    "nombreColis": 50,
    "startTime": "2026-01-09T08:00:00Z",
    "estimatedEndTime": "2026-01-09T18:00:00Z",
    "vehicleVolume": "CUBE_12M",
    "needsTailLift": false,
    "dayRate": 15000,
    "status": "OPEN",
    "company": {
      "companyName": "string",
      "logo": "string"
    }
  }
]
```

---

### 8. POST /api/jobs
Crée une nouvelle mission.

**Authentification :** Company uniquement
**Body :**
```json
{
  "title": "string",
  "description": "string",
  "typeMission": "DAY",
  "missionZoneType": "URBAN",
  "secteurLivraison": "Paris 11e, 12e",
  "packageSize": "MIXED",
  "nombreColis": 50,
  "startTime": "2026-01-09T08:00:00Z",
  "estimatedEndTime": "2026-01-09T18:00:00Z",
  "vehicleVolume": "CUBE_12M",
  "needsTailLift": false,
  "dayRate": 15000,
  "status": "OPEN"
}
```

**Response 201 :**
```json
{
  "id": "string",
  "title": "string",
  // ... (même structure que GET)
}
```

---

### 9. GET /api/jobs/[id]
Récupère une mission par ID.

**Authentification :** Optionnelle
**Response 200 :**
```json
{
  "id": "string",
  "title": "string",
  // ... (même structure que GET /api/jobs)
  "bookings": [
    {
      "id": "string",
      "driverId": "string",
      "status": "ASSIGNED",
      "agreedPrice": 15000,
      "driver": {
        "user": {
          "name": "string"
        }
      }
    }
  ]
}
```

---

### 10. PATCH /api/jobs/[id]
Met à jour une mission.

**Authentification :** Company propriétaire uniquement
**Body :**
```json
{
  "title": "string",
  "status": "OPEN",
  // ... (champs à mettre à jour)
}
```

---

### 11. DELETE /api/jobs/[id]
Supprime une mission.

**Authentification :** Company propriétaire uniquement
**Response 200 :**
```json
{
  "message": "Mission supprimée"
}
```

---

### 12. POST /api/jobs/[id]/apply
Postuler à une mission (Driver).

**Authentification :** Driver uniquement
**Body :**
```json
{
  "proposedPrice": 15000, // optional
  "message": "string" // optional
}
```

**Response 201 :**
```json
{
  "id": "string",
  "jobId": "string",
  "driverId": "string",
  "status": "ASSIGNED",
  "agreedPrice": 15000,
  "driverNotes": "string"
}
```

---

## Routes Bookings (Réservations)

### 13. GET /api/bookings
Liste les réservations de l'utilisateur.

**Authentification :** Company ou Driver
**Query params :**
- `status` (optional) : ASSIGNED, IN_PROGRESS, DELIVERED, etc.

**Response 200 :**
```json
[
  {
    "id": "string",
    "jobId": "string",
    "driverId": "string",
    "status": "ASSIGNED",
    "agreedPrice": 15000,
    "stripePaymentStatus": "pending",
    "paidAt": null,
    "job": {
      "title": "string",
      "typeMission": "DAY",
      "company": {
        "companyName": "string"
      }
    },
    "driver": {
      "user": {
        "name": "string"
      }
    }
  }
]
```

---

### 14. GET /api/bookings/[id]
Récupère une réservation par ID.

**Authentification :** Company ou Driver concerné
**Response 200 :**
```json
{
  "id": "string",
  "jobId": "string",
  "driverId": "string",
  "status": "DELIVERED",
  "agreedPrice": 15000,
  "pickedUpAt": "2026-01-09T08:00:00Z",
  "deliveredAt": "2026-01-09T18:00:00Z",
  "stripePaymentId": "pi_xxx",
  "stripePaymentStatus": "succeeded",
  "paidAt": "2026-01-09T18:30:00Z",
  "job": { /* ... */ },
  "driver": { /* ... */ },
  "review": null
}
```

---

### 15. PATCH /api/bookings/[id]
Met à jour une réservation (statut, suivi).

**Authentification :** Company ou Driver concerné
**Body :**
```json
{
  "status": "DELIVERED",
  "deliveredAt": "2026-01-09T18:00:00Z",
  "proofOfDelivery": "https://...",
  "driverNotes": "string"
}
```

**Response 200 :**
```json
{
  "id": "string",
  "status": "DELIVERED",
  // ... (même structure que GET)
}
```

---

### 16. POST /api/bookings/[id]/review
Laisser un avis sur une mission.

**Authentification :** Company ou Driver concerné
**Body :**
```json
{
  "rating": 5,
  "comment": "string"
}
```

**Response 201 :**
```json
{
  "id": "string",
  "bookingId": "string",
  "userId": "string",
  "rating": 5,
  "comment": "string",
  "createdAt": "2026-01-09T18:30:00Z"
}
```

---

## Routes Auth (Authentification)

### 17. POST /api/auth/register
Inscription d'un nouvel utilisateur.

**Body :**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "COMPANY" // ou "DRIVER"
}
```

**Response 201 :**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "COMPANY"
}
```

---

### 18. POST /api/auth/[...nextauth]
Connexion NextAuth (handled by NextAuth.js).

**Providers :**
- Credentials (email + password)
- Google (optionnel)

---

## Routes Users (Utilisateurs)

### 19. GET /api/users/me
Récupère les informations de l'utilisateur connecté.

**Authentification :** Requise
**Response 200 :**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "COMPANY",
  "company": {
    "id": "string",
    "companyName": "string",
    "siret": "string"
  },
  "driverProfile": null
}
```

---

### 20. POST /api/users/become-freelancer
Créer un profil Driver (pour utilisateurs existants).

**Authentification :** Requise
**Body :**
```json
{
  "phone": "string",
  "city": "string",
  "vehicleTypes": ["VAN", "TRUCK"],
  "bio": "string"
}
```

**Response 201 :**
```json
{
  "id": "string",
  "userId": "string",
  "phone": "string",
  "city": "string",
  "vehicleTypes": ["VAN", "TRUCK"],
  "isVerified": false,
  "isAvailable": true
}
```

---

## Codes d'Erreur Communs

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Headers Requis

```
Content-Type: application/json
Cookie: next-auth.session-token=...
```

---

## Pagination (à implémenter)

Pour les routes GET qui retournent des listes, il est recommandé d'ajouter :

**Query params :**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response :**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Rate Limiting (à implémenter)

Recommandations :
- **Auth routes** : 5 req/min
- **Read routes** : 100 req/min
- **Write routes** : 30 req/min
- **Webhook** : Illimité (Stripe IP whitelist)

---

## Webhooks à Configurer

### Stripe Webhook
**URL :** `https://votredomaine.com/api/stripe/webhook`
**Événements :**
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
- account.updated

**Headers :**
- Stripe-Signature (automatique)

---

## Documentation Complète

- **Intégration Stripe** : `/STRIPE_INTEGRATION.md`
- **Phase API Jobs** : `/PHASE_API_JOBS_STRIPE.md`
- **Exemples Frontend** : `/STRIPE_FRONTEND_EXAMPLES.md`
- **Schéma Prisma** : `/prisma/schema.prisma`

---

## Postman Collection (à créer)

Pour faciliter les tests, créer une collection Postman avec :
- Toutes les routes
- Exemples de payloads
- Variables d'environnement
- Tests automatisés

---

## Support

Pour toute question :
- Consulter les fichiers de documentation
- Vérifier le code dans `/src/app/api/`
- Consulter les types dans `/src/lib/types/`
