# Intégration Stripe pour les Paiements de Missions

## Vue d'ensemble

L'intégration Stripe gère les paiements des missions de transport entre les entreprises (Companies) et les chauffeurs (Drivers). Le système utilise Stripe Checkout et PaymentIntents pour sécuriser les transactions.

## Architecture

### Flux de Paiement

1. **Création de mission** : L'entreprise crée une mission avec un `dayRate` (tarif journée)
2. **Candidature** : Le chauffeur postule avec un `agreedPrice` (optionnel, sinon = dayRate)
3. **Acceptation** : L'entreprise accepte le chauffeur (status: ASSIGNED)
4. **Livraison** : Le chauffeur effectue la livraison (status: DELIVERED)
5. **Paiement** : L'entreprise initie le paiement
6. **Confirmation** : Webhook Stripe confirme et marque la mission COMPLETED
7. **Payout** : Le chauffeur reçoit les fonds sur son compte Stripe Connect

### Statuts de Paiement

- `pending` : Paiement créé mais non confirmé
- `succeeded` : Paiement réussi
- `failed` : Paiement échoué
- `refunded` : Paiement remboursé (mission annulée)

## Routes API

### 1. POST /api/stripe/checkout
Crée une session Stripe Checkout pour payer une mission livrée.

**Requête :**
```json
{
  "bookingId": "booking_123"
}
```

**Réponse :**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Conditions :**
- Utilisateur doit être la Company propriétaire de la mission
- Mission doit avoir le status `DELIVERED`
- Mission ne doit pas déjà être payée

---

### 2. POST /api/stripe/payment-intent
Crée un PaymentIntent pour un paiement direct via Stripe Elements.

**Requête :**
```json
{
  "bookingId": "booking_123"
}
```

**Réponse :**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

**Utilisation :**
- Plus flexible que Checkout (UI personnalisable)
- Nécessite Stripe Elements côté frontend
- Même conditions que /checkout

---

### 3. GET /api/stripe/payment-intent?bookingId=xxx
Récupère le statut d'un paiement.

**Réponse :**
```json
{
  "status": "succeeded",
  "amount": 15000,
  "currency": "eur",
  "created": 1234567890,
  "paidAt": "2026-01-09T12:00:00.000Z"
}
```

---

### 4. POST /api/stripe/refund
Crée un remboursement pour une mission annulée.

**Requête :**
```json
{
  "bookingId": "booking_123",
  "reason": "requested_by_customer"
}
```

**Réponse :**
```json
{
  "success": true,
  "refundId": "re_xxx",
  "amount": 15000,
  "status": "succeeded",
  "message": "Remboursement effectué avec succès"
}
```

**Raisons possibles :**
- `duplicate` : Transaction en double
- `fraudulent` : Fraude détectée
- `requested_by_customer` : Demande client (défaut)

---

### 5. GET /api/stripe/refund?bookingId=xxx
Récupère les informations de remboursement.

**Réponse :**
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
Webhook Stripe pour gérer les événements de paiement.

**Événements gérés :**

#### `checkout.session.completed`
- Paiement via Checkout réussi
- Met à jour le booking : status → COMPLETED, stripePaymentStatus → succeeded
- Met à jour le job : status → COMPLETED
- Incrémente totalDeliveries du driver

#### `payment_intent.succeeded`
- Paiement via PaymentIntent réussi
- Même logique que checkout.session.completed

#### `payment_intent.payment_failed`
- Paiement échoué
- Met à jour stripePaymentStatus → failed

#### `charge.refunded`
- Remboursement effectué
- Met à jour booking : status → CANCELLED, stripePaymentStatus → refunded
- Met à jour job : status → CANCELLED

#### `account.updated`
- Compte Stripe Connect du driver vérifié
- Met à jour driverProfile.isVerified → true

**Configuration Webhook :**
```bash
# URL du webhook (à configurer dans Stripe Dashboard)
https://votredomaine.com/api/stripe/webhook

# Événements à écouter :
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
- account.updated
```

---

## Types de Mission et Tarification

### Mission Types

| Type | Description | Calcul du prix |
|------|-------------|----------------|
| `DAY` | Journée complète | `dayRate` |
| `HALF_DAY` | Demi-journée | `dayRate / 2` (côté frontend) |
| `WEEK` | Mission semaine | `dayRate * 5` (côté frontend) |

**Note :** Le calcul du prix final est fait côté frontend lors de la création de la mission. Le champ `agreedPrice` dans Booking contient toujours le montant final en centimes.

### Exemple de tarification

