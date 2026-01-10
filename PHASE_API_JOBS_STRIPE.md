# Phase API_JOBS : Adaptation Stripe pour Paiements de Missions

## Résumé

Cette phase adapte l'intégration Stripe existante pour gérer les paiements des missions de livraison journalières de transport. Les modifications permettent aux entreprises (Companies) de payer les chauffeurs (Drivers) de manière sécurisée après la livraison des missions.

## Objectifs Atteints

- ✅ Analyse de l'intégration Stripe existante
- ✅ Création de routes API pour PaymentIntents
- ✅ Adaptation du webhook pour gérer les paiements de missions
- ✅ Gestion des cas : journée, demi-journée, semaine
- ✅ Système de remboursement pour annulations
- ✅ Sécurisation des paiements et vérification des statuts

## Fichiers Modifiés

### 1. Routes API Stripe

#### `/src/app/api/stripe/checkout/route.ts`
**Modifications :**
- Ajout de vérification que la mission est livrée (status: DELIVERED)
- Prévention des double-paiements
- Support des types de mission (DAY, HALF_DAY, WEEK)
- Métadonnées enrichies (missionType, companyId)
- URLs de succès/annulation améliorées avec bookingId

**Champs en entrée :**
```json
{
  "bookingId": "string"
}
```

**Champs en sortie :**
```json
{
  "url": "string (URL Stripe Checkout)"
}
```

---

#### `/src/app/api/stripe/payment-intent/route.ts` (NOUVEAU)
**Description :**
Route pour créer un PaymentIntent directement (alternative à Checkout Session).

**Méthodes :**
- **POST** : Crée un PaymentIntent pour une mission livrée
- **GET** : Récupère le statut d'un PaymentIntent existant

**POST - Champs en entrée :**
```json
{
  "bookingId": "string"
}
```

**POST - Champs en sortie :**
```json
{
  "clientSecret": "string",
  "paymentIntentId": "string"
}
```

**GET - Query params :**
- `bookingId` (required)

**GET - Champs en sortie :**
```json
{
  "status": "string",
  "amount": "number (centimes)",
  "currency": "string",
  "created": "number (timestamp)",
  "paidAt": "Date | null"
}
```

---

#### `/src/app/api/stripe/webhook/route.ts`
**Modifications :**
- Gestion de `checkout.session.completed` : marque la mission COMPLETED
- Gestion de `payment_intent.succeeded` : marque la mission COMPLETED
- Gestion de `payment_intent.payment_failed` : marque le paiement échoué
- Gestion de `charge.refunded` : annule la mission et marque comme remboursé
- Mise à jour automatique du statut du Job et du Booking
- Incrémentation du compteur `totalDeliveries` du Driver
- Logging amélioré pour tous les événements

