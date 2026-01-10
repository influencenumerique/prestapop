# API No-Show + Sanctions + Refund - Guide de Test

## Vue d'ensemble

Cette documentation décrit les 3 nouveaux endpoints pour gérer les no-shows (chauffeur absent), les sanctions automatiques, et les remboursements Stripe.

## Architecture

### Workflow complet
```
1. Entreprise signale no-show → POST /api/bookings/:id/report-no-show
2. Admin/Chauffeur confirme → PATCH /api/bookings/:id/confirm-no-show
3. Sanctions automatiques appliquées (strike 1/2/3)
4. Entreprise demande remboursement → PATCH /api/bookings/:id/refund
5. Webhook Stripe confirme → stripePaymentStatus = "refunded"
```

### Contraintes techniques
- **Pas de modification du schema Prisma** : Utilisation des champs existants (companyNotes, driverNotes, bio)
- **Statuts JobStatus existants** : ASSIGNED, IN_PROGRESS, DELIVERED, COMPLETED, CANCELLED
- **Tracking via notes** : Les marqueurs "NO_SHOW_REPORTED:", "NO_SHOW_CONFIRMED:", etc. sont stockés dans les champs notes
- **Sanctions dans bio** : Les strikes sont temporairement stockés dans `DriverProfile.bio` en attendant une migration schema

---

## 1. POST /api/bookings/:id/report-no-show

### Description
L'entreprise signale qu'un chauffeur ne s'est pas présenté à une mission.

### Authentification
- **Rôle requis** : `COMPANY`
- **Autorisation** : Propriétaire de la mission (companyId)

### Conditions préalables
- Booking status = `ASSIGNED` ou `IN_PROGRESS`
- Pas déjà de marqueur "NO_SHOW_REPORTED:" dans companyNotes

### Request

**Endpoint** : `POST /api/bookings/{bookingId}/report-no-show`

**Headers** :
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Body** :
```json
{
  "comment": "Le chauffeur ne s'est pas présenté au point de rendez-vous à 8h. J'ai tenté de l'appeler 3 fois sans réponse.",
  "evidence": "https://example.com/photo-preuve.jpg"
}
```

**Validation** :
- `comment` : string, min 10 caractères, **obligatoire**
- `evidence` : URL valide, optionnel

### Response Success (200)

```json
{
  "success": true,
  "message": "No-show signalé avec succès. Le chauffeur a été notifié.",
  "booking": {
    "id": "booking123",
    "status": "ASSIGNED",
    "companyNotes": "NO_SHOW_REPORTED: [2026-01-10T10:30:00.000Z] Le chauffeur ne s'est pas présenté au point de rendez-vous à 8h...\nPreuve: https://example.com/photo-preuve.jpg",
    "updatedAt": "2026-01-10T10:30:00.000Z",
    ...
  },
  "nextStep": "Un administrateur ou le chauffeur peut maintenant confirmer ou contester ce signalement."
}
```

### Response Errors

**404 - Booking not found**
```json
{
  "error": "Réservation non trouvée"
}
```

**403 - Unauthorized**
```json
{
  "error": "Vous n'êtes pas autorisé à signaler un no-show pour cette mission"
}
```

**400 - Invalid status**
```json
{
  "error": "Le no-show ne peut être signalé que pour une mission assignée ou en cours",
  "currentStatus": "COMPLETED"
}
```

**400 - Already reported**
```json
{
  "error": "Le no-show a déjà été signalé pour cette mission"
}
```

**400 - Validation error**
```json
{
  "error": "Données invalides",
  "details": [
    {
      "code": "too_small",
      "minimum": 10,
      "path": ["comment"],
      "message": "Le commentaire doit contenir au moins 10 caractères"
    }
  ]
}
```

### Test Postman

```javascript
// Test 1: Report no-show valide
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains success message", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.booking.companyNotes).to.include("NO_SHOW_REPORTED:");
});
```

---

## 2. PATCH /api/bookings/:id/confirm-no-show

### Description
Admin ou chauffeur confirme ou conteste le no-show signalé. Si confirmé, applique les sanctions automatiques.

### Authentification
- **Rôles requis** : `ADMIN` ou `DRIVER`
- **Autorisation** :
  - Admin : accès à tous les bookings
  - Driver : uniquement ses propres bookings (driverId)

### Conditions préalables
- Présence de marqueur "NO_SHOW_REPORTED:" dans companyNotes
- Pas encore de marqueur "NO_SHOW_CONFIRMED:" ou "NO_SHOW_CONTESTED:"

### Request

**Endpoint** : `PATCH /api/bookings/{bookingId}/confirm-no-show`