```typescript
// Mission journée
const booking = {
  agreedPrice: 15000, // 150€ (en centimes)
  job: {
    typeMission: "DAY",
    dayRate: 15000
  }
}

// Mission demi-journée
const booking = {
  agreedPrice: 7500, // 75€ (en centimes)
  job: {
    typeMission: "HALF_DAY",
    dayRate: 15000
  }
}

// Mission semaine
const booking = {
  agreedPrice: 75000, // 750€ (5 jours à 150€)
  job: {
    typeMission: "WEEK",
    dayRate: 15000
  }
}
```

---

## Sécurité

### Authentification
- Toutes les routes nécessitent une session NextAuth valide
- Vérification des rôles (Company vs Driver)
- Vérification de propriété des ressources

### Validation
- Schémas Zod pour valider les payloads
- Vérification des statuts de mission avant paiement
- Prévention des double-paiements

### Webhook Security
- Vérification de la signature Stripe
- Validation du secret webhook
- Logging des événements

---

## Variables d'Environnement

```env
# Clés Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de l'application
NEXT_PUBLIC_APP_URL=https://votredomaine.com
```

---

## Stripe Connect pour les Chauffeurs

### Configuration du compte driver

```typescript
import { createConnectAccount, createAccountLink } from '@/lib/stripe'

// 1. Créer un compte Stripe Connect
const account = await createConnectAccount(driver.user.email)

// 2. Sauvegarder l'ID du compte
await db.driverProfile.update({
  where: { id: driver.id },
  data: { stripeAccountId: account.id }
})

// 3. Créer un lien d'onboarding
const accountLink = await createAccountLink(
  account.id,
  'https://votredomaine.com/onboarding/refresh',
  'https://votredomaine.com/onboarding/return'
)

// 4. Rediriger le driver vers le lien d'onboarding
redirect(accountLink.url)
```

### Transfert des fonds

Une fois le paiement confirmé, les fonds peuvent être transférés au driver :

```typescript
import { transferToDriver } from '@/lib/stripe'

await transferToDriver(
  booking.agreedPrice, // Montant en centimes
  driver.stripeAccountId, // ID du compte Stripe Connect
  {
    bookingId: booking.id,
    jobId: booking.jobId,
    driverId: driver.id
  }
)
```

---

## Fonctions Utilitaires

### `/src/lib/stripe.ts`

```typescript
// Créer un PaymentIntent
createMissionPaymentIntent(bookingId, jobId, driverId, companyId, agreedPrice, missionType, description)

// Créer un remboursement
createRefund(paymentIntentId, metadata, reason)

// Récupérer le statut d'un paiement
getPaymentIntentStatus(paymentIntentId)

// Créer un compte Stripe Connect
createConnectAccount(email)

// Créer un lien d'onboarding
createAccountLink(accountId, refreshUrl, returnUrl)

// Transférer des fonds au driver
transferToDriver(amount, destinationAccountId, metadata)
```

---

## Gestion des Erreurs

### Erreurs Stripe courantes

| Code | Description | Action |
|------|-------------|--------|
| `card_declined` | Carte refusée | Demander un autre moyen de paiement |
| `insufficient_funds` | Fonds insuffisants | Demander un autre moyen de paiement |
| `expired_card` | Carte expirée | Demander de mettre à jour la carte |
| `processing_error` | Erreur de traitement | Réessayer plus tard |

### Logging

Tous les événements Stripe sont loggés avec le préfixe `[Webhook]` :

```typescript
console.log(`[Webhook] Payment succeeded for booking ${bookingId}`)
console.error(`[Webhook] Payment failed for booking ${bookingId}`)
```

---

## Tests

### Test en mode sandbox

1. Utiliser les clés de test Stripe (`sk_test_...` et `pk_test_...`)
2. Utiliser les cartes de test Stripe :
   - `4242 4242 4242 4242` : Paiement réussi
   - `4000 0000 0000 0002` : Carte refusée
   - `4000 0000 0000 9995` : Fonds insuffisants

3. Tester les webhooks localement avec Stripe CLI :
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Workflow de test complet

1. Créer une mission (Company)
2. Postuler à la mission (Driver)
3. Accepter le chauffeur (Company)
4. Marquer comme livré (Driver)
5. Initier le paiement (Company)
6. Confirmer le paiement (Stripe)
7. Vérifier le statut COMPLETED

---

## TODO / Améliorations futures

- [ ] Implémenter les transferts automatiques vers Stripe Connect
- [ ] Ajouter un système de paiements fractionnés (acompte + solde)
- [ ] Gérer les litiges (disputes/chargebacks)
- [ ] Implémenter un tableau de bord de paiements
- [ ] Ajouter des notifications par email lors des paiements
- [ ] Gérer les paiements récurrents pour les missions hebdomadaires
- [ ] Ajouter un système de facturation automatique

---

## Support

Pour toute question sur l'intégration Stripe :
- Documentation Stripe : https://stripe.com/docs
- Stripe Dashboard : https://dashboard.stripe.com
- Support Stripe : https://support.stripe.com