**Événements gérés :**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`

---

#### `/src/app/api/stripe/refund/route.ts` (NOUVEAU)
**Description :**
Route pour gérer les remboursements en cas d'annulation de mission.

**Méthodes :**
- **POST** : Crée un remboursement
- **GET** : Récupère les informations de remboursement

**POST - Champs en entrée :**
```json
{
  "bookingId": "string",
  "reason": "duplicate | fraudulent | requested_by_customer (optional)"
}
```

**POST - Champs en sortie :**
```json
{
  "success": "boolean",
  "refundId": "string",
  "amount": "number (centimes)",
  "status": "string",
  "message": "string"
}
```

**GET - Query params :**
- `bookingId` (required)

**GET - Champs en sortie :**
```json
{
  "refunded": "boolean",
  "refunds": [
    {
      "id": "string",
      "amount": "number",
      "currency": "string",
      "status": "string",
      "reason": "string | null",
      "created": "number"
    }
  ]
}
```

---

### 2. Bibliothèques et Utilitaires

#### `/src/lib/stripe.ts`
**Ajouts :**
- `createMissionPaymentIntent()` : Crée un PaymentIntent pour une mission
- `createRefund()` : Crée un remboursement
- `getPaymentIntentStatus()` : Récupère le statut d'un paiement
- `transferToDriver()` : Transfère des fonds au compte Stripe Connect du driver
- Documentation JSDoc pour toutes les fonctions

---

#### `/src/lib/types/stripe.ts` (NOUVEAU)
**Description :**
Types TypeScript pour l'intégration Stripe.

**Exports principaux :**
- Types : `StripePaymentStatus`, `StripeRefundReason`, `MissionPaymentMetadata`
- Interfaces : `PaymentIntentResponse`, `RefundResponse`, `PaymentStatusResponse`
- Fonctions utilitaires :
  - `calculateMissionPrice()` : Calcule le prix selon le type de mission
  - `formatPrice()` : Formate un montant en euros
  - `eurosToCents()` / `centsToEuros()` : Conversions
  - `isPaymentCompleted()` : Vérifie si un paiement est complété
  - `canRefundPayment()` : Vérifie si un paiement peut être remboursé
- Labels : `MISSION_TYPE_LABELS`, `PAYMENT_STATUS_LABELS`, `REFUND_REASON_LABELS`

---

### 3. Documentation

#### `/STRIPE_INTEGRATION.md` (NOUVEAU)
Documentation complète de l'intégration Stripe :
- Vue d'ensemble et architecture
- Flux de paiement détaillé
- Documentation de toutes les routes API
- Configuration des webhooks
- Gestion des types de mission et tarification
- Sécurité et authentification
- Stripe Connect pour les chauffeurs
- Fonctions utilitaires
- Gestion des erreurs
- Guide de tests

---

## Flux de Paiement Complet

### 1. Création de Mission
```typescript
// Company crée une mission
POST /api/jobs
{
  "title": "Livraison Paris 11e",
  "typeMission": "DAY",
  "dayRate": 15000, // 150€ en centimes
  // ...
}
```

### 2. Candidature du Chauffeur
```typescript
// Driver postule
POST /api/jobs/{jobId}/apply
{
  "proposedPrice": 15000, // Optionnel, sinon = dayRate
  "message": "Je suis disponible"
}
```

### 3. Livraison
```typescript
// Driver marque comme livré
PATCH /api/bookings/{bookingId}
{
  "status": "DELIVERED",
  "deliveredAt": "2026-01-09T18:00:00Z"
}
```

### 4a. Paiement via Checkout (Option 1)
```typescript
// Company initie le paiement
POST /api/stripe/checkout
{
  "bookingId": "booking_123"
}

// Réponse : URL vers Stripe Checkout
// Redirection de l'utilisateur vers Stripe
```

### 4b. Paiement via PaymentIntent (Option 2)
```typescript
// Company crée un PaymentIntent
POST /api/stripe/payment-intent
{
  "bookingId": "booking_123"
}

// Réponse : clientSecret pour Stripe Elements
// Confirmation côté frontend avec Stripe.js
```

### 5. Confirmation Webhook
```typescript
// Stripe envoie checkout.session.completed ou payment_intent.succeeded
// Webhook met à jour automatiquement :
// - booking.status → COMPLETED
// - booking.stripePaymentStatus → succeeded
// - booking.paidAt → now()
// - job.status → COMPLETED
// - driver.totalDeliveries += 1
```

### 6. Vérification du Paiement
```typescript
// Récupérer le statut
GET /api/stripe/payment-intent?bookingId=booking_123

// Réponse :
{
  "status": "succeeded",
  "amount": 15000,
  "currency": "eur",
  "paidAt": "2026-01-09T18:30:00.000Z"
}
```

---

## Cas d'Usage : Remboursement

### 1. Annulation de Mission
```typescript
// Company annule et demande un remboursement
POST /api/stripe/refund
{
  "bookingId": "booking_123",
  "reason": "requested_by_customer"
}