**Headers** :
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Body - Confirmer le no-show** :
```json
{
  "confirmed": true,
  "adminComment": "Après investigation, le no-show est confirmé. Aucune raison valable fournie."
}
```

**Body - Contester le no-show** :
```json
{
  "confirmed": false,
  "adminComment": "Le chauffeur a fourni des preuves d'un accident qui l'a empêché de se présenter."
}
```

**Validation** :
- `confirmed` : boolean, **obligatoire**
- `adminComment` : string, optionnel

### Response Success - Confirmé (200)

```json
{
  "success": true,
  "message": "No-show confirmé. Sanction appliquée: AVERTISSEMENT - 1er no-show",
  "booking": {
    "id": "booking123",
    "status": "CANCELLED",
    "companyNotes": "NO_SHOW_REPORTED: [...]\n\nNO_SHOW_CONFIRMED: [2026-01-10T11:00:00.000Z] Par ADMIN admin@example.com\nCommentaire: Après investigation...\nSanction: AVERTISSEMENT - 1er no-show",
    ...
  },
  "sanction": {
    "strikeCount": 1,
    "message": "AVERTISSEMENT - 1er no-show",
    "isBanned": false,
    "suspensionUntil": null
  },
  "nextStep": "L'entreprise peut maintenant demander un remboursement via /api/bookings/:id/refund"
}
```

### Response Success - Contesté (200)

```json
{
  "success": true,
  "message": "No-show contesté. Une investigation manuelle est nécessaire.",
  "booking": {
    "id": "booking123",
    "status": "ASSIGNED",
    "driverNotes": "NO_SHOW_CONTESTED: [2026-01-10T11:00:00.000Z] Par DRIVER driver@example.com\nCommentaire: Le chauffeur a fourni des preuves...",
    ...
  },
  "nextStep": "Un administrateur doit enquêter et trancher manuellement."
}
```

### Sanctions automatiques

| Strike Count | Sanction | Effet |
|--------------|----------|-------|
| 1 | Avertissement | Aucune suspension |
| 2 | Suspension 7 jours | `isAvailable = false`, `suspensionUntil = now + 7 days` |
| 3+ | Ban permanent | `isBanned = true`, `isAvailable = false` |

**Note** : Les champs `strikeCount`, `isBanned`, `suspensionUntil` n'existent pas dans le schema. Ils sont trackés temporairement dans `DriverProfile.bio` avec le format :
```
[SANCTION] STRIKE_COUNT:2 | LAST_STRIKE:2026-01-10T11:00:00.000Z | SUSPENDED_UNTIL:2026-01-17T11:00:00.000Z
```

### Response Errors

**400 - No report found**
```json
{
  "error": "Aucun no-show n'a été signalé pour cette mission"
}
```

**400 - Already processed**
```json
{
  "error": "Ce no-show a déjà été traité"
}
```

**403 - Unauthorized (Driver)**
```json
{
  "error": "Vous n'êtes pas autorisé à traiter ce no-show"
}
```

### Test Postman

```javascript
// Test 2: Confirm no-show (1st strike)
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Sanction applied correctly", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.sanction.strikeCount).to.equal(1);
    pm.expect(jsonData.sanction.isBanned).to.be.false;
    pm.expect(jsonData.booking.status).to.equal("CANCELLED");
});

// Test 3: Confirm no-show (2nd strike - suspension)
pm.test("Suspension applied on 2nd strike", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.sanction.strikeCount).to.equal(2);
    pm.expect(jsonData.sanction.suspensionUntil).to.not.be.null;
});
```

---

## 3. PATCH /api/bookings/:id/refund

### Description
Initie un remboursement Stripe pour l'entreprise suite à un no-show confirmé.

### Authentification
- **Rôles requis** : `ADMIN` ou `COMPANY`
- **Autorisation** :
  - Admin : accès à tous les bookings
  - Company : uniquement ses propres bookings (companyId)

### Conditions préalables
- Présence de marqueur "NO_SHOW_CONFIRMED:" dans companyNotes
- `stripePaymentId` existe et non null
- `stripePaymentStatus = "succeeded"`
- Pas encore de marqueur "REFUND_INITIATED:"

### Request

**Endpoint** : `PATCH /api/bookings/{bookingId}/refund`

**Headers** :
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Body** (optionnel) :
```json
{
  "reason": "requested_by_customer",
  "comment": "Remboursement suite au no-show confirmé du chauffeur."
}
```

**Validation** :
- `reason` : enum `["duplicate", "fraudulent", "requested_by_customer"]`, optionnel (default: "requested_by_customer")
- `comment` : string, optionnel

### Response Success (200)

```json
{
  "success": true,
  "message": "Remboursement initié avec succès. Le montant sera crédité sous 5-10 jours.",
  "booking": {
    "id": "booking123",
    "status": "CANCELLED",
    "stripePaymentStatus": "succeeded",
    "companyNotes": "NO_SHOW_CONFIRMED: [...]\n\nREFUND_INITIATED: [2026-01-10T11:30:00.000Z] Par COMPANY company@example.com\nStripe Refund ID: re_1ABC123\nMontant: 150.00€\nStatut: pending",
    ...
  },
  "refund": {
    "id": "re_1ABC123",
    "amount": 15000,
    "currency": "eur",
    "status": "pending",
    "reason": "requested_by_customer"
  },
  "nextStep": "Le webhook Stripe confirmera le remboursement une fois traité."
}
```

### Webhook Stripe - Refund confirmation

Une fois le remboursement traité par Stripe, le webhook `/api/stripe/webhook` recevra l'événement `refund.updated` avec status `succeeded` :

```json
{
  "type": "refund.updated",
  "data": {
    "object": {
      "id": "re_1ABC123",
      "payment_intent": "pi_1XYZ789",
      "status": "succeeded",
      "amount": 15000
    }
  }
}
```

Le webhook mettra à jour automatiquement :
- `booking.stripePaymentStatus = "refunded"`
- `booking.companyNotes` avec log du webhook
- `booking.status = "CANCELLED"` (si pas déjà)
- `job.status = "CANCELLED"` (si pas déjà)

### Response Errors

**400 - No confirmation**
```json
{
  "error": "Le remboursement n'est possible que si le no-show a été confirmé"
}
```

**400 - No payment**
```json
{
  "error": "Aucun paiement n'a été effectué pour cette mission"
}
```

**400 - Payment not succeeded**
```json
{
  "error": "Le paiement n'a pas été effectué avec succès",
  "currentStatus": "payment_pending"
}
```

**400 - Already refunded**
```json
{
  "error": "Le remboursement a déjà été initié pour cette mission"
}
```

**400 - Stripe error**
```json
{
  "error": "Erreur Stripe",
  "details": "Charge already refunded.",
  "type": "StripeInvalidRequestError"
}
```

### Test Postman

```javascript
// Test 4: Initiate refund
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Refund created successfully", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.refund.id).to.match(/^re_/);
    pm.expect(jsonData.refund.amount).to.be.above(0);
    pm.expect(jsonData.booking.companyNotes).to.include("REFUND_INITIATED:");
});

// Save refund ID for webhook testing
pm.environment.set("refundId", pm.response.json().refund.id);
```

---

## 4. Webhook Stripe - POST /api/stripe/webhook

### Événements gérés

Le webhook existant a été enrichi pour gérer :

1. **refund.created** : Remboursement créé
2. **refund.updated** : Remboursement mis à jour (ex: status passe à "succeeded")
3. **charge.refunded** : Charge remboursée (legacy)

### Test webhook local

Pour tester le webhook en local, utilisez Stripe CLI :

```bash
# 1. Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Forward events vers localhost
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# 4. Trigger refund event (dans un autre terminal)
stripe trigger refund.succeeded
```

---

## Scénarios de test complets

### Scénario 1 : No-show confirmé → Refund réussi (1er strike)

```bash
# 1. Company signale no-show
POST /api/bookings/booking123/report-no-show
{
  "comment": "Chauffeur absent, aucune réponse téléphone.",
  "evidence": "https://storage.example.com/proof.jpg"
}
# → Status 200, companyNotes contient "NO_SHOW_REPORTED:"

# 2. Admin confirme no-show
PATCH /api/bookings/booking123/confirm-no-show
{
  "confirmed": true,
  "adminComment": "No-show confirmé après investigation."
}
# → Status 200, booking.status = CANCELLED, strikeCount = 1

# 3. Company demande refund
PATCH /api/bookings/booking123/refund
{
  "reason": "requested_by_customer",
  "comment": "Remboursement suite no-show."
}
# → Status 200, refund.id = "re_1ABC123", refund.status = "pending"

# 4. Webhook Stripe confirme refund
# (Automatique via Stripe CLI ou production webhook)
# → booking.stripePaymentStatus = "refunded"
```

### Scénario 2 : No-show contesté → Investigation manuelle

```bash
# 1. Company signale no-show
POST /api/bookings/booking456/report-no-show
{
  "comment": "Chauffeur n'est pas venu à 9h."
}
# → Status 200

# 2. Driver conteste
PATCH /api/bookings/booking456/confirm-no-show
{
  "confirmed": false,
  "adminComment": "J'ai eu un accident de voiture, j'ai appelé l'entreprise mais pas de réponse."
}
# → Status 200, driverNotes contient "NO_SHOW_CONTESTED:", status reste ASSIGNED

# 3. Admin enquête manuellement
# (Pas d'API automatique, investigation hors système)
```