// Réponse :
{
  "success": true,
  "refundId": "re_xxx",
  "amount": 15000,
  "status": "succeeded"
}
```

### 2. Mise à Jour Automatique
```typescript
// Webhook reçoit charge.refunded
// Mise à jour automatique :
// - booking.status → CANCELLED
// - booking.stripePaymentStatus → refunded
// - job.status → CANCELLED
```

---

## Gestion des Types de Mission

### Calcul Automatique du Prix

| Type Mission | Calcul | Exemple (dayRate = 150€) |
|--------------|--------|--------------------------|
| `DAY` | dayRate | 150€ |
| `HALF_DAY` | dayRate / 2 | 75€ |
| `WEEK` | dayRate * 5 | 750€ |

**Note :** Le calcul est fait côté frontend lors de la création/candidature. Le champ `agreedPrice` contient toujours le montant final.

---

## Sécurité

### Authentification et Autorisation
- ✅ Vérification de la session NextAuth sur toutes les routes
- ✅ Vérification du rôle (Company uniquement pour paiements)
- ✅ Vérification de propriété (Company = owner du Job)
- ✅ Vérification de propriété (Driver = candidat du Booking)

### Validation des Données
- ✅ Schémas Zod pour toutes les routes
- ✅ Validation des statuts de mission avant paiement
- ✅ Prévention des double-paiements
- ✅ Vérification des montants

### Webhook Security
- ✅ Vérification de la signature Stripe
- ✅ Validation du secret webhook
- ✅ Gestion des erreurs et logging

---

## Variables d'Environnement Requises

```env
# Clés Stripe (obligatoires)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de l'application (obligatoire)
NEXT_PUBLIC_APP_URL=https://votredomaine.com
```

---

## Tests

### Configuration des Tests

1. **Stripe CLI pour webhook local :**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

2. **Cartes de test Stripe :**
- `4242 4242 4242 4242` : Paiement réussi
- `4000 0000 0000 0002` : Carte refusée
- `4000 0000 0000 9995` : Fonds insuffisants

### Workflow de Test

1. Créer une mission (Company)
2. Postuler à la mission (Driver)
3. Marquer comme livré (Driver)
4. Initier le paiement (Company)
5. Confirmer le paiement (Stripe)
6. Vérifier status = COMPLETED
7. Tester le remboursement (Company)

---

## Limitations et Améliorations Futures

### Limitations Actuelles
- Les transferts vers Stripe Connect ne sont pas automatiques
- Pas de système de paiements fractionnés (acompte + solde)
- Pas de gestion des litiges (disputes/chargebacks)
- Pas de notifications par email

### Améliorations Futures
- [ ] Transferts automatiques vers Stripe Connect après paiement
- [ ] Système de paiements fractionnés
- [ ] Gestion des litiges
- [ ] Tableau de bord de paiements
- [ ] Notifications email (paiement reçu, remboursement, etc.)
- [ ] Paiements récurrents pour missions hebdomadaires
- [ ] Facturation automatique
- [ ] Export des transactions comptables

---

## Support et Documentation

- **Documentation complète** : `/STRIPE_INTEGRATION.md`
- **Types TypeScript** : `/src/lib/types/stripe.ts`
- **Stripe Docs** : https://stripe.com/docs
- **Stripe Dashboard** : https://dashboard.stripe.com

---

## Résumé des Routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/stripe/checkout` | POST | Crée une session Stripe Checkout |
| `/api/stripe/payment-intent` | POST | Crée un PaymentIntent |
| `/api/stripe/payment-intent?bookingId=xxx` | GET | Récupère le statut d'un paiement |
| `/api/stripe/refund` | POST | Crée un remboursement |
| `/api/stripe/refund?bookingId=xxx` | GET | Récupère les infos de remboursement |
| `/api/stripe/webhook` | POST | Webhook Stripe (événements) |

---

## Conformité Prisma

Tous les champs utilisés sont conformes au schéma Prisma existant :

### Modèle `Job`
- `typeMission` : MissionType (DAY, HALF_DAY, WEEK)
- `dayRate` : Int (tarif en centimes)

### Modèle `Booking`
- `agreedPrice` : Int (prix convenu en centimes)
- `stripePaymentId` : String? (ID du PaymentIntent)
- `stripePaymentStatus` : String? (pending, succeeded, failed, refunded)
- `paidAt` : DateTime? (date de paiement)
- `status` : JobStatus (ASSIGNED, DELIVERED, COMPLETED, CANCELLED)

### Modèle `DriverProfile`
- `stripeAccountId` : String? (ID du compte Stripe Connect)
- `totalDeliveries` : Int (nombre de livraisons)

---

## Conclusion

L'intégration Stripe est maintenant complète et adaptée aux besoins spécifiques des missions de transport journalières. Le système gère de manière sécurisée :

- ✅ Paiements de missions (journée, demi-journée, semaine)
- ✅ Confirmation automatique via webhook
- ✅ Remboursements en cas d'annulation
- ✅ Vérification des statuts de paiement
- ✅ Authentification et autorisation strictes
- ✅ Types TypeScript pour une meilleure DX

Le code est prêt pour la production en mode test. Pour passer en production :
1. Remplacer les clés de test par les clés de production
2. Configurer le webhook en production
3. Activer Stripe Connect pour les chauffeurs
4. Implémenter les transferts automatiques