### Scénario 3 : 3 no-shows → Ban permanent

```bash
# Booking 1 : 1er strike
PATCH /api/bookings/booking1/confirm-no-show {"confirmed": true}
# → strikeCount = 1, avertissement

# Booking 2 : 2ème strike
PATCH /api/bookings/booking2/confirm-no-show {"confirmed": true}
# → strikeCount = 2, suspension 7 jours, isAvailable = false

# Booking 3 : 3ème strike
PATCH /api/bookings/booking3/confirm-no-show {"confirmed": true}
# → strikeCount = 3, isBanned = true, isAvailable = false, ban permanent
```

---

## Collection Postman

```json
{
  "info": {
    "name": "No-Show Management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Report No-Show",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{companyToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"comment\": \"Le chauffeur ne s'est pas présenté au rendez-vous. Aucune réponse après 3 appels.\",\n  \"evidence\": \"https://example.com/proof.jpg\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/bookings/{{bookingId}}/report-no-show",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings", "{{bookingId}}", "report-no-show"]
        }
      }
    },
    {
      "name": "2. Confirm No-Show",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"confirmed\": true,\n  \"adminComment\": \"No-show confirmé après vérification.\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/bookings/{{bookingId}}/confirm-no-show",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings", "{{bookingId}}", "confirm-no-show"]
        }
      }
    },
    {
      "name": "3. Request Refund",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{companyToken}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"reason\": \"requested_by_customer\",\n  \"comment\": \"Remboursement suite au no-show confirmé.\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/bookings/{{bookingId}}/refund",
          "host": ["{{baseUrl}}"],
          "path": ["api", "bookings", "{{bookingId}}", "refund"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "bookingId",
      "value": "clxxxxx"
    },
    {
      "key": "companyToken",
      "value": "your_company_jwt_token"
    },
    {
      "key": "adminToken",
      "value": "your_admin_jwt_token"
    }
  ]
}
```

---

## Logs et debugging

Tous les endpoints loggent les événements importants dans la console :

```bash
# Report no-show
[NO-SHOW] Notification à envoyer au chauffeur driver@example.com { bookingId: '...', driverName: 'John', ... }

# Confirm no-show
[NO-SHOW CONFIRMED] Sanction appliquée au chauffeur driver@example.com { strikeCount: 2, sanction: 'SUSPENSION 7 JOURS', ... }

# Contested
[NO-SHOW CONTESTED] Le chauffeur driver@example.com conteste le no-show { bookingId: '...', ... }

# Refund
[REFUND INITIATED] Remboursement initié pour booking booking123 { amount: 15000, refundId: 're_1ABC123', ... }

# Webhook
[Webhook] Refund succeeded for booking booking123 - Amount: 150.00€
```

---

## Limitations et notes

1. **Schema Prisma non modifié** : Les champs `strikeCount`, `isBanned`, `suspensionUntil`, `lastStrikeAt` n'existent pas dans `DriverProfile`. Ils sont trackés temporairement dans le champ `bio`. Une migration schema est recommandée pour production.

2. **Statuts JobStatus limités** : Pas de statuts `NO_SHOW_REPORTED`, `NO_SHOW_CONFIRMED`, `REFUNDED` dans l'enum `JobStatus`. On utilise des marqueurs dans les notes textuelles.

3. **Notifications non implémentées** : Les TODOs pour envoyer des emails/notifications aux chauffeurs et entreprises sont présents mais non implémentés. Utiliser un service comme SendGrid ou Resend.

4. **Stripe Connect** : Si le paiement a déjà été transféré au chauffeur via Stripe Connect, le remboursement échouera. Implémenter une logique de "reverse transfer" si nécessaire.

5. **Tests unitaires** : Aucun test Jest n'a été créé. À ajouter dans `__tests__/` pour chaque endpoint.

---

## Next steps

1. **Migration Prisma** : Ajouter les champs de sanction au modèle `DriverProfile` :
   ```prisma
   model DriverProfile {
     // ...
     strikeCount     Int       @default(0)
     lastStrikeAt    DateTime?
     isBanned        Boolean   @default(false)
     suspensionUntil DateTime?
   }
   ```

2. **Notifications** : Implémenter l'envoi d'emails via un service SMTP ou API

3. **Dashboard Admin** : UI pour visualiser les no-shows, contester/valider manuellement

4. **Analytics** : Tracker les statistiques de no-show par chauffeur, région, etc.

5. **Appels d'offres** : Permettre à un chauffeur de contester avant la confirmation admin

---

## Support

Pour toute question ou bug, consulter les logs dans la console serveur ou contacter l'équipe technique.
